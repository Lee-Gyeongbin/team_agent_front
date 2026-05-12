import { useAuth } from '~/composables/com/useAuth'
import {
  EMPTY_CHAT_ROOM,
  type ChatRoom,
  type ChatLogListRow,
  type SubOption,
  type ModelOption,
  type ChatMessage,
  type KnowledgeItem,
} from '~/types/chat'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import { parseLunchPayloadFromPrompt } from '~/utils/chat/lunchAgentUtil'

/** 목록에 동일 방이 문자열/숫자 등 다른 형태로 중복되면 사이드바에서 활성 행이 여러 개로 보일 수 있어 통일·중복 제거 */
function dedupeChatRoomsByNormalizedId(list: ChatRoom[]): ChatRoom[] {
  const seen = new Set<string>()
  const out: ChatRoom[] = []
  for (const raw of list) {
    const id = normalizeChatRoomId(raw.roomId)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push({ ...raw, roomId: id })
  }
  return out
}
const { user } = useAuth()
const {
  fetchSelectChatRoomList,
  fetchCreateChatRoom,
  fetchSelectModelList,
  fetchSelectRagDsList,
  fetchSelectDmList,
  fetchPinChatRoom,
  fetchRenameChatRoom,
  fetchDeleteChatRoom,
  fetchSelectSharedChatLogList,
  fetchCopySharedChatLogsToRoom,
  fetchSelectKnowledgeList,
} = useChatApi()
const {
  resolveSvcTy,
  activeSearchModes,
  selectedChatAgentId,
  subOptions,
  selectedSubOptions,
  buildRefIdForPayload,
  modelOptions,
  selectedModelOption,
  isSearchModeMissingSubOptions,
  searchModeSubOptionsEmptyMessage,
} = useChatSearchState()
const { logRowToMessages } = useChatMessages()
const { stopChatSocket } = useChatSocket()
const { executeSendPipeline } = useChatSendPipeline()

// 채팅방 관련
const chatRoom = ref<ChatRoom>({ ...EMPTY_CHAT_ROOM })
const chatRoomList = ref<ChatRoom[]>([])
const chatMessage = ref('')
const sharedMessages = ref<ChatMessage[]>([])
/** 공유 페이지에서 조회된 원본 로그 행(대화 이어가기 시 svcTy·시드 질문 등 판별용) */
const sharedChatLogRows = ref<ChatLogListRow[]>([])
const shareTxt = ref('공유된 대화입니다.')
const isExpired = ref(false)
const knowledgeList = ref<KnowledgeItem[]>([])

export const useChatRooms = () => {
  const route = useRoute()

  // 채팅방 초기화 (roomId 등 리셋, 검색모드 디폴트 C)
  const resetChatRoom = () => {
    chatRoom.value = { ...EMPTY_CHAT_ROOM }
    activeSearchModes.value = []
    selectedChatAgentId.value = null
  }

  // 채팅방 roomId 동기화 (/chat/[id] 진입 시 사용)
  const handleSetChatRoom = (roomId: string) => {
    chatRoom.value.roomId = normalizeChatRoomId(roomId)
  }

  // 마지막 로그 기준 검색모드·서브옵션 동기화: C=디폴트([]), M=지식검색, S=데이터분석
  const syncSearchModeFromLastLog = async (lastRow: ChatLogListRow | undefined) => {
    const svcTy = lastRow?.svcTy ?? 'C'
    const lastAgentId = typeof lastRow?.agentId === 'string' ? lastRow.agentId.trim() : ''
    const isLunchPromptLog = !!parseLunchPayloadFromPrompt(String(lastRow?.qcontent ?? ''))
    if (svcTy === 'M') {
      activeSearchModes.value = ['M']
      selectedChatAgentId.value = lastAgentId || null
      // 지식검색 시 라그 데이터셋 조회
      await selectRagDsList()
      await selectModelOptions()
    } else if (svcTy === 'S') {
      // 통계 질의 시 데이터마트 조회
      activeSearchModes.value = ['S']
      selectedChatAgentId.value = lastAgentId || null
      await selectDmList()
      await selectModelOptions()
    } else {
      activeSearchModes.value = []
      selectedChatAgentId.value = isLunchPromptLog ? null : lastAgentId || null
      // 일반 질의 시 모델 옵션 조회
      await selectModelOptions()
    }
    const lastRefId = lastRow?.refId
    if (typeof lastRefId === 'string' && lastRefId.trim()) {
      const trimmed = lastRefId.trim()
      const candidateIds = trimmed.includes(',')
        ? trimmed
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [trimmed]
      const valid = candidateIds.filter((id) => subOptions.value.some((o) => String(o.value) === id))
      if (valid.length) {
        selectedSubOptions.value = valid
      }
    }
  }
  // 채팅방 목록 조회
  const selectChatRoomList = async (options?: { skipLoading?: boolean }) => {
    try {
      const userId = user.value?.userId
      if (!userId) return []
      const skipLoading = options?.skipLoading === true
      if (!skipLoading) {
        openLoading({ text: '채팅방 목록을 불러오는 중...' })
      }
      let res: { list: ChatRoom[] }
      try {
        res = await fetchSelectChatRoomList(userId)
      } finally {
        if (!skipLoading) {
          closeLoading()
        }
      }
      chatRoomList.value = dedupeChatRoomsByNormalizedId(res.list ?? [])
      return chatRoomList.value
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
      return []
    }
  }

  // 채팅방 생성 (content: 호출부에서 전달 가능, 미전달 시 chatMessage 사용)
  const createChatRoom = async (content?: string, files: File[] = []): Promise<boolean> => {
    const qContent = (content ?? chatMessage.value).trim()
    if (!qContent) {
      chatRoom.value = { ...EMPTY_CHAT_ROOM, qContent: '' }
      return false
    }

    if (isSearchModeMissingSubOptions.value) {
      openToast({ message: searchModeSubOptionsEmptyMessage.value, type: 'warning' })
      return false
    }

    const svcTy = resolveSvcTy()
    openLoading({ text: '채팅방을 생성하는 중...' })
    let res: { data: ChatRoom }
    try {
      res = await fetchCreateChatRoom(qContent, svcTy)
    } finally {
      closeLoading()
    }
    const newRoomId = normalizeChatRoomId(res.data.roomId)
    const createdRoom: ChatRoom = {
      roomId: newRoomId,
      title: res.data.roomTitle,
      qContent,
      createdAt: res.data.createdAt,
      svcTy,
      roomTitle: res.data.roomTitle,
      fixYn: 'N',
    }
    chatRoom.value = createdRoom
    // 고정 검색기록 위에 새 방이 오지 않도록: 고정 목록 아래(비고정 구역 선두)에 삽입
    const prev = chatRoomList.value.filter((room) => normalizeChatRoomId(room.roomId) !== newRoomId)
    const pinned = prev.filter((room) => room.fixYn === 'Y')
    const unpinned = prev.filter((room) => room.fixYn !== 'Y')
    chatRoomList.value = dedupeChatRoomsByNormalizedId([...pinned, createdRoom, ...unpinned])

    const sent = await executeSendPipeline({
      content: qContent,
      roomId: createdRoom.roomId,
      svcTy,
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: selectedChatAgentId.value ?? '',
      files,
      clearMessagesBefore: true,
    })
    if (!sent) return false

    chatMessage.value = ''
    navigateTo(`/chat/${chatRoom.value.roomId}`)
    return true
  }

  // 모델 옵션 조회
  const selectModelOptions = async () => {
    openLoading({ text: '모델 옵션을 불러오는 중...' })
    let res: { modelList: ModelOption[] }
    try {
      res = await fetchSelectModelList()
    } finally {
      closeLoading()
    }
    modelOptions.value = res.modelList.map((item: ModelOption) => ({ label: item.label, value: item.value }))
    selectedModelOption.value = modelOptions.value[0]?.value ?? ''
    return modelOptions.value
  }
  // 라그 데이터셋 조회
  const selectRagDsList = async () => {
    openLoading({ text: '지식 검색 옵션을 불러오는 중...' })
    let res: { subOptionList?: SubOption[] }
    try {
      res = await fetchSelectRagDsList(selectedChatAgentId.value ?? '')
    } finally {
      closeLoading()
    }
    subOptions.value = (res.subOptionList ?? []).map((item: SubOption) => ({ label: item.label, value: item.value }))
    const firstRag = subOptions.value[0]?.value ?? 'all'
    selectedSubOptions.value = [String(firstRag)]
    return subOptions.value
  }

  // 데이터마트 데이터셋 조회
  const selectDmList = async () => {
    openLoading({ text: '데이터마트 옵션을 불러오는 중...' })
    let res: { subOptionList?: SubOption[] }
    try {
      res = await fetchSelectDmList(selectedChatAgentId.value ?? '', String(chatRoom.value.roomId ?? ''))
    } finally {
      closeLoading()
    }
    subOptions.value = (res.subOptionList ?? []).map((item: SubOption) => ({ label: item.label, value: item.value }))
    const first = subOptions.value[0]?.value ?? 'all'
    selectedSubOptions.value = [String(first)]
    return subOptions.value
  }

  /** 채팅방 고정 */
  const handlePinChatRoom = async (room: ChatRoom) => {
    try {
      openLoading({ text: '채팅방 고정 상태를 변경하는 중...' })
      try {
        await fetchPinChatRoom(room)
      } finally {
        closeLoading()
      }
      let msg = ''
      if (room.fixYn === 'Y') {
        msg = '채팅방 고정이 해제되었습니다.'
      } else {
        msg = '채팅방이 고정되었습니다.'
      }
      openToast({ message: msg, type: 'success' })
      selectChatRoomList()
    } catch {
      openToast({ message: '채팅방 고정에 실패했습니다.', type: 'error' })
    }
  }

  /** 채팅방 이름 변경 */
  const handleRenameChatRoom = async (room: ChatRoom, roomTitle: string) => {
    try {
      openLoading({ text: '채팅방 이름을 변경하는 중...' })
      try {
        await fetchRenameChatRoom(room.roomId, roomTitle)
      } finally {
        closeLoading()
      }
      openToast({ message: '검색기록 타이틀이 변경되었습니다.', type: 'success' })
      await selectChatRoomList()
    } catch {
      openToast({ message: '검색기록 타이틀 변경에 실패했습니다.', type: 'error' })
    }
  }

  /** 검색기록 삭제 */
  const handleDeleteChatRoom = async (room: ChatRoom) => {
    openConfirm({
      title: '검색기록 삭제',
      message: '검색기록을 삭제하시겠습니까?',
      onConfirm: async () => {
        openLoading({ text: '검색기록을 삭제하는 중...' })
        try {
          await fetchDeleteChatRoom(room.roomId)
        } finally {
          closeLoading()
        }

        openToast({ message: '검색기록이 삭제되었습니다.', type: 'success' })
        await selectChatRoomList()

        // 현재 보고 있는 채팅방이 삭제되면 /chat(index)로 이동
        const currentRoomId = String(route.params.id ?? '').trim()
        if (currentRoomId && currentRoomId === String(room.roomId ?? '').trim()) {
          stopChatSocket()
          await navigateTo('/chat')
        }
      },
    })
  }

  /** 공유 대화 로드 */
  const loadSharedChatLog = async (shareToken: string) => {
    if (!shareToken) return
    isExpired.value = false
    sharedChatLogRows.value = []
    openLoading({ text: '공유 대화를 불러오는 중...' })
    try {
      const res = await fetchSelectSharedChatLogList(shareToken)
      if (!res.successYn) {
        shareTxt.value = res.returnMsg
        isExpired.value = true
        openToast({ message: res.returnMsg, type: 'error' })
        sharedMessages.value = []
        return
      }
      const rawList = res.list ?? []
      if (rawList.length === 0) {
        sharedMessages.value = []
        return
      }
      sharedChatLogRows.value = rawList
      const flattened = rawList.flatMap(logRowToMessages)
      flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      sharedMessages.value = flattened
    } catch {
      openToast({ message: '대화를 불러올 수 없습니다. 접근 권한이 없거나 존재하지 않는 대화입니다.', type: 'error' })
      sharedMessages.value = []
      sharedChatLogRows.value = []
    } finally {
      closeLoading()
    }
  }

  /**
   * 대화 이어가기: 신규 방 생성 후 공유 로그 복사 API 호출 → /chat/[roomId]
   * - 신규 방은 기존 `createChatRoom.do`만 사용(WebSocket 미전송)
   * - 로그 일괄 복사는 `copySharedChatLogsToRoom.do`(roomId + shareToken) — 백엔드 구현 대기
   */
  const handleForkSharedChat = async (shareToken: string): Promise<boolean> => {
    const token = String(shareToken || '').trim()
    if (!token) return false
    if (!user.value?.userId) {
      openToast({ message: '로그인 후 이용할 수 있습니다.', type: 'warning' })
      return false
    }
    if (!sharedChatLogRows.value.length) {
      openToast({ message: '복사할 대화가 없습니다.', type: 'warning' })
      return false
    }

    const sorted = [...sharedChatLogRows.value].sort((a, b) =>
      String(a.createDt ?? '').localeCompare(String(b.createDt ?? '')),
    )
    const firstRow = sorted[0]
    const lastRow = sorted[sorted.length - 1]

    let seedContent = String(firstRow?.qcontent ?? '').trim()
    if (!seedContent) seedContent = '공유된 대화 이어가기'

    let svcTy = String(lastRow?.svcTy ?? 'C')
      .trim()
      .toUpperCase()
    if (svcTy !== 'M' && svcTy !== 'S') svcTy = 'C'

    openLoading({ text: '내 대화로 가져오는 중...' })
    try {
      const createRes = await fetchCreateChatRoom(seedContent, svcTy)
      const newRoomId = normalizeChatRoomId(createRes.data.roomId)
      if (!newRoomId) {
        throw new Error('채팅방 ID를 받지 못했습니다.')
      }

      const copyRes = await fetchCopySharedChatLogsToRoom({ roomId: newRoomId, shareToken: token })
      if (copyRes.successYn === false) {
        throw new Error(copyRes.returnMsg || '내 대화로 가져오기에 실패했습니다.')
      }

      await selectChatRoomList({ skipLoading: true })
      openToast({ message: '대화를 이어나갑니다.', type: 'success' })
      await navigateTo(`/chat/${newRoomId}`)
      return true
    } catch (error) {
      const msg = error instanceof Error && error.message.trim() ? error.message : '대화 이어가기에 실패했습니다.'
      openToast({ message: msg, type: 'error' })
      return false
    } finally {
      closeLoading()
    }
  }

  /** 답변 복사 */
  const onCopy = (id: string) => {
    copyToClipboard(sharedMessages.value.find((m) => m.logId === id && m.type === 'answer')?.rContent ?? '')
    openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
  }

  /** 카테고리 목록 조회 */
  const handleSelectKnowledge = async () => {
    openLoading({ text: '카테고리 목록을 불러오는 중...' })
    try {
      const res = await fetchSelectKnowledgeList()
      knowledgeList.value = res.dataList ?? []
    } catch {
      knowledgeList.value = []
    } finally {
      closeLoading()
    }
  }

  return {
    chatRoom,
    sharedMessages,
    isExpired,
    shareTxt,
    chatMessage,
    chatRoomList,
    selectChatRoomList,
    createChatRoom,
    selectModelOptions,
    selectRagDsList,
    selectDmList,
    syncSearchModeFromLastLog,
    resetChatRoom,
    handleSetChatRoom,
    handlePinChatRoom,
    handleRenameChatRoom,
    handleDeleteChatRoom,
    loadSharedChatLog,
    handleForkSharedChat,
    onCopy,
    handleSelectKnowledge,
    knowledgeList,
  }
}

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
  fetchSelectKnowledgeList,
} = useReportsApi()
const { resolveSvcTy, activeSearchModes, subOptions, selectedSubOption } = useChatSearchState()
const { messages, pushQuestionMessage, pushAnswerPlaceholder, logRowToMessages } = useChatMessages()
const { ensureWebSocketAndSend } = useChatSocket()

// 채팅방 관련
const chatRoom = ref<ChatRoom>({ ...EMPTY_CHAT_ROOM })
const chatRoomList = ref<ChatRoom[]>([])
const chatMessage = ref('')
const sharedMessages = ref<ChatMessage[]>([])
const shareTxt = ref('공유된 대화입니다.')
const isExpired = ref(false)
const knowledgeList = ref<KnowledgeItem[]>([])

export const useChatRooms = () => {
  // 채팅방 초기화 (roomId 등 리셋, 검색모드 디폴트 C)
  const resetChatRoom = () => {
    chatRoom.value = { ...EMPTY_CHAT_ROOM }
    activeSearchModes.value = []
  }

  // 채팅방 roomId 동기화 (/chat/[id] 진입 시 사용)
  const handleSetChatRoom = (roomId: string) => {
    chatRoom.value.roomId = roomId
  }

  // 마지막 로그 기준 검색모드·서브옵션 동기화: C=디폴트([]), M=지식검색, S=데이터분석
  const syncSearchModeFromLastLog = async (lastRow: ChatLogListRow | undefined) => {
    const svcTy = lastRow?.svcTy ?? 'C'
    if (svcTy === 'M') {
      activeSearchModes.value = ['M']
      // 지식검색 시 라그 데이터셋 조회
      await selectRagDsList()
    } else if (svcTy === 'S') {
      // 통계 질의 시 데이터마트 조회
      activeSearchModes.value = ['S']
      await selectDmList()
    } else {
      activeSearchModes.value = []
      // 일반 질의 시 모델 옵션 조회
      await selectModelOptions()
    }
    const lastRefId = lastRow?.refId
    if (typeof lastRefId === 'string' && lastRefId && subOptions.value.some((o) => o.value === lastRefId)) {
      selectedSubOption.value = lastRefId
    }
  }
  // 채팅방 목록 조회
  const selectChatRoomList = async () => {
    try {
      const userId = user.value?.userId
      if (!userId) return []
      const res = await fetchSelectChatRoomList(userId)
      chatRoomList.value = res.list
      return chatRoomList.value
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
      return []
    }
  }

  // 채팅방 생성 (content: 호출부에서 전달 가능, 미전달 시 chatMessage 사용)
  const createChatRoom = async (content?: string): Promise<ChatRoom> => {
    const qContent = (content ?? chatMessage.value).trim()
    if (!qContent) {
      chatRoom.value = { ...EMPTY_CHAT_ROOM, qContent: '' }
      return chatRoom.value
    }

    const svcTy = resolveSvcTy()
    const refId = selectedSubOption.value
    const res = await fetchCreateChatRoom(qContent, svcTy)
    const createdRoom: ChatRoom = {
      roomId: res.data.roomId,
      title: res.data.roomTitle,
      qContent,
      createdAt: res.data.createdAt,
      svcTy,
      roomTitle: res.data.roomTitle,
      fixYn: 'N',
    }
    chatRoom.value = createdRoom
    chatRoomList.value = [createdRoom, ...chatRoomList.value.filter((room) => room.roomId !== createdRoom.roomId)]

    messages.value = []
    pushQuestionMessage(qContent, svcTy, refId)
    pushAnswerPlaceholder(svcTy, refId)
    chatMessage.value = ''

    const sent = await ensureWebSocketAndSend({
      type: 'question',
      query: qContent,
      threadId: chatRoom.value.roomId,
      svcTy,
      refId,
    })
    if (!sent) return chatRoom.value

    navigateTo(`/chat/${chatRoom.value.roomId}`)
    return chatRoom.value
  }

  // 모델 옵션 조회
  const selectModelOptions = async () => {
    const res = await fetchSelectModelList()
    subOptions.value = res.modelList.map((item: ModelOption) => ({ label: item.label, value: item.value }))
    selectedSubOption.value = subOptions.value[0]?.value ?? 'auto'
    return subOptions.value
  }
  // 라그 데이터셋 조회
  const selectRagDsList = async () => {
    const res = await fetchSelectRagDsList()
    subOptions.value = res.subOptionList.map((item: SubOption) => ({ label: item.label, value: item.value }))
    selectedSubOption.value = subOptions.value[0]?.value ?? 'all'
    return subOptions.value
  }

  // 데이터마트 데이터셋 조회
  const selectDmList = async () => {
    const res = await fetchSelectDmList()
    subOptions.value = res.subOptionList.map((item: SubOption) => ({ label: item.label, value: item.value }))
    selectedSubOption.value = subOptions.value[0]?.value ?? 'all'
    return subOptions.value
  }

  /** 채팅방 고정 */
  const handlePinChatRoom = async (room: ChatRoom) => {
    try {
      const res = await fetchPinChatRoom(room)
      openToast({ message: '채팅방 고정되었습니다.', type: 'success' })
      selectChatRoomList()
    } catch {
      openToast({ message: '채팅방 고정에 실패했습니다.', type: 'error' })
    }
  }

  /** 채팅방 이름 변경 */
  const handleRenameChatRoom = async (room: ChatRoom, roomTitle: string) => {
    try {
      await fetchRenameChatRoom(room.roomId, roomTitle)
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
        try {
          await fetchDeleteChatRoom(room.roomId)
          openToast({ message: '검색기록이 삭제되었습니다.', type: 'success' })
          await selectChatRoomList()
        } catch {
          openToast({ message: '검색기록 삭제에 실패했습니다.', type: 'error' })
        }
      },
    })
  }

  /** 공유 대화 로드 */
  const loadSharedChatLog = async (shareToken: string) => {
    if (!shareToken) return
    isExpired.value = false
    openLoading()
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
      const flattened = rawList.flatMap(logRowToMessages)
      flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      sharedMessages.value = flattened
    } catch {
      openToast({ message: '대화를 불러올 수 없습니다. 접근 권한이 없거나 존재하지 않는 대화입니다.', type: 'error' })
      sharedMessages.value = []
    } finally {
      closeLoading()
    }
  }

  /** 답변 복사 */
  const onCopy = (id: string) => {
    copyToClipboard(sharedMessages.value.find((m) => m.logId === id && m.type === 'answer')?.rContent ?? '')
    openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
  }

  /** 카테고리 목록 (일반 채팅방과 동일 API) */
  const loadKnowledgeList = async () => {
    try {
      const res = await fetchSelectKnowledgeList()
      knowledgeList.value = res.dataList ?? []
    } catch {
      knowledgeList.value = []
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
    onCopy,
    loadKnowledgeList,
    knowledgeList,
  }
}

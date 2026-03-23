// 타입 선언
import {
  type ChatMessage,
  type ChatLogListRow,
  EMPTY_CHAT_ROOM,
  type ChatRefRow,
  type ChatRoom,
  type ModelOption,
  type PanelType,
  type SearchModeOption,
  type SearchModeValue,
  type SubOption,
  type ChatSocketMessage,
  type ChatSocketPayload,
  type VisualizationViewModel,
} from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
const { user } = useAuth()

// API 호출
const {
  fetchSelectChatRoomList,
  fetchSelectModelList,
  fetchSelectRagDsList,
  fetchSelectDmList,
  fetchCreateChatRoom,
  fetchSelectChatLogList,
  fetchSelectChatRef,
  fetchSelectTableDataList,
  fetchCreateChatLogReaction,
} = useReportsApi()

// LLM 모델 옵션
const modelOptions = ref<ModelOption[]>([])

// 웹소켓 관련 (WebSocket은 앱 전역에서 단일 인스턴스로 공유)
const WEBSOCKET_OPEN = 1
const WEBSOCKET_CONNECTING = 0
const chatbotSocket = shallowRef<WebSocket | null>(null)

const selectedLogId = ref<string | null>(null)
// 채팅 store 상태 — 호출부 간 동기화를 위해 모듈 레벨로 공유
const messages = ref<ChatMessage[]>([])
const chatMessage = ref('')
// pdf 뷰어 or 시각화
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pdfRefList = ref<ChatRefRow[]>([])
const visualizationViewMap = ref<Record<string, VisualizationViewModel>>({})
// 스트리밍 메시지 관련
const pendingMessageId = ref<string | null>(null)
// 스트리밍 메시지 버퍼 관련
const messageBufferMap = ref<Record<string, string>>({})
// 채팅방 관련
const chatRoom = ref<ChatRoom>({ ...EMPTY_CHAT_ROOM })
const chatRoomList = ref<ChatRoom[]>([])
// 좋아요/싫어요 모달 상태
const isModalOpen = ref(false)
const modalMessage = ref('')
const modalTitle = ref('')
const modalPlaceholder = ref('')
const satisYn = ref('')

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.dev ? 'localhost:8082' : window.location.host
  return `${protocol}://${host}/ws/chat`
}

// 검색모드 옵션
const searchModeOptions: SearchModeOption[] = [
  { label: '지식검색(매뉴얼AI)', value: 'M', icon: 'icon-knowledge' },
  { label: '데이터분석(SQL)', value: 'S', icon: 'icon-database' },
]

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const subOptionsMap: Record<SearchModeValue, SubOption[]> = {
  M: [
    { label: '전체', value: 'all' },
    { label: 'ERP 지식베이스', value: 'erp' },
    { label: '그룹웨어 지식베이스', value: 'groupware' },
    { label: '인사관리 지식베이스', value: 'hr' },
  ],
  S: [
    { label: '전체', value: 'all' },
    { label: '경영 통계 데이터마트', value: 'management' },
    { label: '재무회계 데이터마트', value: 'finance' },
    { label: '인사급여 데이터마트', value: 'payroll' },
    { label: '영업실적 데이터마트', value: 'sales' },
    { label: '구매자재 데이터마트', value: 'purchase' },
  ],
}

// 검색모드 상태 (앱 전역 공유C=일반(디폴트), M=지식검색, S=데이터분석)
const activeSearchModes = ref<SearchModeValue[]>([])
// 서브 옵션 (모델/라그/데이터마트 목록) — 호출부 간 동기화를 위해 모듈 레벨 공유
const subOptions = ref<SubOption[]>([])
// 서브 옵션 선택값
const selectedSubOption = ref<string>('all')

export const useChatStore = () => {
  // HTML 콘텐츠 변환
  const toHtmlContent = (value: string) => {
    // 서버에서 내려주는 내용을 최대한 그대로 사용하되
    // 개행 코드(\r\n, \n, 문자열 "\n")만 <br>로 치환해서 줄바꿈만 처리
    const normalized = value.replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
    return normalized.replace(/\n/g, '<br>')
  }

  // 스트리밍 메시지 찾기
  const getStreamingMessage = () => {
    if (pendingMessageId.value) {
      return messages.value.find((message) => message.type === 'answer' && message.logId === pendingMessageId.value)
    }
    const streamingMessages = messages.value.filter((message) => message.type === 'answer' && message.isStreaming)
    return streamingMessages[streamingMessages.length - 1]
  }

  // 스트리밍 메시지 완료 처리
  const finalizeStreamingMessage = () => {
    const streamingMessage = getStreamingMessage()
    if (streamingMessage) {
      streamingMessage.isStreaming = false
      messageBufferMap.value[streamingMessage.logId] = ''
    }
    pendingMessageId.value = null
  }

  // 스트리밍 오류 처리
  const updateStreamingError = (errorText: string) => {
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    if (!streamingMessage) return
    // 스트리밍 메시지 오류 처리
    streamingMessage.rContent = `<p>${errorText}</p>`
    streamingMessage.isStreaming = false
    streamingMessage.hasSource = false
    streamingMessage.hasVisualization = false
    messageBufferMap.value[streamingMessage.logId] = ''
    pendingMessageId.value = null
  }

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (payload: ChatSocketMessage) => {
    // connected, question_received는 답변 메시지가 없어도 처리 가능
    if (payload.type === 'connected' || payload.type === 'question_received') return
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    if (!streamingMessage) return

    // WebSocket 메시지 타입에 따라 처리
    switch (payload.type) {
      // 스트리밍 메시지 처리
      case 'chunk': {
        // 다음 청크 내용 가져오기
        const nextChunk = payload.content ?? ''
        // 이전 버퍼 내용 가져오기
        const prevBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        // 이전 버퍼와 다음 청크 내용 병합
        const mergedBuffer = `${prevBuffer}${nextChunk}`
        // 버퍼 업데이트
        messageBufferMap.value[streamingMessage.logId] = mergedBuffer
        // 스트리밍 메시지 업데이트
        streamingMessage.rContent = toHtmlContent(mergedBuffer)
        streamingMessage.isStreaming = true
        break
      }
      case 'complete': {
        // chunk 없이 complete로만 응답이 온 경우를 대비해 최종 본문을 fallback 반영
        const completeContent = payload.content ?? ''
        // 현재 버퍼 내용 가져오기
        const currentBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        // 렌더링된 콘텐츠 여부 확인
        const hasRenderedContent = Boolean(currentBuffer || streamingMessage.rContent)
        // 콘텐츠가 있고 렌더링되지 않은 경우 버퍼 업데이트
        if (completeContent && !hasRenderedContent) {
          // 버퍼 업데이트
          messageBufferMap.value[streamingMessage.logId] = completeContent
          // 스트리밍 메시지 업데이트
          streamingMessage.rContent = toHtmlContent(completeContent)
        }
        // 서버 logId가 있으면 question + answer 메시지에 반영
        if (payload.logId) {
          const oldLogId = streamingMessage.logId
          // 버퍼 키를 서버 logId로 마이그레이션
          messageBufferMap.value[payload.logId] = messageBufferMap.value[oldLogId] || ''
          messageBufferMap.value[oldLogId] = ''
          // answer 메시지 logId 갱신
          streamingMessage.logId = payload.logId
          // 직전 question 메시지 logId 갱신
          const idx = messages.value.indexOf(streamingMessage)
          if (idx > 0 && messages.value[idx - 1].type === 'question') {
            const pairedQuestion = messages.value[idx - 1]
            pairedQuestion.logId = payload.logId
            // 재생성 시 질문 기준으로 전송할 수 있도록 질문 메타를 보정
            pairedQuestion.svcTy = pairedQuestion.svcTy ?? streamingMessage.svcTy ?? resolveSvcTy()
            pairedQuestion.refId = pairedQuestion.refId ?? streamingMessage.refId ?? selectedSubOption.value
          }
          // pendingMessageId도 서버 logId로 갱신 (finalizeStreamingMessage에서 조회 가능하도록)
          pendingMessageId.value = payload.logId
        }
        streamingMessage.hasSource = !!payload.filePath
        streamingMessage.hasVisualization = !!payload.tableData
        // 스트리밍 메시지 완료 처리
        finalizeStreamingMessage()
        break
      }
      case 'error': {
        // 이미 답변이 조금이라도 렌더링/버퍼링 된 상태면
        // 사용자 경험상 "오류"로 덮어쓰지 말고 무시(또는 경고로만)
        const currentBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        const hasRendered = Boolean(currentBuffer || streamingMessage.rContent)
        if (!hasRendered) {
          updateStreamingError(payload.content || '응답 처리 중 오류가 발생했습니다.')
        } else {
          // 필요하면 콘솔만 남기기
          console.warn('[chat] streaming error after partial content:', payload.content)
        }
        break
      }
      default:
        break
    }
  }

  // WebSocket 연결 종료
  const disconnectWebSocket = () => {
    if (chatbotSocket.value) {
      chatbotSocket.value.close()
      chatbotSocket.value = null
    }
  }

  // WebSocket 연결
  const connectWebSocket = (): Promise<void> => {
    // WebSocket 연결 상태 확인
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      // 현재 WebSocket 연결 상태 확인
      const currentSocket = chatbotSocket.value
      if (currentSocket?.readyState === WEBSOCKET_OPEN) {
        resolve()
        return
      }
      // WebSocket 연결 중인 경우
      if (currentSocket?.readyState === WEBSOCKET_CONNECTING) {
        const onOpen = () => {
          currentSocket.removeEventListener('open', onOpen)
          resolve()
        }
        currentSocket.addEventListener('open', onOpen)
        return
      }

      // 기존 WebSocket 연결이 있으면 닫기
      if (currentSocket) {
        currentSocket.close()
        chatbotSocket.value = null
      }

      try {
        // WebSocket 연결 시도
        const socket = new WebSocket(getWebSocketUrl())
        chatbotSocket.value = socket

        // WebSocket 연결 성공 시
        socket.onopen = () => resolve()

        // WebSocket 메시지 수신 시
        socket.onmessage = (event) => {
          try {
            // WebSocket 메시지 파싱
            const payload = JSON.parse(event.data) as ChatSocketMessage
            // WebSocket 메시지 처리
            handleWebSocketMessage(payload)
          } catch (error) {
            console.error('웹소켓 메시지 파싱 오류:', error)
          }
        }

        socket.onerror = (error) => {
          console.error('웹소켓 연결 오류:', error)
        }

        socket.onclose = () => {
          chatbotSocket.value = null
        }
      } catch (error) {
        console.error('WebSocket 초기화 실패:', error)
        resolve()
      }
    })
  }

  // WebSocket 연결 시작
  const startChatSocket = () => {
    void connectWebSocket()
  }

  // WebSocket 연결 종료
  const stopChatSocket = () => {
    disconnectWebSocket()
  }

  // 채팅방 초기화 (roomId 등 리셋, 검색모드 디폴트 C)
  const resetChatRoom = () => {
    chatRoom.value = { ...EMPTY_CHAT_ROOM }
    activeSearchModes.value = []
  }

  // 채팅방 roomId 동기화 (/chat/[id] 진입 시 사용)
  const handleSetChatRoom = (roomId: string) => {
    chatRoom.value.roomId = roomId
  }

  // API 로그 한 건 → question + answer 메시지 쌍으로 변환
  const logRowToMessages = (row: ChatLogListRow): ChatMessage[] => {
    const logId = String(row.logId ?? '')
    const createdAt = row.createDt ?? ''
    const svcTy = row.svcTy ?? 'C'
    const refId = row.refId ?? 'all'
    const docId = typeof row.docId === 'string' ? row.docId : ''
    const hasSource = row.docExist === 'Y'
    const hasVisualization = row.tableExist === 'Y'
    const satisYnVal = typeof row.satisYn === 'string' ? row.satisYn : ''
    const satisContentVal = typeof row.satisContent === 'string' ? row.satisContent : ''
    return [
      { logId, type: 'question', qContent: row.qcontent ?? '', rContent: '', createdAt, svcTy, refId },
      {
        logId,
        type: 'answer',
        qContent: '',
        rContent: toHtmlContent(row.rcontent ?? ''),
        svcTy,
        refId,
        docId,
        createdAt,
        hasSource,
        hasVisualization,
        chatLogReaction: {
          logId,
          satisYn: satisYnVal,
          satisContent: satisContentVal,
        },
      },
    ]
  }

  // 마지막 로그 기준 검색모드·서브옵션 동기화: C=디폴트([]), M=지식검색, S=데이터분석
  const syncSearchModeFromLastLog = async (lastRow: ChatLogListRow | undefined) => {
    const svcTy = lastRow?.svcTy ?? 'C'
    if (svcTy === 'M') {
      activeSearchModes.value = ['M']
      await selectRagDsList()
    } else if (svcTy === 'S') {
      activeSearchModes.value = ['S']
      await selectDmList()
    } else {
      activeSearchModes.value = []
      await selectModelOptions()
    }
    const lastRefId = lastRow?.refId
    if (typeof lastRefId === 'string' && lastRefId && subOptions.value.some((o) => o.value === lastRefId)) {
      selectedSubOption.value = lastRefId
    }
  }

  // 채팅 로그 조회 (roomId 기준)
  // - 새 채팅 직후처럼 서버 로그가 아직 적재되기 전(0건)인 순간에 페이지 진입하면,
  //   로컬에 이미 쌓아둔 placeholder 메시지까지 비워져 UI가 사라질 수 있어 보존 옵션을 둔다.
  const handleSelectChatLogList = async (
    roomId: string,
    options?: {
      /** 서버 로그가 0건일 때, 로컬 메시지가 있으면 유지할지 여부 (기본 true) */
      preserveLocalWhenEmpty?: boolean
    },
  ) => {
    if (!roomId) {
      messages.value = []
      return
    }
    const res = await fetchSelectChatLogList(roomId)
    const rawList = res.list ?? []
    // 채팅 로그 목록이 0건인 경우
    if (rawList.length === 0) {
      // 로컬 메시지 보존 옵션 확인
      const preserve = options?.preserveLocalWhenEmpty ?? true
      // 로컬 메시지 존재 여부 확인
      const hasLocalMessages = messages.value.length > 0
      // 채팅방 동일 여부 확인
      const isSameRoom = chatRoom.value.roomId === roomId
      // 로컬 메시지 보존 옵션 확인
      if (preserve && hasLocalMessages && isSameRoom) return
      // 로컬 메시지 초기화
      messages.value = []
      return
    }
    // 채팅 로그 목록 → 메시지 리스트 변환
    const flattened = rawList.flatMap(logRowToMessages)
    // 메시지 정렬
    flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    // 메시지 설정
    messages.value = flattened
    // 검색모드·서브옵션 동기화
    await syncSearchModeFromLastLog(rawList[rawList.length - 1])
  }

  // 검색모드 기반 svcTy 결정 (C=일반, M=지식검색, S=데이터분석)
  const resolveSvcTy = (): string => {
    if (isNotEmpty(activeSearchModes.value)) {
      return activeSearchModes.value[0] === 'M' ? 'M' : 'S'
    }
    return 'C'
  }

  // question 메시지 생성 + push
  const pushQuestionMessage = (content: string, svcTy: string, refId: string): string => {
    const logId = Date.now().toString()
    messages.value.push({
      id: logId,
      logId,
      type: 'question',
      qContent: content,
      rContent: '',
      svcTy,
      refId,
      createdAt: new Date().toISOString(),
    })
    return logId
  }

  // answer placeholder 생성 + push + pendingMessageId 설정
  const pushAnswerPlaceholder = (svcTy: string, refId: string): string => {
    const logId = (Date.now() + 1).toString()
    pendingMessageId.value = logId
    messages.value.push({
      id: logId,
      logId,
      type: 'answer',
      qContent: '',
      rContent: '',
      svcTy,
      refId,
      createdAt: new Date().toISOString(),
      isStreaming: true,
      hasSource: false,
      hasVisualization: false,
    })
    return logId
  }

  // WebSocket 연결 확인 + 페이로드 전송 (실패 시 false 반환)
  const ensureWebSocketAndSend = async (payload: ChatSocketPayload): Promise<boolean> => {
    if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
      await connectWebSocket()
    }
    if (chatbotSocket.value?.readyState !== WEBSOCKET_OPEN) {
      updateStreamingError('연결 오류가 발생했습니다. 다시 시도해주세요.')
      return false
    }
    try {
      chatbotSocket.value.send(JSON.stringify(payload))
      return true
    } catch (error) {
      console.error('웹소켓 메시지 전송 실패:', error)
      updateStreamingError('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return false
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
      title: qContent,
      qContent,
      createdAt: res.data.createdAt,
      svcTy,
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

  // 메시지 전송
  const onSend = async () => {
    const content = chatMessage.value.trim()
    if (!content) return

    const svcTy = resolveSvcTy()
    const refId = selectedSubOption.value
    pushQuestionMessage(content, svcTy, refId)
    pushAnswerPlaceholder(svcTy, refId)
    chatMessage.value = ''

    await ensureWebSocketAndSend({
      type: 'question',
      query: content,
      threadId: chatRoom.value.roomId || '',
      svcTy,
      refId,
    })
  }

  // 액션 핸들러
  const onCopy = async (id: string) => {
    // question·answer가 동일 logId로 쌍을 이루므로 반드시 답변만 조회
    const msg = messages.value.find((m) => m.logId === id && m.type === 'answer')
    if (!msg) return
    const text = (msg.rContent ?? '').replace(/<[^>]*>/g, '')
    try {
      await navigator.clipboard.writeText(text)
      openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
    } catch {
      openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
    }
  }

  /** 모달에 넣을 만족도 코멘트: 이미 같은 유형(Y/N)으로 저장된 내용만 재사용 */
  const getReactionModalPrefill = (answer: ChatMessage | undefined, kind: 'Y' | 'N'): string => {
    const r = answer?.chatLogReaction
    if (!r || r.satisYn !== kind) return ''
    return r.satisContent ?? ''
  }

  // 좋아요 처리
  const onLike = (id: string) => {
    modalTitle.value = '답변이 마음에 들어요'
    modalPlaceholder.value = '답변이 마음에 드는 이유를 입력해주세요.'
    selectedLogId.value = id
    satisYn.value = 'Y'
    const answer = messages.value.find((m) => m.logId === id && m.type === 'answer')
    modalMessage.value = getReactionModalPrefill(answer, 'Y')
    isModalOpen.value = true
  }

  // 싫어요 처리
  const onDislike = (id: string) => {
    modalTitle.value = '답변이 마음에 들지 않아요'
    modalPlaceholder.value = '답변이 마음에 들지 않는 이유를 입력해주세요.'
    selectedLogId.value = id
    satisYn.value = 'N'
    const answer = messages.value.find((m) => m.logId === id && m.type === 'answer')
    modalMessage.value = getReactionModalPrefill(answer, 'N')
    isModalOpen.value = true
  }

  const handleReactionSubmit = async () => {
    isModalOpen.value = false
    if (!selectedLogId.value) return
    const logId = selectedLogId.value
    const res = await fetchCreateChatLogReaction(logId, satisYn.value, modalMessage.value)
    if (res.successYn === false) {
      openToast({ message: '만족도 저장에 실패했습니다.', type: 'error' })
      return
    }
    const reactionLabel = satisYn.value === 'Y' ? '좋아요' : '싫어요'
    openToast({ message: `${reactionLabel}가 등록되었습니다.`, type: 'success' })
    const answer = messages.value.find((m) => m.logId === logId && m.type === 'answer')
    if (!answer) return
    const next = res.data
    answer.chatLogReaction = {
      logId,
      satisYn: next?.satisYn ?? satisYn.value,
      satisContent: next?.satisContent ?? modalMessage.value,
    }
  }

  /** 동일 질문으로 답변만 다시 받기 — onSend와 동일 파이프라인 (새 logId 쌍 생성) */
  const onRegenerate = async (id: string) => {
    const question = messages.value.find((m) => m.logId === id && m.type === 'question')
    const content = (question?.qContent ?? '').trim()
    if (!content) return
    if (!chatRoom.value.roomId) return
    const svcTy = question?.svcTy ?? resolveSvcTy()
    const refId = question?.refId ?? selectedSubOption.value

    pushQuestionMessage(content, svcTy, refId)
    pushAnswerPlaceholder(svcTy, refId)
    await ensureWebSocketAndSend({
      type: 'question',
      query: content,
      threadId: chatRoom.value.roomId,
      svcTy,
      refId,
    })
  }

  const getEmptyVisualizationViewModel = (messageId: string): VisualizationViewModel => ({
    messageId,
    status: 'empty',
    sql: '',
    rawTableData: '',
    rows: [],
    schema: null,
  })

  const handleSelectVisualizationData = async (logId: string) => {
    if (!logId) return getEmptyVisualizationViewModel('')

    // 시각화 데이터 조회 중
    visualizationViewMap.value[logId] = {
      messageId: logId,
      status: 'loading',
      sql: '',
      rawTableData: '',
      rows: [],
      schema: null,
    }

    try {
      // 시각화 데이터 조회
      const res = await fetchSelectTableDataList({ logId })
      const row = (res.list ?? [])[0]
      // 시각화 데이터 조회 결과가 없으면 빈 뷰 모델 반환
      if (!row) {
        visualizationViewMap.value[logId] = getEmptyVisualizationViewModel(logId)
        return visualizationViewMap.value[logId]
      }

      // 시각화 데이터 조회 결과 → 뷰 모델 생성
      const viewModel = buildVisualizationViewModel({
        messageId: logId,
        sql: row.ttsq,
        tableData: row.tableData,
        statList: res.statList ?? row.statList,
        statDetailList: res.statDetailList ?? row.statDetailList,
      })
      // 뷰 모델 설정
      visualizationViewMap.value[logId] = viewModel
      return viewModel
    } catch (error) {
      const message = error instanceof Error ? error.message : '시각화 데이터를 불러오지 못했습니다.'
      const fallbackModel: VisualizationViewModel = {
        messageId: logId,
        status: 'error',
        sql: '',
        rawTableData: '',
        rows: [],
        schema: null,
        errorMessage: message,
      }
      visualizationViewMap.value[logId] = fallbackModel
      return fallbackModel
    }
  }

  // 원본 보기 버튼 클릭 시(pdf 패널 열기)
  const onViewSource = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
    pdfRefList.value = []
    // 참조 문서 목록 조회
    const res = await fetchSelectChatRef(id)
    pdfRefList.value = res.list
  }

  // 시각화 보기 버튼 클릭 시(시각화 패널 열기)
  const onViewVisualization = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'visualization'
    activePanelMessageId.value = id
    await handleSelectVisualizationData(id)
  }

  const onPanelClose = (value: boolean) => {
    if (!value) {
      clearBodyChartFullscreen()
      if (activePanelType.value === 'visualization' && activePanelMessageId.value) {
        const removeId = activePanelMessageId.value
        visualizationViewMap.value = Object.fromEntries(
          Object.entries(visualizationViewMap.value).filter(([k]) => k !== removeId),
        )
      }
      activePanelType.value = 'none'
      isPanelFullscreen.value = false
      activePanelMessageId.value = null
    }
  }

  // 검색모드 토글 (라디오 방식 — 하나만 선택 가능)
  const toggleSearchMode = async (mode: SearchModeValue) => {
    if (activeSearchModes.value.includes(mode)) {
      // 모드 해제 → 디폴트(모델 옵션)로 복원
      activeSearchModes.value = []
      await selectModelOptions()
      selectedSubOption.value = subOptions.value[0]?.value ?? 'auto'
    } else {
      activeSearchModes.value = [mode]
      if (mode === 'M') {
        await selectRagDsList()
      } else {
        await selectDmList()
      }
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

  const handleModalClose = () => {
    isModalOpen.value = false
  }

  // 현재 활성 모드의 서브 옵션 (마지막 선택된 모드 기준)
  const currentSubOptions = computed<SubOption[]>(() => {
    if (activeSearchModes.value.length === 0) return []
    const lastMode = activeSearchModes.value[activeSearchModes.value.length - 1]
    return subOptionsMap[lastMode] || []
  })

  const activeVisualizationView = computed(() => {
    const messageId = activePanelMessageId.value
    if (!messageId) return null
    return visualizationViewMap.value[messageId] ?? getEmptyVisualizationViewModel(messageId)
  })

  return {
    // 상태
    chatRoomList,
    messages,
    chatMessage,
    chatRoom,
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    pdfRefList,
    visualizationViewMap,
    activeVisualizationView,
    modelOptions,
    searchModeOptions,
    activeSearchModes,
    subOptions,
    selectedSubOption,
    currentSubOptions,
    // 액션
    selectChatRoomList,
    selectModelOptions,
    createChatRoom,
    resetChatRoom,
    handleSetChatRoom,
    handleSelectChatLogList,
    onSend,
    onCopy,
    onLike,
    onDislike,
    onRegenerate,
    toggleSearchMode,
    // 패널
    onViewSource,
    onViewVisualization,
    handleSelectVisualizationData,
    onPanelClose,
    startChatSocket,
    stopChatSocket,
    isModalOpen,
    modalMessage,
    handleModalClose,
    handleReactionSubmit,
    modalTitle,
    modalPlaceholder,
  }
}

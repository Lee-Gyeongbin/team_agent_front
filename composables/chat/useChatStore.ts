// 타입 선언
import {
  type ChatMessage,
  type ChatLogListRow,
  EMPTY_CHAT_ROOM,
  type ChatRefRow,
  type ChatRoom,
  type ModelOption,
  type PanelType,
  type PdfDocumentProxy,
  type PdfJsLib,
  type SearchModeOption,
  type SearchModeValue,
  type SubOption,
  type VisualizationViewModel,
} from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'

// API 호출
const {
  fetchSelectModelList,
  fetchSelectRagDsList,
  fetchSelectDmList,
  fetchCreateChatRoom,
  fetchSelectChatLogList,
  fetchSelectChatRef,
  fetchSelectTableDataList,
} = useReportsApi()

// LLM 모델 옵션
const modelOptions = ref<ModelOption[]>([])

const dummyMessages: ChatMessage[] = [
  {
    logId: '1',
    type: 'question',
    qContent: '업무관리에서 칸반 보드는 어떻게 생성하지?',
    rContent: '',
    createdAt: '2025-03-03T10:00:00',
  },
  {
    logId: '2',
    type: 'answer',
    qContent: '',
    rContent: `<p>좋은 질문이에요 👍</p>
<p><strong>칸반 보드</strong>를 생성하는 방법을 안내해 드리겠습니다.</p>
<ol>
<li>업무관리 메뉴에 접속합니다.</li>
<li>상단의 "새 보드" 버튼을 클릭합니다.</li>
<li>보드 이름을 입력하고 템플릿으로 "칸반"을 선택합니다.</li>
<li>기본 컬럼(To Do, In Progress, Done)이 자동으로 생성됩니다.</li>
<li>필요에 따라 컬럼을 추가하거나 수정할 수 있습니다.</li>
</ol>
<p>추가로 칸반 보드에서는 카드를 드래그 앤 드롭으로 쉽게 이동할 수 있습니다.</p>`,
    createdAt: '2025-03-03T10:00:05',
    hasSource: true,
    hasVisualization: true,
  },
  {
    logId: '3',
    type: 'question',
    qContent: '회의실 예약 절차 알려주세요',
    rContent: '',
    createdAt: '2025-03-03T10:01:00',
  },
  {
    logId: '4',
    type: 'answer',
    qContent: '',
    rContent: `<p>🏢 <strong>회의실 예약 절차</strong>를 안내해 드리겠습니다.</p>
<ol>
<li>그룹웨어 메인에서 "회의실 예약" 메뉴를 클릭합니다.</li>
<li>예약하고 싶은 날짜와 시간대를 선택합니다.</li>
<li>사용 가능한 회의실 목록에서 원하는 회의실을 선택합니다.</li>
<li>회의 제목, 참석자를 입력한 뒤 "예약 신청" 버튼을 클릭합니다.</li>
<li>승인 후 예약이 확정되면 알림을 받을 수 있습니다.</li>
</ol>`,
    createdAt: '2025-03-03T10:01:10',
    hasSource: true,
    hasVisualization: true,
  },
]

interface ChatSocketPayload {
  type: string
  query: string
  threadId: string
  svcTy: string
  refId: string
}

interface ChatSocketMessage {
  type: string
  content?: string
  filePath?: string
  /** 완료 시 서버에서 내려주는 로그 ID (있으면 스트리밍 메시지에 반영) */
  logId?: string
  tableData?: string
}

// 웹소켓 관련 (WebSocket은 앱 전역에서 단일 인스턴스로 공유)
const WEBSOCKET_OPEN = 1
const WEBSOCKET_CONNECTING = 0
const chatbotSocket = shallowRef<WebSocket | null>(null)

// 채팅 store 상태 — 호출부 간 동기화를 위해 모듈 레벨로 공유
const messages = ref<ChatMessage[]>([...dummyMessages])
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

// 테스트 전용 소켓 + 상태 (LlmTestModal에서 사용)
const testSocket = shallowRef<WebSocket | null>(null)
const testResponseText = ref('')
const isTestStreaming = ref(false)
const testErrorText = ref('')
const testBuffer = ref('')

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
      return messages.value.find((message) => message.logId === pendingMessageId.value)
    }
    const streamingMessages = messages.value.filter((message) => message.type === 'answer' && message.isStreaming)
    return streamingMessages[streamingMessages.length - 1]
  }

  // 스트리밍 메시지 완료 처리
  const finalizeStreamingMessage = (payload: ChatSocketMessage) => {
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    if (streamingMessage) {
      // 스트리밍 메시지 완료 처리
      streamingMessage.isStreaming = false
      // 소스 데이터 처리
      streamingMessage.hasSource = payload.filePath !== '' ? true : false
      // 시각화 데이터 처리
      streamingMessage.hasVisualization = true
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
    streamingMessage.hasSource = true
    streamingMessage.hasVisualization = true
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
        if (payload.filePath !== '') {
          streamingMessage.hasSource = true
        } else if (payload.tableData !== '') {
          streamingMessage.hasVisualization = true
        }
        // 스트리밍 메시지 완료 처리
        finalizeStreamingMessage(payload)
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
    const docId = typeof row.docId === 'string' ? row.docId : ''
    const hasSource = row.docExist === 'Y'
    const hasVisualization = row.tableExist === 'Y'
    return [
      { logId, type: 'question', qContent: row.qcontent ?? '', rContent: '', createdAt },
      {
        logId,
        type: 'answer',
        qContent: '',
        rContent: toHtmlContent(row.rcontent ?? ''),
        docId,
        createdAt,
        hasSource,
        hasVisualization,
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
    if (rawList.length === 0) {
      const preserve = options?.preserveLocalWhenEmpty ?? true
      const hasLocalMessages = messages.value.length > 0
      const isSameRoom = chatRoom.value.roomId === roomId
      if (preserve && hasLocalMessages && isSameRoom) return
      messages.value = []
      return
    }
    const flattened = rawList.flatMap(logRowToMessages)
    flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    messages.value = flattened
    await syncSearchModeFromLastLog(rawList[rawList.length - 1])
  }

  // 채팅방 생성 (content: 호출부에서 전달 가능, 미전달 시 chatMessage 사용)
  const createChatRoom = async (content?: string): Promise<ChatRoom> => {
    const qContent = (content ?? chatMessage.value).trim()
    if (!qContent) {
      chatRoom.value = { ...EMPTY_CHAT_ROOM, qContent: '' }
      return chatRoom.value
    }

    // 디폴트 검색 모드로 설정
    let svcTy = 'C'
    // 검색모드 (C/M/D)
    if (isNotEmpty(activeSearchModes.value)) {
      // 모드 세팅
      svcTy = activeSearchModes.value[0] === 'M' ? 'M' : 'S'
    }
    // 채팅방 생성
    const res = await fetchCreateChatRoom(qContent, svcTy)
    // response 생성
    chatRoom.value.roomId = res.data.roomId
    chatRoom.value.title = qContent
    chatRoom.value.qContent = qContent

    // 새 채팅방: 메시지 초기화 후 question + answer placeholder를 순차 적재
    const questionLogId = Date.now().toString()
    const assistantMessageId = (Date.now() + 1).toString()
    messages.value = []
    messages.value.push({
      id: questionLogId,
      logId: questionLogId,
      type: 'question',
      qContent: qContent,
      rContent: '',
      createdAt: new Date().toISOString(),
    })
    messages.value.push({
      id: assistantMessageId,
      logId: assistantMessageId,
      type: 'answer',
      rContent: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      hasSource: true,
      hasVisualization: true,
    })
    // 스트리밍 메시지 ID 설정
    pendingMessageId.value = assistantMessageId
    // 채팅 메시지 초기화
    chatMessage.value = ''

    // WebSocket 연결 확인 후 전송
    if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
      await connectWebSocket()
    }
    // 서브 옵션(LLM/RAG/DM)
    const refId = selectedSubOption.value

    if (chatbotSocket.value?.readyState === WEBSOCKET_OPEN) {
      const payload: ChatSocketPayload = {
        type: 'question',
        query: qContent,
        threadId: chatRoom.value.roomId,
        svcTy: svcTy,
        refId: refId,
      }
      try {
        chatbotSocket.value.send(JSON.stringify(payload))
      } catch (error) {
        console.error('웹소켓 메시지 전송 실패:', error)
        updateStreamingError('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } else {
      updateStreamingError('연결 오류가 발생했습니다. 다시 시도해주세요.')
    }

    navigateTo(`/chat/${chatRoom.value.roomId}`)
    return chatRoom.value
  }
  // 메시지 전송
  const onSend = async () => {
    const content = chatMessage.value.trim()
    if (!content) return

    const questionMessageId = Date.now().toString()
    messages.value.push({
      id: questionMessageId,
      logId: questionMessageId,
      type: 'question',
      qContent: content,
      rContent: '',
      createdAt: new Date().toISOString(),
    })

    chatMessage.value = ''

    const assistantMessageId = (Date.now() + 1).toString()
    pendingMessageId.value = assistantMessageId

    messages.value.push({
      id: assistantMessageId,
      logId: assistantMessageId,
      type: 'answer',
      qContent: '',
      rContent: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      hasSource: true,
      hasVisualization: true,
    })

    if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
      await connectWebSocket()
    }
    if (chatbotSocket.value?.readyState !== WEBSOCKET_OPEN) {
      updateStreamingError('연결 오류가 발생했습니다. 다시 시도해주세요.')
      return
    }

    let svcTy = 'C'
    // 검색모드 (C/M/D)
    if (isNotEmpty(activeSearchModes.value)) {
      svcTy = activeSearchModes.value[0] === 'M' ? 'M' : 'S'
    }
    const payload: ChatSocketPayload = {
      type: 'question',
      query: content,
      threadId: chatRoom.value.roomId || '',
      svcTy: svcTy,
      refId: selectedSubOption.value,
    }

    try {
      // WebSocket 메시지 전송
      chatbotSocket.value.send(JSON.stringify(payload))
    } catch (error) {
      console.error('웹소켓 메시지 전송 실패:', error)
      updateStreamingError('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  // 액션 핸들러
  const onCopy = (id: string) => {
    const msg = messages.value.find((m) => m.logId === id)
    if (msg) {
      const text = (msg.type === 'question' ? (msg.qContent ?? '') : (msg.rContent ?? '')).replace(/<[^>]*>/g, '')
      navigator.clipboard.writeText(text)
    }
  }

  // 좋아요 처리
  const onLike = (id: string) => {
    const msg = messages.value.find((m) => m.logId === id)
    if (msg) {
      msg.isLiked = !msg.isLiked
      if (msg.isLiked) msg.isDisliked = false
    }
  }

  // 싫어요 처리
  const onDislike = (id: string) => {
    const msg = messages.value.find((m) => m.logId === id)
    if (msg) {
      msg.isDisliked = !msg.isDisliked
      if (msg.isDisliked) msg.isLiked = false
    }
  }

  const onRegenerate = (id: string) => {
    // 🔽 더미 — 백엔드 연결 시 API 호출로 교체
    console.warn('재생성 요청:', id)
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

    visualizationViewMap.value[logId] = {
      messageId: logId,
      status: 'loading',
      sql: '',
      rawTableData: '',
      rows: [],
      schema: null,
    }

    try {
      const res = await fetchSelectTableDataList(logId)
      const row = (res.list ?? [])[0]
      if (!row) {
        visualizationViewMap.value[logId] = getEmptyVisualizationViewModel(logId)
        return visualizationViewMap.value[logId]
      }

      const viewModel = buildVisualizationViewModel({
        messageId: logId,
        sql: row.ttsq,
        tableData: row.tableData,
      })
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

  // 패널 핸들러
  const onViewSource = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
    pdfRefList.value = []
    // 참조 문서 목록 조회
    const res = await fetchSelectChatRef(id)
    pdfRefList.value = res.list
  }

  const onViewVisualization = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'visualization'
    activePanelMessageId.value = id
    // 같은 메시지를 다시 열 때는 기존 결과를 재사용
    if (visualizationViewMap.value[id]?.status === 'success') return
    await handleSelectVisualizationData(id)
  }

  const onPanelClose = (value: boolean) => {
    if (!value) {
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

  // ─── 테스트 전용 소켓 통신 (LlmTestModal) ───

  const handleTestSocketMessage = (payload: ChatSocketMessage) => {
    if (payload.type === 'connected' || payload.type === 'question_received') return

    switch (payload.type) {
      case 'chunk': {
        const nextChunk = payload.content ?? ''
        testBuffer.value = `${testBuffer.value}${nextChunk}`
        testResponseText.value = testBuffer.value
        break
      }
      case 'complete': {
        const completeContent = payload.content ?? ''
        if (completeContent && !testBuffer.value) {
          testBuffer.value = completeContent
          testResponseText.value = completeContent
        }
        isTestStreaming.value = false
        break
      }
      case 'error': {
        if (!testBuffer.value) {
          testErrorText.value = payload.content || '응답 처리 중 오류가 발생했습니다.'
        }
        isTestStreaming.value = false
        break
      }
      default:
        break
    }
  }

  const disconnectTestSocket = () => {
    if (testSocket.value) {
      testSocket.value.close()
      testSocket.value = null
    }
    testResponseText.value = ''
    isTestStreaming.value = false
    testErrorText.value = ''
    testBuffer.value = ''
  }

  const sendTestMessage = async (query: string, modelId: string) => {
    testResponseText.value = ''
    testErrorText.value = ''
    testBuffer.value = ''
    isTestStreaming.value = true

    disconnectTestSocket()
    isTestStreaming.value = true

    // 테스트용 — 로그 저장 없이 임시 threadId만 사용
    const threadId = `test-${Date.now()}`

    try {
      const socket = new WebSocket(getWebSocketUrl())
      testSocket.value = socket

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ChatSocketMessage
          handleTestSocketMessage(payload)
        } catch (error) {
          console.error('[test] 웹소켓 메시지 파싱 오류:', error)
        }
      }

      socket.onerror = (error) => {
        console.error('[test] 웹소켓 연결 오류:', error)
        testErrorText.value = '연결 오류가 발생했습니다.'
        isTestStreaming.value = false
      }

      socket.onclose = () => {
        testSocket.value = null
      }

      socket.onopen = () => {
        const socketPayload: ChatSocketPayload = {
          type: 'question',
          query,
          threadId,
          svcTy: 'llmTest',
          refId: modelId,
        }
        socket.send(JSON.stringify(socketPayload))
      }
    } catch (error) {
      console.error('[test] 테스트 메시지 전송 실패:', error)
      testErrorText.value = '메시지 전송에 실패했습니다.'
      isTestStreaming.value = false
    }
  }

  return {
    // 상태
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
    // 테스트 전용 (LlmTestModal)
    testResponseText,
    isTestStreaming,
    testErrorText,
    sendTestMessage,
    disconnectTestSocket,
  }
}

/** ChatPdfPanel용 PDF 뷰어 기능 */
export const usePdfViewer = (options: {
  filePath: MaybeRef<string | undefined>
  open: MaybeRef<boolean>
  mainCanvasRef: Ref<HTMLCanvasElement | null>
  thumbCanvasMap: Map<number, HTMLCanvasElement>
}) => {
  const { mainCanvasRef, thumbCanvasMap } = options
  const filePath = computed(() => unref(options.filePath))
  const open = computed(() => unref(options.open))

  const pdfDoc = shallowRef<PdfDocumentProxy | null>(null)
  const isLoading = ref(false)
  const loadError = ref('')
  const currentPage = ref(1)
  const totalPages = ref(0)
  const scale = ref(1)
  const renderingToken = ref(0)

  const pageList = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))
  const hasData = computed(() => totalPages.value > 0 && !!pdfDoc.value)

  let pdfjsLib: PdfJsLib | null = null

  const loadPdfJs = async (): Promise<PdfJsLib> => {
    if (typeof window === 'undefined') {
      throw new Error('브라우저 환경에서만 PDF를 렌더링할 수 있습니다.')
    }
    if (pdfjsLib) return pdfjsLib

    const loaded = window.pdfjsLib
    if (loaded) {
      pdfjsLib = loaded
      return pdfjsLib
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = '/pdfjs/build/pdf.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('PDF.js 스크립트를 불러오지 못했습니다.'))
      document.head.appendChild(script)
    })

    pdfjsLib = window.pdfjsLib || null
    if (!pdfjsLib) {
      throw new Error('PDF.js 라이브러리를 찾을 수 없습니다.')
    }
    return pdfjsLib
  }

  const renderMainPage = async () => {
    if (!pdfDoc.value || !mainCanvasRef.value) return

    const token = ++renderingToken.value
    const page = await pdfDoc.value.getPage(currentPage.value)
    const viewport = page.getViewport({ scale: scale.value })
    const canvas = mainCanvasRef.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    await page.render({ canvasContext: ctx, viewport }).promise
    if (token !== renderingToken.value) return
  }

  const renderThumbnail = async (pageNum: number) => {
    if (!pdfDoc.value) return
    const canvas = thumbCanvasMap.get(pageNum)
    if (!canvas) return

    const page = await pdfDoc.value.getPage(pageNum)
    const baseViewport = page.getViewport({ scale: 1 })
    const thumbScale = Math.min(108 / baseViewport.width, 140 / baseViewport.height)
    const viewport = page.getViewport({ scale: thumbScale })
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await page.render({ canvasContext: ctx, viewport }).promise
  }

  const renderAllThumbnails = async () => {
    if (!pdfDoc.value) return
    await nextTick()
    await Promise.all(pageList.value.map((pageNum) => renderThumbnail(pageNum)))
  }

  const loadPdf = async () => {
    if (!filePath.value || !open.value) return
    isLoading.value = true
    loadError.value = ''

    try {
      const lib = await loadPdfJs()
      lib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js'

      const loadingTask = lib.getDocument({ url: filePath.value })
      const loadedPdf = await loadingTask.promise
      pdfDoc.value = loadedPdf
      totalPages.value = loadedPdf.numPages
      currentPage.value = 1
      scale.value = 1
      isLoading.value = false
      await nextTick()
      await renderMainPage()
      await renderAllThumbnails()
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      loadError.value = `PDF 로드 실패: ${message}`
      pdfDoc.value = null
      totalPages.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const goToPage = async (page: number) => {
    if (!pdfDoc.value) return
    const target = Math.max(1, Math.min(page, totalPages.value))
    currentPage.value = target
    await renderMainPage()
  }

  const zoomIn = async () => {
    if (!hasData.value) return
    scale.value = Math.min(4, scale.value + 0.25)
    await renderMainPage()
  }

  const zoomOut = async () => {
    if (!hasData.value) return
    scale.value = Math.max(0.75, scale.value - 0.25)
    await renderMainPage()
  }

  return {
    pdfDoc,
    isLoading,
    loadError,
    currentPage,
    totalPages,
    scale,
    pageList,
    hasData,
    loadPdf,
    goToPage,
    zoomIn,
    zoomOut,
    renderAllThumbnails,
  }
}

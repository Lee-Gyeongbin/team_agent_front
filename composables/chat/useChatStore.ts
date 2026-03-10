// 타입 선언
import type {
  ChatMessage,
  ChatRoom,
  PanelType,
  ModelOption,
  SearchModeValue,
  SearchModeOption,
  SubOption,
  PdfDocumentProxy,
  PdfJsLib,
} from '~/types/chat'
import { EMPTY_CHAT_ROOM } from '~/types/chat'

// API 호출
const { fetchSelectModelList, fetchSelectRagDsList, fetchSelectDmList, fetchCreateChatRoom } = useReportsApi()

// LLM 모델 옵션
const modelOptions = ref<ModelOption[]>([])

const dummyMessages: ChatMessage[] = [
  {
    logId: '1',
    role: 'user',
    qContent: '업무관리에서 칸반 보드는 어떻게 생성하지?',
    rContent: '',
    createdAt: '2025-03-03T10:00:00',
  },
  {
    logId: '2',
    role: 'assistant',
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
    role: 'user',
    qContent: '회의실 예약 절차 알려주세요',
    rContent: '',
    createdAt: '2025-03-03T10:01:00',
  },
  {
    logId: '4',
    role: 'assistant',
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
}

interface ChatSocketMessage {
  type: string
  content?: string
}

const WEBSOCKET_OPEN = 1
const WEBSOCKET_CONNECTING = 0

// WebSocket은 앱 전역에서 단일 인스턴스로 공유
const chatbotSocket = shallowRef<WebSocket | null>(null)

// 채팅 store 상태 — 호출부 간 동기화를 위해 모듈 레벨로 공유
const messages = ref<ChatMessage[]>([...dummyMessages])
const chatMessage = ref('')
const selectedModel = ref('auto')
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pendingMessageId = ref<string | null>(null)
const messageBufferMap = ref<Record<string, string>>({})
const chatRoom = ref<ChatRoom>({ ...EMPTY_CHAT_ROOM })

function getWebSocketUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.dev ? 'localhost:8082' : window.location.host
  return `${protocol}://${host}/ws/chat`
}

// 검색모드 옵션
const searchModeOptions: SearchModeOption[] = [
  { label: '지식검색(매뉴얼AI)', value: 'knowledge', icon: 'icon-knowledge' },
  { label: '데이터분석(SQL)', value: 'sql', icon: 'icon-database' },
]

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const subOptionsMap: Record<SearchModeValue, SubOption[]> = {
  knowledge: [
    { label: '전체', value: 'all' },
    { label: 'ERP 지식베이스', value: 'erp' },
    { label: '그룹웨어 지식베이스', value: 'groupware' },
    { label: '인사관리 지식베이스', value: 'hr' },
  ],
  sql: [
    { label: '전체', value: 'all' },
    { label: '경영 통계 데이터마트', value: 'management' },
    { label: '재무회계 데이터마트', value: 'finance' },
    { label: '인사급여 데이터마트', value: 'payroll' },
    { label: '영업실적 데이터마트', value: 'sales' },
    { label: '구매자재 데이터마트', value: 'purchase' },
  ],
}

// 검색모드 상태 (앱 전역 공유)
const activeSearchModes = ref<SearchModeValue[]>([])
const selectedSubOption = ref<string>('all')
// 서브 옵션 (모델/라그/데이터마트 목록) — 호출부 간 동기화를 위해 모듈 레벨 공유
const subOptions = ref<SubOption[]>([])

export const useChatStore = () => {
  const escapeHtml = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')

  const toHtmlContent = (value: string) => `<p>${escapeHtml(value).replace(/\n/g, '<br>')}</p>`

  const getStreamingMessage = () => {
    if (pendingMessageId.value) {
      return messages.value.find((message) => message.logId === pendingMessageId.value)
    }
    const streamingMessages = messages.value.filter((message) => message.role === 'assistant' && message.isStreaming)
    return streamingMessages[streamingMessages.length - 1]
  }

  // 스트리밍 메시지 완료 처리
  const finalizeStreamingMessage = () => {
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    // 스트리밍 메시지가 있으면 완료 처리
    if (streamingMessage) {
      streamingMessage.isStreaming = false
      streamingMessage.hasSource = true
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
        messageBufferMap.value[streamingMessage.logId] = mergedBuffer
        streamingMessage.rContent = toHtmlContent(mergedBuffer)
        streamingMessage.isStreaming = true
        streamingMessage.hasSource = true
        streamingMessage.hasVisualization = true
        // 스트리밍 메시지 업데이트
        break
      }
      case 'complete':
        // 스트리밍 메시지 완료 처리
        finalizeStreamingMessage()
        break
      case 'error':
        // 스트리밍 오류 처리
        updateStreamingError(payload.content || '응답 처리 중 오류가 발생했습니다.')
        break
      default:
        break
    }
  }

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

  const startChatSocket = () => {
    void connectWebSocket()
  }

  const stopChatSocket = () => {
    disconnectWebSocket()
  }

  // 채팅방 초기화 (roomId 등 리셋)
  const resetChatRoom = () => {
    chatRoom.value = { ...EMPTY_CHAT_ROOM }
  }

  // 채팅방 생성 (content: 호출부에서 전달 가능, 미전달 시 chatMessage 사용)
  const createChatRoom = async (content?: string): Promise<ChatRoom> => {
    // TODO: 서비스 타입 수정 필요
    const svcTy = selectedModel.value
    const qContent = (content ?? chatMessage.value).trim()
    if (!svcTy || !qContent) {
      chatRoom.value = { ...EMPTY_CHAT_ROOM, qContent: '' }
      return chatRoom.value
    }

    const res = await fetchCreateChatRoom(svcTy, qContent)
    chatRoom.value.roomId = res.data.roomId
    chatRoom.value.title = qContent
    chatRoom.value.svcTy = svcTy
    chatRoom.value.qContent = qContent

    // 새 채팅방: 메시지 초기화 후 user + assistant placeholder 추가
    const userMessageId = Date.now().toString()
    const assistantMessageId = (Date.now() + 1).toString()
    pendingMessageId.value = assistantMessageId

    messages.value = [
      {
        logId: userMessageId,
        role: 'user',
        qContent,
        rContent: '',
        createdAt: new Date().toISOString(),
      },
      {
        logId: assistantMessageId,
        role: 'assistant',
        qContent: '',
        rContent: '',
        createdAt: new Date().toISOString(),
        isStreaming: true,
        hasSource: true,
        hasVisualization: true,
      },
    ]
    chatMessage.value = ''

    // WebSocket 연결 확인 후 전송
    if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
      await connectWebSocket()
    }
    if (chatbotSocket.value?.readyState === WEBSOCKET_OPEN) {
      const payload: ChatSocketPayload = {
        type: 'question',
        query: qContent,
        threadId: chatRoom.value.roomId,
        svcTy: 'C',
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

    messages.value.push({
      logId: Date.now().toString(),
      role: 'user',
      qContent: content,
      rContent: '',
      createdAt: new Date().toISOString(),
    })

    chatMessage.value = ''

    const assistantMessageId = (Date.now() + 1).toString()
    pendingMessageId.value = assistantMessageId

    messages.value.push({
      logId: assistantMessageId,
      role: 'assistant',
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

    // TODO: 추후 서비스 타입 추가 필요
    const payload: ChatSocketPayload = {
      type: 'question',
      query: content,
      threadId: chatRoom.value.roomId || '',
      svcTy: 'C',
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
      const text = (msg.role === 'user' ? msg.qContent : msg.rContent).replace(/<[^>]*>/g, '')
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

  // 패널 핸들러
  const onViewSource = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
  }

  const onViewVisualization = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'visualization'
    activePanelMessageId.value = id
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
      if (mode === 'knowledge') {
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

  return {
    // 상태
    messages,
    chatMessage,
    chatRoom,
    selectedModel,
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
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
    onSend,
    onCopy,
    onLike,
    onDislike,
    onRegenerate,
    toggleSearchMode,
    // 패널
    onViewSource,
    onViewVisualization,
    onPanelClose,
    startChatSocket,
    stopChatSocket,
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
  const scale = ref(1.25)
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
      scale.value = 1.25
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
  }
}

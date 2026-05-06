// 타입 선언
import type {
  ChatLogListRow,
  ChatRefRow,
  LunchAgentFormPayload,
  PanelType,
  SearchModeValue,
  VisualizationViewModel,
} from '~/types/chat'
import type { Agent } from '~/types/agent'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import {
  usePsychologySurvey,
  createSurveyMessage,
  buildDiagnosticPrompt,
  parseSurveyAnswersFromPrompt,
} from '~/utils/chat/psychologyConsultUtil'
import { buildLunchRecommendationPrompt, createLunchCardMessage } from '~/utils/chat/lunchAgentUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import { getCodes } from '~/utils/global/comCodesUtil'
import { useFileStore } from '~/composables/com/useFileStore'

/** 에이전트 SVC_TY → 채팅 검색모드 (M=RAG·지식, S=SQL·데이터마트) */
function agentTypeToSearchMode(svcTy: string): SearchModeValue | null {
  if (svcTy === 'M') return 'M'
  if (svcTy === 'S') return 'S'
  return null
}

const { messages } = useChatSocket()
const { logRowToMessages, getMessagesForVisualization, setStreamingLunchPayload } = useChatMessages()
const {
  openPsychologySurvey,
  closePsychologySurvey,
  isSurveyRoom,
  surveyAnswers,
  registerSurveyRoom,
  isSurveyVisible,
} = usePsychologySurvey()
const {
  activeSearchModes,
  selectedChatAgentId,
  subOptions,
  selectedSubOptions,
  buildRefIdForPayload,
  resolveSvcTy,
  modelOptions,
  selectedModelOption,
  isSearchModeMissingSubOptions,
  searchModeSubOptionsEmptyMessage,
} = useChatSearchState()
const {
  chatRoom,
  chatMessage,
  createChatRoom,
  syncSearchModeFromLastLog,
  selectModelOptions,
  selectRagDsList,
  selectDmList,
  knowledgeList,
  handleSelectKnowledge,
} = useChatRooms()
const { executeSendPipeline } = useChatSendPipeline()
const { handleViewFileUrl } = useFileStore()

/**
 * 설문 채팅방에서는 첫 번째 question 메시지(진단 프롬프트)를 숨긴 메시지 목록
 * - 일반 채팅방은 messages 그대로 반환
 * - hiddenFromDisplay 플래그가 설정된 메시지는 항상 숨김 (기존 채팅방에서 설문 재실행 시)
 */
const messagesForDisplay = computed(() => {
  let base = messages.value
  if (isSurveyRoom(chatRoom.value.roomId)) {
    let surveyPromptHidden = false
    base = messages.value.filter((m) => {
      if (m.type === 'question' && !surveyPromptHidden) {
        const parsed = parseSurveyAnswersFromPrompt(m.qContent ?? '')
        const isSurveyPrompt = Object.keys(parsed).length === 25
        if (isSurveyPrompt) {
          surveyPromptHidden = true
          return false
        }
      }
      return true
    })
  }
  return base.filter((m) => !m.hiddenFromDisplay)
})

// API 호출
const { fetchSelectChatLogList, fetchSelectChatRef, fetchSelectTableDataList, fetchSelectAgentListForChat } =
  useChatApi()

/** /chat 인덱스용 에이전트 목록 */
const chatIndexAgents = ref<Agent[]>([])
const isLoadingChatIndexAgents = ref(true)
const normalizeChatAgents = (list: Agent[]) =>
  list
    .filter((a) => a.useYn === 'Y' && (a.svcTy === 'M' || a.svcTy === 'S' || a.svcTy === 'T' || a.svcTy === 'C'))
    .sort((a, b) => a.sortOrd - b.sortOrd)

const selectedLogId = ref<string | null>(null)
// pdf 뷰어 or 시각화
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pdfRefList = ref<ChatRefRow[]>([])
const chatPdfFileUrlMap = ref<Record<string, string>>({})
const visualizationViewMap = ref<Record<string, VisualizationViewModel>>({})
const isLunchVisible = ref(false)

// 좋아요/싫어요 모달 상태
const isModalOpen = ref(false)
const modalMessage = ref('')
const modalTitle = ref('')
const modalPlaceholder = ref('')
const createReadonlyLunchMessage = (payload: LunchAgentFormPayload, agentId = selectedChatAgentId.value ?? '') => {
  const lunchMsg = createLunchCardMessage({
    createdAt: new Date().toISOString(),
    svcTy: 'C',
    refId: '',
    agentId,
  })
  lunchMsg.lunchFormPayload = { ...payload }
  lunchMsg.lunchSubmitted = true
  return lunchMsg
}

/** /chat 인덱스 에이전트 카드 서브타이틀 — svcTy 기반 */
const SVC_TY_SUB_LABEL: Record<string, string> = {
  M: '문서검색증강(RAG) Agent',
  S: '검색모드-to-SQL Agent',
  T: '실시간 음성인식(STT) Agent',
  C: '일반 채팅 Agent',
}
const getChatIndexAgentSubLabel = (agent: Agent) => SVC_TY_SUB_LABEL[agent.svcTy] ?? ''

/** /chat 인덱스 에이전트 카드 아이콘 색상 스타일 — colorId 기반 */
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`
}

const getChatIndexAgentColorStyle = (colorHex: string) => {
  return {
    '--card-icon-color': colorHex,
    '--card-icon-bg': `rgba(${hexToRgb(colorHex)}, 0.12)`,
  }
}

export const useChatStore = () => {
  const handleSelectChatPdfFileUrl = async (docFileId: string): Promise<string | null> => {
    const normalizedId = String(docFileId ?? '').trim()
    if (!normalizedId) return null
    const cached = chatPdfFileUrlMap.value[normalizedId]
    if (cached) return cached
    const url = await handleViewFileUrl(normalizedId)
    if (!url) return null
    chatPdfFileUrlMap.value = { ...chatPdfFileUrlMap.value, [normalizedId]: url }
    return url
  }

  const handleResetChatPdfFileUrlMap = () => {
    chatPdfFileUrlMap.value = {}
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
    openLoading({ text: '채팅 기록을 불러오는 중...' })
    let rawList: ChatLogListRow[]
    try {
      rawList = (await fetchSelectChatLogList(roomId)).list ?? []
    } finally {
      closeLoading()
    }
    if (rawList.length === 0) {
      /**
       * 채팅 로그 목록이 0건인 경우
       * ( 첫 채팅 시 messages 에 넣었지만 서버에는 아직 반영이 안 된 경우
       * 또는 채팅방 이동 시 채팅 로그가 아직 없는 경우 등
       * 로그는 0건이 맞지만 화면에는 보여줄 메시지가 있어야 하는 상황에서 로컬 메시지를 보존하기 위함. )
       */
      // 로컬 메시지 보존 옵션 확인
      const preserve = options?.preserveLocalWhenEmpty ?? true
      // 로컬 메시지 존재 여부 확인
      const hasLocalMessages = messages.value.length > 0
      // 채팅방 동일 여부 확인
      const isSameRoom = normalizeChatRoomId(chatRoom.value.roomId) === normalizeChatRoomId(roomId)
      // 로컬 메시지 보존 옵션 확인
      if (preserve && hasLocalMessages && isSameRoom) return
      // 로컬 메시지 초기화
      messages.value = []
      return
    }
    // 채팅 로그 목록 → 메시지 리스트 변환
    /**
     * rawList.flateMap의 인자는 콜백 함수임.
     * rawList.flatMap(logRowToMessages) : 각 row에 대해 logRowToMessages 함수를 호출하고 그 결과를 배열로 반환.
     */
    const flattened = rawList.flatMap(logRowToMessages)
    // 메시지 정렬
    flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    // 메시지 설정
    messages.value = flattened
    // 검색모드·서브옵션 동기화
    await syncSearchModeFromLastLog(rawList[rawList.length - 1])
  }

  // 메시지 전송
  const onSend = async (files: File[] = []): Promise<boolean> => {
    const content = chatMessage.value.trim()
    if (!content || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    const sent = await executeSendPipeline({
      content,
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: selectedChatAgentId.value ?? '',
      files,
    })
    if (sent) chatMessage.value = ''
    return sent
  }

  /**
   * 설문 진단 프롬프트 전송 — question 메시지를 화면에 노출하지 않는다.
   * @param content - 전송할 프롬프트 문자열
   * @param surveyMessageLogId - 제출 완료로 전환할 survey 메시지 logId (있으면 surveySubmitted=true로 갱신)
   */
  const onSendSurvey = async (content: string, surveyMessageLogId?: string): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    // 설문 메시지를 제출 완료 상태로 전환
    if (surveyMessageLogId) {
      const surveyMsg = messages.value.find((m) => m.logId === surveyMessageLogId && m.type === 'survey')
      if (surveyMsg) {
        surveyMsg.surveyAnswers = { ...surveyAnswers.value }
        surveyMsg.surveySubmitted = true
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: selectedChatAgentId.value ?? '',
      files: [],
    })
    if (sent) {
      const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      selectedChatAgentId.value = null
    }
    return sent
  }

  /** 메시지 목록 내 설문 컴포넌트 제출 — 진단 프롬프트 빌드 후 전송 */
  const onSurveyMessageSubmit = async (logId: string): Promise<boolean> => {
    const prompt = buildDiagnosticPrompt(surveyAnswers.value)
    return await onSendSurvey(prompt, logId)
  }

  /**
   * index.vue에서 설문 제출 후 새 채팅방 진입 시 설문 컴포넌트를 메시지 목록 앞에 주입
   * - question 메시지는 hiddenFromDisplay=true로 숨김
   */
  const addInlineSurveyMessage = (answers: Record<number, number>) => {
    const surveyMsg = createSurveyMessage(answers, true)
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [surveyMsg, ...msgs]
  }

  /** index.vue에서 점심 카드 제출 후 새 채팅방 진입 시 readonly 점심 카드를 메시지 목록 앞에 주입 */
  const addInlineLunchMessage = (payload: LunchAgentFormPayload) => {
    const lunchMsg = createReadonlyLunchMessage(payload)
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [lunchMsg, ...msgs]
  }

  const handleCloseLunchAgentForm = (lunchMessageLogId?: string) => {
    if (!lunchMessageLogId) {
      messages.value = messages.value.filter((m) => m.uiType !== 'lunch-card')
      return
    }
    selectedChatAgentId.value = null
    messages.value = messages.value.filter((m) => m.logId !== lunchMessageLogId)
  }

  /**
   * 점심 추천 프롬프트 전송 — question 메시지를 화면에 노출하지 않는다.
   * @param content - 전송할 프롬프트 문자열
   * @param lunchMessageLogId - 제출 완료로 전환할 lunch-card 메시지 logId
   * @param payload - readonly 카드에 표시할 사용자 응답 데이터
   */
  const onSendLunch = async (
    content: string,
    lunchMessageLogId?: string,
    payload?: LunchAgentFormPayload,
  ): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    const markLunchSubmitted = () => {
      if (!lunchMessageLogId) return
      const lunchMsg = messages.value.find((m) => m.logId === lunchMessageLogId && m.uiType === 'lunch-card')
      if (!lunchMsg) return
      lunchMsg.lunchFormPayload = payload ? { ...payload } : lunchMsg.lunchFormPayload
      lunchMsg.lunchSubmitted = true
    }
    markLunchSubmitted()

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: selectedChatAgentId.value ?? '',
      files: [],
    })
    if (sent && payload) {
      setStreamingLunchPayload(payload)
    }
    if (sent) {
      const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      selectedChatAgentId.value = null
    }
    return sent
  }

  const handleSubmitLunchAgentForm = async (logId: string, payload: LunchAgentFormPayload) => {
    const content = buildLunchRecommendationPrompt(payload)
    if (!chatRoom.value.roomId) {
      const submittedPayload = { ...payload }
      const sent = await createChatRoom(content)
      if (!sent) return

      setStreamingLunchPayload(submittedPayload)

      const msgs = [...messages.value]
      const firstQuestion = msgs.find((m) => m.type === 'question')
      if (firstQuestion) firstQuestion.hiddenFromDisplay = true
      const lunchMsg = msgs.find((m) => m.logId === logId && m.uiType === 'lunch-card')
      if (lunchMsg) {
        lunchMsg.lunchFormPayload = submittedPayload
        lunchMsg.lunchSubmitted = true
        messages.value = msgs
      } else {
        const inlineLunchMsg = createReadonlyLunchMessage(submittedPayload)
        messages.value = [inlineLunchMsg, ...msgs]
      }
      selectedChatAgentId.value = null
      return
    }

    const sent = await onSendLunch(content, logId, payload)
    if (!sent) return
  }

  const getEmptyVisualizationViewModel = (messageId: string): VisualizationViewModel => ({
    messageId,
    status: 'empty',
    sql: '',
    rawTableData: '',
    rows: [],
    schema: null,
  })

  /**
   * 테이블 본문은 메시지의 tableData(selectChatLogList·스트리밍) 사용.
   * ID/코드 → 한글명 매핑(statList, statDetailList)은 selectTableDataList로만 조회해 registerDynamicMappings에 반영.
   */
  const handleSelectVisualizationData = async (logId: string) => {
    if (!logId) return getEmptyVisualizationViewModel('')

    // 시각화를 띄울 때 조회할 메시지 조회
    const source = getMessagesForVisualization()
    const answerMsg = source.find((m) => m.logId === logId && m.type === 'answer')
    // 답변 메시지의 tableData 조회
    const tableData = typeof answerMsg?.tableData === 'string' ? answerMsg.tableData : ''
    const chartOption = answerMsg?.chartOption
    // 답변 메시지의 sql 조회
    const sql = typeof answerMsg?.visualizationData?.sql === 'string' ? answerMsg.visualizationData.sql : ''
    // 테이블 데이터가 없으면 빈 뷰 모델 반환
    if (!tableData.trim()) {
      const empty = getEmptyVisualizationViewModel(logId)
      visualizationViewMap.value[logId] = empty
      return empty
    }
    // 시각화 뷰 모델 생성
    visualizationViewMap.value[logId] = {
      messageId: logId,
      status: 'loading',
      sql: '',
      rawTableData: '',
      rows: [],
      schema: null,
    }

    // 통계 ID → 명칭 매핑 정보 조회
    let statList: VisualizationViewModel['statList']
    // 상세항목 코드 → 명칭 매핑 정보 조회
    let statDetailList: VisualizationViewModel['statDetailList']
    openLoading({ text: '시각화 데이터를 불러오는 중...' })
    try {
      const res = await fetchSelectTableDataList({ logId })
      statList = res.statList
      statDetailList = res.statDetailList
    } catch {
      // 매핑 API 실패 시 표/차트는 컬럼 키 기준 라벨로 표시
    } finally {
      closeLoading()
    }

    const viewModel = buildVisualizationViewModel({
      messageId: logId,
      sql,
      tableData,
      chartOption,
      statList,
      statDetailList,
    })
    visualizationViewMap.value[logId] = viewModel
    return viewModel
  }

  // 원본 보기 버튼 클릭 시(pdf 패널 열기)
  const onViewSource = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
    pdfRefList.value = []
    handleResetChatPdfFileUrlMap()
    // 참조 문서 목록 조회
    openLoading({ text: '참조 문서를 불러오는 중...' })
    let res: { list: ChatRefRow[] }
    try {
      res = await fetchSelectChatRef(id)
    } finally {
      closeLoading()
    }
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
      if (activePanelType.value === 'pdf') {
        handleResetChatPdfFileUrlMap()
      }
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

  // /chat(index)로 복귀할 때, 이전에 열어봤던 시각화/테이블 상태가 남지 않도록 초기화
  const handleResetChatPanels = () => {
    clearBodyChartFullscreen()
    activePanelType.value = 'none'
    isPanelFullscreen.value = false
    activePanelMessageId.value = null
    pdfRefList.value = []
    handleResetChatPdfFileUrlMap()
    visualizationViewMap.value = {}
  }

  const handleSelectChatIndexAgentForC = async (agent: Agent) => {
    const isDeselecting = selectedChatAgentId.value === agent.agentId && activeSearchModes.value.length === 0
    if (isDeselecting) {
      selectedChatAgentId.value = null
      isLunchVisible.value = false
      messages.value = messages.value.filter((m) => m.uiType !== 'lunch-card')
    } else {
      selectedChatAgentId.value = agent.agentId
    }
    activeSearchModes.value = []
    subOptions.value = []
    await selectModelOptions()
    if (isDeselecting) return

    if (chatRoom.value.roomId) {
      const alreadyHasLunchCard = messages.value.some((m) => m.uiType === 'lunch-card' && !m.lunchSubmitted)
      if (!alreadyHasLunchCard) {
        const lunchCardMessage = createLunchCardMessage({
          createdAt: new Date().toISOString(),
          svcTy: 'C',
          refId: '',
          agentId: agent.agentId,
        })
        messages.value = [...messages.value, lunchCardMessage]
      }
      return
    }
    isLunchVisible.value = true
  }

  /** 에이전트 관리 목록 기준 모드 선택 (/chat 인덱스 버튼) — 동일 모드 여러 에이전트 간 전환 지원 */
  const selectChatIndexAgent = async (agent: Agent) => {
    if (agent.svcTy === 'T') {
      // 회의록 에이전트 → 내부 회의 페이지로 이동
      await navigateTo('/meeting')
      return
    }

    if (agent.agentId === 'AG000010') {
      // 산업심리 상담 에이전트 — 에이전트 모드 상태 초기화
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()

      if (chatRoom.value.roomId) {
        // 채팅방 내부: 이미 활성 설문 메시지가 있으면 중복 추가하지 않음
        const alreadyHasSurvey = messages.value.some((m) => m.type === 'survey' && !m.surveySubmitted)
        if (!alreadyHasSurvey) {
          surveyAnswers.value = {}
          const surveyMsg = createSurveyMessage({}, false)
          messages.value = [...messages.value, surveyMsg]
        }
      } else {
        // 최초화면(/chat index): 기존처럼 isSurveyVisible로 인라인 표시
        openPsychologySurvey()
      }
      return
    }

    if (agent.svcTy === 'C') {
      await handleSelectChatIndexAgentForC(agent)
      return
    }
    const mode = agentTypeToSearchMode(agent.svcTy)
    if (!mode) {
      openToast({ message: '채팅에 연결할 수 없는 에이전트 유형입니다.', type: 'warning' })
      return
    }
    if (selectedChatAgentId.value === agent.agentId && activeSearchModes.value.includes(mode)) {
      activeSearchModes.value = []
      selectedChatAgentId.value = null
      subOptions.value = []
      await selectModelOptions()
      return
    }
    selectedChatAgentId.value = agent.agentId
    if (!activeSearchModes.value.includes(mode)) {
      activeSearchModes.value = [mode]
      if (mode === 'M') {
        await selectRagDsList()
      } else {
        await selectDmList()
      }
    }
  }

  /**
   * 설문 닫기 — 에이전트 선택 상태를 초기화하고 설문을 닫는다
   * @param surveyMessageLogId - 제거할 survey 메시지 logId (없으면 메시지 목록 그대로)
   */
  const handleClosePsychologySurvey = (surveyMessageLogId?: string) => {
    selectedChatAgentId.value = null
    closePsychologySurvey()
    if (surveyMessageLogId) {
      messages.value = messages.value.filter((m) => m.logId !== surveyMessageLogId)
    }
  }

  /** /chat 인덱스에서 설문 제출 — 방 생성·인라인 주입·등록·닫기 */
  const handleIndexSurveySubmit = async (): Promise<boolean> => {
    const prompt = buildDiagnosticPrompt(surveyAnswers.value)
    const answers = { ...surveyAnswers.value }
    const sent = await createChatRoom(prompt)
    if (sent) {
      addInlineSurveyMessage(answers)
      registerSurveyRoom(chatRoom.value.roomId)
      handleClosePsychologySurvey()
    }
    return sent
  }

  /** /chat 인덱스에서 점심 카드 닫기 */
  const handleCloseIndexLunchCard = () => {
    selectedChatAgentId.value = null
    isLunchVisible.value = false
  }

  /** /chat 인덱스에서 점심 카드 제출 — 방 생성·인라인 주입·닫기 */
  const handleIndexLunchSubmit = async (payload: LunchAgentFormPayload): Promise<boolean> => {
    const content = buildLunchRecommendationPrompt(payload)
    const sent = await createChatRoom(content)
    if (sent) {
      setStreamingLunchPayload(payload)
      addInlineLunchMessage(payload)
      handleCloseIndexLunchCard()
    }
    return sent
  }

  const activeVisualizationView = computed(() => {
    const messageId = activePanelMessageId.value
    if (!messageId) return null
    return visualizationViewMap.value[messageId] ?? getEmptyVisualizationViewModel(messageId)
  })

  /** /chat 인덱스 에이전트 버튼 목록 조회 */
  const handleSelectChatIndexAgents = async () => {
    isLoadingChatIndexAgents.value = true
    try {
      const res = await fetchSelectAgentListForChat()
      const list = res?.agentList ?? []
      chatIndexAgents.value = normalizeChatAgents(list)
    } catch {
      chatIndexAgents.value = []
      openToast({ message: '에이전트 목록을 불러오지 못했습니다.', type: 'error' })
    } finally {
      isLoadingChatIndexAgents.value = false
    }
  }

  /** 링크형 에이전트 외부 링크 열기 */
  const handleOpenAgentLink = async (agent: Agent): Promise<boolean> => {
    if (!agent.apiUrlCd?.trim()) {
      openToast({ message: '연결 링크 코드가 설정되지 않았습니다.', type: 'warning' })
      return false
    }
    try {
      const codes = await getCodes('AA000001') // 링크형 에이전트 API_URL_CD 코드 그룹 ID
      const row = codes.find((c) => c.codeId === agent.apiUrlCd && c.useYn === 'Y')
      const link = row?.etc1?.trim()
      if (!link) {
        openToast({ message: '연결 링크를 찾을 수 없습니다.', type: 'error' })
        return false
      }
      window.open(link, '_blank', 'noopener,noreferrer')
      return true
    } catch {
      openToast({ message: '연결 정보를 불러오지 못했습니다.', type: 'error' })
      return false
    }
  }

  return {
    // 상태
    chatRoom,
    messages: messagesForDisplay,
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    pdfRefList,
    visualizationViewMap,
    activeVisualizationView,
    modelOptions,
    activeSearchModes,
    selectedChatAgentId,
    chatIndexAgents,
    isLoadingChatIndexAgents,
    getChatIndexAgentSubLabel,
    getChatIndexAgentColorStyle,
    subOptions,
    selectedSubOptions,
    buildRefIdForPayload,
    selectedModelOption,
    knowledgeList,
    isSearchModeMissingSubOptions,
    searchModeSubOptionsEmptyMessage,
    isSurveyVisible,
    isLunchVisible,
    // 액션
    createChatRoom,
    handleSelectChatLogList,
    onSend,
    onSendSurvey,
    onSurveyMessageSubmit,
    handleIndexSurveySubmit,
    addInlineSurveyMessage,
    handleIndexLunchSubmit,
    addInlineLunchMessage,
    handleSubmitLunchAgentForm,
    handleCloseLunchAgentForm,
    selectChatIndexAgent,
    handleClosePsychologySurvey,
    handleCloseIndexLunchCard,
    handleSelectChatIndexAgents,
    // 패널
    onViewSource,
    onViewVisualization,
    handleSelectVisualizationData,
    handleSelectChatPdfFileUrl,
    onPanelClose,
    handleResetChatPanels,
    isModalOpen,
    modalMessage,
    selectedLogId,
    modalTitle,
    modalPlaceholder,
    handleSelectKnowledge,
  }
}

// 타입 선언
import type {
  ChatLogListRow,
  ChatRefRow,
  PanelType,
  SearchModeOption,
  SearchModeValue,
  SubOption,
  VisualizationViewModel,
  KnowledgeItem,
  ChatAttachmentMeta,
} from '~/types/chat'
import type { Agent } from '~/types/agent'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatAttachmentStore } from '~/composables/chat/useChatAttachmentStore'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { buildQuestionPayload } from '~/utils/chat/chatSocketPayloadUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { buildMessageAttachmentsFromUpload } from '~/utils/chat/chatAttachmentDisplayUtil'
import { useAgentApi } from '~/composables/agent/useAgentApi'

/** 에이전트 AGENT_TYPE_CD → 채팅 svcTy/검색모드 (001=RAG·지식, 002=SQL·데이터마트) */
function agentTypeToSearchMode(agentTypeCd: string): SearchModeValue | null {
  if (agentTypeCd === '001') return 'M'
  if (agentTypeCd === '002') return 'S'
  return null
}

/** /chat 인덱스 에이전트 버튼 아이콘 클래스 */
const getChatIndexAgentIconClass = (agent: Agent) => {
  if (agent.agentTypeCd === '001') return 'icon-knowledge'
  if (agent.agentTypeCd === '002') return 'icon-database'
  return 'icon-search'
}

const { messages } = useChatSocket()
const { logRowToMessages, pushQuestionMessage, pushAnswerPlaceholder, getMessagesForVisualization } = useChatMessages()
const {
  activeSearchModes,
  selectedChatAgentId,
  subOptions,
  selectedSubOption,
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
} = useChatRooms()
const { ensureWebSocketAndSend } = useChatSocket()
const { handleUploadChatAttachments, handleMarkChatAttachmentsOrphan } = useChatAttachmentStore()

// API 호출
const {
  fetchSelectChatLogList,
  fetchSelectChatRef,
  fetchSelectTableDataList,
  fetchCreateChatLogReaction,
  fetchSelectKnowledgeList,
} = useReportsApi()
const { fetchAgentList } = useAgentApi()

/** /chat 인덱스용 에이전트 목록 (TB_AGT·에이전트 관리와 동일 소스) */
const chatIndexAgents = ref<Agent[]>([])
const isLoadingChatIndexAgents = ref(true)

const selectedLogId = ref<string | null>(null)
// pdf 뷰어 or 시각화
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pdfRefList = ref<ChatRefRow[]>([])
const visualizationViewMap = ref<Record<string, VisualizationViewModel>>({})

// 좋아요/싫어요 모달 상태
const isModalOpen = ref(false)
const modalMessage = ref('')
const modalTitle = ref('')
const modalPlaceholder = ref('')

// 카테고리 목록
const knowledgeList = ref<KnowledgeItem[]>([])

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

export const useChatStore = () => {
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
      const isSameRoom = chatRoom.value.roomId === roomId
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
    if (!content) return false
    if (isSearchModeMissingSubOptions.value) return false
    if (!chatRoom.value.roomId) return false

    const svcTy = resolveSvcTy()
    const refId = selectedSubOption.value
    const modelId = selectedModelOption.value
    let attachments: ChatAttachmentMeta[] = []
    if (files.length > 0) {
      const uploaded = await handleUploadChatAttachments(files, chatRoom.value.roomId)
      if (uploaded === null) return false
      attachments = uploaded
    }
    const attachmentsForUi =
      attachments.length > 0
        ? files.length === attachments.length
          ? buildMessageAttachmentsFromUpload(files, attachments)
          : attachments.map((a) => ({ ...a }))
        : undefined
    pushQuestionMessage(content, svcTy, modelId, refId, attachmentsForUi)
    pushAnswerPlaceholder(svcTy, modelId, refId)
    chatMessage.value = ''

    const sent = await ensureWebSocketAndSend(
      buildQuestionPayload({
        query: content,
        threadId: chatRoom.value.roomId || '',
        svcTy,
        modelId,
        refId,
        attachments,
      }),
    )
    if (!sent && attachments.length > 0) {
      await handleMarkChatAttachmentsOrphan(attachments)
    }
    return sent
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
    visualizationViewMap.value = {}
  }

  // 검색모드 토글 (라디오 방식 — 하나만 선택 가능)
  const toggleSearchMode = async (mode: SearchModeValue) => {
    if (activeSearchModes.value.includes(mode)) {
      // 모드 해제 → 디폴트(모델 옵션)로 복원
      activeSearchModes.value = []
      selectedChatAgentId.value = null
      subOptions.value = []
      await selectModelOptions()
    } else {
      activeSearchModes.value = [mode]
      selectedChatAgentId.value = null
      if (mode === 'M') {
        await selectRagDsList()
      } else {
        await selectDmList()
      }
    }
  }

  /** 에이전트 관리 목록 기준 모드 선택 (/chat 인덱스 버튼) — 동일 모드 여러 에이전트 간 전환 지원 */
  const selectChatIndexAgent = async (agent: Agent) => {
    const mode = agentTypeToSearchMode(agent.agentTypeCd)
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

  /** 카테고리 목록 조회 */
  const handleSelectKnowledge = async () => {
    openLoading({ text: '카테고리 목록을 불러오는 중...' })
    let res: { dataList: KnowledgeItem[] }
    try {
      res = await fetchSelectKnowledgeList()
    } finally {
      closeLoading()
    }
    knowledgeList.value = res.dataList ?? []
  }

  /** /chat 인덱스 에이전트 버튼 목록 조회 */
  const handleSelectChatIndexAgents = async () => {
    isLoadingChatIndexAgents.value = true
    try {
      const res = await fetchAgentList()
      const list = res?.dataList ?? []
      chatIndexAgents.value = list
        .filter((a) => a.useYn === 'Y' && (a.agentTypeCd === '001' || a.agentTypeCd === '002'))
        .sort((a, b) => a.sortOrd - b.sortOrd)
    } catch {
      chatIndexAgents.value = []
      openToast({ message: '에이전트 목록을 불러오지 못했습니다.', type: 'error' })
    } finally {
      isLoadingChatIndexAgents.value = false
    }
  }

  return {
    // 상태
    chatRoom,
    messages,
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    pdfRefList,
    visualizationViewMap,
    activeVisualizationView,
    modelOptions,
    searchModeOptions,
    activeSearchModes,
    selectedChatAgentId,
    chatIndexAgents,
    isLoadingChatIndexAgents,
    getChatIndexAgentIconClass,
    subOptions,
    selectedSubOption,
    selectedModelOption,
    currentSubOptions,
    knowledgeList,
    isSearchModeMissingSubOptions,
    searchModeSubOptionsEmptyMessage,
    // 액션
    createChatRoom,
    handleSelectChatLogList,
    onSend,
    toggleSearchMode,
    selectChatIndexAgent,
    handleSelectChatIndexAgents,
    // 패널
    onViewSource,
    onViewVisualization,
    handleSelectVisualizationData,
    onPanelClose,
    handleResetChatPanels,
    isModalOpen,
    modalMessage,
    selectedLogId,
    modalTitle,
    modalPlaceholder,
    resolveSvcTy,
    pushQuestionMessage,
    pushAnswerPlaceholder,
    ensureWebSocketAndSend,
    fetchCreateChatLogReaction,
    handleSelectKnowledge,
  }
}

// 타입 선언
import type {
  ChatRefRow,
  ModelOption,
  PanelType,
  SearchModeOption,
  SearchModeValue,
  SubOption,
  VisualizationViewModel,
  KnowledgeItem,
} from '~/types/chat'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
const { messages } = useChatSocket()
const { logRowToMessages, pushQuestionMessage, pushAnswerPlaceholder, getMessagesForVisualization } = useChatMessages()
const { activeSearchModes, subOptions, selectedSubOption, resolveSvcTy } = useChatSearchState()
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

// API 호출
const {
  fetchSelectChatLogList,
  fetchSelectChatRef,
  fetchSelectTableDataList,
  fetchCreateChatLogReaction,
  fetchSelectKnowledgeList,
  fetchCreateKnowledge,
} = useReportsApi()

// LLM 모델 옵션
const modelOptions = ref<ModelOption[]>([])

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
    const res = await fetchSelectChatLogList(roomId)
    const rawList = res.list ?? []
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

    const source = getMessagesForVisualization()
    const answerMsg = source.find((m) => m.logId === logId && m.type === 'answer')
    const tableData = typeof answerMsg?.tableData === 'string' ? answerMsg.tableData : ''
    const sql = typeof answerMsg?.visualizationData?.sql === 'string' ? answerMsg.visualizationData.sql : ''

    if (!tableData.trim()) {
      const empty = getEmptyVisualizationViewModel(logId)
      visualizationViewMap.value[logId] = empty
      return empty
    }

    visualizationViewMap.value[logId] = {
      messageId: logId,
      status: 'loading',
      sql: '',
      rawTableData: '',
      rows: [],
      schema: null,
    }

    let statList: VisualizationViewModel['statList']
    let statDetailList: VisualizationViewModel['statDetailList']
    try {
      const res = await fetchSelectTableDataList({ logId })
      statList = res.statList
      statDetailList = res.statDetailList
    } catch {
      // 매핑 API 실패 시 표/차트는 컬럼 키 기준 라벨로 표시
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
    const res = await fetchSelectKnowledgeList()
    knowledgeList.value = res.dataList ?? []
  }

  /** 지식창고 저장 */
  const handleCreateKnowledge = async (logId: string, categoryId: string) => {
    openLoading({ text: '지식창고에 저장 중...' })
    try {
      await fetchCreateKnowledge(logId, categoryId)
      openToast({ message: '지식창고에 저장되었습니다', type: 'success' })
    } catch (error) {
      console.error(error)
      openToast({ message: '지식창고 저장에 실패했습니다', type: 'error' })
    } finally {
      closeLoading()
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
    subOptions,
    selectedSubOption,
    currentSubOptions,
    knowledgeList,
    // 액션
    createChatRoom,
    handleSelectChatLogList,
    onSend,
    toggleSearchMode,
    // 패널
    onViewSource,
    onViewVisualization,
    handleSelectVisualizationData,
    onPanelClose,
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
    handleCreateKnowledge,
  }
}

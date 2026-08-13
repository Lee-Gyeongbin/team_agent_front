/** 오케스트레이터
 * - 채팅 상태 관리 (채팅방 생성, 에이전트 선택, 메시지 전송, 메시지 수신, 메시지 표시)
 */
// 타입 선언
import type { ChatLogListRow, SearchModeValue } from '~/types/chat'
import type { Agent } from '~/types/agent'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { useChatApi } from '~/composables/chat/useChatApi'
import { useChatPanelManager } from '~/composables/chat/useChatPanelManager'
import {
  chatIndexAgents,
  isLoadingChatIndexAgents,
  selectedChatThemeAgent,
  getChatIndexAgentSubLabel,
  getChatIndexAgentColorStyle,
  handleSelectChatIndexAgents,
} from '~/composables/chat/useChatAgentRegistry'
import { useSurveyAgentActions } from '~/composables/chat/agents/useSurveyAgentActions'
import { useRecommendAgentActions } from '~/composables/chat/agents/useRecommendAgentActions'
import { useTranslateAgentActions } from '~/composables/chat/agents/useTranslateAgentActions'
import { useAutoRecommendAgentActions } from '~/composables/chat/agents/useAutoRecommendAgentActions'
import { useNewsCuratorAgentActions } from '~/composables/chat/agents/useNewsCuratorAgentActions'
import {
  usePsychologySurvey,
  isSurveyDiagnosticPrompt,
  isSurveyChatLogRow,
  handleSelectSurveyChatIndexAgent,
} from '~/utils/chat/surveyUtil'
import {
  isRecommendAgent,
  resolveNormalChatAgentId,
  isRecommendAgentPrompt,
  useRecommendAgent,
} from '~/utils/chat/recommendAgentUtil'
import { isTranslateAgent, useTranslateAgent } from '~/utils/chat/translateAgentUtil'
import { isRiskAgent } from '~/utils/agent/riskConfigUtil'
import { isProposalAgent } from '~/utils/chat/proposalAgentUtil'
import {
  createAutoRecommendCardMessage,
  isAutoRecommendAgent,
  isAutoRecommendAgentPrompt,
  isAutoRecommendLogRow,
  resolveAutoRecommendPrompt,
  useAutoRecommend,
} from '~/utils/chat/autoRecommendUtil'
import {
  handleLoadNewsCuratorCategories,
  createNewsCuratorMessage,
  NEWS_CURATOR_AGENT_ID,
  parseNewsCuratorPromptMeta,
  useNewsCurator,
} from '~/utils/chat/newsCuratorUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { isEphemeralValidationRoomId, normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import { ref, watch, computed } from 'vue'

/** 에이전트 SVC_TY → 채팅 검색모드 (M=RAG·지식, S=SQL·데이터마트) */
function agentTypeToSearchMode(svcTy: string): SearchModeValue | null {
  if (svcTy === 'M') return 'M'
  if (svcTy === 'S') return 'S'
  return null
}

const { messages } = useChatSocket()
const { logRowToMessages, resetNextQuestions } = useChatMessages()
const { closePsychologySurvey, isSurveyRoom, registerSurveyRoom } = usePsychologySurvey()
const { isAutoRecommendRoom, registerAutoRecommendRoom } = useAutoRecommend()
const { isNewsCuratorRoom, registerNewsCuratorRoom, openNewsCurator } = useNewsCurator()
const { isRecommendRoom, registerRecommendRoom } = useRecommendAgent()
const { isTranslateRoom, registerTranslateRoom } = useTranslateAgent()
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
  isFileAttachEnabled,
  riskAgentActive,
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

/** 검색기록 재파싱용 — 마지막으로 로드한 raw 로그·roomId */
const lastLoadedChatLogRows = ref<ChatLogListRow[]>([])
const lastLoadedChatLogRoomId = ref('')

// 좋아요/싫어요 모달 상태
const isModalOpen = ref(false)
const modalMessage = ref('')
const modalTitle = ref('')
const modalPlaceholder = ref('')
const selectedLogId = ref<string | null>(null)

const AGENT_ID_NEWS = NEWS_CURATOR_AGENT_ID

/** raw 로그 → 메시지 변환 (에이전트 subCfg 반영) */
const applyChatLogRowsToMessages = (rawList: ChatLogListRow[], roomId: string) => {
  const flattened = rawList.flatMap((row) => logRowToMessages(row, chatIndexAgents.value))
  flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  messages.value = flattened

  const hasSurveyLog = rawList.some((row) => isSurveyChatLogRow(row, chatIndexAgents.value))
  if (hasSurveyLog) registerSurveyRoom(roomId)
}

/**
 * 설문 채팅방에서는 첫 번째 question 메시지(진단 프롬프트)를 숨긴 메시지 목록
 * - 일반 채팅방은 messages 그대로 반환
 * - hiddenFromDisplay 플래그가 설정된 메시지는 항상 숨김 (기존 채팅방에서 설문 재실행 시)
 */
const messagesForDisplay = computed(() => {
  let base = messages.value
  if (isNewsCuratorRoom(chatRoom.value.roomId)) {
    let newsPromptHidden = false
    base = messages.value.filter((m) => {
      if (m.type === 'question' && !newsPromptHidden) {
        const parsed = parseNewsCuratorPromptMeta(m.qContent ?? '')
        if (parsed.isHiddenQuestion) {
          newsPromptHidden = true
          return false
        }
      }
      return true
    })
  }
  if (isSurveyRoom(chatRoom.value.roomId)) {
    let surveyPromptHidden = false
    base = messages.value.filter((m) => {
      if (m.type === 'question' && !surveyPromptHidden && isSurveyDiagnosticPrompt(m.qContent ?? '')) {
        surveyPromptHidden = true
        return false
      }
      return true
    })
  }
  if (isAutoRecommendRoom(chatRoom.value.roomId)) {
    base = base.filter((m) => {
      if (m.type !== 'question') return true
      const agentId = String(m.agentId ?? '').trim()
      if (agentId) {
        const agent = chatIndexAgents.value.find((a) => a.agentId === agentId)
        if (isAutoRecommendAgent(agent)) return false
      }
      return !isAutoRecommendAgentPrompt(m.qContent ?? '', chatIndexAgents.value)
    })
  }
  if (isRecommendRoom(chatRoom.value.roomId)) {
    let recommendPromptHidden = false
    base = base.filter((m) => {
      if (m.type === 'question' && !recommendPromptHidden) {
        if (isRecommendAgentPrompt(m.qContent ?? '')) {
          recommendPromptHidden = true
          return false
        }
      }
      return true
    })
  }
  if (isTranslateRoom(chatRoom.value.roomId)) {
    let translatePromptHidden = false
    base = base.filter((m) => {
      if (m.type === 'question' && !translatePromptHidden) {
        const matchedAgent = chatIndexAgents.value.find((a) => a.agentId === m.agentId)
        if (isTranslateAgent(matchedAgent)) {
          translatePromptHidden = true
          return false
        }
      }
      return true
    })
  }
  return base.filter((m) => {
    if (m.hiddenFromDisplay) return false
    return true
  })
})

/** 에이전트 목록 로드 후 설문·Pexels 파싱이 누락되지 않도록 메시지 재구성 */
watch(
  () => chatIndexAgents.value.map((a) => a.agentId).join(','),
  () => {
    if (lastLoadedChatLogRows.value.length === 0) return
    const roomId = lastLoadedChatLogRoomId.value
    if (!roomId) return
    if (normalizeChatRoomId(chatRoom.value.roomId) !== normalizeChatRoomId(roomId)) return
    applyChatLogRowsToMessages(lastLoadedChatLogRows.value, roomId)
  },
)

export const useChatStore = () => {
  // agent actions composables
  const {
    isSurveyVisible,
    isGenderStepVisible,
    surveyGender,
    onSendSurvey,
    onSurveyMessageSubmit,
    addInlineSurveyMessage,
    handleClosePsychologySurvey,
    handleIndexSurveySubmit,
  } = useSurveyAgentActions()

  const {
    isRecommendVisible,
    openRecommendAgent,
    handleSubmitRecommendAgentForm,
    handleRecommendAgentRetry,
    addInlineRecommendMessage,
    handleIndexRecommendSubmit,
    appendRecommendCardIfNeeded,
    handleCloseRecommendAgent,
  } = useRecommendAgentActions()

  const {
    isTranslateVisible,
    openTranslateAgent,
    handleSubmitTranslateAgentForm,
    addInlineTranslateMessage,
    handleIndexTranslateSubmit,
    appendTranslateCardIfNeeded,
    handleCloseTranslateAgent,
  } = useTranslateAgentActions()

  const {
    isAutoRecommendVisible,
    addInlineAutoRecommendMessage,
    onSendAutoRecommend,
    onAutoRecommendMessageSubmit,
    resetAutoRecommendPanel,
    handleIndexAutoRecommendSubmit,
    handleAutoRecommendIntroEnd,
  } = useAutoRecommendAgentActions()

  const {
    isNewsCuratorVisible,
    onNewsCuratorMessageSubmit,
    addInlineNewsMessage,
    handleSyncNewsCard,
    handleNewsCuratorReselectCategories,
    handleCloseNewsCurator,
    handleIndexNewsCuratorSubmit,
    handleNewsCuratorIntroEnd,
  } = useNewsCuratorAgentActions()

  // panel manager
  const {
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    pdfRefList,
    visualizationViewMap,
    activeVisualizationView,
    handleSelectChatPdfFileUrl,
    isChatPdfExternalDoc,
    handleResetChatPdfFileUrlMap,
    handleSelectVisualizationData,
    onViewSource,
    onViewVisualization,
    onViewReport,
    onPanelClose,
  } = useChatPanelManager()

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
    // 검증 미리보기 방 — 서버 로그 조회 없이 로컬 메시지만 유지
    if (isEphemeralValidationRoomId(roomId)) {
      resetNextQuestions()
      const isSameRoom = normalizeChatRoomId(chatRoom.value.roomId) === normalizeChatRoomId(roomId)
      const hasPreviewMessages = messages.value.some(
        (message) =>
          message.type === 'dataQuestionClarification' || (message.chatLogMissing && message.type === 'question'),
      )
      if (!isSameRoom && !hasPreviewMessages) messages.value = []
      return
    }

    // 채팅방 전환 시 이전 방의 다음 추천 질문 상태는 더 이상 유효하지 않으므로 초기화
    resetNextQuestions()
    if (!roomId) {
      messages.value = []
      lastLoadedChatLogRows.value = []
      lastLoadedChatLogRoomId.value = ''
      return
    }
    // 기존 채팅방 로드 시 성별 선택 단계 초기화 (이전 미완료 상태가 남지 않도록)
    closePsychologySurvey()
    openLoading({ text: '채팅 기록을 불러오는 중...' })
    let rawList: ChatLogListRow[]
    try {
      const { fetchSelectChatLogList } = useChatApi()
      rawList = (await fetchSelectChatLogList(roomId)).list ?? []
    } finally {
      closeLoading()
    }
    if (rawList.length === 0) {
      const preserve = options?.preserveLocalWhenEmpty ?? true
      const hasLocalMessages = messages.value.length > 0
      const isSameRoom = normalizeChatRoomId(chatRoom.value.roomId) === normalizeChatRoomId(roomId)
      if (preserve && hasLocalMessages && isSameRoom) return
      messages.value = []
      lastLoadedChatLogRows.value = []
      lastLoadedChatLogRoomId.value = ''
      return
    }
    // 뉴스 큐레이터 로그 재구성 시 분야 코드(NC000001) 검증·숨김 질문 방 등록
    let hasNewsAgentLog = false
    let hasHiddenNewsPrompt = false
    for (const row of rawList) {
      if (String(row.agentId ?? '').trim() !== AGENT_ID_NEWS) continue
      hasNewsAgentLog = true
      if (!hasHiddenNewsPrompt && parseNewsCuratorPromptMeta(row.qcontent ?? '').isHiddenQuestion) {
        hasHiddenNewsPrompt = true
      }
    }
    if (hasNewsAgentLog) {
      await handleLoadNewsCuratorCategories()
      if (hasHiddenNewsPrompt) registerNewsCuratorRoom(roomId)
    }

    // 검색기록·채팅방 진입 시 항상 subCfg 포함 에이전트 목록 선조회
    await handleSelectChatIndexAgents()

    const hasRecommendLog = rawList.some((row) => isRecommendAgentPrompt(String(row.qcontent ?? '')))
    if (hasRecommendLog) registerRecommendRoom(roomId)

    const hasAutoRecommendLog = rawList.some((row) => isAutoRecommendLogRow(row, chatIndexAgents.value))
    if (hasAutoRecommendLog) registerAutoRecommendRoom(roomId)

    // TRANSLATE 에이전트 로그 감지 — agentId 기반으로 방 등록
    const hasTranslateLog = rawList.some((row) => {
      const agent = chatIndexAgents.value.find((a) => a.agentId === String(row.agentId ?? '').trim())
      return isTranslateAgent(agent)
    })
    if (hasTranslateLog) registerTranslateRoom(roomId)

    lastLoadedChatLogRows.value = rawList
    lastLoadedChatLogRoomId.value = roomId
    applyChatLogRowsToMessages(rawList, roomId)

    // 검색모드·서브옵션 동기화 (svcTy='W' 분기에서 selectedChatAgentId null 처리 포함)
    await syncSearchModeFromLastLog(rawList[rawList.length - 1], chatIndexAgents.value)
  }

  // 메시지 전송
  const onSend = async (files: File[] = [], contentOverride?: string): Promise<boolean> => {
    const content = (contentOverride ?? chatMessage.value).trim()
    if (!content || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    const sent = await executeSendPipeline({
      content,
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: resolveNormalChatAgentId(selectedChatAgentId.value, chatIndexAgents.value),
      files,
    })
    if (sent) {
      chatMessage.value = ''
      if (selectedChatAgentId.value) {
        const agent = chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value)
        if (agent && isRecommendAgent(agent)) selectedChatAgentId.value = null
      }
    }
    return sent
  }

  const handleSelectChatIndexAgentForC = async (agent: Agent) => {
    const isDeselecting = selectedChatAgentId.value === agent.agentId && activeSearchModes.value.length === 0

    if (isDeselecting) {
      selectedChatAgentId.value = null
    } else {
      selectedChatAgentId.value = agent.agentId
    }
    activeSearchModes.value = []
    subOptions.value = []
    await selectModelOptions()
  }

  /** 에이전트 관리 목록 기준 모드 선택 (/chat 인덱스 버튼) — 동일 모드 여러 에이전트 간 전환 지원 */
  const selectChatIndexAgent = async (agent: Agent) => {
    resetNextQuestions()
    // 에이전트 전환 시 RISK 활성 상태는 기본 해제하고, D 분기에서만 다시 켠다. (토글 판별용 직전 상태 보존)
    const wasRiskActive = riskAgentActive.value
    riskAgentActive.value = false
    if (agent.svcTy === 'T') {
      // 회의록 에이전트 → 내부 회의 페이지로 이동
      await navigateTo('/meeting')
      return
    }

    if (agent.svcTy === 'C' && agent.subCfg != null && agent.subCfg.subTy === 'SURVEY') {
      const surveySelection = handleSelectSurveyChatIndexAgent(agent, {
        roomId: chatRoom.value.roomId,
        messages: messages.value,
      })
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()
      if (surveySelection.appendMessage) {
        messages.value = [...messages.value, surveySelection.appendMessage]
      }
      return
    }

    if (agent.svcTy === 'C' && isRecommendAgent(agent)) {
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()
      if (chatRoom.value.roomId) {
        appendRecommendCardIfNeeded(agent)
      } else {
        openRecommendAgent()
      }
      return
    }

    if (agent.svcTy === 'W' && isTranslateAgent(agent)) {
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()
      if (chatRoom.value.roomId) {
        appendTranslateCardIfNeeded(agent)
      } else {
        openTranslateAgent()
      }
      return
    }

    // RISK(프로젝트 리스크진단·D): 리서처(M)처럼 데이터셋 콤보·첨부를 노출하되 svcTy='D'로 전송.
    // 토글(같은 에이전트 재클릭) 시 해제한다.
    if (agent.svcTy === 'D' && isRiskAgent(agent)) {
      if (selectedChatAgentId.value === agent.agentId && wasRiskActive) {
        // 같은 RISK 에이전트 재클릭 → 해제 (riskAgentActive는 위에서 이미 false)
        activeSearchModes.value = []
        selectedChatAgentId.value = null
        subOptions.value = []
        await selectModelOptions()
        return
      }
      selectedChatAgentId.value = agent.agentId
      riskAgentActive.value = true
      activeSearchModes.value = ['M'] // 데이터셋 콤보·첨부 UI 재사용 목적
      await selectRagDsList() // 자사 역량 RAG 데이터셋 콤보 채우기
      await selectModelOptions()
      return
    }

    // PROPOSAL(제안서·D): PT 제안서 목록 페이지로 이동
    if (agent.svcTy === 'D' && isProposalAgent(agent)) {
      await navigateTo('/proposal')
      return
    }

    if (isAutoRecommendAgent(agent)) {
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()

      const prompt = resolveAutoRecommendPrompt(agent)
      if (!prompt) {
        openToast({ message: '에이전트 프롬프트가 설정되지 않았습니다.', type: 'warning' })
        selectedChatAgentId.value = null
        return
      }

      if (chatRoom.value.roomId) {
        const alreadyHasCard = messages.value.some((m) => m.type === 'autoRecommend' && !m.autoRecommendSubmitted)
        if (!alreadyHasCard) {
          const cardMsg = createAutoRecommendCardMessage({
            agentId: agent.agentId,
            createdAt: new Date().toISOString(),
            svcTy: 'C',
            submitted: false,
          })
          messages.value = [...messages.value, cardMsg]
          await onAutoRecommendMessageSubmit(cardMsg.logId)
        }
      } else {
        await handleIndexAutoRecommendSubmit()
      }
      return
    }

    if (agent.agentId === AGENT_ID_NEWS) {
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()
      await handleLoadNewsCuratorCategories()

      if (chatRoom.value.roomId) {
        if (!messages.value.some((m) => m.type === 'news' && m.newsSubmitted !== true)) {
          const newsMsg = createNewsCuratorMessage(false)
          messages.value = [...messages.value, newsMsg]
        }
      } else {
        openNewsCurator()
      }
      return
    }

    // 채팅 인앱 전용 에이전트(점심·일반 C) — apiUrlCd가 있어도 외부 링크로 보내지 않음
    if (agent.svcTy === 'C') {
      await handleSelectChatIndexAgentForC(agent)
      return
    }

    // agentTypeToSearchMode가 처리 가능한 svcTy(M/S)인 경우 apiUrlCd가 있어도 외부 링크로 보내지 않음
    if (agent.apiUrlCd?.trim() && agentTypeToSearchMode(agent.svcTy) === null) {
      await handleOpenAgentLink(agent)
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

  // /chat(index)로 복귀할 때, 이전에 열어봤던 시각화/테이블 상태가 남지 않도록 초기화
  const handleResetChatPanels = () => {
    resetNextQuestions()
    clearBodyChartFullscreen()
    activePanelType.value = 'none'
    isPanelFullscreen.value = false
    activePanelMessageId.value = null
    pdfRefList.value = []
    handleResetChatPdfFileUrlMap()
    visualizationViewMap.value = {}
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
    selectedChatThemeAgent,
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
    isFileAttachEnabled,
    riskAgentActive,
    isSurveyVisible,
    isGenderStepVisible,
    surveyGender,
    isRecommendVisible,
    isTranslateVisible,
    isAutoRecommendVisible,
    isNewsCuratorVisible,
    // 액션
    createChatRoom,
    handleSelectChatLogList,
    onSend,
    onSendSurvey,
    onSurveyMessageSubmit,
    onSendAutoRecommend,
    onAutoRecommendMessageSubmit,
    onNewsCuratorMessageSubmit,
    handleIndexSurveySubmit,
    handleIndexAutoRecommendSubmit,
    handleIndexNewsCuratorSubmit,
    addInlineSurveyMessage,
    handleIndexRecommendSubmit,
    handleSubmitRecommendAgentForm,
    handleRecommendAgentRetry,
    handleCloseRecommendAgent,
    handleIndexTranslateSubmit,
    handleSubmitTranslateAgentForm,
    handleCloseTranslateAgent,
    addInlineTranslateMessage,
    addInlineAutoRecommendMessage,
    addInlineNewsMessage,
    handleSyncNewsCard,
    handleNewsCuratorReselectCategories,
    resetAutoRecommendPanel,
    handleCloseNewsCurator,
    selectChatIndexAgent,
    handleClosePsychologySurvey,
    handleAutoRecommendIntroEnd,
    handleNewsCuratorIntroEnd,
    handleSelectChatIndexAgents,
    // 패널
    onViewSource,
    onViewVisualization,
    onViewReport,
    handleSelectVisualizationData,
    handleSelectChatPdfFileUrl,
    isChatPdfExternalDoc,
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

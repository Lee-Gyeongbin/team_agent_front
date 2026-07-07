// 타입 선언
import type {
  ChatLogListRow,
  ChatRefRow,
  PanelType,
  RecommendFormPayload,
  SearchModeValue,
  TranslateFormPayload,
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
  isSurveyDiagnosticPrompt,
  isSurveyChatLogRow,
  normalizeAgentSubCfg,
  handleSelectSurveyChatIndexAgent,
} from '~/utils/chat/surveyUtil'
import {
  isRecommendAgent,
  resolveNormalChatAgentId,
  parseRecommendConfigFromAgent,
  buildRecommendPrompt,
  createRecommendCardMessage,
  createRecommendResultCardMessage,
  createReadonlyRecommendMessage,
  isRecommendAgentPrompt,
  useRecommendAgent,
} from '~/utils/chat/recommendAgentUtil'
import {
  isTranslateAgent,
  parseTranslateConfigFromAgent,
  buildTranslatePrompt,
  buildTranslateFileInstruction,
  createTranslateCardMessage,
  createReadonlyTranslateMessage,
  isTranslateAgentPrompt,
  useTranslateAgent,
} from '~/utils/chat/translateAgentUtil'
import { isRiskAgent } from '~/utils/agent/riskConfigUtil'
import {
  createTodayMemeMessage,
  isTodayMemePrompt,
  TODAY_MEME_AGENT_ID,
  TODAY_MEME_MODEL_ID,
  TODAY_MEME_PROMPT,
  useTodayMeme,
} from '~/utils/chat/todayMemeUtil'
import {
  buildCurationPrompt,
  createNewsCuratorMessage,
  handleLoadNewsCuratorCategories,
  isValidNewsCuratorCategorySelection,
  NEWS_CURATOR_AGENT_ID,
  parseNewsCuratorPromptMeta,
  setNewsCuratorSubmitCardLogId,
  useNewsCurator,
  useNewsCuratorAgentConfig,
} from '~/utils/chat/newsCuratorUtil'
import { ref, watch, computed } from 'vue'
import { useChatApi } from '~/composables/chat/useChatApi'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { isEphemeralValidationRoomId, normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import { useFileStore } from '~/composables/com/useFileStore'

/** 에이전트 SVC_TY → 채팅 검색모드 (M=RAG·지식, S=SQL·데이터마트) */
function agentTypeToSearchMode(svcTy: string): SearchModeValue | null {
  if (svcTy === 'M') return 'M'
  if (svcTy === 'S') return 'S'
  return null
}

const { messages } = useChatSocket()
const { logRowToMessages, getMessagesForVisualization, resetNextQuestions } = useChatMessages()
const {
  closePsychologySurvey,
  isSurveyRoom,
  surveyAnswers,
  surveyGender,
  registerSurveyRoom,
  isSurveyVisible,
  isGenderStepVisible,
} = usePsychologySurvey()
const { isTodayMemeVisible, isTodayMemeRoom, registerTodayMemeRoom } = useTodayMeme()
const { isNewsCuratorVisible, isNewsCuratorRoom, registerNewsCuratorRoom, openNewsCurator, closeNewsCurator } =
  useNewsCurator()
const { isRecommendVisible, openRecommendAgent, closeRecommendAgent, registerRecommendRoom, isRecommendRoom } =
  useRecommendAgent()
const { isTranslateVisible, openTranslateAgent, closeTranslateAgent, registerTranslateRoom, isTranslateRoom } =
  useTranslateAgent()
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
const { handleViewFileUrl } = useFileStore()
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
  if (isTodayMemeRoom(chatRoom.value.roomId)) {
    let memePromptHidden = false
    base = base.filter((m) => {
      if (m.type === 'question' && !memePromptHidden) {
        if (isTodayMemePrompt(m.qContent ?? '')) {
          memePromptHidden = true
          return false
        }
      }
      return true
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

// API 호출
const { fetchSelectChatLogList, fetchSelectChatRef, fetchSelectTableDataList, fetchSelectAgentListForChat } =
  useChatApi()

/** /chat 인덱스용 에이전트 목록 (selectAgentListForChat.do — subCfg 포함) */
const chatIndexAgents = ref<Agent[]>([])
/** 선택된 채팅 에이전트 — 테마 아이콘·색상 공통 */
const selectedChatThemeAgent = computed(
  () => chatIndexAgents.value.find((agent) => agent.agentId === selectedChatAgentId.value) ?? null,
)
const isLoadingChatIndexAgents = ref(true)
/** 동시 호출 시 단일 요청만 수행 */
let chatIndexAgentsLoadPromise: Promise<void> | null = null
/** 검색기록 재파싱용 — 마지막으로 로드한 raw 로그·roomId */
const lastLoadedChatLogRows = ref<ChatLogListRow[]>([])
const lastLoadedChatLogRoomId = ref('')
const normalizeChatAgents = (list: Agent[]) =>
  list
    .filter(
      (a) =>
        a.useYn === 'Y' &&
        (a.svcTy === 'M' ||
          a.svcTy === 'S' ||
          a.svcTy === 'T' ||
          a.svcTy === 'C' ||
          a.svcTy === 'A' ||
          a.svcTy === 'W' ||
          a.svcTy === 'D'),
    )
    .map((a) => ({
      ...a,
      subCfg: normalizeAgentSubCfg(a.subCfg),
    }))
    .sort((a, b) => a.sortOrd - b.sortOrd)

/** raw 로그 → 메시지 변환 (에이전트 subCfg 반영) */
const applyChatLogRowsToMessages = (rawList: ChatLogListRow[], roomId: string) => {
  const flattened = rawList.flatMap((row) => logRowToMessages(row, chatIndexAgents.value))
  flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  messages.value = flattened

  const hasSurveyLog = rawList.some((row) => isSurveyChatLogRow(row, chatIndexAgents.value))
  if (hasSurveyLog) registerSurveyRoom(roomId)
}

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

const selectedLogId = ref<string | null>(null)
// pdf 뷰어 or 시각화
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pdfRefList = ref<ChatRefRow[]>([])
const chatPdfFileUrlMap = ref<Record<string, string>>({})
const visualizationViewMap = ref<Record<string, VisualizationViewModel>>({})

// 좋아요/싫어요 모달 상태
const isModalOpen = ref(false)
const modalMessage = ref('')
const modalTitle = ref('')
const modalPlaceholder = ref('')
/** /chat 인덱스 에이전트 카드 서브타이틀 — svcTy 기반 */
const SVC_TY_SUB_LABEL: Record<string, string> = {
  M: '문서검색증강(RAG) Agent',
  S: '검색모드-to-SQL Agent',
  T: '실시간 음성인식(STT) Agent',
  C: '일반 채팅 Agent',
  A: '메일 브리핑 Agent',
  W: '번역 Agent',
  D: '프로젝트 리스크 진단 Agent',
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

const AGENT_ID_MEME = TODAY_MEME_AGENT_ID
const AGENT_ID_NEWS = NEWS_CURATOR_AGENT_ID

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
    await syncSearchModeFromLastLog(rawList[rawList.length - 1])
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
      const newMsgs = messages.value.slice(prevLen)
      const newQuestion = newMsgs.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      // 설문 전송 시 answer 메시지에 surveyAnswers 주입 — 방사형 그래프 이미지 생성 프롬프트용
      if (Object.keys(surveyAnswers.value).length > 0) {
        const newAnswer = newMsgs.find((m) => m.type === 'answer')
        if (newAnswer) newAnswer.surveyAnswers = { ...surveyAnswers.value }
      }
      selectedChatAgentId.value = null
    }
    return sent
  }

  /** 메시지 목록 내 설문 컴포넌트 제출 — 진단 프롬프트 빌드 후 전송 */
  const onSurveyMessageSubmit = async (logId: string): Promise<boolean> => {
    const prompt = buildDiagnosticPrompt(surveyAnswers.value, surveyGender.value)
    return await onSendSurvey(prompt, logId)
  }

  /**
   * index.vue에서 설문 제출 후 새 채팅방 진입 시 설문 컴포넌트를 메시지 목록 앞에 주입
   * - question 메시지는 hiddenFromDisplay=true로 숨김
   */
  const addInlineSurveyMessage = (answers: Record<number, number>, agentId = selectedChatAgentId.value ?? '') => {
    const surveyMsg = createSurveyMessage(answers, true, agentId)
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [surveyMsg, ...msgs]
  }

  /** index.vue에서 TodayMeme 제출 후 새 채팅방 진입 시 readonly TodayMeme 카드를 메시지 목록 앞에 주입 */
  const addInlineTodayMemeMessage = () => {
    const memeMsg = createTodayMemeMessage(true)
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [memeMsg, ...msgs]
  }

  /**
   * TodayMeme 프롬프트 전송 — question 메시지를 화면에 노출하지 않는다.
   * @param content - 전송할 프롬프트 문자열
   * @param memeMessageLogId - 제출 완료로 전환할 meme 메시지 logId
   */
  const onSendTodayMeme = async (content: string, memeMessageLogId?: string): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    if (memeMessageLogId) {
      const memeMsg = messages.value.find((m) => m.logId === memeMessageLogId && m.type === 'meme')
      if (memeMsg) {
        memeMsg.memeSubmitted = true
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: TODAY_MEME_MODEL_ID,
      refId: buildRefIdForPayload(),
      agentId: AGENT_ID_MEME,
      files: [],
    })
    if (sent) {
      const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      registerTodayMemeRoom(chatRoom.value.roomId)
      selectedChatAgentId.value = null
    }
    return sent
  }

  /** 메시지 목록 내 TodayMeme 컴포넌트 제출 — 프롬프트 빌드 후 전송 */
  const onTodayMemeMessageSubmit = async (logId: string): Promise<boolean> => {
    const prompt = TODAY_MEME_PROMPT
    return await onSendTodayMeme(prompt, logId)
  }

  /** 새로운 카테고리 선택 */
  const handleNewsCuratorReselectCategories = async (newsMessageLogId: string): Promise<string | null> => {
    if (messages.value.some((m) => m.type === 'news' && m.newsSubmitted !== true)) return null

    const anchorMessage = messages.value.find((m) => m.logId === newsMessageLogId && m.type === 'news')
    if (!anchorMessage || anchorMessage.newsSubmitted !== true) return null

    const newsMsg = createNewsCuratorMessage(false, { newsReselect: true })
    messages.value = [...messages.value, newsMsg]
    return newsMsg.logId
  }

  /** 사용자 저장 관심 뉴스 분야 codeId 목록 저장 */
  const handleSaveUserNewsInterestCategories = async (newsCategoryCodeIdList: string[]) => {
    const codeIds = newsCategoryCodeIdList.map((id) => String(id).trim()).filter(Boolean)
    if (!codeIds.length) return
    const { fetchSaveUserNewsInterestCategories } = useChatApi()
    await fetchSaveUserNewsInterestCategories(codeIds)
  }

  /**
   * in-room news 카드 제출 상태 동기화 (`newsMessageLogId` 대상)
   * - /chat 인덱스 진입 시 카드 주입은 `addInlineNewsMessage` 사용 (question→news 변환 없음)
   */
  const handleSyncNewsCard = (newsMessageLogId: string, categories?: string[], options?: { isNew?: boolean }) => {
    const normalizedCategories = (categories ?? []).map((item) => String(item).trim()).filter(Boolean)
    const targetMessage = messages.value.find((m) => m.logId === newsMessageLogId && m.type === 'news')
    if (!targetMessage) return

    targetMessage.newsSubmitted = true
    if (normalizedCategories.length > 0) {
      targetMessage.newsSelectedCategories = normalizedCategories
    }
    targetMessage.newsIsNew = options?.isNew ?? true
    targetMessage.newsReselect = false
  }

  /** /chat 인덱스에서 NewsCurator 제출 후 readonly news 카드를 목록 앞에 주입 */
  const addInlineNewsMessage = (categories: string[], isNew: boolean) => {
    const newsMsg = createNewsCuratorMessage(true)
    newsMsg.newsSelectedCategories = categories.map((id) => String(id).trim()).filter(Boolean)
    newsMsg.newsIsNew = isNew
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [newsMsg, ...msgs]
    setNewsCuratorSubmitCardLogId(newsMsg.logId)
  }

  /**
   * 뉴스 큐레이터 공통 제출 파이프라인 — 카테고리 로드·프롬프트 빌드·방 등록·관심분야 저장
   * @param sendFn 실제 전송 방식(새 방 생성 vs 기존 방 전송)만 외부에서 주입
   */
  const submitNewsCuratorPrompt = async (
    categories: string[],
    isNew: boolean,
    sendFn: (prompt: string) => Promise<boolean>,
  ): Promise<boolean> => {
    await handleLoadNewsCuratorCategories()

    if (isNew) {
      if (!isValidNewsCuratorCategorySelection(categories)) {
        openToast({ message: '선택한 뉴스 분야를 확인해 주세요.', type: 'warning' })
        return false
      }
      try {
        await handleSaveUserNewsInterestCategories(categories)
      } catch {
        openToast({ message: '관심 뉴스 분야 저장에 실패했습니다.', type: 'warning' })
        return false
      }
    }

    const { newsCuratorAgentConfig } = useNewsCuratorAgentConfig()
    const prompt = buildCurationPrompt(newsCuratorAgentConfig.value, { isNew })
    const sent = await sendFn(prompt)
    if (sent) {
      registerNewsCuratorRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 메시지 목록 내 NewsCurator 컴포넌트 제출 — 큐레이션 시스템 프롬프트 전체 전송 */
  const onNewsCuratorMessageSubmit = async (
    logId: string,
    categories: string[] = [],
    options?: { isNew?: boolean },
  ): Promise<boolean> => {
    if (isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false
    const isNew = options?.isNew ?? true
    if (!messages.value.some((m) => m.logId === logId && m.type === 'news')) return false

    setNewsCuratorSubmitCardLogId(logId)
    const sent = await submitNewsCuratorPrompt(categories, isNew, async (prompt) => {
      const prevLen = messages.value.length
      const pipelineSent = await executeSendPipeline({
        content: prompt,
        roomId: chatRoom.value.roomId,
        svcTy: resolveSvcTy(),
        modelId: selectedModelOption.value,
        refId: buildRefIdForPayload(),
        agentId: AGENT_ID_NEWS,
        files: [],
      })
      if (pipelineSent) {
        const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
        if (newQuestion) newQuestion.hiddenFromDisplay = true
        selectedChatAgentId.value = null
      }
      return pipelineSent
    })
    if (sent) {
      handleSyncNewsCard(logId, categories, { isNew })
    } else {
      setNewsCuratorSubmitCardLogId(null)
    }
    return sent
  }

  /**
   * RECOMMEND 에이전트 닫기 — 인덱스 오버레이 + 채팅방 카드 모두 처리
   * @param logId - 제거할 recommend 메시지 logId (채팅방 카드 닫기 시)
   */
  const handleCloseRecommendAgent = (logId?: string) => {
    selectedChatAgentId.value = null
    closeRecommendAgent()
    if (logId) {
      messages.value = messages.value.filter((m) => m.logId !== logId)
    }
  }

  /**
   * RECOMMEND 에이전트 폼 제출 → 프롬프트 전송 → result 카드 생성
   */
  const onSendRecommend = async (
    content: string,
    formMessageLogId?: string,
    payload?: RecommendFormPayload,
    agentId?: string,
  ): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    if (formMessageLogId) {
      const formMsg = messages.value.find((m) => m.logId === formMessageLogId && m.type === 'recommend')
      if (formMsg) {
        if (payload) formMsg.recommendFormPayload = { ...payload }
        formMsg.recommendSubmitted = true
        formMsg.recommendCardRole = 'form'
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: agentId ?? selectedChatAgentId.value ?? '',
      files: [],
    })

    if (sent) {
      const newMessages = messages.value.slice(prevLen)
      const newQuestion = newMessages.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true

      const newAnswer = newMessages.find((m) => m.type === 'answer')
      if (newAnswer) {
        newAnswer.hiddenFromDisplay = true
        if (formMessageLogId) {
          const formIndex = messages.value.findIndex((m) => m.logId === formMessageLogId && m.type === 'recommend')
          const resultMsg = createRecommendResultCardMessage({
            answerLogId: newAnswer.logId,
            agentId: newAnswer.agentId ?? agentId ?? selectedChatAgentId.value ?? '',
            createdAt: newAnswer.createdAt,
            svcTy: newAnswer.svcTy,
            refId: newAnswer.refId,
          })
          if (formIndex >= 0) {
            messages.value.splice(formIndex + 1, 0, resultMsg)
          } else {
            messages.value.push(resultMsg)
          }
        }
      }
      selectedChatAgentId.value = null
      if (chatRoom.value.roomId) registerRecommendRoom(chatRoom.value.roomId)
    }
    return sent
  }

  const handleSubmitRecommendAgentForm = async (logId: string, payload: RecommendFormPayload) => {
    if (!chatRoom.value.roomId) {
      return await handleIndexRecommendSubmit(payload)
    }

    const agent =
      chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ??
      chatIndexAgents.value.find((a) => messages.value.some((m) => m.logId === logId && m.agentId === a.agentId))
    if (!agent) return

    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return

    const content = buildRecommendPrompt(payload, config)
    await onSendRecommend(content, logId, payload, agent.agentId)
  }

  /** index.vue에서 RECOMMEND 폼 제출 후 새 채팅방 진입 시 카드를 메시지 목록 앞에 주입 */
  const addInlineRecommendMessage = (payload: RecommendFormPayload, agentId: string) => {
    const roMsg = createReadonlyRecommendMessage(payload, {
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: 'C',
    })
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    const linkedAnswer =
      msgs.find((m) => m.type === 'answer' && m.isStreaming) ?? [...msgs].reverse().find((m) => m.type === 'answer')
    const prefix = [roMsg]
    if (linkedAnswer) {
      prefix.push(
        createRecommendResultCardMessage({
          answerLogId: linkedAnswer.logId,
          agentId: linkedAnswer.agentId ?? agentId,
          createdAt: linkedAnswer.createdAt,
          svcTy: linkedAnswer.svcTy,
          refId: linkedAnswer.refId,
        }),
      )
    }
    messages.value = [...prefix, ...msgs]
  }

  /** /chat 인덱스에서 RECOMMEND 폼 제출 — 방 생성·인라인 주입·닫기 */
  const handleIndexRecommendSubmit = async (payload: RecommendFormPayload): Promise<boolean> => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((a) => a.agentId === agentId)
    if (!agent) return false

    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return false

    const content = buildRecommendPrompt(payload, config)
    const sent = await createChatRoom(content)
    if (sent) {
      addInlineRecommendMessage(payload, agentId)
      handleCloseRecommendAgent()
      if (chatRoom.value.roomId) registerRecommendRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 채팅방 내 미제출 RECOMMEND 카드가 없으면 추가 */
  const appendRecommendCardIfNeeded = (agent: Parameters<typeof parseRecommendConfigFromAgent>[0]) => {
    if (!chatRoom.value.roomId) return
    const alreadyHasCard = messages.value.some((m) => m.type === 'recommend' && !m.recommendSubmitted)
    if (alreadyHasCard) return
    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return
    messages.value = [
      ...messages.value,
      createRecommendCardMessage({
        agentId: agent.agentId,
        createdAt: new Date().toISOString(),
        svcTy: 'C',
      }),
    ]
  }

  /**
   * TRANSLATE 에이전트 닫기 — 인덱스 오버레이 + 채팅방 카드 모두 처리
   * @param logId - 제거할 translation 메시지 logId (채팅방 카드 닫기 시)
   */
  const handleCloseTranslateAgent = (logId?: string) => {
    selectedChatAgentId.value = null
    closeTranslateAgent()
    if (logId) {
      messages.value = messages.value.filter((m) => m.logId !== logId)
    }
  }

  /**
   * TRANSLATE 에이전트 폼 제출 → 합성 prompt 전송 → 번역 결과는 일반 answer로 표시
   */
  const onSendTranslate = async (
    content: string,
    formMessageLogId?: string,
    payload?: TranslateFormPayload,
    agentId?: string,
  ): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    if (formMessageLogId) {
      const formMsg = messages.value.find((m) => m.logId === formMessageLogId && m.type === 'translation')
      if (formMsg) {
        if (payload) formMsg.translateFormPayload = { ...payload }
        formMsg.translateSubmitted = true
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: 'W',
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: agentId ?? selectedChatAgentId.value ?? '',
      files: payload?.file ? [payload.file] : [],
    })

    if (sent) {
      const newMessages = messages.value.slice(prevLen)
      const newQuestion = newMessages.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true

      selectedChatAgentId.value = null
      if (chatRoom.value.roomId) registerTranslateRoom(chatRoom.value.roomId)
    }
    return sent
  }

  const handleSubmitTranslateAgentForm = async (logId: string, payload: TranslateFormPayload) => {
    if (!chatRoom.value.roomId) {
      return await handleIndexTranslateSubmit(payload)
    }

    const agent =
      chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ??
      chatIndexAgents.value.find((a) => messages.value.some((m) => m.logId === logId && m.agentId === a.agentId))
    if (!agent) return

    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return

    const content = payload.file
      ? buildTranslateFileInstruction(payload, config)
      : buildTranslatePrompt(payload, config)
    await onSendTranslate(content, logId, payload, agent.agentId)
  }

  /** index.vue에서 TRANSLATE 폼 제출 후 새 채팅방 진입 시 카드를 메시지 목록 앞에 주입 */
  const addInlineTranslateMessage = (payload: TranslateFormPayload, agentId: string) => {
    const roMsg = createReadonlyTranslateMessage(payload, {
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: 'C',
    })
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [roMsg, ...msgs]
  }

  /** /chat 인덱스에서 TRANSLATE 폼 제출 — 방 생성·인라인 주입·닫기 */
  const handleIndexTranslateSubmit = async (payload: TranslateFormPayload): Promise<boolean> => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((a) => a.agentId === agentId)
    if (!agent) return false

    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return false

    const content = payload.file
      ? buildTranslateFileInstruction(payload, config)
      : buildTranslatePrompt(payload, config)
    const sent = await createChatRoom(content, payload.file ? [payload.file] : [], 'W')
    if (sent) {
      addInlineTranslateMessage(payload, agentId)
      handleCloseTranslateAgent()
      if (chatRoom.value.roomId) registerTranslateRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 채팅방 내 미제출 TRANSLATE 카드가 없으면 추가 */
  const appendTranslateCardIfNeeded = (agent: Parameters<typeof parseTranslateConfigFromAgent>[0]) => {
    if (!chatRoom.value.roomId) return
    const alreadyHasCard = messages.value.some((m) => m.type === 'translation' && !m.translateSubmitted)
    if (alreadyHasCard) return
    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return
    messages.value = [
      ...messages.value,
      createTranslateCardMessage({
        agentId: agent.agentId,
        createdAt: new Date().toISOString(),
        svcTy: 'C',
        config,
      }),
    ]
  }

  /**
   * 뉴스 큐레이터 닫기 — 에이전트 선택 상태를 초기화하고 오버레이를 닫는다
   * @param newsMessageLogId - 제거할 news 메시지 logId (없으면 메시지 목록 그대로)
   */
  const handleCloseNewsCurator = (newsMessageLogId?: string) => {
    selectedChatAgentId.value = null
    closeNewsCurator()
    if (newsMessageLogId) {
      messages.value = messages.value.filter((m) => m.logId !== newsMessageLogId)
    }
  }

  /** /chat 인덱스·라우트 이탈 시 TodayMeme 오버레이·에이전트 선택 초기화 */
  const resetTodayMemePanel = () => {
    selectedChatAgentId.value = null
    isTodayMemeVisible.value = false
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

  // 리서치 리포트 보기 버튼 클릭 시(리포트 패널 열기)
  const onViewReport = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'report'
    activePanelMessageId.value = id
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
    resetNextQuestions()
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

    if (agent.agentId === AGENT_ID_MEME) {
      activeSearchModes.value = []
      subOptions.value = []
      selectedChatAgentId.value = agent.agentId
      await selectModelOptions()

      if (chatRoom.value.roomId) {
        const alreadyHasMeme = messages.value.some((m) => m.type === 'meme' && !m.memeSubmitted)
        if (!alreadyHasMeme) {
          const memeMsg = createTodayMemeMessage(false)
          messages.value = [...messages.value, memeMsg]
          await onTodayMemeMessageSubmit(memeMsg.logId)
        }
      } else {
        await handleIndexTodayMemeSubmit()
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
    const prompt = buildDiagnosticPrompt(surveyAnswers.value, surveyGender.value)
    if (!prompt.trim()) {
      openToast({ message: '설문 설정을 불러오지 못했습니다. 에이전트를 다시 선택해 주세요.', type: 'warning' })
      return false
    }
    const answers = { ...surveyAnswers.value }
    const agentId = selectedChatAgentId.value ?? ''
    const sent = await createChatRoom(prompt)
    if (sent) {
      // createChatRoom은 clearMessagesBefore:true로 초기화 후 question+answer placeholder만 남김
      // → answer 메시지에 surveyAnswers 주입 (방사형 차트 데이터 요청 프롬프트 생성에 필요)
      const answerMsg = messages.value.find((m) => m.type === 'answer')
      if (answerMsg && Object.keys(answers).length > 0) {
        answerMsg.surveyAnswers = { ...answers }
        if (agentId && !answerMsg.agentId) answerMsg.agentId = agentId
      }
      addInlineSurveyMessage(answers, agentId)
      registerSurveyRoom(chatRoom.value.roomId)
      handleClosePsychologySurvey()
    }
    return sent
  }

  /** /chat 인덱스에서 TodayMeme 제출(에이전트 클릭 즉시) — 방 생성·인라인 주입·등록·오버레이 초기화 */
  const handleIndexTodayMemeSubmit = async (): Promise<boolean> => {
    const content = TODAY_MEME_PROMPT
    const sent = await createChatRoom(content)
    if (sent) {
      addInlineTodayMemeMessage()
      registerTodayMemeRoom(chatRoom.value.roomId)
      resetTodayMemePanel()
    }
    return sent
  }

  /** /chat 인덱스에서 NewsCurator 제출(카테고리 선택 후) — 방 생성·인라인 카드 주입·닫기 */
  const handleIndexNewsCuratorSubmit = async (
    categories: string[],
    options?: { isNew?: boolean },
  ): Promise<boolean> => {
    const isNew = options?.isNew ?? true
    return submitNewsCuratorPrompt(categories, isNew, async (prompt) => {
      const sent = await createChatRoom(prompt)
      if (sent) {
        addInlineNewsMessage(categories, isNew)
        handleCloseNewsCurator()
      }
      return sent
    })
  }

  /** TodayMeme 인트로 종료·건너뛰기 후 하단 에이전트 선택 해제(카드·메시지는 유지) */
  const handleTodayMemeIntroEnd = () => {
    if (selectedChatAgentId.value === AGENT_ID_MEME) {
      selectedChatAgentId.value = null
    }
  }

  /** NewsCurator 인트로 종료·건너뛰기 후 하단 에이전트 선택 해제(카드·메시지는 유지) */
  const handleNewsCuratorIntroEnd = () => {
    if (selectedChatAgentId.value === AGENT_ID_NEWS) {
      selectedChatAgentId.value = null
    }
  }

  const activeVisualizationView = computed(() => {
    const messageId = activePanelMessageId.value
    if (!messageId) return null
    return visualizationViewMap.value[messageId] ?? getEmptyVisualizationViewModel(messageId)
  })

  /** /chat 인덱스·검색기록용 에이전트 목록 조회 (selectAgentListForChat.do) */
  const handleSelectChatIndexAgents = async () => {
    if (chatIndexAgentsLoadPromise) return chatIndexAgentsLoadPromise

    chatIndexAgentsLoadPromise = (async () => {
      isLoadingChatIndexAgents.value = true
      try {
        const res = await fetchSelectAgentListForChat()
        const list = res?.agentList ?? []
        chatIndexAgents.value = normalizeChatAgents(list)
        const selectedId = selectedChatAgentId.value
        if (selectedId) {
          const selected = chatIndexAgents.value.find((a) => a.agentId === selectedId)
          if (selected && (isRecommendAgent(selected) || isTranslateAgent(selected))) selectedChatAgentId.value = null
        }
      } catch {
        chatIndexAgents.value = []
        openToast({ message: '에이전트 목록을 불러오지 못했습니다.', type: 'error' })
      } finally {
        isLoadingChatIndexAgents.value = false
        chatIndexAgentsLoadPromise = null
      }
    })()

    return chatIndexAgentsLoadPromise
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
    isTodayMemeVisible,
    isNewsCuratorVisible,
    // 액션
    createChatRoom,
    handleSelectChatLogList,
    onSend,
    onSendSurvey,
    onSurveyMessageSubmit,
    onSendTodayMeme,
    onTodayMemeMessageSubmit,
    onNewsCuratorMessageSubmit,
    handleIndexSurveySubmit,
    handleIndexTodayMemeSubmit,
    handleIndexNewsCuratorSubmit,
    addInlineSurveyMessage,
    handleIndexRecommendSubmit,
    handleSubmitRecommendAgentForm,
    handleCloseRecommendAgent,
    handleIndexTranslateSubmit,
    handleSubmitTranslateAgentForm,
    handleCloseTranslateAgent,
    addInlineTranslateMessage,
    addInlineTodayMemeMessage,
    addInlineNewsMessage,
    handleSyncNewsCard,
    handleNewsCuratorReselectCategories,
    resetTodayMemePanel,
    handleCloseNewsCurator,
    selectChatIndexAgent,
    handleClosePsychologySurvey,
    handleTodayMemeIntroEnd,
    handleNewsCuratorIntroEnd,
    handleSelectChatIndexAgents,
    // 패널
    onViewSource,
    onViewVisualization,
    onViewReport,
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

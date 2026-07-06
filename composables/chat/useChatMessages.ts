import type { ChatGroundingSourceItem, ChatLogListRow, ChatMessage, ChatMessageAttachment } from '~/types/chat'
import type { Agent } from '~/types/agent'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseChatAttachmentsFromLogRow } from '~/utils/chat/chatAttachmentDisplayUtil'
import { parseSurveyAnswersFromPrompt, isSurveyChatLogRow } from '~/utils/chat/surveyUtil'
import {
  buildRecommendMessagesFromLogRow,
  isRecommendAgentPrompt,
  resolveRecommendConfigByAgentId,
} from '~/utils/chat/recommendAgentUtil'
import {
  createEmptyTranslateFormPayload,
  createReadonlyTranslateMessage,
  parseTranslatePayloadFromPrompt,
  resolveTranslateConfigByAgentId,
} from '~/utils/chat/translateAgentUtil'
import { isTodayMemePrompt, parseTodayMemeItems } from '~/utils/chat/todayMemeUtil'
import {
  applyNewsDisplayItemsToSubmitCard,
  isNewsCuratorAnswerMessage,
  NEWS_CURATOR_AGENT_ID,
  parseNewsCuratorItems,
  parseNewsCuratorPromptMeta,
} from '~/utils/chat/newsCuratorUtil'
import { isProposalSlideJson } from '~/utils/chat/proposalAgentUtil'

// 채팅 메시지/스트리밍 상태는 모듈 레벨에서 단일 인스턴스로 공유
const messages = ref<ChatMessage[]>([])
const pendingMessageId = ref<string | null>(null)
const messageBufferMap = ref<Record<string, string>>({})

// 다음 추천 질문 — 답변 완료 후 별도 비동기 메시지로 수신, 검색창 위에 작게 표시
const nextQuestions = ref<string[]>([])
const isGeneratingNextQuestions = ref(false)
const NEXT_QUESTIONS_TIMEOUT_MS = 20000
let nextQuestionsTimeoutId: ReturnType<typeof setTimeout> | null = null

// 사용자가 응답 중단 버튼을 눌렀는지 여부 — 중단된 응답에는 다음 추천 질문을 생성하지 않음
const stoppedByUser = ref(false)

// 응답 중단 버튼 클릭 시 호출 (다음 complete 처리 시 1회 소비)
const markStoppedByUser = () => {
  stoppedByUser.value = true
}

const clearNextQuestionsTimeout = () => {
  if (nextQuestionsTimeoutId !== null) {
    clearTimeout(nextQuestionsTimeoutId)
    nextQuestionsTimeoutId = null
  }
}

// 다음 추천 질문 상태 초기화 (새 질문 전송, 채팅방 전환 시)
const resetNextQuestions = () => {
  clearNextQuestionsTimeout()
  nextQuestions.value = []
  isGeneratingNextQuestions.value = false
}

// 답변 완료 후 다음 추천 질문 생성 대기 시작 — 타임아웃 내 응답 없으면 자동 종료
const startWaitingNextQuestions = () => {
  clearNextQuestionsTimeout()
  nextQuestions.value = []
  isGeneratingNextQuestions.value = true
  nextQuestionsTimeoutId = setTimeout(() => {
    isGeneratingNextQuestions.value = false
    nextQuestionsTimeoutId = null
  }, NEXT_QUESTIONS_TIMEOUT_MS)
}

// 다음 추천 질문 수신 완료
const setNextQuestions = (questions: string[]) => {
  clearNextQuestionsTimeout()
  nextQuestions.value = questions
  isGeneratingNextQuestions.value = false
}

/** 공유 채팅 등 메인 `messages` 외에 시각화를 띄울 때 조회할 로그 소스 (null이면 messages 사용) */
let messagesForVisualizationGetter: (() => ChatMessage[]) | null = null

// 시각화를 띄울 때 조회할 메시지 설정
export const setMessagesForVisualizationGetter = (fn: (() => ChatMessage[]) | null) => {
  messagesForVisualizationGetter = fn
}
// 시각화를 띄울 때 조회할 메시지 조회
const getMessagesForVisualization = () => {
  return messagesForVisualizationGetter?.() ?? messages.value
}

export const useChatMessages = () => {
  // API 로그 한 건 → question + answer 메시지 쌍으로 변환
  const logRowToMessages = (row: ChatLogListRow, agents: Agent[] = []): ChatMessage[] => {
    const logId = String(row.logId ?? '')
    const createdAt = row.createDt ?? ''
    const svcTy = row.svcTy ?? 'C'
    const modelId = row.modelId ?? 'all'
    const refId = row.refId ?? ''
    const agentId = typeof row.agentId === 'string' ? row.agentId.trim() : ''
    const docFileId = typeof row.docFileId === 'string' ? row.docFileId : ''
    const hasSource = row.docExist === 'Y'
    const hasVisualization = row.tableExist === 'Y'
    const satisYnVal = typeof row.satisYn === 'string' ? row.satisYn : ''
    const satisContentVal = typeof row.satisContent === 'string' ? row.satisContent : ''
    const satisCdVal = typeof row.satisCd === 'string' ? row.satisCd : undefined
    const attachments = parseChatAttachmentsFromLogRow(row)
    let groundingSources: ChatGroundingSourceItem[] | undefined
    const wg = row.webGroundingJson
    if (typeof wg === 'string' && wg.trim().length > 0) {
      try {
        const parsed = JSON.parse(wg) as {
          items?: { url?: string; title?: string; docFileId?: string; fileName?: string }[]
        }
        if (Array.isArray(parsed.items)) {
          groundingSources = parsed.items
            .map((it) => {
              const url = String(it?.url ?? '').trim()
              const title = String(it?.title ?? '').trim()
              const docFileId = String(it?.docFileId ?? '').trim()
              const fileName = String(it?.fileName ?? '').trim()

              if (url.length > 0) {
                return {
                  url,
                  ...(title.length > 0 ? { title } : {}),
                }
              }
              if (fileName.length > 0) {
                return {
                  ...(docFileId.length > 0 ? { docFileId } : {}),
                  fileName,
                }
              }
              return undefined
            })
            .filter((it): it is NonNullable<typeof it> => it !== undefined)
        }
      } catch {
        /* ignore */
      }
    }
    const reportHtmlRaw = typeof row.reportHtml === 'string' ? row.reportHtml.trim() : ''
    const pptxDataRaw = typeof row.pptxData === 'string' ? row.pptxData.trim() : ''
    // PROPOSAL: DB REPORT_HTML 컬럼에 슬라이드 JSON 저장 — 스트리밍 pptx_data와 동일하게 복원
    const proposalPptxFromReport = isProposalSlideJson(reportHtmlRaw) ? reportHtmlRaw : ''
    const pptxData = pptxDataRaw || proposalPptxFromReport

    const answerMessage: ChatMessage = {
      logId,
      type: 'answer',
      qContent: '',
      /** 마크다운 원문 — 화면에서는 ChatMessageItem에서 toHtmlContent로 렌더 */
      rContent: row.rcontent ?? '',
      svcTy,
      modelId,
      refId,
      ...(agentId ? { agentId } : {}),
      docFileId,
      createdAt,
      hasSource,
      hasVisualization,
      visualizationData: {
        sql: row.ttsq ?? '',
        chartTitle: '',
      },
      tableData: typeof row.tableData === 'string' ? row.tableData : undefined,
      chartOption: typeof row.chartOption === 'string' ? row.chartOption : undefined,
      ...(groundingSources?.length ? { groundingSources } : {}),
      ...(reportHtmlRaw && !proposalPptxFromReport ? { reportHtml: reportHtmlRaw, hasReport: true } : {}),
      ...(pptxData ? { pptxData, hasPptx: true } : {}),
      chatLogReaction: {
        logId,
        satisYn: satisYnVal,
        satisContent: satisContentVal,
        satisCd: satisCdVal,
      },
    }

    // svcTy=C + subTy=SURVEY 에이전트 — 질의를 readonly survey 메시지로 렌더
    if (isSurveyChatLogRow(row, agents)) {
      const surveyAnswers = parseSurveyAnswersFromPrompt(row.qcontent ?? '')
      return [
        {
          logId: `${logId}-survey`,
          type: 'survey',
          createdAt,
          agentId,
          surveyAnswers,
          surveySubmitted: true,
        },
        {
          ...answerMessage,
          ...(Object.keys(surveyAnswers).length > 0 ? { surveyAnswers } : {}),
        },
      ]
    }

    // TodayMeme 에이전트: 프롬프트 패턴이면 readonly meme 메시지로 대체
    if (agentId === 'AG000011' && isTodayMemePrompt(row.qcontent ?? '')) {
      const memeDisplayItems = parseTodayMemeItems(String(row.rcontent ?? ''))
      return [
        {
          logId: `${logId}-today-meme`,
          type: 'meme',
          createdAt,
          agentId,
          memeSubmitted: true,
          ...(memeDisplayItems.length > 0 ? { memeDisplayItems } : {}),
        },
        answerMessage,
      ]
    }

    // NewsCurator: question을 readonly news 카드로 대체, answer 행은 숨김(점심 카드와 동일)
    const newsPromptMeta = parseNewsCuratorPromptMeta(row.qcontent ?? '')
    if (agentId === NEWS_CURATOR_AGENT_ID && newsPromptMeta.isHiddenQuestion) {
      const newsDisplayItems = parseNewsCuratorItems(String(row.rcontent ?? ''))
      return [
        {
          logId: `${logId}-news-curator`,
          type: 'news',
          createdAt,
          agentId,
          newsSubmitted: true,
          newsSelectedCategories: newsPromptMeta.categories,
          newsIsNew: newsPromptMeta.isNew === true,
          ...(newsDisplayItems.length > 0 ? { newsDisplayItems } : {}),
        },
        { ...answerMessage, hiddenFromDisplay: true },
      ]
    }

    // RECOMMEND 에이전트: q(폼) 카드 + r(추천) 카드 분리, answer 행은 숨김
    const recommendConfig = agentId ? resolveRecommendConfigByAgentId(agentId, agents) : null
    const recommendMessages = buildRecommendMessagesFromLogRow(row, answerMessage, recommendConfig)
    if (recommendMessages) return recommendMessages

    const translateConfig = agentId ? resolveTranslateConfigByAgentId(agentId, agents) : null
    const qcontent = row.qcontent ?? ''
    if (translateConfig) {
      const defaultPayload = createEmptyTranslateFormPayload(translateConfig)
      const parsedPayload = parseTranslatePayloadFromPrompt(qcontent, defaultPayload, attachments ?? [])
      return [
        createReadonlyTranslateMessage(parsedPayload, {
          agentId,
          createdAt,
          svcTy,
          refId,
        }),
        answerMessage,
      ]
    }

    // 방에 RECOMMEND agentId가 남아 있어도 일반 질문이면 Q/A로 표시 (검색기록 재진입 시 answer 숨김 방지)
    const isStaleRecommendAgentId = !!recommendConfig && !isRecommendAgentPrompt(qcontent)
    const isStaleTranslateAgentId = false // translateConfig 있으면 위에서 이미 return
    const shouldOmitAgentId = isStaleRecommendAgentId || isStaleTranslateAgentId
    const questionMessage: ChatMessage = {
      logId,
      type: 'question',
      qContent: qcontent,
      rContent: '',
      createdAt,
      svcTy,
      modelId,
      refId,
      ...(agentId && !shouldOmitAgentId ? { agentId } : {}),
      ...(attachments?.length ? { attachments } : {}),
    }
    if (shouldOmitAgentId) {
      const { agentId: _omitAgentId, ...answerWithoutStaleAgent } = answerMessage
      return [questionMessage, answerWithoutStaleAgent]
    }

    return [questionMessage, answerMessage]
  }

  // question 메시지 생성 + push
  const pushQuestionMessage = (
    content: string,
    svcTy: string,
    modelId: string,
    refId: string,
    agentId?: string,
    attachments?: ChatMessageAttachment[],
  ): string => {
    const logId = Date.now().toString()
    const trimmedAgentId = typeof agentId === 'string' ? agentId.trim() : ''
    // 새 질문 전송 시 이전 답변에 대한 다음 추천 질문은 더 이상 의미 없으므로 초기화
    resetNextQuestions()
    stoppedByUser.value = false
    messages.value.push({
      id: logId,
      logId,
      type: 'question',
      qContent: content,
      rContent: '',
      svcTy,
      modelId,
      refId,
      ...(trimmedAgentId ? { agentId: trimmedAgentId } : {}),
      createdAt: new Date().toISOString(),
      ...(attachments?.length ? { attachments } : {}),
    })
    return logId
  }
  // answer placeholder 생성 + push + pendingMessageId 설정
  const pushAnswerPlaceholder = (svcTy: string, modelId: string, refId: string, agentId?: string): string => {
    const logId = (Date.now() + 1).toString()
    const trimmedAgentId = typeof agentId === 'string' ? agentId.trim() : ''
    pendingMessageId.value = logId
    messages.value.push({
      id: logId,
      logId,
      type: 'answer',
      qContent: '',
      rContent: '',
      svcTy,
      modelId,
      refId,
      ...(trimmedAgentId ? { agentId: trimmedAgentId } : {}),
      createdAt: new Date().toISOString(),
      isStreaming: true,
      hasSource: false,
      hasVisualization: false,
      ...(trimmedAgentId === NEWS_CURATOR_AGENT_ID ? { hiddenFromDisplay: true } : {}),
    })
    return logId
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
      if (isNewsCuratorAnswerMessage(streamingMessage)) {
        applyNewsDisplayItemsToSubmitCard(messages.value, String(streamingMessage.rContent ?? ''))
      }
    }
    pendingMessageId.value = null
  }

  // 스트리밍 오류 처리
  const updateStreamingError = (errorText: string) => {
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    if (!streamingMessage) return
    // 스트리밍 메시지 오류 처리
    streamingMessage.rContent = errorText
    streamingMessage.isStreaming = false
    streamingMessage.hasSource = false
    streamingMessage.hasVisualization = false
    messageBufferMap.value[streamingMessage.logId] = ''
    pendingMessageId.value = null
  }
  return {
    messages,
    pendingMessageId,
    messageBufferMap,
    nextQuestions,
    isGeneratingNextQuestions,
    resetNextQuestions,
    startWaitingNextQuestions,
    setNextQuestions,
    stoppedByUser,
    markStoppedByUser,
    getMessagesForVisualization,
    toHtmlContent,
    logRowToMessages,
    pushQuestionMessage,
    pushAnswerPlaceholder,
    getStreamingMessage,
    finalizeStreamingMessage,
    updateStreamingError,
  }
}

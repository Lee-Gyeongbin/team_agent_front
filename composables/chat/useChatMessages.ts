import type {
  ChatGroundingSourceItem,
  ChatLogListRow,
  ChatMessage,
  ChatMessageAttachment,
  LunchAgentFormPayload,
} from '~/types/chat'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseChatAttachmentsFromLogRow } from '~/utils/chat/chatAttachmentDisplayUtil'
import { parseSurveyAnswersFromPrompt } from '~/utils/chat/surveyUtil'
import {
  normalizeLunchRecommendationImages,
  parseLunchPayloadFromPrompt,
  parseLunchJsonArray,
} from '~/utils/chat/lunchAgentUtil'
import { isTodayMemePrompt, parseTodayMemeItems } from '~/utils/chat/todayMemeUtil'
import {
  applyNewsDisplayItemsToSubmitCard,
  isNewsCuratorAnswerMessage,
  NEWS_CURATOR_AGENT_ID,
  parseNewsCuratorItems,
  parseNewsCuratorPromptMeta,
} from '~/utils/chat/newsCuratorUtil'

// 채팅 메시지/스트리밍 상태는 모듈 레벨에서 단일 인스턴스로 공유
const messages = ref<ChatMessage[]>([])
const pendingMessageId = ref<string | null>(null)
const messageBufferMap = ref<Record<string, string>>({})

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
  const logRowToMessages = (row: ChatLogListRow): ChatMessage[] => {
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
      chatLogReaction: {
        logId,
        satisYn: satisYnVal,
        satisContent: satisContentVal,
        satisCd: satisCdVal,
      },
    }

    // SURVEY 에이전트: "진단 프롬프트"인 경우에만 readonly survey 메시지로 대체
    const surveyAnswers = parseSurveyAnswersFromPrompt(row.qcontent ?? '')
    const isSurveyPrompt = Object.keys(surveyAnswers).length > 0
    if (isSurveyPrompt) {
      return [
        {
          logId: `${logId}-survey`,
          type: 'survey',
          createdAt,
          agentId,
          surveyAnswers,
          surveySubmitted: true,
        },
        { ...answerMessage, surveyAnswers },
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

    // 점심 추천 에이전트: q(폼) 카드 + r(추천) 카드 분리, answer 행은 숨김
    const lunchPayload = parseLunchPayloadFromPrompt(row.qcontent ?? '')
    if (lunchPayload) {
      const lunchDisplayRecommendations = normalizeLunchRecommendationImages(
        parseLunchJsonArray(String(row.rcontent ?? '')),
      )
      const lunchAgentFields = {
        createdAt,
        svcTy,
        modelId,
        refId,
        ...(agentId ? { agentId } : {}),
        hasSource: false,
        hasVisualization: false,
      }
      return [
        {
          logId: `${logId}-lunch-form`,
          type: 'lunch',
          lunchCardRole: 'form',
          qContent: '',
          rContent: '',
          lunchSubmitted: true,
          lunchFormPayload: { ...lunchPayload },
          ...lunchAgentFields,
        },
        {
          logId: `${logId}-lunch-result`,
          type: 'lunch',
          lunchCardRole: 'result',
          qContent: '',
          rContent: '',
          lunchSubmitted: true,
          lunchDisplayRecommendations,
          lunchAnswerLogId: logId,
          ...lunchAgentFields,
        },
        { ...answerMessage, hiddenFromDisplay: true },
      ]
    }

    return [
      {
        logId,
        type: 'question',
        qContent: row.qcontent ?? '',
        rContent: '',
        createdAt,
        svcTy,
        modelId,
        refId,
        ...(agentId ? { agentId } : {}),
        ...(attachments?.length ? { attachments } : {}),
      },
      answerMessage,
    ]
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

  /** 점심 추천 */
  const setStreamingLunchPayload = (payload: LunchAgentFormPayload) => {
    const msg = getStreamingMessage()
    if (msg) msg.lunchFormPayload = { ...payload }
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
    getMessagesForVisualization,
    toHtmlContent,
    logRowToMessages,
    pushQuestionMessage,
    pushAnswerPlaceholder,
    setStreamingLunchPayload,
    getStreamingMessage,
    finalizeStreamingMessage,
    updateStreamingError,
  }
}

import type { ChatGroundingSourceItem, ChatLogListRow, ChatMessage, ChatMessageAttachment } from '~/types/chat'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseChatAttachmentsFromLogRow } from '~/utils/chat/chatAttachmentDisplayUtil'
import { parseSurveyAnswersFromPrompt } from '~/utils/chat/psychologyConsultUtil'
import { parseLunchPayloadFromPrompt } from '~/utils/chat/lunchAgentUtil'

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
        const parsed = JSON.parse(wg) as { items?: { url?: string; title?: string }[] }
        if (Array.isArray(parsed.items)) {
          groundingSources = parsed.items.map((it) => ({
            url: String(it?.url ?? ''),
            ...(it?.title != null && String(it.title).length > 0 ? { title: String(it.title) } : {}),
          }))
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
      ...(groundingSources?.length ? { groundingSources } : {}),
      chatLogReaction: {
        logId,
        satisYn: satisYnVal,
        satisContent: satisContentVal,
        satisCd: satisCdVal,
      },
    }

    // 산업심리 상담 에이전트: "진단 프롬프트"인 경우에만 readonly survey 메시지로 대체
    // (후속 일반 대화 질문까지 survey로 잘못 렌더링되는 문제 방지)
    if (agentId === 'AG000010') {
      const surveyAnswers = parseSurveyAnswersFromPrompt(row.qcontent ?? '')
      const isSurveyPrompt = Object.keys(surveyAnswers).length === 25
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
          answerMessage,
        ]
      }
    }

    // 점심 추천 에이전트: 프롬프트 패턴이면 readonly lunch-card로 대체 (새로고침 복원)
    const lunchPayload = parseLunchPayloadFromPrompt(row.qcontent ?? '')
    if (lunchPayload) {
      return [
        {
          logId: `${logId}-lunch-card`,
          type: 'answer',
          qContent: '',
          rContent: '',
          createdAt,
          svcTy,
          modelId,
          refId,
          ...(agentId ? { agentId } : {}),
          uiType: 'lunch-card',
          lunchSubmitted: true,
          lunchFormPayload: { ...lunchPayload },
          hasSource: false,
          hasVisualization: false,
        },
        answerMessage,
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
    getStreamingMessage,
    finalizeStreamingMessage,
    updateStreamingError,
  }
}

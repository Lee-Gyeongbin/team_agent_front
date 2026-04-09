import type { ChatLogListRow, ChatMessage, ChatMessageAttachment } from '~/types/chat'
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import { parseChatAttachmentsFromLogRow } from '~/utils/chat/chatAttachmentDisplayUtil'

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
    const docId = typeof row.docId === 'string' ? row.docId : ''
    const hasSource = row.docExist === 'Y'
    const hasVisualization = row.tableExist === 'Y'
    const satisYnVal = typeof row.satisYn === 'string' ? row.satisYn : ''
    const satisContentVal = typeof row.satisContent === 'string' ? row.satisContent : ''
    const satisCdVal = typeof row.satisCd === 'string' ? row.satisCd : undefined
    const attachments = parseChatAttachmentsFromLogRow(row)
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
      {
        logId,
        type: 'answer',
        qContent: '',
        /** 마크다운 원문 — 화면에서는 ChatMessageItem에서 toHtmlContent로 렌더 */
        rContent: row.rcontent ?? '',
        svcTy,
        modelId,
        refId,
        ...(agentId ? { agentId } : {}),
        docId,
        createdAt,
        hasSource,
        hasVisualization,
        visualizationData: {
          sql: row.ttsq ?? '',
          chartTitle: '',
        },
        tableData: typeof row.tableData === 'string' ? row.tableData : undefined,
        chatLogReaction: {
          logId,
          satisYn: satisYnVal,
          satisContent: satisContentVal,
          satisCd: satisCdVal,
        },
      },
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

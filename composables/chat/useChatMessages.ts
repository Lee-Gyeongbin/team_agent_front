import type { ChatLogListRow, ChatMessage } from '~/types/chat'

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
  // HTML 콘텐츠 변환
  const toHtmlContent = (value: string) => {
    // 서버에서 내려주는 내용을 최대한 그대로 사용하되
    // 개행 코드(\r\n, \n, 문자열 "\n")만 <br>로 치환해서 줄바꿈만 처리
    const normalized = value.replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
    return normalized.replace(/\n/g, '<br>')
  }

  // API 로그 한 건 → question + answer 메시지 쌍으로 변환
  const logRowToMessages = (row: ChatLogListRow): ChatMessage[] => {
    const logId = String(row.logId ?? '')
    const createdAt = row.createDt ?? ''
    const svcTy = row.svcTy ?? 'C'
    const modelId = row.modelId ?? 'all'
    const refId = row.refId ?? ''
    const docId = typeof row.docId === 'string' ? row.docId : ''
    const hasSource = row.docExist === 'Y'
    const hasVisualization = row.tableExist === 'Y'
    const satisYnVal = typeof row.satisYn === 'string' ? row.satisYn : ''
    const satisContentVal = typeof row.satisContent === 'string' ? row.satisContent : ''
    const satisCdVal = typeof row.satisCd === 'string' ? row.satisCd : undefined
    return [
      { logId, type: 'question', qContent: row.qcontent ?? '', rContent: '', createdAt, svcTy, modelId, refId },
      {
        logId,
        type: 'answer',
        qContent: '',
        rContent: toHtmlContent(row.rcontent ?? ''),
        svcTy,
        modelId,
        refId,
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
  const pushQuestionMessage = (content: string, svcTy: string, modelId: string, refId: string): string => {
    const logId = Date.now().toString()
    messages.value.push({
      id: logId,
      logId,
      type: 'question',
      qContent: content,
      rContent: '',
      svcTy,
      modelId,
      refId,
      createdAt: new Date().toISOString(),
    })
    return logId
  }
  // answer placeholder 생성 + push + pendingMessageId 설정
  const pushAnswerPlaceholder = (svcTy: string, modelId: string, refId: string): string => {
    const logId = (Date.now() + 1).toString()
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
    streamingMessage.rContent = `<p>${errorText}</p>`
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

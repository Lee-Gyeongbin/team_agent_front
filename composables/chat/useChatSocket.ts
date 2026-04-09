import type { ChatSocketMessage, ChatSocketPayload } from '~/types/chat'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { getWebSocketUrl } from '~/utils/chat/chatWebSocketUtil'
const {
  messages,
  pendingMessageId,
  messageBufferMap,
  getStreamingMessage,
  finalizeStreamingMessage,
  updateStreamingError,
} = useChatMessages()

export const useChatSocket = () => {
  // 웹소켓 관련 (WebSocket은 앱 전역에서 단일 인스턴스로 공유)
  const WEBSOCKET_OPEN = 1
  const WEBSOCKET_CONNECTING = 0
  const chatbotSocket = shallowRef<WebSocket | null>(null)

  // WebSocket 연결 확인 + 페이로드 전송 (실패 시 false 반환)
  const ensureWebSocketAndSend = async (payload: ChatSocketPayload): Promise<boolean> => {
    if (!chatbotSocket.value || chatbotSocket.value.readyState !== WEBSOCKET_OPEN) {
      openLoading({ text: '서버에 연결하는 중...' })
      try {
        await connectWebSocket()
      } finally {
        closeLoading()
      }
    }
    if (chatbotSocket.value?.readyState !== WEBSOCKET_OPEN) {
      updateStreamingError('연결 오류가 발생했습니다. 다시 시도해주세요.')
      return false
    }
    try {
      chatbotSocket.value.send(JSON.stringify(payload))
      return true
    } catch (error) {
      console.error('웹소켓 메시지 전송 실패:', error)
      updateStreamingError('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      return false
    }
  }
  // WebSocket 메시지 처리
  const handleWebSocketMessage = (payload: ChatSocketMessage) => {
    // connected, question_received는 답변 메시지가 없어도 처리 가능
    if (payload.type === 'connected' || payload.type === 'question_received') return
    // 현재 스트리밍 메시지 찾기
    const streamingMessage = getStreamingMessage()
    if (!streamingMessage) return

    // WebSocket 메시지 타입에 따라 처리
    switch (payload.type) {
      // 스트리밍 메시지 처리
      case 'chunk': {
        // 다음 청크 내용 가져오기
        const nextChunk = payload.content ?? ''
        // 이전 버퍼 내용 가져오기
        const prevBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        // 이전 버퍼와 다음 청크 내용 병합
        const mergedBuffer = `${prevBuffer}${nextChunk}`
        // 버퍼 업데이트
        messageBufferMap.value[streamingMessage.logId] = mergedBuffer
        // 스트리밍 메시지 업데이트
        streamingMessage.rContent = mergedBuffer
        streamingMessage.isStreaming = true
        break
      }
      case 'complete': {
        // chunk 없이 complete로만 응답이 온 경우를 대비해 최종 본문을 fallback 반영
        const completeContent = payload.content ?? ''
        // 현재 버퍼 내용 가져오기
        const currentBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        // 렌더링된 콘텐츠 여부 확인
        const hasRenderedContent = Boolean(currentBuffer || streamingMessage.rContent)
        // 콘텐츠가 있고 렌더링되지 않은 경우 버퍼 업데이트
        if (completeContent && !hasRenderedContent) {
          // 버퍼 업데이트
          messageBufferMap.value[streamingMessage.logId] = completeContent
          // 스트리밍 메시지 업데이트
          streamingMessage.rContent = completeContent
        }
        // 서버 logId가 있으면 question + answer 메시지에 반영
        if (payload.logId) {
          const oldLogId = streamingMessage.logId
          // 버퍼 키를 서버 logId로 마이그레이션
          messageBufferMap.value[payload.logId] = messageBufferMap.value[oldLogId] || ''
          messageBufferMap.value[oldLogId] = ''
          // answer 메시지 logId 갱신
          streamingMessage.logId = payload.logId
          // 직전 question 메시지 logId 갱신
          const idx = messages.value.indexOf(streamingMessage)
          if (idx > 0 && messages.value[idx - 1].type === 'question') {
            const pairedQuestion = messages.value[idx - 1]
            pairedQuestion.logId = payload.logId
            // 재생성 시 질문 기준으로 전송할 수 있도록 질문 메타를 보정
            pairedQuestion.svcTy = pairedQuestion.svcTy ?? streamingMessage.svcTy ?? 'C'
            pairedQuestion.refId = pairedQuestion.refId ?? streamingMessage.refId ?? 'all'
          }
          // pendingMessageId도 서버 logId로 갱신 (finalizeStreamingMessage에서 조회 가능하도록)
          pendingMessageId.value = payload.logId
        }
        streamingMessage.hasSource = !!payload.docFileId
        streamingMessage.hasVisualization = !!payload.tableData
        if (payload.tableData !== undefined && payload.tableData !== '') {
          streamingMessage.tableData = payload.tableData
        }
        // 스트리밍 메시지 완료 처리
        finalizeStreamingMessage()
        break
      }
      case 'error': {
        // 이미 답변이 조금이라도 렌더링/버퍼링 된 상태면
        // 사용자 경험상 "오류"로 덮어쓰지 말고 무시(또는 경고로만)
        const currentBuffer = messageBufferMap.value[streamingMessage.logId] || ''
        const hasRendered = Boolean(currentBuffer || streamingMessage.rContent)
        if (!hasRendered) {
          updateStreamingError(payload.content || '응답 처리 중 오류가 발생했습니다.')
        } else {
          // 필요하면 콘솔만 남기기
          console.warn('[chat] streaming error after partial content:', payload.content)
        }
        break
      }
      default:
        break
    }
  }

  // WebSocket 연결 종료
  const disconnectWebSocket = () => {
    if (chatbotSocket.value) {
      chatbotSocket.value.close()
      chatbotSocket.value = null
    }
  }

  // WebSocket 연결
  const connectWebSocket = (): Promise<void> => {
    // WebSocket 연결 상태 확인
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      // 현재 WebSocket 연결 상태 확인
      const currentSocket = chatbotSocket.value
      if (currentSocket?.readyState === WEBSOCKET_OPEN) {
        resolve()
        return
      }
      // WebSocket 연결 중인 경우
      if (currentSocket?.readyState === WEBSOCKET_CONNECTING) {
        const onOpen = () => {
          currentSocket.removeEventListener('open', onOpen)
          resolve()
        }
        currentSocket.addEventListener('open', onOpen)
        return
      }

      // 기존 WebSocket 연결이 있으면 닫기
      if (currentSocket) {
        currentSocket.close()
        chatbotSocket.value = null
      }

      try {
        // WebSocket 연결 시도
        const socket = new WebSocket(getWebSocketUrl())
        chatbotSocket.value = socket

        // WebSocket 연결 성공 시
        socket.onopen = () => resolve()

        // WebSocket 메시지 수신 시
        socket.onmessage = (event) => {
          try {
            // WebSocket 메시지 파싱
            const payload = JSON.parse(event.data) as ChatSocketMessage
            // WebSocket 메시지 처리
            handleWebSocketMessage(payload)
          } catch (error) {
            console.error('웹소켓 메시지 파싱 오류:', error)
          }
        }

        socket.onerror = (error) => {
          console.error('웹소켓 연결 오류:', error)
        }

        socket.onclose = () => {
          chatbotSocket.value = null
        }
      } catch (error) {
        console.error('WebSocket 초기화 실패:', error)
        resolve()
      }
    })
  }

  // WebSocket 연결 시작
  const startChatSocket = () => {
    void connectWebSocket()
  }

  // WebSocket 연결 종료
  const stopChatSocket = () => {
    disconnectWebSocket()
  }
  return {
    chatbotSocket,
    startChatSocket,
    stopChatSocket,
    messages,
    pendingMessageId,
    messageBufferMap,
    ensureWebSocketAndSend,
    handleWebSocketMessage,
    disconnectWebSocket,
    connectWebSocket,
  }
}

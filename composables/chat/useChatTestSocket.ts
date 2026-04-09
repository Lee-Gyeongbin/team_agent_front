import type { ChatSocketMessage, ChatSocketPayload } from '~/types/chat'
import { getWebSocketUrl } from '~/utils/chat/chatWebSocketUtil'

const testSocket = shallowRef<WebSocket | null>(null)
const testResponseText = ref('')
const isTestStreaming = ref(false)
const testErrorText = ref('')
const testBuffer = ref('')

export const useChatTestSocket = () => {
  /** 모델 테스트 소켓 메시지 처리 TODO : api url payload 필드 추가 */
  const handleTestSocketMessage = (payload: ChatSocketMessage) => {
    if (payload.type === 'connected' || payload.type === 'question_received') return

    switch (payload.type) {
      case 'chunk': {
        const nextChunk = payload.content ?? ''
        testBuffer.value = `${testBuffer.value}${nextChunk}`
        testResponseText.value = testBuffer.value
        break
      }
      case 'complete': {
        const completeContent = payload.content ?? ''
        if (completeContent && !testBuffer.value) {
          testBuffer.value = completeContent
          testResponseText.value = completeContent
        }
        isTestStreaming.value = false
        break
      }
      case 'error': {
        if (!testBuffer.value) {
          testErrorText.value = payload.content || '응답 처리 중 오류가 발생했습니다.'
        }
        isTestStreaming.value = false
        break
      }
      default:
        break
    }
  }

  const disconnectTestSocket = () => {
    if (testSocket.value) {
      testSocket.value.close()
      testSocket.value = null
    }
    testResponseText.value = ''
    isTestStreaming.value = false
    testErrorText.value = ''
    testBuffer.value = ''
  }

  const sendTestMessage = async (query: string, modelId: string) => {
    testResponseText.value = ''
    testErrorText.value = ''
    testBuffer.value = ''
    isTestStreaming.value = true

    disconnectTestSocket()
    isTestStreaming.value = true

    // 모델 테스트용 — 임시 threadId만 사용
    const threadId = `modelTest-${Date.now()}`

    try {
      const socket = new WebSocket(getWebSocketUrl())
      testSocket.value = socket

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ChatSocketMessage
          handleTestSocketMessage(payload)
        } catch (error) {
          console.error('[test] 웹소켓 메시지 파싱 오류:', error)
        }
      }

      socket.onerror = (error) => {
        console.error('[test] 웹소켓 연결 오류:', error)
        testErrorText.value = '연결 오류가 발생했습니다.'
        isTestStreaming.value = false
      }

      socket.onclose = () => {
        testSocket.value = null
      }

      socket.onopen = () => {
        const socketPayload: ChatSocketPayload = {
          type: 'question',
          query,
          threadId,
          svcTy: 'llmTest',
          modelId: modelId,
          refId: 'test',
        }
        socket.send(JSON.stringify(socketPayload))
      }
    } catch (error) {
      console.error('[test] 테스트 메시지 전송 실패:', error)
      testErrorText.value = '메시지 전송에 실패했습니다.'
      isTestStreaming.value = false
    }
  }

  return {
    // 모델 테스트 전용 (LlmTestModal)
    testResponseText,
    isTestStreaming,
    testErrorText,
    sendTestMessage,
    disconnectTestSocket,
  }
}

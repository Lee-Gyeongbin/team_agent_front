import { useApi } from '~/composables/com/useApi'
import type { ChatMessage } from '~/types/chat'

export const useReportsApi = () => {
  const { post } = useApi()
  const sendMessage = async (userId: string, password: string): Promise<ChatMessage> => {
    const res = await post<ChatMessage>('/api/chat/sendMessage', { userId, password })
    return res
  }

  return {
    sendMessage,
  }
}

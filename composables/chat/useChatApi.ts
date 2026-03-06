import { useApi } from '~/composables/com/useApi'
import type { ChatRoom } from '~/types/chat'

export const useReportsApi = () => {
  const { post } = useApi()
  const fetchCreateChatRoom = async (svcTy: string, content: string): Promise<{ data: ChatRoom }> => {
    return post<{ data: ChatRoom }>('/api/ai/chatbot/createChatRoom.do', { svcTy, content })
  }

  return {
    fetchCreateChatRoom,
  }
}

import { useApi } from '~/composables/com/useApi'
import type { ModelOption, ChatRoom } from '~/types/chat'

export const useReportsApi = () => {
  const { get, post } = useApi()
  const fetchSelectModelList = async (): Promise<{ modelList: ModelOption[] }> => {
    return get<{ modelList: ModelOption[] }>('/api/ai/chatbot/selectModelList.do')
  }
  const fetchCreateChatRoom = async (svcTy: string, content: string): Promise<{ data: ChatRoom }> => {
    return post<{ data: ChatRoom }>('/api/ai/chatbot/createChatRoom.do', { svcTy, content })
  }

  return {
    fetchSelectModelList,
    fetchCreateChatRoom,
  }
}

import { useApi } from '~/composables/com/useApi'
import type { ModelOption, SubOption, ChatRoom, ChatLogListRow, ChatRefRow } from '~/types/chat'

export const useReportsApi = () => {
  const { get, post } = useApi()
  const fetchSelectModelList = async (): Promise<{ modelList: ModelOption[] }> => {
    return get<{ modelList: ModelOption[] }>('/ai/chatbot/selectModelList.do')
  }
  const fetchSelectRagDsList = async (): Promise<{ subOptionList: SubOption[] }> => {
    return get<{ subOptionList: SubOption[] }>('/ai/chatbot/selectRagDsList.do')
  }
  const fetchSelectDmList = async (): Promise<{ subOptionList: SubOption[] }> => {
    return get<{ subOptionList: SubOption[] }>('/ai/chatbot/selectDmList.do')
  }
  const fetchCreateChatRoom = async (content: string, svcTy: string): Promise<{ data: ChatRoom }> => {
    return post<{ data: ChatRoom }>('/ai/chatbot/createChatRoom.do', { content, svcTy })
  }
  const fetchSelectChatLogList = async (roomId: string): Promise<{ list: ChatLogListRow[] }> => {
    return get<{ list: ChatLogListRow[] }>(`/ai/chatbot/selectChatLogList.do?roomId=${encodeURIComponent(roomId)}`)
  }

  const fetchSelectChatRef = async (logId: string): Promise<{ list: ChatRefRow[] }> => {
    return get<{ list: ChatRefRow[] }>(`/ai/chatbot/selectChatDocList.do?logId=${encodeURIComponent(logId)}`)
  }

  return {
    fetchSelectModelList,
    fetchSelectRagDsList,
    fetchSelectDmList,
    fetchCreateChatRoom,
    fetchSelectChatLogList,
    fetchSelectChatRef,
  }
}

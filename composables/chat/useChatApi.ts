import { useApi } from '~/composables/com/useApi'
import type { ModelOption, SubOption, ChatRoom, ChatLogListRow, ChatRefRow, VisualizationDataRow } from '~/types/chat'

export const useReportsApi = () => {
  const { get, post } = useApi()
  // 모델 목록 조회
  const fetchSelectModelList = async (): Promise<{ modelList: ModelOption[] }> => {
    return get<{ modelList: ModelOption[] }>('/ai/chatbot/selectModelList.do')
  }
  // RAG 데이터 목록 조회
  const fetchSelectRagDsList = async (): Promise<{ subOptionList: SubOption[] }> => {
    return get<{ subOptionList: SubOption[] }>('/ai/chatbot/selectRagDsList.do')
  }
  // 데이터마트 조회
  const fetchSelectDmList = async (): Promise<{ subOptionList: SubOption[] }> => {
    return get<{ subOptionList: SubOption[] }>('/ai/chatbot/selectDmList.do')
  }
  // CHAT 대화방 등록
  const fetchCreateChatRoom = async (content: string, svcTy: string): Promise<{ data: ChatRoom }> => {
    return post<{ data: ChatRoom }>('/ai/chatbot/createChatRoom.do', { content, svcTy })
  }
  // CHAT 대화방 로그 목록 조회
  const fetchSelectChatLogList = async (roomId: string): Promise<{ list: ChatLogListRow[] }> => {
    return get<{ list: ChatLogListRow[] }>(`/ai/chatbot/selectChatLogList.do?roomId=${encodeURIComponent(roomId)}`)
  }
  // 참조 문서 목록 조회
  const fetchSelectChatRef = async (logId: string): Promise<{ list: ChatRefRow[] }> => {
    return get<{ list: ChatRefRow[] }>(`/ai/chatbot/selectChatDocList.do?logId=${encodeURIComponent(logId)}`)
  }
  // 시각화 데이터 목록 조회
  const fetchSelectTableDataList = async (logId: string): Promise<{ list: VisualizationDataRow[] }> => {
    return get<{ list: VisualizationDataRow[] }>(`/ai/chatbot/selectTableDataList.do?logId=${encodeURIComponent(logId)}`)
  }
  return {
    fetchSelectModelList,
    fetchSelectRagDsList,
    fetchSelectDmList,
    fetchCreateChatRoom,
    fetchSelectChatLogList,
    fetchSelectChatRef,
    fetchSelectTableDataList,
  }
}

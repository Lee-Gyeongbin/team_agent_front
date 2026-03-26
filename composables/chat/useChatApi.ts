import { useApi } from '~/composables/com/useApi'
import type {
  ModelOption,
  SubOption,
  ChatRoom,
  ChatLogListRow,
  ChatRefRow,
  VisualizationDataRow,
  VisualizationStatDetailItem,
  VisualizationStatItem,
  SaveChatLogReactionResponse,
  KnowledgeItem,
} from '~/types/chat'

export const useReportsApi = () => {
  const { get, post } = useApi()
  // 채팅방 목록 조회
  const fetchSelectChatRoomList = async (userId: string): Promise<{ list: ChatRoom[] }> => {
    return get<{ list: ChatRoom[] }>(`/ai/chatbot/selectChatRoomList.do?userId=${encodeURIComponent(userId)}`)
  }
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
  // 좋아요/싫어요 등록
  const fetchCreateChatLogReaction = async (
    logId: string,
    satisYn: string,
    satisContent?: string,
  ): Promise<SaveChatLogReactionResponse> => {
    return post<SaveChatLogReactionResponse>('/ai/chatbot/saveSatisYn.do', { logId, satisYn, satisContent })
  }
  // 시각화 데이터 목록 조회
  const fetchSelectTableDataList = async ({
    logId,
  }: {
    logId: string
  }): Promise<{
    list: VisualizationDataRow[]
    statList?: VisualizationStatItem[]
    statDetailList?: VisualizationStatDetailItem[]
  }> => {
    return get<{
      list: VisualizationDataRow[]
      statList?: VisualizationStatItem[]
      statDetailList?: VisualizationStatDetailItem[]
    }>(`/ai/chatbot/selectTableDataList.do?logId=${encodeURIComponent(logId)}`)
  }
  // 카테고리 목록 조회
  const fetchSelectKnowledgeList = async (): Promise<{ dataList: KnowledgeItem[] }> => {
    return get<{ dataList: KnowledgeItem[] }>('/ai/chatbot/selectKnowledgeList.do')
  }
  // 지식창고 저장
  const fetchCreateKnowledge = async (logId: string, categoryId: string): Promise<void> => {
    return post('/ai/chatbot/saveKnowledge.do', { logId, categoryId })
  }
  // 채팅방 고정
  const fetchPinChatRoom = async (room: ChatRoom): Promise<void> => {
    return post('/ai/chatbot/pinChatRoom.do', { roomId: room.roomId })
  }
  return {
    fetchSelectChatRoomList,
    fetchSelectModelList,
    fetchSelectRagDsList,
    fetchSelectDmList,
    fetchCreateChatRoom,
    fetchSelectChatLogList,
    fetchSelectChatRef,
    fetchSelectTableDataList,
    fetchCreateChatLogReaction,
    fetchSelectKnowledgeList,
    fetchCreateKnowledge,
    fetchPinChatRoom,
  }
}

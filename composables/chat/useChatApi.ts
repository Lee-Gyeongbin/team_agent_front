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
  ChatFileSavePayload,
  ChatFileSaveResponse,
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
  // CHAT 첨부파일 메타 저장 (응답 본문은 JSON 최상위 — useApi는 axios처럼 data로 감싸지 않음)
  const fetchCreateChatFile = async (payload: ChatFileSavePayload): Promise<ChatFileSaveResponse> => {
    return post<ChatFileSaveResponse>('/ai/chatbot/saveChatFile.do', payload)
  }
  // CHAT 첨부파일 orphan 표기 (ws 전송 실패 등)
  const fetchMarkChatFileOrphan = async (chatFileIdList: string[]): Promise<{ successYn?: boolean }> => {
    return post<{ successYn?: boolean }>('/ai/chatbot/markChatFileOrphan.do', { chatFileIdList })
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
    /** 싫어요 시 공통코드(CD000001) 선택 사유 코드 */
    satisCd?: string,
  ): Promise<SaveChatLogReactionResponse> => {
    return post<SaveChatLogReactionResponse>('/ai/chatbot/saveSatisYn.do', {
      logId,
      satisYn,
      satisContent,
      ...(satisCd ? { satisCd } : {}),
    })
  }
  // 시각화 데이터 목록 조회
  const fetchSelectTableDataList = async ({
    logId,
  }: {
    logId: string
  }): Promise<{
    statList?: VisualizationStatItem[]
    statDetailList?: VisualizationStatDetailItem[]
  }> => {
    return get<{
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
  // 채팅방 이름 변경
  const fetchRenameChatRoom = async (roomId: string, roomTitle: string): Promise<void> => {
    return post('/ai/chatbot/renameChatRoom.do', { roomId, roomTitle })
  }
  // 채팅방 삭제
  const fetchDeleteChatRoom = async (roomId: string): Promise<void> => {
    return post('/ai/chatbot/deleteChatRoom.do', { roomId })
  }
  // 공유 토큰 발급 (roomId → UUID share token)
  const fetchCreateShareToken = async (roomId: string): Promise<{ shareToken: string }> => {
    return post<{ shareToken: string }>('/ai/chatbot/createShareToken.do', { roomId })
  }
  // 공유 토큰으로 채팅 로그 조회
  const fetchSelectSharedChatLogList = async (
    shareToken: string,
  ): Promise<{ list: ChatLogListRow[]; successYn: boolean; returnMsg: string }> => {
    return get<{ list: ChatLogListRow[]; successYn: boolean; returnMsg: string }>(
      `/ai/chatbot/selectSharedChatLogList.do?shareToken=${encodeURIComponent(shareToken)}`,
    )
  }
  // 공유 채팅방 복제 (대화 이어가기) TODO (프로토타입)
  const fetchCloneChatRoom = async (sourceRoomId: string): Promise<{ data: ChatRoom }> => {
    return post<{ data: ChatRoom }>('/ai/chatbot/cloneChatRoom.do', { sourceRoomId })
  }
  return {
    fetchSelectChatRoomList,
    fetchSelectModelList,
    fetchSelectRagDsList,
    fetchSelectDmList,
    fetchCreateChatRoom,
    fetchCreateChatFile,
    fetchMarkChatFileOrphan,
    fetchSelectChatLogList,
    fetchSelectChatRef,
    fetchSelectTableDataList,
    fetchCreateChatLogReaction,
    fetchSelectKnowledgeList,
    fetchCreateKnowledge,
    fetchPinChatRoom,
    fetchRenameChatRoom,
    fetchDeleteChatRoom,
    fetchCreateShareToken,
    fetchSelectSharedChatLogList,
    fetchCloneChatRoom,
  }
}

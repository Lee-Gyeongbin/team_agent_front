import { useApi } from '~/composables/com/useApi'
import type { ChatGuideItem, ChatGuideListResponse } from '~/types/com/chatGuide'

/** 챗봇 가이드 목록 조회 API */
export const useChatGuideApi = () => {
  const { get } = useApi()

  /** 안내멘트·인사멘트·오류메시지·점검/장애 등 가이드 전체 목록 조회 */
  const fetchChatGuideList = async (): Promise<ChatGuideItem[]> => {
    const res = await get<ChatGuideListResponse>('/chatGuideList.do')
    return res.list ?? []
  }

  return { fetchChatGuideList }
}

import type { ChatGuideItem, ChatGuideListResponse } from '~/types/com/chatGuide'
import { useApi } from '~/composables/com/useApi'

/** 챗봇 가이드 목록 조회 API */
export const useChatGuideApi = () => {
  const { get } = useApi()

  /** 안내멘트·인사멘트·오류메시지·점검/장애 등 가이드 전체 목록 조회 */
  const fetchChatGuideList = async (): Promise<ChatGuideItem[]> => {
    const res = await get<ChatGuideListResponse>('/chatGuideList.do')
    return res.list ?? res.dataList ?? []
  }

  /**
   * 로그인 전 점검/장애 공개 목록 조회 — 비로그인 공개 API
   * 401 리다이렉트 없이 실패 시 빈 배열 (로그인 화면용)
   */
  const fetchChatGuideMaintList = async (): Promise<ChatGuideItem[]> => {
    try {
      const response = await fetch('/api/chatGuideMaintList.do', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) return []
      const res = (await response.json()) as ChatGuideListResponse
      return res.list ?? res.dataList ?? []
    } catch {
      return []
    }
  }

  return { fetchChatGuideList, fetchChatGuideMaintList }
}

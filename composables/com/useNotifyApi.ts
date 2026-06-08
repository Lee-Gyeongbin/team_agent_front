import { useApi } from '~/composables/com/useApi'
import type { ActionResponse, Notify } from '~/types/global'
import type { KnowledgeItem } from '~/types/chat'
import type { LibraryCard } from '~/types/library'

/** 알림 관련 API */
export const useNotifyApi = () => {
  const { get, post } = useApi()

  /** 내 알림 목록 조회 */
  const fetchNotifyList = () => get<{ list: Notify[] }>('/selectNotifyList.do')

  /** 단건 읽음 처리 */
  const fetchMarkRead = (notifyId: number) => post<ActionResponse>('/updateNotifyRead.do', { notifyId })

  /** 전체 읽음 처리 */
  const fetchMarkAllRead = () => post<ActionResponse>('/updateNotifyAllRead.do', {})

  /** 알림 삭제 (USE_YN = 'N') */
  const fetchDismissNotify = (notifyId: number) => post<ActionResponse>('/deleteNotify.do', { notifyId })

  /** 지식창고 카테고리 전체 목록 조회 (지식공유 알림 받기용) */
  const fetchSelectCategoryList = () => get<{ dataList: KnowledgeItem[] }>('/selectCategoryList.do')

  /** 지식공유 알림 받기 — 선택한 카테고리로 지식 카드 복사 저장 */
  const fetchReceiveKnowledge = (categoryId: string, notify: Notify) =>
    post<ActionResponse>('/ai/chatbot/insertReceiveKnowledge.do', { ...notify, categoryId })

  /** 공유된 카드 상세 조회 — 모달 오픈 시 카드 프리뷰용 (thumbImg base64 분리 로딩) */
  const fetchSharedCardDetail = (refId: string) => post<{ data: LibraryCard }>('/selectSharedCardInfo.do', { refId })

  return {
    fetchNotifyList,
    fetchMarkRead,
    fetchMarkAllRead,
    fetchDismissNotify,
    fetchSelectCategoryList,
    fetchReceiveKnowledge,
    fetchSharedCardDetail,
  }
}

import { useApi } from '~/composables/com/useApi'
import type { ActionResponse, Notify } from '~/types/global'

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

  return { fetchNotifyList, fetchMarkRead, fetchMarkAllRead, fetchDismissNotify }
}

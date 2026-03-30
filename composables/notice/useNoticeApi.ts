import { useApi } from '~/composables/com/useApi'
import type { NoticeDetailResponse, NoticeFormData, NoticeItem, NoticeListResponse } from '~/types/notice'
export const useNoticeApi = () => {
  const { get, post } = useApi()

  /** 공지사항 일반 목록 조회 (list.do) */
  const fetchSelectNoticeList = async (): Promise<NoticeListResponse> => {
    return get<NoticeListResponse>('/notice/list.do')
  }

  /** 공지사항 상단 고정 목록 조회 (pinnedList.do) */
  const fetchSelectNoticePinnedList = async (): Promise<NoticeListResponse> => {
    return get<NoticeListResponse>('/notice/pinnedList.do')
  }

  /** 공지사항 상세 조회 */
  const fetchSelectNoticeDetail = async (noticeId: string): Promise<NoticeDetailResponse> => {
    const res = await post<{ data: NoticeDetailResponse }>('/notice/detail.do', { noticeId })
    return res.data
  }

  /** 공지사항 등록 */
  const fetchInsertNotice = async (notice: NoticeFormData) => {
    return post<NoticeItem>('/notice/insert.do', notice)
  }

  /** 공지사항 수정 */
  const fetchUpdateNotice = async (notice: NoticeFormData) => {
    return post<NoticeItem>('/notice/update.do', notice)
  }

  /** 공지사항 삭제 */
  const fetchDeleteNotice = async (noticeId: string) => {
    return post<NoticeItem>('/notice/delete.do', { noticeId })
  }

  return {
    fetchSelectNoticeList,
    fetchSelectNoticePinnedList,
    fetchSelectNoticeDetail,
    fetchInsertNotice,
    fetchUpdateNotice,
    fetchDeleteNotice,
  }
}

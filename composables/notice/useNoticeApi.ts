import { useApi } from '~/composables/com/useApi'
import type { NoticeDetailResponse, NoticeFormData, NoticeItem, NoticeListResponse } from '~/types/notice'
export const useNoticeApi = () => {
  const { post } = useApi()

  /** 공지사항 일반 목록 조회 (서버 페이징, 검색/카테고리 포함) */
  const fetchSelectNoticeList = async (params: {
    pageIndex: number
    searchKeyword?: string
    noticeTypeCd?: string
  }): Promise<NoticeListResponse> => {
    return post<NoticeListResponse>('/notice/list.do', params)
  }

  /** 공지사항 상단 고정 목록 조회 (서버 페이징, 검색/카테고리 포함) */
  const fetchSelectNoticePinnedList = async (params: {
    pageIndex: number
    searchKeyword?: string
    noticeTypeCd?: string
  }): Promise<NoticeListResponse> => {
    return post<NoticeListResponse>('/notice/pinnedList.do', params)
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

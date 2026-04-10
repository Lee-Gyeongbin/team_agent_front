import { useApi } from '~/composables/com/useApi'
import type {
  LoginNoticeItem,
  LoginNoticeListResponse,
  NoticeDetailResponse,
  NoticeFormData,
  NoticeItem,
  NoticeListResponse,
} from '~/types/notice'
export const useNoticeApi = () => {
  const { post, get } = useApi()

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
  /** 공지사항 등록/수정 (단일 저장 API) */
  const fetchSaveNotice = async (notice: NoticeFormData) => {
    return post<NoticeItem>('/notice/save.do', notice)
  }

  /** 공지사항 삭제 */
  const fetchDeleteNotice = async (noticeId: string) => {
    return post<NoticeItem>('/notice/delete.do', { noticeId })
  }

  /** 로그인화면 공지사항 조회 */
  const fetchSelectLoginNoticeList = async (): Promise<LoginNoticeItem[]> => {
    const res = await get<LoginNoticeListResponse>('/notice/selectNoticeList.do')
    return Array.isArray(res.dataList) ? res.dataList : []
  }

  return {
    fetchSelectNoticeList,
    fetchSelectNoticePinnedList,
    fetchSelectNoticeDetail,
    fetchSaveNotice,
    fetchDeleteNotice,
    fetchSelectLoginNoticeList,
  }
}

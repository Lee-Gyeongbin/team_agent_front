import { useApi } from '~/composables/com/useApi'
import type { Notify } from '~/types/global'
import type {
  MyDocDetailRequest,
  MyDocDetailResponse,
  MyDocListRequest,
  MyDocListResponse,
  MyDocReceiveResponse,
  MyDocSaveReportPayload,
  MyDocSaveReportResponse,
  MyDocSharedDetailRequest,
  MyDocSharedDetailResponse,
  MyDocSharePayload,
  MyDocShareResponse,
  MyDocUpdateDocNmRequest,
  MyDocUpdateDocNmResponse,
  MyDocUpdateNewYnRequest,
  MyDocUpdateNewYnResponse,
} from '~/types/mydoc'

export const useMyDocApi = () => {
  const { post } = useApi()

  /** 내 문서 목록 조회 */
  const fetchList = async (params: MyDocListRequest) => {
    return post<MyDocListResponse>('/mydocuments/list.do', params)
  }

  /** 내 문서 상세 조회 */
  const fetchDetail = async (params: MyDocDetailRequest) => {
    const res = await post<MyDocDetailResponse>('/mydocuments/detail.do', params)
    return res.data
  }

  /** 공유 문서 상세 조회 — 알림 refId(공유 ID)로 프리뷰용 재조회 */
  const fetchSharedDocDetail = async (params: MyDocSharedDetailRequest) => {
    const res = await post<MyDocSharedDetailResponse>('/mydocuments/selectSharedDocInfo.do', params)
    return res.data
  }

  /** AI 보고서 — 내 문서보관함 저장·수정 */
  const fetchSaveReport = async (payload: MyDocSaveReportPayload) => {
    return post<MyDocSaveReportResponse>('/mydocuments/saveReport.do', payload)
  }

  /** 신규 여부 갱신 */
  const fetchUpdateNewYn = async (payload: MyDocUpdateNewYnRequest) => {
    return post<MyDocUpdateNewYnResponse>('/mydocuments/updateNewYn.do', payload)
  }

  /** 문서명 변경 */
  const fetchUpdateDocNm = async (payload: MyDocUpdateDocNmRequest) => {
    return post<MyDocUpdateDocNmResponse>('/mydocuments/updateDocNm.do', payload)
  }

  /** 내 문서 공유 */
  const fetchShareDoc = async (payload: MyDocSharePayload) => {
    return post<MyDocShareResponse>('/mydocuments/shareDoc.do', payload)
  }

  /** 내 문서 공유 알림 받기 */
  const fetchReceiveMyDoc = async (notify: Notify) => {
    return post<MyDocReceiveResponse>('/mydocuments/insertReceiveMyDoc.do', { ...notify })
  }

  return {
    fetchList,
    fetchDetail,
    fetchSharedDocDetail,
    fetchSaveReport,
    fetchUpdateNewYn,
    fetchUpdateDocNm,
    fetchShareDoc,
    fetchReceiveMyDoc,
  }
}

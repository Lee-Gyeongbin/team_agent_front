import { useApi } from '~/composables/com/useApi'
import type {
  MyDocDetailRequest,
  MyDocDetailResponse,
  MyDocListRequest,
  MyDocListResponse,
  MyDocSaveReportPayload,
  MyDocSaveReportResponse,
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

  /** AI 보고서 — 내 문서보관함 저장·수정 */
  const fetchSaveReport = async (payload: MyDocSaveReportPayload) => {
    return post<MyDocSaveReportResponse>('/mydocuments/saveReport.do', payload)
  }

  /** 신규 여부 갱신 */
  const fetchUpdateNewYn = async (payload: MyDocUpdateNewYnRequest) => {
    return post<MyDocUpdateNewYnResponse>('/mydocuments/updateNewYn.do', payload)
  }

  return { fetchList, fetchDetail, fetchSaveReport, fetchUpdateNewYn }
}

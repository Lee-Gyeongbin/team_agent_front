import { useApi } from '~/composables/com/useApi'
import type {
  MyDocListRequest,
  MyDocListResponse,
  MyDocSaveReportPayload,
  MyDocSaveReportResponse,
} from '~/types/mydoc'

export const useMyDocApi = () => {
  const { post } = useApi()

  /** 내 문서 목록 조회 */
  const fetchList = async (params: MyDocListRequest) => {
    return post<MyDocListResponse>('/mydocuments/list.do', params)
  }

  /** AI 보고서 — 내 문서보관함 저장 */
  const fetchSaveReport = async (payload: MyDocSaveReportPayload) => {
    return post<MyDocSaveReportResponse>('/mydocuments/saveReport.do', payload)
  }

  return { fetchList, fetchSaveReport }
}

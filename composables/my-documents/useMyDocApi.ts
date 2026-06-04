import { useApi } from '~/composables/com/useApi'
import type { MyDocSaveReportPayload, MyDocSaveReportResponse } from '~/types/mydoc'

export const useMyDocApi = () => {
  const { post } = useApi()

  /** AI 보고서 — 내 문서보관함 저장 */
  const fetchSaveReport = async (payload: MyDocSaveReportPayload) => {
    return post<MyDocSaveReportResponse>('/mydocuments/saveReport.do', payload)
  }

  return { fetchSaveReport }
}

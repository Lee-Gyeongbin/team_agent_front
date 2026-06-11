import { useApi } from '~/composables/com/useApi'
import type {
  MtlcareConfirmReportResponse,
  MtlcareReport,
  MtlcareRequestReportResponse,
  MtlcareSaveResultResponse,
} from '~/types/mtlcare'
import type { RadarChartData } from '~/utils/chat/surveyUtil'

export const useMtlcareApi = () => {
  const { post } = useApi()

  /** 진단 결과(RadarChartData) 저장 → resultId 반환 */
  const fetchSaveResult = async (data: RadarChartData): Promise<MtlcareSaveResultResponse> => {
    return post<MtlcareSaveResultResponse>('/mtlcare/saveResult.do', {
      scoreJson: JSON.stringify(data.scores),
      riskLevel: data.riskLevel,
      riskColor: data.riskColor,
      riskBgColor: data.riskBgColor,
      riskSummary: data.riskSummary,
      coreAreasSummary: data.coreAreasSummary,
    })
  }

  /** 진단 결과 기반 면담 요청 (매니저 선택 + 코멘트) */
  const fetchRequestReport = async (
    resultId: string,
    mgrUserId: string,
    reqComment?: string,
  ): Promise<MtlcareRequestReportResponse> => {
    return post<MtlcareRequestReportResponse>('/mtlcare/requestReport.do', { resultId, mgrUserId, reqComment })
  }

  /** 면담 리포트 상세 조회 */
  const fetchReport = async (reportId: string): Promise<{ data: MtlcareReport | null }> => {
    return post<{ data: MtlcareReport | null }>('/mtlcare/selectReport.do', { reportId })
  }

  /** 면담 리포트 확인 처리 (매니저) */
  const fetchConfirmReport = async (reportId: string): Promise<MtlcareConfirmReportResponse> => {
    return post<MtlcareConfirmReportResponse>('/mtlcare/confirmReport.do', { reportId })
  }

  return { fetchSaveResult, fetchRequestReport, fetchReport, fetchConfirmReport }
}

import type { RadarChartRiskLevel } from '~/utils/chat/surveyUtil'

/** 멘탈케어 면담 리포트 상태 */
export type MtlcareReportStatus = 'REQ' | 'CONFIRMED'

/** 멘탈케어 진단 결과 저장 응답 */
export interface MtlcareSaveResultResponse {
  successYn: boolean
  returnMsg?: string
  resultId?: string
}

/** 면담 요청 응답 */
export interface MtlcareRequestReportResponse {
  successYn: boolean
  returnMsg?: string
  reportId?: string
}

/** 면담 리포트 확인 응답 */
export interface MtlcareConfirmReportResponse {
  successYn: boolean
  returnMsg?: string
}

/** 면담 리포트 상세 — 진단 결과(TB_MTLCARE_RESULT 조인) + LLM 재요약 HTML */
export interface MtlcareReport {
  reportId: string
  resultId: string
  reqUserId: string
  reqUserNm: string
  mgrUserId: string
  reqComment?: string
  tmplId?: string
  reportHtml: string
  status: MtlcareReportStatus
  createDt: string
  confirmDt?: string
  /** 영역별 점수 JSON 문자열 (RadarChartScore 직렬화) */
  scoreJson: string
  riskLevel: RadarChartRiskLevel
  riskColor: string
  riskBgColor: string
  riskSummary: string
  coreAreasSummary: string
}

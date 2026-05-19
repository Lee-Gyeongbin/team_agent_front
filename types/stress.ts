// ============================================================
// 스트레스 진단 결과 타입 정의
// ============================================================

/** 위험 등급 — KOSS-SF1 3단계 (정상 / 경계 / 고위험) */
export type StressLevel = '정상' | '경계' | '고위험'

/** 진단 항목별 점수 + 등급 */
export interface StressScoreItem {
  /** 항목명 (예: '직무요구') */
  name: string
  /** 점수 (스케일은 도메인에 따라 0~100, 0~5 등) */
  value: number
  /** 위험 등급 */
  level: StressLevel
}

/** 진단 결과 전체 (백엔드 응답 형태) */
export interface StressDiagnosisResult {
  /** 종합 위험 등급 */
  riskLevel: StressLevel
  /** 종합 위험 색상 (hex) */
  riskColor: string
  /** 종합 위험 배경색 (hex) */
  riskBgColor: string
  /** 위험 요약 메시지 */
  riskSummary: string
  /** 핵심 영역 안내 메시지 */
  coreAreasSummary: string
  /** 항목별 점수+등급 (백엔드 키-값 매핑은 페이지에서 정규화) */
  items: StressScoreItem[]
}

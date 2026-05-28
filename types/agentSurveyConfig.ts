/** Agent 설정 폼 — 설문 문항 */
export interface SurveyQuestionForm {
  no: number
  text: string
  /** 역채점(역문항) 여부 — 저장 시 reverseQuestionNos에 반영 */
  isReverse?: boolean
}

/** Agent 설정 폼 — 설문 카테고리(영역) */
export interface SurveyCategoryForm {
  no: number
  key: string
  title: string
  titleEn: string
  questions: SurveyQuestionForm[]
}

/** Agent 설정 폼 — 평가 등급 (key는 저장 시 등급명에서 자동 생성) */
export interface SurveyRiskLevelForm {
  key: string
  label: string
  tone: string
}

/** Agent 설정 폼 — 응답 척도 선택지 */
export interface SurveyScoreOptionForm {
  value: number
  label: string
}

/** ADDITIONAL_CONFIG.riskRules — 일반 SURVEY 위험 등급·구간 */
export interface SurveyRiskLevelConfig {
  key: string
  label: string
}

export interface SurveyTotalScoreProfileConfig {
  upperBounds?: number[]
  normalMax?: number
  cautionMax?: number
}

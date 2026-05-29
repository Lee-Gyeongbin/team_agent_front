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
  /** 기준 초과(경계 이상) 시 섹션에 표시할 라벨 (예: "직무요구 과부하") */
  elevatedLabel: string
  questions: SurveyQuestionForm[]
}

/** Agent 설정 폼 — 평가 등급 (기존 — riskLevels 역방향 호환용) */
export interface SurveyRiskLevelForm {
  key: string
  label: string
  tone: string
}

/** Agent 설정 폼 — 결과 등급 (신규 JSON 구조 — badgeClass·statusClass 포함) */
export interface SurveyResultTierForm {
  key: string
  label: string
  badgeClass: string
  statusClass: string
  tone: string
}

/** Agent 설정 폼 — 응답 척도 선택지 */
export interface SurveyScoreOptionForm {
  value: number
  label: string
}

/** additionalConfig.ui — 설문 화면 UI 문구 (미설정 시 surveyType별 기본값 사용) */
export interface SurveyUiConfig {
  surveyTitle?: string
  genderStepTitle?: string
  genderStepDesc?: string
  disclaimerSource?: string
  disclaimerText?: string
  introTitle?: string
  introSubtitle?: string
  submitLabel?: string
}

/** 출력 섹션 블록 인스턴스 (outputSections 배열 원소) */
export interface SurveyOutputSectionBlock {
  id: string
  title?: string
  blockType: string
  instruction?: string
  params?: Record<string, unknown>
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

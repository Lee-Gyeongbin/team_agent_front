/** 설문 문항 */
export interface SurveyQuestion {
  no: number
  text: string
  categoryNo: number
}

/** 설문 카테고리 */
export interface SurveyCategory {
  no: number
  key: string
  title: string
  titleEn: string
  questions: SurveyQuestion[]
  questionNos: number[]
}

/** 설문 선택지 */
export interface SurveyScoreOption {
  value: number
  label: string
}

/** 성별별 위험 임계값 */
export interface SurveyRiskThreshold {
  normalMax: number
  cautionMax: number
}

/** @deprecated SurveyQuestion 호환 별칭 */
export type PsychologySurveyQuestion = SurveyQuestion
/** @deprecated SurveyCategory 호환 별칭 */
export type PsychologySurveyCategory = SurveyCategory
/** @deprecated SurveyScoreOption 호환 별칭 */
export type PsychologySurveyScoreOption = SurveyScoreOption

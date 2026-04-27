// ============================================================
// 산업심리 상담 에이전트 (AG000010) 전용 설문 타입 정의
// ============================================================

export interface PsychologySurveyQuestion {
  no: number
  text: string
  categoryNo: number
}

export interface PsychologySurveyCategory {
  no: number
  title: string
  titleEn: string
  questions: PsychologySurveyQuestion[]
}

export interface PsychologySurveyScoreOption {
  value: number
  label: string
}

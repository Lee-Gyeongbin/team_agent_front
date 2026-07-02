export type QuestionCriterionKey = 'period' | 'metric' | 'groupBy' | 'calculation' | 'analysis' | 'comparison'

export interface CriterionResult {
  key: QuestionCriterionKey
  label: string
  met: boolean
  required: boolean
}

export interface QuestionScore {
  criteria: CriterionResult[]
}

/**
 * diagnoseQuestion.do 응답 status
 *
 * - READY: SQL 생성 허용
 * - CLARIFICATION_REQUIRED: 조건 보완 필요
 * - TERM_AMBIGUOUS: 용어 정의 선택 필요
 * - OUT_OF_SCOPE: 데이터로 답 불가
 */
export type QuestionDiagnosisStatus =
  | 'READY' // 실행 가능 — SQL 생성 허용
  | 'CLARIFICATION_REQUIRED' // 조건 보완 필요
  | 'TERM_AMBIGUOUS' // 용어 정의 선택 필요
  | 'OUT_OF_SCOPE' // 데이터로 답 불가

/** 보완 질문 선택지 */
export interface ClarificationOption {
  value: string
  label: string
}

/** 보완 질문 — 슬롯별 안내 + 선택지(백엔드 제공 시) */
export type ClarificationIntent = 'missing' | 'refine'

export interface ClarificationQuestion {
  /** 슬롯 키 — 예: period, metric, target */
  item: string
  question: string
  /** missing: 슬롯 없음 / refine: 있으나 구체화 필요 (미전달 시 Tier1 met 여부로 추론) */
  intent?: ClarificationIntent
  options?: ClarificationOption[]
}

/**
 * 진단 응답 envelope (프론트는 status만 보고 렌더 — 데이터마트 무관)
 *
 * - rewrittenQuestion: READY일 때 정제된 질문, 그 외 null
 * - clarificationQuestions: 핵심 보완 항목 (question 필수, intent/options 선택)
 * - alternatives: 대체 가능 용어(모호·오인 지표 등) — 칩 선택 시 채팅 질문 내 치환
 */
export interface QuestionDiagnosis {
  status: QuestionDiagnosisStatus
  readinessScore: number
  interpretedIntent?: string
  rewrittenQuestion?: string | null
  clarificationQuestions?: ClarificationQuestion[]
  alternatives?: string[]
  sqlGenerationAllowed: boolean
}

export const FORMULA_DISPLAY_LABELS: Record<QuestionCriterionKey, string> = {
  period: '기간',
  metric: '무엇을',
  groupBy: '구분 단위',
  calculation: '계산',
  analysis: '분석',
  comparison: '비교',
}

export interface FormulaDisplayItem {
  key: QuestionCriterionKey
  label: string
  required: boolean
  met: boolean
}

export interface QuestionDraft {
  period: string
  metric: string
  groupBy: string
  calculationLabel: string
  calculationPhrase: string
  analysisLabel: string
  analysisPhrase: string
  comparisonLabel: string
  comparisonPhrase: string
}

export interface DatamartTab {
  id: string
  label: string
}

export type MandatorySlotKey = 'period' | 'target'

export interface MandatorySlotCard {
  key: MandatorySlotKey
  label: string
  icon: string
  question: string
  item: string
}

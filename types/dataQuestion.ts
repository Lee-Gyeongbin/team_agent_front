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

/** UI 선택지 — 백엔드 options 문자열 배열을 화면용으로 정규화 */
export interface ClarificationOption {
  value: string
  label: string
}

/** 보완 질문 — 슬롯별 안내 + 선택지(백엔드 제공) */
export type ClarificationIntent = 'missing' | 'refine'

export interface ClarificationQuestion {
  /** 슬롯 키 — 예: period, metric, target */
  item: string
  question: string
  /** questionPreview 내 플레이스홀더 라벨 — 백엔드 제공 값 그대로 사용 (`매출액` 또는 `{매출액}`) */
  placeholder?: string
  intent?: ClarificationIntent
  /** 선택 가능한 값 목록 */
  options?: string[]
}

/**
 * 진단 응답 envelope (diagnoseQuestion.do)
 *
 * - rewrittenQuestion: READY일 때 완성된 최종 질문, 그 외 null
 * - questionPreview: 보완 미리보기 문장 (`{매출액}` 등 플레이스홀더 포함)
 * - clarificationQuestions: 보완 질문 + options 선택지
 * - alternatives: 대체 가능 용어(모호·오인 지표 등)
 */
export interface QuestionDiagnosis {
  status: QuestionDiagnosisStatus
  readinessScore: number
  interpretedIntent?: string
  rewrittenQuestion?: string | null
  questionPreview?: string | null
  clarificationQuestions?: ClarificationQuestion[]
  alternatives?: string[]
  sqlGenerationAllowed: boolean
}

/** 질문 작성 공식 pill 키 — 내부 scoring key(calculation/analysis)와 분리 */
export type FormulaDisplayKey = 'period' | 'metric' | 'groupBy' | 'calculationAnalysis' | 'comparison'

export const FORMULA_DISPLAY_LABELS: Record<FormulaDisplayKey, string> = {
  period: '기간',
  metric: '무엇을 (지표·대상)',
  groupBy: '구분 단위',
  calculationAnalysis: '계산·분석 방식',
  comparison: '비교 기준',
}

export interface FormulaDisplayItem {
  key: FormulaDisplayKey
  label: string
  required: boolean
  met: boolean
}

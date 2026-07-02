/**
 * 데이터분석 질문 설계 — Tier 1 품질 게이트 타입
 *
 * Tier 1: 클라이언트 구조 완성도 점수 (메타·데이터마트 무관, 범용)
 */

/** 좋은 질문의 구조 요소 (참고 기준: 기간/지표/구분/집계/비교) */
export type QuestionCriterionKey = 'period' | 'metric' | 'groupBy' | 'aggregation' | 'comparison'

/** 단일 요소 평가 결과 */
export interface CriterionResult {
  key: QuestionCriterionKey
  label: string
  /** 충족 여부 */
  met: boolean
  /** 필수 요소 여부 */
  required: boolean
  /** 배점 */
  weight: number
  /** 미충족 시 사용자 안내 문구 */
  hint: string
}

/** Tier 1 점수 결과 */
export interface QuestionScore {
  /** 0~100 */
  score: number
  /** 임계점수 통과 여부 (Text-to-SQL 게이트) */
  passed: boolean
  criteria: CriterionResult[]
  /** 미충족 안내 문구 모음 */
  missingHints: string[]
}

// ===== Tier 2: 백엔드 LLM 진단 계약 (검증 버튼 → 진단 응답) =====

export type QuestionDiagnosisStatus =
  | 'READY' // 실행 가능 — SQL 생성 허용
  | 'CLARIFICATION_REQUIRED' // 조건 보완 필요
  | 'TERM_AMBIGUOUS' // 용어 정의 선택 필요
  | 'OUT_OF_SCOPE' // 데이터로 답 불가

/** 보완 질문 — 핵심 누락 안내 (선택지 미제공, 질문 텍스트만) */
export interface ClarificationQuestion {
  item: string
  question: string
}

/** 진단 응답 envelope (프론트는 status만 보고 렌더 — 데이터마트 무관) */
export interface QuestionDiagnosis {
  status: QuestionDiagnosisStatus
  /** 백엔드 종합 점수 (0~100) */
  readinessScore: number
  /** 해석한 의도 */
  interpretedIntent?: string
  /** READY 시 실행할 재작성 질문 */
  rewrittenQuestion?: string | null
  /** 보완 필요 시 선택형 질문 */
  clarificationQuestions?: ClarificationQuestion[]
  /** 범위 밖일 때 대체 통계 안내 */
  alternatives?: string[]
  /** SQL 생성 허용 여부 (최종 게이트) */
  sqlGenerationAllowed: boolean
}

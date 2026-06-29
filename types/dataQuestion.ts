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

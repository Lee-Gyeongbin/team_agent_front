import type { CriterionResult, QuestionCriterionKey, QuestionScore } from '~/types/dataQuestion'

/**
 * 데이터분석 질문 — Tier 1 구조 완성도 루브릭
 *
 * 어떤 데이터마트에도 동일하게 적용되는 범용 규칙.
 * 의미 정확성·데이터 존재 여부는 평가하지 않음(그건 Tier 2 백엔드 진단).
 */

/** 임계 점수 — 이 이상이어야 Text-to-SQL 게이트 통과 */
export const QUESTION_SCORE_THRESHOLD = 70

interface CriterionDef {
  key: QuestionCriterionKey
  label: string
  required: boolean
  weight: number
  hint: string
  /** 자유 입력 텍스트에서 충족을 감지하는 패턴 */
  detect: RegExp
}

/** 요소 정의 (배점 합계 100) */
const CRITERIA: CriterionDef[] = [
  {
    key: 'metric',
    label: '무엇을 (지표·대상)',
    required: true,
    weight: 30,
    hint: '조회할 지표를 넣어주세요. 예: 가입자 수, 매출액, 해지 건수',
    detect: /\S{2,}/, // 자유 입력 시엔 별도 보강 로직으로 판정
  },
  {
    key: 'period',
    label: '기간',
    required: true,
    weight: 25,
    hint: '기간을 넣어주세요. 예: 최근 12개월, 2026년 1분기, 전년 동월',
    detect:
      /(\d{4}\s*년|\d{1,2}\s*월|\d{1,2}\s*분기|이번\s*달|지난\s*달|전월|올해|작년|최근\s*\d+\s*(개월|일|주|년)|전년\s*동월)/,
  },
  {
    key: 'groupBy',
    label: '구분 단위',
    required: false,
    weight: 15,
    hint: '어떻게 나눌지 정하면 더 정확해요. 예: 권역별, 상품별, 채널별',
    detect: /(\S+?별|\S+\s*단위|\S+\s*기준으로)/,
  },
  {
    key: 'aggregation',
    label: '계산·분석 방식',
    required: false,
    weight: 20,
    hint: '계산 방식을 정해주세요. 예: 합계, 추이, 증감률, 순위, 구성비, 평균',
    detect: /(합계|총|추이|흐름|증감|증가|감소|대비|성장률|순위|상위|하위|가장\s*많|구성비|비중|비율|평균)/,
  },
  {
    key: 'comparison',
    label: '비교 기준',
    required: false,
    weight: 10,
    hint: '비교 기준을 더하면 좋아요. 예: 전월 대비, 전년 동월 대비, 목표 대비',
    detect: /(대비|비교|전월|전년\s*동월|목표\s*대비|작년\s*대비)/,
  },
]

/**
 * 자유 입력 텍스트 기반 점수
 * - 패턴 감지로 요소 충족 판정
 * - metric은 명확한 표지가 없어, 구조 토큰을 제거하고 남은 내용으로 추정
 */
export const scoreFromText = (text: string): QuestionScore => {
  const trimmed = text.trim()
  const criteria: CriterionResult[] = CRITERIA.map((def) => {
    let met = def.detect.test(trimmed)
    if (def.key === 'metric') met = hasMetricCandidate(trimmed)
    return { key: def.key, label: def.label, met, required: def.required, weight: def.weight, hint: def.hint }
  })
  return buildScore(criteria)
}

/** 구조 토큰을 제거하고 지표 후보(명사구)가 남는지 추정 */
const hasMetricCandidate = (text: string): boolean => {
  if (text.trim().length < 2) return false
  const stripped = text
    .replace(CRITERIA.find((c) => c.key === 'period')!.detect, ' ')
    .replace(/\S+?별/g, ' ')
    .replace(CRITERIA.find((c) => c.key === 'aggregation')!.detect, ' ')
    .replace(CRITERIA.find((c) => c.key === 'comparison')!.detect, ' ')
    .replace(/(보여줘|알려줘|조회|해줘|어때|현황|좀|줘|해|의|를|을|는|은|이|가|에서|에)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length >= 2
}

/** 요소 결과 → 점수/통과/미충족 안내 */
const buildScore = (criteria: CriterionResult[]): QuestionScore => {
  const score = criteria.reduce((sum, c) => sum + (c.met ? c.weight : 0), 0)
  // 필수 요소(기간·지표)는 모두 충족해야 통과
  const requiredMet = criteria.filter((c) => c.required).every((c) => c.met)
  const passed = requiredMet && score >= QUESTION_SCORE_THRESHOLD
  const missingHints = criteria.filter((c) => !c.met).map((c) => c.hint)
  return { score, passed, criteria, missingHints }
}

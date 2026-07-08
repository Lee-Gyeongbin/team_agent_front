import type {
  CriterionResult,
  FormulaDisplayItem,
  FormulaDisplayKey,
  QuestionCriterionKey,
  QuestionScore,
} from '~/types/dataQuestion'
import { FORMULA_DISPLAY_LABELS } from '~/types/dataQuestion'

interface CriterionDef {
  key: QuestionCriterionKey
  label: string
  required: boolean
  detect: RegExp
}

const CRITERIA: CriterionDef[] = [
  {
    key: 'metric',
    label: '무엇을 (지표·대상)',
    required: true,
    detect: /\S{2,}/,
  },
  {
    key: 'period',
    label: '기간',
    required: true,
    detect:
      /(\d{4}\s*년|\d{1,2}\s*월|\d{1,2}\s*분기|이번\s*달|지난\s*달|전월|올해|작년|최근\s*\d+\s*(개월|일|주|년)|전년\s*동월)/,
  },
  {
    key: 'groupBy',
    label: '구분 단위',
    required: false,
    detect: /(\S+?별|\S+\s*단위|\S+\s*기준으로)/,
  },
  {
    key: 'calculation',
    label: '계산',
    required: false,
    detect: /(합계|총|평균|구성비|비중|비율)/,
  },
  {
    key: 'analysis',
    label: '분석',
    required: false,
    detect: /(추이|흐름|증감|증가|감소|성장률|순위|상위|하위|가장\s*많|분석)/,
  },
  {
    key: 'comparison',
    label: '비교',
    required: false,
    detect: /(대비|비교|전월|전년\s*동월|목표\s*대비|작년\s*대비)/,
  },
]

export const FORMULA_DISPLAY_ORDER: FormulaDisplayKey[] = [
  'metric',
  'period',
  'groupBy',
  'calculationAnalysis',
  'comparison',
]

/** 질문 작성 공식 카드에 표시할 만점(5요소 충족) 예시 질문 */
export const FORMULA_EXAMPLE_QUESTION =
  '2025년 3월 동안 광고 매출액을 채널별 합계로 집계하고, 전월 대비 증감 추이를 분석해줘'

export const buildFormulaItems = (score: QuestionScore): FormulaDisplayItem[] => {
  const criteriaMap = new Map(score.criteria.map((c) => [c.key, c]))

  const isCalculationAnalysisMet = () =>
    Boolean(criteriaMap.get('calculation')?.met || criteriaMap.get('analysis')?.met)

  return FORMULA_DISPLAY_ORDER.map((key) => {
    if (key === 'calculationAnalysis') {
      return {
        key,
        label: FORMULA_DISPLAY_LABELS[key],
        required: false,
        met: isCalculationAnalysisMet(),
      }
    }

    const criterion = criteriaMap.get(key)
    return {
      key,
      label: FORMULA_DISPLAY_LABELS[key],
      required: criterion?.required ?? false,
      met: criterion?.met ?? false,
    }
  })
}

export const countRequiredMissing = (score: QuestionScore): number =>
  score.criteria.filter((c) => c.required && !c.met).length

const DEFAULT_DATA_QUESTION_THEME_HEX = '#2ea3f2'
const DEFAULT_DATA_QUESTION_THEME_RGB = '46, 163, 242'

export const resolveDataQuestionThemeIconClass = (iconClassNm?: string): string =>
  String(iconClassNm || '').trim() || 'icon-chart-ai'

const hexToRgb = (hex: string): string => {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return DEFAULT_DATA_QUESTION_THEME_RGB
  return `${parseInt(cleaned.slice(0, 2), 16)}, ${parseInt(cleaned.slice(2, 4), 16)}, ${parseInt(cleaned.slice(4, 6), 16)}`
}

export const buildDataQuestionThemeStyle = (colorHex?: string): Record<string, string> => {
  const color = String(colorHex || '').trim() || DEFAULT_DATA_QUESTION_THEME_HEX
  return {
    '--dq-theme-color': color,
    '--dq-theme-rgb': hexToRgb(color),
  }
}

export const scoreFromText = (text: string): QuestionScore => {
  const trimmed = text.trim()
  const criteria: CriterionResult[] = CRITERIA.map((def) => {
    let met = def.detect.test(trimmed)
    if (def.key === 'metric') met = hasMetricCandidate(trimmed)
    return { key: def.key, label: def.label, met, required: def.required }
  })
  return { criteria }
}

const hasMetricCandidate = (text: string): boolean => {
  if (text.trim().length < 2) return false
  const stripped = text
    .replace(CRITERIA.find((c) => c.key === 'period')!.detect, ' ')
    .replace(/\S+?별/g, ' ')
    .replace(CRITERIA.find((c) => c.key === 'calculation')!.detect, ' ')
    .replace(CRITERIA.find((c) => c.key === 'analysis')!.detect, ' ')
    .replace(CRITERIA.find((c) => c.key === 'comparison')!.detect, ' ')
    .replace(/(보여줘|알려줘|조회|해줘|어때|현황|좀|줘|해|의|를|을|는|은|이|가|에서|에)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length >= 2
}

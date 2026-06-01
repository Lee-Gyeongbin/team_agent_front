import type { AgtSubAdditionalConfig } from '~/types/agent'
import type {
  SurveyCategoryForm,
  SurveyOutputSectionBlock,
  SurveyQuestionForm,
  SurveyResultTierForm,
  SurveyRiskLevelConfig,
  SurveyScoreOptionForm,
  SurveyTotalScoreProfileConfig,
  SurveyUiConfig,
} from '~/types/agentSurveyConfig'
import {
  DEFAULT_CLOSING_MESSAGE_BLOCK,
  parseSurveyClosingMessageBlock,
  parseSurveyOutputSectionBlocks,
} from '~/utils/agent/surveyOutputSectionUtil'

/** Agent 설정 UI — SURVEY ADDITIONAL_CONFIG 편집 필드 */
export interface SurveyConfigForm {
  surveyType: string
  /** 핵심 원인 표시 상위 N개 */
  topN: number
  categories: SurveyCategoryForm[]
  scoreOptions: SurveyScoreOptionForm[]
  /** 에이전트 페르소나 (신규: agent.persona / 기존: prompt.role) */
  agentPersona: string
  /** 에이전트 임무 설명 (신규: agent.mission) */
  agentMission: string
  /** 출력 언어 레이블 (신규: agent.languageLabel, 예: "한국어") */
  agentLanguageLabel: string
  /** 언어 예외 (신규: agent.languageExceptions) */
  agentLanguageExceptions: string
  /** 출력 섹션 블록 배열 */
  outputSections: SurveyOutputSectionBlock[]
  /** 마무리 응원 메시지 블록 (closingMessage 최상위 필드) */
  closingMessage: SurveyOutputSectionBlock
  /** 결과 등급 목록 (신규: resultTiers, badgeClass·statusClass·tone 포함) */
  resultTiers: SurveyResultTierForm[]
  /** 출력 제약 목록 (신규: constraints 배열) */
  constraints: string[]
  /** 설문 화면 제목 (ui.surveyTitle) */
  surveyTitle: string
  /** 출처 안내 (ui.disclaimerSource) */
  disclaimerSource: string
  /** 소개·면책 문구 (ui.disclaimerText) */
  disclaimerText: string
  /** 성별 선택 단계 제목 (ui.genderStepTitle) */
  genderStepTitle: string
  /** 성별 선택 단계 설명 (ui.genderStepDesc) */
  genderStepDesc: string
  /** 인트로 애니메이션 제목 (ui.introTitle) */
  introTitle: string
  /** 인트로 부제 (ui.introSubtitle) */
  introSubtitle: string
  /** 제출 버튼 라벨 (ui.submitLabel) */
  submitLabel: string
  requireGender: boolean
  showRadarChart: boolean
  showAiRecoveryImage: boolean
  totalThresholdsCommon: number[]
  totalThresholdsMale: number[]
  totalThresholdsFemale: number[]
}

const DEFAULT_RESULT_TIERS: SurveyResultTierForm[] = [
  { key: 'safe', label: '정상군', badgeClass: 'risk-safe', statusClass: 'risk-status--safe', tone: '' },
  { key: 'caution', label: '경계군', badgeClass: 'risk-caution', statusClass: 'risk-status--caution', tone: '' },
  { key: 'highrisk', label: '고위험군', badgeClass: 'risk-danger', statusClass: 'risk-status--danger', tone: '' },
]

export const emptySurveyConfigForm = (): SurveyConfigForm => ({
  surveyType: '',
  topN: 2,
  categories: [],
  scoreOptions: [
    { value: 1, label: '전혀 그렇지 않다' },
    { value: 2, label: '그렇지 않다' },
    { value: 3, label: '그렇다' },
    { value: 4, label: '매우 그렇다' },
  ],
  agentPersona: '',
  agentMission: '',
  agentLanguageLabel: '',
  agentLanguageExceptions: '',
  outputSections: [],
  closingMessage: DEFAULT_CLOSING_MESSAGE_BLOCK(),
  resultTiers: DEFAULT_RESULT_TIERS.map((r) => ({ ...r })),
  constraints: [],
  surveyTitle: '',
  disclaimerSource: '',
  disclaimerText: '',
  genderStepTitle: '',
  genderStepDesc: '',
  introTitle: '',
  introSubtitle: '',
  submitLabel: '',
  requireGender: false,
  showRadarChart: false,
  showAiRecoveryImage: false,
  totalThresholdsCommon: [],
  totalThresholdsMale: [],
  totalThresholdsFemale: [],
})

const slugKey = (label: string, index: number) => {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  return base || `level_${index + 1}`
}

const parseReverseQuestionNos = (raw: unknown): number[] => {
  if (!Array.isArray(raw)) return []
  return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
}

/** 영역·문항 폼 → reverseQuestionNos */
export const collectReverseQuestionNos = (categories: SurveyCategoryForm[]): number[] => {
  const nos: number[] = []
  for (const cat of categories) {
    for (const q of cat.questions) {
      if (q.isReverse) nos.push(q.no)
    }
  }
  return nos.sort((a, b) => a - b)
}

const parseUpperBounds = (profile: SurveyTotalScoreProfileConfig | null): number[] => {
  if (!profile) return []
  if (Array.isArray(profile.upperBounds) && profile.upperBounds.length > 0) {
    return profile.upperBounds.map((n) => Number(n)).filter((n) => Number.isFinite(n))
  }
  const bounds: number[] = []
  const normalMax = Number(profile.normalMax ?? (profile as Record<string, unknown>).정상Max)
  const cautionMax = Number(profile.cautionMax ?? (profile as Record<string, unknown>).경계Max)
  if (Number.isFinite(normalMax)) bounds.push(normalMax)
  if (Number.isFinite(cautionMax)) bounds.push(cautionMax)
  return bounds
}

/**
 * resultTiers 배열 파싱 (신규: cfg.resultTiers)
 * 기존 riskRules.riskLevels + prompt.toneByRiskLevel 형식도 변환
 */
const parseResultTiers = (
  riskRules: Record<string, unknown>,
  toneByRiskLevel: Record<string, string>,
  cfgResultTiers: unknown,
): SurveyResultTierForm[] => {
  // 신규: cfg.resultTiers 배열
  if (Array.isArray(cfgResultTiers) && cfgResultTiers.length > 0) {
    const first = cfgResultTiers[0] as Record<string, unknown>
    if (typeof first.badgeClass === 'string' || typeof first.statusClass === 'string') {
      return cfgResultTiers.map((t, i) => {
        const row = t as Record<string, unknown>
        const label = String(row.label ?? '')
        return {
          key: String(row.key ?? slugKey(label, i)),
          label,
          badgeClass: String(row.badgeClass ?? ''),
          statusClass: String(row.statusClass ?? ''),
          tone: String(row.tone ?? toneByRiskLevel[label] ?? ''),
        }
      })
    }
  }

  // 기존: riskRules.riskLevels
  const fromRules = riskRules.riskLevels
  if (Array.isArray(fromRules) && fromRules.length > 0) {
    return fromRules.map((row, i) => {
      const item = row as Record<string, unknown>
      const label = String(item.label ?? '')
      return {
        key: String(item.key ?? slugKey(label, i)),
        label,
        badgeClass: String(item.badgeClass ?? ''),
        statusClass: String(item.statusClass ?? ''),
        tone: String(toneByRiskLevel[label] ?? item.tone ?? ''),
      }
    })
  }

  // 기존: prompt.toneByRiskLevel 키만 있는 경우
  const toneEntries = Object.entries(toneByRiskLevel)
  if (toneEntries.length > 0) {
    return toneEntries.map(([label, tone], i) => ({
      key: slugKey(label, i),
      label,
      badgeClass: '',
      statusClass: '',
      tone: String(tone ?? ''),
    }))
  }

  return DEFAULT_RESULT_TIERS.map((r) => ({ ...r }))
}

const parseCategories = (raw: unknown, reverseQuestionNos: number[]): SurveyCategoryForm[] => {
  if (!Array.isArray(raw)) return []
  const reverseSet = new Set(reverseQuestionNos)
  return raw.map((cat, index) => {
    const row = cat as Record<string, unknown>
    const no = Number(row.no ?? index + 1)
    const questionsRaw = Array.isArray(row.questions) ? row.questions : []
    const questions: SurveyQuestionForm[] = questionsRaw.map((q) => {
      const qr = q as Record<string, unknown>
      const qNo = Number(qr.no)
      return {
        no: qNo,
        text: String(qr.text ?? ''),
        isReverse: reverseSet.has(qNo),
      }
    })
    return {
      no,
      key: String(row.key ?? `category${no}`),
      title: String(row.title ?? ''),
      titleEn: String(row.titleEn ?? ''),
      elevatedLabel: String(row.elevatedLabel ?? ''),
      questions,
    }
  })
}

const parseScoreOptions = (raw: unknown): SurveyScoreOptionForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return emptySurveyConfigForm().scoreOptions
  }
  return raw.map((o) => {
    const row = o as Record<string, unknown>
    return { value: Number(row.value), label: String(row.label ?? '') }
  })
}

const parseUiString = (uiRaw: Record<string, unknown>, cfg: Record<string, unknown>, key: keyof SurveyUiConfig) => {
  const fromUi = uiRaw[key]
  if (fromUi != null && String(fromUi).trim()) return String(fromUi).trim()
  const fromTop = cfg[key]
  if (fromTop != null && String(fromTop).trim()) return String(fromTop).trim()
  return ''
}

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseSurveyAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): SurveyConfigForm => {
  if (!config || typeof config !== 'object') return emptySurveyConfigForm()

  const isNew = !!(config.agent && typeof config.agent === 'object')
  const agentInfo = isNew ? ((config.agent ?? {}) as Record<string, unknown>) : {}
  const prompt = isNew ? {} : ((config.prompt ?? {}) as Record<string, unknown>)
  const features = (config.features ?? {}) as Record<string, unknown>
  const engine = isNew ? ((config.engine ?? {}) as Record<string, unknown>) : {}
  const riskRules = ((isNew ? engine.riskRules : config.riskRules) ?? {}) as Record<string, unknown>
  const totalScore = (riskRules.totalScore ?? {}) as Record<string, unknown>
  const toneByRiskLevel = (prompt.toneByRiskLevel ?? {}) as Record<string, string>

  const requireGender = features.requireGender === true
  const resultTiers = parseResultTiers(riskRules, toneByRiskLevel, config.resultTiers)

  const maleProfile = (totalScore.male ?? null) as SurveyTotalScoreProfileConfig | null
  const femaleProfile = (totalScore.female ?? null) as SurveyTotalScoreProfileConfig | null
  const defaultProfile = (totalScore.default ?? totalScore.common ?? null) as SurveyTotalScoreProfileConfig | null
  const maleBounds = parseUpperBounds(maleProfile)
  const femaleBounds = parseUpperBounds(femaleProfile)
  const commonBounds = parseUpperBounds(defaultProfile)

  const rawReverseNos = isNew ? (engine.reverseQuestionNos ?? config.reverseQuestionNos) : config.reverseQuestionNos
  const reverseQuestionNos = parseReverseQuestionNos(rawReverseNos)
  const uiRaw = (config.ui ?? {}) as Record<string, unknown>

  return {
    surveyType: String(config.surveyType ?? ''),
    topN: Number(config.topN ?? 2),
    categories: parseCategories(config.categories, reverseQuestionNos),
    scoreOptions: parseScoreOptions(config.scoreOptions),
    agentPersona: String(agentInfo.persona ?? prompt.role ?? ''),
    agentMission: String(agentInfo.mission ?? ''),
    agentLanguageLabel: String(agentInfo.languageLabel ?? config.language ?? ''),
    agentLanguageExceptions: String(agentInfo.languageExceptions ?? ''),
    outputSections: parseSurveyOutputSectionBlocks(config.outputSections ?? prompt.outputSections),
    closingMessage: parseSurveyClosingMessageBlock(config.closingMessage) ?? DEFAULT_CLOSING_MESSAGE_BLOCK(),
    resultTiers,
    constraints: Array.isArray(config.constraints) ? config.constraints.map(String) : [],
    surveyTitle: parseUiString(uiRaw, config, 'surveyTitle'),
    disclaimerSource: parseUiString(uiRaw, config, 'disclaimerSource'),
    disclaimerText: parseUiString(uiRaw, config, 'disclaimerText'),
    genderStepTitle: parseUiString(uiRaw, config, 'genderStepTitle'),
    genderStepDesc: parseUiString(uiRaw, config, 'genderStepDesc'),
    introTitle: parseUiString(uiRaw, config, 'introTitle'),
    introSubtitle: parseUiString(uiRaw, config, 'introSubtitle'),
    submitLabel: parseUiString(uiRaw, config, 'submitLabel'),
    requireGender,
    showRadarChart: features.showRadarChart === true,
    showAiRecoveryImage: features.showAiRecoveryImage === true || features.showPexelsRecoveryImages === true,
    totalThresholdsCommon: requireGender ? [] : maleBounds.length ? maleBounds : commonBounds,
    totalThresholdsMale: requireGender ? maleBounds : [],
    totalThresholdsFemale: requireGender ? femaleBounds : [],
  }
}

const buildProfilePayload = (upperBounds: number[]): SurveyTotalScoreProfileConfig => {
  const payload: SurveyTotalScoreProfileConfig = { upperBounds: [...upperBounds] }
  if (upperBounds.length >= 1) payload.normalMax = upperBounds[0]
  if (upperBounds.length >= 2) payload.cautionMax = upperBounds[1]
  return payload
}

const buildCategoriesPayload = (categories: SurveyCategoryForm[]) =>
  categories.map((cat) => ({
    no: cat.no,
    key: cat.key,
    title: cat.title,
    titleEn: cat.titleEn,
    elevatedLabel: cat.elevatedLabel,
    questionNos: cat.questions.map((q) => q.no),
    questions: cat.questions.map((q) => ({ no: q.no, text: q.text })),
  }))

const calcTotalQuestions = (categories: SurveyCategoryForm[]) =>
  categories.reduce((sum, c) => sum + c.questions.length, 0)

const buildTotalScorePayload = (form: SurveyConfigForm) => {
  if (form.requireGender) {
    return {
      splitByGender: true,
      male: buildProfilePayload(form.totalThresholdsMale),
      female: buildProfilePayload(form.totalThresholdsFemale),
    }
  }
  const common = buildProfilePayload(form.totalThresholdsCommon)
  return {
    splitByGender: false,
    default: common,
    male: { ...common },
    female: { ...common },
  }
}

const buildRiskLevelsConfig = (tiers: SurveyResultTierForm[]): SurveyRiskLevelConfig[] =>
  tiers
    .filter((t) => t.label.trim())
    .map((t, i) => ({
      key: t.key.trim() || slugKey(t.label, i),
      label: t.label.trim(),
    }))

const buildResultTiersPayload = (tiers: SurveyResultTierForm[]) =>
  tiers
    .filter((t) => t.label.trim())
    .map((t, i) => ({
      key: t.key.trim() || slugKey(t.label, i),
      label: t.label.trim(),
      badgeClass: t.badgeClass.trim(),
      statusClass: t.statusClass.trim(),
      tone: t.tone,
    }))

const UI_CONFIG_KEYS: (keyof SurveyUiConfig)[] = [
  'surveyTitle',
  'genderStepTitle',
  'genderStepDesc',
  'disclaimerSource',
  'disclaimerText',
  'introTitle',
  'introSubtitle',
  'submitLabel',
]

const stripLegacyUiTopLevelKeys = (cfg: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(cfg).filter(([key]) => !UI_CONFIG_KEYS.includes(key as (typeof UI_CONFIG_KEYS)[number])),
  )

const buildUiPayload = (form: SurveyConfigForm, preserved?: AgtSubAdditionalConfig | null): SurveyUiConfig => {
  const preservedRecord = (preserved ?? {}) as Record<string, unknown>
  const prevUi: SurveyUiConfig = { ...((preservedRecord.ui ?? {}) as SurveyUiConfig) }

  // 기존 최상위 키(surveyTitle 등) → ui 객체로 이전
  for (const key of UI_CONFIG_KEYS) {
    if (!prevUi[key]) {
      const legacy = preservedRecord[key]
      if (legacy != null && String(legacy).trim()) prevUi[key] = String(legacy).trim()
    }
  }

  let next: SurveyUiConfig = { ...prevUi }

  const omitUiKey = (ui: SurveyUiConfig, key: keyof SurveyUiConfig): SurveyUiConfig =>
    Object.fromEntries(Object.entries(ui).filter(([entryKey]) => entryKey !== key)) as SurveyUiConfig

  const assignIfSet = (key: keyof SurveyUiConfig, value: string) => {
    const trimmed = value.trim()
    next = trimmed ? { ...next, [key]: trimmed } : omitUiKey(next, key)
  }

  assignIfSet('surveyTitle', form.surveyTitle)
  assignIfSet('disclaimerSource', form.disclaimerSource)
  assignIfSet('disclaimerText', form.disclaimerText)
  assignIfSet('genderStepTitle', form.genderStepTitle)
  assignIfSet('genderStepDesc', form.genderStepDesc)
  assignIfSet('introTitle', form.introTitle)
  assignIfSet('introSubtitle', form.introSubtitle)
  assignIfSet('submitLabel', form.submitLabel)

  return next
}

/** 설정 폼 + 기존 JSON(영역별 참고치 areaScore 등) → 저장용 ADDITIONAL_CONFIG (신규 구조) */
export const buildSurveyAdditionalConfig = (
  form: SurveyConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const recoveryOn = form.showAiRecoveryImage
  const totalQuestions = calcTotalQuestions(form.categories)
  const reverseQuestionNos = collectReverseQuestionNos(form.categories)
  const outputSectionBlocks = form.outputSections

  const closingMessagePayload = form.closingMessage

  const agentPayload = {
    ...((preserved?.agent as Record<string, unknown>) ?? {}),
    persona: form.agentPersona,
    mission: form.agentMission,
    languageLabel: form.agentLanguageLabel,
    languageExceptions: form.agentLanguageExceptions,
  }

  const engineRiskRules = {
    ...((preserved?.engine as Record<string, unknown>)?.riskRules as Record<string, unknown> | undefined),
    riskLevels: buildRiskLevelsConfig(form.resultTiers),
    totalScore: buildTotalScorePayload(form),
    splitByGender: form.requireGender,
  }

  const engine = {
    ...((preserved?.engine as Record<string, unknown>) ?? {}),
    riskRules: engineRiskRules,
    reverseQuestionNos,
  }

  const features = {
    ...((preserved?.features as Record<string, unknown>) ?? {}),
    requireGender: form.requireGender,
    showRadarChart: form.showRadarChart,
    showAiRecoveryImage: recoveryOn,
    showPexelsRecoveryImages: recoveryOn,
  }

  const ui = buildUiPayload(form, preserved)

  const base = {
    agentType: 'survey',
    surveyType: form.surveyType,
    topN: form.topN,
    language: form.agentLanguageLabel === '한국어' ? 'ko' : form.agentLanguageLabel || 'ko',
    agent: agentPayload,
    engine,
    categories: buildCategoriesPayload(form.categories),
    scoreOptions: form.scoreOptions.map((o) => ({ ...o })),
    totalQuestions: totalQuestions > 0 ? totalQuestions : undefined,
    resultTiers: buildResultTiersPayload(form.resultTiers),
    outputSections: outputSectionBlocks,
    closingMessage: closingMessagePayload,
    constraints: form.constraints.filter(Boolean),
    features,
    ui,
    version: (preserved?.version as string) ?? '2.0',
  }

  if (preserved && typeof preserved === 'object') {
    return stripLegacyUiTopLevelKeys({ ...preserved, ...base }) as AgtSubAdditionalConfig
  }

  return base
}

/** 등급 N개 → 구간 상한 입력 칸 N-1개 */
export const thresholdSlotCount = (levelCount: number) => Math.max(0, levelCount - 1)

export const ensureThresholdLength = (bounds: number[], slotCount: number): number[] => {
  const next = [...bounds]
  while (next.length < slotCount) next.push(0)
  return next.slice(0, slotCount)
}

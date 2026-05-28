import type { AgtSubAdditionalConfig } from '~/types/agent'
import type {
  SurveyCategoryForm,
  SurveyQuestionForm,
  SurveyRiskLevelConfig,
  SurveyRiskLevelForm,
  SurveyScoreOptionForm,
  SurveyTotalScoreProfileConfig,
} from '~/types/agentSurveyConfig'

/** Agent 설정 UI — SURVEY ADDITIONAL_CONFIG 편집 필드 */
export interface SurveyConfigForm {
  surveyType: string
  categories: SurveyCategoryForm[]
  scoreOptions: SurveyScoreOptionForm[]
  promptRole: string
  promptLanguage: string
  /** LLM 응답 마크다운 섹션 제목 (prompt.outputSections) */
  outputSections: string[]
  riskLevels: SurveyRiskLevelForm[]
  requireGender: boolean
  showRadarChart: boolean
  showAiRecoveryImage: boolean
  totalThresholdsCommon: number[]
  totalThresholdsMale: number[]
  totalThresholdsFemale: number[]
}

const DEFAULT_RISK_LEVELS: SurveyRiskLevelForm[] = [
  { key: 'normal', label: '정상', tone: '' },
  { key: 'caution', label: '경계', tone: '' },
  { key: 'high', label: '고위험', tone: '' },
]

export const emptySurveyConfigForm = (): SurveyConfigForm => ({
  surveyType: '',
  categories: [],
  scoreOptions: [
    { value: 1, label: '전혀 그렇지 않다' },
    { value: 2, label: '그렇지 않다' },
    { value: 3, label: '그렇다' },
    { value: 4, label: '매우 그렇다' },
  ],
  promptRole: '',
  promptLanguage: '',
  outputSections: [],
  riskLevels: DEFAULT_RISK_LEVELS.map((r) => ({ ...r })),
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

const parseRiskLevels = (
  riskRules: Record<string, unknown>,
  toneByRiskLevel: Record<string, string>,
): SurveyRiskLevelForm[] => {
  const fromRules = riskRules.riskLevels
  if (Array.isArray(fromRules) && fromRules.length > 0) {
    return fromRules.map((row, i) => {
      const item = row as Record<string, unknown>
      const label = String(item.label ?? '')
      return {
        key: String(item.key ?? slugKey(label, i)),
        label,
        tone: String(toneByRiskLevel[label] ?? item.tone ?? ''),
      }
    })
  }
  const toneEntries = Object.entries(toneByRiskLevel)
  if (toneEntries.length > 0) {
    return toneEntries.map(([label, tone], i) => ({
      key: slugKey(label, i),
      label,
      tone: String(tone ?? ''),
    }))
  }
  return DEFAULT_RISK_LEVELS.map((r) => ({ ...r }))
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

const buildToneByRiskLevel = (levels: SurveyRiskLevelForm[]): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const level of levels) {
    if (!level.label.trim()) continue
    result[level.label.trim()] = level.tone
  }
  return result
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
    questionNos: cat.questions.map((q) => q.no),
    questions: cat.questions.map((q) => ({ no: q.no, text: q.text })),
  }))

const calcTotalQuestions = (categories: SurveyCategoryForm[]) =>
  categories.reduce((sum, c) => sum + c.questions.length, 0)

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseSurveyAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): SurveyConfigForm => {
  if (!config || typeof config !== 'object') return emptySurveyConfigForm()

  const prompt = (config.prompt ?? {}) as Record<string, unknown>
  const features = (config.features ?? {}) as Record<string, unknown>
  const riskRules = (config.riskRules ?? {}) as Record<string, unknown>
  const totalScore = (riskRules.totalScore ?? {}) as Record<string, unknown>
  const toneByRiskLevel = (prompt.toneByRiskLevel ?? {}) as Record<string, string>
  const requireGender = features.requireGender === true
  const riskLevels = parseRiskLevels(riskRules, toneByRiskLevel)
  const maleProfile = (totalScore.male ?? null) as SurveyTotalScoreProfileConfig | null
  const femaleProfile = (totalScore.female ?? null) as SurveyTotalScoreProfileConfig | null
  const defaultProfile = (totalScore.default ?? totalScore.common ?? null) as SurveyTotalScoreProfileConfig | null
  const maleBounds = parseUpperBounds(maleProfile)
  const femaleBounds = parseUpperBounds(femaleProfile)
  const commonBounds = parseUpperBounds(defaultProfile)
  const outputSections = Array.isArray(prompt.outputSections) ? prompt.outputSections.map(String) : []
  const reverseQuestionNos = parseReverseQuestionNos(config.reverseQuestionNos)

  return {
    surveyType: String(config.surveyType ?? ''),
    categories: parseCategories(config.categories, reverseQuestionNos),
    scoreOptions: parseScoreOptions(config.scoreOptions),
    promptRole: String(prompt.role ?? ''),
    promptLanguage: String(prompt.language ?? ''),
    outputSections,
    riskLevels,
    requireGender,
    showRadarChart: features.showRadarChart === true,
    showAiRecoveryImage: features.showAiRecoveryImage === true || features.showPexelsRecoveryImages === true,
    totalThresholdsCommon: requireGender ? [] : maleBounds.length ? maleBounds : commonBounds,
    totalThresholdsMale: requireGender ? maleBounds : [],
    totalThresholdsFemale: requireGender ? femaleBounds : [],
  }
}

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

const buildRiskLevelsConfig = (levels: SurveyRiskLevelForm[]): SurveyRiskLevelConfig[] =>
  levels
    .filter((l) => l.label.trim())
    .map((l, i) => ({
      key: l.key.trim() || slugKey(l.label, i),
      label: l.label.trim(),
    }))

/** 설정 폼 + 기존 JSON(영역별 참고치 areaScore 등) → 저장용 ADDITIONAL_CONFIG */
export const buildSurveyAdditionalConfig = (
  form: SurveyConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const outputSections = form.outputSections.map((s) => s.trim()).filter(Boolean)
  const recoveryOn = form.showAiRecoveryImage
  const totalQuestions = calcTotalQuestions(form.categories)
  const reverseQuestionNos = collectReverseQuestionNos(form.categories)

  const prompt = {
    ...((preserved?.prompt as Record<string, unknown>) ?? {}),
    role: form.promptRole,
    language: form.promptLanguage,
    outputSections,
    toneByRiskLevel: buildToneByRiskLevel(form.riskLevels),
  }

  const features = {
    ...((preserved?.features as Record<string, unknown>) ?? {}),
    requireGender: form.requireGender,
    showRadarChart: form.showRadarChart,
    showAiRecoveryImage: recoveryOn,
    showPexelsRecoveryImages: recoveryOn,
  }

  const riskRules = {
    ...((preserved?.riskRules as Record<string, unknown>) ?? {}),
    riskLevels: buildRiskLevelsConfig(form.riskLevels),
    totalScore: buildTotalScorePayload(form),
  }

  const base = {
    surveyType: form.surveyType,
    categories: buildCategoriesPayload(form.categories),
    scoreOptions: form.scoreOptions.map((o) => ({ ...o })),
    totalQuestions: totalQuestions > 0 ? totalQuestions : undefined,
    reverseQuestionNos,
    prompt,
    features,
    riskRules,
    version: (preserved?.version as string) ?? undefined,
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base }
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

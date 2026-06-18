import type { AgtSubAdditionalConfig } from '~/types/agent'

/** Agent 설정 UI — RESEARCHER ADDITIONAL_CONFIG 편집 필드 */
export interface ResearcherConfigForm {
  tmplId: string
  webSearch: boolean
}

/** 신규 RESEARCHER 에이전트 기본값 */
export const emptyResearcherConfigForm = (): ResearcherConfigForm => ({
  tmplId: '',
  webSearch: true,
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseResearcherAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): ResearcherConfigForm => {
  if (!config || typeof config !== 'object') return emptyResearcherConfigForm()

  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyResearcherConfigForm()

  return {
    tmplId: String(features.tmplId ?? empty.tmplId),
    webSearch: features.webSearch === undefined ? empty.webSearch : features.webSearch === true,
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildResearcherAdditionalConfig = (
  form: ResearcherConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const preservedFeatures = ((preserved?.features as Record<string, unknown>) ?? {}) as Record<string, unknown>
  const base = {
    features: {
      ...preservedFeatures,
      tmplId: form.tmplId.trim(),
      webSearch: form.webSearch,
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

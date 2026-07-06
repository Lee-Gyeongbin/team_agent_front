import type { AgtSubAdditionalConfig } from '~/types/agent'

/** Agent 설정 UI — PLANNER ADDITIONAL_CONFIG 편집 필드 */
export interface PlannerConfigForm {
  docTy: string        // 기획서 | PT | 보고서 | 제안서
  audience: string     // 임원 | 팀원 | 고객 | 외부
  pageCount: number    // 목표 페이지/슬라이드 수
  lang: string         // ko | en
  structureHint: string // 구조 힌트 (비워두면 AI 자동 결정)
  tmplId: string       // 출력 템플릿 ID (선택)
  webSearch: boolean   // 웹 검색 여부
}

/** 신규 PLANNER 에이전트 기본값 */
export const emptyPlannerConfigForm = (): PlannerConfigForm => ({
  docTy: '기획서',
  audience: '임원',
  pageCount: 5,
  lang: 'ko',
  structureHint: '',
  tmplId: '',
  webSearch: false,
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parsePlannerAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): PlannerConfigForm => {
  if (!config || typeof config !== 'object') return emptyPlannerConfigForm()

  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyPlannerConfigForm()

  return {
    docTy: String(features.docTy ?? empty.docTy),
    audience: String(features.audience ?? empty.audience),
    pageCount: Number(features.pageCount ?? empty.pageCount) || empty.pageCount,
    lang: String(features.lang ?? empty.lang),
    structureHint: String(features.structureHint ?? empty.structureHint),
    tmplId: String(features.tmplId ?? empty.tmplId),
    webSearch: features.webSearch === undefined ? empty.webSearch : features.webSearch === true,
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildPlannerAdditionalConfig = (
  form: PlannerConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const preservedFeatures = ((preserved?.features as Record<string, unknown>) ?? {}) as Record<string, unknown>

  const base = {
    features: {
      ...preservedFeatures,
      docTy: form.docTy,
      audience: form.audience,
      pageCount: form.pageCount > 0 ? form.pageCount : 5,
      lang: form.lang || 'ko',
      structureHint: form.structureHint.trim(),
      tmplId: form.tmplId.trim(),
      webSearch: form.webSearch,
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

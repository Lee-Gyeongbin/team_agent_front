import type { Agent, AgtSubAdditionalConfig } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

/** RISK(프로젝트 리스크진단) SUB_TY 상수 */
export const RISK_SUB_TY = 'RISK'

/** svcTy=D · USE_YN=Y · subTy=RISK — 채팅 에이전트 선택·전송용 */
export const isRiskAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'D') return false
  return getAgentSubTy(agent.subCfg) === RISK_SUB_TY
}

/** Agent 설정 UI — RISK ADDITIONAL_CONFIG 편집 필드 */
export interface RiskConfigForm {
  tmplId: string
}

/** 신규 RISK 에이전트 기본값 */
export const emptyRiskConfigForm = (): RiskConfigForm => ({
  tmplId: '',
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseRiskAdditionalConfigToForm = (config: Record<string, unknown> | null | undefined): RiskConfigForm => {
  if (!config || typeof config !== 'object') return emptyRiskConfigForm()

  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyRiskConfigForm()

  return {
    tmplId: String(features.tmplId ?? empty.tmplId),
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildRiskAdditionalConfig = (
  form: RiskConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const preservedFeatures = ((preserved?.features as Record<string, unknown>) ?? {}) as Record<string, unknown>
  const base = {
    features: {
      ...preservedFeatures,
      tmplId: form.tmplId.trim(),
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

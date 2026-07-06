import type { Agent, AgtSubAdditionalConfig } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

/** PROPOSAL(제안서) SUB_TY 상수 */
export const PROPOSAL_SUB_TY = 'PROPOSAL'

/** svcTy=D · USE_YN=Y · subTy=PROPOSAL — 채팅 에이전트 선택·전송용 */
export const isProposalAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'D') return false
  return getAgentSubTy(agent.subCfg) === PROPOSAL_SUB_TY
}

/** 슬라이드 디자인 설정 */
export interface ProposalSlideDesign {
  bgColor: string // 배경 색상 (ex. #FFFFFF)
  baseColor: string // 기본 색조 (ex. #003087)
  accentColor: string // 강조 색상 (ex. #0066CC)
}

/** Agent 설정 UI — PROPOSAL ADDITIONAL_CONFIG 편집 필드 */
export interface ProposalConfigForm {
  persona: string // 페르소나 (ex. "공공 IT 제안서 전문 컨설턴트")
  audience: string // 보고 대상 (ex. "발주기관 평가위원")
  lang: string // 출력 언어 (ko | en)
  tmplId: string // 출력 템플릿 ID
  competitorDatasetId: string // 경쟁업체 RAG 데이터셋 ID (없으면 '')
  webSearch: boolean // 경쟁업체 정보 없을 때 웹서치 폴백
  slideDesign: ProposalSlideDesign
}

/** 신규 PROPOSAL 에이전트 기본값 */
export const emptyProposalConfigForm = (): ProposalConfigForm => ({
  persona: '제안서 전문 작성가',
  audience: '발주기관 평가위원',
  lang: 'ko',
  tmplId: '',
  competitorDatasetId: '',
  webSearch: true,
  slideDesign: {
    bgColor: '#FFFFFF',
    baseColor: '#003087',
    accentColor: '#0066CC',
  },
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseProposalAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): ProposalConfigForm => {
  if (!config || typeof config !== 'object') return emptyProposalConfigForm()

  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyProposalConfigForm()
  const rawDesign = (features.slideDesign ?? {}) as Record<string, unknown>

  return {
    persona: String(features.persona ?? empty.persona),
    audience: String(features.audience ?? empty.audience),
    lang: String(features.lang ?? empty.lang),
    tmplId: String(features.tmplId ?? empty.tmplId),
    competitorDatasetId: String(features.competitorDatasetId ?? empty.competitorDatasetId),
    webSearch: features.webSearch === undefined ? empty.webSearch : features.webSearch === true,
    slideDesign: {
      bgColor: String(rawDesign.bgColor ?? empty.slideDesign.bgColor),
      baseColor: String(rawDesign.baseColor ?? empty.slideDesign.baseColor),
      accentColor: String(rawDesign.accentColor ?? empty.slideDesign.accentColor),
    },
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildProposalAdditionalConfig = (
  form: ProposalConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const preservedFeatures = ((preserved?.features as Record<string, unknown>) ?? {}) as Record<string, unknown>

  const base = {
    features: {
      ...preservedFeatures,
      persona: form.persona.trim(),
      audience: form.audience.trim(),
      lang: form.lang || 'ko',
      tmplId: form.tmplId.trim(),
      competitorDatasetId: form.competitorDatasetId.trim(),
      webSearch: form.webSearch,
      slideDesign: {
        bgColor: form.slideDesign.bgColor.trim() || '#FFFFFF',
        baseColor: form.slideDesign.baseColor.trim() || '#003087',
        accentColor: form.slideDesign.accentColor.trim() || '#0066CC',
      },
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

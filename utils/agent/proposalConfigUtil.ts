import type { Agent, AgtSubAdditionalConfig } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

/** PROPOSAL(제안서) SUB_TY 상수 */
export const PROPOSAL_SUB_TY = 'PROPOSAL'

/** svcTy=D · USE_YN=Y · subTy=PROPOSAL — 채팅 에이전트 선택·전송용 */
export const isProposalAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'D') return false
  return getAgentSubTy(agent.subCfg) === PROPOSAL_SUB_TY
}

/**
 * 슬라이드 디자인 설정 (레거시)
 * @deprecated 프로젝트 단위 컬러 설정(Step C)으로 이전됨. DB 호환을 위해 타입만 유지.
 */
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
  // 아래 필드들은 프로젝트 단위 설정(Step C)으로 이전됨 — 에이전트 레벨 고정 설정 불필요
  ownDatasetId?: string // (레거시) 자사 RAG 데이터셋 ID
  competitorDatasetId?: string // (레거시) 경쟁업체 RAG 데이터셋 ID
  webSearch?: boolean // (레거시) 경쟁업체 정보 없을 때 웹서치 폴백
  slideDesign?: ProposalSlideDesign // (레거시) 슬라이드 디자인 (새 컬러 체계로 대체)
}

/** 신규 PROPOSAL 에이전트 기본값 */
export const emptyProposalConfigForm = (): ProposalConfigForm => ({
  persona: '제안서 전문 작성가',
  audience: '발주기관 평가위원',
  lang: 'ko',
  tmplId: '',
  // 레거시 필드 — 프로젝트 단위 설정으로 이전됨
  ownDatasetId: undefined,
  competitorDatasetId: undefined,
  webSearch: undefined,
  slideDesign: undefined,
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseProposalAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): ProposalConfigForm => {
  if (!config || typeof config !== 'object') return emptyProposalConfigForm()

  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyProposalConfigForm()

  return {
    persona: String(features.persona ?? empty.persona),
    audience: String(features.audience ?? empty.audience),
    lang: String(features.lang ?? empty.lang),
    tmplId: String(features.tmplId ?? empty.tmplId),
    // 레거시 필드 — DB에 값이 있을 경우 그대로 보존 (UI에서는 표시 안 함)
    ownDatasetId: features.ownDatasetId !== undefined ? String(features.ownDatasetId) : undefined,
    competitorDatasetId: features.competitorDatasetId !== undefined ? String(features.competitorDatasetId) : undefined,
    webSearch: features.webSearch !== undefined ? features.webSearch === true : undefined,
    slideDesign: features.slideDesign !== undefined ? (features.slideDesign as ProposalSlideDesign) : undefined,
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
      // 레거시 필드 보존 (DB 호환 — 기존 데이터 그대로 유지)
      ...preservedFeatures,
      // 에이전트 레벨 설정 필드만 저장
      persona: form.persona.trim(),
      audience: form.audience.trim(),
      lang: form.lang || 'ko',
      tmplId: form.tmplId.trim(),
      // 아래 필드들은 UI에서 입력받지 않으므로 폼 값이 있을 때만 업데이트
      ...(form.ownDatasetId !== undefined && { ownDatasetId: form.ownDatasetId }),
      ...(form.competitorDatasetId !== undefined && { competitorDatasetId: form.competitorDatasetId }),
      ...(form.webSearch !== undefined && { webSearch: form.webSearch }),
      ...(form.slideDesign !== undefined && { slideDesign: form.slideDesign }),
    },
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

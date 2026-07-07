import type { AgtSubAdditionalConfig } from '~/types/agent'

/** Agent 설정 UI — AUTO_RECOMMEND ADDITIONAL_CONFIG 편집 필드 */
export interface AutoRecommendConfigForm {
  agentId: string
  agentName: string
  agentPersona: string
  agentMission: string
  cardTitle: string
  cardSubtitle: string
  cardSubtitleReadonly: string
  introSubtitle: string
  requestCompleteTitle: string
  requestCompleteDesc: string
  submitButtonLabel: string
  pendingStatusTexts: string[]
  defaultModelId: string
  apiMode: 'searchOnly' | 'default' | ''
  outputSchemaItemFields: string[]
  resultTopN: number
  nameField: string
  constraints: string[]
  autoSubmit: boolean
  hideQuestion: boolean
  excludeNextQuestions: boolean
  language: string
  version: string
}

const DEFAULT_OUTPUT_SCHEMA_FIELDS = ['rank', 'title', 'source', 'points', 'contextLabel', 'confidence']

const DEFAULT_PENDING_STATUS_TEXTS = [
  '오늘의 밈을 고르는 중입니다...',
  '유행 표현을 분석하고 있습니다...',
  '커뮤니티 트렌드를 확인하는 중입니다...',
]

/** 밈 배달부 기본 제약 — 신규 자동추천 에이전트 템플릿 */
export const DEFAULT_AUTO_RECOMMEND_CONSTRAINTS = [
  '너는 한국 커뮤니티 트렌드 및 밈 표현 분석 AI이다.',
  '최근 24시간 이내 한국 커뮤니티 게시글/댓글 데이터를 기준으로 반복 사용되는 최신 유행 표현 topN개만 추출한다.',
  '주요 분석 커뮤니티는 웃긴대학, 디시인사이드, 루리웹, 더쿠, 네이트 판, X(트위터), 인스타그램이다.',
  '최신 표현을 우선하되, 여러 게시글/댓글에서 반복적으로 관찰된 표현만 포함한다.',
  '표현의 의미를 추측해 단정하지 말고, "~로 보입니다", "~경향이 있습니다" 형태로 설명한다.',
  '반복 관찰되지 않았거나 커뮤니티 전반 확산이 확인되지 않은 표현은 생성하지 않는다.',
  '댓글 반응 표현으로 소비되는지 여부를 함께 판단한다.',
  '정치/혐오/성적 표현, 과도한 욕설, 직장 환경(SFW)에 부적절한 표현은 제외한다.',
  '각 항목의 points는 반드시 3줄 이상 작성한다.',
  'contextLabel은 해당 표현의 분위기나 사용 맥락을 짧게 설명한다.',
  'confidence는 높음 / 중간 / 낮음 중 하나로 표시한다.',
  '설명 문장 없이 JSON 배열만 출력한다.',
]

const parseStringArray = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map(String).filter(Boolean)
}

/** engine.prompt(레거시) → 제약 목록 한 줄 배열 */
export const parseLegacyAutoRecommendPromptToConstraints = (prompt: string): string[] => {
  return String(prompt ?? '')
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

/** 신규 AUTO_RECOMMEND 에이전트 기본값 (밈 배달부 템플릿) */
export const emptyAutoRecommendConfigForm = (): AutoRecommendConfigForm => ({
  agentId: 'meme-delivery',
  agentName: '밈 배달부',
  agentPersona: '한국 커뮤니티 트렌드·밈 표현 분석에 특화된 큐레이터',
  agentMission: '최근 24시간 커뮤니티에서 반복되는 유행 표현을 선별하여 사용자에게 전달하는 것이 임무입니다.',
  cardTitle: '오늘의 밈 배달부',
  cardSubtitle: '오늘의 밈 추천을 시작해 보세요.',
  cardSubtitleReadonly: '최신 유행 밈들을 선별했어요!',
  introSubtitle: '오늘의 밈을 고르는 중입니다...',
  requestCompleteTitle: '요청한 밈을 안전하게 전달했어요!',
  requestCompleteDesc: '밈 배달부가 오늘의 밈을 잘 전달했어요. 아래에서 맞춤 밈을 확인해보세요!',
  submitButtonLabel: '오늘의 밈 받기',
  pendingStatusTexts: [...DEFAULT_PENDING_STATUS_TEXTS],
  defaultModelId: 'gemini-3-flash-preview',
  apiMode: 'searchOnly',
  outputSchemaItemFields: [...DEFAULT_OUTPUT_SCHEMA_FIELDS],
  resultTopN: 5,
  nameField: 'title',
  constraints: [...DEFAULT_AUTO_RECOMMEND_CONSTRAINTS],
  autoSubmit: true,
  hideQuestion: true,
  excludeNextQuestions: false,
  language: 'ko',
  version: '1.0',
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseAutoRecommendAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): AutoRecommendConfigForm => {
  if (!config || typeof config !== 'object') return emptyAutoRecommendConfigForm()

  const agent = (config.agent ?? {}) as Record<string, unknown>
  const ui = (config.ui ?? {}) as Record<string, unknown>
  const engine = (config.engine ?? {}) as Record<string, unknown>
  const outputSchema = (engine.outputSchema ?? {}) as Record<string, unknown>
  const result = (config.result ?? {}) as Record<string, unknown>
  const features = (config.features ?? {}) as Record<string, unknown>
  const empty = emptyAutoRecommendConfigForm()

  const apiModeRaw = String(engine.apiMode ?? empty.apiMode)
  const apiMode: AutoRecommendConfigForm['apiMode'] =
    apiModeRaw === 'searchOnly' || apiModeRaw === 'default' ? apiModeRaw : empty.apiMode

  const legacyPrompt = String(engine.prompt ?? '').trim()
  const parsedConstraints = parseStringArray(config.constraints, [])
  const constraints = parsedConstraints.length
    ? parsedConstraints
    : legacyPrompt
      ? parseLegacyAutoRecommendPromptToConstraints(legacyPrompt)
      : [...empty.constraints]

  return {
    agentId: String(agent.id ?? empty.agentId),
    agentName: String(agent.name ?? empty.agentName),
    agentPersona: String(agent.persona ?? empty.agentPersona),
    agentMission: String(agent.mission ?? empty.agentMission),
    cardTitle: String(ui.cardTitle ?? empty.cardTitle),
    cardSubtitle: String(ui.cardSubtitle ?? empty.cardSubtitle),
    cardSubtitleReadonly: String(ui.cardSubtitleReadonly ?? empty.cardSubtitleReadonly),
    introSubtitle: String(ui.introSubtitle ?? empty.introSubtitle),
    requestCompleteTitle: String(ui.requestCompleteTitle ?? empty.requestCompleteTitle),
    requestCompleteDesc: String(ui.requestCompleteDesc ?? empty.requestCompleteDesc),
    submitButtonLabel: String(ui.submitButtonLabel ?? empty.submitButtonLabel),
    pendingStatusTexts: parseStringArray(ui.pendingStatusTexts, empty.pendingStatusTexts),
    defaultModelId: String(engine.defaultModelId ?? empty.defaultModelId),
    apiMode,
    outputSchemaItemFields: parseStringArray(outputSchema.itemFields, empty.outputSchemaItemFields),
    resultTopN: Number(result.topN ?? empty.resultTopN) || empty.resultTopN,
    nameField: String(result.nameField ?? empty.nameField),
    constraints,
    autoSubmit: features.autoSubmit === undefined ? empty.autoSubmit : features.autoSubmit === true,
    hideQuestion: features.hideQuestion === undefined ? empty.hideQuestion : features.hideQuestion === true,
    excludeNextQuestions:
      features.excludeNextQuestions === undefined ? empty.excludeNextQuestions : features.excludeNextQuestions === true,
    language: String(config.language ?? empty.language),
    version: String(config.version ?? empty.version),
  }
}

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildAutoRecommendAdditionalConfig = (
  form: AutoRecommendConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const base = {
    agentType: 'autoRecommend',
    version: form.version.trim() || '1.0',
    language: form.language.trim() || 'ko',
    agent: {
      id: form.agentId.trim(),
      name: form.agentName.trim(),
      persona: form.agentPersona.trim(),
      mission: form.agentMission.trim(),
    },
    ui: {
      cardTitle: form.cardTitle.trim(),
      cardSubtitle: form.cardSubtitle.trim(),
      cardSubtitleReadonly: form.cardSubtitleReadonly.trim(),
      introSubtitle: form.introSubtitle.trim(),
      requestCompleteTitle: form.requestCompleteTitle.trim(),
      requestCompleteDesc: form.requestCompleteDesc.trim(),
      submitButtonLabel: form.submitButtonLabel.trim(),
      pendingStatusTexts: form.pendingStatusTexts.map((t) => t.trim()).filter(Boolean),
    },
    engine: {
      defaultModelId: form.defaultModelId.trim(),
      ...(form.apiMode ? { apiMode: form.apiMode } : {}),
      outputSchema: {
        type: 'json_array' as const,
        itemFields: form.outputSchemaItemFields.map((f) => f.trim()).filter(Boolean),
      },
    },
    result: {
      topN: form.resultTopN > 0 ? form.resultTopN : 5,
      nameField: form.nameField.trim() || 'title',
    },
    constraints: form.constraints.map((c) => c.trim()).filter(Boolean),
    features: {
      autoSubmit: form.autoSubmit,
      hideQuestion: form.hideQuestion,
      excludeNextQuestions: form.excludeNextQuestions,
    },
  }

  if (preserved && typeof preserved === 'object') {
    const merged = { ...preserved, ...base } as AgtSubAdditionalConfig
    if (merged.engine && typeof merged.engine === 'object') {
      const { prompt: _removed, ...engineRest } = merged.engine as Record<string, unknown>
      merged.engine = engineRest
    }
    return merged
  }

  return base
}

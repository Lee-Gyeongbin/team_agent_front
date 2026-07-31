import type {
  AgtSubAdditionalConfig,
  MarketingAuthoringAgentConfig,
  MarketingAuthoringOption,
  MarketingAuthoringWorkflowConfig,
} from '~/types/agent'

export const MARKETING_AUTHORING_SUB_TY = 'MARKETING_AUTHORING'

/** Agent 설정 UI — MARKETING_AUTHORING ADDITIONAL_CONFIG 편집 필드 */
export interface MarketingAuthoringConfigForm {
  introTitle: string
  introSubtitle: string
  submitLabel: string
  version: string
  language: string
  contentTypes: MarketingAuthoringOption[]
  /** 공통 워크플로 (목적·독자·톤·분량·출력 구성) */
  workflow: MarketingAuthoringWorkflowConfig
  channelsByContentType: Record<string, MarketingAuthoringOption[]>
  constraints: string[]
}

// ━━━ 옵션 헬퍼 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const option = (value: string, label: string, description?: string): MarketingAuthoringOption => ({
  value,
  label,
  description,
})

export const cloneContentOption = (item: MarketingAuthoringOption): MarketingAuthoringOption => ({
  value: item.value,
  label: item.label,
  ...(item.description ? { description: item.description } : {}),
})

export const cloneContentOptions = (items: MarketingAuthoringOption[]): MarketingAuthoringOption[] =>
  items.map(cloneContentOption)

export const parseContentOptionList = (
  raw: unknown,
  fallback: MarketingAuthoringOption[],
): MarketingAuthoringOption[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneContentOptions(fallback)
  return raw.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>
    const description = String(row.description ?? '').trim()
    return {
      value: String(row.value ?? '').trim(),
      label: String(row.label ?? '').trim(),
      ...(description ? { description } : {}),
    }
  })
}

export const sanitizeContentOptions = (items: MarketingAuthoringOption[]): MarketingAuthoringOption[] =>
  items
    .map((item) => ({
      value: item.value.trim(),
      label: item.label.trim(),
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
    }))
    .filter((item) => item.value && item.label)

const textContentOptions = (items: MarketingAuthoringOption[]) => items.filter((item) => item.value.trim() !== 'IMAGE')

const WORKFLOW_OPTION_KEYS = ['purposes', 'audiences', 'tones', 'lengths', 'outputSections'] as const

const cloneWorkflow = (workflow: MarketingAuthoringWorkflowConfig): MarketingAuthoringWorkflowConfig =>
  ({
    ...Object.fromEntries(WORKFLOW_OPTION_KEYS.map((key) => [key, cloneContentOptions(workflow[key])])),
    defaultOutputSections: [...workflow.defaultOutputSections],
  }) as MarketingAuthoringWorkflowConfig

const cloneChannelsByType = (
  channels: Record<string, MarketingAuthoringOption[]>,
): Record<string, MarketingAuthoringOption[]> =>
  Object.fromEntries(Object.entries(channels).map(([key, options]) => [key, cloneContentOptions(options)]))

// ━━━ 설정 기본값 (ADDITIONAL_CONFIG 시드) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COMMON_TONES = [
  option('PROFESSIONAL', '전문적', '신뢰감을 주는 정확하고 전문적인 표현'),
  option('FRIENDLY', '친근한', '독자에게 편안하게 다가가는 자연스러운 표현'),
  option('CONCISE', '간결한', '핵심을 빠르게 전달하는 짧고 명확한 표현'),
  option('FORMAL', '공식적인', '격식과 객관성을 갖춘 정중한 표현'),
  option('PERSUASIVE', '설득력 있는', '근거와 이점을 강조해 행동을 유도하는 표현'),
]

const lengthOptions = (short: string, normal: string, detailed: string) => [
  option('SHORT', '짧게', short),
  option('NORMAL', '보통', normal),
  option('DETAILED', '상세하게', detailed),
  option('CUSTOM', '직접 입력', '원하는 글자 수나 문단 수를 지정'),
]

/** 신규·폴백 콘텐츠 유형 */
export const MARKETING_AUTHORING_CONTENT_TYPES: MarketingAuthoringOption[] = [
  option('AD_COPY', '광고 문구', '검색광고와 배너 등에 활용할 짧고 설득력 있는 문구'),
  option('SNS', 'SNS 게시글', '채널 특성에 맞춘 참여형 소셜 콘텐츠'),
  option('BLOG', '블로그', '검색과 정보 전달에 적합한 장문 콘텐츠'),
  option('EMAIL', '이메일·뉴스레터', '고객 관계와 전환을 위한 이메일 콘텐츠'),
  option('LANDING_PAGE', '랜딩페이지 문구', '상품의 가치와 전환 행동을 연결하는 페이지 문안'),
  option('PRODUCT_DESCRIPTION', '상품·서비스 소개', '특징과 혜택, 차별점을 설명하는 소개 문안'),
]

/** 이미지 제작 — 용도 (배너·썸네일 등) */
export const MARKETING_IMAGE_USAGES: MarketingAuthoringOption[] = [
  option('BANNER', '배너 이미지', '캠페인과 프로모션에 사용할 가로형 비주얼'),
  option('THUMBNAIL', '썸네일', '콘텐츠의 핵심을 한눈에 전달하는 대표 이미지'),
  option('PRODUCT_DETAIL', '상품 상세 이미지', '상품의 특징과 혜택을 보여주는 상세 비주얼'),
  option('SNS_VISUAL', 'SNS 게시물 이미지', '소셜 채널 게시물과 함께 사용할 이미지'),
]

/** 이미지 제작 — 표현 유형 (실사·일러스트 등) */
export const MARKETING_IMAGE_TYPES: MarketingAuthoringOption[] = [
  option('REAL_PHOTO', '실사 사진', '실제 촬영한 듯한 사실적인 사진 비주얼'),
  option('CHARACTER_ILLUST', '캐릭터 일러스트', '캐릭터·마스코트 중심의 일러스트'),
  option('GENERAL_ILLUST', '일반 일러스트', '장면·상황을 표현하는 일반 일러스트'),
  option('GRAPHIC_3D', '3D 그래픽', '입체감 있는 3D 렌더링 비주얼'),
  option('GRAPHIC_DESIGN', '그래픽 디자인', '레이아웃·도형 중심의 그래픽 디자인'),
  option('TYPOGRAPHY', '타이포그래피 중심', '문구·타이포가 주가 되는 비주얼'),
]

/** 이미지 제작 — 분위기 */
export const MARKETING_IMAGE_ATMOSPHERES: MarketingAuthoringOption[] = [
  option('MINIMAL_CLEAN', '미니멀·클린'),
  option('PREMIUM', '프리미엄'),
  option('BRIGHT_FRIENDLY', '밝고 친근한'),
  option('PROFESSIONAL', '전문적인'),
  option('EMOTIONAL', '감성적인'),
]

/** 콘텐츠 유형별 게시 채널 기본값 */
export const MARKETING_AUTHORING_CHANNELS_BY_TYPE: Record<string, MarketingAuthoringOption[]> = {
  AD_COPY: [
    option('AD_TITLE', '광고 제목'),
    option('BANNER_COPY', '배너 문구'),
    option('CAMPAIGN_SLOGAN', '캠페인 슬로건'),
    option('SEARCH_AD_COPY', '검색광고 문구'),
  ],
  SNS: [
    option('INSTAGRAM', '인스타그램'),
    option('FACEBOOK', '페이스북'),
    option('LINKEDIN', '링크드인'),
    option('X', 'X'),
    option('YOUTUBE_COMMUNITY', '유튜브 커뮤니티'),
  ],
  EMAIL: [option('PROMOTION_EMAIL', '프로모션 메일'), option('NEWSLETTER', '뉴스레터')],
  BLOG: [option('OWNED_BLOG', '자사 블로그'), option('NAVER_BLOG', '네이버 블로그')],
}

/** LLM 제약·지침 기본값 */
export const MARKETING_AUTHORING_DEFAULT_CONSTRAINTS = [
  '작성 조건을 반영한 자연스러운 한국어 완성 문안만 작성할 것',
  'variants[].content에는 항목명 라벨 없이 바로 쓸 수 있는 전체 본문만 넣을 것',
  '확인되지 않은 수치·사실은 생성하지 말 것',
  '시안마다 메시지 각도를 다르게 하고, label은 짧은 한국어로 직접 지을 것',
  'JSON 객체만 응답. 코드블록·마크다운·설명 텍스트 금지',
]

/** 콘텐츠 작성·편집 기본 UI 문구 */
export const MARKETING_AUTHORING_DEFAULT_UI = {
  introTitle: '마케팅 콘텐츠 생성',
  introSubtitle: '목적과 채널에 맞는 문구와 이미지를 빠르게 제작해보세요.',
  submitLabel: '콘텐츠 생성',
} as const

/** 공통 워크플로 시드 (설정·채팅 폴백) */
const DEFAULT_MARKETING_AUTHORING_WORKFLOW: MarketingAuthoringWorkflowConfig = {
  purposes: [
    option('INFORMATION', '정보 제공', '독자가 궁금해하는 주제와 정보를 알기 쉽게 설명'),
    option('SEARCH_TRAFFIC', '검색 유입', '주제와 검색 의도에 맞춰 콘텐츠 발견 가능성을 높임'),
    option('PROMOTION', '제품·서비스 홍보', '제품이나 서비스의 특징과 이점을 자연스럽게 소개'),
    option('BRAND_AWARENESS', '브랜드 인지도', '브랜드의 가치와 이미지를 독자에게 각인'),
  ],
  audiences: [
    option('GENERAL', '일반 사용자', '전문지식이 없는 독자도 이해할 수 있는 수준으로 작성'),
    option('PROSPECT', '잠재 고객', '제품이나 서비스에 관심을 가질 가능성이 있는 독자'),
    option('CUSTOMER', '기존 고객', '이미 제품이나 서비스를 이용 중인 고객'),
    option('INDUSTRY', '업계 관계자', '관련 분야의 배경지식과 전문성을 갖춘 독자'),
  ],
  tones: COMMON_TONES,
  lengths: lengthOptions('약 800자', '약 1,500자', '약 2,500자'),
  outputSections: [
    option('TITLE', '제목'),
    option('INTRO', '도입부'),
    option('SUBHEADINGS', '소제목'),
    option('BODY', '본문'),
    option('KEY_MESSAGE', '핵심 메시지'),
    option('CTA', '행동 유도 문구'),
    option('KEYWORDS', '키워드'),
  ],
  defaultOutputSections: ['TITLE', 'INTRO', 'SUBHEADINGS', 'BODY', 'KEY_MESSAGE', 'CTA', 'KEYWORDS'],
}

/** 공통 워크플로 기본값 */
export const getDefaultMarketingAuthoringWorkflow = (): MarketingAuthoringWorkflowConfig =>
  cloneWorkflow(DEFAULT_MARKETING_AUTHORING_WORKFLOW)

/** 채팅·프롬프트용 런타임 설정 기본값 */
export const getDefaultMarketingAuthoringConfig = (): MarketingAuthoringAgentConfig => ({
  version: '1.0',
  language: 'ko',
  ui: { ...MARKETING_AUTHORING_DEFAULT_UI },
  contentTypes: cloneContentOptions(MARKETING_AUTHORING_CONTENT_TYPES),
  workflow: getDefaultMarketingAuthoringWorkflow(),
  channelsByContentType: cloneChannelsByType(MARKETING_AUTHORING_CHANNELS_BY_TYPE),
  constraints: [...MARKETING_AUTHORING_DEFAULT_CONSTRAINTS],
})

// ━━━ ADDITIONAL_CONFIG 파서 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parseStringArray = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

const parseConstraints = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw)) return [...fallback]
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

const parseWorkflow = (raw: unknown, fallback: MarketingAuthoringWorkflowConfig): MarketingAuthoringWorkflowConfig => {
  if (!raw || typeof raw !== 'object') return cloneWorkflow(fallback)
  const row = raw as Record<string, unknown>
  return {
    ...Object.fromEntries(WORKFLOW_OPTION_KEYS.map((key) => [key, parseContentOptionList(row[key], fallback[key])])),
    defaultOutputSections: parseStringArray(row.defaultOutputSections, fallback.defaultOutputSections),
  } as MarketingAuthoringWorkflowConfig
}

const parseChannelsByType = (
  raw: unknown,
  fallback: Record<string, MarketingAuthoringOption[]>,
): Record<string, MarketingAuthoringOption[]> => {
  if (!raw || typeof raw !== 'object') return cloneChannelsByType(fallback)
  const source = raw as Record<string, unknown>
  const keys = new Set([...Object.keys(fallback), ...Object.keys(source)])
  return Object.fromEntries([...keys].map((key) => [key, parseContentOptionList(source[key], fallback[key] ?? [])]))
}

const isCompleteMarketingAuthoringAdditional = (config: Record<string, unknown>): boolean =>
  Array.isArray(config.contentTypes) &&
  config.contentTypes.length > 0 &&
  !!config.workflow &&
  typeof config.workflow === 'object' &&
  Array.isArray(config.constraints)

/** ADDITIONAL_CONFIG raw → 런타임 MarketingAuthoringAgentConfig */
export const parseMarketingAuthoringAgentConfig = (
  config: Record<string, unknown> | null | undefined,
): MarketingAuthoringAgentConfig | null => {
  if (!config || typeof config !== 'object' || !isCompleteMarketingAuthoringAdditional(config)) return null

  const defaults = getDefaultMarketingAuthoringConfig()
  const ui = (config.ui ?? {}) as Record<string, unknown>
  const channelsByContentType = parseChannelsByType(config.channelsByContentType, defaults.channelsByContentType)

  return {
    version: String(config.version ?? defaults.version),
    language: String(config.language ?? defaults.language),
    ui: {
      introTitle: String(ui.introTitle ?? defaults.ui.introTitle),
      introSubtitle: String(ui.introSubtitle ?? defaults.ui.introSubtitle),
      submitLabel: String(ui.submitLabel ?? defaults.ui.submitLabel),
    },
    contentTypes: textContentOptions(parseContentOptionList(config.contentTypes, defaults.contentTypes)),
    workflow: parseWorkflow(config.workflow, defaults.workflow),
    channelsByContentType,
    constraints: parseConstraints(config.constraints, defaults.constraints),
  }
}

/** 신규 MARKETING_AUTHORING 에이전트 기본값 */
export const emptyMarketingAuthoringConfigForm = (): MarketingAuthoringConfigForm => {
  const defaults = getDefaultMarketingAuthoringConfig()
  return {
    introTitle: defaults.ui.introTitle,
    introSubtitle: defaults.ui.introSubtitle,
    submitLabel: defaults.ui.submitLabel,
    version: defaults.version,
    language: defaults.language,
    contentTypes: cloneContentOptions(defaults.contentTypes),
    workflow: cloneWorkflow(defaults.workflow),
    channelsByContentType: cloneChannelsByType(defaults.channelsByContentType),
    constraints: [...defaults.constraints],
  }
}

const toMarketingAuthoringConfigForm = (config: MarketingAuthoringAgentConfig): MarketingAuthoringConfigForm => ({
  introTitle: config.ui.introTitle,
  introSubtitle: config.ui.introSubtitle,
  submitLabel: config.ui.submitLabel,
  version: config.version,
  language: config.language,
  contentTypes: cloneContentOptions(config.contentTypes),
  workflow: cloneWorkflow(config.workflow),
  channelsByContentType: cloneChannelsByType(config.channelsByContentType),
  constraints: [...config.constraints],
})

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseMarketingAuthoringAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): MarketingAuthoringConfigForm => {
  const parsed = parseMarketingAuthoringAgentConfig(config)
  if (!parsed) return emptyMarketingAuthoringConfigForm()
  return toMarketingAuthoringConfigForm(parsed)
}

const sanitizeWorkflow = (workflow: MarketingAuthoringWorkflowConfig): MarketingAuthoringWorkflowConfig =>
  ({
    ...Object.fromEntries(WORKFLOW_OPTION_KEYS.map((key) => [key, sanitizeContentOptions(workflow[key])])),
    defaultOutputSections: workflow.defaultOutputSections.map((value) => value.trim()).filter(Boolean),
  }) as MarketingAuthoringWorkflowConfig

/** 설정 폼 → 저장용 ADDITIONAL_CONFIG (UI 미편집 필드는 preserved로 보존) */
export const buildMarketingAuthoringAdditionalConfig = (
  form: MarketingAuthoringConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const base: AgtSubAdditionalConfig = {
    version: form.version.trim() || '1.0',
    language: form.language.trim() || 'ko',
    ui: {
      introTitle: form.introTitle.trim() || MARKETING_AUTHORING_DEFAULT_UI.introTitle,
      introSubtitle: form.introSubtitle.trim(),
      submitLabel: form.submitLabel.trim(),
    },
    contentTypes: textContentOptions(sanitizeContentOptions(form.contentTypes)),
    workflow: sanitizeWorkflow(form.workflow),
    channelsByContentType: Object.fromEntries(
      Object.entries(form.channelsByContentType).map(([key, options]) => [key, sanitizeContentOptions(options)]),
    ),
    constraints: form.constraints.map((item) => item.trim()).filter(Boolean),
  }
  if (preserved && typeof preserved === 'object') {
    const merged = { ...preserved, ...base } as AgtSubAdditionalConfig
    delete merged.agentType
    delete (merged as Record<string, unknown>).variantCount
    return merged
  }
  return base
}

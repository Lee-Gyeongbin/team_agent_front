import { nextTick, ref } from 'vue'
import type { Agent, MarketingAuthoringAgentConfig, MarketingAuthoringOption } from '~/types/agent'
import type {
  ChatMessage,
  ChatRoom,
  MarketingAuthoringConditionSummary,
  MarketingAuthoringFormPayload,
  MarketingAuthoringResult,
  MarketingAuthoringSubmitPayload,
  MarketingAuthoringVariant,
  MarketingImageFormPayload,
  MarketingOutputKind,
  MarketingUnifiedFormPayload,
} from '~/types/chat'
import {
  MARKETING_AUTHORING_CHANNELS_BY_TYPE,
  MARKETING_AUTHORING_CONTENT_TYPES,
  MARKETING_AUTHORING_DEFAULT_CONSTRAINTS,
  MARKETING_AUTHORING_SVC_TY,
  MARKETING_IMAGE_ATMOSPHERES,
  MARKETING_IMAGE_TYPES,
  getDefaultMarketingAuthoringConfig,
  parseMarketingAuthoringAgentConfig,
} from '~/utils/agent/marketingAuthoringConfigUtil'

export { MARKETING_AUTHORING_SVC_TY } from '~/utils/agent/marketingAuthoringConfigUtil'

// ─── Theme ───────────────────────────────────────────────────────────────────

/** 마케팅 에이전트 UI 공통 테마 색상 (에이전트 colorHex) */
export const MARKETING_AGENT_THEME_FALLBACK_HEX = '#7c5cfc'

const hexToRgbChannels = (hex: string) => {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '124, 92, 252'
  return `${parseInt(cleaned.slice(0, 2), 16)}, ${parseInt(cleaned.slice(2, 4), 16)}, ${parseInt(cleaned.slice(4, 6), 16)}`
}

/** 마케팅 카드/결과 CSS 변수 — 모두 에이전트 테마색으로 통일 */
export const resolveMarketingAgentThemeStyle = (themeColorHex?: string) => {
  const colorHex = String(themeColorHex || '').trim() || MARKETING_AGENT_THEME_FALLBACK_HEX
  return {
    '--marketing-agent-theme-color': colorHex,
    '--marketing-agent-theme-rgb': hexToRgbChannels(colorHex),
    '--marketing-image-color': colorHex,
    '--marketing-authoring-color': colorHex,
  }
}

// ─── Preparing ───────────────────────────────────────────────────────────────

/** 생성 로딩 상태 문구 순환 간격 (ms) — 라이브러리 문서 생성과 동일 */
export const MARKETING_PREPARING_STATUS_INTERVAL_MS = 3000

/** 콘텐츠(텍스트) 생성 로딩 순환 문구 */
export const MARKETING_PREPARING_STATUS_TEXTS_TEXT = [
  '선택한 조건을 꼼꼼히 읽고 있어요...',
  '핵심 메시지를 정리하는 중입니다...',
  '시안 초안을 구성하는 중입니다...',
  '문장과 톤을 다듬고 있어요...',
  '완성도를 높이는 중입니다...',
] as const

/** 이미지 생성 로딩 순환 문구 */
export const MARKETING_PREPARING_STATUS_TEXTS_IMAGE = [
  '선택한 조건을 분석하고 있어요...',
  '구도와 분위기를 잡는 중입니다...',
  '시안 이미지를 구성하는 중입니다...',
  '세부 표현을 다듬고 있어요...',
  '완성도를 높이는 중입니다...',
] as const

/** 생성 완료 결과 카드 공통 summary */
export const MARKETING_RESULT_SUMMARY_DONE = '요청하신 조건으로 마케팅 콘텐츠를 생성 완료 하였습니다.'

/** 생성 대기 결과 카드 공통 summary */
export const MARKETING_RESULT_SUMMARY_PENDING = '요청하신 조건으로 콘텐츠를 생성하고 있습니다.'

export type MarketingPreparingMode = 'TEXT' | 'IMAGE' | 'BOTH'

/** BOTH 순차 생성 — 현재 진행 단계 (문구 → 이미지) */
export type MarketingPreparingPhase = 'TEXT' | 'IMAGE'

/** BOTH면 phase, 아니면 mode 기준으로 TEXT/IMAGE 판별 */
const resolveMarketingPreparingKind = (
  mode: MarketingPreparingMode = 'TEXT',
  phase?: MarketingPreparingPhase,
): MarketingPreparingPhase => (mode === 'BOTH' ? (phase ?? 'TEXT') : mode === 'IMAGE' ? 'IMAGE' : 'TEXT')

export const resolveMarketingPreparingStatusTexts = (
  mode: MarketingPreparingMode = 'TEXT',
  phase?: MarketingPreparingPhase,
) =>
  resolveMarketingPreparingKind(mode, phase) === 'IMAGE'
    ? MARKETING_PREPARING_STATUS_TEXTS_IMAGE
    : MARKETING_PREPARING_STATUS_TEXTS_TEXT

export const resolveMarketingPreparingTitle = (
  mode: MarketingPreparingMode = 'TEXT',
  phase?: MarketingPreparingPhase,
) =>
  resolveMarketingPreparingKind(mode, phase) === 'IMAGE'
    ? 'AI가 마케팅 이미지를 작성 중입니다'
    : 'AI가 콘텐츠를 작성 중입니다'

export const resolveMarketingPreparingCallout = (
  mode: MarketingPreparingMode = 'TEXT',
  phase?: MarketingPreparingPhase,
) => {
  if (mode === 'BOTH') {
    return resolveMarketingPreparingKind(mode, phase) === 'IMAGE'
      ? '문구 시안을 바탕으로 이미지 시안을 구성합니다. 잠시만 기다려 주세요.'
      : '먼저 문구 시안을 구성한 뒤 이미지를 이어서 생성합니다.'
  }
  return mode === 'IMAGE'
    ? '요청하신 조건에 맞춰 시안 이미지를 구성합니다. 완료되면 바로 확인할 수 있어요.'
    : '요청하신 조건에 맞춰 시안을 구성합니다. 완료되면 바로 편집·보완할 수 있어요.'
}

/**
 * 생성 로딩 상태 문구 순환 헬퍼
 * - getTexts가 바뀌어도 다음 틱부터 반영
 */
export const createMarketingPreparingStatusCycle = (
  getTexts: () => readonly string[] = () => resolveMarketingPreparingStatusTexts('TEXT'),
  intervalMs = MARKETING_PREPARING_STATUS_INTERVAL_MS,
) => {
  const text = ref(getTexts()[0] ?? '')
  let timer: ReturnType<typeof setInterval> | null = null
  let index = 0

  const stop = () => {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  const start = () => {
    stop()
    index = 0
    const texts = getTexts()
    text.value = texts[0] ?? ''
    timer = setInterval(() => {
      const list = getTexts()
      if (!list.length) return
      index = (index + 1) % list.length
      text.value = list[index] ?? list[0] ?? ''
    }, intervalMs)
  }

  return { text, start, stop }
}

// ─── Form UI ─────────────────────────────────────────────────────────────────

/** 채팅 폼에서 사용자가 지정할 수 있는 시안 개수 상한 */
export const MARKETING_AUTHORING_VARIANT_COUNT_MAX = 5

/** 공유 유효성/안내 문구 */
export const MARKETING_FORM_MESSAGES = {
  VARIANT_COUNT_REQUIRED: '시안 생성 개수를 선택해 주세요.',
  REFERENCE_FILE_MAX: '참고 파일은 최대 5개까지 첨부할 수 있습니다.',
  PROMOTION_REQUIRED: '홍보할 상품·서비스를 입력해 주세요.',
} as const

/** 최종 확인 요약 그리드 항목 */
export type MarketingConfirmSummaryItem = {
  label: string
  value: string
  stepIndex: number
  fullWidth?: boolean
  /** 한 줄에 두 항목일 때 왼쪽 항목 중간 구분선 */
  hasDivider?: boolean
}

/**
 * 최종 확인 그리드 레이아웃 보정
 * - 한 줄에 두 항목이면 왼쪽 항목에 중간 구분선
 * - 짝이 없는 단독 항목은 한 줄(fullWidth)로 승격
 */
export const applyConfirmSummaryLayout = <T extends MarketingConfirmSummaryItem>(items: T[]): T[] => {
  const result = items.map((item) => ({
    ...item,
    fullWidth: !!item.fullWidth,
    hasDivider: false,
  }))

  let index = 0
  while (index < result.length) {
    const current = result[index]
    if (current.fullWidth) {
      index += 1
      continue
    }

    const next = result[index + 1]
    if (next && !next.fullWidth) {
      current.hasDivider = true
      index += 2
      continue
    }

    current.fullWidth = true
    index += 1
  }

  return result
}

/** 선택된 내용 태그 표시 — `타겟 고객 | 기존고객` */
export const formatMarketingSelectionTag = (category: string, value: string) => `${category} | ${value}`

/** 공통 워크플로 옵션 (콘텐츠 유형별 분기는 아직 없음 — config.workflow 단일 사용) */
export const getMarketingAuthoringWorkflow = (config?: MarketingAuthoringAgentConfig | null) => {
  const workflow = config?.workflow ?? getDefaultMarketingAuthoringConfig().workflow
  return {
    ...workflow,
    purposes: workflow.purposes ?? [],
    audiences: workflow.audiences ?? [],
    tones: workflow.tones ?? [],
    lengths: workflow.lengths ?? [],
    outputSections: workflow.outputSections ?? [],
    defaultOutputSections: workflow.defaultOutputSections ?? [],
  }
}

/** 시안 개수 클램프 (채팅 폼 1~5) */
export const clampMarketingAuthoringVariantCount = (raw: unknown): number => {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return 0
  return Math.min(MARKETING_AUTHORING_VARIANT_COUNT_MAX, Math.floor(n))
}

export const createEmptyMarketingAuthoringPayload = (): MarketingAuthoringFormPayload => ({
  contentType: '',
  purpose: '',
  audience: '',
  tones: [],
  length: '',
  channel: '',
  customChannel: '',
  promotionInformation: '',
  keyMessage: '',
  customCallToAction: '',
  customLength: '',
  customPurpose: '',
  customAudience: '',
  customTone: '',
  referenceMode: '',
  referenceFiles: [],
  referenceUrls: [],
  additionalRequirements: '',
  outputSections: [],
  includeHashtags: 'Y',
  variantCount: 0,
})

export const createEmptyMarketingUnifiedPayload = (): MarketingUnifiedFormPayload => ({
  ...createEmptyMarketingAuthoringPayload(),
  outputs: [],
  imageUsage: '',
  snsPlatform: '',
  imageType: '',
  visualStyle: '',
  aspectRatio: '',
  customAspectRatio: '',
  imageText: '',
  brandColors: '',
})

/**
 * setup의 콘텐츠 유형·게시 채널 → 이미지 사용처/SNS 플랫폼 파생
 * (이미지 전용 '사용처' 입력과 중복되지 않도록)
 */
export const resolveMarketingImageUsageFromSetup = (
  contentType: string,
  channel: string,
): { imageUsage: string; snsPlatform: string } => {
  const type = String(contentType ?? '')
    .trim()
    .toUpperCase()
  const ch = String(channel ?? '')
    .trim()
    .toUpperCase()

  const snsPlatformByChannel: Record<string, string> = {
    INSTAGRAM: 'INSTAGRAM_FEED',
    FACEBOOK: 'FACEBOOK',
    LINKEDIN: 'LINKEDIN',
    X: 'X',
    YOUTUBE_COMMUNITY: 'YOUTUBE_COMMUNITY',
  }

  if (type === 'SNS' || ch in snsPlatformByChannel) {
    return {
      imageUsage: 'SNS_VISUAL',
      snsPlatform: snsPlatformByChannel[ch] ?? '',
    }
  }
  if (type === 'BLOG') return { imageUsage: 'THUMBNAIL', snsPlatform: '' }
  if (type === 'AD_COPY') return { imageUsage: 'BANNER', snsPlatform: '' }
  if (type === 'LANDING_PAGE') return { imageUsage: 'PRODUCT_DETAIL', snsPlatform: '' }
  if (type === 'EMAIL') return { imageUsage: 'BANNER', snsPlatform: '' }
  return { imageUsage: 'BANNER', snsPlatform: '' }
}

/** outputs → TEXT | IMAGE | BOTH */
export const resolveMarketingSubmitMode = (outputs: MarketingOutputKind[] | undefined): 'TEXT' | 'IMAGE' | 'BOTH' => {
  const set = new Set((outputs ?? []).filter((item) => item === 'TEXT' || item === 'IMAGE'))
  const hasText = set.has('TEXT')
  const hasImage = set.has('IMAGE')
  if (hasText && hasImage) return 'BOTH'
  if (hasImage) return 'IMAGE'
  return 'TEXT'
}

export const hasMarketingOutput = (payload: Pick<MarketingUnifiedFormPayload, 'outputs'>, kind: MarketingOutputKind) =>
  (payload.outputs ?? []).includes(kind)

/** 통합 폼 → 문구 프롬프트용 슬라이스 */
export const toMarketingTextPayload = (payload: MarketingUnifiedFormPayload): MarketingAuthoringFormPayload => ({
  contentType: payload.contentType,
  purpose: payload.purpose,
  audience: payload.audience,
  tones: [...payload.tones],
  length: payload.length,
  customLength: payload.customLength,
  channel: payload.channel,
  customChannel: payload.customChannel,
  promotionInformation: payload.promotionInformation,
  keyMessage: payload.keyMessage,
  customCallToAction: payload.customCallToAction,
  customPurpose: payload.customPurpose,
  customAudience: payload.customAudience,
  customTone: payload.customTone,
  referenceMode: payload.referenceMode,
  referenceFiles: [...payload.referenceFiles],
  referenceUrls: [...payload.referenceUrls],
  additionalRequirements: payload.additionalRequirements,
  outputSections: [...payload.outputSections],
  includeHashtags: payload.includeHashtags,
  variantCount: payload.variantCount,
})

/** 통합 폼 → 이미지 프롬프트용 슬라이스 */
export const toMarketingImagePayload = (payload: MarketingUnifiedFormPayload): MarketingImageFormPayload => ({
  contentType: payload.contentType,
  channel: payload.channel,
  customChannel: payload.customChannel,
  purpose: payload.purpose === 'OTHER' ? payload.customPurpose || payload.purpose : payload.purpose,
  customPurpose: payload.customPurpose,
  audience: payload.audience === 'OTHER' ? payload.customAudience || payload.audience : payload.audience,
  customAudience: payload.customAudience,
  promotionInformation: payload.promotionInformation,
  keyMessage: payload.keyMessage,
  additionalRequirements: payload.additionalRequirements,
  referenceFiles: [...payload.referenceFiles],
  variantCount: payload.variantCount,
  imageUsage: payload.imageUsage,
  snsPlatform: payload.snsPlatform,
  imageType: payload.imageType,
  visualStyle: payload.visualStyle,
  aspectRatio: payload.aspectRatio,
  customAspectRatio: payload.customAspectRatio,
  imageText: payload.imageText,
  brandColors: payload.brandColors,
})

/** 통합 마법사 스텝 키 */
export type MarketingWizardStepKey =
  | 'setup'
  | 'purpose'
  | 'audienceMessage'
  | 'textToneLength'
  | 'imageStyle'
  | 'confirm'

export type MarketingWizardStepDef = {
  key: MarketingWizardStepKey
  title: string
  question: string
  description?: string
  navHint?: string
}

const MARKETING_WIZARD_STEP_DEFS: Record<MarketingWizardStepKey, MarketingWizardStepDef> = {
  setup: {
    key: 'setup',
    title: '유형·출력',
    navHint: '무엇을, 어떤 형태로 만들까요?',
    question: '무엇을, 어떤 형태로 만들까요?',
    description: '콘텐츠 유형·게시 채널과 생성할 결과(글/그림)를 선택해 주세요.',
  },
  purpose: {
    key: 'purpose',
    title: '목적',
    navHint: '무엇을 홍보하시나요?',
    question: '무엇을 홍보하시나요?',
    description: '작성 목적과 홍보할 상품·서비스를 알려주세요.',
  },
  audienceMessage: {
    key: 'audienceMessage',
    title: '타겟·메시지',
    navHint: '누구에게, 무엇을 전할까요?',
    question: '누구에게, 무엇을 전할까요?',
    description: '타겟 고객과 핵심 메시지를 정해 주세요.',
  },
  textToneLength: {
    key: 'textToneLength',
    title: '톤·분량·구성',
    navHint: '톤과 분량, 구성을 정할까요?',
    question: '톤과 분량, 구성을 정할까요?',
    description: '톤앤매너, 분량, 출력 구성을 한번에 정해 주세요.',
  },
  imageStyle: {
    key: 'imageStyle',
    title: '비율·분위기·스타일',
    navHint: '비율과 분위기, 스타일을 정할까요?',
    question: '비율과 분위기, 스타일을 정할까요?',
    description: '화면 비율, 이미지 분위기·스타일, 브랜드 컬러를 정해 주세요.',
  },
  confirm: {
    key: 'confirm',
    title: '최종 확인',
    navHint: '모든 내용을 확인해요',
    question: '모든 내용을 확인해요',
    description: '선택한 조건을 확인하고 필요한 내용을 추가해 주세요.',
  },
}

/** outputs 기준 동적 스텝 목록 */
export const buildMarketingWizardSteps = (outputs: MarketingOutputKind[]): MarketingWizardStepDef[] => {
  const hasText = outputs.includes('TEXT')
  const hasImage = outputs.includes('IMAGE')
  const keys: MarketingWizardStepKey[] = ['setup', 'purpose', 'audienceMessage']
  if (hasText) keys.push('textToneLength')
  if (hasImage) keys.push('imageStyle')
  keys.push('confirm')
  return keys.map((key) => MARKETING_WIZARD_STEP_DEFS[key])
}

/** 유효성 실패 필드 포커스 — 컨테이너 스크롤 + 지정 input 또는 내부 첫 focusable */
export const focusMarketingField = async (el: HTMLElement | null | undefined, input?: { focus: () => void } | null) => {
  if (!el && !input) return
  await nextTick()
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (input?.focus) {
    input.focus()
    return
  }
  const focusable = el?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')
  focusable?.focus?.()
}

// ─── Detect ──────────────────────────────────────────────────────────────────

/** svcTy=K · USE_YN=Y — 마케팅 콘텐츠 작성 에이전트 */
export const isMarketingAuthoringAgent = (agent: Agent | null | undefined): boolean =>
  !!agent && agent.useYn === 'Y' && agent.svcTy === MARKETING_AUTHORING_SVC_TY

export const parseMarketingAuthoringConfigFromAgent = (agent: Agent) => {
  if (!isMarketingAuthoringAgent(agent)) return null
  const raw = agent.subCfg?.additionalConfig
  if (!raw) return getDefaultMarketingAuthoringConfig()
  try {
    const config = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>
    if (!config || typeof config !== 'object' || !Object.keys(config).length) {
      return getDefaultMarketingAuthoringConfig()
    }
    return parseMarketingAuthoringAgentConfig(config)
  } catch {
    return getDefaultMarketingAuthoringConfig()
  }
}

export const isMarketingImagePrompt = (promptText: string): boolean => {
  const raw = String(promptText ?? '')
  return raw.includes('agentType: marketingImage') || raw.includes('## 이미지 제작 조건')
}

/** 문구·콘텐츠 작성 프롬프트 여부 (채팅 로그 재구성용) */
export const isMarketingTextPrompt = (promptText: string): boolean => {
  const raw = String(promptText ?? '').trim()
  if (!raw) return false
  return raw.includes('## 작성 조건') && raw.includes('## 출력 형식')
}

/** MARKETING_AUTHORING 프롬프트 여부 (텍스트·이미지) */
export const isMarketingAuthoringPrompt = (promptText: string): boolean =>
  isMarketingTextPrompt(promptText) || isMarketingImagePrompt(promptText)

/** 프롬프트 마커로 모드 판별 */
export const resolveMarketingPromptMode = (promptText: string): 'TEXT' | 'IMAGE' | null => {
  if (isMarketingImagePrompt(promptText)) return 'IMAGE'
  if (isMarketingTextPrompt(promptText)) return 'TEXT'
  return null
}

/** 목록 API — qContent / qcontent 모두 수용 */
export const resolveMarketingRoomQContent = (room: Pick<ChatRoom, 'qContent'> & { qcontent?: string }): string =>
  String(room.qContent ?? room.qcontent ?? '').trim()

/** 채팅방 목록에서 마케팅 제작 내역 식별 (svcTy=K 또는 마케팅 에이전트) */
export const isMarketingAuthoringChatRoom = (
  room: Pick<ChatRoom, 'agentId' | 'svcTy'>,
  marketingAgentIds: Set<string> | ReadonlySet<string>,
): boolean => {
  if (
    String(room.svcTy ?? '')
      .trim()
      .toUpperCase() === MARKETING_AUTHORING_SVC_TY
  ) {
    return true
  }
  const agentId = String(room.agentId ?? '').trim()
  return !!(agentId && marketingAgentIds.has(agentId))
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const optionLabel = (options: MarketingAuthoringOption[], value: string): string =>
  options.find((item) => item.value === value)?.label ?? value

const resolveChannelLabel = (value: string, config?: MarketingAuthoringAgentConfig | null): string => {
  const channels = Object.values(config?.channelsByContentType ?? MARKETING_AUTHORING_CHANNELS_BY_TYPE).flat()
  return optionLabel(channels, value)
}

const resolveSelection = (options: MarketingAuthoringOption[], value: string, customValue: string) =>
  value === 'OTHER' ? customValue.trim() : optionLabel(options, value)

export const buildMarketingAuthoringConditionSummary = (
  payload: MarketingAuthoringFormPayload,
  config?: MarketingAuthoringAgentConfig | null,
): MarketingAuthoringConditionSummary => {
  const resolved = config ?? getDefaultMarketingAuthoringConfig()
  const workflow = getMarketingAuthoringWorkflow(resolved)
  const contentTypes = resolved.contentTypes.length ? resolved.contentTypes : MARKETING_AUTHORING_CONTENT_TYPES
  const lengthLabel =
    payload.length === 'CUSTOM' ? payload.customLength.trim() : optionLabel(workflow.lengths, payload.length)
  return {
    contentType: optionLabel(contentTypes, payload.contentType),
    purpose: resolveSelection(workflow.purposes, payload.purpose, payload.customPurpose),
    audience: resolveSelection(workflow.audiences, payload.audience, payload.customAudience),
    tones: payload.tones.map((tone) => resolveSelection(workflow.tones, tone, payload.customTone)).join(', '),
    length: lengthLabel,
    channel: payload.channel
      ? payload.channel === 'OTHER'
        ? payload.customChannel.trim()
        : resolveChannelLabel(payload.channel, resolved)
      : undefined,
    keyMessage: payload.keyMessage.trim() || undefined,
    callToAction: payload.customCallToAction.trim() || undefined,
    promotionInformation: payload.promotionInformation.trim() || undefined,
    additionalRequirements: payload.additionalRequirements.trim() || undefined,
  }
}

export const buildMarketingAuthoringPrompt = (
  payload: MarketingAuthoringFormPayload,
  config?: MarketingAuthoringAgentConfig | null,
): string => {
  const resolved = config ?? getDefaultMarketingAuthoringConfig()
  const workflow = getMarketingAuthoringWorkflow(resolved)
  const requestedSections = workflow.outputSections
    .filter((section) => payload.outputSections.includes(section.value))
    .map((section) => section.label)
  const conditions = buildMarketingAuthoringConditionSummary(payload, resolved)
  const referenceUrls =
    payload.referenceMode === 'WEB' ? payload.referenceUrls.map((value) => value.trim()).filter(Boolean) : []
  const referenceFileNames = payload.referenceMode === 'FILE' ? payload.referenceFiles.map((file) => file.name) : []
  const constraints = resolved.constraints.length ? resolved.constraints : MARKETING_AUTHORING_DEFAULT_CONSTRAINTS
  const includeHashtags = payload.includeHashtags === 'Y'
  const variantCount = clampMarketingAuthoringVariantCount(payload.variantCount)
  const schemaExample = {
    summary: '',
    conditions: { contentType: '', purpose: '', audience: '', tones: '', length: '' },
    variants: Array.from({ length: variantCount }, (_, i) => ({
      id: i + 1,
      label: '',
      recommended: i === 0,
      content: '',
      charCount: 0,
    })),
  }

  return [
    '## 작성 조건',
    `- 콘텐츠 유형: ${conditions.contentType}`,
    `- 작성 목적: ${conditions.purpose}`,
    `- 대상 독자: ${conditions.audience}`,
    `- 톤앤매너: ${conditions.tones}`,
    `- 분량: ${conditions.length}`,
    includeHashtags ? '- 해시태그 포함' : '',
    conditions.channel ? `- 게시 채널: ${conditions.channel}` : '',
    requestedSections.length
      ? `- 포함할 요소: ${requestedSections.join(', ')} (항목명 라벨로 표기하지 말고 content 본문에 자연스럽게 녹여 작성)`
      : '',
    conditions.promotionInformation ? `\n## 홍보할 상품·서비스\n${conditions.promotionInformation}` : '',
    conditions.keyMessage ? `\n## 핵심 메시지\n${conditions.keyMessage}` : '',
    conditions.callToAction ? `\n## 유도할 행동\n${conditions.callToAction}` : '',
    referenceFileNames.length ? `\n## 첨부 참고자료\n${referenceFileNames.map((name) => `- ${name}`).join('\n')}` : '',
    referenceUrls.length ? `\n## 웹 참고자료 URL\n${referenceUrls.map((url) => `- ${url}`).join('\n')}` : '',
    conditions.additionalRequirements ? `\n## 추가 요청사항\n${conditions.additionalRequirements}` : '',
    constraints.length ? `\n## 제약\n${constraints.map((item) => `- ${item}`).join('\n')}` : '',
    `\n## 생성 요구사항\n- variants 배열에 시안을 정확히 ${variantCount}개 생성할 것. 더 적거나 많으면 안 됨`,
    `- 분량 "${conditions.length}"는 상한(최대)이 아니라 목표 분량이다`,
    '- 각 variants[].content는 목표 분량 ±10%로 맞출 것',
    '- 모자라면 근거·사례·혜택·사용 장면·FAQ 등으로 살을 붙여 채울 것. 짧게 끝내면 안 됨',
    '- variants[].charCount에는 해당 content의 실제 글자 수(공백 포함)를 넣을 것',
    '\n## content 작성\n- variants[].content는 사용자가 바로 복사해 쓸 수 있는 완성 문안 하나\n- "제목:", "프리헤더:", "핵심 혜택:", "본문:", "CTA:" 같은 앞머리 라벨·섹션명은 절대 넣지 말 것',
    '## 출력 형식',
    JSON.stringify(schemaExample),
  ]
    .filter(Boolean)
    .join('\n')
}

const marketingImageTypeLabel = (value: string) => optionLabel(MARKETING_IMAGE_TYPES, value)

const marketingImageAtmosphereLabel = (value: string) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => optionLabel(MARKETING_IMAGE_ATMOSPHERES, item))
    .join(', ')

const resolveMarketingImageSelection = (value: string, customValue: string) =>
  value === 'OTHER' ? customValue.trim() : value.trim()

const resolveMarketingImageChannelLabel = (payload: MarketingImageFormPayload) => {
  const setupChannel = String(payload.channel ?? '').trim()
  if (!setupChannel) return ''
  if (setupChannel === 'OTHER') return String(payload.customChannel ?? '').trim() || '기타'
  const channels = Object.values(MARKETING_AUTHORING_CHANNELS_BY_TYPE).flat()
  return optionLabel(channels, setupChannel)
}

export const buildMarketingImageConditionSummary = (
  payload: MarketingImageFormPayload,
  config?: MarketingAuthoringAgentConfig | null,
): MarketingAuthoringConditionSummary => {
  const workflow = getMarketingAuthoringWorkflow(config ?? getDefaultMarketingAuthoringConfig())
  return {
    contentType: marketingImageTypeLabel(payload.imageType),
    purpose: resolveSelection(workflow.purposes, payload.purpose, payload.customPurpose),
    audience: resolveSelection(workflow.audiences, payload.audience, payload.customAudience),
    tones: marketingImageAtmosphereLabel(payload.visualStyle),
    length: resolveMarketingImageSelection(payload.aspectRatio, payload.customAspectRatio),
    channel: resolveMarketingImageChannelLabel(payload),
    keyMessage: payload.keyMessage.trim() || undefined,
    promotionInformation: payload.promotionInformation.trim() || undefined,
    additionalRequirements: payload.additionalRequirements.trim() || undefined,
  }
}

export const buildMarketingImagePrompt = (
  payload: MarketingImageFormPayload,
  config?: MarketingAuthoringAgentConfig | null,
  options?: { textVariants?: MarketingAuthoringVariant[] },
): string => {
  const textVariants = (options?.textVariants ?? []).filter((item) => String(item.content ?? '').trim())
  const alignedWithText = textVariants.length > 0
  const variantCount = alignedWithText ? textVariants.length : clampMarketingAuthoringVariantCount(payload.variantCount)
  const conditions = buildMarketingImageConditionSummary(payload, config)
  const textAlignmentBlock = alignedWithText
    ? [
        '\n## 시안별 문구 연계 (이미지 N번 = 문구 시안 N번)',
        '아래 문구 시안과 같은 번호의 이미지가 한 세트로 보이도록 장면을 구성할 것.',
        ...textVariants.map((variant, index) => {
          const label = String(variant.label ?? '').trim()
          const brief = toMarketingVisualBrief(String(variant.content ?? ''))
          return [
            `### 시안 ${index + 1}${label ? ` · ${label}` : ''}`,
            brief,
            `- 이 시안 이미지는 위 문구의 핵심 메시지·톤·상황을 시각화할 것`,
            `- 다른 시안과 구도·강조점이 겹치지 않게 하되, 같은 캠페인으로 느껴지게 할 것`,
          ].join('\n')
        }),
      ].join('\n\n')
    : ''

  return [
    'agentType: marketingImage',
    '## 이미지 제작 조건',
    `- 사용 채널: ${conditions.channel || resolveMarketingImageChannelLabel(payload)}`,
    `- 표현 방식: ${conditions.contentType}`,
    `- 제작 목적: ${conditions.purpose}`,
    `- 대상 고객: ${conditions.audience}`,
    `- 분위기: ${conditions.tones}`,
    `- 화면 비율: ${conditions.length}`,
    `- 시안 개수: ${variantCount}`,
    payload.brandColors.trim() ? `- 브랜드 컬러: ${payload.brandColors.trim()}` : '',
    payload.imageText.trim()
      ? `- 이미지 내 문구: ${payload.imageText.trim()}`
      : alignedWithText
        ? '- 이미지 내 문구: 각 시안은 연계된 문구 시안의 핵심 한 줄만 사용(없으면 텍스트 없이 시각만)'
        : '- 이미지 내 문구: 사용하지 않음',
    '\n## 홍보할 상품·서비스',
    payload.promotionInformation.trim(),
    '\n## 핵심 메시지',
    payload.keyMessage.trim(),
    textAlignmentBlock,
    payload.referenceFiles.length
      ? `\n## 첨부 참고자료\n${payload.referenceFiles.map((file) => `- ${file.name}`).join('\n')}`
      : '',
    payload.additionalRequirements.trim() ? `\n## 추가 요청사항\n${payload.additionalRequirements.trim()}` : '',
    '\n## 생성 요구사항',
    `- 위 조건을 반영한 완성형 마케팅 이미지 시안을 정확히 ${variantCount}개 생성할 것. 더 적거나 많으면 안 됨`,
    alignedWithText
      ? '- "현재 생성 시안: N / …" 번호가 주어지면 해당 번호의 「시안별 문구 연계」만 집중 반영할 것'
      : '- 시안마다 구도·표현·강조점을 다르게 해 비교 선택할 수 있게 할 것',
    alignedWithText
      ? '- 이미지 N과 문구 시안 N은 같은 메시지·분위기·대상으로 어울려야 하며, 서로 무관한 장면이 되면 안 됨'
      : '',
    '- 첨부 참고자료가 있으면 브랜드·이미지·문구 가이드를 우선 반영할 것',
    '- 이미지 안의 텍스트는 요청된 문구만 사용하고, 임의의 글자나 워터마크를 추가하지 말 것',
    '- 결과 설명이나 JSON 대신 생성된 이미지를 반환할 것',
  ]
    .filter(Boolean)
    .join('\n')
}

/** 이미지 프롬프트용 — 문구 시안을 짧은 시각 브리프로 축소 */
const toMarketingVisualBrief = (content: string, maxLen = 280): string => {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen).replace(/\s+\S*$/, '')}…`
}

/** 문구 answer rContent → 시안 목록 (BOTH 이미지 연계용) */
export const resolveMarketingTextVariantsFromContent = (rContent: string): MarketingAuthoringVariant[] =>
  parseMarketingAuthoringResult(rContent)?.variants ?? []

const pickPromptSection = (promptText: string, title: string): string => {
  const matched = promptText.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(?=\\n## |$)`))
  return matched?.[1]?.trim() ?? ''
}

const pickPromptBullet = (block: string, label: string): string => {
  const line = block.split('\n').find((item) => item.startsWith(`- ${label}:`))
  return line ? line.slice(label.length + 3).trim() : ''
}

type MarketingPromptConditionFieldMap = {
  blockTitle: string
  isMatch: (promptText: string) => boolean
  fields: {
    contentType: string
    purpose: string
    audience: string
    tones: string
    length: string
    channel: string
  }
  requireContentType: boolean
  includeCallToAction: boolean
}

const TEXT_PROMPT_CONDITION_FIELDS: MarketingPromptConditionFieldMap = {
  blockTitle: '작성 조건',
  isMatch: isMarketingTextPrompt,
  fields: {
    contentType: '콘텐츠 유형',
    purpose: '작성 목적',
    audience: '대상 독자',
    tones: '톤앤매너',
    length: '분량',
    channel: '게시 채널',
  },
  requireContentType: true,
  includeCallToAction: true,
}

const IMAGE_PROMPT_CONDITION_FIELDS: MarketingPromptConditionFieldMap = {
  blockTitle: '이미지 제작 조건',
  isMatch: isMarketingImagePrompt,
  fields: {
    contentType: '표현 방식',
    purpose: '제작 목적',
    audience: '대상 고객',
    tones: '분위기',
    length: '화면 비율',
    channel: '사용 채널',
  },
  requireContentType: false,
  includeCallToAction: false,
}

const parseMarketingConditionsByFieldMap = (
  promptText: string,
  fieldMap: MarketingPromptConditionFieldMap,
): MarketingAuthoringConditionSummary | null => {
  if (!fieldMap.isMatch(promptText)) return null
  const block = pickPromptSection(promptText, fieldMap.blockTitle)
  const contentType = pickPromptBullet(block, fieldMap.fields.contentType)
  if (fieldMap.requireContentType && !contentType) return null

  return {
    contentType,
    purpose: pickPromptBullet(block, fieldMap.fields.purpose),
    audience: pickPromptBullet(block, fieldMap.fields.audience),
    tones: pickPromptBullet(block, fieldMap.fields.tones),
    length: pickPromptBullet(block, fieldMap.fields.length),
    channel: pickPromptBullet(block, fieldMap.fields.channel) || undefined,
    keyMessage: pickPromptSection(promptText, '핵심 메시지') || undefined,
    callToAction: fieldMap.includeCallToAction ? pickPromptSection(promptText, '유도할 행동') || undefined : undefined,
    promotionInformation: pickPromptSection(promptText, '홍보할 상품·서비스') || undefined,
    additionalRequirements: pickPromptSection(promptText, '추가 요청사항') || undefined,
  }
}

const parseMarketingAuthoringConditionsFromPrompt = (promptText: string): MarketingAuthoringConditionSummary | null =>
  parseMarketingConditionsByFieldMap(promptText, TEXT_PROMPT_CONDITION_FIELDS)

export const parseMarketingImageConditionsFromPrompt = (
  promptText: string,
): MarketingAuthoringConditionSummary | null =>
  parseMarketingConditionsByFieldMap(promptText, IMAGE_PROMPT_CONDITION_FIELDS)

/** 프롬프트 타입에 맞는 조건 파서 — IMAGE/TEXT 공통 진입점 */
export const parseMarketingConditionsFromPrompt = (promptText: string): MarketingAuthoringConditionSummary | null => {
  if (isMarketingImagePrompt(promptText)) return parseMarketingImageConditionsFromPrompt(promptText)
  if (isMarketingTextPrompt(promptText)) return parseMarketingAuthoringConditionsFromPrompt(promptText)
  return null
}

// ─── Result ──────────────────────────────────────────────────────────────────

const parseMarketingImageResult = (rContent: string, promptText: string): MarketingAuthoringResult | null => {
  const imageDataUrls = String(rContent ?? '').match(/data:image\/[a-z0-9+.-]+;base64,[a-z0-9+/=]+/gi) ?? []
  const conditions = parseMarketingImageConditionsFromPrompt(promptText)
  if (!imageDataUrls.length || !conditions) return null
  return {
    mode: 'IMAGE',
    summary: MARKETING_RESULT_SUMMARY_DONE,
    conditions,
    variants: [],
    imageDataUrls,
  }
}

const normalizeVariant = (value: unknown, index: number): MarketingAuthoringVariant | null => {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const content = String(row.content ?? '').trim()
  if (!content) return null
  const parsedCount = Number(row.charCount)
  return {
    id: Number(row.id) > 0 ? Number(row.id) : index + 1,
    label: String(row.label ?? '').trim() || `시안 ${index + 1}`,
    recommended: row.recommended === true || index === 0,
    content,
    charCount: Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : [...content].length,
  }
}

const extractMarketingAuthoringJsonText = (rContent: string): string => {
  const raw = String(rContent ?? '').trim()
  if (!raw) return ''
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  const source = fenced || raw
  const complete = source.match(/\{[\s\S]*\}/)
  if (complete) return complete[0].trim()
  const start = source.indexOf('{')
  if (start >= 0) return source.slice(start).trim()
  return ''
}

const parseMarketingAuthoringResult = (rContent: string): MarketingAuthoringResult | null => {
  const jsonText = extractMarketingAuthoringJsonText(rContent)
  if (!jsonText) return null
  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>
    const variantsRaw = Array.isArray(parsed.variants) ? parsed.variants : []
    const variants = variantsRaw
      .map((item, index) => normalizeVariant(item, index))
      .filter((item): item is MarketingAuthoringVariant => !!item)
    if (!variants.length) return null

    const conditionsRaw = (parsed.conditions ?? {}) as Record<string, unknown>
    const conditions: MarketingAuthoringConditionSummary = {
      contentType: String(conditionsRaw.contentType ?? '').trim(),
      purpose: String(conditionsRaw.purpose ?? '').trim(),
      audience: String(conditionsRaw.audience ?? '').trim(),
      tones: String(conditionsRaw.tones ?? '').trim(),
      length: String(conditionsRaw.length ?? '').trim(),
      channel: String(conditionsRaw.channel ?? '').trim() || undefined,
      keyMessage: String(conditionsRaw.keyMessage ?? '').trim() || undefined,
      callToAction: String(conditionsRaw.callToAction ?? '').trim() || undefined,
      promotionInformation: String(conditionsRaw.promotionInformation ?? '').trim() || undefined,
      additionalRequirements: String(conditionsRaw.additionalRequirements ?? '').trim() || undefined,
    }

    const recommendedIndex = variants.findIndex((item) => item.recommended)
    if (recommendedIndex < 0) variants[0].recommended = true
    else {
      variants.forEach((item, index) => {
        item.recommended = index === recommendedIndex
      })
    }

    return {
      summary: String(parsed.summary ?? '').trim() || MARKETING_RESULT_SUMMARY_DONE,
      conditions,
      variants,
    }
  } catch {
    return null
  }
}

/** BOTH 2차(이미지) 진입 전 — 문구 answer에 시안이 실제로 파싱됐는지 */
export const hasMarketingAuthoringTextVariants = (rContent: string): boolean =>
  (parseMarketingAuthoringResult(rContent)?.variants.length ?? 0) > 0

/**
 * 마케팅 작성 answer에 연결된 question
 * - complete/로그 재조회: Q/A가 동일 서버 logId
 * - 스트리밍 중: 임시 logId가 서로 다르므로 직전 question 사용
 */
const findLinkedMarketingAuthoringQuestion = (
  messages: ChatMessage[],
  answerMsg: ChatMessage,
): ChatMessage | undefined => {
  if (answerMsg.type !== 'answer') return undefined
  const logId = String(answerMsg.logId ?? '').trim()
  if (logId) {
    const byLogId = messages.find((m) => m.type === 'question' && m.logId === logId)
    if (byLogId) return byLogId
  }
  const idx = messages.findIndex((m) => m.type === 'answer' && m.logId === answerMsg.logId)
  if (idx > 0 && messages[idx - 1]?.type === 'question') return messages[idx - 1]
  return undefined
}

/**
 * 전송 직후 마케팅 합성 프롬프트 question 숨김
 * @returns 마케팅 프롬프트를 숨겼는지 여부
 */
export const linkMarketingAuthoringMessagePair = (messages: ChatMessage[]): boolean => {
  const reversed = [...messages].reverse()
  const question = reversed.find((m) => m.type === 'question')
  if (!question || !isMarketingAuthoringPrompt(question.qContent ?? '')) return false
  question.hiddenFromDisplay = true
  return true
}

/** 마케팅 콘텐츠 제작 파이프라인 answer */
export const isMarketingAuthoringAnswer = (answerMsg: ChatMessage, messages: ChatMessage[]): boolean => {
  if (answerMsg.type !== 'answer') return false
  const question = findLinkedMarketingAuthoringQuestion(messages, answerMsg)
  return !!(question && isMarketingAuthoringPrompt(question.qContent ?? ''))
}

/** 마케팅 이미지 제작 파이프라인 answer */
export const isMarketingImageAnswer = (answerMsg: ChatMessage, messages: ChatMessage[]): boolean => {
  if (answerMsg.type !== 'answer') return false
  const question = findLinkedMarketingAuthoringQuestion(messages, answerMsg)
  return !!(question && isMarketingImagePrompt(question.qContent ?? ''))
}

/** 이미지 생성 대기용 결과 카드 데이터 — 프롬프트 조건만으로 구성 */
export const resolveMarketingImagePendingResult = (
  answerMsg: ChatMessage,
  messages: ChatMessage[],
): MarketingAuthoringResult | null => {
  if (!isMarketingImageAnswer(answerMsg, messages)) return null
  const question = findLinkedMarketingAuthoringQuestion(messages, answerMsg)
  const conditions = parseMarketingImageConditionsFromPrompt(question?.qContent ?? '')
  if (!conditions) return null
  return {
    mode: 'IMAGE',
    summary: MARKETING_RESULT_SUMMARY_PENDING,
    conditions,
    variants: [],
    imageDataUrls: [],
  }
}

/** /marketing 제출 직후 — 채팅 응답 전에도 개별 결과 카드 셸을 바로 보여 주기 위함 */
export const buildMarketingPendingResultFromPayload = (
  payload: MarketingAuthoringSubmitPayload,
  config?: MarketingAuthoringAgentConfig | null,
): MarketingAuthoringResult => {
  const mode = resolveMarketingSubmitMode(payload.outputs)
  const summary = MARKETING_RESULT_SUMMARY_PENDING
  const conditions =
    mode === 'IMAGE'
      ? buildMarketingImageConditionSummary(toMarketingImagePayload(payload), config)
      : buildMarketingAuthoringConditionSummary(toMarketingTextPayload(payload), config)

  return {
    mode,
    summary,
    conditions,
    ...(mode === 'BOTH'
      ? {
          imageConditions: buildMarketingImageConditionSummary(toMarketingImagePayload(payload), config),
        }
      : {}),
    variants: [],
    ...(mode === 'IMAGE' || mode === 'BOTH' ? { imageDataUrls: [] } : {}),
  }
}

/**
 * answer rContent + question 프롬프트 조건을 합쳐 결과 카드 데이터 구성.
 * 응답 conditions가 비어 있으면 프롬프트에서 파싱한 값으로 보강.
 */
export const resolveMarketingAuthoringResult = (
  answerMsg: ChatMessage,
  messages: ChatMessage[],
): MarketingAuthoringResult | null => {
  if (!isMarketingAuthoringAnswer(answerMsg, messages)) return null
  const question = findLinkedMarketingAuthoringQuestion(messages, answerMsg)
  const questionContent = question?.qContent ?? ''
  if (isMarketingImagePrompt(questionContent)) {
    return parseMarketingImageResult(String(answerMsg.rContent ?? ''), questionContent)
  }

  const parsed = parseMarketingAuthoringResult(String(answerMsg.rContent ?? ''))
  if (!parsed) return null

  const promptConditions = parseMarketingConditionsFromPrompt(questionContent)
  if (!promptConditions) return { ...parsed, mode: 'TEXT' }

  return {
    ...parsed,
    mode: 'TEXT',
    conditions: {
      ...parsed.conditions,
      ...Object.fromEntries(Object.entries(promptConditions).filter(([, value]) => String(value ?? '').trim())),
    },
  }
}

/**
 * 같은 방의 문구·이미지 answer를 분리 수집
 */
export const resolveMarketingTextAndImageResultsFromMessages = (
  messageList: ChatMessage[],
): { textResult: MarketingAuthoringResult | null; imageResult: MarketingAuthoringResult | null } => {
  let textResult: MarketingAuthoringResult | null = null
  let imageResult: MarketingAuthoringResult | null = null

  for (const answer of messageList) {
    if (answer.type !== 'answer') continue
    const resolved = resolveMarketingAuthoringResult(answer, messageList)
    if (!resolved) continue
    if (resolved.mode === 'IMAGE') imageResult = resolved
    else textResult = { ...resolved, mode: 'TEXT' }
  }

  return { textResult, imageResult }
}

/**
 * 같은 방의 문구·이미지 answer를 합쳐 BOTH(통합) 결과로 구성.
 * 둘 중 하나만 있으면 해당 단일 결과 반환.
 */
export const resolveMarketingCombinedResultFromMessages = (
  messageList: ChatMessage[],
): MarketingAuthoringResult | null => {
  const { textResult, imageResult } = resolveMarketingTextAndImageResultsFromMessages(messageList)

  if (textResult && imageResult) {
    return {
      ...textResult,
      mode: 'BOTH',
      imageDataUrls: imageResult.imageDataUrls ?? [],
      imageConditions: imageResult.conditions,
      summary: MARKETING_RESULT_SUMMARY_DONE,
    }
  }

  return imageResult ?? textResult
}

/** BOTH 표시용 — 문구 시안 + 이미지(또는 대기 셸) 병합 */
export const mergeMarketingBothResult = (
  textResult: MarketingAuthoringResult | null | undefined,
  imageResult: MarketingAuthoringResult | null | undefined,
  fallbackConditions?: MarketingAuthoringConditionSummary | null,
  fallbackImageConditions?: MarketingAuthoringConditionSummary | null,
): MarketingAuthoringResult | null => {
  if (!textResult && !imageResult) return null
  const emptyConditions: MarketingAuthoringConditionSummary = {
    contentType: '',
    purpose: '',
    audience: '',
    tones: '',
    length: '',
  }
  // 문구 조건은 text 우선 — image 조건을 contentType/length에 넣으면 메타 칩이 깨짐
  return {
    mode: 'BOTH',
    summary:
      textResult && imageResult?.imageDataUrls?.length
        ? MARKETING_RESULT_SUMMARY_DONE
        : MARKETING_RESULT_SUMMARY_PENDING,
    conditions: textResult?.conditions ?? fallbackConditions ?? emptyConditions,
    imageConditions: imageResult?.conditions ?? textResult?.imageConditions ?? fallbackImageConditions ?? undefined,
    variants: textResult?.variants ?? [],
    imageDataUrls: imageResult?.imageDataUrls ?? [],
  }
}

/**
 * 채팅 인라인 answer 1건 기준 표시 결과
 * - 통합(문구+이미지): 이미지 answer에 병합 카드를 붙이고, 문구 answer는 숨김
 * - 단일: 해당 answer 결과만 표시
 */
export const resolveMarketingInlineDisplayForAnswer = (
  answerMsg: ChatMessage,
  messageList: ChatMessage[],
): { result: MarketingAuthoringResult | null; hideAnswer: boolean; isImageLoading: boolean } => {
  if (answerMsg.type !== 'answer' || !isMarketingAuthoringAnswer(answerMsg, messageList)) {
    return { result: null, hideAnswer: false, isImageLoading: false }
  }

  const { textResult, imageResult } = resolveMarketingTextAndImageResultsFromMessages(messageList)
  const isImageAns = isMarketingImageAnswer(answerMsg, messageList)
  const isStreaming = answerMsg.isStreaming === true
  const imageLoading = isStreaming && isImageAns
  const hasBothParts = !!(textResult && (imageResult || imageLoading))

  // 통합: 문구 answer는 숨기고, 이미지 answer에 문구+이미지 합쳐 표시
  if (hasBothParts) {
    if (!isImageAns) return { result: null, hideAnswer: true, isImageLoading: false }
    const imagePart = imageLoading
      ? (resolveMarketingImagePendingResult(answerMsg, messageList) ?? imageResult)
      : imageResult
    return {
      result: mergeMarketingBothResult(textResult, imagePart),
      hideAnswer: false,
      isImageLoading: imageLoading,
    }
  }

  if (!isStreaming) {
    const single = resolveMarketingAuthoringResult(answerMsg, messageList)
    return { result: single, hideAnswer: false, isImageLoading: false }
  }

  if (imageLoading) {
    return {
      result: resolveMarketingImagePendingResult(answerMsg, messageList),
      hideAnswer: false,
      isImageLoading: true,
    }
  }

  return { result: null, hideAnswer: false, isImageLoading: false }
}

// ─── History (pure) ──────────────────────────────────────────────────────────

const normalizeMarketingHistoryMetaBadges = (badges: string[]): string[] =>
  badges
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 3)

/** 목록 메타 배지 — contentType · channel · purpose (각각 별도 칩) */
export const buildMarketingHistoryMetaBadges = (
  conditions: Pick<MarketingAuthoringConditionSummary, 'contentType' | 'channel' | 'purpose'> | null,
): string[] => {
  if (!conditions) return []
  return normalizeMarketingHistoryMetaBadges([conditions.contentType, conditions.channel ?? '', conditions.purpose])
}

export const extractMarketingHistoryMetaBadgesFromPrompt = (promptText: string): string[] =>
  buildMarketingHistoryMetaBadges(parseMarketingConditionsFromPrompt(promptText))

export const buildMarketingHistoryMetaBadgesFromPayload = (
  payload: MarketingAuthoringSubmitPayload,
  config?: MarketingAuthoringAgentConfig | null,
): string[] => buildMarketingHistoryMetaBadges(buildMarketingPendingResultFromPayload(payload, config).conditions)

/** 제출 payload → 채팅방 저장용 제목 (모드 접두 + 요약) */
export const buildMarketingRoomTitleFromPayload = (
  payload: MarketingAuthoringSubmitPayload,
  config?: MarketingAuthoringAgentConfig | null,
): string => {
  const pending = buildMarketingPendingResultFromPayload(payload, config)
  const mode = resolveMarketingSubmitMode(payload.outputs)
  const modeLabel = mode === 'BOTH' ? '통합' : mode === 'IMAGE' ? '이미지' : '문구'
  const summary = buildMarketingHistoryMetaBadges(pending.conditions).join(' · ')
  return summary ? `${modeLabel} · ${summary}` : `${modeLabel} 제작`
}

/** 제작 내역 카드 createDt — createdAt/createDt 모두 수용, 표시용 문자열 보장 */
export const resolveMarketingHistoryCreateDt = (room: Pick<ChatRoom, 'createdAt'> & { createDt?: string }): string => {
  const raw = String(room.createDt ?? room.createdAt ?? '').trim()
  return raw || '-'
}

/** 제작 내역 카드 modifyDt — 수정일 없으면 생성일 */
export const resolveMarketingHistoryModifyDt = (
  room: Pick<ChatRoom, 'createdAt'> & { createDt?: string; modifyDt?: string; updateDt?: string },
): string => {
  const raw = String(room.modifyDt ?? room.updateDt ?? room.createDt ?? room.createdAt ?? '').trim()
  return raw || '-'
}

/** 프롬프트에서 작성 조건 요약 파싱 */
export const resolveMarketingHistoryConditions = (
  room: Pick<ChatRoom, 'qContent' | 'roomTitle' | 'title'> & { qcontent?: string },
): MarketingAuthoringConditionSummary | null => parseMarketingConditionsFromPrompt(resolveMarketingRoomQContent(room))

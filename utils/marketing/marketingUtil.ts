import { nextTick, ref } from 'vue'
import type { Agent, MarketingAuthoringAgentConfig, MarketingAuthoringOption } from '~/types/agent'
import type {
  MarketingAuthoringConditionSummary,
  MarketingAuthoringResult,
  MarketingAuthoringSubmitPayload,
  MarketingOutputKind,
  MarketingUnifiedFormPayload,
} from '~/types/marketing'
import {
  getDefaultMarketingAuthoringConfig,
  MARKETING_AUTHORING_CHANNELS_BY_TYPE,
  MARKETING_AUTHORING_CONTENT_TYPES,
  MARKETING_AUTHORING_SVC_TY,
  MARKETING_IMAGE_ATMOSPHERES,
  MARKETING_IMAGE_SNS_PLATFORMS,
  MARKETING_IMAGE_TYPES,
  MARKETING_IMAGE_USAGES,
} from '~/utils/agent/marketingAuthoringConfigUtil'

export const MARKETING_AGENT_THEME_FALLBACK_HEX = '#7c5cfc'
export const MARKETING_AUTHORING_VARIANT_COUNT_MAX = 5
export const MARKETING_PREPARING_STATUS_INTERVAL_MS = 3000
export const MARKETING_IMAGE_LOAD_TIMEOUT_MS = 30_000
export const MARKETING_RESULT_SUMMARY_PENDING = '요청하신 조건으로 콘텐츠를 생성하고 있습니다.'

export const MARKETING_FORM_MESSAGES = {
  VARIANT_COUNT_REQUIRED: '시안 생성 개수를 선택해 주세요.',
  REFERENCE_FILE_MAX: '참고 파일은 최대 5개까지 첨부할 수 있습니다.',
  PROMOTION_REQUIRED: '홍보할 상품·서비스를 입력해 주세요.',
} as const

const MARKETING_OUTPUT_MODE_LABELS: Record<string, string> = {
  TEXT: '문구',
  IMAGE: '이미지',
  BOTH: '통합',
}

const appendMarketingOptionLabels = (lookup: Map<string, string>, options?: MarketingAuthoringOption[]) => {
  options?.forEach((option) => {
    const value = option.value.trim()
    const label = option.label.trim()
    if (value && label) lookup.set(value, label)
  })
}

const buildMarketingLabelLookup = (config?: MarketingAuthoringAgentConfig | null) => {
  const defaults = getDefaultMarketingAuthoringConfig()
  const resolved = config ?? defaults
  const lookup = new Map<string, string>()

  appendMarketingOptionLabels(lookup, MARKETING_AUTHORING_CONTENT_TYPES)
  appendMarketingOptionLabels(lookup, MARKETING_IMAGE_USAGES)
  appendMarketingOptionLabels(lookup, MARKETING_IMAGE_SNS_PLATFORMS)
  appendMarketingOptionLabels(lookup, MARKETING_IMAGE_TYPES)
  appendMarketingOptionLabels(lookup, MARKETING_IMAGE_ATMOSPHERES)
  appendMarketingOptionLabels(lookup, resolved.contentTypes)

  const workflow = resolved.workflow ?? defaults.workflow
  appendMarketingOptionLabels(lookup, workflow.purposes)
  appendMarketingOptionLabels(lookup, workflow.audiences)
  appendMarketingOptionLabels(lookup, workflow.tones)
  appendMarketingOptionLabels(lookup, workflow.lengths)
  appendMarketingOptionLabels(lookup, workflow.outputSections)

  const channels = {
    ...MARKETING_AUTHORING_CHANNELS_BY_TYPE,
    ...resolved.channelsByContentType,
  }
  Object.values(channels).forEach((options) => appendMarketingOptionLabels(lookup, options))
  Object.entries(MARKETING_OUTPUT_MODE_LABELS).forEach(([value, label]) => lookup.set(value, label))

  return lookup
}

/** 제작 내역 summaryLabels 등 코드값을 화면 표시용 한글 라벨로 변환 */
const resolveMarketingSummaryLabel = (value: string, config?: MarketingAuthoringAgentConfig | null) => {
  const key = String(value ?? '').trim()
  if (!key) return ''
  return buildMarketingLabelLookup(config).get(key) ?? key
}

export const resolveMarketingSummaryLabels = (labels: string[], config?: MarketingAuthoringAgentConfig | null) =>
  labels.map((label) => resolveMarketingSummaryLabel(label, config)).filter(Boolean)

/** 옵션 코드 → 표시 라벨 (OTHER면 custom 값 우선, 콤마 구분 다중값 지원) */
export const resolveMarketingOptionLabel = (
  options: MarketingAuthoringOption[] | undefined,
  value?: string,
  customValue?: string,
): string => {
  const normalized = String(value ?? '').trim()
  if (!normalized) return ''
  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((code) => resolveMarketingOptionLabel(options, code.trim(), customValue))
      .filter(Boolean)
      .join(', ')
  }
  if (normalized === 'OTHER') return String(customValue ?? '').trim()
  return options?.find((option) => option.value === normalized)?.label ?? normalized
}

/** 톤 코드 목록 → 표시 라벨 (OTHER는 customTone) */
export const resolveMarketingToneLabels = (
  tones: string | string[] | undefined,
  options: MarketingAuthoringOption[] | undefined,
  customTone?: string,
) => {
  const list = Array.isArray(tones)
    ? tones
    : String(tones ?? '')
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((tone) => tone.trim())
        .filter(Boolean)
  return list
    .map((tone) => resolveMarketingOptionLabel(options, tone, customTone))
    .filter(Boolean)
    .join(', ')
}

export type MarketingRequestCustomFields = Pick<
  MarketingAuthoringSubmitPayload,
  'customPurpose' | 'customAudience' | 'customTone' | 'customChannel' | 'customLength'
>

/** result.conditions + request custom 필드 → 메타 표시용 라벨 */
export const resolveMarketingConditionDisplay = (
  conditions: MarketingAuthoringConditionSummary,
  config?: MarketingAuthoringAgentConfig | null,
  custom?: Partial<MarketingRequestCustomFields>,
) => {
  const contentTypeKey = conditions.contentType
  return {
    contentType: resolveMarketingOptionLabel(config?.contentTypes, conditions.contentType),
    channel: resolveMarketingOptionLabel(
      config?.channelsByContentType?.[contentTypeKey],
      conditions.channel,
      custom?.customChannel,
    ),
    purpose: resolveMarketingOptionLabel(config?.workflow.purposes, conditions.purpose, custom?.customPurpose),
    audience: resolveMarketingOptionLabel(config?.workflow.audiences, conditions.audience, custom?.customAudience),
    tones: resolveMarketingToneLabels(conditions.tones, config?.workflow.tones, custom?.customTone),
    length: resolveMarketingOptionLabel(config?.workflow.lengths, conditions.length, custom?.customLength),
  }
}

export type MarketingPreparingMode = 'TEXT' | 'IMAGE' | 'BOTH'
export type MarketingGeneratingStep = 'title' | 'labels' | 'variant' | ''
export type MarketingWizardStepKey =
  | 'setup'
  | 'purpose'
  | 'audienceMessage'
  | 'textToneLength'
  | 'imageStyle'
  | 'confirm'

export type MarketingConfirmSummaryItem = {
  label: string
  value: string
  stepIndex: number
  fullWidth?: boolean
  hasDivider?: boolean
}

export type MarketingWizardStepDef = {
  key: MarketingWizardStepKey
  title: string
  question: string
  description?: string
}

/** 문구·이미지·통합 생성 공통 로딩 문구 */
const PREPARING_STATUS_TEXTS = [
  '선택한 조건을 꼼꼼히 읽고 있어요...',
  '핵심 메시지를 정리하는 중입니다...',
  '시안 방향을 잡고 있어요...',
  '표현과 구성을 다듬는 중입니다...',
  '시안을 구성하는 중입니다...',
] as const

export const resolveMarketingPreparingStatusTexts = () => PREPARING_STATUS_TEXTS

export const resolveMarketingPreparingTitle = (mode: MarketingPreparingMode = 'TEXT') =>
  mode === 'IMAGE' ? 'AI가 마케팅 이미지를 작성 중입니다' : 'AI가 콘텐츠를 작성 중입니다'

export const resolveMarketingPreparingCallout = (mode: MarketingPreparingMode = 'TEXT') => {
  if (mode === 'BOTH') return '문구와 이미지를 함께 구성합니다.'
  return mode === 'IMAGE' ? '요청하신 조건에 맞춰 이미지를 구성합니다.' : '요청하신 조건에 맞춰 시안을 구성합니다.'
}

export const resolveMarketingGeneratingStepText = (step: MarketingGeneratingStep) => {
  switch (step) {
    case 'title':
      return '제목을 정리하고 있어요...'
    case 'labels':
      return '시안 방향을 정하고 있어요...'
    case 'variant':
      return '시안을 구성하고 있어요...'
    default:
      return ''
  }
}

export const createMarketingPreparingStatusCycle = (
  getTexts: () => readonly string[] = () => PREPARING_STATUS_TEXTS,
  intervalMs = MARKETING_PREPARING_STATUS_INTERVAL_MS,
) => {
  const text = ref(getTexts()[0] ?? '')
  let timer: ReturnType<typeof setInterval> | null = null
  let index = 0
  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }
  const start = () => {
    stop()
    index = 0
    text.value = getTexts()[0] ?? ''
    timer = setInterval(() => {
      const list = getTexts()
      if (!list.length) return
      index = (index + 1) % list.length
      text.value = list[index] ?? ''
    }, intervalMs)
  }
  return { text, start, stop }
}

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return '124, 92, 252'
  return `${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}`
}

export const resolveMarketingAgentThemeStyle = (themeColorHex?: string) => {
  const color = String(themeColorHex ?? '').trim() || MARKETING_AGENT_THEME_FALLBACK_HEX
  return {
    '--marketing-agent-theme-color': color,
    '--marketing-agent-theme-rgb': hexToRgb(color),
    '--marketing-image-color': color,
    '--marketing-authoring-color': color,
  }
}

export const applyConfirmSummaryLayout = <T extends MarketingConfirmSummaryItem>(items: T[]): T[] => {
  const result = items.map((item) => ({ ...item, fullWidth: !!item.fullWidth, hasDivider: false }))
  for (let index = 0; index < result.length; index += 1) {
    const current = result[index]
    if (current.fullWidth) continue
    const next = result[index + 1]
    if (next && !next.fullWidth) {
      current.hasDivider = true
      index += 1
    } else current.fullWidth = true
  }
  return result
}

export const formatMarketingSelectionTag = (category: string, value: string) => `${category} | ${value}`

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

export const clampMarketingAuthoringVariantCount = (raw: unknown) => {
  const count = Number(raw)
  if (!Number.isFinite(count) || count < 1) return 0
  return Math.min(MARKETING_AUTHORING_VARIANT_COUNT_MAX, Math.floor(count))
}

export const createEmptyMarketingUnifiedPayload = (): MarketingUnifiedFormPayload => ({
  contentType: '',
  channel: '',
  customChannel: '',
  purpose: '',
  customPurpose: '',
  audience: '',
  customAudience: '',
  promotionInformation: '',
  keyMessage: '',
  additionalRequirements: '',
  referenceFiles: [],
  variantCount: 0,
  tones: [],
  length: '',
  customLength: '',
  customCallToAction: '',
  customTone: '',
  referenceMode: '',
  referenceUrls: [],
  outputSections: [],
  includeHashtags: 'Y',
  allowEmoji: 'Y',
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

export const resolveMarketingImageUsageFromSetup = (contentType: string, channel: string) => {
  const channelMap: Record<string, string> = {
    INSTAGRAM: 'INSTAGRAM_FEED',
    FACEBOOK: 'FACEBOOK',
    LINKEDIN: 'LINKEDIN',
    X: 'X',
    YOUTUBE_COMMUNITY: 'YOUTUBE_COMMUNITY',
    KAKAO_TALK: 'KAKAO_TALK',
    SMS: 'SMS',
  }
  if (contentType === 'SNS' || channel in channelMap)
    return { imageUsage: 'SNS_VISUAL', snsPlatform: channelMap[channel] ?? '' }
  if (contentType === 'BLOG') return { imageUsage: 'THUMBNAIL', snsPlatform: '' }
  if (contentType === 'LANDING_PAGE') return { imageUsage: 'PRODUCT_DETAIL', snsPlatform: '' }
  return { imageUsage: 'BANNER', snsPlatform: '' }
}

export const resolveMarketingSubmitMode = (outputs?: MarketingOutputKind[]): 'TEXT' | 'IMAGE' | 'BOTH' => {
  const hasText = outputs?.includes('TEXT') === true
  const hasImage = outputs?.includes('IMAGE') === true
  if (hasText && hasImage) return 'BOTH'
  return hasImage ? 'IMAGE' : 'TEXT'
}

export const hasMarketingOutput = (payload: Pick<MarketingUnifiedFormPayload, 'outputs'>, kind: MarketingOutputKind) =>
  payload.outputs.includes(kind)

const STEP_DEFS: Record<MarketingWizardStepKey, MarketingWizardStepDef> = {
  setup: { key: 'setup', title: '유형·출력', question: '무엇을 어떤 형태로 만들까요?' },
  purpose: { key: 'purpose', title: '목적', question: '무엇을 홍보하시나요?' },
  audienceMessage: { key: 'audienceMessage', title: '타겟·메시지', question: '누구에게 무엇을 전할까요?' },
  textToneLength: { key: 'textToneLength', title: '톤·분량', question: '톤과 분량을 정할까요?' },
  imageStyle: { key: 'imageStyle', title: '비율·스타일', question: '이미지 스타일을 정할까요?' },
  confirm: { key: 'confirm', title: '최종 확인', question: '입력한 내용을 확인해 주세요.' },
}

export const buildMarketingWizardSteps = (outputs: MarketingOutputKind[]) => {
  const keys: MarketingWizardStepKey[] = ['setup', 'purpose', 'audienceMessage']
  if (outputs.includes('TEXT')) keys.push('textToneLength')
  if (outputs.includes('IMAGE')) keys.push('imageStyle')
  keys.push('confirm')
  return keys.map((key) => STEP_DEFS[key])
}

export const focusMarketingField = async (element?: HTMLElement | null, input?: { focus: () => void } | null) => {
  await nextTick()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (input) input.focus()
  else element?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')?.focus()
}

export const isMarketingAuthoringAgent = (agent?: Agent | null) =>
  !!agent && agent.useYn === 'Y' && agent.svcTy === MARKETING_AUTHORING_SVC_TY

const toConditions = (payload: MarketingAuthoringSubmitPayload): MarketingAuthoringConditionSummary => ({
  contentType: payload.contentType,
  purpose: payload.purpose,
  audience: payload.audience,
  tones: payload.tones.join(', '),
  length: payload.length,
  channel: payload.channel,
  keyMessage: payload.keyMessage,
})

export const buildMarketingPendingResultFromPayload = (
  payload: MarketingAuthoringSubmitPayload,
): MarketingAuthoringResult => ({
  mode: resolveMarketingSubmitMode(payload.outputs),
  summary: MARKETING_RESULT_SUMMARY_PENDING,
  conditions: toConditions(payload),
  variants: [],
  images: [],
})

/** 수신 images url preload — onload/onerror/timeout 모두 완료로 처리 */
export const preloadMarketingImages = (urls: string[], timeoutMs = MARKETING_IMAGE_LOAD_TIMEOUT_MS) => {
  const targets = urls.map((url) => String(url ?? '').trim()).filter(Boolean)
  if (!targets.length) return Promise.resolve()

  return Promise.all(
    targets.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          let settled = false
          const done = () => {
            if (settled) return
            settled = true
            window.clearTimeout(timer)
            resolve()
          }
          const timer = window.setTimeout(done, timeoutMs)
          img.onload = done
          img.onerror = done
          img.src = url
        }),
    ),
  )
}

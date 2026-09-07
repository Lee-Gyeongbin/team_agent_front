import { nextTick, ref } from 'vue'
import type { Agent, MarketingAuthoringAgentConfig, MarketingAuthoringOption } from '~/types/agent'
import type {
  MarketingFormPayload,
  MarketingOutputKind,
  MarketingOutputMode,
  MarketingResult,
  MarketingStoredRequest,
  MarketingChannelOption,
  MarketingCampaignPlanDraft,
  MarketingScheduleStatus,
  MarketingRequestCustomFields,
  MarketingAuthoringConditionSummary,
  MarketingAuthoringResult,
  MarketingGeneratingStep,
  MarketingCopyPayloadResult,
} from '~/types/marketing'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
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
export const MARKETING_PREPARING_STATUS_INTERVAL_MS = 3000
export const MARKETING_IMAGE_LOAD_TIMEOUT_MS = 30_000
export const MARKETING_RESULT_SUMMARY_PENDING = '요청하신 조건으로 콘텐츠를 생성하고 있습니다.'

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

/**
 * 발행 예정일 상태 — 제작 내역 목록의 배지·배너 색상 판단용.
 * 실제 채널 자동 발행은 없으므로(수동 복사 후 채널 이동) 어디까지나 리마인더 목적이다.
 */
export const resolveMarketingScheduleStatus = (
  publishScheduledDt?: string | null,
  publishedYn?: string | null,
): MarketingScheduleStatus => {
  const raw = String(publishScheduledDt ?? '').trim()
  if (!raw) return 'none'
  if (publishedYn === 'Y') return 'done'
  const scheduled = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(scheduled.getTime())) return 'none'
  const now = new Date()
  if (scheduled.getTime() <= now.getTime()) return 'overdue'
  const isSameDay =
    scheduled.getFullYear() === now.getFullYear() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getDate() === now.getDate()
  return isSameDay ? 'today' : 'upcoming'
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

/** 톤 코드 목록(콤마구분 문자열) → 표시 라벨 (OTHER는 customTone) */
export const resolveMarketingToneLabels = (
  tones: string | undefined,
  options: MarketingAuthoringOption[] | undefined,
  customTone?: string,
) => {
  const list = String(tones ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((tone) => tone.trim())
    .filter(Boolean)
  return list
    .map((tone) => resolveMarketingOptionLabel(options, tone, customTone))
    .filter(Boolean)
    .join(', ')
}

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

const PREPARING_STATUS_TEXTS = [
  '선택한 조건을 꼼꼼히 읽고 있어요...',
  '핵심 메시지를 정리하는 중입니다...',
  '시안 방향을 잡고 있어요...',
  '표현과 구성을 다듬는 중입니다...',
  '시안을 구성하는 중입니다...',
] as const

export const MARKETING_PREPARING_TITLE = 'AI가 콘텐츠를 작성 중입니다'
export const MARKETING_PREPARING_CALLOUT = '요청하신 조건에 맞춰 콘텐츠를 구성합니다.'

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

/** 사용자 입력 문구를 안전한 미리보기 HTML로 변환 */
export const renderMarketingTextHtml = (value?: string | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/(^|\s)(#[^\s]+)/g, '$1<span class="is-hashtag">$2</span>')
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />')

export const resolveMarketingSubmitMode = (outputs?: MarketingOutputKind[]): MarketingOutputMode => {
  const hasText = outputs?.includes('TEXT') === true
  const hasImage = outputs?.includes('IMAGE') === true
  if (hasText && hasImage) return 'BOTH'
  return hasImage ? 'IMAGE' : 'TEXT'
}

export const hasMarketingOutput = (payload: Pick<MarketingFormPayload, 'outputs'>, kind: MarketingOutputKind) =>
  payload.outputs.includes(kind)

export const focusMarketingField = async (element?: HTMLElement | null, input?: { focus: () => void } | null) => {
  await nextTick()
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (input) input.focus()
  else element?.querySelector<HTMLElement>('input, textarea, button, [tabindex]')?.focus()
}

export const isMarketingAuthoringAgent = (agent?: Agent | null) =>
  !!agent && agent.useYn === 'Y' && agent.svcTy === MARKETING_AUTHORING_SVC_TY

const toConditions = (
  payload: Pick<
    MarketingFormPayload,
    'contentType' | 'purpose' | 'audience' | 'tones' | 'length' | 'channel' | 'keyMessage'
  >,
): MarketingAuthoringConditionSummary => ({
  contentType: payload.contentType,
  purpose: payload.purpose,
  audience: payload.audience,
  tones: payload.tones.join(', '),
  length: payload.length,
  channel: payload.channel,
  keyMessage: payload.keyMessage,
})

const toImageConditions = (
  payload: Pick<
    MarketingFormPayload,
    | 'imageType'
    | 'visualStyle'
    | 'aspectRatio'
    | 'customAspectRatio'
    | 'imageText'
    | 'channel'
    | 'imageUsage'
    | 'snsPlatform'
  >,
): MarketingAuthoringConditionSummary => ({
  contentType: payload.imageType,
  purpose: payload.imageUsage,
  audience: payload.snsPlatform,
  tones: payload.visualStyle,
  length: payload.aspectRatio || payload.customAspectRatio,
  channel: payload.channel,
  keyMessage: payload.imageText,
})

/** API MarketingResult + 저장 요청 → 결과 화면 표시용 */
export const enrichMarketingResultForDisplay = (
  result: MarketingResult,
  request?: MarketingStoredRequest | MarketingFormPayload | null,
  summary = '',
): MarketingAuthoringResult => {
  const baseSummary = summary || result.title || MARKETING_RESULT_SUMMARY_PENDING
  if (!request) {
    return {
      ...result,
      summary: baseSummary,
      conditions: {
        contentType: '',
        purpose: '',
        audience: '',
        tones: '',
        length: '',
      },
    }
  }

  return {
    ...result,
    summary: baseSummary,
    conditions: toConditions(request),
    imageConditions: hasMarketingOutput(request, 'IMAGE') ? toImageConditions(request) : undefined,
  }
}

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

// ── 채널로 보내기 ──────────────────────────────────────────────────────────

type ChannelDeliverySeed = {
  label: string
  externalUrl?: string
  icon?: string
}

type ChannelDeliverySpec = ChannelDeliverySeed & {
  channel: string
  mode: 'EXTERNAL' | 'PICK'
}

/**
 * 외부 작성 화면 진입 URL
 * - 홈/피드가 아니라 게시물·메일 작성 화면에 최대한 가깝게 연결
 * - 플랫폼마다 웹 작성 바로가기 지원 수준이 다름 (로그인·권한 필요)
 */
const MARKETING_EXTERNAL_COMPOSE_URLS = {
  INSTAGRAM: 'https://www.instagram.com/',
  /** Meta Business Suite 작성기 — 페이지/비즈니스 게시용 */
  FACEBOOK: 'https://business.facebook.com/',
  LINKEDIN: 'https://www.linkedin.com/feed/?shareActive=true',
  X: 'https://x.com/compose/post',
  /** 카카오 채널 관리 — 채널 선택 후 메시지/게시 작성 */
  KAKAO_TALK: 'https://center-pf.kakao.com/',
  /** YouTube Studio — 커뮤니티 글은 Studio에서 작성 */
  YOUTUBE_COMMUNITY: 'https://studio.youtube.com/',
  /** 네이버 블로그 글쓰기 */
  NAVER_BLOG: 'https://blog.naver.com/GoBlogWrite.naver',
  EMAIL: 'https://mail.google.com/mail/u/0/#inbox?compose=new',
} as const

/**
 * 채널 배달 맵 — 클립보드 복사 후 외부 작성 화면으로 이동한다.
 */
const CHANNEL_DELIVERY_MAP: Record<string, ChannelDeliverySeed> = {
  INSTAGRAM: {
    label: '인스타그램',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.INSTAGRAM,
    icon: 'icon-sns',
  },
  FACEBOOK: {
    label: '페이스북',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.FACEBOOK,
    icon: 'icon-sns',
  },
  LINKEDIN: {
    label: '링크드인',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.LINKEDIN,
    icon: 'icon-sns',
  },
  X: {
    label: 'X',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.X,
    icon: 'icon-sns',
  },
  OWNED_BLOG: {
    label: '자사 블로그',
    icon: 'icon-document-edit',
  },
  SMS: {
    label: '문자메시지',
    icon: 'icon-sns',
  },
  PROMOTION_EMAIL: {
    label: '프로모션 메일',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.EMAIL,
    icon: 'icon-email',
  },
  NEWSLETTER: {
    label: '뉴스레터',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.EMAIL,
    icon: 'icon-email',
  },
  KAKAO_TALK: {
    label: '카카오톡',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.KAKAO_TALK,
    icon: 'icon-sns',
  },
  YOUTUBE_COMMUNITY: {
    label: '유튜브 커뮤니티',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.YOUTUBE_COMMUNITY,
    icon: 'icon-sns',
  },
  NAVER_BLOG: {
    label: '네이버 블로그',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.NAVER_BLOG,
    icon: 'icon-document-edit',
  },
  // 생성 마법사의 SNS 세부 채널 — 도착 화면은 INSTAGRAM과 동일하다.
  INSTAGRAM_FEED: {
    label: '인스타그램 피드',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.INSTAGRAM,
  },
  INSTAGRAM_STORY: {
    label: '인스타그램 스토리·릴스',
    externalUrl: MARKETING_EXTERNAL_COMPOSE_URLS.INSTAGRAM,
  },
}

/**
 * 모달에서 채널을 직접 고를 때 보여줄 선택지 — 코드가 여러 개(INSTAGRAM_FEED/STORY, PROMOTION_EMAIL/NEWSLETTER 등)라도
 * 도착 화면이 같은 것끼리는 하나로 묶어 사용자에게 중복으로 보이지 않게 한다.
 */
export const CHANNEL_DELIVERY_PICK_OPTIONS: { channel: string; label: string }[] = [
  { channel: 'INSTAGRAM', label: CHANNEL_DELIVERY_MAP.INSTAGRAM.label },
  { channel: 'FACEBOOK', label: CHANNEL_DELIVERY_MAP.FACEBOOK.label },
  { channel: 'LINKEDIN', label: CHANNEL_DELIVERY_MAP.LINKEDIN.label },
  { channel: 'X', label: CHANNEL_DELIVERY_MAP.X.label },
  { channel: 'KAKAO_TALK', label: CHANNEL_DELIVERY_MAP.KAKAO_TALK.label },
  { channel: 'YOUTUBE_COMMUNITY', label: CHANNEL_DELIVERY_MAP.YOUTUBE_COMMUNITY.label },
  { channel: 'NAVER_BLOG', label: CHANNEL_DELIVERY_MAP.NAVER_BLOG.label },
  { channel: 'OWNED_BLOG', label: CHANNEL_DELIVERY_MAP.OWNED_BLOG.label },
  { channel: 'PROMOTION_EMAIL', label: '이메일' },
  { channel: 'SMS', label: CHANNEL_DELIVERY_MAP.SMS.label },
]

/**
 * 채널 코드 → 배달 스펙.
 * 생성 시 고른 채널이 이미 알려진 코드면 그대로 확정(EXTERNAL), 비어 있거나(이미지 전용 등) 직접입력·매핑 안 된
 * 코드라면 PICK을 반환한다 — 이 경우 버튼을 숨기는 대신 모달에서 사용자가 그때 채널을 고르게 한다.
 */
export const resolveChannelDelivery = (channel?: string | null): ChannelDeliverySpec => {
  const normalized = String(channel ?? '').trim()
  const seed = normalized ? CHANNEL_DELIVERY_MAP[normalized] : undefined
  if (!seed) return { channel: normalized, mode: 'PICK', label: '' }
  return {
    channel: normalized,
    mode: 'EXTERNAL',
    label: seed.label,
    externalUrl: seed.externalUrl,
    icon: seed.icon,
  }
}

/** 마케팅 이미지 → PNG Blob (클립보드용) */
const fetchMarketingImageAsPngBlob = async (imageUrl: string): Promise<Blob> => {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('이미지 조회에 실패했습니다.')
  const blob = await response.blob()
  if (blob.type === 'image/png') return blob

  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('PNG 변환에 실패했습니다.'))
    }, 'image/png')
  })
}

/** 마케팅 시안 텍스트/이미지 클립보드 복사 */
export const copyMarketingPayloadToClipboard = async (
  text: string,
  imageUrl?: string | null,
): Promise<MarketingCopyPayloadResult> => {
  const value = String(text ?? '').trim()
  const url = String(imageUrl ?? '').trim()
  if (!value && !url) throw new Error('복사할 내용이 없습니다.')

  const canWriteImage = !!navigator.clipboard?.write && typeof ClipboardItem !== 'undefined'

  if (value && url && canWriteImage) {
    try {
      const imageBlob = await fetchMarketingImageAsPngBlob(url)
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([value], { type: 'text/plain' }),
          'image/png': imageBlob,
        }),
      ])
      return { textCopied: true, imageCopied: true }
    } catch {
      // 동시 기록 실패 — 텍스트만
    }
  }

  if (url && !value && canWriteImage) {
    const imageBlob = await fetchMarketingImageAsPngBlob(url)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': imageBlob })])
    return { textCopied: false, imageCopied: true }
  }

  if (value) {
    await copyToClipboard(value)
    return { textCopied: true, imageCopied: false }
  }

  throw new Error('클립보드 복사에 실패했습니다.')
}

// ── 캠페인 기획서 기반 채널 선택 (멀티채널 콘텐츠 생성) ──────────────────────

type MarketingChannelSeed = {
  channelCd: string
  channelNm: string
  contentType: 'SNS' | 'EMAIL'
  /** SNS 이미지 생성 시 사용할 snsPlatform 코드 — MARKETING_IMAGE_SNS_PLATFORMS 참고 */
  snsPlatform?: string
  formatOptions: string[]
  imageStrategy: string
}

/** 캠페인 기획서 화면에서 고를 수 있는 채널 — MARKETING_AUTHORING_CHANNELS_BY_TYPE의 SNS/EMAIL 채널 코드와 동일하게 맞춘다 */
export const MARKETING_CHANNEL_SEEDS: MarketingChannelSeed[] = [
  {
    channelCd: 'INSTAGRAM',
    channelNm: '인스타그램',
    contentType: 'SNS',
    snsPlatform: 'INSTAGRAM_FEED',
    formatOptions: ['피드', '스토리·릴스'],
    imageStrategy: '정사각 비율의 제품 중심 비주얼, 밝고 감각적인 톤',
  },
  {
    channelCd: 'FACEBOOK',
    channelNm: '페이스북',
    contentType: 'SNS',
    snsPlatform: 'FACEBOOK',
    formatOptions: ['피드 게시물'],
    imageStrategy: '가로형 배너, 정보 전달력이 높은 구성',
  },
  {
    channelCd: 'LINKEDIN',
    channelNm: '링크드인',
    contentType: 'SNS',
    snsPlatform: 'LINKEDIN',
    formatOptions: ['피드 게시물'],
    imageStrategy: '전문적이고 신뢰감 있는 톤의 비주얼',
  },
  {
    channelCd: 'X',
    channelNm: 'X',
    contentType: 'SNS',
    snsPlatform: 'X',
    formatOptions: ['타임라인 게시물'],
    imageStrategy: '간결한 메시지 중심, 눈에 띄는 컬러 대비',
  },
  {
    channelCd: 'PROMOTION_EMAIL',
    channelNm: '이메일',
    contentType: 'EMAIL',
    formatOptions: ['프로모션 메일'],
    imageStrategy: '본문 상단 배너형 이미지',
  },
  {
    channelCd: 'SMS',
    channelNm: 'SMS',
    contentType: 'SNS',
    snsPlatform: 'SMS',
    formatOptions: ['문자메시지'],
    imageStrategy: '텍스트 위주, 이미지는 선택적으로 동반',
  },
  {
    channelCd: 'KAKAO_TALK',
    channelNm: '카카오톡',
    contentType: 'SNS',
    snsPlatform: 'KAKAO_TALK',
    formatOptions: ['카카오톡 채널 메시지'],
    imageStrategy: '썸네일형 이미지, 친근한 톤',
  },
]

/** 캠페인 기획서의 recommendChannels 문자열('Instagram · Facebook · Email')에서 채널 코드를 추출 */
const parseMarketingRecommendedChannelCodes = (recommendChannels: string): string[] => {
  const text = recommendChannels.toLowerCase()
  const codes: string[] = []
  const matchers: [RegExp, string][] = [
    [/인스타(?:그램)?|instagram/i, 'INSTAGRAM'],
    [/페이스북|facebook/i, 'FACEBOOK'],
    [/링크드인|linkedin/i, 'LINKEDIN'],
    [/트위터|twitter|\bx\b/i, 'X'],
    [/이메일|email/i, 'PROMOTION_EMAIL'],
    [/sms|문자/i, 'SMS'],
    [/카카오|kakao/i, 'KAKAO_TALK'],
  ]
  matchers.forEach(([re, code]) => {
    if (re.test(text)) codes.push(code)
  })
  return codes
}

/** 채널 선택 화면(view-channelSelect) 초기 목록 — 캠페인 기획서 추천 채널을 기본 선택 상태로 켠다 */
export const buildMarketingChannelOptions = (recommendChannels: string): MarketingChannelOption[] => {
  const recommendedCodes = new Set(parseMarketingRecommendedChannelCodes(recommendChannels))
  return MARKETING_CHANNEL_SEEDS.map((seed) => {
    const recommended = recommendedCodes.has(seed.channelCd)
    return {
      channelCd: seed.channelCd,
      channelNm: seed.channelNm,
      contentType: seed.contentType,
      formatOptions: seed.formatOptions,
      imageStrategy: seed.imageStrategy,
      recommended,
      selected: recommended,
      withImageYn: 'Y',
    }
  })
}

/** 채널 선택 1건 → 콘텐츠 생성에 쓰는 MarketingFormPayload로 변환 (배치 생성용) */
export const buildMarketingFormPayloadFromChannelPick = (
  pick: MarketingChannelOption,
  draft: MarketingCampaignPlanDraft,
): MarketingFormPayload => {
  const seed = MARKETING_CHANNEL_SEEDS.find((item) => item.channelCd === pick.channelCd)
  const withImage = pick.withImageYn === 'Y'
  return {
    outputs: withImage ? ['TEXT', 'IMAGE'] : ['TEXT'],
    contentType: seed?.contentType ?? 'SNS',
    channel: pick.channelCd,
    customChannel: '',
    purpose: draft.goal,
    customPurpose: '',
    audience: draft.targetNm,
    customAudience: '',
    promotionInformation: draft.productNm,
    keyMessage: draft.keyMessage,
    additionalRequirements: draft.requestTxt,
    referenceFiles: [],
    selectedExistingFileIds: [],
    variantCount: 3,
    tones: [],
    customTone: '',
    length: '',
    customLength: '',
    customCallToAction: '',
    outputSections: [],
    includeHashtags: 'Y',
    allowEmoji: 'Y',
    imageUsage: withImage ? 'SNS_VISUAL' : '',
    snsPlatform: withImage ? (seed?.snsPlatform ?? '') : '',
    imageType: '',
    visualStyle: draft.visualTxt,
    aspectRatio: '',
    customAspectRatio: '',
    imageText: '',
    brandColors: '',
  }
}

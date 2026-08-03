import { ref } from 'vue'
import type { Agent, MarketingAuthoringAgentConfig, MarketingAuthoringOption } from '~/types/agent'
import type {
  ChatMessage,
  MarketingAuthoringConditionSummary,
  MarketingAuthoringFormPayload,
  MarketingAuthoringResult,
  MarketingAuthoringVariant,
  MarketingImageFormPayload,
} from '~/types/chat'
import {
  MARKETING_AUTHORING_CHANNELS_BY_TYPE,
  MARKETING_AUTHORING_CONTENT_TYPES,
  MARKETING_AUTHORING_DEFAULT_CONSTRAINTS,
  MARKETING_AUTHORING_SUB_TY,
  MARKETING_IMAGE_ATMOSPHERES,
  MARKETING_IMAGE_SNS_PLATFORMS,
  MARKETING_IMAGE_TYPES,
  MARKETING_IMAGE_USAGES,
  getDefaultMarketingAuthoringConfig,
  parseMarketingAuthoringAgentConfig,
} from '~/utils/agent/marketingAuthoringConfigUtil'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'

export type {
  MarketingAuthoringFormPayload,
  MarketingAuthoringResult,
  MarketingAuthoringSubmitPayload,
  MarketingImageFormPayload,
} from '~/types/chat'

export { MARKETING_AUTHORING_SUB_TY }

/** 채팅 폼에서 사용자가 지정할 수 있는 시안 개수 상한 */
export const MARKETING_AUTHORING_VARIANT_COUNT_MAX = 5

// ━━━ 상수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 마케팅 패널 select 화면 헤더 서브타이틀 */
export const MARKETING_AGENT_SELECT_SUBTITLE = '원하는 작업을 선택해 주세요. 목적에 맞는 생성 기능을 제공합니다.'

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

// ━━━ 에이전트 판별 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** svcTy=C · USE_YN=Y · subTy=MARKETING_AUTHORING — 채팅 에이전트 선택·전송용 */
export const isMarketingAuthoringAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === MARKETING_AUTHORING_SUB_TY
}

// ━━━ Config 파서 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const parseMarketingAuthoringConfigFromAgent = (agent: Agent): MarketingAuthoringAgentConfig | null => {
  if (!isMarketingAuthoringAgent(agent)) return null
  const raw = agent.subCfg?.additionalConfig
  if (!raw) return null
  try {
    const config = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Record<string, unknown>
    return parseMarketingAuthoringAgentConfig(config)
  } catch {
    return null
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

const optionLabel = (options: MarketingAuthoringOption[], value: string): string =>
  options.find((item) => item.value === value)?.label ?? value

const resolveChannelLabel = (value: string, config?: MarketingAuthoringAgentConfig | null): string => {
  const channels = Object.values(config?.channelsByContentType ?? MARKETING_AUTHORING_CHANNELS_BY_TYPE).flat()
  return optionLabel(channels, value)
}

const resolveSelection = (options: MarketingAuthoringOption[], value: string, customValue: string) =>
  value === 'OTHER' ? customValue.trim() : optionLabel(options, value)

const buildMarketingAuthoringConditionSummary = (
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
    '\n## content 작성\n- variants[].content는 사용자가 바로 복사해 쓸 수 있는 완성 문안 하나\n- "제목:", "프리헤더:", "핵심 혜택:", "본문:", "CTA:" 같은 앞머리 라벨·섹션명은 절대 넣지 말 것',
    '## 출력 형식',
    JSON.stringify(schemaExample),
  ]
    .filter(Boolean)
    .join('\n')
}

const marketingImageUsageLabel = (value: string) =>
  MARKETING_IMAGE_USAGES.find((item) => item.value === value)?.label ?? value

const marketingImageSnsPlatformLabel = (value: string) =>
  MARKETING_IMAGE_SNS_PLATFORMS.find((item) => item.value === value)?.label ?? value

const marketingImageTypeLabel = (value: string) =>
  MARKETING_IMAGE_TYPES.find((item) => item.value === value)?.label ?? value

const marketingImageAtmosphereLabel = (value: string) =>
  MARKETING_IMAGE_ATMOSPHERES.find((item) => item.value === value)?.label ?? value

const resolveMarketingImageSelection = (value: string, customValue: string) =>
  value === 'OTHER' ? customValue.trim() : value.trim()

const resolveMarketingImageChannelLabel = (payload: MarketingImageFormPayload) => {
  const usageLabel = marketingImageUsageLabel(payload.imageUsage)
  if (payload.imageUsage !== 'SNS_VISUAL' || !payload.snsPlatform.trim()) return usageLabel
  return `${usageLabel} · ${marketingImageSnsPlatformLabel(payload.snsPlatform)}`
}

export const buildMarketingImagePrompt = (payload: MarketingImageFormPayload): string => {
  const variantCount = clampMarketingAuthoringVariantCount(payload.variantCount)
  return [
    'agentType: marketingImage',
    '## 이미지 제작 조건',
    `- 사용 채널: ${resolveMarketingImageChannelLabel(payload)}`,
    `- 표현 방식: ${marketingImageTypeLabel(payload.imageType)}`,
    `- 제작 목적: ${payload.purpose.trim()}`,
    `- 대상 고객: ${payload.audience.trim()}`,
    `- 분위기: ${marketingImageAtmosphereLabel(payload.visualStyle)}`,
    `- 화면 비율: ${resolveMarketingImageSelection(payload.aspectRatio, payload.customAspectRatio)}`,
    `- 시안 개수: ${variantCount}`,
    payload.brandColors.trim() ? `- 브랜드 컬러: ${payload.brandColors.trim()}` : '',
    payload.imageText.trim() ? `- 이미지 내 문구: ${payload.imageText.trim()}` : '- 이미지 내 문구: 사용하지 않음',
    '\n## 홍보할 상품·서비스',
    payload.productInformation.trim(),
    '\n## 핵심 메시지',
    payload.coreMessage.trim(),
    payload.referenceFiles.length
      ? `\n## 첨부 참고자료\n${payload.referenceFiles.map((file) => `- ${file.name}`).join('\n')}`
      : '',
    payload.additionalRequirements.trim() ? `\n## 추가 요청사항\n${payload.additionalRequirements.trim()}` : '',
    '\n## 생성 요구사항',
    `- 위 조건을 반영한 완성형 마케팅 이미지 시안을 정확히 ${variantCount}개 생성할 것. 더 적거나 많으면 안 됨`,
    '- 시안마다 구도·표현·강조점을 다르게 해 비교 선택할 수 있게 할 것',
    '- 첨부 참고자료가 있으면 브랜드·이미지·문구 가이드를 우선 반영할 것',
    '- 이미지 안의 텍스트는 요청된 문구만 사용하고, 임의의 글자나 워터마크를 추가하지 말 것',
    '- 결과 설명이나 JSON 대신 생성된 이미지를 반환할 것',
  ]
    .filter(Boolean)
    .join('\n')
}

export const isMarketingImagePrompt = (promptText: string): boolean =>
  String(promptText ?? '').includes('agentType: marketingImage')

/** 문구·콘텐츠 작성 프롬프트 여부 (채팅 로그 재구성용) */
export const isMarketingTextPrompt = (promptText: string): boolean => {
  const raw = String(promptText ?? '').trim()
  if (!raw) return false
  return raw.includes('## 작성 조건') && raw.includes('## 출력 형식')
}

/** MARKETING_AUTHORING 프롬프트 여부 (문구·이미지) */
export const isMarketingAuthoringPrompt = (promptText: string): boolean =>
  isMarketingTextPrompt(promptText) || isMarketingImagePrompt(promptText)

const pickPromptSection = (promptText: string, title: string): string => {
  const matched = promptText.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(?=\\n## |$)`))
  return matched?.[1]?.trim() ?? ''
}

export const parseMarketingAuthoringConditionsFromPrompt = (
  promptText: string,
): MarketingAuthoringConditionSummary | null => {
  if (!isMarketingTextPrompt(promptText)) return null
  const block = promptText.match(/## 작성 조건\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''
  const pick = (label: string) => {
    const line = block.split('\n').find((item) => item.startsWith(`- ${label}:`))
    return line ? line.slice(label.length + 3).trim() : ''
  }
  const contentType = pick('콘텐츠 유형')
  if (!contentType) return null
  return {
    contentType,
    purpose: pick('작성 목적'),
    audience: pick('대상 독자'),
    tones: pick('톤앤매너'),
    length: pick('분량'),
    channel: pick('게시 채널') || undefined,
    keyMessage: pickPromptSection(promptText, '핵심 메시지') || undefined,
    callToAction: pickPromptSection(promptText, '유도할 행동') || undefined,
    promotionInformation: pickPromptSection(promptText, '홍보할 상품·서비스') || undefined,
    additionalRequirements: pickPromptSection(promptText, '추가 요청사항') || undefined,
  }
}

const parseMarketingImageConditionsFromPrompt = (promptText: string): MarketingAuthoringConditionSummary | null => {
  if (!isMarketingImagePrompt(promptText)) return null
  const block = promptText.match(/## 이미지 제작 조건\n([\s\S]*?)(?=\n## |$)/)?.[1] ?? ''
  const pick = (label: string) => {
    const line = block.split('\n').find((item) => item.startsWith(`- ${label}:`))
    return line ? line.slice(label.length + 3).trim() : ''
  }
  return {
    contentType: pick('표현 방식'),
    purpose: pick('제작 목적'),
    audience: pick('대상 고객'),
    tones: pick('분위기'),
    length: pick('화면 비율'),
    channel: pick('사용 채널') || undefined,
    keyMessage: pickPromptSection(promptText, '핵심 메시지') || undefined,
    promotionInformation: pickPromptSection(promptText, '홍보할 상품·서비스') || undefined,
    additionalRequirements: pickPromptSection(promptText, '추가 요청사항') || undefined,
  }
}

const parseMarketingImageResult = (rContent: string, promptText: string): MarketingAuthoringResult | null => {
  const imageDataUrl = String(rContent ?? '').match(/data:image\/[a-z0-9+.-]+;base64,[a-z0-9+/=]+/i)?.[0]
  const conditions = parseMarketingImageConditionsFromPrompt(promptText)
  if (!imageDataUrl || !conditions) return null
  return {
    mode: 'IMAGE',
    summary: '요청하신 조건으로 마케팅 이미지를 생성했습니다.',
    conditions,
    variants: [],
    imageDataUrl,
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

export const parseMarketingAuthoringResult = (rContent: string): MarketingAuthoringResult | null => {
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
      summary:
        String(parsed.summary ?? '').trim() || `요청하신 조건으로 콘텐츠 시안 ${variants.length}개를 생성했습니다.`,
      conditions,
      variants,
    }
  } catch {
    return null
  }
}

// ━━━ 메시지 연결 / 결과 카드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 마케팅 작성 answer에 연결된 question
 * - complete/로그 재조회: Q/A가 동일 서버 logId
 * - 스트리밍 중: 임시 logId가 서로 다르므로 직전 question 사용
 */
export const findLinkedMarketingAuthoringQuestion = (
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

/** 마케팅 문구·이미지 제작 파이프라인 answer */
export const isMarketingAuthoringAnswer = (answerMsg: ChatMessage, messages: ChatMessage[]): boolean => {
  if (answerMsg.type !== 'answer') return false
  const question = findLinkedMarketingAuthoringQuestion(messages, answerMsg)
  return !!(question && isMarketingAuthoringPrompt(question.qContent ?? ''))
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

  const promptConditions = parseMarketingAuthoringConditionsFromPrompt(questionContent)
  if (!promptConditions) return parsed

  return {
    ...parsed,
    conditions: {
      ...promptConditions,
      ...Object.fromEntries(Object.entries(parsed.conditions).filter(([, value]) => String(value ?? '').trim())),
    },
  }
}

// ━━━ MARKETING_AUTHORING 인라인 카드 메시지 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const genMarketingAuthoringLogId = () => `marketing-authoring-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createMarketingAuthoringCardMessage = (agentId: string): ChatMessage => ({
  logId: genMarketingAuthoringLogId(),
  type: 'marketingAuthoring',
  agentId,
  createdAt: new Date().toISOString(),
  svcTy: 'C',
})

// ━━━ MARKETING AUTHORING 방 등록 (해당 방에서만 합성 프롬프트 question 숨김) ━━━

const marketingAuthoringRoomIds = ref<Set<string>>(new Set())

export const registerMarketingAuthoringRoom = (roomId: string) => {
  const id = String(roomId ?? '').trim()
  if (!id) return
  marketingAuthoringRoomIds.value = new Set([...marketingAuthoringRoomIds.value, id])
}

export const isMarketingAuthoringRoom = (roomId: string) =>
  marketingAuthoringRoomIds.value.has(String(roomId ?? '').trim())

// ━━━ 마케팅 에이전트 패널 표시 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type MarketingAgentPanelMode = 'select' | 'text' | 'image'

const isMarketingAgentVisible = ref(false)
const marketingAgentMode = ref<MarketingAgentPanelMode>('select')

export const useMarketingAuthoring = () => {
  const openMarketingAgent = (mode: MarketingAgentPanelMode = 'select') => {
    marketingAgentMode.value = mode
    isMarketingAgentVisible.value = true
  }
  const closeMarketingAgent = () => {
    isMarketingAgentVisible.value = false
    marketingAgentMode.value = 'select'
  }
  const setMarketingAgentMode = (mode: MarketingAgentPanelMode) => {
    marketingAgentMode.value = mode
  }
  return {
    isMarketingAgentVisible,
    marketingAgentMode,
    openMarketingAgent,
    closeMarketingAgent,
    setMarketingAgentMode,
    registerMarketingAuthoringRoom,
    isMarketingAuthoringRoom,
  }
}

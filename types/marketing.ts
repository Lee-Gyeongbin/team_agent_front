import type { MarketingAuthoringAgentConfig } from '~/types/agent'

export type MarketingOutputKind = 'TEXT' | 'IMAGE'

export interface MarketingAuthoringSharedFields {
  contentType: string
  channel: string
  customChannel: string
  purpose: string
  customPurpose: string
  audience: string
  customAudience: string
  promotionInformation: string
  keyMessage: string
  additionalRequirements: string
  referenceFiles: File[]
  variantCount: number
}

export interface MarketingAuthoringTextOnlyFields {
  tones: string[]
  length: string
  customLength: string
  customCallToAction: string
  customTone: string
  referenceMode: '' | 'FILE' | 'WEB'
  referenceUrls: string[]
  outputSections: string[]
  includeHashtags: 'Y' | 'N'
  allowEmoji: 'Y' | 'N'
}

export interface MarketingAuthoringImageOnlyFields {
  imageUsage: string
  snsPlatform: string
  imageType: string
  visualStyle: string
  aspectRatio: string
  customAspectRatio: string
  imageText: string
  brandColors: string
}

export type MarketingUnifiedFormPayload = MarketingAuthoringSharedFields &
  MarketingAuthoringTextOnlyFields &
  MarketingAuthoringImageOnlyFields & { outputs: MarketingOutputKind[] }

export type MarketingAuthoringSubmitPayload = MarketingUnifiedFormPayload

export interface MarketingAuthoringConditionSummary {
  contentType: string
  purpose: string
  audience: string
  /** BE는 string[]로 저장·반환할 수 있음 */
  tones: string | string[]
  length: string
  channel?: string
  keyMessage?: string
}

export interface MarketingAuthoringVariant {
  id: number
  label: string
  recommended: boolean
  content: string
}

/**
 * 이미지 시안 — 문구 시안처럼 시안별 형식 라벨(감성형 등)을 함께 받음.
 * id는 문구 시안의 id와 같은 시안 번호로, 통합 모드에서 문구·이미지를 짝짓는 기준이다.
 */
export interface MarketingAuthoringImageVariant {
  id: number
  url: string
  label: string
  recommended: boolean
}

export interface MarketingAuthoringResult {
  summary: string
  conditions: MarketingAuthoringConditionSummary
  imageConditions?: MarketingAuthoringConditionSummary
  variants: MarketingAuthoringVariant[]
  mode?: MarketingOutputMode
  images?: MarketingAuthoringImageVariant[]
}

export type MarketingOutputMode = 'TEXT' | 'IMAGE' | 'BOTH'

export interface MarketingAgentSummary {
  agentId: string
  agentNm: string
  colorHex?: string
  iconClassNm?: string
  config: MarketingAuthoringAgentConfig
}

export interface MarketingContentSummary {
  contentId: string
  agentId: string
  title: string
  outputMode: MarketingOutputMode
  contentType: string
  summaryLabels: string[]
  createDt: string
  modifyDt: string
}

/** 상세 request — DB REQUEST_JSON (File 없음) */
export type MarketingStoredRequest = Omit<MarketingAuthoringSubmitPayload, 'referenceFiles'> & {
  referenceFiles?: never[]
}

export interface MarketingContentDetail extends MarketingContentSummary {
  request: MarketingStoredRequest | MarketingAuthoringSubmitPayload
  result: MarketingAuthoringResult | null
}

export interface MarketingContentListParams {
  keyword?: string
  contentType?: string
  outputMode?: MarketingOutputMode
  periodDays?: number
  sort?: 'MODIFY_DT_DESC' | 'CREATE_DT_DESC' | 'TITLE_ASC'
}

export interface MarketingContentListResponse {
  list: MarketingContentSummary[]
}

export interface MarketingCreateRequest extends Omit<MarketingAuthoringSubmitPayload, 'referenceFiles'> {
  agentId: string
  referenceFiles?: never[]
}

export interface MarketingCreateResponse {
  contentId: string
}

export interface MarketingRefineResponse {
  successYn?: boolean
  message?: string
}

export type MarketingStreamStep = 'title' | 'labels' | 'variant'

export interface MarketingStreamProgressEvent {
  step: MarketingStreamStep
  contentNo?: number
  label?: string
  recommended?: boolean
  text?: string
  imageUrl?: string
  /** BE가 TEXT/IMAGE part를 분리 전송할 때 구분값 */
  part?: 'TEXT' | 'IMAGE'
  /** labels step — 요청 시안 개수 */
  variantCount?: number
}

export type MarketingStreamDoneEvent = {
  result: MarketingAuthoringResult | null
}

export type MarketingStreamErrorEvent = {
  message?: string
}

export interface MarketingRefineRequest {
  content: string
  request: string
  /** TEXT: 문안 수정, IMAGE: 이미지 재생성 */
  type: 'TEXT' | 'IMAGE'
}

export interface MarketingVariantUpdateRequest {
  textContent: string
}

export interface MarketingVariantUpdateResponse {
  successYn: boolean
  contentId?: string
  variantId?: number
  message?: string
}

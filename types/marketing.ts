import type { MarketingAuthoringAgentConfig } from '~/types/agent'

export type MarketingOutputKind = 'TEXT' | 'IMAGE'
export type MarketingOutputMode = 'TEXT' | 'IMAGE' | 'BOTH'

// ── 마케팅 프로젝트 / 첨부파일 ──────────────────────────────────────────────

/** TB_CODE CODE_GRP_ID = 'PT000002' 하위 CODE_ID */
export type MarketingProjectStatusCd = '001' | '002' | '003' | '004'
// 001=작성중, 002=검수중, 003=완료, 004=보류

/** 마케팅 첨부파일 */
export interface MarketingFile {
  marketingFileId: string
  marketingProjectId: string
  filePath: string
  fileName: string
  fileSize: number
  fileType: string
  createDt: string
}

/** 파일 업로드 presigned URL 발급 요청 */
export interface MarketingFileUploadUrlRequest {
  fileName: string
  fileType: string
  fileSize: string
  filePath: string
  marketingProjectId?: string
}

/** 파일 메타 저장 요청 (NCP 업로드 완료 후) */
export interface MarketingFileSavePayload {
  marketingProjectId?: string
  fileName: string
  storeFileName: string
  filePath: string
  fileSize: number
  fileType: string
  mimeType: string
}

/** 파일 메타 저장 응답 */
export interface MarketingFileSaveResponse {
  result: string
  marketingFileId: string
  filePath: string
  fileName: string
}

/** 파일명 수정 요청 */
export interface MarketingFileUpdatePayload {
  marketingFileId: string
  fileName: string
}

/** 마케팅 프로젝트 목록 조회 파라미터 */
export interface MarketingProjectListFilter {
  statusCd?: string
  keyword?: string
  sortField?: string
  sortOrder?: string
  /** 최근 N일 (생성일 기준). 없으면 전체 기간 */
  periodDays?: number
  limit?: number
  offset?: number
}

/** selectMarketingProjectList 응답 행 / saveMarketingProject.do 요청·응답 */
export interface MarketingProject {
  marketingProjectId: string
  projectNm: string // 프로젝트명
  orgNm: string // 고객사
  projectOverview?: string // 캠페인 개요
  dueDt: string // 마감일 YYYY-MM-DD (없으면 '')
  statusCd: MarketingProjectStatusCd // STATUS_CD
  statusNm: string // 작성중 | 검수중 | 완료 | 보류
  projectConfigJson?: string
  createDt: string
  modifyDt: string
  createUserId?: string
}

/** 마케팅 작성 마법사 폼 — 그대로 REQUEST_JSON으로 저장된다 (referenceFiles만 업로드 후 제외) */
export interface MarketingFormPayload {
  /** 생성할 결과 (글/그림) */
  outputs: MarketingOutputKind[]
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
  /** 프로젝트 자료실에 이미 있는 파일 중 이번 콘텐츠에 사용할 파일 id */
  selectedExistingFileIds: string[]
  variantCount: number
  /** 글 전용 */
  tones: string[]
  customTone: string
  length: string
  customLength: string
  customCallToAction: string
  outputSections: string[]
  includeHashtags: 'Y' | 'N'
  allowEmoji: 'Y' | 'N'
  /** 그림 전용 */
  imageUsage: string
  snsPlatform: string
  imageType: string
  visualStyle: string
  aspectRatio: string
  customAspectRatio: string
  imageText: string
  brandColors: string
}

/** 저장된 요청 조건 (DB REQUEST_JSON) — File 대신 프로젝트 파일 ID를 갖는다 */
export type MarketingStoredRequest = Omit<MarketingFormPayload, 'referenceFiles' | 'selectedExistingFileIds'> & {
  marketingProjectId?: string
  referenceMarketingFileIds: string[]
}

export interface MarketingVariant {
  id: number
  label: string
  recommended: boolean
  content: string
}

/**
 * 이미지 시안 — 문구 시안처럼 시안별 형식 라벨(감성형 등)을 함께 받는다.
 * id는 문구 시안의 id와 같은 시안 번호로, 통합 모드에서 문구·이미지를 짝짓는 기준이다.
 */
export interface MarketingImageVariant {
  id: number
  url: string
  label: string
  recommended: boolean
}

export interface MarketingResult {
  title: string
  mode: MarketingOutputMode
  variants: MarketingVariant[]
  images: MarketingImageVariant[]
}

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
  marketingProjectId?: string
  title: string
  outputMode: MarketingOutputMode
  summaryLabels: string[]
  createDt: string
}

export interface MarketingContentDetail extends MarketingContentSummary {
  request: MarketingStoredRequest
  result: MarketingResult
}

export interface MarketingContentListParams {
  marketingProjectId?: string
  keyword?: string
  contentType?: string
  outputMode?: MarketingOutputMode
  periodDays?: number
}

export interface MarketingContentListResponse {
  list: MarketingContentSummary[]
}

export interface MarketingCreateRequest extends MarketingStoredRequest {
  agentId: string
  marketingProjectId: string
}

export interface MarketingCreateResponse {
  contentId: string
}

/** 제목·시안 저장·보완 등 갱신 API 공통 응답 — meeting/repository/org-manage 등과 동일한 successYn/returnMsg 컨벤션 */
export interface MarketingActionResponse {
  successYn?: boolean
  returnMsg?: string
}

export interface MarketingRefineRequest {
  request: string
  type: MarketingOutputKind
}

export interface MarketingVariantUpdateRequest {
  textContent: string
}

export type MarketingStreamStep = 'title' | 'labels' | 'variant'

export interface MarketingStreamProgressEvent {
  step: MarketingStreamStep
  title?: string
  variantCount?: number
  contentNo?: number
  label?: string
  recommended?: boolean
  part?: MarketingOutputKind
  text?: string
  imageUrl?: string
}

export interface MarketingStreamDoneEvent {
  result: MarketingResult | null
}

export interface MarketingStreamErrorEvent {
  message?: string
}

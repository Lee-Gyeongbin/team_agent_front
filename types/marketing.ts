import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { TableColumn } from '~/types/table'

export type MarketingOutputKind = 'TEXT' | 'IMAGE'
export type MarketingOutputMode = 'TEXT' | 'IMAGE' | 'BOTH'

// ── 프로젝트 / 파일 ──────────────────────────────────────────────────────────

/** MK000001 */
export const marketingProjectStatuses = [
  { statusCd: '001', statusNm: '작성 중' },
  { statusCd: '002', statusNm: '검수 중' },
  { statusCd: '003', statusNm: '승인 필요' },
  { statusCd: '004', statusNm: '승인 완료' },
  { statusCd: '005', statusNm: '예약' },
  { statusCd: '006', statusNm: '발행 완료' },
  { statusCd: '007', statusNm: '발행 실패' },
] as const

export type MarketingProjectStatusCd = (typeof marketingProjectStatuses)[number]['statusCd']

export type MarketingFilePurposeCd = '001' | '002' | '003'

/** 기획 참고자료 용도. FILE_PURPOSE_CD */
export const marketingFilePurposes = [
  { filePurposeCd: '001', purposeNm: 'content', label: '콘텐츠 참고자료' },
  { filePurposeCd: '002', purposeNm: 'brand', label: '브랜드 참고자료' },
  { filePurposeCd: '003', purposeNm: 'image', label: '이미지 참고자료' },
] as const satisfies readonly { filePurposeCd: MarketingFilePurposeCd; purposeNm: string; label: string }[]

/** 프로젝트 목적 선택값. 저장 필드는 projectOverview */
export const MARKETING_PROJECT_GOAL_PRESETS = [
  '제품 출시',
  '브랜드 인지도',
  '리드 확보',
  '고객 교육',
  '고객 참여',
] as const

export interface MarketingFile {
  marketingFileId: string
  marketingProjectId: string
  filePath: string
  fileName: string
  fileSize: number
  fileType: string
  createDt: string
  filePurposeCd: MarketingFilePurposeCd
}

/** presigned URL 발급 */
export interface MarketingFileUploadUrlRequest {
  fileName: string
  fileType: string
  fileSize: string
  filePath: string
  marketingProjectId?: string
}

/** 업로드 완료 후 파일 메타 저장 */
export interface MarketingFileSavePayload {
  marketingProjectId?: string
  fileName: string
  storeFileName: string
  filePath: string
  fileSize: number
  fileType: string
  mimeType: string
  filePurposeCd: MarketingFilePurposeCd
}

export interface MarketingFileSaveResponse {
  successYn: boolean
  returnMsg?: string
  marketingFileId: string
  filePath: string
  fileName: string
}

export interface MarketingFileUpdatePayload {
  marketingFileId: string
  fileName: string
}

export interface MarketingProjectListFilter {
  statusCd?: string
  keyword?: string
  sortField?: string
  sortOrder?: string
  limit?: number
  offset?: number
}

export interface MarketingProject {
  marketingProjectId: string
  projectNm: string
  orgNm: string
  projectOverview?: string
  dueDt: string // YYYY-MM-DD. 없으면 ''
  statusCd: MarketingProjectStatusCd
  statusNm: string
  createDt: string
  modifyDt: string
  createUserId?: string
  createUserNm?: string
  contentCnt?: number
  approverUserId?: string
  approverUserNm?: string
  memberUserIds?: string[] // 저장 요청. 작성자는 서버가 포함
}

export interface MarketingProjectSaveForm {
  marketingProjectId?: string
  projectNm: string
  orgNm: string
  dueDt: string
  summary?: string
  statusCd?: string // 신규는 서버가 001
  approverUserId?: string
  memberUserIds?: string[]
}

/** selectMarketingProject.do members */
export interface MarketingProjectMember {
  marketingProjectId: string
  userId: string
  userNm: string
  email: string
}

export const marketingProjectListColumns: TableColumn[] = [
  { key: 'projectNm', label: '프로젝트명', align: 'left', headerAlign: 'left' },
  { key: 'statusNm', label: '진행 상태', width: '140px' },
  { key: 'createUserNm', label: '담당자', width: '112px' },
  { key: 'contentCnt', label: '콘텐츠', width: '88px' },
  { key: 'dueDt', label: '마감일', width: '128px' },
  { key: 'modifyDt', label: '최종 업데이트', width: '140px' },
  { key: 'actions', label: '', width: '56px' },
]

// ── 콘텐츠 ──────────────────────────────────────────────────────────────────

/** 콘텐츠 생성 폼. REQUEST_JSON으로 저장 */
export interface MarketingFormPayload {
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
  selectedExistingFileIds: string[] // 자료실에서 고른 파일
  variantCount: number
  // 글
  tones: string[]
  customTone: string
  length: string
  customLength: string
  customCallToAction: string
  outputSections: string[]
  includeHashtags: 'Y' | 'N'
  allowEmoji: 'Y' | 'N'
  // 이미지
  imageUsage: string
  snsPlatform: string
  imageType: string
  visualStyle: string
  aspectRatio: string
  customAspectRatio: string
  imageText: string
  brandColors: string
}

export type MarketingRequestCustomFields = Pick<
  MarketingFormPayload,
  'customPurpose' | 'customAudience' | 'customTone' | 'customChannel' | 'customLength'
>

/** REQUEST_JSON. File 대신 파일 ID */
export type MarketingStoredRequest = Omit<MarketingFormPayload, 'referenceFiles' | 'selectedExistingFileIds'> & {
  marketingProjectId?: string
  referenceMarketingFileIds: string[]
}

export interface MarketingVariant {
  id: number
  label: string
  recommended: boolean
  content: string
  canRestore: boolean // 직전 버전 1회 복원
  prompt?: string // 이 시안 생성에 사용된 프롬프트
}

/** 이미지 시안. id는 문구 시안과 같은 번호 */
export interface MarketingImageVariant {
  id: number
  url: string
  label: string
  recommended: boolean
  canRestore: boolean
  prompt?: string
}

export interface MarketingResult {
  title: string
  mode: MarketingOutputMode
  variants: MarketingVariant[]
  images: MarketingImageVariant[]
}

/** 결과 화면 조건 요약 */
export interface MarketingAuthoringConditionSummary {
  contentType: string
  purpose: string
  audience: string
  tones: string // 콤마 구분
  length: string
  channel?: string
  keyMessage?: string
}

/** 화면용 결과. API 결과에 조건 요약을 붙인다 */
export interface MarketingAuthoringResult extends MarketingResult {
  summary: string
  conditions: MarketingAuthoringConditionSummary
  imageConditions?: MarketingAuthoringConditionSummary
}

export interface MarketingAgentSummary {
  agentId: string
  agentNm: string
  colorHex?: string
  iconClassNm?: string
  config: MarketingAuthoringAgentConfig
}

/** MK000002. 001=대기, 002=생성중, 003=완료, 004=실패 */
export type MarketingAiStatusCd = '001' | '002' | '003' | '004'

export interface MarketingContentSummary {
  contentId: string
  agentId: string
  marketingProjectId?: string
  title: string
  outputMode: MarketingOutputMode
  statusCd: MarketingProjectStatusCd
  statusNm: string
  aiStatusCd?: MarketingAiStatusCd
  aiStatusNm?: string
  publishScheduledDt: string // YYYY-MM-DD HH:mm:ss. 없으면 ''
  publishedYn: 'Y' | 'N'
  summaryLabels: string[]
  createUserNm: string
  createDt: string
}

export interface MarketingContentDetail extends MarketingContentSummary {
  selectedVariantId: number
  contentVersion: number
  review: MarketingReviewResult | null
  approval: MarketingApproval | null
  approverUserId: string
  approverUserNm: string
  canApprove: boolean
  schedule: MarketingScheduleSetting
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

/** 실패하면 contentId 없이 successYn, returnMsg */
export interface MarketingCreateResponse {
  contentId?: string
  successYn: boolean
  returnMsg?: string
}

export interface MarketingActionResponse {
  successYn: boolean
  returnMsg?: string
}

export type MarketingExportFormat = 'word' | 'pdf'

/** 서버는 HTML만 반환. word/pdf 변환은 화면에서 */
export interface MarketingExportHtmlResponse extends MarketingActionResponse {
  html?: string
}

export interface MarketingRefineRequest {
  request: string
  type: MarketingOutputKind
}

export interface MarketingVariantUpdateRequest {
  textContent: string
}

export interface MarketingScheduleUpdateRequest {
  publishScheduledDt: string | null // 예약은 YYYY-MM-DD HH:00:00. null이면 예정일 해제
  publishType: MarketingPublishType
  alertHour: number
}

export interface MarketingPublishedUpdateRequest {
  publishedYn: 'Y' | 'N'
}

export const marketingContentListColumns: TableColumn[] = [
  { key: 'channelNm', label: '채널', width: '112px', align: 'left', headerAlign: 'left' },
  { key: 'displayTitle', label: '콘텐츠명', align: 'left', headerAlign: 'left' },
  { key: 'progressLabel', label: '진행 상태', width: '112px' },
  { key: 'scheduleLabel', label: '예약/발행 일정', width: '148px' },
  { key: 'createUserNm', label: '담당자', width: '100px' },
  { key: 'createDt', label: '최근 업데이트', width: '148px' },
  { key: 'actions', label: '', width: '56px' },
]

// ── 기획서 ──────────────────────────────────────────────────────────────────

export interface MarketingCampaignPlanSection {
  title: string
  body: string
}

export interface MarketingCampaignPlanDraft {
  goal: string
  productNm: string
  requestTxt: string
  targetNm: string
  keyMessage: string
  recommendChannels: string
  visualTxt: string
  sections: MarketingCampaignPlanSection[]
}

export interface MarketingGeneratePlanRequest {
  marketingProjectId: string
  goal: string
  productNm: string
  requestTxt: string
  targetNm: string
  contentFileIds: string[]
  brandFileIds: string[]
  imageFileIds: string[]
}

export interface MarketingRefinePlanRequest {
  marketingProjectId: string
  message: string
}

export interface MarketingPlanResponse extends MarketingActionResponse {
  plan: MarketingCampaignPlanDraft | null
}

// ── 생성 SSE ────────────────────────────────────────────────────────────────

export type MarketingStreamStep = 'title' | 'variant'
export type MarketingGeneratingStep = MarketingStreamStep | ''

export interface MarketingCopyPayloadResult {
  textCopied: boolean
  imageCopied: boolean
}

export interface MarketingStreamProgressEvent {
  step: MarketingStreamStep
  title?: string
  variantNo?: number
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

// ── 화면 ────────────────────────────────────────────────────────────────────

export type MarketingPagePhase =
  | 'list'
  | 'channelSelect'
  | 'channelResults'
  | 'channelContent'
  | 'review'
  | 'approval'
  | 'schedule'

export interface MarketingChannelOption {
  channelCd: string
  channelNm: string
  contentType: string
  formatOptions: string[]
  imageStrategy: string
  recommended: boolean
  selected: boolean
  withImageYn: 'Y' | 'N'
}

export interface MarketingChannelBatchItem {
  channelCd: string
  channelNm: string
  contentId: string
  aiStatusCd: MarketingAiStatusCd
}

export type MarketingChannelConnectionStatus = 'connected' | 'verify' | 'disconnected'

export interface MarketingChannelAccount {
  channelNm: string
  accountId: string
  status: MarketingChannelConnectionStatus
}

export const marketingChannelConnectColumns: TableColumn[] = [
  { key: 'channelNm', label: '채널', align: 'left', headerAlign: 'left' },
  { key: 'accountId', label: '아이디', align: 'left', headerAlign: 'left' },
  { key: 'status', label: '연결 상태', width: '140px', align: 'left', headerAlign: 'left' },
  { key: 'actions', label: '', width: '140px', align: 'right' },
]

/** PASS 통과, REVIEW 확인, FAIL 차단 */
export type MarketingReviewVerdict = 'PASS' | 'REVIEW' | 'FAIL'

/** 검수 판정 배지 색상 클래스 */
export const marketingReviewVerdictBadgeClass: Record<MarketingReviewVerdict, string> = {
  PASS: 'status-review-pass',
  REVIEW: 'status-review-review',
  FAIL: 'status-review-fail',
}
export type MarketingReviewCheckKey = 'fact' | 'brand' | 'goal' | 'channel' | 'legal' | 'complete' | 'visual'
export type MarketingReviewCheckStatus = MarketingReviewVerdict

export interface MarketingReviewCheckItem {
  key: MarketingReviewCheckKey
  label: string
  score: number
  status: MarketingReviewCheckStatus
}

export interface MarketingReviewIssue {
  targetType: MarketingOutputKind
  issueId: string
  severity: Exclude<MarketingReviewVerdict, 'PASS'>
  title: string
  description: string
  fixSuggestion: string
  fixAppliedYn: 'Y' | 'N'
}

export interface MarketingReviewResult {
  reviewId: string
  contentId: string
  score: number
  verdict: MarketingReviewVerdict
  verdictLabel: string
  checks: MarketingReviewCheckItem[]
  issues: MarketingReviewIssue[]
  reviewedDt: string
}

export interface MarketingApproval {
  approvalId: string
  contentId: string
  reviewerNm: string
  memo: string
  approvedYn: 'Y' | 'N'
  approvedDt: string
}

export type MarketingPublishType = 'NOW' | 'SCHEDULE' | 'HOLD'
export type MarketingScheduleStateCd = 'WAITING' | 'QUEUED' | 'DONE' | 'FAILED'
/** 목록 배지용. 채널 자동 발행은 없다 */
export type MarketingScheduleStatus = 'none' | 'upcoming' | 'today' | 'overdue' | 'done'

export interface MarketingScheduleSetting {
  contentId: string
  publishType: MarketingPublishType
  publishScheduledDt: string
  alertHour: number
  scheduleStateCd: MarketingScheduleStateCd
}

export interface MarketingCalendarEvent {
  contentId: string
  displayTitle: string
  channelNm: string
  publishScheduledDt: string
  progressKey: string
}

export interface MarketingCalendarEventItem {
  eventId: string
  marketingProjectId: string
  projectNm: string
  contentId?: string
  title: string
  statusCd: MarketingProjectStatusCd
  eventDt: string
}

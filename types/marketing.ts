import type { MarketingAuthoringAgentConfig } from '~/types/agent'
import type { TableColumn } from '~/types/table'

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
  successYn: boolean
  returnMsg?: string
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
  createDt: string
  modifyDt: string
  createUserId?: string
  createUserNm?: string // 담당자(작성자)명 — 목록 응답
  contentCnt?: number // 콘텐츠 수 — 목록 응답
  /** 저장 요청 전용 — 공개범위(멤버) userId 목록. 작성자는 서버가 항상 강제 포함한다 */
  memberUserIds?: string[]
}

/** 마케팅 프로젝트 신규/수정 저장 폼 */
export interface MarketingProjectSaveForm {
  marketingProjectId?: string
  projectNm: string
  orgNm: string
  dueDt: string
  summary?: string
  projectOverview?: string
  /** 완료/보류 등 수동 상태 변경 — 신규 생성 시엔 서버가 무시하고 항상 작성중으로 시작한다 */
  statusCd?: string
  /** 공개범위(멤버) userId 목록 — 작성자는 서버가 항상 강제 포함한다 */
  memberUserIds?: string[]
}

/** 프로젝트 멤버(공개범위) — selectMarketingProject.do 상세 응답의 members */
export interface MarketingProjectMember {
  marketingProjectId: string
  userId: string
  userNm: string
  email: string
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

export type MarketingRequestCustomFields = Pick<
  MarketingFormPayload,
  'customPurpose' | 'customAudience' | 'customTone' | 'customChannel' | 'customLength'
>

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
  /** 직전 버전으로 되돌리기 가능 여부 (1회 롤백) */
  canRestore: boolean
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
  /** 직전 버전으로 되돌리기 가능 여부 (1회 롤백) */
  canRestore: boolean
}

export interface MarketingResult {
  title: string
  mode: MarketingOutputMode
  variants: MarketingVariant[]
  images: MarketingImageVariant[]
}

/** 결과 화면 메타·채널 전송용 조건 요약 */
export interface MarketingAuthoringConditionSummary {
  contentType: string
  purpose: string
  audience: string
  /** 항상 콤마구분 문자열 (toConditions/toImageConditions가 생성) */
  tones: string
  length: string
  channel?: string
  keyMessage?: string
}

/** MarketingResult 등 UI용 — API MarketingResult + 조건 요약 */
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

/** 콘텐츠 생성 상태 코드 (TB_MKT.STATUS_CD) */
export type MarketingContentStatusCd = '001' | '002' | '003' | '004'
// 001=대기, 002=생성중, 003=완료, 004=실패

export interface MarketingContentSummary {
  contentId: string
  agentId: string
  marketingProjectId?: string
  title: string
  outputMode: MarketingOutputMode
  /** 생성 상태 — 재진입 시 생성중/실패 여부 판단용. 과거 응답과의 호환을 위해 optional */
  statusCd?: MarketingContentStatusCd
  /** 발행 예정일시(YYYY-MM-DD HH:mm:ss) — 없으면 '' */
  publishScheduledDt: string
  /** 발행 완료 표시 — 리마인더 배지·배너를 끄고 켜는 용도 */
  publishedYn: 'Y' | 'N'
  summaryLabels: string[]
  createUserNm: string
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

/** contentId는 성공 시에만 채워진다 — marketingProjectId 누락 등 검증 실패 시 successYn/returnMsg만 온다 */
export interface MarketingCreateResponse {
  contentId?: string
  successYn: boolean
  returnMsg?: string
}

/** JSON 성공/실패 공통 응답 — 프로젝트/파일 .do 와 콘텐츠 REST 모두 successYn/returnMsg */
export interface MarketingActionResponse {
  successYn: boolean
  returnMsg?: string
}

/** word/pdf 프론트 변환용 — 서버는 LLM+템플릿 렌더링 HTML까지만 반환한다 */
export type MarketingExportFormat = 'word' | 'pdf'

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

/** 발행 설정 저장 요청 — 예정일을 해제하려면 publishScheduledDt: null. publishType 생략 시 서버가 예정일로 유추(레거시 호환) */
export interface MarketingScheduleUpdateRequest {
  publishScheduledDt: string | null
  publishType?: MarketingPublishType
  alertHour?: number
}

/** 발행 완료 표시/해제 요청 */
export interface MarketingPublishedUpdateRequest {
  publishedYn: 'Y' | 'N'
}

/** 캠페인 기획서 콘텐츠 실행 계획 — 모아보기(채널별 콘텐츠) 행 */
export interface MarketingCampaignPlanContentItem {
  contentId: string
  displayTitle: string
  channelNm: string
  scheduleLabel: string
}

/** 캠페인 기획서 화면 초안 — 대화·프롬프트 수정 대상 */
export interface MarketingCampaignPlanDraft {
  goal: string
  productNm: string
  requestTxt: string
  targetNm: string
  keyMessage: string
  recommendChannels: string
  visualTxt: string
}

export type MarketingStreamStep = 'title' | 'labels' | 'variant'
export type MarketingGeneratingStep = MarketingStreamStep | ''

export interface MarketingCopyPayloadResult {
  textCopied: boolean
  imageCopied: boolean
}

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

/** 마케팅 프로젝트 목록 테이블 컬럼 정의 */
export const marketingProjectListColumns: TableColumn[] = [
  { key: 'projectNm', label: '캠페인명', align: 'left', headerAlign: 'left' },
  { key: 'statusNm', label: '진행 상태', width: '140px' },
  { key: 'createUserNm', label: '담당자', width: '112px' },
  { key: 'contentCnt', label: '콘텐츠', width: '88px' },
  { key: 'dueDt', label: '마감일', width: '128px' },
  { key: 'modifyDt', label: '최종 업데이트', width: '140px' },
  { key: 'actions', label: '', width: '56px' },
]

/** 발행 채널 연결 테이블 컬럼 정의 */
export const marketingChannelConnectColumns: TableColumn[] = [
  { key: 'channelNm', label: '채널', align: 'left', headerAlign: 'left' },
  { key: 'accountId', label: '아이디', align: 'left', headerAlign: 'left' },
  { key: 'recipientCount', label: '수신 대상', width: '120px', align: 'left', headerAlign: 'left' },
  { key: 'recipientSync', label: '수신 대상 연동', width: '140px', align: 'left', headerAlign: 'left' },
  { key: 'status', label: '연결 상태', width: '140px', align: 'left', headerAlign: 'left' },
  { key: 'actions', label: '', width: '280px', align: 'right' },
]

export type MarketingChannelConnectionStatus = 'connected' | 'verify' | 'disconnected'

export interface MarketingChannelAccount {
  channelNm: string
  accountId: string
  recipientCount: number | null
  recipientSync: string
  status: MarketingChannelConnectionStatus
}

/** 수신 대상 관리 테이블 컬럼 정의 */
export const marketingRecipientManageColumns: TableColumn[] = [
  { key: 'recipientNm', label: '이름', width: '120px', align: 'left', headerAlign: 'left' },
  { key: 'companyNm', label: '회사', width: '140px', align: 'left', headerAlign: 'left' },
  { key: 'contact', label: '연락처 (이메일/전화번호)', align: 'left', headerAlign: 'left' },
  { key: 'adConsentNm', label: '광고수신동의 여부', width: '160px', align: 'left', headerAlign: 'left' },
  { key: 'adConsentDt', label: '광고수신동의일', width: '140px', align: 'left', headerAlign: 'left' },
  { key: 'optOutNm', label: '수신거부 여부', width: '140px', align: 'left', headerAlign: 'left' },
]

export interface MarketingRecipient {
  contact: string
  recipientNm: string
  companyNm: string
  channelNm: string
  adConsentNm: string
  adConsentDt: string
  optOutNm: string
}

/** 캠페인 상세 콘텐츠 목록 테이블 컬럼 정의 */
export const marketingContentListColumns: TableColumn[] = [
  { key: 'channelNm', label: '채널', width: '112px', align: 'left', headerAlign: 'left' },
  { key: 'displayTitle', label: '콘텐츠명', align: 'left', headerAlign: 'left' },
  { key: 'progressLabel', label: '진행 상태', width: '112px' },
  { key: 'scheduleLabel', label: '예약/발행 일정', width: '148px' },
  { key: 'createUserNm', label: '담당자', width: '100px' },
  { key: 'createDt', label: '최근 업데이트', width: '148px' },
  { key: 'actions', label: '', width: '56px' },
]

// ── 페이지 phase (marketing/[id].vue 내부 화면 전환) ────────────────────────

export type MarketingPagePhase =
  | 'list'
  | 'channelSelect'
  | 'channelResults'
  | 'channelContent'
  | 'review'
  | 'approval'
  | 'schedule'

// ── 채널 선택 (channelSelect) ───────────────────────────────────────────────

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

// ── 채널별 생성 배치 (channelResults / channelContent) ──────────────────────

export interface MarketingChannelBatchItem {
  channelCd: string
  channelNm: string
  contentId: string
  statusCd: MarketingContentStatusCd
}

// ── AI 검수 (review) ────────────────────────────────────────────────────────

export type MarketingReviewCheckKey = 'fact' | 'brand' | 'goal' | 'channel' | 'legal' | 'complete' | 'visual'
export type MarketingReviewCheckStatus = 'PASS' | 'WARNING' | 'FAIL'

export interface MarketingReviewCheckItem {
  key: MarketingReviewCheckKey
  label: string
  score: number
  status: MarketingReviewCheckStatus
}

export interface MarketingReviewIssue {
  issueId: string
  severity: 'FAIL' | 'WARNING'
  title: string
  description: string
  fixSuggestion: string
  fixAppliedYn: 'Y' | 'N'
}

export interface MarketingReviewResult {
  reviewId: string
  contentId: string
  score: number
  verdict: 'PASS' | 'NEEDS_FIX'
  verdictLabel: string
  checks: MarketingReviewCheckItem[]
  issues: MarketingReviewIssue[]
  reviewedDt: string
}

// ── 사용자 승인 (approval) ──────────────────────────────────────────────────

export interface MarketingApproval {
  approvalId: string
  contentId: string
  reviewerNm: string
  memo: string
  approvedYn: 'Y' | 'N'
  approvedDt: string
}

// ── 예약 및 발행 (schedule) ─────────────────────────────────────────────────

export type MarketingPublishType = 'NOW' | 'SCHEDULE' | 'HOLD'
export type MarketingScheduleStateCd = 'WAITING' | 'QUEUED' | 'PUBLISHING' | 'DONE' | 'FAILED'
/** 제작 내역 목록의 배지·배너 색상 판단용. 실제 채널 자동 발행은 없다 */
export type MarketingScheduleStatus = 'none' | 'upcoming' | 'today' | 'overdue' | 'done'

export interface MarketingScheduleSetting {
  contentId: string
  publishType: MarketingPublishType
  publishScheduledDt: string
  alertHour: number
  scheduleStateCd: MarketingScheduleStateCd
}

// ── 캠페인 상세 미니 캘린더 ─────────────────────────────────────────────────

export interface MarketingCalendarEvent {
  contentId: string
  displayTitle: string
  channelNm: string
  publishScheduledDt: string
  progressKey: string
}

// ── 캠페인 캘린더 (전체 페이지) ─────────────────────────────────────────────

export type MarketingCalendarStatusKey =
  | 'draft'
  | 'review'
  | 'needsapprove'
  | 'approved'
  | 'scheduled'
  | 'done'
  | 'failed'

export interface MarketingCalendarEventItem {
  eventId: string
  marketingProjectId: string
  campaignNm: string
  contentId?: string
  title: string
  statusKey: MarketingCalendarStatusKey
  eventDt: string
}

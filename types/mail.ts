export interface Mail {
  subject: string
  from: string
  fromName: string
  receivedDate: string | null
  body: string
  isRead: boolean
}

export interface MailListResponse {
  result: string
  mails: Mail[]
  totalCount: number
  unreadCount: number
  todayCount: number
}

export interface MailListParams {
  startDate: string
  endDate: string
}

export interface ActionItem {
  text: string
  priority: 'urgent' | 'this_week' | 'normal'
  from: string
  time: string
}

export interface MailSummaryResponse {
  result: string
  briefing: string[]
  actionItems: ActionItem[]
}

export interface MailAuthRequest {
  email: string
  password: string
}

export interface MailChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface MailChatRequest {
  message: string
  mailContext: string
  chatHistory: MailChatHistoryItem[]
}

export interface MailChatResponse {
  result: string
  answer: string
}

export interface SentMail {
  subject: string
  to: string
  toName: string
  sentDate: string | null
  body: string
}

export interface SentMailListResponse {
  result: string
  mails: SentMail[]
  totalCount: number
}

export interface FollowupItem {
  to: string
  toEmail: string
  subject: string
  sentDate: string | null
  daysElapsed: number
}

export interface FollowupCompleted {
  to: string
  toEmail: string
  subject: string
  sentDate: string | null
  replyDate: string | null
  daysElapsed: number
}

export interface FollowupStats {
  pendingCount: number
  avgWaitDays: number
  completedThisWeek: number
}

export interface FollowupStatusResponse {
  result: string
  pending: FollowupItem[]
  completed: FollowupCompleted[]
  stats: FollowupStats
}

export interface FollowupDraftRequest {
  to: string
  subject: string
  originalDate: string
}

export interface FollowupDraftResponse {
  result: string
  draft: string
}

// ─── 신규: KPI / 분류 메일함 / 팔로업 DB ─────────────────────

export interface MailKpi {
  totalCount: number
  replyRequiredCount: number
  urgentCount: number
  todayDueCount: number
}

export interface MailKpiResponse {
  result: string
  msg?: string
  totalCount?: number
  replyRequiredCount?: number
  urgentCount?: number
  todayDueCount?: number
  inboxUidValidity?: number | null
  /** @deprecated API는 최상위 필드로 반환 — 하위 호환용 */
  kpi?: MailKpi
}

export interface ClassifiedMail {
  mailId: string
  imapUid: string
  subject: string
  fromAddr: string
  fromName: string
  mailDt: string | null
  mailPurposeCd: string
  mailPurposeNm: string
  actionRequiredCd: string
  actionRequiredNm: string
  urgencyCd: string
  urgencyNm: string
  importanceCd: string
  importanceNm: string
  workCategoryCd: string
  workCategoryNm: string
  dueDt: string | null
  summary: string
  actionCompleteYn: string
  folderCd: string
  bodyText: string
}

export interface ClassifiedMailListResponse {
  result: string
  list: ClassifiedMail[]
  totalCount: number
  tabCounts: { all: number; action: number; reply: number }
}

export interface ClassifiedMailListParams {
  tabType: 'all' | 'action' | 'reply'
  searchField: string
  searchKeyword: string
  purposeCds: string[]
  actionCds: string[]
  urgencyCds: string[]
  importanceCds: string[]
  categoryCds: string[]
  pageNum: number
  pageSize: number
  startDate?: string
  endDate?: string
}

export interface MailDetailMail {
  mailId: string
  accountId?: string
  folderCd: string
  subject: string
  fromAddr: string
  fromName: string
  mailDt: string | number | null
  bodyText: string
  hasAttachYn?: string
}

export interface MailAnalysis {
  mailId: string
  mailPurposeCd: string
  actionRequiredCd: string
  urgencyCd: string
  importanceCd: string
  workCategoryCd: string
  dueDt: string | number | null
  summary: string
  actionCompleteYn: string
  actionCompleteDt?: string | number | null
  analyzedDt?: string | number | null
}

export interface MailDetailResponse {
  result: string
  msg?: string
  mail: MailDetailMail
  analysis: MailAnalysis | null
}

export interface ReplyDraftRequest {
  mailId: string
}

export interface ReplyDraftResponse {
  result: string
  msg?: string
  draftId?: string
  draftContent?: string
  /** @deprecated API는 draftContent로 반환 — 하위 호환용 */
  draft?: string
}

export interface ActionCompleteRequest {
  mailId: string
  actionCompleteYn: string
}

export interface WorkCategory {
  cd: string
  nm: string
}

export interface FollowupDbItem {
  followupId: string
  sentMailId: string
  recipientAddr: string
  expectedReplyDt: string | null
  statusCd: string
  statusNm: string
  repliedMailId: string | null
  subject: string
  fromName: string
  mailDt: string | null
}

export interface FollowupListResponse {
  result: string
  list: FollowupDbItem[]
  totalCount: number
}

export interface FollowupRegisterRequest {
  mailId: string
  recipientAddr: string
  expectedReplyDt: string
}

export interface FollowupStatusUpdateRequest {
  followupId: string
  statusCd: string
}

export interface MailSyncResponse {
  result: string
  syncedCount: number
}

export interface WorkCategoryListResponse {
  result: string
  list: WorkCategory[]
}

export interface InboxSummaryResponse {
  result: string
  summary: string
}

// ─── 보낸메일함 분류 (LLM 기반) ──────────────────────────────

export interface SentClassifiedItem {
  mailId: string
  subject: string
  toName: string
  toAddr: string
  mailDt: string | null
  replyExpectedYn: 'Y' | 'N'
  repliedYn: 'Y' | 'N'
  elapsedDays: number
  replyElapsedHours: number | null
  // 팔로업 통합 필드
  followupId: string | null
  followupStatusCd: '001' | '002' | '003' | null // 001: 대기, 002: 회신됨, 003: 무시
  expectedReplyDt: string | null
  followupRecipientAddr: string | null
  trackSource: 'USER' | 'AI' | 'DISMISSED' | 'NONE' // USER: 사용자 팔로업, AI: AI 회신기대, DISMISSED: AI 무시, NONE: 없음
}

export interface SentClassifiedListResponse {
  result: string
  list: SentClassifiedItem[]
  totalCount: number
  tabCounts: { all: number; pending: number; done: number }
}

export interface SentClassifiedListParams {
  tabType: 'all' | 'pending' | 'done'
  startDate?: string
  endDate?: string
  pageNum: number
  pageSize: number
}

export interface SentTopRecipient {
  toAddr: string
  toName: string
  pendingCount: number
}

export interface SentTopRecipientsResponse {
  result: string
  list: SentTopRecipient[]
}

export interface SentWeeklyStats {
  avgReplyDays: number
  prevAvgReplyDays: number
  replyRate: number
  prevReplyRate: number
  pendingCount: number
  doneCount: number
}

export interface SentWeeklyStatsResponse {
  result: string
  avgReplyDays: number
  prevAvgReplyDays: number
  replyRate: number
  prevReplyRate: number
  pendingCount: number
  doneCount: number
}

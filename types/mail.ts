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

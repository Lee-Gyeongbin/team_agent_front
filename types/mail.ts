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

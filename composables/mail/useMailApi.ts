import { useApi } from '~/composables/com/useApi'
import type {
  MailListResponse,
  MailSummaryResponse,
  MailAuthRequest,
  MailListParams,
  MailChatRequest,
  MailChatResponse,
  SentMailListResponse,
  FollowupStatusResponse,
  FollowupDraftRequest,
  FollowupDraftResponse,
  MailSyncResponse,
  MailKpiResponse,
  ClassifiedMailListParams,
  ClassifiedMailListResponse,
  MailDetailResponse,
  ReplyDraftRequest,
  ReplyDraftResponse,
  ActionCompleteRequest,
  FollowupRegisterRequest,
  FollowupListResponse,
  FollowupStatusUpdateRequest,
  InboxSummaryResponse,
  SentClassifiedListParams,
  SentClassifiedListResponse,
  SentTopRecipientsResponse,
  SentWeeklyStatsResponse,
} from '~/types/mail'

const { get, post } = useApi()

export const useMailApi = () => {
  /** 서버 세션에 메일 자격증명이 살아있는지 확인 (IMAP 재연결 없음) */
  const fetchMailAuthCheck = async (): Promise<{ result: string }> => {
    return get<{ result: string }>('/mail/auth-check.do')
  }

  /** IMAP 인증 — 성공 시 서버 세션에 자격증명 저장 */
  const fetchMailAuth = async (body: MailAuthRequest): Promise<{ result: string }> => {
    return post<{ result: string }>('/mail/auth.do', body)
  }

  /** 날짜 범위 기반 받은메일함 조회 */
  const fetchMailList = async (params: MailListParams): Promise<MailListResponse> => {
    const query = new URLSearchParams()
    query.append('startDate', params.startDate)
    query.append('endDate', params.endDate)
    return get<MailListResponse>(`/mail/list.do?${query.toString()}`)
  }

  /** 날짜 범위 기반 보낸메일함 조회 */
  const fetchSentMailList = async (params: MailListParams): Promise<SentMailListResponse> => {
    const query = new URLSearchParams()
    query.append('startDate', params.startDate)
    query.append('endDate', params.endDate)
    return get<SentMailListResponse>(`/mail/sent.do?${query.toString()}`)
  }

  /** AI 메일 브리핑 요약 생성 */
  const fetchMailSummary = async (): Promise<MailSummaryResponse> => {
    return post<MailSummaryResponse>('/mail/summary.do', {})
  }

  /** 메일 컨텍스트 기반 AI 채팅 */
  const fetchMailChat = async (body: MailChatRequest): Promise<MailChatResponse> => {
    return post<MailChatResponse>('/mail/chat.do', body)
  }

  /** 팔로업 상태 조회 (보낸 메일 vs 받은 메일 교차 분석) */
  const fetchFollowupStatus = async (params: MailListParams): Promise<FollowupStatusResponse> => {
    const query = new URLSearchParams()
    query.append('startDate', params.startDate)
    query.append('endDate', params.endDate)
    return get<FollowupStatusResponse>(`/mail/followup-status.do?${query.toString()}`)
  }

  /** AI 독촉 메일 초안 생성 */
  const fetchFollowupDraft = async (body: FollowupDraftRequest): Promise<FollowupDraftResponse> => {
    return post<FollowupDraftResponse>('/mail/followup-draft.do', body)
  }

  /** 메일 동기화 (수신함 최신 메일 동기화) */
  const fetchMailSync = async (): Promise<MailSyncResponse> => {
    return post<MailSyncResponse>('/mail/sync.do', {})
  }

  /** KPI 요약 조회 */
  const fetchMailKpi = async (): Promise<MailKpiResponse> => {
    return get<MailKpiResponse>('/mail/kpi.do')
  }

  /** AI 분류된 받은메일함 목록 조회 */
  const fetchInboxClassified = async (params: ClassifiedMailListParams): Promise<ClassifiedMailListResponse> => {
    const query = new URLSearchParams()
    query.append('tabType', params.tabType)
    query.append('searchField', params.searchField)
    if (params.searchKeyword) query.append('searchKeyword', params.searchKeyword)
    if (params.purposeCds?.length) query.append('purposeCds', params.purposeCds.join(','))
    if (params.actionCds?.length) query.append('actionCds', params.actionCds.join(','))
    if (params.urgencyCds?.length) query.append('urgencyCds', params.urgencyCds.join(','))
    if (params.importanceCds?.length) query.append('importanceCds', params.importanceCds.join(','))
    if (params.categoryCds?.length) query.append('categoryCds', params.categoryCds.join(','))
    query.append('pageNum', String(params.pageNum ?? 1))
    query.append('pageSize', String(params.pageSize ?? 50))
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)
    return get<ClassifiedMailListResponse>(`/mail/inbox-classified.do?${query.toString()}`)
  }

  /** 분류된 메일 상세 조회 */
  const fetchMailDetail = async (mailId: string): Promise<MailDetailResponse> => {
    return get<MailDetailResponse>(`/mail/inbox-detail.do?mailId=${mailId}`)
  }

  /** AI 회신 초안 생성 */
  const fetchReplyDraft = async (req: ReplyDraftRequest): Promise<ReplyDraftResponse> => {
    return post<ReplyDraftResponse>('/mail/reply-draft.do', req)
  }

  /** 조치 완료 여부 업데이트 */
  const fetchActionComplete = async (req: ActionCompleteRequest): Promise<{ result: string }> => {
    return post<{ result: string }>('/mail/action-complete.do', req)
  }

  /** 팔로업 DB 등록 */
  const fetchFollowupRegister = async (req: FollowupRegisterRequest): Promise<{ result: string }> => {
    return post<{ result: string }>('/mail/followup-register.do', req)
  }

  /** 팔로업 DB 목록 조회 */
  const fetchFollowupList = async (): Promise<FollowupListResponse> => {
    return get<FollowupListResponse>('/mail/followup-list.do')
  }

  /** 팔로업 상태 업데이트 */
  const fetchFollowupStatusUpdate = async (req: FollowupStatusUpdateRequest): Promise<{ result: string }> => {
    return post<{ result: string }>('/mail/followup-status-update.do', req)
  }

  /** 날짜 범위 동기화 (DB에 없는 메일만 IMAP → AI 분류) */
  const fetchSyncRange = async (startDate: string, endDate: string): Promise<{ result: string; newCount: number }> => {
    return post<{ result: string; newCount: number }>('/mail/sync-range.do', { startDate, endDate })
  }

  /** 현재 필터 조건 메일 전체 AI 요약 */
  const fetchInboxSummary = async (params: ClassifiedMailListParams): Promise<InboxSummaryResponse> => {
    return post<InboxSummaryResponse>('/mail/inbox-summary.do', params)
  }

  /** 보낸메일함 분류 목록 조회 (LLM 기반, 서브탭/페이징 지원) */
  const fetchSentClassified = async (params: SentClassifiedListParams): Promise<SentClassifiedListResponse> => {
    const query = new URLSearchParams()
    query.append('tabType', params.tabType)
    query.append('pageNum', String(params.pageNum ?? 1))
    query.append('pageSize', String(params.pageSize ?? 50))
    if (params.startDate) query.append('startDate', params.startDate)
    if (params.endDate) query.append('endDate', params.endDate)
    return get<SentClassifiedListResponse>(`/mail/sent-classified.do?${query.toString()}`)
  }

  /** 답장 대기 많은 상대 조회 */
  const fetchSentTopRecipients = async (startDate?: string, endDate?: string): Promise<SentTopRecipientsResponse> => {
    const query = new URLSearchParams()
    if (startDate) query.append('startDate', startDate)
    if (endDate) query.append('endDate', endDate)
    return get<SentTopRecipientsResponse>(`/mail/sent-top-recipients.do?${query.toString()}`)
  }

  /** 이번 주 / 전주 회신 통계 조회 */
  const fetchSentWeeklyStats = async (): Promise<SentWeeklyStatsResponse> => {
    return get<SentWeeklyStatsResponse>('/mail/sent-weekly-stats.do')
  }

  return {
    fetchMailAuthCheck,
    fetchMailAuth,
    fetchMailList,
    fetchSentMailList,
    fetchMailSummary,
    fetchMailChat,
    fetchFollowupStatus,
    fetchFollowupDraft,
    fetchMailSync,
    fetchMailKpi,
    fetchInboxClassified,
    fetchMailDetail,
    fetchReplyDraft,
    fetchActionComplete,
    fetchFollowupRegister,
    fetchFollowupList,
    fetchFollowupStatusUpdate,
    fetchInboxSummary,
    fetchSyncRange,
    fetchSentClassified,
    fetchSentTopRecipients,
    fetchSentWeeklyStats,
  }
}

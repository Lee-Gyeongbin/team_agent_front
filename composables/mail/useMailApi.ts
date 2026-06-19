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
} from '~/types/mail'

const { get, post } = useApi()

export const useMailApi = () => {
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

  return {
    fetchMailAuth,
    fetchMailList,
    fetchSentMailList,
    fetchMailSummary,
    fetchMailChat,
    fetchFollowupStatus,
    fetchFollowupDraft,
  }
}

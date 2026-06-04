import { useApi } from '~/composables/com/useApi'
import type {
  MailListResponse,
  MailSummaryResponse,
  MailAuthRequest,
  MailListParams,
  MailChatRequest,
  MailChatResponse,
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

  /** AI 메일 브리핑 요약 생성 */
  const fetchMailSummary = async (): Promise<MailSummaryResponse> => {
    return post<MailSummaryResponse>('/mail/summary.do', {})
  }

  /** 메일 컨텍스트 기반 AI 채팅 */
  const fetchMailChat = async (body: MailChatRequest): Promise<MailChatResponse> => {
    return post<MailChatResponse>('/mail/chat.do', body)
  }

  return { fetchMailAuth, fetchMailList, fetchMailSummary, fetchMailChat }
}

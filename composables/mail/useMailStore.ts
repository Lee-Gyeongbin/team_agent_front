import { useMailApi } from '~/composables/mail/useMailApi'
import { openToast } from '~/composables/useToast'
import type { Mail, ActionItem, MailListParams, MailChatRequest } from '~/types/mail'

const { fetchMailAuth, fetchMailList, fetchMailSummary, fetchMailChat } = useMailApi()

// ─── 공유 상태 (모듈 스코프) ─────────────────────────────────
const isLoginModalOpen = ref(false)
const isLoadingList = ref(false)
const isLoadingSummary = ref(false)
const isLoadingChat = ref(false)

const mails = ref<Mail[]>([])
const totalCount = ref(0)
const unreadCount = ref(0)
const todayCount = ref(0)
const briefing = ref<string[]>([])
const actionItems = ref<ActionItem[]>([])

export const useMailStore = () => {
  // ─── 로그인 모달 제어 ─────────────────────────────────────
  const openLoginModal = () => {
    isLoginModalOpen.value = true
  }
  const closeLoginModal = () => {
    isLoginModalOpen.value = false
  }

  // ─── IMAP 인증 ────────────────────────────────────────────
  const handleMailAuth = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetchMailAuth({ email, password })
      return res.result === 'SUCCESS'
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '인증 중 오류가 발생했습니다.'
      throw new Error(msg)
    }
  }

  // ─── 메일 목록 조회 ───────────────────────────────────────
  const handleFetchMailList = async (params: MailListParams) => {
    isLoadingList.value = true
    try {
      const res = await fetchMailList(params)
      mails.value = res.mails ?? []
      totalCount.value = res.totalCount ?? 0
      unreadCount.value = res.unreadCount ?? 0
      todayCount.value = res.todayCount ?? 0
    } catch {
      openToast({ message: '메일 목록 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingList.value = false
    }
  }

  // ─── AI 요약 조회 ─────────────────────────────────────────
  const handleFetchMailSummary = async () => {
    isLoadingSummary.value = true
    try {
      const res = await fetchMailSummary()
      briefing.value = Array.isArray(res.briefing) ? res.briefing : []
      actionItems.value = res.actionItems ?? []
    } catch {
      openToast({ message: 'AI 브리핑 생성에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingSummary.value = false
    }
  }

  // ─── 메일 컨텍스트 AI 채팅 ────────────────────────────────
  const handleFetchMailChat = async (body: MailChatRequest) => {
    isLoadingChat.value = true
    try {
      const res = await fetchMailChat(body)
      return res.answer ?? ''
    } catch {
      openToast({ message: '메일 AI 채팅 응답에 실패했습니다.', type: 'error' })
      return ''
    } finally {
      isLoadingChat.value = false
    }
  }

  return {
    // 상태
    isLoginModalOpen,
    isLoadingList,
    isLoadingSummary,
    isLoadingChat,
    mails,
    totalCount,
    unreadCount,
    todayCount,
    briefing,
    actionItems,
    // 액션
    openLoginModal,
    closeLoginModal,
    handleMailAuth,
    handleFetchMailList,
    handleFetchMailSummary,
    handleFetchMailChat,
  }
}

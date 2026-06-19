import { useMailApi } from '~/composables/mail/useMailApi'
import { openToast } from '~/composables/useToast'
import type {
  Mail,
  SentMail,
  ActionItem,
  MailListParams,
  MailChatRequest,
  FollowupItem,
  FollowupCompleted,
  FollowupStats,
} from '~/types/mail'

const {
  fetchMailAuthCheck,
  fetchMailAuth,
  fetchMailList,
  fetchSentMailList,
  fetchMailSummary,
  fetchMailChat,
  fetchFollowupStatus,
  fetchFollowupDraft,
} = useMailApi()

// ─── 공유 상태 (모듈 스코프) ─────────────────────────────────
const isLoginModalOpen = ref(false)
const isMailAuthed = ref(false) // 한 번 인증 성공 시 true, 페이지 이동 간 로그인 모달 재표시 방지
const isLoadingList = ref(false)
const isLoadingSentList = ref(false)
const isLoadingSummary = ref(false)
const isLoadingChat = ref(false)

const mails = ref<Mail[]>([])
const totalCount = ref(0)
const unreadCount = ref(0)
const todayCount = ref(0)
const sentMails = ref<SentMail[]>([])
const sentTotalCount = ref(0)
const briefing = ref<string[]>([])
const actionItems = ref<ActionItem[]>([])
const isLoadingFollowup = ref(false)
const followupPending = ref<FollowupItem[]>([])
const followupCompleted = ref<FollowupCompleted[]>([])
const followupStats = ref<FollowupStats>({ pendingCount: 0, avgWaitDays: 0, completedThisWeek: 0 })

export const useMailStore = () => {
  // ─── 로그인 모달 제어 ─────────────────────────────────────
  const openLoginModal = () => {
    isLoginModalOpen.value = true
  }
  const closeLoginModal = () => {
    isLoginModalOpen.value = false
  }

  // ─── 인증 상태 확인 ──────────────────────────────────────
  /**
   * 메일 에이전트 클릭 시 호출.
   * 모듈 캐시(isMailAuthed)가 true이면 API 호출 없이 즉시 true 반환.
   * 아니면 서버 세션 확인 후 결과를 캐싱.
   */
  const checkMailAuth = async (): Promise<boolean> => {
    if (isMailAuthed.value) return true
    try {
      const res = await fetchMailAuthCheck()
      if (res.result === 'SUCCESS') {
        isMailAuthed.value = true
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // ─── IMAP 인증 ────────────────────────────────────────────
  const handleMailAuth = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetchMailAuth({ email, password })
      if (res.result === 'SUCCESS') {
        isMailAuthed.value = true
        return true
      }
      return false
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '인증 중 오류가 발생했습니다.'
      throw new Error(msg)
    }
  }

  // ─── 받은 메일 목록 조회 ──────────────────────────────────
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

  // ─── 보낸 메일 목록 조회 ──────────────────────────────────
  const handleFetchSentMailList = async (params: MailListParams) => {
    isLoadingSentList.value = true
    try {
      const res = await fetchSentMailList(params)
      sentMails.value = res.mails ?? []
      sentTotalCount.value = res.totalCount ?? 0
    } catch {
      openToast({ message: '보낸 메일 목록 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingSentList.value = false
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

  // ─── 팔로업 상태 조회 ─────────────────────────────────────
  const handleFetchFollowupStatus = async (params: MailListParams) => {
    isLoadingFollowup.value = true
    try {
      const res = await fetchFollowupStatus(params)
      followupPending.value = res.pending ?? []
      followupCompleted.value = res.completed ?? []
      followupStats.value = res.stats ?? { pendingCount: 0, avgWaitDays: 0, completedThisWeek: 0 }
    } catch {
      openToast({ message: '팔로업 상태 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingFollowup.value = false
    }
  }

  // ─── AI 독촉 메일 초안 생성 ───────────────────────────────
  const handleFetchFollowupDraft = async (to: string, subject: string, originalDate: string): Promise<string> => {
    try {
      const res = await fetchFollowupDraft({ to, subject, originalDate })
      return res.draft ?? ''
    } catch {
      openToast({ message: '독촉 메일 초안 생성에 실패했습니다.', type: 'error' })
      return ''
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
    isLoadingSentList,
    isLoadingSummary,
    isLoadingChat,
    mails,
    totalCount,
    unreadCount,
    todayCount,
    sentMails,
    sentTotalCount,
    briefing,
    actionItems,
    isLoadingFollowup,
    followupPending,
    followupCompleted,
    followupStats,
    // 액션
    checkMailAuth,
    clearMailAuth: () => {
      isMailAuthed.value = false
    },
    openLoginModal,
    closeLoginModal,
    handleMailAuth,
    handleFetchMailList,
    handleFetchSentMailList,
    handleFetchMailSummary,
    handleFetchMailChat,
    handleFetchFollowupStatus,
    handleFetchFollowupDraft,
  }
}

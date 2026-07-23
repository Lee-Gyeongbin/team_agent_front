import { useMailApi } from '~/composables/mail/useMailApi'
import { useCommonCodesApi } from '~/composables/com/useCommonCodesApi'
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
  MailKpi,
  ClassifiedMail,
  ClassifiedMailListParams,
  WorkCategory,
  MailDetailMail,
  MailAnalysis,
  FollowupDbItem,
  FollowupRegisterRequest,
  FollowupStatusUpdateRequest,
  SentClassifiedItem,
  SentClassifiedListParams,
  SentTopRecipient,
  SentWeeklyStats,
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
} = useMailApi()

const { fetchCodes } = useCommonCodesApi()

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

// ─── 신규 상태 (모듈 스코프) ─────────────────────────────────
const kpi = ref<MailKpi | null>(null)
const classifiedMails = ref<ClassifiedMail[]>([])
const classifiedTotalCount = ref(0)
const classifiedTabCounts = ref({ all: 0, action: 0, reply: 0 })
const selectedMail = ref<ClassifiedMail | null>(null)
const workCategories = ref<WorkCategory[]>([])
const purposeOptions = ref<WorkCategory[]>([])
const actionOptions = ref<WorkCategory[]>([])
const urgencyOptions = ref<WorkCategory[]>([])
const importanceOptions = ref<WorkCategory[]>([])
const isLoadingKpi = ref(false)
const isLoadingClassified = ref(false)
const isLoadingSync = ref(false)
const followupDbList = ref<FollowupDbItem[]>([])
const isLoadingFollowupList = ref(false)
const inboxSummary = ref<string>('')
const isLoadingInboxSummary = ref(false)

// ─── 보낸메일함 분류 (LLM 기반) ─────────────────────────────
const sentClassifiedList = ref<SentClassifiedItem[]>([])
const sentClassifiedTotalCount = ref(0)
const sentClassifiedTabCounts = ref<{ all: number; pending: number; done: number }>({ all: 0, pending: 0, done: 0 })
const sentTopRecipients = ref<SentTopRecipient[]>([])
const sentWeeklyStats = ref<SentWeeklyStats>({
  avgReplyDays: 0,
  prevAvgReplyDays: 0,
  replyRate: 0,
  prevReplyRate: 0,
  pendingCount: 0,
  doneCount: 0,
})
const isLoadingSentClassified = ref(false)
const isLoadingSentSidebar = ref(false)

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

  // ─── 메일 동기화 ─────────────────────────────────────────
  const handleMailSync = async (options?: { silent?: boolean }) => {
    isLoadingSync.value = true
    try {
      const res = await fetchMailSync()
      if (res.result === 'SUCCESS' && !options?.silent) {
        openToast({ message: `메일 동기화가 완료되었습니다. (${res.syncedCount}건)` })
      }
    } catch {
      if (!options?.silent) {
        openToast({ message: '메일 동기화에 실패했습니다.', type: 'error' })
      }
    } finally {
      isLoadingSync.value = false
    }
  }

  // ─── KPI 조회 ─────────────────────────────────────────────
  const handleFetchMailKpi = async () => {
    isLoadingKpi.value = true
    try {
      const res = await fetchMailKpi()
      kpi.value = res.kpi ?? {
        totalCount: res.totalCount ?? 0,
        replyRequiredCount: res.replyRequiredCount ?? 0,
        urgentCount: res.urgentCount ?? 0,
        todayDueCount: res.todayDueCount ?? 0,
      }
    } catch {
      openToast({ message: 'KPI 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingKpi.value = false
    }
  }

  // ─── 필터 코드 목록 조회 (공통코드 API 사용) ─────────────
  // ML000001=메일목적, ML000002=필요조치, ML000003=긴급도, ML000004=중요도, ML000008=업무영역
  const handleFetchWorkCategories = async () => {
    try {
      const toOptions = (items: import('~/types/codes').CodeItem[]): WorkCategory[] =>
        items.filter((c) => c.useYn === 'Y').map((c) => ({ cd: c.codeId, nm: c.codeNm }))

      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetchCodes('ML000001'),
        fetchCodes('ML000002'),
        fetchCodes('ML000003'),
        fetchCodes('ML000004'),
        fetchCodes('ML000008'),
      ])
      purposeOptions.value = toOptions(r1.dataList ?? [])
      actionOptions.value = toOptions(r2.dataList ?? [])
      urgencyOptions.value = toOptions(r3.dataList ?? [])
      importanceOptions.value = toOptions(r4.dataList ?? [])
      workCategories.value = toOptions(r5.dataList ?? [])
    } catch {
      openToast({ message: '필터 코드 목록 조회에 실패했습니다.', type: 'error' })
    }
  }

  // ─── AI 분류된 받은메일함 조회 ───────────────────────────
  const handleFetchInboxClassified = async (params: ClassifiedMailListParams) => {
    isLoadingClassified.value = true
    try {
      const res = await fetchInboxClassified(params)
      classifiedMails.value = res.list ?? []
      classifiedTotalCount.value = res.totalCount ?? 0
      classifiedTabCounts.value = res.tabCounts ?? { all: 0, action: 0, reply: 0 }
    } catch {
      openToast({ message: '분류된 메일 목록 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingClassified.value = false
    }
  }

  // ─── 상세 응답(mail + analysis) → ClassifiedMail 병합 ─────
  const normalizeMailDate = (value: string | number | null | undefined): string | null => {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'number') return new Date(value).toISOString()
    return value
  }

  const resolveCodeName = (options: WorkCategory[], cd?: string) => {
    if (!cd) return ''
    return options.find((o) => o.cd === cd)?.nm ?? ''
  }

  const mergeMailDetail = (
    mail: MailDetailMail,
    analysis: MailAnalysis | null | undefined,
    fallback?: ClassifiedMail | null,
  ): ClassifiedMail => {
    const mailPurposeCd = analysis?.mailPurposeCd ?? fallback?.mailPurposeCd ?? ''
    const actionRequiredCd = analysis?.actionRequiredCd ?? fallback?.actionRequiredCd ?? ''
    const urgencyCd = analysis?.urgencyCd ?? fallback?.urgencyCd ?? ''
    const importanceCd = analysis?.importanceCd ?? fallback?.importanceCd ?? ''
    const workCategoryCd = analysis?.workCategoryCd ?? fallback?.workCategoryCd ?? ''

    return {
      mailId: mail.mailId,
      subject: mail.subject,
      fromAddr: mail.fromAddr,
      fromName: mail.fromName,
      mailDt: normalizeMailDate(mail.mailDt) ?? fallback?.mailDt ?? null,
      bodyText: mail.bodyText ?? fallback?.bodyText ?? '',
      folderCd: mail.folderCd ?? fallback?.folderCd ?? '',
      summary: analysis?.summary ?? fallback?.summary ?? '',
      actionCompleteYn: analysis?.actionCompleteYn ?? fallback?.actionCompleteYn ?? 'N',
      dueDt: normalizeMailDate(analysis?.dueDt) ?? fallback?.dueDt ?? null,
      mailPurposeCd,
      mailPurposeNm: resolveCodeName(purposeOptions.value, mailPurposeCd) || fallback?.mailPurposeNm || '',
      actionRequiredCd,
      actionRequiredNm: resolveCodeName(actionOptions.value, actionRequiredCd) || fallback?.actionRequiredNm || '',
      urgencyCd,
      urgencyNm: resolveCodeName(urgencyOptions.value, urgencyCd) || fallback?.urgencyNm || '',
      importanceCd,
      importanceNm: resolveCodeName(importanceOptions.value, importanceCd) || fallback?.importanceNm || '',
      workCategoryCd,
      workCategoryNm: resolveCodeName(workCategories.value, workCategoryCd) || fallback?.workCategoryNm || '',
    }
  }

  // ─── 메일 상세 조회 ───────────────────────────────────────
  const handleFetchMailDetail = async (mailId: string, fallbackMail?: ClassifiedMail) => {
    const fromList = fallbackMail ?? classifiedMails.value.find((m) => m.mailId === mailId) ?? null
    if (fromList) {
      selectedMail.value = fromList
    }

    try {
      const res = await fetchMailDetail(mailId)
      if (res.mail) {
        selectedMail.value = mergeMailDetail(res.mail, res.analysis, fromList)
      }
    } catch {
      if (!selectedMail.value) {
        openToast({ message: '메일 상세 조회에 실패했습니다.', type: 'error' })
      }
    }
  }

  // ─── AI 회신 초안 생성 ────────────────────────────────────
  const handleFetchReplyDraft = async (mailId: string): Promise<string> => {
    try {
      const res = await fetchReplyDraft({ mailId })
      return res.draftContent ?? res.draft ?? ''
    } catch {
      openToast({ message: '회신 초안 생성에 실패했습니다.', type: 'error' })
      return ''
    }
  }

  // ─── 조치 완료 토글 ───────────────────────────────────────
  const handleToggleActionComplete = async (mailId: string, currentYn: string) => {
    const newYn = currentYn === 'Y' ? 'N' : 'Y'
    try {
      await fetchActionComplete({ mailId, actionCompleteYn: newYn })
      // 목록에서 해당 메일 상태 업데이트
      const idx = classifiedMails.value.findIndex((m) => m.mailId === mailId)
      if (idx !== -1) {
        classifiedMails.value[idx] = { ...classifiedMails.value[idx], actionCompleteYn: newYn }
      }
      // 선택된 메일도 업데이트
      if (selectedMail.value?.mailId === mailId) {
        selectedMail.value = { ...selectedMail.value, actionCompleteYn: newYn }
      }
    } catch {
      openToast({ message: '조치 완료 상태 변경에 실패했습니다.', type: 'error' })
    }
  }

  // ─── 팔로업 DB 등록 ───────────────────────────────────────
  const handleFollowupRegister = async (req: FollowupRegisterRequest) => {
    try {
      await fetchFollowupRegister(req)
      openToast({ message: '팔로업이 등록되었습니다.' })
    } catch {
      openToast({ message: '팔로업 등록에 실패했습니다.', type: 'error' })
    }
  }

  // ─── 팔로업 DB 목록 조회 ──────────────────────────────────
  const handleFetchFollowupList = async () => {
    isLoadingFollowupList.value = true
    try {
      const res = await fetchFollowupList()
      followupDbList.value = res.list ?? []
    } catch {
      openToast({ message: '팔로업 목록 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingFollowupList.value = false
    }
  }

  // ─── selectedMail 직접 설정 ───────────────────────────────
  const setSelectedMail = (mail: ClassifiedMail | null) => {
    selectedMail.value = mail
  }

  // ─── 현재 필터 조건 메일 전체 AI 요약 ────────────────────
  const handleFetchInboxSummary = async (params: ClassifiedMailListParams) => {
    isLoadingInboxSummary.value = true
    inboxSummary.value = ''
    try {
      const res = await fetchInboxSummary(params)
      inboxSummary.value = res.summary ?? ''
    } catch {
      // 요약 실패는 조용히 처리 (UX 방해 안 함)
    } finally {
      isLoadingInboxSummary.value = false
    }
  }

  // ─── 날짜 범위 동기화 (DB 없는 것만 IMAP → AI 분류) ─────────
  const handleSyncRange = async (startDate: string, endDate: string) => {
    isLoadingSync.value = true
    try {
      const res = await fetchSyncRange(startDate, endDate)
      if (res.result === 'SUCCESS') {
        openToast({ message: `메일 동기화가 완료되었습니다. (${res.newCount}건)` })
      }
    } catch {
      // 백그라운드 동기화 실패는 조용히 처리
    }
  }

  // ─── 보낸메일함 분류 목록 조회 ────────────────────────────
  const handleFetchSentClassified = async (params: SentClassifiedListParams) => {
    isLoadingSentClassified.value = true
    try {
      const res = await fetchSentClassified(params)
      sentClassifiedList.value = res.list ?? []
      sentClassifiedTotalCount.value = res.totalCount ?? 0
      sentClassifiedTabCounts.value = res.tabCounts ?? { all: 0, pending: 0, done: 0 }
    } catch {
      openToast({ message: '보낸메일함 조회에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingSentClassified.value = false
    }
  }

  // ─── 사이드바 데이터 (상위수신자 + 주간통계) 병렬 조회 ────
  const handleFetchSentSidebar = async (startDate?: string, endDate?: string) => {
    isLoadingSentSidebar.value = true
    try {
      const [recipientsRes, statsRes] = await Promise.all([
        fetchSentTopRecipients(startDate, endDate),
        fetchSentWeeklyStats(),
      ])
      sentTopRecipients.value = recipientsRes.list ?? []
      sentWeeklyStats.value = {
        avgReplyDays: statsRes.avgReplyDays ?? 0,
        prevAvgReplyDays: statsRes.prevAvgReplyDays ?? 0,
        replyRate: statsRes.replyRate ?? 0,
        prevReplyRate: statsRes.prevReplyRate ?? 0,
        pendingCount: statsRes.pendingCount ?? 0,
        doneCount: statsRes.doneCount ?? 0,
      }
    } catch {
      // 사이드바 실패는 조용히 처리
    } finally {
      isLoadingSentSidebar.value = false
    }
  }

  // ─── 팔로업 상태 업데이트 ─────────────────────────────────
  const handleFollowupStatusUpdate = async (req: FollowupStatusUpdateRequest) => {
    try {
      await fetchFollowupStatusUpdate(req)
      await handleFetchFollowupList()
    } catch {
      openToast({ message: '팔로업 상태 변경에 실패했습니다.', type: 'error' })
    }
  }

  return {
    // 기존 상태
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
    // 신규 상태
    kpi,
    classifiedMails,
    classifiedTotalCount,
    classifiedTabCounts,
    selectedMail,
    workCategories,
    purposeOptions,
    actionOptions,
    urgencyOptions,
    importanceOptions,
    isLoadingKpi,
    isLoadingClassified,
    isLoadingSync,
    followupDbList,
    isLoadingFollowupList,
    inboxSummary,
    isLoadingInboxSummary,
    // 기존 액션
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
    // 신규 액션
    handleMailSync,
    handleFetchMailKpi,
    handleFetchWorkCategories,
    handleFetchInboxClassified,
    handleFetchMailDetail,
    handleFetchReplyDraft,
    handleToggleActionComplete,
    handleFollowupRegister,
    handleFetchFollowupList,
    handleFollowupStatusUpdate,
    setSelectedMail,
    handleFetchInboxSummary,
    handleSyncRange,
    // 보낸메일함 분류
    sentClassifiedList,
    sentClassifiedTotalCount,
    sentClassifiedTabCounts,
    sentTopRecipients,
    sentWeeklyStats,
    isLoadingSentClassified,
    isLoadingSentSidebar,
    handleFetchSentClassified,
    handleFetchSentSidebar,
  }
}

<template>
  <div class="mail-page wide-center">
    <!-- 페이지 헤더 -->
    <div class="mail-page-header">
      <div class="mail-page-header-left">
        <div class="mail-page-header-icon">
          <i class="icon-meeting-mail size-24" />
        </div>
        <div>
          <h1 class="mail-page-title">메일 에이전트</h1>
          <p class="mail-page-subtitle">AI가 분류·분석한 받은메일함</p>
        </div>
      </div>

      <div class="mail-page-header-actions">
        <div class="mail-date-range-wrap">
          <UiDatePicker
            v-model="startDateFilter"
            size="sm"
            :min-value="startMinValue"
            :max-value="startMaxValue"
          />
          <span class="mail-date-range-tilde">~</span>
          <UiDatePicker
            v-model="endDateFilter"
            size="sm"
            :min-value="endMinValue"
            :max-value="endMaxValue"
          />
        </div>

        <div class="mail-sync-btn-wrap">
          <UiButton
            variant="outline"
            size="sm"
            :disabled="
              isRefreshing || isLoadingClassified || isLoadingKpi || isLoadingSentClassified || isLoadingSentSidebar
            "
            @click="onRefreshClick"
          >
            <template #icon-left>
              <i
                class="icon-refresh size-16"
                :class="{
                  'is-spinning':
                    isRefreshing ||
                    isLoadingClassified ||
                    isLoadingKpi ||
                    isLoadingSentClassified ||
                    isLoadingSentSidebar,
                }"
              />
            </template>
            메일 동기화
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="mailTabItems"
      class="mail-page-tab"
    />

    <!-- 탭 1: 받은 메일함 -->
    <div
      v-show="activeTab === 'inbox'"
      class="mail-tab-content"
    >
      <!-- KPI 행 -->
      <MailKpiPanel
        :kpi="kpi"
        :is-loading="isLoadingKpi"
      />

      <!-- 작업 영역: 테이블 + 사이드 패널 -->
      <div class="mail-workzone">
        <!-- 좌측: 분류된 받은메일함 테이블 -->
        <MailInboxPanel
          :is-loading="isLoadingClassified"
          :mails="classifiedMails"
          :total-count="classifiedTotalCount"
          :tab-counts="classifiedTabCounts"
          :work-categories="workCategories"
          :purpose-options="purposeOptions"
          :action-options="actionOptions"
          :urgency-options="urgencyOptions"
          :importance-options="importanceOptions"
          @detail="onMailDetail"
          @analysis="onMailAnalysis"
          @search="onSearch"
          @tab-change="onSubTabChange"
        />

        <!-- 우측: AI 요약 패널 + 채팅 -->
        <div
          class="mail-side-panel"
          :class="{ 'is-chat-expanded': isAnalysisCollapsed }"
        >
          <MailAnalysisPanel
            :summary="inboxSummary"
            :is-loading="isLoadingInboxSummary"
            :collapsed="isAnalysisCollapsed"
            @toggle-analysis="onToggleAnalysisPanel"
            @expand="isAnalysisCollapsed = false"
          />
          <MailChatPanel
            ref="chatPanelRef"
            :mails="adaptedMailsForChat"
            :is-analysis-collapsed="isAnalysisCollapsed"
            @toggle-analysis="onToggleAnalysisPanel"
          />
        </div>
      </div>
    </div>

    <!-- 탭 2: 보낸 메일함 · 팔로업 트래커 -->
    <div
      v-show="activeTab === 'followup'"
      class="mail-tab-content"
    >
      <div class="mail-followup-grid">
        <!-- 좌측: 보낸메일함 분류 목록 -->
        <MailSentPanel
          :is-loading="isLoadingSentClassified"
          :mails="sentClassifiedList"
          :tab-counts="sentClassifiedTabCounts"
          :selected-tab="currentSentTab"
          @tab-change="onSentTabChange"
          @detail="onSentMailDetail"
          @followup-changed="onFollowupChanged"
        />

        <!-- 우측: 팔로업 사이드바 -->
        <MailFollowupPanel
          :is-loading="isLoadingSentSidebar"
          :top-recipients="sentTopRecipients"
          :pending-mails="sentClassifiedList"
        />
      </div>
    </div>

    <!-- 메일 로그인 모달 -->
    <MailLoginModal
      :is-open="isLoginModalOpen"
      @close="closeLoginModal"
      @success="onLoginSuccess"
    />

    <!-- 메일 상세 모달 -->
    <MailDetailModal
      v-if="selectedMail"
      :is-open="isDetailModalOpen"
      :subject="selectedMail.subject"
      sender-label="발신자"
      :sender-name="selectedMail.fromName || selectedMail.fromAddr"
      :sender-email="parseSenderEmail(selectedMail.fromAddr)"
      date-label="수신일"
      :date="toModalDate(selectedMail.mailDt)"
      :body="selectedMail.bodyText"
      @close="isDetailModalOpen = false"
    />

    <!-- 보낸 메일 상세 모달 -->
    <MailDetailModal
      v-if="selectedSentMail"
      :is-open="isSentDetailModalOpen"
      :subject="selectedSentMail.subject"
      sender-label="수신자"
      :sender-name="selectedSentMail.toName || selectedSentMail.toAddr"
      :sender-email="parseSenderEmail(selectedSentMail.toAddr)"
      date-label="발송일"
      :date="toModalDate(selectedSentMail.mailDt)"
      :body="sentDetailBody"
      @close="isSentDetailModalOpen = false"
    />

    <!-- AI 분석 모달 -->
    <MailAnalysisModal
      :is-open="isAnalysisModalOpen"
      :mail="selectedMail"
      @close="isAnalysisModalOpen = false"
      @reply-draft="onAnalysisReplyDraft"
      @toggle-complete="onToggleComplete"
    />

    <!-- 회신 초안 모달 -->
    <UiModal
      :is-open="isReplyDraftModalOpen"
      position="center"
      :show-close="true"
      :show-overlay="true"
      max-width="600px"
      @close="isReplyDraftModalOpen = false"
    >
      <template #header>
        <div class="mail-draft-modal-header">
          <h2 class="mail-detail-modal-title">AI 회신 초안</h2>
          <button
            class="btn btn-modal-close"
            @click="isReplyDraftModalOpen = false"
          >
            <i class="icon icon-close-gray size-20" />
          </button>
        </div>
      </template>

      <div class="mail-draft-modal-body">
        <div
          v-if="isReplyDraftLoading"
          class="mail-draft-loading"
        >
          <div class="mail-briefing-skeleton">
            <span
              v-for="i in 6"
              :key="i"
              class="mail-skeleton mail-skeleton-line"
              :style="{ width: i % 3 === 0 ? '70%' : '100%' }"
            />
          </div>
        </div>
        <p
          v-else-if="replyDraftContent"
          class="mail-draft-content"
        >
          {{ replyDraftContent }}
        </p>
        <UiEmpty
          v-else
          title="초안을 생성할 수 없습니다"
        />

        <div
          v-if="replyDraftContent && !isReplyDraftLoading"
          class="mail-draft-modal-footer"
        >
          <p class="mail-draft-copy-hint">
            <i class="icon-info size-14" />
            바로가기 클릭 시 내용이 클립보드에 자동 복사됩니다. 메일 작성창에서 Ctrl+V로 붙여넣기 해주세요.
          </p>
          <UiButton
            variant="primary"
            size="lg"
            @click="onOpenOfficeMail"
          >
            <template #icon-left>
              <i class="icon-link-agent size-16" />
            </template>
            바로가기
          </UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today, toCalendarDate, toCalendarDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useMailStore } from '~/composables/mail/useMailStore'
import { openToast } from '~/composables/useToast'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import MailKpiPanel from '~/components/mail/MailKpiPanel.vue'
import MailInboxPanel from '~/components/mail/MailInboxPanel.vue'
import MailAnalysisPanel from '~/components/mail/MailAnalysisPanel.vue'
import MailAnalysisModal from '~/components/mail/MailAnalysisModal.vue'
import MailDetailModal from '~/components/mail/MailDetailModal.vue'
import MailChatPanel from '~/components/mail/MailChatPanel.vue'
import MailLoginModal from '~/components/mail/MailLoginModal.vue'
import MailSentPanel from '~/components/mail/MailSentPanel.vue'
import MailFollowupPanel from '~/components/mail/MailFollowupPanel.vue'
import type { ClassifiedMail, ClassifiedMailListParams, SentClassifiedItem } from '~/types/mail'

definePageMeta({ layout: 'default' })

const {
  // 인증
  isLoginModalOpen,
  openLoginModal,
  closeLoginModal,
  checkMailAuth,
  // 받은메일함 상태
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
  inboxUidValidity,
  isLoadingClassified,
  inboxSummary,
  isLoadingInboxSummary,
  // 받은메일함 액션
  handleMailSync,
  handleFetchMailKpi,
  handleFetchWorkCategories,
  handleFetchInboxClassified,
  handleFetchInboxSummary,
  handleSyncRange,
  handleFetchMailDetail,
  handleFetchMailBodyText,
  handleFetchReplyDraft,
  handleToggleActionComplete,
  setSelectedMail,
  // 보낸메일함 상태
  sentClassifiedList,
  sentClassifiedTabCounts,
  sentTopRecipients,
  isLoadingSentClassified,
  isLoadingSentSidebar,
  // 보낸메일함 액션
  handleFetchSentClassified,
  handleFetchSentSidebar,
} = useMailStore()

const chatPanelRef = ref<InstanceType<typeof MailChatPanel>>()
const isAnalysisCollapsed = ref(false)

const startDateFilter = ref<DateValue | undefined>()
const endDateFilter = ref<DateValue | undefined>()
const isFilterWatcherReady = ref(false)
const isRefreshing = ref(false)
const isInitializingPage = ref(false)
const hasInitializedPage = ref(false)
const activeTab = ref<'inbox' | 'followup'>('inbox')

// 모달 상태
const isDetailModalOpen = ref(false)
const isSentDetailModalOpen = ref(false)
const selectedSentMail = ref<SentClassifiedItem | null>(null)
const sentDetailBody = ref('')
const isAnalysisModalOpen = ref(false)
const isReplyDraftModalOpen = ref(false)
const isReplyDraftLoading = ref(false)
const replyDraftContent = ref('')

const OFFICE_MAIL_BASE_URL = 'https://office.ispark.kr/#/UD/UDA/UDA0000'

const currentSentTab = ref<'all' | 'pending' | 'done'>('all')

const mailTabItems = computed(() => [
  { label: '받은 메일함', value: 'inbox' },
  {
    label:
      sentClassifiedTabCounts.value.pending > 0
        ? `보낸 메일함 · 팔로업 트래커 (${sentClassifiedTabCounts.value.pending})`
        : '보낸 메일함 · 팔로업 트래커',
    value: 'followup',
  },
])

// ─── ClassifiedMail → Mail 어댑터 (MailChatPanel용) ──────
const adaptedMailsForChat = computed(() =>
  classifiedMails.value.map((m) => ({
    subject: m.subject,
    from: m.fromAddr,
    fromName: m.fromName,
    receivedDate: m.mailDt,
    body: m.bodyText,
    isRead: true,
  })),
)

// ─── 날짜 범위 ────────────────────────────────────────────
const toYyyyMmDd = (value: DateValue) => {
  const { year, month, day } = toCalendarDateTime(value)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const shiftMonth = (value: DateValue, monthOffset: number) => {
  const base = toCalendarDate(toCalendarDateTime(value))
  return monthOffset >= 0 ? base.add({ months: monthOffset }) : base.subtract({ months: Math.abs(monthOffset) })
}

const startMinValue = computed(() => (endDateFilter.value ? shiftMonth(endDateFilter.value, -1) : undefined))
const startMaxValue = computed(() => endDateFilter.value ?? undefined)
const endMinValue = computed(() => startDateFilter.value ?? undefined)
const endMaxValue = computed(() => (startDateFilter.value ? shiftMonth(startDateFilter.value, 1) : undefined))

const getDateRangeParams = () => {
  if (!startDateFilter.value || !endDateFilter.value) return null
  return {
    startDate: toYyyyMmDd(startDateFilter.value),
    endDate: toYyyyMmDd(endDateFilter.value),
  }
}

const isInvalidDateRange = computed(() => {
  const start = startDateFilter.value
  const end = endDateFilter.value
  if (!start || !end) return false
  return toCalendarDate(toCalendarDateTime(start)).compare(toCalendarDate(toCalendarDateTime(end))) > 0
})

const isOverOneMonthRange = computed(() => {
  const start = startDateFilter.value
  const end = endDateFilter.value
  if (!start || !end) return false
  return toCalendarDate(toCalendarDateTime(end)).compare(toCalendarDate(toCalendarDateTime(shiftMonth(start, 1)))) > 0
})

// ─── 기본 분류 메일함 조회 파라미터 ──────────────────────
const buildDefaultClassifiedParams = (overrides: Partial<ClassifiedMailListParams> = {}): ClassifiedMailListParams => ({
  tabType: 'all',
  searchField: 'subject',
  searchKeyword: '',
  purposeCds: [],
  actionCds: [],
  urgencyCds: [],
  importanceCds: [],
  categoryCds: [],
  pageNum: 1,
  pageSize: 50,
  startDate: startDateFilter.value ? toYyyyMmDd(startDateFilter.value) : undefined,
  endDate: endDateFilter.value ? toYyyyMmDd(endDateFilter.value) : undefined,
  ...overrides,
})

// ─── 받은메일함 + AI 요약 병렬 조회 헬퍼 ────────────────
const doFetchInbox = async (params: ClassifiedMailListParams) => {
  await Promise.all([handleFetchInboxClassified(params), handleFetchInboxSummary(params)])
}

// ─── 조회 ─────────────────────────────────────────────────
const doRefresh = async () => {
  const params = getDateRangeParams()
  if (!params) return
  if (isInvalidDateRange.value) {
    openToast({ message: '시작일이 종료일보다 늦습니다. 날짜를 다시 선택해 주세요.', type: 'warning' })
    return
  }
  if (isOverOneMonthRange.value) {
    openToast({ message: '조회 기간은 최대 1개월까지 선택할 수 있습니다.', type: 'warning' })
    return
  }
  if (isRefreshing.value) return

  isRefreshing.value = true
  openLoading({ text: '메일을 동기화하는 중...' })
  try {
    if (activeTab.value === 'followup') {
      await handleSyncRange(params.startDate, params.endDate)
      await Promise.all([
        handleFetchSentClassified({
          tabType: currentSentTab.value,
          pageNum: 1,
          pageSize: 50,
          startDate: params.startDate,
          endDate: params.endDate,
        }),
        handleFetchSentSidebar(params.startDate, params.endDate),
      ])
    } else {
      await handleSyncRange(params.startDate, params.endDate)
      await Promise.all([
        doFetchInbox(buildDefaultClassifiedParams()),
        handleFetchMailKpi(params.startDate, params.endDate),
      ])
    }
  } finally {
    isRefreshing.value = false
    closeLoading()
  }
}

const onRefreshClick = async () => {
  const authed = await checkMailAuth()
  if (!authed) {
    openLoginModal()
    return
  }
  chatPanelRef.value?.resetChatHistory()
  await doRefresh()
}

const onToggleAnalysisPanel = () => {
  isAnalysisCollapsed.value = !isAnalysisCollapsed.value
}

// ─── 메일 상세 보기 ───────────────────────────────────────
const onMailDetail = async (mail: ClassifiedMail) => {
  setSelectedMail(mail)
  isDetailModalOpen.value = true
  // 전체 본문을 위해 상세 조회 (백그라운드)
  void handleFetchMailDetail(mail.mailId, mail)
}

const onSentMailDetail = async (mail: SentClassifiedItem) => {
  selectedSentMail.value = mail
  sentDetailBody.value = ''
  isSentDetailModalOpen.value = true
  sentDetailBody.value = await handleFetchMailBodyText(mail.mailId)
}

// ─── AI 분석 보기 ─────────────────────────────────────────
const onMailAnalysis = (mail: ClassifiedMail) => {
  setSelectedMail(mail)
  isAnalysisModalOpen.value = true
}

// ─── 검색 ─────────────────────────────────────────────────
const onSearch = async (params: ClassifiedMailListParams) => {
  await doFetchInbox(params)
}

// ─── 서브탭 변경 ──────────────────────────────────────────
const onSubTabChange = async (tab: 'all' | 'action' | 'reply') => {
  await doFetchInbox(buildDefaultClassifiedParams({ tabType: tab }))
}

// ─── 회신 초안 (AI 분석 모달 → 회신 초안 모달) ──────────
const onAnalysisReplyDraft = async () => {
  isAnalysisModalOpen.value = false
  if (!selectedMail.value) return
  isReplyDraftModalOpen.value = true
  isReplyDraftLoading.value = true
  replyDraftContent.value = ''
  replyDraftContent.value = await handleFetchReplyDraft(selectedMail.value.mailId)
  isReplyDraftLoading.value = false
}

const onOpenOfficeMail = async () => {
  if (!selectedMail.value) {
    window.open(OFFICE_MAIL_BASE_URL, '_blank', 'noopener,noreferrer')
    return
  }

  const mail = selectedMail.value
  const fromEmail = parseSenderEmail(mail.fromAddr)
  const params = new URLSearchParams({
    specialLnb: 'Y',
    moduleCode: 'UD',
    menuCode: 'UDA',
    pageCode: 'UDA0140',
    boxnameSeq: String(inboxUidValidity.value ?? '511'),
    fromFlag: 'false',
    mailKind: 're',
    mailTo: fromEmail,
    mbox: 'INBOX',
    popType: 'N',
    uid: mail.imapUid,
  })

  if (replyDraftContent.value) {
    const lines = replyDraftContent.value.split('\n')
    let startIdx = 0
    if (lines[0]?.startsWith('제목:')) {
      startIdx = 1
      while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++
    }
    const bodyOnly = lines.slice(startIdx).join('\n').trim()
    try {
      await copyToClipboard(bodyOnly)
    } catch {
      // 클립보드 실패 시 무시 (안내 문구가 이미 표시되어 있음)
    }
  }

  window.open(`${OFFICE_MAIL_BASE_URL}?${params.toString()}`, '_blank', 'noopener,noreferrer')
}

// ─── 조치 완료 토글 ───────────────────────────────────────
const onToggleComplete = async (mailId: string, currentYn: string) => {
  await handleToggleActionComplete(mailId, currentYn)
}

// ─── 보낸메일함 서브탭 변경 ───────────────────────────────
const onSentTabChange = async (tab: 'all' | 'pending' | 'done') => {
  currentSentTab.value = tab
  const dateRange = getDateRangeParams()
  await handleFetchSentClassified({
    tabType: tab,
    pageNum: 1,
    pageSize: 50,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  })
}

// ─── 팔로업 사이드바 이벤트 ───────────────────────────────
const onViewPending = async () => {
  currentSentTab.value = 'pending'
  const dateRange = getDateRangeParams()
  await handleFetchSentClassified({
    tabType: 'pending',
    pageNum: 1,
    pageSize: 50,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  })
}

// 팔로업 등록/해제 후 목록 + 사이드바 리프레시
const onFollowupChanged = async () => {
  const dateRange = getDateRangeParams()
  await Promise.all([
    handleFetchSentClassified({
      tabType: currentSentTab.value,
      pageNum: 1,
      pageSize: 50,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
    }),
    handleFetchSentSidebar(dateRange?.startDate, dateRange?.endDate),
  ])
}

// ─── 로그인 성공 콜백 ─────────────────────────────────────
const onLoginSuccess = async () => {
  closeLoginModal()
  await loadMailData()
}

// ─── 모달 헬퍼 ───────────────────────────────────────────
const parseSenderEmail = (fromAddr: string) => {
  const match = fromAddr.match(/<([^>]+)>/)
  if (match) return match[1]
  return fromAddr.includes('@') ? fromAddr : ''
}

const toModalDate = (value: string | number | null) => {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// ─── 데이터 로드 (인증 후 호출) ───────────────────────────
const loadMailData = async () => {
  // 기본 날짜 범위 설정
  const rangeEnd = today(getLocalTimeZone())
  startDateFilter.value = rangeEnd.subtract({ days: 7 })
  endDateFilter.value = rangeEnd
  chatPanelRef.value?.resetChatHistory()

  // 날짜 범위 파라미터
  const dateParams = {
    startDate: toYyyyMmDd(startDateFilter.value),
    endDate: toYyyyMmDd(endDateFilter.value),
  }

  // 로딩 표시
  openLoading({ text: '메일을 동기화하는 중...' })
  try {
    // 날짜 범위 내 미동기화 메일 IMAP → AI 분류 (await 후 조회해야 새 메일 반영됨)
    await handleSyncRange(dateParams.startDate, dateParams.endDate)

    // KPI + 분류 메일함 + AI 요약 + 업무카테고리 병렬 조회
    await Promise.all([
      handleFetchMailKpi(dateParams.startDate, dateParams.endDate),
      doFetchInbox(buildDefaultClassifiedParams()),
      handleFetchWorkCategories(),
    ])

    // 보낸메일함 분류 + 사이드바
    await Promise.all([
      handleFetchSentClassified({
        tabType: 'all',
        pageNum: 1,
        pageSize: 50,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      }),
      handleFetchSentSidebar(dateParams.startDate, dateParams.endDate),
    ])

    isFilterWatcherReady.value = true
    hasInitializedPage.value = true
  } finally {
    closeLoading()
  }
}

// ─── 초기화 ───────────────────────────────────────────────
const handleInitializeMailPage = async () => {
  if (isInitializingPage.value) return
  isInitializingPage.value = true

  try {
    const authed = await checkMailAuth()
    if (!authed) {
      openLoginModal()
      return
    }
    await loadMailData()
  } finally {
    isInitializingPage.value = false
  }
}

onMounted(() => {
  void handleInitializeMailPage()
})

onActivated(() => {
  if (hasInitializedPage.value) return
  void handleInitializeMailPage()
})

watch(
  () => [startDateFilter.value, endDateFilter.value],
  async () => {
    if (!isFilterWatcherReady.value) return
    if (!startDateFilter.value || !endDateFilter.value) return
    if (isInvalidDateRange.value || isOverOneMonthRange.value) return
    chatPanelRef.value?.resetChatHistory()
    await doRefresh()
  },
)
</script>

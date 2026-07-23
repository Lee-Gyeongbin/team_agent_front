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

        <button
          class="btn btn-outline mail-refresh-btn"
          :disabled="isLoadingClassified || isLoadingKpi || isLoadingFollowup"
          @click="onRefreshClick"
        >
          <i
            class="icon-refresh size-16"
            :class="{ 'is-spinning': isLoadingClassified || isLoadingKpi || isLoadingFollowup }"
          />
          새로고침
        </button>
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
          :selected-mail-id="selectedMail?.mailId ?? null"
          @select="onMailSelect"
          @search="onSearch"
          @tab-change="onSubTabChange"
        />

        <!-- 우측: 분석 패널 + 채팅 -->
        <div
          class="mail-side-panel"
          :class="{ 'is-chat-expanded': isAnalysisCollapsed }"
        >
          <MailAnalysisPanel
            :mail="selectedMail"
            :is-loading="isLoadingClassified && classifiedMails.length === 0"
            :collapsed="isAnalysisCollapsed"
            @reply-draft="onReplyDraft"
            @toggle-complete="onToggleComplete"
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
      <!-- 보낸메일함 목록 -->
      <MailSentPanel
        :is-loading="isLoadingSentList"
        :sent-mails="sentMails"
        :sent-total-count="sentTotalCount"
      />

      <MailFollowupPanel
        :is-loading="isLoadingFollowup"
        :pending="followupPending"
        :completed="followupCompleted"
        :stats="followupStats"
      />
    </div>

    <!-- 메일 로그인 모달 -->
    <MailLoginModal
      :is-open="isLoginModalOpen"
      @close="closeLoginModal"
      @success="onLoginSuccess"
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
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today, toCalendarDate, toCalendarDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useMailStore } from '~/composables/mail/useMailStore'
import { openToast } from '~/composables/useToast'
import MailKpiPanel from '~/components/mail/MailKpiPanel.vue'
import MailInboxPanel from '~/components/mail/MailInboxPanel.vue'
import MailAnalysisPanel from '~/components/mail/MailAnalysisPanel.vue'
import MailChatPanel from '~/components/mail/MailChatPanel.vue'
import MailLoginModal from '~/components/mail/MailLoginModal.vue'
import type { ClassifiedMail, ClassifiedMailListParams } from '~/types/mail'

definePageMeta({ layout: 'default' })

const {
  // 인증
  isLoginModalOpen,
  openLoginModal,
  closeLoginModal,
  checkMailAuth,
  // 기존 상태
  isLoadingSentList,
  isLoadingFollowup,
  sentMails,
  sentTotalCount,
  followupPending,
  followupCompleted,
  followupStats,
  handleFetchSentMailList,
  handleFetchFollowupStatus,
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
  // 신규 액션
  handleMailSync,
  handleFetchMailKpi,
  handleFetchWorkCategories,
  handleFetchInboxClassified,
  handleFetchMailDetail,
  handleFetchReplyDraft,
  handleToggleActionComplete,
} = useMailStore()

const chatPanelRef = ref<InstanceType<typeof MailChatPanel>>()
const isAnalysisCollapsed = ref(false)

const startDateFilter = ref<DateValue | undefined>()
const endDateFilter = ref<DateValue | undefined>()
const isFilterWatcherReady = ref(false)
const isInitializingPage = ref(false)
const hasInitializedPage = ref(false)
const activeTab = ref<'inbox' | 'followup'>('inbox')

const mailTabItems = computed(() => [
  { label: '받은 메일함', value: 'inbox' },
  {
    label:
      followupStats.value.pendingCount > 0
        ? `보낸 메일함 · 팔로업 트래커 (${followupStats.value.pendingCount})`
        : '보낸 메일함 · 팔로업 트래커',
    value: 'followup',
  },
])

// 회신 초안 모달 상태
const isReplyDraftModalOpen = ref(false)
const isReplyDraftLoading = ref(false)
const replyDraftContent = ref('')

// ─── ClassifiedMail → Mail 어댑터 (MailChatPanel용) ──────
// MailChatPanel은 Mail[] 타입을 기대하므로 ClassifiedMail을 변환
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
  ...overrides,
})

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

  if (activeTab.value === 'followup') {
    await handleFetchFollowupStatus(params)
    await handleFetchSentMailList(params)
  } else {
    await Promise.all([handleFetchMailKpi(), handleFetchInboxClassified(buildDefaultClassifiedParams())])
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

// ─── 메일 선택 ────────────────────────────────────────────
const onMailSelect = async (mail: ClassifiedMail) => {
  await handleFetchMailDetail(mail.mailId, mail)
}

// ─── 검색 ─────────────────────────────────────────────────
const onSearch = async (params: ClassifiedMailListParams) => {
  await handleFetchInboxClassified(params)
}

// ─── 서브탭 변경 ──────────────────────────────────────────
const onSubTabChange = async (tab: 'all' | 'action' | 'reply') => {
  await handleFetchInboxClassified(buildDefaultClassifiedParams({ tabType: tab }))
}

// ─── 회신 초안 ────────────────────────────────────────────
const onReplyDraft = async () => {
  if (!selectedMail.value) return
  isReplyDraftModalOpen.value = true
  isReplyDraftLoading.value = true
  replyDraftContent.value = ''
  replyDraftContent.value = await handleFetchReplyDraft(selectedMail.value.mailId)
  isReplyDraftLoading.value = false
}

// ─── 조치 완료 토글 ───────────────────────────────────────
const onToggleComplete = async (mailId: string, currentYn: string) => {
  await handleToggleActionComplete(mailId, currentYn)
}

// ─── 로그인 성공 콜백 ─────────────────────────────────────
const onLoginSuccess = async () => {
  closeLoginModal()
  await loadMailData()
}

// ─── 데이터 로드 (인증 후 호출) ───────────────────────────
const loadMailData = async () => {
  const rangeEnd = today(getLocalTimeZone())
  startDateFilter.value = rangeEnd.subtract({ days: 7 })
  endDateFilter.value = rangeEnd
  chatPanelRef.value?.resetChatHistory()

  const dateParams = {
    startDate: toYyyyMmDd(startDateFilter.value),
    endDate: toYyyyMmDd(endDateFilter.value),
  }

  openLoading()
  try {
    // 동기화는 백그라운드에서 조용히 실행 (blocking하지 않음)
    handleMailSync({ silent: true }).catch(() => {})

    // KPI + 분류 메일함 + 업무카테고리 병렬 조회
    await Promise.all([
      handleFetchMailKpi(),
      handleFetchInboxClassified(buildDefaultClassifiedParams()),
      handleFetchWorkCategories(),
    ])

    // 보낸메일함 + 팔로업
    await Promise.all([handleFetchSentMailList(dateParams), handleFetchFollowupStatus(dateParams)])

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
    // 인증 확인 → 미인증이면 로그인 모달 표시 후 종료
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

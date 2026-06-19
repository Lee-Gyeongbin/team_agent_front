<template>
  <div class="mail-page l-center">
    <!-- 페이지 헤더 -->
    <div class="mail-page-header">
      <div class="mail-page-header-left">
        <div class="mail-page-header-icon">
          <i class="icon-meeting-mail size-24" />
        </div>
        <div>
          <h1 class="mail-page-title">메일 브리핑</h1>
          <p class="mail-page-subtitle">받은메일함 AI 요약 리포트</p>
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
          :disabled="isLoadingList || isLoadingSummary || isLoadingChat || isLoadingFollowup"
          @click="onRefreshClick"
        >
          <i
            class="icon-refresh size-16"
            :class="{ 'is-spinning': isLoadingList || isLoadingSummary || isLoadingChat || isLoadingFollowup }"
          />
          새로고침
        </button>
      </div>
    </div>

    <!-- 탭 -->
    <div class="mail-tab-bar">
      <button
        class="mail-tab-btn"
        :class="{ 'is-active': activeTab === 'inbox' }"
        @click="onTabClick('inbox')"
      >
        받은 메일함
      </button>
      <button
        class="mail-tab-btn"
        :class="{ 'is-active': activeTab === 'followup' }"
        @click="onTabClick('followup')"
      >
        보낸 메일함 · 팔로업 트래커
        <span
          v-if="followupStats.pendingCount > 0"
          class="mail-tab-badge"
        >
          {{ followupStats.pendingCount }}
        </span>
      </button>
    </div>

    <!-- 탭 1: 받은 메일함 -->
    <div
      v-show="activeTab === 'inbox'"
      class="mail-tab-content"
    >
      <!-- AI 메일 브리핑 -->
      <MailBriefingPanel
        :is-loading="isLoadingSummary"
        :briefing="briefing"
      />

      <!-- 2컬럼: 액션 아이템 + 메일 AI 채팅 -->
      <div class="mail-middle-row">
        <MailActionPanel
          :is-loading="isLoadingSummary"
          :action-items="actionItems"
        />
        <MailChatPanel
          ref="chatPanelRef"
          :mails="mails"
        />
      </div>

      <!-- 받은메일함 목록 -->
      <MailInboxPanel
        :is-loading="isLoadingList"
        :mails="mails"
        :total-count="totalCount"
      />
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
  </div>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today, toCalendarDate, toCalendarDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useMailStore } from '~/composables/mail/useMailStore'
import { openToast } from '~/composables/useToast'
import MailChatPanel from '~/components/mail/MailChatPanel.vue'

definePageMeta({ layout: 'default' })

const {
  isLoadingList,
  isLoadingSentList,
  isLoadingSummary,
  isLoadingChat,
  isLoadingFollowup,
  mails,
  totalCount,
  sentMails,
  sentTotalCount,
  briefing,
  actionItems,
  followupPending,
  followupCompleted,
  followupStats,
  handleFetchMailList,
  handleFetchSentMailList,
  handleFetchMailSummary,
  handleFetchFollowupStatus,
} = useMailStore()

const chatPanelRef = ref<InstanceType<typeof MailChatPanel>>()
const startDateFilter = ref<DateValue | undefined>()
const endDateFilter = ref<DateValue | undefined>()
const isFilterWatcherReady = ref(false)
const isInitializingPage = ref(false)
const hasInitializedPage = ref(false)
const activeTab = ref<'inbox' | 'followup'>('inbox')

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
  } else {
    await handleFetchMailList(params)
    await handleFetchSentMailList(params)
    await handleFetchMailSummary()
  }
}

const onRefreshClick = async () => {
  chatPanelRef.value?.resetChatHistory()
  await doRefresh()
}

// ─── 탭 전환 ──────────────────────────────────────────────
const onTabClick = (tab: 'inbox' | 'followup') => {
  activeTab.value = tab
}

// ─── 초기화 ───────────────────────────────────────────────
const handleInitializeMailPage = async () => {
  if (isInitializingPage.value) return
  isInitializingPage.value = true

  const rangeEnd = today(getLocalTimeZone())
  startDateFilter.value = rangeEnd.subtract({ days: 7 })
  endDateFilter.value = rangeEnd
  chatPanelRef.value?.resetChatHistory()

  const params = {
    startDate: toYyyyMmDd(startDateFilter.value),
    endDate: toYyyyMmDd(endDateFilter.value),
  }

  openLoading()
  try {
    await handleFetchMailList(params)
    await handleFetchSentMailList(params)
    await handleFetchMailSummary()
    await handleFetchFollowupStatus(params)
    isFilterWatcherReady.value = true
    hasInitializedPage.value = true
  } finally {
    closeLoading()
    isInitializingPage.value = false
  }
}

onMounted(() => {
  void handleInitializeMailPage()
})

onActivated(() => {
  if (!hasInitializedPage.value) return
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

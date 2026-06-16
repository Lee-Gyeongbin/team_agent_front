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
          :disabled="isLoadingList || isLoadingSummary || isLoadingChat"
          @click="onRefreshClick"
        >
          <i
            class="icon-refresh size-16"
            :class="{ 'is-spinning': isLoadingList || isLoadingSummary || isLoadingChat }"
          />
          새로고침
        </button>
      </div>
    </div>

    <!-- 상단 전체폭: AI 메일 브리핑 -->
    <div class="mail-panel">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">AI 메일 브리핑</h2>
        <div class="mail-ai-badge">
          <i class="icon-ai size-14" />
          AI 요약
        </div>
      </div>

      <template v-if="isLoadingSummary">
        <div class="mail-briefing-skeleton">
          <span
            v-for="i in 5"
            :key="i"
            class="mail-skeleton mail-skeleton-line"
            :style="{ width: i % 2 === 0 ? '80%' : '100%' }"
          />
        </div>
      </template>

      <div
        v-else-if="briefing.length > 0"
        class="mail-briefing-text"
      >
        <ul class="mail-briefing-list">
          <li
            v-for="(line, idx) in briefing"
            :key="`briefing-${idx}`"
            class="mail-briefing-item"
          >
            {{ line }}
          </li>
        </ul>
      </div>

      <UiEmpty
        v-else
        title="브리핑 내용이 없습니다"
      />
    </div>

    <!-- 2컬럼: 액션 아이템 + 메일 컨텍스트 채팅 -->
    <div class="mail-middle-row">
      <!-- 왼쪽: 오늘의 액션 아이템 -->
      <div class="mail-panel">
        <div class="mail-panel-header">
          <h2 class="mail-panel-title">오늘의 액션 아이템</h2>
        </div>

        <template v-if="isLoadingSummary">
          <div
            v-for="i in 3"
            :key="i"
            class="mail-action-skeleton"
          >
            <span class="mail-skeleton mail-skeleton-dot" />
            <div class="mail-action-skeleton-lines">
              <span class="mail-skeleton mail-skeleton-line" />
              <span class="mail-skeleton mail-skeleton-line-sm" />
            </div>
          </div>
        </template>

        <template v-else-if="actionItems.length > 0">
          <div
            v-for="(item, idx) in actionItems"
            :key="idx"
            class="mail-action-item"
          >
            <span
              class="mail-action-dot"
              :class="`priority-${item.priority}`"
            />
            <div class="mail-action-content">
              <p class="mail-action-text">{{ item.text }}</p>
              <div class="mail-action-meta">
                <span class="mail-action-from">{{ item.from }}</span>
                <span class="mail-action-time">{{ item.time }}</span>
                <span
                  class="mail-action-badge"
                  :class="`priority-${item.priority}`"
                  >{{ priorityLabel(item.priority) }}</span
                >
              </div>
            </div>
          </div>
        </template>

        <UiEmpty
          v-else
          title="액션 아이템이 없습니다"
        />
      </div>

      <!-- 오른쪽: 메일 컨텍스트 채팅 -->
      <div class="mail-panel mail-chat-panel">
        <div class="mail-panel-header">
          <h2 class="mail-panel-title">메일 AI 채팅</h2>
          <div class="mail-ai-badge">
            <i class="icon-ai size-14" />
            메일 컨텍스트
          </div>
        </div>

        <div
          ref="chatListRef"
          class="mail-chat-log"
        >
          <ul class="mail-chat-list">
            <li
              v-for="entry in chatMessages"
              :key="entry.id"
              class="mail-chat-item"
              :class="entry.role === 'user' ? 'role-user' : 'role-assistant'"
            >
              <i
                v-if="entry.role === 'assistant'"
                class="mail-chat-avatar icon-bot size-20"
              />
              <div class="mail-chat-message-wrap">
                <p class="mail-chat-bubble">
                  {{ entry.content }}
                </p>
                <span
                  v-if="entry.role === 'user'"
                  class="mail-chat-time"
                >
                  {{ entry.timeLabel }}
                </span>
              </div>
            </li>
            <li
              v-if="isLoadingChat"
              class="mail-chat-item role-assistant"
            >
              <i class="mail-chat-avatar icon-bot size-20" />
              <div class="mail-chat-message-wrap">
                <p class="mail-chat-bubble">답변 생성 중...</p>
              </div>
            </li>
          </ul>
        </div>

        <div class="mail-chat-input-row">
          <div
            class="mail-chat-input-bar"
            :class="{ 'is-active': !!chatDraft.trim() }"
          >
            <i
              v-show="!chatDraft.trim()"
              class="icon-sparkle size-20"
            />
            <UiInput
              v-model="chatDraft"
              size="md"
              class="mail-chat-input-field"
              :spellcheck="false"
              :disabled="isLoadingChat"
              placeholder="예: 지금 당장 처리해야 할 메일이 무엇인가요?"
              @enter="onSendChat"
            />
            <UiButton
              variant="primary"
              size="md"
              icon-only
              class="btn-chat-send mail-chat-send"
              :disabled="!chatDraft.trim() || isLoadingChat"
              aria-label="전송"
              @click="onSendChat"
            >
              <template #icon-left>
                <i class="icon-send size-20" />
              </template>
            </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 받은메일함 목록 -->
    <div class="mail-panel">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">받은메일함</h2>
        <span class="mail-count-badge">{{ totalCount }}개</span>
      </div>

      <template v-if="isLoadingList">
        <div
          v-for="i in 5"
          :key="i"
          class="mail-item-skeleton"
        >
          <span class="mail-skeleton mail-skeleton-avatar" />
          <div class="mail-item-skeleton-lines">
            <span class="mail-skeleton mail-skeleton-line" />
            <span class="mail-skeleton mail-skeleton-line-sm" />
          </div>
        </div>
      </template>

      <template v-else-if="mails.length > 0">
        <div
          v-for="mail in mails"
          :key="mail.from + mail.receivedDate"
          class="mail-item"
          :class="{ 'is-unread': !mail.isRead }"
        >
          <div
            class="mail-item-avatar"
            :style="{ background: getAvatarColor(mail.fromName) }"
          >
            {{ getInitial(mail.fromName) }}
          </div>

          <div class="mail-item-content">
            <div class="mail-item-top">
              <span class="mail-item-from">{{ mail.fromName || mail.from }}</span>
              <span class="mail-item-time">{{ formatDate(mail.receivedDate) }}</span>
            </div>
            <p class="mail-item-subject">{{ mail.subject }}</p>
            <p class="mail-item-preview">{{ truncate(mail.body, 80) }}</p>
          </div>

          <span
            v-if="!mail.isRead"
            class="mail-item-unread-dot"
          />
        </div>
      </template>

      <UiEmpty
        v-else
        icon="icon-mail"
        title="받은 메일이 없습니다"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today, toCalendarDate, toCalendarDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useMailStore } from '~/composables/mail/useMailStore'
import { openToast } from '~/composables/useToast'
import type { ActionItem, Mail, MailChatHistoryItem } from '~/types/mail'

definePageMeta({ layout: 'default' })

const {
  isLoadingList,
  isLoadingSummary,
  isLoadingChat,
  mails,
  totalCount,
  briefing,
  actionItems,
  handleFetchMailList,
  handleFetchMailSummary,
  handleFetchMailChat,
} = useMailStore()

const INITIAL_CHAT_MESSAGE = `안녕하세요! 메일 내용에 대해 궁금한 게 있으시면 물어보세요.
예) 지금 당장 해야 할 일이 뭔가요? / 오늘 중요한 메일 요약해줘`

type MailChatMessage = MailChatHistoryItem & {
  id: string
  timeLabel: string
}

const chatIdSeq = ref(0)
const startDateFilter = ref<DateValue | undefined>()
const endDateFilter = ref<DateValue | undefined>()
const chatMessages = ref<MailChatMessage[]>([])
const chatDraft = ref('')
const chatListRef = ref<HTMLElement>()
const isFilterWatcherReady = ref(false)
const isInitializingPage = ref(false)
const hasInitializedPage = ref(false)

const nextChatId = () => {
  chatIdSeq.value += 1
  return `mail-chat-${chatIdSeq.value}`
}

const formatChatTime = () =>
  new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

const resetChatHistory = () => {
  chatMessages.value = [
    {
      id: nextChatId(),
      role: 'assistant',
      content: INITIAL_CHAT_MESSAGE,
      timeLabel: '',
    },
  ]
  chatDraft.value = ''
}

const toYyyyMmDd = (value: DateValue) => {
  const { year, month, day } = toCalendarDateTime(value)
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
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
  const maxEnd = shiftMonth(start, 1)
  return toCalendarDate(toCalendarDateTime(end)).compare(toCalendarDate(toCalendarDateTime(maxEnd))) > 0
})

const doRefresh = async () => {
  const params = getDateRangeParams()
  if (!params) return
  if (isInvalidDateRange.value) {
    openToast({
      message: '시작일이 종료일보다 늦습니다. 날짜를 다시 선택해 주세요.',
      type: 'warning',
    })
    return
  }
  if (isOverOneMonthRange.value) {
    openToast({
      message: '조회 기간은 최대 1개월까지 선택할 수 있습니다.',
      type: 'warning',
    })
    return
  }
  await handleFetchMailList(params)
  await handleFetchMailSummary()
}

const buildMailContext = (mailRows: Mail[]) => {
  if (!mailRows.length) return '조회된 메일이 없습니다.'
  return mailRows
    .map((mail, idx) => {
      const summary = truncate(mail.body, 200)
      const dateText = formatMailContextDate(mail.receivedDate)
      return `${idx + 1}. 제목: ${mail.subject || '-'} | 발신자: ${mail.fromName || mail.from || '-'} | 날짜: ${dateText} | 본문요약: ${summary || '-'}`
    })
    .join('\n')
}

const toChatHistoryForApi = () =>
  chatMessages.value.slice(-10).map((entry) => ({
    role: entry.role,
    content: entry.content,
  }))

const scrollChatToBottom = () => {
  nextTick(() => {
    if (!chatListRef.value) return
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
  })
}

const onSendChat = async () => {
  const message = chatDraft.value.trim()
  if (!message || isLoadingChat.value) return

  const previousHistory = toChatHistoryForApi()
  chatMessages.value.push({
    id: nextChatId(),
    role: 'user',
    content: message,
    timeLabel: formatChatTime(),
  })
  chatDraft.value = ''
  scrollChatToBottom()

  const answer = await handleFetchMailChat({
    message,
    mailContext: buildMailContext(mails.value),
    chatHistory: previousHistory,
  })

  chatMessages.value.push({
    id: nextChatId(),
    role: 'assistant',
    content: answer || '답변을 생성하지 못했습니다. 다시 시도해 주세요.',
    timeLabel: '',
  })
  scrollChatToBottom()
}

const onRefreshClick = async () => {
  resetChatHistory()
  await doRefresh()
}

watch(
  () => [startDateFilter.value, endDateFilter.value],
  async () => {
    if (!isFilterWatcherReady.value) return
    if (!startDateFilter.value || !endDateFilter.value) return
    if (isInvalidDateRange.value || isOverOneMonthRange.value) return
    resetChatHistory()
    await doRefresh()
  },
)

watch(
  () => chatMessages.value.length,
  () => {
    scrollChatToBottom()
  },
)

const handleInitializeMailPage = async () => {
  if (isInitializingPage.value) return
  isInitializingPage.value = true

  const rangeEnd = today(getLocalTimeZone())
  const rangeStart = rangeEnd.subtract({ days: 7 })
  startDateFilter.value = rangeStart
  endDateFilter.value = rangeEnd
  resetChatHistory()

  openLoading()
  try {
    await doRefresh()
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

// keep-alive로 캐시된 뒤 다시 활성화되는 경우에도 초기 조회를 재실행
onActivated(() => {
  if (!hasInitializedPage.value) return
  void handleInitializeMailPage()
})

// ─── 우선순위 라벨 ────────────────────────────────────────
const priorityLabel = (p: ActionItem['priority']) => {
  const map = { urgent: '긴급', this_week: '이번 주', normal: '일반' }
  return map[p] ?? p
}

// ─── 날짜 포맷 ────────────────────────────────────────────
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const formatMailContextDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ─── 아바타 ───────────────────────────────────────────────
const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ─── 텍스트 말줄임 ────────────────────────────────────────
const truncate = (text: string, len: number) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}
</script>

<template>
  <div class="mail-followup-wrap">
    <!-- 상단 요약 카드 3개 -->
    <div class="mail-followup-stats-row">
      <div class="mail-followup-stat-card">
        <span class="mail-followup-stat-label">답장 대기 중</span>
        <span class="mail-followup-stat-value is-danger">{{ stats.pendingCount }}</span>
      </div>
      <div class="mail-followup-stat-card">
        <span class="mail-followup-stat-label">평균 대기 기간</span>
        <span class="mail-followup-stat-value">{{ stats.avgWaitDays }}일</span>
      </div>
      <div class="mail-followup-stat-card">
        <span class="mail-followup-stat-label">이번 주 완료</span>
        <span class="mail-followup-stat-value is-success">{{ stats.completedThisWeek }}</span>
      </div>
    </div>

    <!-- 답장 대기 목록 -->
    <div class="mail-panel">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">답장 대기 목록</h2>
        <span class="mail-count-badge">{{ filteredPending.length }}건</span>
        <div class="mail-followup-filter-btns">
          <button
            class="btn btn-sm"
            :class="activeFilter === 'all' ? 'btn-primary' : 'btn-outline'"
            @click="activeFilter = 'all'"
          >
            전체
          </button>
          <button
            class="btn btn-sm"
            :class="activeFilter === 'urgent' ? 'btn-primary' : 'btn-outline'"
            @click="activeFilter = 'urgent'"
          >
            긴급
          </button>
          <button
            class="btn btn-sm"
            :class="activeFilter === 'week' ? 'btn-primary' : 'btn-outline'"
            @click="activeFilter = 'week'"
          >
            이번 주
          </button>
        </div>
      </div>

      <div class="mail-inbox-content">
        <template v-if="isLoading">
          <div
            v-for="i in 4"
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

        <template v-else-if="filteredPending.length > 0">
          <div
            v-for="item in filteredPending"
            :key="item.toEmail + item.sentDate"
            class="mail-followup-item"
            :class="elapsedAccentClass(item.daysElapsed)"
          >
            <div
              class="mail-item-avatar"
              :style="{ background: getAvatarColor(item.to) }"
            >
              {{ getInitial(item.to) }}
            </div>
            <div class="mail-item-content">
              <div class="mail-item-top">
                <span class="mail-item-from">{{ item.to }}</span>
                <span
                  class="mail-followup-elapsed-badge"
                  :class="elapsedBadgeClass(item.daysElapsed)"
                >
                  {{ item.daysElapsed }}일 경과
                </span>
              </div>
              <p class="mail-item-subject">{{ item.subject }}</p>
              <span class="mail-item-time">{{ item.sentDate }}</span>
            </div>
            <button
              class="btn btn-outline btn-sm mail-followup-draft-btn"
              :disabled="isDraftLoading && draftTarget?.toEmail === item.toEmail && draftTarget?.sentDate === item.sentDate"
              @click="openDraftModal(item)"
            >
              독촉 메일 초안
            </button>
          </div>
        </template>

        <UiEmpty
          v-else
          icon="icon-mail"
          title="답장 대기 중인 메일이 없습니다"
        />
      </div>
    </div>

    <!-- 최근 답장 완료 -->
    <div class="mail-panel">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">최근 답장 완료</h2>
        <span class="mail-count-badge">{{ completed.length }}건</span>
      </div>

      <div class="mail-inbox-content">
        <template v-if="isLoading">
          <div
            v-for="i in 3"
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

        <template v-else-if="completed.length > 0">
          <div
            v-for="item in completed"
            :key="item.toEmail + item.sentDate"
            class="mail-followup-item is-completed"
          >
            <div
              class="mail-item-avatar"
              :style="{ background: getAvatarColor(item.to) }"
            >
              {{ getInitial(item.to) }}
            </div>
            <div class="mail-item-content">
              <div class="mail-item-top">
                <span class="mail-item-from">{{ item.to }}</span>
                <span class="mail-followup-elapsed-badge is-success">완료</span>
              </div>
              <p class="mail-item-subject">{{ item.subject }}</p>
              <span class="mail-item-time">발송 {{ item.sentDate }} / 답장 {{ item.replyDate }} ({{ item.daysElapsed }}일 소요)</span>
            </div>
          </div>
        </template>

        <UiEmpty
          v-else
          title="완료된 답장이 없습니다"
        />
      </div>
    </div>

    <!-- 하단 2컬럼 -->
    <div class="mail-middle-row">
      <!-- 답장 대기 많은 상대 -->
      <div class="mail-panel">
        <div class="mail-panel-header">
          <h2 class="mail-panel-title">답장 대기 많은 상대</h2>
        </div>
        <div class="mail-followup-recipients">
          <template v-if="isLoading">
            <div
              v-for="i in 3"
              :key="i"
              class="mail-followup-recipient-skeleton"
            >
              <span class="mail-skeleton mail-skeleton-line" />
            </div>
          </template>
          <template v-else-if="topRecipients.length > 0">
            <div
              v-for="r in topRecipients"
              :key="r.toEmail"
              class="mail-followup-recipient-row"
            >
              <span class="mail-followup-recipient-name">{{ r.name }}</span>
              <div class="mail-followup-bar-wrap">
                <div
                  class="mail-followup-bar"
                  :style="{ width: `${(r.count / maxCount) * 100}%` }"
                />
              </div>
              <span class="mail-followup-recipient-count">{{ r.count }}건</span>
            </div>
          </template>
          <UiEmpty
            v-else-if="!isLoading"
            title="대기 중인 상대가 없습니다"
          />
        </div>
      </div>

      <!-- AI 인사이트 -->
      <div class="mail-panel">
        <div class="mail-panel-header">
          <h2 class="mail-panel-title">AI 인사이트</h2>
          <div class="mail-ai-badge">
            <i class="icon-ai size-14" />
            AI
          </div>
        </div>
        <div class="mail-followup-insights">
          <template v-if="isLoading">
            <div
              v-for="i in 3"
              :key="i"
              class="mail-followup-insight-skeleton"
            >
              <span class="mail-skeleton mail-skeleton-dot" />
              <span class="mail-skeleton mail-skeleton-line" />
            </div>
          </template>
          <template v-else>
            <div
              v-for="(insight, idx) in aiInsights"
              :key="idx"
              class="mail-followup-insight-row"
            >
              <span
                class="mail-followup-insight-dot"
                :class="`type-${insight.type}`"
              />
              <span class="mail-followup-insight-text">{{ insight.text }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- 독촉 메일 초안 모달 -->
  <UiModal
    :is-open="isDraftModalOpen"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="600px"
    @close="closeDraftModal"
  >
    <template #header>
      <div class="mail-draft-modal-header">
        <h2 class="mail-detail-modal-title">독촉 메일 초안</h2>
        <button
          class="btn btn-modal-close"
          @click="closeDraftModal"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <div class="mail-draft-modal-body">
      <div
        v-if="isDraftLoading"
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
        v-else-if="draftContent"
        class="mail-draft-content"
      >
        {{ draftContent }}
      </p>
      <UiEmpty
        v-else
        title="초안을 생성할 수 없습니다"
      />
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { FollowupItem, FollowupCompleted, FollowupStats } from '~/types/mail'
import { useMailStore } from '~/composables/mail/useMailStore'

const props = defineProps<{
  isLoading: boolean
  pending: FollowupItem[]
  completed: FollowupCompleted[]
  stats: FollowupStats
}>()

const { handleFetchFollowupDraft } = useMailStore()

// ─── 필터 ─────────────────────────────────────────────────
type FilterType = 'all' | 'urgent' | 'week'
const activeFilter = ref<FilterType>('all')

const filteredPending = computed(() => {
  if (activeFilter.value === 'all') return props.pending
  if (activeFilter.value === 'urgent') return props.pending.filter((i) => i.daysElapsed >= 3)
  if (activeFilter.value === 'week') return props.pending.filter((i) => i.daysElapsed >= 1 && i.daysElapsed <= 7)
  return props.pending
})

// ─── 답장 대기 많은 상대 ──────────────────────────────────
const topRecipients = computed(() => {
  const map = new Map<string, { name: string; toEmail: string; count: number }>()
  for (const item of props.pending) {
    const key = item.toEmail
    if (map.has(key)) {
      map.get(key)!.count++
    } else {
      map.set(key, { name: item.to, toEmail: item.toEmail, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5)
})

const maxCount = computed(() => Math.max(...topRecipients.value.map((r) => r.count), 1))

// ─── AI 인사이트 (데이터 기반 자동 생성) ─────────────────
const aiInsights = computed(() => {
  const s = props.stats
  const insights: { type: 'urgent' | 'warning' | 'positive'; text: string }[] = []

  if (s.pendingCount >= 5) {
    insights.push({ type: 'urgent', text: `${s.pendingCount}건의 미답장이 쌓이고 있습니다. 우선순위를 정해 빠르게 처리하세요.` })
  } else if (s.pendingCount >= 2) {
    insights.push({ type: 'warning', text: `현재 ${s.pendingCount}건의 답장을 기다리고 있습니다.` })
  } else {
    insights.push({ type: 'positive', text: '미답장 건수가 양호합니다. 잘 관리되고 있습니다.' })
  }

  if (s.avgWaitDays >= 3) {
    insights.push({ type: 'warning', text: `평균 대기 기간이 ${s.avgWaitDays}일로 길어지고 있습니다. 독촉 메일을 고려해보세요.` })
  } else if (s.avgWaitDays > 0) {
    insights.push({ type: 'positive', text: `평균 ${s.avgWaitDays}일 이내에 답장이 오고 있습니다.` })
  } else {
    insights.push({ type: 'positive', text: '대기 중인 메일에 대한 평균 응답 기간을 추적 중입니다.' })
  }

  if (s.completedThisWeek > 0) {
    insights.push({ type: 'positive', text: `이번 주 ${s.completedThisWeek}건의 답장을 받았습니다.` })
  } else {
    insights.push({ type: 'warning', text: '이번 주 아직 답장을 받은 메일이 없습니다.' })
  }

  return insights
})

// ─── 경과일 스타일 ─────────────────────────────────────────
const elapsedAccentClass = (days: number) => {
  if (days >= 4) return 'accent-danger'
  if (days >= 1) return 'accent-warning'
  return ''
}

const elapsedBadgeClass = (days: number) => {
  if (days >= 3) return 'is-danger'
  if (days >= 1) return 'is-warning'
  return ''
}

// ─── 아바타 ───────────────────────────────────────────────
const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ─── 독촉 메일 초안 모달 ──────────────────────────────────
const isDraftModalOpen = ref(false)
const isDraftLoading = ref(false)
const draftContent = ref('')
const draftTarget = ref<Pick<FollowupItem, 'toEmail' | 'sentDate'> | null>(null)

const openDraftModal = async (item: FollowupItem) => {
  isDraftModalOpen.value = true
  isDraftLoading.value = true
  draftContent.value = ''
  draftTarget.value = { toEmail: item.toEmail, sentDate: item.sentDate }
  draftContent.value = await handleFetchFollowupDraft(item.to, item.subject, item.sentDate ?? '')
  isDraftLoading.value = false
}

const closeDraftModal = () => {
  isDraftModalOpen.value = false
  draftContent.value = ''
  draftTarget.value = null
}
</script>

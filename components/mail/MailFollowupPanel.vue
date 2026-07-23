<template>
  <div class="mail-followup-sidebar">
    <!-- 답장 대기 많은 상대 -->
    <div class="mail-panel mail-followup-recipients-card">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">답장 대기 많은 상대</h2>
      </div>
      <div class="mail-followup-recipients-body">
        <template v-if="isLoading">
          <div
            v-for="i in 4"
            :key="i"
            class="mail-followup-recipient-skeleton"
          >
            <span class="mail-skeleton mail-skeleton-line-sm" />
            <span
              class="mail-skeleton mail-skeleton-bar"
              :style="{ width: `${60 + i * 8}%` }"
            />
          </div>
        </template>

        <template v-else-if="topRecipients.length > 0">
          <div
            v-for="r in topRecipients"
            :key="r.toAddr"
            class="mail-followup-recipient-row"
          >
            <span class="mail-followup-recipient-name">{{ r.toName || r.toAddr }}</span>
            <div class="mail-followup-bar-wrap">
              <div
                class="mail-followup-bar"
                :style="{ width: `${(r.pendingCount / maxPendingCount) * 100}%` }"
              />
            </div>
            <span class="mail-followup-recipient-count">{{ r.pendingCount }}건</span>
          </div>
        </template>

        <UiEmpty
          v-else
          title="답장 대기 중인 상대가 없습니다"
        />
      </div>
    </div>

    <!-- AI 인사이트 -->
    <div class="mail-panel mail-followup-insights-card">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">AI 인사이트</h2>
        <div class="mail-ai-badge">
          <i class="icon-ai size-14" />
          AI
        </div>
      </div>

      <div class="mail-followup-insights-body">
        <template v-if="isLoading">
          <div class="mail-followup-insight-skeleton is-danger">
            <span class="mail-skeleton mail-skeleton-line" />
            <span class="mail-skeleton mail-skeleton-line-sm" />
          </div>
          <div class="mail-followup-insight-skeleton is-success">
            <span class="mail-skeleton mail-skeleton-line" />
            <span class="mail-skeleton mail-skeleton-line-sm" />
          </div>
        </template>

        <template v-else>
          <!-- 팔로업 권장 카드 -->
          <div class="mail-insight-block is-danger">
            <div class="mail-insight-block-header">
              <i class="mail-insight-icon is-danger" />
              <span class="mail-insight-label">팔로업 권장</span>
            </div>
            <p class="mail-insight-desc">
              <strong>{{ overdueCount }}건</strong>의 메일이 7일 이상 답장을 기다리고 있습니다.
            </p>
            <div class="mail-insight-actions">
              <button
                class="mail-insight-chip is-danger"
                @click="emit('draft-overdue')"
              >
                재촉 메일 작성
              </button>
              <button
                class="mail-insight-chip"
                @click="emit('view-pending')"
              >
                목록 보기
              </button>
            </div>
          </div>

          <!-- 이번 주 회신 통계 카드 -->
          <div class="mail-insight-block is-success">
            <div class="mail-insight-block-header">
              <i class="mail-insight-icon is-success" />
              <span class="mail-insight-label">이번 주 회신 통계</span>
            </div>
            <div class="mail-insight-stats-row">
              <div class="mail-insight-stat">
                <span class="mail-insight-stat-label">평균 회신 소요</span>
                <div class="mail-insight-stat-value-row">
                  <span class="mail-insight-stat-value">{{ weeklyStats.avgReplyDays.toFixed(1) }}일</span>
                  <span
                    class="mail-insight-stat-delta"
                    :class="avgReplyDaysDelta <= 0 ? 'is-good' : 'is-bad'"
                  >
                    {{ avgReplyDaysDelta > 0 ? '+' : '' }}{{ avgReplyDaysDelta.toFixed(1) }}일
                  </span>
                </div>
              </div>
              <div class="mail-insight-stat">
                <span class="mail-insight-stat-label">회신율</span>
                <div class="mail-insight-stat-value-row">
                  <span class="mail-insight-stat-value">{{ weeklyStats.replyRate }}%</span>
                  <span
                    class="mail-insight-stat-delta"
                    :class="replyRateDelta >= 0 ? 'is-good' : 'is-bad'"
                  >
                    {{ replyRateDelta > 0 ? '+' : '' }}{{ replyRateDelta }}%
                  </span>
                </div>
              </div>
            </div>
            <div class="mail-insight-mini-counts">
              <span class="mail-insight-mini-count is-done">완료 {{ weeklyStats.doneCount }}건</span>
              <span class="mail-insight-mini-count is-pending">대기 {{ weeklyStats.pendingCount }}건</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SentTopRecipient, SentWeeklyStats, SentClassifiedItem } from '~/types/mail'

const props = defineProps<{
  isLoading: boolean
  topRecipients: SentTopRecipient[]
  weeklyStats: SentWeeklyStats
  pendingMails: SentClassifiedItem[]
}>()

const emit = defineEmits<{
  (e: 'draft-overdue' | 'view-pending'): void
}>()

// ─── 최대값 (바 차트 비율 계산) ──────────────────────────────
const maxPendingCount = computed(() => Math.max(...props.topRecipients.map((r) => r.pendingCount), 1))

// ─── 7일 이상 경과 메일 수 ───────────────────────────────────
const overdueCount = computed(
  () => props.pendingMails.filter((m) => m.replyExpectedYn === 'Y' && m.repliedYn === 'N' && m.elapsedDays >= 7).length,
)

// ─── 전주 대비 델타 ──────────────────────────────────────────
const avgReplyDaysDelta = computed(() => {
  const s = props.weeklyStats
  if (!s) return 0
  return +(s.avgReplyDays - s.prevAvgReplyDays).toFixed(1)
})

const replyRateDelta = computed(() => {
  const s = props.weeklyStats
  if (!s) return 0
  return s.replyRate - s.prevReplyRate
})
</script>

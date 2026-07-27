<template>
  <div class="mail-panel mail-sent-panel">
    <!-- 서브탭 (받은메일함과 동일한 UiTab 사용) -->
    <UiTab
      :model-value="activeTab"
      :tabs="sentSubTabItems"
      class="mail-inbox-subtab"
      @update:model-value="(val) => onTabChange(val as 'all' | 'pending' | 'done')"
    />

    <!-- 목록 -->
    <div class="mail-inbox-content">
      <template v-if="isLoading">
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
          :key="mail.mailId"
          class="mail-classified-item"
          :class="{ 'is-urgent': mail.replyExpectedYn === 'Y' && mail.repliedYn === 'N' && mail.elapsedDays >= 7 }"
        >
          <!-- 아바타 -->
          <div
            class="mail-item-avatar"
            :style="{ background: getAvatarColor(mail.toName || mail.toAddr) }"
          >
            {{ getInitial(mail.toName || mail.toAddr) }}
          </div>

          <!-- 본문 -->
          <div class="mail-item-content">
            <div class="mail-item-top">
              <span class="mail-item-from">{{ mail.toName || mail.toAddr }}</span>
              <!-- 상태 아이콘 -->
              <span
                v-if="mail.repliedYn === 'Y'"
                class="mail-sent-status-badge is-done"
                title="답장 완료"
                >✓</span
              >
              <template v-else-if="mail.replyExpectedYn === 'Y'">
                <span
                  v-if="mail.elapsedDays >= 7"
                  class="mail-sent-status-badge is-overdue"
                  :title="`AI 회신 대기 · 7일 이상 경과`"
                  >⌛</span
                >
                <span
                  v-else
                  class="mail-sent-status-badge is-pending"
                  :title="`AI 회신 대기 · ${mail.elapsedDays}일 경과`"
                  >⌛</span
                >
              </template>
              <span class="mail-classified-due">{{ formatDate(mail.mailDt) }}</span>
            </div>
            <p class="mail-item-subject">{{ mail.subject }}</p>

            <!-- 태그 행 -->
            <div class="mail-classified-tags">
              <!-- 회신 완료 -->
              <span
                v-if="mail.repliedYn === 'Y'"
                class="mail-tag tag-success"
              >
                회신 완료
                <template v-if="mail.replyElapsedHours != null">
                  · {{ formatReplyElapsed(mail.replyElapsedHours) }}
                </template>
              </span>
              <!-- AI 회신 대기 -->
              <span
                v-else-if="mail.replyExpectedYn === 'Y'"
                class="mail-tag"
                :class="mail.elapsedDays >= 7 ? 'tag-urgent' : mail.elapsedDays >= 1 ? 'tag-warn' : 'tag-gray'"
              >
                회신 대기 · {{ mail.elapsedDays }}일 경과
              </span>
              <!-- 회신 불필요 -->
              <span
                v-else
                class="mail-tag tag-gray"
              >
                회신 불필요
              </span>
            </div>
          </div>

          <!-- 호버 액션 -->
          <div class="mail-classified-actions">
            <UiButton
              variant="outline"
              size="sm"
              @click.stop="emit('detail', mail)"
            >
              상세보기
            </UiButton>
            <!-- 독촉 초안: AI 회신 대기 중이면 표시 -->
            <UiButton
              v-if="mail.repliedYn === 'N' && mail.replyExpectedYn === 'Y'"
              variant="outline"
              size="sm"
              @click.stop="onDraftClick(mail)"
            >
              독촉 초안
            </UiButton>
            <!-- 회신 불필요: AI 회신 대기 중 -->
            <UiButton
              v-if="mail.repliedYn === 'N' && mail.replyExpectedYn === 'Y'"
              variant="outline"
              size="sm"
              @click.stop="onReplyNotNeeded(mail)"
            >
              회신 불필요
            </UiButton>
            <!-- 회신 필요: 회신 불필요 처리된 메일 복원 -->
            <UiButton
              v-if="mail.repliedYn === 'N' && mail.replyExpectedYn === 'N'"
              variant="outline"
              size="sm"
              @click.stop="onReplyNeeded(mail)"
            >
              회신 필요
            </UiButton>
          </div>
        </div>
      </template>

      <UiEmpty
        v-else
        icon="icon-mail"
        title="보낸 메일이 없습니다"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { openConfirm } from '~/composables/useDialog'
import type { SentClassifiedItem } from '~/types/mail'
import { useMailStore } from '~/composables/mail/useMailStore'

const props = defineProps<{
  isLoading: boolean
  mails: SentClassifiedItem[]
  tabCounts: { all: number; pending: number; done: number }
  selectedTab?: 'all' | 'pending' | 'done'
}>()

const emit = defineEmits<{
  (e: 'tab-change', tab: 'all' | 'pending' | 'done'): void
  (e: 'detail' | 'draft-click', mail: SentClassifiedItem): void
  (e: 'followup-changed'): void
}>()

const { handleReplyNotNeeded, handleReplyNeeded } = useMailStore()

// ─── 서브탭 ────────────────────────────────────────────────
const activeTab = ref<'all' | 'pending' | 'done'>(props.selectedTab ?? 'all')

const sentSubTabItems = computed(() => [
  { label: `전체 (${props.tabCounts.all})`, value: 'all' },
  { label: `회신 대기 (${props.tabCounts.pending})`, value: 'pending' },
  { label: `회신 완료 (${props.tabCounts.done})`, value: 'done' },
])

watch(
  () => props.selectedTab,
  (val) => {
    if (val) activeTab.value = val
  },
)

const onTabChange = (tab: 'all' | 'pending' | 'done') => {
  activeTab.value = tab
  emit('tab-change', tab)
}

// ─── 날짜 포맷 ─────────────────────────────────────────────
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const formatReplyElapsed = (hours: number | null) => {
  if (hours === null || hours === undefined) return ''
  if (hours < 24) return `${hours}시간 후 회신`
  const days = Math.floor(hours / 24)
  return `${days}일 후 회신`
}

// ─── 아바타 ────────────────────────────────────────────────
const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

// ─── 독촉 메일 초안 ────────────────────────────────────────────
const onDraftClick = (mail: SentClassifiedItem) => {
  if (mail.repliedYn === 'Y') return
  emit('draft-click', mail)
}

// ─── 회신 불필요 / 필요 처리 ───────────────────────────────
const onReplyNotNeeded = async (mail: SentClassifiedItem) => {
  const confirmed = await openConfirm({
    title: '회신 불필요',
    message: `"${mail.subject}" 메일을 회신 불필요로 처리하시겠습니까?\n회신 대기 목록에서 제외됩니다.`,
  })
  if (!confirmed) return
  await handleReplyNotNeeded(mail.mailId, () => emit('followup-changed'))
}

const onReplyNeeded = async (mail: SentClassifiedItem) => {
  const confirmed = await openConfirm({
    title: '회신 필요',
    message: `"${mail.subject}" 메일을 다시 회신 대기로 변경하시겠습니까?`,
  })
  if (!confirmed) return
  await handleReplyNeeded(mail.mailId, () => emit('followup-changed'))
}
</script>

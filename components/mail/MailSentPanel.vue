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
              <template v-else-if="mail.trackSource !== 'NONE'">
                <span
                  v-if="mail.elapsedDays >= 7"
                  class="mail-sent-status-badge is-overdue"
                  :title="`${mail.trackSource === 'USER' ? '팔로업' : 'AI 회신 대기'} · 7일 이상 경과`"
                  >⌛</span
                >
                <span
                  v-else
                  class="mail-sent-status-badge is-pending"
                  :title="`${mail.trackSource === 'USER' ? '팔로업' : 'AI 회신 대기'} · ${mail.elapsedDays}일 경과`"
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
              <!-- 사용자 팔로업 대기 -->
              <span
                v-else-if="mail.trackSource === 'USER'"
                class="mail-tag"
                :class="mail.elapsedDays >= 7 ? 'tag-urgent' : mail.elapsedDays >= 1 ? 'tag-warn' : 'tag-gray'"
              >
                📌 팔로업 · {{ mail.elapsedDays }}일 경과
              </span>
              <!-- AI 회신기대 대기 -->
              <span
                v-else-if="mail.trackSource === 'AI'"
                class="mail-tag"
                :class="mail.elapsedDays >= 7 ? 'tag-urgent' : mail.elapsedDays >= 1 ? 'tag-warn' : 'tag-gray'"
              >
                AI 회신 대기 · {{ mail.elapsedDays }}일 경과
              </span>
              <!-- AI 무시됨 -->
              <span
                v-else-if="mail.trackSource === 'DISMISSED'"
                class="mail-tag tag-gray"
              >
                회신 불필요 처리됨
              </span>
              <!-- 트래킹 없음 -->
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
            <!-- 독촉 초안: 대기 중이면 표시 -->
            <UiButton
              v-if="mail.repliedYn === 'N' && mail.trackSource !== 'NONE'"
              variant="outline"
              size="sm"
              @click.stop="onDraftClick(mail)"
            >
              독촉 초안
            </UiButton>
            <!-- 팔로업 해제: 사용자 팔로업 대기 중 -->
            <UiButton
              v-if="mail.followupId && mail.followupStatusCd === '001'"
              variant="outline"
              size="sm"
              @click.stop="onFollowupCancel(mail)"
            >
              팔로업 해제
            </UiButton>
            <!-- 무시 해제: AI 무시 상태 (003) -->
            <UiButton
              v-else-if="mail.followupId && mail.followupStatusCd === '003'"
              variant="outline"
              size="sm"
              @click.stop="onFollowupCancel(mail)"
            >
              무시 해제
            </UiButton>
            <!-- AI 추천 메일: 회신 불필요(무시) 또는 팔로업 등록 선택 -->
            <template v-else-if="!mail.followupId && mail.repliedYn === 'N' && mail.trackSource === 'AI'">
              <UiButton
                variant="outline"
                size="sm"
                @click.stop="onFollowupDismiss(mail)"
              >
                회신 불필요
              </UiButton>
              <UiButton
                variant="outline"
                size="sm"
                @click.stop="onFollowupRegister(mail)"
              >
                팔로업 등록
              </UiButton>
            </template>
            <!-- 그 외 미회신: 팔로업 등록 -->
            <UiButton
              v-else-if="!mail.followupId && mail.repliedYn === 'N'"
              variant="outline"
              size="sm"
              @click.stop="onFollowupRegister(mail)"
            >
              팔로업 등록
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
  (e: 'detail', mail: SentClassifiedItem): void
  (e: 'followup-changed'): void
}>()

const { handleFetchFollowupDraft, handleFollowupRegister, handleFollowupDismiss, handleFollowupCancel } = useMailStore()

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

// ─── 독촉 메일 초안 모달 ────────────────────────────────────
const isDraftModalOpen = ref(false)
const isDraftLoading = ref(false)
const draftContent = ref('')

const onDraftClick = async (mail: SentClassifiedItem) => {
  if (mail.repliedYn === 'Y') return
  isDraftModalOpen.value = true
  isDraftLoading.value = true
  draftContent.value = ''
  draftContent.value = await handleFetchFollowupDraft(mail.toName || mail.toAddr, mail.subject, mail.mailDt ?? '')
  isDraftLoading.value = false
}

const closeDraftModal = () => {
  isDraftModalOpen.value = false
  draftContent.value = ''
}

// ─── 팔로업 등록 / 해제 ──────────────────────────────────────
const toYyyyMmDd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** 발송일 기준 7일 후를 회신 예정일로 사용 */
const getExpectedReplyDt = (mailDt: string | null) => {
  const base = mailDt ? new Date(mailDt) : new Date()
  if (Number.isNaN(base.getTime())) return toYyyyMmDd(new Date())
  base.setDate(base.getDate() + 7)
  return toYyyyMmDd(base)
}

const onFollowupRegister = async (mail: SentClassifiedItem) => {
  const confirmed = await openConfirm({
    title: '팔로업 등록',
    message: `"${mail.subject}" 메일을 팔로업으로 등록하시겠습니까?`,
  })
  if (!confirmed) return
  await handleFollowupRegister({
    sentMailId: mail.mailId,
    recipientAddr: mail.toAddr,
    expectedReplyDt: getExpectedReplyDt(mail.mailDt),
  })
  emit('followup-changed')
}

const onFollowupDismiss = async (mail: SentClassifiedItem) => {
  const confirmed = await openConfirm({
    title: '회신 불필요',
    message: `"${mail.subject}" 메일을 회신 불필요로 처리하시겠습니까?\n회신 대기 목록에서 제외됩니다.`,
  })
  if (!confirmed) return
  await handleFollowupDismiss(mail.mailId, () => emit('followup-changed'))
}

const onFollowupCancel = async (mail: SentClassifiedItem) => {
  if (!mail.followupId) return
  const isUser = mail.followupStatusCd === '001'
  const confirmed = await openConfirm({
    title: isUser ? '팔로업 해제' : '무시 해제',
    message: isUser
      ? `"${mail.subject}" 메일의 팔로업을 해제하시겠습니까?`
      : `"${mail.subject}" 메일의 회신 불필요 처리를 취소하시겠습니까?`,
  })
  if (!confirmed) return
  await handleFollowupCancel(mail.followupId, () => emit('followup-changed'))
}
</script>

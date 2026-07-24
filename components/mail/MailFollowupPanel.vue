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

    <!-- 독촉이 필요한 메일 -->
    <div class="mail-panel mail-followup-urgent-card">
      <div class="mail-panel-header">
        <h2 class="mail-panel-title">독촉이 필요한 메일</h2>
        <span
          v-if="urgentMails.length > 0"
          class="mail-followup-urgent-badge"
        >
          {{ urgentMails.length }}건
        </span>
      </div>
      <div class="mail-followup-urgent-body">
        <template v-if="isLoading">
          <div
            v-for="i in 3"
            :key="i"
            class="mail-followup-urgent-skeleton"
          >
            <span class="mail-skeleton mail-skeleton-line" />
            <span class="mail-skeleton mail-skeleton-line-sm" />
          </div>
        </template>

        <template v-else-if="urgentMails.length > 0">
          <div
            v-for="mail in urgentMails"
            :key="mail.mailId"
            class="mail-followup-urgent-item"
          >
            <div class="mail-followup-urgent-info">
              <span class="mail-followup-urgent-name">{{ mail.toName || mail.toAddr }}</span>
              <span class="mail-followup-urgent-subject">{{ mail.subject }}</span>
            </div>
            <div class="mail-followup-urgent-meta">
              <span class="mail-followup-urgent-days">{{ mail.elapsedDays }}일 경과</span>
              <UiButton
                variant="outline"
                size="sm"
                @click="onDraftClick(mail)"
              >
                독촉 초안
              </UiButton>
            </div>
          </div>
        </template>

        <UiEmpty
          v-else
          title="독촉이 필요한 메일이 없습니다"
        />
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
import type { SentTopRecipient, SentClassifiedItem } from '~/types/mail'
import { useMailStore } from '~/composables/mail/useMailStore'

const props = defineProps<{
  isLoading: boolean
  topRecipients: SentTopRecipient[]
  pendingMails: SentClassifiedItem[]
}>()

const { handleFetchFollowupDraft } = useMailStore()

// ─── 최대값 (바 차트 비율 계산) ──────────────────────────────
const maxPendingCount = computed(() => Math.max(...props.topRecipients.map((r) => r.pendingCount), 1))

// ─── 독촉 필요 메일: 사용자/AI 트래킹 중 7일 이상 경과, 경과일 내림차순 top 3 ──
const urgentMails = computed(() =>
  props.pendingMails
    .filter((m) => (m.trackSource === 'AI' || m.trackSource === 'USER') && m.repliedYn === 'N' && m.elapsedDays >= 7)
    .sort((a, b) => b.elapsedDays - a.elapsedDays)
    .slice(0, 3),
)

// ─── 독촉 초안 모달 ──────────────────────────────────────────
const isDraftModalOpen = ref(false)
const isDraftLoading = ref(false)
const draftContent = ref('')

const onDraftClick = async (mail: SentClassifiedItem) => {
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
</script>

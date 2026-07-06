<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="640px"
    custom-class="mail-detail-modal-dialog"
    @close="emit('close')"
  >
    <template #header>
      <div class="mail-detail-modal-header">
        <div class="mail-detail-modal-title-wrap">
          <span
            v-if="isRead === false"
            class="mail-detail-unread-dot"
          />
          <h2 class="mail-detail-modal-title">{{ subject || '(제목 없음)' }}</h2>
        </div>
        <button
          class="btn btn-modal-close"
          @click="emit('close')"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <div class="mail-detail-modal-body">
      <!-- 발신자/수신자 + 날짜 -->
      <div class="mail-detail-meta">
        <div class="mail-detail-meta-row">
          <span class="mail-detail-meta-label">{{ senderLabel }}</span>
          <div class="mail-detail-sender">
            <div
              class="mail-detail-avatar"
              :style="{ background: getAvatarColor(senderName) }"
            >
              {{ getInitial(senderName) }}
            </div>
            <span class="mail-detail-sender-name">{{ senderName }}</span>
            <span
              v-if="senderEmail && senderEmail !== senderName"
              class="mail-detail-sender-email"
            >&lt;{{ senderEmail }}&gt;</span>
          </div>
        </div>
        <div class="mail-detail-meta-row">
          <span class="mail-detail-meta-label">{{ dateLabel }}</span>
          <span class="mail-detail-date">{{ formatFullDate(date) }}</span>
        </div>
      </div>

      <div class="mail-detail-divider" />

      <!-- 본문 -->
      <div class="mail-detail-body-wrap">
        <p
          v-if="cleanBody"
          class="mail-detail-body"
        >
          {{ cleanBody }}
        </p>
        <UiEmpty
          v-else
          title="본문 내용이 없습니다"
        />
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import { plainTextFromHtml } from '~/utils/global/htmlUtil'

interface Props {
  isOpen: boolean
  subject: string
  senderLabel: string
  senderName: string
  senderEmail: string
  dateLabel: string
  date: string | null
  body: string
  isRead?: boolean
}

const props = defineProps<Props>()

const cleanBody = computed(() => plainTextFromHtml(props.body))

const emit = defineEmits<{ close: [] }>()

const formatFullDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
</script>

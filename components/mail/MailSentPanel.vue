<template>
  <div class="mail-panel mail-sent-panel">
    <div class="mail-panel-header">
      <h2 class="mail-panel-title">보낸메일함</h2>
      <span class="mail-count-badge">{{ sentTotalCount }}개</span>
    </div>

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

      <template v-else-if="sentMails.length > 0">
        <div
          v-for="mail in sentMails"
          :key="mail.to + mail.sentDate"
          class="mail-item is-clickable"
          @click="openDetail(mail)"
        >
          <div
            class="mail-item-avatar"
            :style="{ background: getAvatarColor(mail.toName) }"
          >
            {{ getInitial(mail.toName) }}
          </div>

          <div class="mail-item-content">
            <div class="mail-item-top">
              <span class="mail-item-from">{{ mail.toName || mail.to }}</span>
              <span class="mail-item-time">{{ formatDate(mail.sentDate) }}</span>
            </div>
            <p class="mail-item-subject">{{ mail.subject }}</p>
            <p class="mail-item-preview">{{ truncate(plainTextFromHtml(mail.body), 80) }}</p>
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

  <MailDetailModal
    :is-open="isModalOpen"
    :subject="selectedMail?.subject ?? ''"
    sender-label="수신자"
    :sender-name="selectedMail?.toName ?? ''"
    :sender-email="selectedMail?.to ?? ''"
    date-label="발송일"
    :date="selectedMail?.sentDate ?? null"
    :body="selectedMail?.body ?? ''"
    @close="closeDetail"
  />
</template>

<script setup lang="ts">
import { UiEmpty } from '@leechanyong/ispark-ui'
import type { SentMail } from '~/types/mail'
import { plainTextFromHtml } from '~/utils/global/htmlUtil'

defineProps<{
  isLoading: boolean
  sentMails: SentMail[]
  sentTotalCount: number
}>()

const isModalOpen = ref(false)
const selectedMail = ref<SentMail | null>(null)

const openDetail = (mail: SentMail) => {
  selectedMail.value = mail
  isModalOpen.value = true
}

const closeDetail = () => {
  isModalOpen.value = false
  selectedMail.value = null
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

const truncate = (text: string, len: number) => {
  if (!text) return ''
  return text.length > len ? text.slice(0, len) + '...' : text
}

const getInitial = (name: string) => (name ? name.trim().charAt(0).toUpperCase() : '?')

const AVATAR_COLORS = ['#3c69db', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0]
  const code = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
</script>

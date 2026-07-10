<template>
  <p
    v-if="isLoading"
    class="login-notice-status"
  >
    공지를 불러오는 중...
  </p>
  <div
    v-else-if="errorMessage"
    class="login-notice-status login-notice-status--error"
  >
    <span>{{ errorMessage }}</span>
    <button
      type="button"
      class="btn-login"
      @click="emit('retry')"
    >
      다시 시도
    </button>
  </div>
  <p
    v-else-if="notices.length === 0 && !hasMaintBanner"
    class="login-notice-status"
  >
    등록된 공지가 없습니다.
  </p>
  <div
    v-else-if="notices.length > 0"
    class="notice-list"
  >
    <div
      v-for="notice in notices"
      :key="notice.noticeId"
      class="notice-item"
    >
      <button
        type="button"
        class="notice-item-main"
        @click="emit('select', notice)"
      >
        <span class="notice-item-content type">{{ getTypeBracketed(notice) }}</span>
        <span class="notice-item-content title">{{ notice.title }}</span>
      </button>
      <span class="notice-item-content date">{{ getDateLabel(notice.createDt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoginNoticeItem } from '~/types/notice'

defineProps<{
  notices: LoginNoticeItem[]
  isLoading: boolean
  errorMessage: string
  hasMaintBanner: boolean
  getTypeBracketed: (notice: Pick<LoginNoticeItem, 'noticeTypeCd'>) => string
  getDateLabel: (createDt?: string) => string
}>()

const emit = defineEmits<{
  select: [notice: LoginNoticeItem]
  retry: []
}>()
</script>

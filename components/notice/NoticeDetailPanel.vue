<template>
  <UiModal
    :is-open="isOpen"
    :title="displayValue(notice?.title)"
    position="right"
    custom-class="notice-detail-modal"
    @close="$emit('close')"
  >
    <div class="notice-detail-panel">
      <div class="notice-detail-header">
        <div class="notice-detail-meta flex items-center">
          <p class="notice-detail-writer">{{ displayValue(notice?.crtrId) }}</p>
          <span class="notice-detail-divider">|</span>
          <p class="notice-detail-date">{{ displayValue(notice?.createDt) }}</p>
          <span class="notice-detail-divider">|</span>
          <p class="notice-detail-view">조회수 {{ displayValue(notice?.viewCnt) }}</p>
        </div>
      </div>

      <div
        v-if="notice?.useYn === 'Y' || notice?.pinYn === 'Y'"
        class="notice-detail-flag-group flex items-center"
      >
        <UiBadge
          v-if="notice?.useYn === 'Y'"
          variant="default"
        >
          대시보드 표시
        </UiBadge>
        <UiBadge
          v-if="notice?.pinYn === 'Y'"
          variant="default"
        >
          상단 고정
        </UiBadge>
      </div>

      <div class="notice-detail-body">
        <p class="notice-content-box">{{ displayValue(notice?.content) }}</p>
      </div>
    </div>

    <template
      v-if="isNoticeAuthor"
      #footer
    >
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="onEditNotice"
        >
          수정
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="md"
          @click="onDeleteNotice"
        >
          삭제
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { NoticeItem } from '~/types/notice'

interface Props {
  isOpen: boolean
  notice?: NoticeItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  edit: []
  delete: []
}>()

const { user } = useAuth()

const isNoticeAuthor = computed(() => {
  const writer = String(props.notice?.crtrId ?? '').trim()
  const userName = String(user.value?.userNm ?? '').trim()
  if (!writer || !userName) return false
  return writer === userName
})

const displayValue = (value?: string | number | null) => {
  if (value === undefined || value === null) return '-'
  const text = String(value).trim()
  return text || '-'
}

const onEditNotice = () => {
  if (!props.notice) return
  emit('edit')
}

const onDeleteNotice = () => {
  if (!props.notice) return
  emit('delete')
}
</script>

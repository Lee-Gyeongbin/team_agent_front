<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    size="sm"
    :max-width="maxWidth || undefined"
    :custom-class="customClass"
    @close="handleClose"
  >
    <slot>
      <p class="ui-dialog-message">{{ message }}</p>
    </slot>

    <template #footer>
      <UiButton
        variant="secondary"
        size="lg"
        @click="handleCancel"
      >
        {{ cancelText }}
      </UiButton>
      <UiButton
        variant="primary"
        size="lg"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiButton, UiModal } from '@leechanyong/ispark-ui'

interface Props {
  isOpen?: boolean
  title?: string
  message?: string
  cancelText?: string
  confirmText?: string
  /** 예: `720px` — 본문(슬롯)이 넓을 때 `UiModal`과 동일 */
  maxWidth?: string
  /** `UiModal` 루트에 추가 — 전역 z-index 등 */
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '확인',
  message: '',
  cancelText: '취소',
  confirmText: '확인',
  maxWidth: '',
  customClass: '',
})

const emit = defineEmits<{
  close: []
  cancel: []
  confirm: []
}>()

const handleClose = () => {
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}
</script>

<style lang="scss" scoped>
.ui-dialog-message {
  margin: 0;
  white-space: pre-line;
}
</style>

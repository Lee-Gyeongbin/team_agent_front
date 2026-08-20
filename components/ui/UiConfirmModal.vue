<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    size="sm"
    :custom-class="customClass"
    @close="handleClose"
  >
    <slot>
      <p class="ui-dialog-message">{{ message }}</p>
    </slot>

    <template #footer>
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
  confirmText?: string
  /** `UiModal` 루트 클래스 — 전역 다이얼로그 z-index 등 */
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '확인',
  message: '',
  confirmText: '확인',
  customClass: '',
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const handleClose = () => {
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

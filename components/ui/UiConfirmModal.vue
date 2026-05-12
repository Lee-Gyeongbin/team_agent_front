<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
    :custom-class="customClass"
    @close="handleClose"
  >
    <!-- 본문 -->
    <slot>
      <span class="modal-message">{{ message }}</span>
    </slot>

    <!-- 푸터 -->
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
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

// 이벤트 핸들러
const handleClose = () => {
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
  emit('close')
}
</script>

<style lang="scss" scoped>
.modal-message {
  white-space: pre-line;
}
</style>

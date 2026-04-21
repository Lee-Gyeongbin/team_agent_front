<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
    :max-width="maxWidth"
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
          variant="outline"
          size="xlg"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UiButton>
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
  cancelText?: string
  confirmText?: string
  /** 예: `720px` — 본문(슬롯)이 넓을 때 `UiModal`과 동일 */
  maxWidth?: string
  /** `UiModal` 루트에 추가 — 본문 레이아웃 오버라이드 등 */
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
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

// 이벤트 핸들러
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
.modal-message {
  white-space: pre-line;
}
</style>

<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
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
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '확인',
  message: '',
  confirmText: '확인',
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

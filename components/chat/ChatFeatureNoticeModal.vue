<template>
  <UiModal
    :is-open="isOpen"
    title="사용 가능 기능 안내"
    position="center"
    :show-close="true"
    :show-overlay="true"
    max-width="560px"
    custom-class="chat-feature-notice-modal"
    @close="emit('close')"
  >
    <div class="chat-feature-notice-body">
      <div class="chat-feature-notice-content">
        {{ content }}
      </div>
    </div>

    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="xlg"
          @click="emit('hide')"
        >
          다음부터 보지 않기
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="xlg"
          @click="emit('confirm')"
        >
          확인
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  content: string
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: []
  hide: []
}>()
</script>

<style lang="scss" scoped>
.chat-feature-notice-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.chat-feature-notice-content {
  padding: $spacing-md $spacing-lg;
  border: 1px solid $color-border-light;
  border-radius: $border-radius-base;
  background: $color-surface;
  @include typo($body-medium, $color-text-dark);
  white-space: pre-line;
  line-height: 1.6;
}
</style>

<!-- Teleport(body) 모달 — scoped 미적용 -->
<style lang="scss">
.modal-dialog.chat-feature-notice-modal {
  .modal-dialog-content {
    max-width: 560px;
  }

  .modal-dialog-body {
    display: block;
    align-items: stretch;
    min-height: 0;
    padding: 12px 0;
  }
}
</style>

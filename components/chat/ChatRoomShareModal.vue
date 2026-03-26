<template>
  <div class="chat-room-share-modal">
    <div class="chat-room-share-body">
      <div class="form-row">
        <label class="form-label">공유 링크</label>
        <UiInput
          :model-value="shareLink"
          type="text"
          readonly
          @focus="($event.target as HTMLInputElement).select()"
        />
      </div>
    </div>
    <div class="modal-dialog-footer">
      <UiButton
        class="btn-modal-dialog"
        variant="outline"
        size="xlg"
        @click="emit('close')"
      >
        취소
      </UiButton>
      <UiButton
        class="btn-modal-dialog"
        variant="primary"
        size="xlg"
        @click="onCopyLink"
      >
        링크 복사
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatRoom } from '~/types/chat'

interface Props {
  room: ChatRoom | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const shareLink = computed(() => {
  if (!props.room?.roomId) return ''
  const origin = import.meta.client ? window.location.origin : ''
  return `${origin}/chat/share/${props.room.roomId}`
})

const onCopyLink = async () => {
  if (!shareLink.value) return
  try {
    copyToClipboard(shareLink.value)
    openToast({ message: '링크가 복사되었습니다.', type: 'success' })
    emit('close')
  } catch {
    openToast({ message: '링크 복사에 실패했습니다.', type: 'error' })
  }
}
</script>

<style lang="scss" scoped>
.chat-room-share-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.chat-room-share-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  width: 100%;

  .form-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }

  :deep(.ui-input-wrap) {
    width: 100%;
    min-width: 0;
  }
}

.modal-dialog-footer {
  border-top: none;
}
</style>

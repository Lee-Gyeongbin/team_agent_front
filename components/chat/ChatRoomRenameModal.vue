<template>
  <div class="chat-room-rename-modal">
    <div class="chat-room-rename-body">
      <div class="form-row">
        <label class="form-label">이름</label>
        <UiInput
          v-model="roomTitle"
          type="text"
          placeholder="검색기록 이름 입력"
          @keydown.enter="onSubmit"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="chat-room-rename-error"
    >
      <p class="chat-room-rename-error__message">{{ modalErrorMessage }}</p>
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
        @click="onSubmit"
      >
        저장
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
  save: [title: string]
  close: []
}>()

const roomTitle = ref('')
const modalErrorMessage = ref('')

watch(
  () => props.room,
  (r) => {
    if (r) {
      roomTitle.value = r.title || r.roomTitle || ''
      modalErrorMessage.value = ''
    } else {
      roomTitle.value = ''
    }
  },
  { immediate: true },
)

watch(roomTitle, () => {
  modalErrorMessage.value = ''
})

const onSubmit = () => {
  const trimmed = roomTitle.value.trim()
  if (!trimmed) {
    modalErrorMessage.value = '검색기록 이름을 입력해주세요.'
    return
  }
  emit('save', trimmed)
}
</script>

<style lang="scss" scoped>
.chat-room-rename-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.chat-room-rename-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.chat-room-rename-error {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: rgba($color-error, 0.06);
  border-radius: $border-radius-base;

  &__message {
    font-size: $font-size-sm;
    color: $color-error;
    text-align: center;
    white-space: pre-line;
  }
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

<template>
  <div class="library-card-title-rename-modal">
    <div class="library-card-title-rename-body">
      <div class="form-row">
        <label class="form-label">지식 제목</label>
        <UiInput
          v-model="cardTitle"
          type="text"
          placeholder="카드 제목 입력"
          @keydown.enter="onSubmit"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="library-card-title-rename-error"
    >
      <p class="library-card-title-rename-error__message">{{ modalErrorMessage }}</p>
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
import type { LibraryCardDetail } from '~/types/library'

interface Props {
  card: LibraryCardDetail | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [title: string]
  close: []
}>()

const cardTitle = ref('')
const modalErrorMessage = ref('')

watch(
  () => props.card,
  (c) => {
    if (c) {
      cardTitle.value = c.title
      modalErrorMessage.value = ''
    } else {
      cardTitle.value = ''
    }
  },
  { immediate: true },
)

watch(cardTitle, () => {
  modalErrorMessage.value = ''
})

const onSubmit = () => {
  const trimmed = cardTitle.value.trim()
  if (!trimmed) {
    modalErrorMessage.value = '제목을 입력해주세요.'
    return
  }
  emit('save', trimmed)
}
</script>

<style lang="scss" scoped>
.library-card-title-rename-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.library-card-title-rename-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.library-card-title-rename-error {
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

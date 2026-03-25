<template>
  <div class="library-category-rename-modal">
    <div class="library-category-rename-body">
      <div class="form-row">
        <label class="form-label">카테고리명</label>
        <UiInput
          v-model="categoryNm"
          type="text"
          placeholder="카테고리명 입력"
          @keydown.enter="onSubmit"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="library-category-rename-error"
    >
      <p class="library-category-rename-error__message">{{ modalErrorMessage }}</p>
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
import type { LibraryCategory } from '~/types/library'

interface Props {
  category: LibraryCategory | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [categoryNm: string]
  close: []
}>()

const categoryNm = ref('')
const modalErrorMessage = ref('')

watch(
  () => props.category,
  (cat) => {
    if (cat) {
      categoryNm.value = cat.categoryNm
      modalErrorMessage.value = ''
    } else {
      categoryNm.value = ''
    }
  },
  { immediate: true },
)

watch(categoryNm, () => {
  modalErrorMessage.value = ''
})

const onSubmit = () => {
  const trimmed = categoryNm.value.trim()
  if (!trimmed) {
    modalErrorMessage.value = '카테고리명을 입력해주세요.'
    return
  }
  emit('save', trimmed)
}
</script>

<style lang="scss" scoped>
.library-category-rename-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.library-category-rename-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.library-category-rename-error {
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
</style>

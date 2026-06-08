<template>
  <div class="my-doc-rename-modal">
    <div class="my-doc-rename-body">
      <div class="form-row">
        <label class="form-label">문서명</label>
        <UiInput
          v-model="docNmDraft"
          type="text"
          placeholder="문서명 입력"
          @enter="onSubmit"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="my-doc-rename-error"
    >
      <p class="my-doc-rename-error__message">{{ modalErrorMessage }}</p>
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
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        저장
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MyDoc } from '~/types/mydoc'

interface Props {
  doc: MyDoc | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [docNm: string]
  close: []
}>()

const docNmDraft = ref('')
const modalErrorMessage = ref('')

const savedDocNm = computed(() => props.doc?.docNm?.trim() ?? '')

const canSubmit = computed(() => {
  const trimmed = docNmDraft.value.trim()
  return !!trimmed && trimmed !== savedDocNm.value
})

watch(
  () => props.doc,
  (doc) => {
    if (doc) {
      docNmDraft.value = doc.docNm
      modalErrorMessage.value = ''
    } else {
      docNmDraft.value = ''
    }
  },
  { immediate: true },
)

watch(docNmDraft, () => {
  modalErrorMessage.value = ''
})

const onSubmit = () => {
  const trimmed = docNmDraft.value.trim()
  if (!trimmed) {
    modalErrorMessage.value = '문서명을 입력해주세요.'
    return
  }
  if (trimmed === savedDocNm.value) return
  emit('save', trimmed)
}
</script>

<style lang="scss" scoped>
.my-doc-rename-modal {
  padding: $spacing-md;
  width: 100%;
  align-self: stretch;
  min-width: 0;
}

.my-doc-rename-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.my-doc-rename-error {
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

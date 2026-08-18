<template>
  <UiModal
    :is-open="isOpen"
    title="문서명 변경"
    max-width="420px"
    @close="emit('close')"
  >
    <div class="my-doc-rename-body">
      <div class="form-row">
        <label class="form-label">문서명</label>
        <UiInput
          v-model="docNmDraft"
          type="text"
          placeholder="문서명 입력"
          @keydown.enter="onSubmit"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="my-doc-rename-error"
    >
      <p class="my-doc-rename-error__message">{{ modalErrorMessage }}</p>
    </div>

    <template #footer>
      <UiButton
        variant="secondary"
        size="lg"
        @click="emit('close')"
      >
        취소
      </UiButton>
      <UiButton
        variant="primary"
        size="lg"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        저장
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { UiButton, UiInput, UiModal } from '@leechanyong/ispark-ui'
import type { MyDoc } from '~/types/mydoc'

interface Props {
  isOpen?: boolean
  doc: MyDoc | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

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
}
</style>

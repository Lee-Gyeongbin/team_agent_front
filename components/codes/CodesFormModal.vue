<template>
  <div class="codes-form-modal">
    <div class="codes-form-body">
      <div class="form-row">
        <label class="form-label">코드</label>
        <UiInput
          v-model="form.code"
          placeholder="코드 입력"
          :disabled="isEditMode"
        />
      </div>
      <div class="form-row">
        <label class="form-label">코드명</label>
        <UiInput
          v-model="form.codeName"
          placeholder="코드명 입력"
        />
      </div>
      <div class="form-row">
        <label class="form-label">사용여부</label>
        <UiSelect
          v-model="form.useYn"
          :options="useYnOptions"
          placeholder="선택"
        />
      </div>

      <div class="form-row">
        <label class="form-label">추가 정보1</label>
        <UiInput
          v-model="form.etc1"
          placeholder="추가 정보1 입력"
        />
      </div>
      <div class="form-row">
        <label class="form-label">추가 정보2</label>
        <UiInput
          v-model="form.etc2"
          placeholder="추가 정보2 입력"
        />
      </div>
      <div class="form-row">
        <label class="form-label">설명</label>
        <UiInput
          v-model="form.description"
          placeholder="설명 입력 (선택)"
        />
      </div>
    </div>
    <div
      v-if="modalErrorMessage"
      class="codes-form-error"
    >
      <p class="codes-form-error__message">{{ modalErrorMessage }}</p>
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
import type { CodeItem } from '~/types/codes'
import { saveCodeForm } from '~/types/codes'
import { useCodesStore, useYnOptions } from '~/composables/codes/useCodesStore'

const { modalErrorMessage } = useCodesStore()

interface Props {
  editingCode: CodeItem | null
  isEditMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [form: Partial<CodeItem>]
  close: []
}>()

const form = reactive(saveCodeForm())

watch(
  () => props.editingCode,
  (code) => {
    if (code) {
      form.code = code.codeId
      form.codeName = code.codeNm
      form.sortOrdStr = String(code.sortOrd)
      form.useYn = code.useYn
      form.description = code.description ?? ''
      form.etc1 = code.etc1 ?? ''
      form.etc2 = code.etc2 ?? ''
    } else {
      Object.assign(form, saveCodeForm())
    }
  },
  { immediate: true },
)

watch(
  () => [form.code, form.codeName, form.sortOrdStr, form.useYn, form.description, form.etc1, form.etc2],
  () => {
    modalErrorMessage.value = ''
  },
)

const onSubmit = () => {
  const sortOrder = parseInt(form.sortOrdStr, 10) || 0
  emit('save', {
    codeId: form.code.trim(),
    codeNm: form.codeName.trim(),
    sortOrd: sortOrder,
    useYn: form.useYn,
    description: form.description.trim() || '',
    etc1: form.etc1.trim() || '',
    etc2: form.etc2.trim() || '',
  })
}
</script>

<style lang="scss" scoped>
.codes-form-modal {
  padding: $spacing-md;
  width: 100%;
}

.codes-form-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  width: 100%;
}

.codes-form-error {
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

  :deep(.ui-input-wrap),
  :deep(.ui-select-wrap) {
    width: 100%;
  }
}
</style>

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
        <label class="form-label">정렬순서</label>
        <UiInput
          v-model="form.sortOrderStr"
          type="number"
          placeholder="0"
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
        <label class="form-label">비고</label>
        <UiInput
          v-model="form.remark"
          placeholder="비고 입력 (선택)"
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
        variant="dark"
        size="xlg"
        @click="onSubmit"
      >
        {{ isEditMode ? '수정' : '저장' }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeItem } from '~/types/codes'

const useYnOptions = [
  { label: '사용', value: 'Y' },
  { label: '미사용', value: 'N' },
]

interface Props {
  editingCode: CodeItem | null
  isEditMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [form: Partial<CodeItem>]
  close: []
}>()

const form = reactive({
  code: '',
  codeName: '',
  sortOrdStr: '0',
  useYn: 'Y',
  description: '',
})

watch(
  () => props.editingCode,
  (code) => {
    if (code) {
      form.code = code.codeId
      form.codeName = code.codeNm
      form.sortOrdStr = String(code.sortOrd)
      form.useYn = code.useYn
      form.description = code.description ?? ''
    } else {
      form.code = ''
      form.codeName = ''
      form.sortOrdStr = '0'
      form.useYn = 'Y'
      form.description = ''
    }
  },
  { immediate: true },
)

const onSubmit = () => {
  const sortOrder = parseInt(form.sortOrdStr, 10) || 0
  emit('save', {
    codeId: form.code.trim(),
    codeNm: form.codeName.trim(),
    sortOrd: sortOrder,
    useYn: form.useYn,
    description: form.description.trim() || '',
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

.modal-dialog-footer {
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-sm;
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

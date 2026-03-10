<template>
  <div class="code-group-form-modal">
    <div class="code-group-form-body">
      <div class="form-row">
        <label class="form-label">그룹코드</label>
        <UiInput
          v-model="form.codeGrpId"
          placeholder="그룹코드 입력 (예: USER_TYPE)"
          :disabled="isEditMode"
        />
      </div>
      <div class="form-row">
        <label class="form-label">그룹명</label>
        <UiInput
          v-model="form.codeGrpNm"
          placeholder="그룹명 입력"
        />
      </div>
      <div class="form-row">
        <label class="form-label">설명</label>
        <UiInput
          v-model="form.description"
          placeholder="설명 입력 (선택)"
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
        저장
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CodeGroupItem } from '~/types/codes'

const useYnOptions = [
  { label: '사용', value: 'Y' },
  { label: '미사용', value: 'N' },
]

interface Props {
  editingGroup: CodeGroupItem | null
  isEditMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [form: Partial<CodeGroupItem>]
  close: []
}>()

const form = reactive({
  codeGrpId: '',
  codeGrpNm: '',
  description: '',
  useYn: 'Y',
})

watch(
  () => props.editingGroup,
  (group) => {
    if (group) {
      form.codeGrpId = group.codeGrpId
      form.codeGrpNm = group.codeGrpNm
      form.description = group.description ?? ''
      form.useYn = group.useYn
    } else {
      form.codeGrpId = ''
      form.codeGrpNm = ''
      form.description = ''
      form.useYn = 'Y'
    }
  },
  { immediate: true },
)

const onSubmit = () => {
  emit('save', {
    codeGrpId: form.codeGrpId.trim(),
    codeGrpNm: form.codeGrpNm.trim(),
    description: form.description.trim() || '',
    useYn: form.useYn,
  })
}
</script>

<style lang="scss" scoped>
.code-group-form-modal {
  padding: $spacing-md;
  width: 100%;
}

.code-group-form-body {
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

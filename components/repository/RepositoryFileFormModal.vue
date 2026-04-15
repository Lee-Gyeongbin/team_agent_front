<template>
  <UiModal
    :is-open="isOpen"
    :title="editingDocFileId ? '파일 수정' : '파일 추가'"
    position="right"
    @close="$emit('close')"
  >
    <div class="com-setting-form">
      <div class="url-reg-field">
        <label class="url-reg-label">카테고리 <span class="required">*</span></label>
        <UiSelect
          v-model="formCategoryIdModel"
          :options="categoryOptions"
          size="md"
          placeholder="카테고리 선택"
        />
      </div>
      <div class="url-reg-field">
        <label class="url-reg-label">보안등급 <span class="required">*</span></label>
        <UiSelect
          v-model="formSecLvlModel"
          :options="secLvlOptions"
          size="md"
          placeholder="보안등급 선택"
        />
      </div>
      <div class="url-reg-field">
        <label class="url-reg-label">문서 설명</label>
        <UiTextarea
          v-model="formDocDescModel"
          :max-length="500"
          size="md"
          :rows="4"
          border
        />
      </div>
      <div class="url-reg-field">
        <label class="url-reg-label">키워드</label>
        <UiInput
          v-model="formKeywordsModel"
          :max-length="500"
          size="md"
          placeholder="쉼표(,)로 구분"
        />
      </div>
      <div class="url-reg-field">
        <label class="url-reg-label">문서 출처</label>
        <UiInput
          v-model="formDocSrcModel"
          :max-length="500"
          size="md"
          placeholder="https://"
        />
      </div>
      <div
        v-if="!editingDocFileId"
        class="url-reg-field"
      >
        <label class="url-reg-label">파일 첨부 <span class="required">*</span></label>
        <UiFileUpload
          v-model="fileUploadModalFilesModel"
          :multiple="true"
          :max-files="fileUploadMax"
          :max-file-size="fileUploadMaxSize"
          :accept="fileAccept"
          :allowed-extensions="fileUploadAllowedExt"
          hint="최대 30개 / 파일당 최대 100MB"
        />
      </div>
      <div
        v-else
        class="url-reg-field"
      >
        <label class="url-reg-label">파일명</label>
        <UiInput
          :model-value="editingFileName"
          size="md"
          readonly
        />
      </div>
    </div>
    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="$emit('submit')"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
interface SelectOption {
  label: string
  value: string
}

const props = defineProps<{
  isOpen: boolean
  editingDocFileId: string
  editingFileName: string
  formCategoryId: string
  formSecLvl: string
  formDocDesc: string
  formKeywords: string
  formDocSrc: string
  fileUploadModalFiles: File[]
  categoryOptions: SelectOption[]
  secLvlOptions: SelectOption[]
  fileUploadAllowedExt: string[]
  fileUploadMax: number
  fileUploadMaxSize: number
  fileAccept: string
}>()

const emit = defineEmits<{
  close: []
  submit: []
  'update:formCategoryId': [value: string]
  'update:formSecLvl': [value: string]
  'update:formDocDesc': [value: string]
  'update:formKeywords': [value: string]
  'update:formDocSrc': [value: string]
  'update:fileUploadModalFiles': [value: File[]]
}>()

const formCategoryIdModel = computed({
  get: () => props.formCategoryId,
  set: (value: string) => emit('update:formCategoryId', value),
})

const formSecLvlModel = computed({
  get: () => props.formSecLvl,
  set: (value: string) => emit('update:formSecLvl', value),
})

const formDocDescModel = computed({
  get: () => props.formDocDesc,
  set: (value: string) => emit('update:formDocDesc', value),
})

const formKeywordsModel = computed({
  get: () => props.formKeywords,
  set: (value: string) => emit('update:formKeywords', value),
})

const formDocSrcModel = computed({
  get: () => props.formDocSrc,
  set: (value: string) => emit('update:formDocSrc', value),
})

const fileUploadModalFilesModel = computed({
  get: () => props.fileUploadModalFiles,
  set: (value: File[]) => emit('update:fileUploadModalFiles', value),
})
</script>

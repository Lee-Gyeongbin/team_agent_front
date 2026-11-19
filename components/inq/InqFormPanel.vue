<template>
  <UiDrawer
    :open="isOpen"
    :title="`문의사항 ${panelActionLabel}`"
    position="right"
    width="50%"
    persist-key="inq-form"
    @update:open="(value) => !value && $emit('close')"
  >
    <div class="com-setting-form inq-form-panel">
      <div class="inq-form-row">
        <div class="url-reg-field">
          <label class="url-reg-label">구분 <span class="required">*</span></label>
          <UiSelect
            :model-value="formData.catCd"
            :options="catOptions"
            placeholder="구분을 선택하세요"
            size="md"
            @update:model-value="(value) => onFieldChange('catCd', String(value ?? ''))"
          />
        </div>
        <div
          v-if="isAgentCat"
          class="url-reg-field"
        >
          <label class="url-reg-label">에이전트 <span class="required">*</span></label>
          <UiSelect
            :model-value="formData.agentId"
            :options="agentOptions"
            placeholder="에이전트를 선택하세요"
            size="md"
            @update:model-value="(value) => onFieldChange('agentId', String(value ?? ''))"
          />
        </div>
      </div>

      <div class="url-reg-field">
        <label class="url-reg-label">제목 <span class="required">*</span></label>
        <UiInput
          :model-value="formData.title"
          placeholder="제목을 입력하세요"
          size="md"
          :max-length="INQ_TITLE_MAX_LENGTH"
          @update:model-value="(value) => onFieldChange('title', String(value ?? ''))"
        />
      </div>

      <div class="url-reg-field">
        <UiCheckbox
          :model-value="formData.secretYn === 'Y'"
          label="비밀글로 등록하기 (작성자·관리자 권한자만 열람)"
          @update:model-value="(value) => onFieldChange('secretYn', value ? 'Y' : 'N')"
        />
      </div>

      <div class="url-reg-field inq-content-field">
        <label class="url-reg-label">내용 <span class="required">*</span></label>
        <UiMarkdownEditor
          :model-value="formData.content"
          placeholder="내용을 입력하세요"
          @update:model-value="(value) => onFieldChange('content', value)"
        />
      </div>

      <div class="url-reg-field inq-attach">
        <label class="url-reg-label">첨부파일</label>
        <UiFileUpload
          :model-value="files"
          :accept="INQ_FILE_ACCEPT"
          :allowed-extensions="INQ_FILE_EXTENSIONS"
          :max-size="INQ_FILE_MAX_SIZE"
          :attached-file-list="attachedFileItems"
          @update:model-value="(value) => $emit('update:files', value)"
          @remove-attached-file="(file) => $emit('remove-attached-file', file)"
        />
      </div>
    </div>

    <template #footer>
      <div class="modal-side-footer">
        <UiButton
          variant="outline"
          size="md"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onSave"
        >
          저장
        </UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiDrawer, UiInput, UiSelect, UiCheckbox, UiMarkdownEditor, UiButton } from '@leechanyong/ispark-ui'
import { INQ_FILE_ACCEPT, INQ_FILE_EXTENSIONS, INQ_FILE_MAX_SIZE, INQ_TITLE_MAX_LENGTH } from '~/types/inq'
import type { InqFormData } from '~/types/inq'
import type { FileItem } from '~/types/repository'

const props = defineProps<{
  isOpen: boolean
  formData: InqFormData
  catOptions: { label: string; value: string }[]
  agentOptions: { label: string; value: string }[]
  isAgentCat: boolean
  panelActionLabel: '등록' | '수정'
  /** 새로 첨부할 파일 */
  files: File[]
  /** 수정 중인 기존 첨부 */
  attachedFileItems: FileItem[]
}>()

const emit = defineEmits<{
  'update:formData': [payload: InqFormData]
  'update:files': [files: File[]]
  'remove-attached-file': [file: FileItem]
  save: [payload: InqFormData]
  close: []
}>()

const onFieldChange = <K extends keyof InqFormData>(key: K, value: InqFormData[K]) => {
  emit('update:formData', { ...props.formData, [key]: value })
}

const onSave = () => {
  const data = props.formData
  if (!data.catCd) {
    openToast({ message: '구분을 선택해주세요.', type: 'warning' })
    return
  }
  if (props.isAgentCat && !data.agentId) {
    openToast({ message: '에이전트를 선택해주세요.', type: 'warning' })
    return
  }
  if (!data.title.trim()) {
    openToast({ message: '제목을 입력해주세요.', type: 'warning' })
    return
  }
  if (!data.content.trim()) {
    openToast({ message: '내용을 입력해주세요.', type: 'warning' })
    return
  }
  emit('save', data)
}
</script>

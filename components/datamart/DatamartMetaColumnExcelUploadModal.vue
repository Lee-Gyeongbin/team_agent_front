<template>
  <UiModal
    :is-open="isOpen"
    title="컬럼 메타 엑셀 업로드"
    position="center"
    max-width="600px"
    custom-class="datamart-meta-col-excel-upload-modal"
    @close="onModalClose"
  >
    <div class="datamart-meta-col-excel-upload-body">
      <UiFileUpload
        v-model="excelFiles"
        :multiple="false"
        :max-files="1"
        accept=".xlsx,.xls"
        :allowed-extensions="excelAllowedExtensions"
        hint="XLS, XLSX 형식 (파일 1개)"
      />
    </div>
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="md"
          :disabled="uploading"
          @click="onModalClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="md"
          :loading="uploading"
          :disabled="excelFiles.length === 0"
          @click="onUpload"
        >
          업로드
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { openToast } from '~/composables/useToast'

const props = defineProps<{
  isOpen: boolean
  uploading?: boolean
}>()

const emit = defineEmits<{
  close: []
  upload: [file: File]
}>()

const excelAllowedExtensions = ['xlsx', 'xls']
const excelFiles = ref<File[]>([])

const resetForm = () => {
  excelFiles.value = []
}

const onModalClose = () => {
  if (props.uploading) return
  resetForm()
  emit('close')
}

const onUpload = () => {
  const file = excelFiles.value[0]
  if (!file) {
    openToast({ message: '업로드할 엑셀 파일을 선택해 주세요.', type: 'warning' })
    return
  }
  emit('upload', file)
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) resetForm()
  },
)
</script>

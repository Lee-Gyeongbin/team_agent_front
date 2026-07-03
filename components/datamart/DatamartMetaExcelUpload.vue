<template>
  <UiModal
    :is-open="isOpen"
    :title="modalTitle"
    position="center"
    max-width="600px"
    custom-class="datamart-meta-excel-upload-modal"
    @close="onModalClose"
  >
    <div class="datamart-meta-excel-upload-body">
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

export type DatamartMetaExcelUploadKind = 'column' | 'table'

const EXCEL_UPLOAD_TITLE: Record<DatamartMetaExcelUploadKind, string> = {
  column: '컬럼 메타 엑셀 업로드',
  table: '테이블 선택 엑셀 업로드',
}

const props = defineProps<{
  isOpen: boolean
  kind: DatamartMetaExcelUploadKind
  uploading?: boolean
}>()

const emit = defineEmits<{
  close: []
  upload: [file: File]
}>()

const modalTitle = computed(() => EXCEL_UPLOAD_TITLE[props.kind])

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

<style lang="scss">
// Teleport 모달 — scoped 미적용, customClass 기준 글로벌 스타일
.modal-dialog.datamart-meta-excel-upload-modal {
  .modal-dialog-body {
    display: block;
    width: 100%;
    min-height: 0;
    padding: 12px 0;
  }

  .datamart-meta-excel-upload-body {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    width: 100%;
  }

  .ui-file-upload,
  .ui-file-upload-dropzone {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>

<template>
  <UiModal
    :is-open="isOpen"
    title="엑셀 업로드"
    max-width="600px"
    custom-class="org-manage-excel-upload-modal"
    @close="onModalClose"
  >
    <UiFileUpload
      v-model="excelFiles"
      :multiple="false"
      :max-files="1"
      accept=".xlsx,.xls"
      :allowed-extensions="excelAllowedExtensions"
      hint="XLS, XLSX 형식 (파일 1개)"
    />
    <template #footer>
      <div class="modal-dialog-footer">
        <UiButton
          class="btn-modal-dialog"
          variant="outline"
          size="md"
          :disabled="isUploading"
          @click="onModalClose"
        >
          취소
        </UiButton>
        <UiButton
          class="btn-modal-dialog"
          variant="primary"
          size="md"
          :loading="isUploading"
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
import { UiModal, UiButton } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { handleUploadOrgExcel } = useOrgManageStore()

const excelAllowedExtensions = ['xlsx', 'xls']
const excelFiles = ref<File[]>([])
const isUploading = ref(false)

const resetForm = (): void => {
  excelFiles.value = []
}

const onModalClose = (): void => {
  if (isUploading.value) return
  resetForm()
  emit('close')
}

const onUpload = async (): Promise<void> => {
  const file = excelFiles.value[0]
  if (!file) {
    openToast({ message: '업로드할 엑셀 파일을 선택해 주세요.', type: 'warning' })
    return
  }

  isUploading.value = true
  try {
    const success = await handleUploadOrgExcel(file)
    if (success) {
      resetForm()
      emit('close')
    }
  } finally {
    isUploading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) resetForm()
  },
)
</script>

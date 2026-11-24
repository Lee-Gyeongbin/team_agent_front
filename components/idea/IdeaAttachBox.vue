<template>
  <UiFileUpload
    :model-value="newFiles"
    :accept="IDEA_FILE_ACCEPT"
    :allowed-extensions="allowedExtensions"
    :max-size="IDEA_FILE_MAX_SIZE"
    hint="PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, HWP, CSV, TXT (20MB)"
    :attached-file-list="attachedFileItems"
    @update:model-value="updateNewFiles"
    @remove-attached-file="removeAttachedFile"
  />
</template>

<script setup lang="ts">
import UiFileUpload from '~/components/ui/UiFileUpload.vue'
import { IDEA_FILE_ACCEPT, IDEA_FILE_MAX_SIZE } from '~/types/idea'
import type { IdeaFile } from '~/types/idea'
import type { FileItem } from '~/types/repository'

const props = defineProps<{ modelValue: IdeaFile[] }>()
const emit = defineEmits<{ 'update:modelValue': [files: IdeaFile[]] }>()

const allowedExtensions = IDEA_FILE_ACCEPT.split(',')
const newFiles = computed(() => props.modelValue.flatMap(({ file }) => (file ? [file] : [])))
const attachedFiles = computed(() => props.modelValue.filter(({ file }) => !file))
const attachedFileItems = computed<FileItem[]>(() =>
  attachedFiles.value.map((file) => ({
    docFileId: file.ideaFileId ?? '',
    fileName: file.fileNm,
    fileSize: String(file.fileSize),
    filePath: '',
    fileType: '',
  })),
)

const updateNewFiles = (files: File[]) => {
  emit('update:modelValue', [
    ...attachedFiles.value,
    ...files.map((file) => ({ fileNm: file.name, fileSize: file.size, file })),
  ])
}

const removeAttachedFile = (_file: FileItem, index: number) => {
  const attachedFile = attachedFiles.value[index]
  emit('update:modelValue', props.modelValue.filter((file) => file !== attachedFile))
}
</script>

<template>
  <div class="idea-attach-box">
    <input
      ref="fileInputRef"
      type="file"
      class="idea-attach-hidden"
      multiple
      :accept="IDEA_FILE_ACCEPT"
      @change="onFileChange"
    />
    <div
      class="idea-attach"
      :class="{ 'is-dragging': isDragging }"
      role="button"
      tabindex="0"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <UiIcon
        name="paperclip"
        size="15"
      />
      <span class="idea-attach-label">첨부파일</span>
      <span class="idea-attach-hint">클릭하거나 파일을 끌어놓으세요 · 최대 50MB</span>
    </div>

    <IdeaFileList
      v-if="modelValue.length"
      :file-list="modelValue"
      removable
      @remove="removeFile"
      @clear="$emit('update:modelValue', [])"
    />
  </div>
</template>

<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
import { openToast } from '~/composables/useToast'
import { IDEA_FILE_ACCEPT, IDEA_FILE_MAX_SIZE } from '~/types/idea'
import type { IdeaFile } from '~/types/idea'

interface Props {
  modelValue: IdeaFile[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [files: IdeaFile[]]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const openFilePicker = () => {
  fileInputRef.value?.click()
}

/** 50MB 초과 파일은 제외하고, 이름·크기가 같은 파일은 한 번만 추가 */
const addFiles = (fileList: FileList) => {
  const picked = Array.from(fileList).filter((file) => {
    if (file.size <= IDEA_FILE_MAX_SIZE) return true
    openToast({ message: `${file.name}: 최대 50MB까지 첨부할 수 있습니다.`, type: 'warning' })
    return false
  })
  const added = picked
    .filter((file) => !props.modelValue.some((item) => item.fileNm === file.name && item.fileSize === file.size))
    .map((file) => ({ fileNm: file.name, fileSize: file.size, file }))
  if (added.length) emit('update:modelValue', [...props.modelValue, ...added])
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
  input.value = ''
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
}

const removeFile = (index: number) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, idx) => idx !== index),
  )
}
</script>

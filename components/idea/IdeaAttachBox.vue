<template>
  <div class="idea-attach-box">
    <UiFileUpload
      variant="dropzone"
      label="첨부파일 추가"
      hint="클릭하거나 파일을 끌어다 놓으세요. 한 번에 한 파일, 최대 20MB"
      :accept="IDEA_FILE_ACCEPT"
      :max-size="IDEA_FILE_MAX_SIZE"
      @upload="addFile"
    />

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
import { UiFileUpload } from '@leechanyong/ispark-ui'
import { IDEA_FILE_ACCEPT, IDEA_FILE_MAX_SIZE } from '~/types/idea'
import type { IdeaFile } from '~/types/idea'

interface Props {
  modelValue: IdeaFile[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [files: IdeaFile[]]
}>()

const addFile = (file: File) => {
  if (props.modelValue.some((item) => item.fileNm === file.name && item.fileSize === file.size)) return
  emit('update:modelValue', [...props.modelValue, { fileNm: file.name, fileSize: file.size, file }])
}

const removeFile = (index: number) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((_, idx) => idx !== index),
  )
}
</script>

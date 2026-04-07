<template>
  <div class="chat-input">
    <div
      class="chat-input-inner"
      :class="{ 'is-active': modelValue.trim(), 'is-dragging': isDragging }"
      @dragenter.prevent="onAttachDragEnter"
      @dragover.prevent="onAttachDragOver"
      @dragleave.prevent="onAttachDragLeave"
      @drop.prevent="onAttachDrop"
    >
      <div class="chat-input-top flex items-start">
        <i
          v-show="!modelValue"
          class="icon-sparkle size-24"
        ></i>
        <UiTextarea
          :model-value="modelValue"
          class="inp-chat-search"
          :placeholder="inputPlaceholder"
          :disabled="isSearchModeMissingSubOptions"
          :auto-resize="true"
          :max-rows="6"
          @update:model-value="emit('update:modelValue', $event)"
          @keydown.enter.exact.prevent="handleSend"
        />
      </div>

      <div class="chat-input-bottom flex justify-between items-center">
        <div class="chat-input-bottom-left flex gap-8 items-center">
          <UiButton
            type="button"
            variant="ghost"
            size="xlg"
            icon-only
            class="btn-chat-attach"
            aria-label="파일 첨부"
            :disabled="isSending"
            @click="handleAttachClick"
          >
            <template #icon-left>
              <i class="icon-attach-file size-24" />
            </template>
          </UiButton>
          <input
            ref="attachInputRef"
            type="file"
            class="chat-input-attach-hidden"
            :accept="attachAccept"
            multiple
            @change="onAttachFileChange"
          />
          <ChatSearchMode />
        </div>
        <div class="chat-input-bottom-right flex gap-8 items-center">
          <UiSelect
            id="sub-option"
            class="w-150"
            name="sub-option"
            :model-value="selectedModelOption"
            :options="modelOptions"
            size="xlg"
            @update:model-value="selectedModelOption = String($event)"
          />
          <UiButton
            variant="primary"
            size="xlg"
            icon-only
            class="btn-chat-send"
            :loading="isSending"
            :aria-label="isSending ? '전송 중' : '메시지 전송'"
            :disabled="!modelValue.trim() || isSearchModeMissingSubOptions"
            @click="handleSend"
          >
            <template #icon-left>
              <span
                v-if="isSending"
                class="btn-chat-send-spinner"
                aria-hidden="true"
              />
              <i
                v-else
                class="icon-send size-20"
              />
            </template>
          </UiButton>
        </div>
      </div>
      <div
        v-if="previewItems.length > 0"
        class="chat-input-attachments"
      >
        <ul
          class="chat-attachment-list"
          :class="{ 'is-single-image': isSingleImageAttachment }"
        >
          <li
            v-for="item in previewItems"
            :key="item.id"
            class="chat-attachment-item"
            :class="{ 'is-image': item.isImage }"
          >
            <div
              v-if="item.isImage && item.previewUrl"
              class="chat-attachment-thumb-wrap"
            >
              <img
                :src="item.previewUrl"
                :alt="item.file.name"
                class="chat-attachment-thumb"
              />
            </div>
            <div
              v-else
              class="chat-attachment-file-wrap"
            >
              <i :class="['icon', 'size-16', item.iconClass]" />
              <span class="chat-attachment-ext">{{ item.extensionLabel }}</span>
            </div>
            <p class="chat-attachment-name">{{ item.file.name }}</p>
            <button
              type="button"
              class="chat-attachment-remove"
              :aria-label="`${item.file.name} 첨부 삭제`"
              @click="removeAttachment(item.id)"
            >
              <i class="icon icon-close size-14" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AttachmentPreviewItem {
  id: string
  file: File
  previewUrl: string
  isImage: boolean
  iconClass: string
  extensionLabel: string
}

const ATTACH_ALLOWED_EXTENSIONS = [
  'pdf',
  'docx',
  'md',
  'txt',
  'json',
  'pptx',
  'py',
  'js',
  'ts',
  'html',
  'png',
  'jpg',
  'jpeg',
  'webp',
]
const GEMINI_ALLOWED_EXTENSIONS = ['png', 'jpeg', 'jpg', 'webp', 'heic', 'heif', 'pdf', 'txt', 'csv']
const IMAGE_EXTENSION_SET = new Set(['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'])
const ATTACH_EXTENSION_SET = new Set(ATTACH_ALLOWED_EXTENSIONS)
const GEMINI_ATTACH_EXTENSION_SET = new Set(GEMINI_ALLOWED_EXTENSIONS)
const MAX_ATTACH_FILE_COUNT = 5
const MAX_ATTACH_FILE_SIZE_MB = 15
const MAX_ATTACH_FILE_SIZE_BYTES = MAX_ATTACH_FILE_SIZE_MB * 1024 * 1024

const {
  chatRoom,
  createChatRoom,
  onSend,
  modelOptions,
  selectedModelOption,
  isSearchModeMissingSubOptions,
  searchModeSubOptionsEmptyMessage,
} = useChatStore()

const DEFAULT_INPUT_PLACEHOLDER = '궁금하신 내용을 입력하세요.'

const inputPlaceholder = computed(() =>
  isSearchModeMissingSubOptions.value ? searchModeSubOptionsEmptyMessage.value : DEFAULT_INPUT_PLACEHOLDER,
)

interface Props {
  modelValue: string
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const props = defineProps<Props>()

const attachInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const previewItems = ref<AttachmentPreviewItem[]>([])
const isDragging = ref(false)
const isSending = ref(false)
const isSingleImageAttachment = computed(() => previewItems.value.length === 1 && previewItems.value[0]?.isImage)
const isGeminiModelSelected = computed(() => selectedModelOption.value.toLowerCase().includes('gemini'))
const currentAllowedExtensions = computed(() =>
  isGeminiModelSelected.value ? GEMINI_ALLOWED_EXTENSIONS : ATTACH_ALLOWED_EXTENSIONS,
)
const attachAccept = computed(() => currentAllowedExtensions.value.map((ext) => `.${ext}`).join(','))

const getFileExtension = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

const getFileIconClass = (fileName: string): string => {
  const ext = getFileExtension(fileName)
  if (ext === 'pdf') return 'icon-file-pdf'
  if (ext === 'doc' || ext === 'docx') return 'icon-file-doc'
  if (ext === 'txt' || ext === 'csv') return 'icon-file-txt'
  return 'icon-document'
}

const isSameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

const revokePreviewUrl = (targetId: string) => {
  const target = previewItems.value.find((item) => item.id === targetId)
  if (target?.previewUrl) {
    URL.revokeObjectURL(target.previewUrl)
  }
}

const handleAttachClick = () => {
  attachInputRef.value?.click()
}

const validateAttachmentFiles = (files: File[]) => {
  const allowedExtensionSet = isGeminiModelSelected.value ? GEMINI_ATTACH_EXTENSION_SET : ATTACH_EXTENSION_SET
  const invalidExtensions = new Set<string>()
  let hasOversizeFile = false
  let hasExceededFileCount = false

  files.forEach((file) => {
    const ext = getFileExtension(file.name)
    if (!ext || !allowedExtensionSet.has(ext)) {
      invalidExtensions.add(ext || '확장자 없음')
    }
    if (file.size > MAX_ATTACH_FILE_SIZE_BYTES) {
      hasOversizeFile = true
    }
  })

  if (files.length > MAX_ATTACH_FILE_COUNT) {
    hasExceededFileCount = true
  }

  if (invalidExtensions.size > 0) {
    openToast({
      message: `허용 형식만 첨부할 수 있습니다. (${currentAllowedExtensions.value.join(', ')})`,
      type: 'warning',
    })
    return false
  }

  if (hasOversizeFile) {
    openToast({
      message: `파일 1개당 최대 ${MAX_ATTACH_FILE_SIZE_MB}MB까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
    return false
  }

  if (hasExceededFileCount) {
    openToast({
      message: `질문당 최대 ${MAX_ATTACH_FILE_COUNT}개 파일까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
    return false
  }

  return true
}

const buildNextAttachFiles = (files: File[]) => {
  const nextFiles: File[] = []
  const allowedExtensionSet = isGeminiModelSelected.value ? GEMINI_ATTACH_EXTENSION_SET : ATTACH_EXTENSION_SET
  let hasInvalidExtension = false
  let hasOversizeFile = false
  let hasExceededFileCount = false

  files.forEach((file) => {
    if (selectedFiles.value.length + nextFiles.length >= MAX_ATTACH_FILE_COUNT) {
      hasExceededFileCount = true
      return
    }

    const ext = getFileExtension(file.name)
    if (!ext || !allowedExtensionSet.has(ext)) {
      hasInvalidExtension = true
      return
    }

    if (file.size > MAX_ATTACH_FILE_SIZE_BYTES) {
      hasOversizeFile = true
      return
    }

    if (selectedFiles.value.some((current) => isSameFile(current, file))) return
    nextFiles.push(file)
  })

  if (hasInvalidExtension) {
    openToast({
      message: `허용 형식만 첨부할 수 있습니다. (${currentAllowedExtensions.value.join(', ')})`,
      type: 'warning',
    })
  }
  if (hasOversizeFile) {
    openToast({
      message: `파일 1개당 최대 ${MAX_ATTACH_FILE_SIZE_MB}MB까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
  }
  if (hasExceededFileCount) {
    openToast({
      message: `질문당 최대 ${MAX_ATTACH_FILE_COUNT}개 파일까지 첨부할 수 있습니다.`,
      type: 'warning',
    })
  }

  return nextFiles
}

const appendAttachmentPreview = (files: File[]) => {
  const nextFiles = buildNextAttachFiles(files)

  if (nextFiles.length === 0) {
    return
  }

  const nextPreviewItems = nextFiles.map((file) => {
    const ext = getFileExtension(file.name)
    const isImage = IMAGE_EXTENSION_SET.has(ext)
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : '',
      isImage,
      iconClass: getFileIconClass(file.name),
      extensionLabel: ext ? ext.toUpperCase() : 'FILE',
    } satisfies AttachmentPreviewItem
  })

  selectedFiles.value = [...selectedFiles.value, ...nextFiles]
  previewItems.value = [...previewItems.value, ...nextPreviewItems]
}

const onAttachFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const fileList = input.files
  if (!fileList?.length) return
  appendAttachmentPreview(Array.from(fileList))
  input.value = ''
}

const onAttachDragEnter = () => {
  isDragging.value = true
}

const onAttachDragOver = () => {
  isDragging.value = true
}

const onAttachDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget) {
    isDragging.value = false
    return
  }
  if (relatedTarget && currentTarget.contains(relatedTarget)) return
  isDragging.value = false
}

const onAttachDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (!files?.length) return
  appendAttachmentPreview(Array.from(files))
}

const removeAttachment = (targetId: string) => {
  const target = previewItems.value.find((item) => item.id === targetId)
  if (!target) return
  revokePreviewUrl(targetId)
  previewItems.value = previewItems.value.filter((item) => item.id !== targetId)
  selectedFiles.value = selectedFiles.value.filter((file) => !isSameFile(file, target.file))
}

const clearAttachments = () => {
  previewItems.value.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
  })
  previewItems.value = []
  selectedFiles.value = []
}

onBeforeUnmount(() => {
  previewItems.value.forEach((item) => {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
  })
})

const handleSend = async () => {
  if (isSending.value) return
  if (isSearchModeMissingSubOptions.value) return
  if (!validateAttachmentFiles(selectedFiles.value)) return
  isSending.value = true
  try {
    let sent = false
    if (!chatRoom.value.roomId) {
      sent = await createChatRoom(props.modelValue, selectedFiles.value)
    } else {
      sent = await onSend(selectedFiles.value)
    }
    if (sent) {
      clearAttachments()
    }
  } finally {
    isSending.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 전송 중: 전송 아이콘 대신 버튼 안에 맞는 스피너 */
.btn-chat-send-spinner {
  display: block;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: chat-send-spin 0.75s linear infinite;
}

@keyframes chat-send-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

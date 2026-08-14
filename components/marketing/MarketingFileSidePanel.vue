<template>
  <UiModal
    :is-open="isOpen"
    position="right"
    max-width="400px"
    custom-class="marketing-file-side-panel"
    @close="emit('close')"
  >
    <template #header>
      <div class="modal-side-header marketing-file-side-panel__header">
        <h2 class="modal-side-title">참고 파일</h2>
        <button
          class="btn btn-modal-close"
          type="button"
          @click="emit('close')"
        >
          <i class="icon icon-close-gray size-20" />
        </button>
      </div>
    </template>

    <div
      class="marketing-file-side-panel__body"
      :class="{ 'is-dragging': isDragging, 'is-editing': !!editingFileId }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <p class="marketing-file-side-panel__desc">
        여기에 올린 파일은 프로젝트 자료실에 보관되며, 콘텐츠 생성 시 사용할 파일을 골라 참고자료로 활용할 수 있습니다.
      </p>

      <UiEmpty
        v-if="!files.length"
        icon="icon-document"
        title="첨부된 참고 파일이 없습니다."
        description="콘텐츠 생성에 참고할 파일을 추가해 주세요."
      />

      <ul
        v-else
        class="marketing-file-side-panel__list"
      >
        <li
          v-for="file in files"
          :key="file.marketingFileId"
          class="marketing-file-side-panel__item"
          :class="{ 'is-editing': editingFileId === file.marketingFileId }"
        >
          <i class="icon-document size-16" />
          <div
            v-if="editingFileId === file.marketingFileId"
            class="marketing-file-side-panel__rename"
          >
            <UiInput
              ref="renameInputRef"
              v-model="editingFileName"
              type="text"
              size="sm"
              class="marketing-file-side-panel__rename-input"
              placeholder="파일명 입력"
              @enter="onSaveRename"
            >
              <template #icon-right>
                <button
                  type="button"
                  class="marketing-file-side-panel__rename-check"
                  :disabled="!canSaveRename"
                  title="저장"
                  @click="onSaveRename"
                >
                  <i class="icon-check size-16" />
                </button>
              </template>
            </UiInput>
            <span
              v-if="editingFileExtension"
              class="marketing-file-side-panel__rename-ext"
            >
              .{{ editingFileExtension }}
            </span>
          </div>
          <button
            v-else
            type="button"
            class="marketing-file-side-panel__name"
            :title="file.fileName"
            @click="onOpenFile(file)"
          >
            {{ file.fileName }}
          </button>
          <UiDropdownMenu
            v-if="editingFileId !== file.marketingFileId"
            :items="fileMenuItems"
            align="end"
            content-class="marketing-file-side-panel-dropdown"
            @select="(value) => onFileMenuSelect(value, file)"
          >
            <template #trigger>
              <UiButton
                variant="ghost"
                size="sm"
                icon-only
                title="더보기"
              >
                <template #icon-left>
                  <i class="icon-more-vertical size-16" />
                </template>
              </UiButton>
            </template>
          </UiDropdownMenu>
        </li>
      </ul>

      <div
        v-if="!editingFileId"
        class="marketing-file-side-panel__add"
        :class="{ 'is-dragging': isDragging, 'is-disabled': isUploading }"
        role="button"
        tabindex="0"
        @click="onClickAdd"
        @keydown.enter.prevent="onClickAdd"
        @keydown.space.prevent="onClickAdd"
      >
        <i class="icon-plus size-14" />
        <span>{{ isUploading ? '업로드 중...' : isDragging ? '여기에 놓아서 첨부' : '파일 추가' }}</span>
        <input
          ref="fileInputRef"
          type="file"
          multiple
          style="display: none"
          @change="onFileChange"
        />
      </div>
    </div>
  </UiModal>

  <ChatAttachmentPreviewModal
    v-model:is-open="isPreviewOpen"
    :marketing-file-id="previewFile?.marketingFileId ?? ''"
    :file-name="previewFile?.fileName ?? ''"
    :mime-type="previewMimeType"
    @close="onClosePreview"
  />
</template>

<script setup lang="ts">
import type { MarketingFile } from '~/types/marketing'
import type { DropdownMenuItemDef } from '~/components/ui/UiDropdownMenu.vue'
import { buildFileNameWithExtension, splitFileNameBaseAndExtension } from '~/utils/chat/chatAttachmentDisplayUtil'

interface Props {
  isOpen: boolean
  files: MarketingFile[]
  isUploading?: boolean
  onRenameFile?: (marketingFileId: string, fileName: string) => Promise<boolean>
}

const props = withDefaults(defineProps<Props>(), {
  isUploading: false,
  onRenameFile: undefined,
})

const emit = defineEmits<{
  close: []
  upload: [files: File[]]
  remove: [marketingFileId: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const renameInputRef = ref<{ $el?: HTMLElement } | null>(null)
const isDragging = ref(false)
const editingFileId = ref('')
const editingFileName = ref('')
const editingFileExtension = ref('')
const isSavingRename = ref(false)
const isPreviewOpen = ref(false)
const previewFile = ref<MarketingFile | null>(null)

const fileMenuItems: DropdownMenuItemDef[] = [
  { label: '열기', value: 'open', icon: 'icon-document' },
  { label: '이름 변경', value: 'rename', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

const previewMimeType = computed(() => {
  const type = String(previewFile.value?.fileType ?? '').trim()
  if (!type) return 'application/octet-stream'
  if (type.includes('/')) return type
  const ext = type.replace(/^\./, '').toLowerCase()
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`
  if (ext === 'pdf') return 'application/pdf'
  if (['txt', 'md', 'csv', 'json'].includes(ext)) return 'text/plain'
  return 'application/octet-stream'
})

const editingOriginalName = computed(() => {
  const target = props.files.find((file) => file.marketingFileId === editingFileId.value)
  return target?.fileName.trim() ?? ''
})

const editingResolvedFileName = computed(() =>
  buildFileNameWithExtension(editingFileName.value, editingFileExtension.value),
)

const canSaveRename = computed(() => {
  const trimmed = editingFileName.value.trim()
  return !!trimmed && editingResolvedFileName.value !== editingOriginalName.value && !isSavingRename.value
})

const focusRenameInput = async () => {
  await nextTick()
  const el = renameInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null
  el?.focus()
  el?.select()
}

const onOpenFile = (file: MarketingFile) => {
  if (!file.marketingFileId) {
    openToast({ message: '파일 정보가 없습니다.', type: 'warning' })
    return
  }
  previewFile.value = file
  isPreviewOpen.value = true
}

const onClosePreview = () => {
  isPreviewOpen.value = false
  previewFile.value = null
}

const onFileMenuSelect = (value: string, file: MarketingFile) => {
  if (value === 'open') {
    onOpenFile(file)
    return
  }
  if (value === 'rename') {
    const { baseName, extension } = splitFileNameBaseAndExtension(file.fileName)
    editingFileId.value = file.marketingFileId
    editingFileName.value = baseName
    editingFileExtension.value = extension
    void focusRenameInput()
    return
  }
  if (value === 'delete') emit('remove', file.marketingFileId)
}

const onCancelRename = () => {
  editingFileId.value = ''
  editingFileName.value = ''
  editingFileExtension.value = ''
}

const onSaveRename = async () => {
  const trimmedBase = editingFileName.value.trim()
  if (!trimmedBase) {
    openToast({ message: '파일명을 입력해주세요.', type: 'warning' })
    await focusRenameInput()
    return
  }

  const nextFileName = editingResolvedFileName.value
  if (!editingFileId.value || !props.onRenameFile || nextFileName === editingOriginalName.value) {
    onCancelRename()
    return
  }

  isSavingRename.value = true
  try {
    const ok = await props.onRenameFile(editingFileId.value, nextFileName)
    if (ok) onCancelRename()
  } finally {
    isSavingRename.value = false
  }
}

const onClickAdd = () => {
  if (props.isUploading || editingFileId.value) return
  fileInputRef.value?.click()
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  emit('upload', files)
}

const hasDragFiles = (event: DragEvent) => {
  const types = event.dataTransfer?.types
  if (!types) return false
  return Array.from(types).includes('Files')
}

const onDragEnter = (event: DragEvent) => {
  if (props.isUploading || editingFileId.value || !hasDragFiles(event)) return
  isDragging.value = true
}

const onDragOver = (event: DragEvent) => {
  if (props.isUploading || editingFileId.value || !hasDragFiles(event)) return
  isDragging.value = true
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
}

const onDragLeave = (event: DragEvent) => {
  const currentTarget = event.currentTarget as HTMLElement | null
  const relatedTarget = event.relatedTarget as Node | null
  if (!currentTarget) {
    isDragging.value = false
    return
  }
  if (relatedTarget && currentTarget.contains(relatedTarget)) return
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  isDragging.value = false
  if (props.isUploading || editingFileId.value) return
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (!files.length) return
  emit('upload', files)
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      isDragging.value = false
      onCancelRename()
      onClosePreview()
    }
  },
)
</script>

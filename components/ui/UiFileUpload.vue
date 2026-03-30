<template>
  <div class="ui-file-upload">
    <!-- 드롭존 -->
    <div
      class="ui-file-upload-dropzone"
      :class="{ 'is-dragging': isDragging }"
      @click="openFilePicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <div class="ui-file-upload-icon-wrap">
        <i class="icon icon-arrow-down-gray size-24 ui-file-upload-icon" />
      </div>
      <p class="ui-file-upload-text"><span class="ui-file-upload-highlight">파일 선택</span> 또는 여기에 드래그</p>
      <p
        v-if="hint"
        class="ui-file-upload-hint"
      >
        {{ hint }}
      </p>
      <p
        v-if="maxFiles"
        class="ui-file-upload-hint"
      >
        {{ maxFiles }}개까지 첨부 가능합니다.
      </p>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      :multiple="multiple"
      :accept="accept"
      class="ui-file-upload-hidden"
      @change="onFileChange"
    />

    <!-- 파일 목록 -->
    <div
      v-if="totalFileCount > 0"
      class="ui-file-upload-list"
    >
      <div class="ui-file-upload-list-header">
        <span class="ui-file-upload-list-count">첨부파일 {{ totalFileCount }}개</span>
        <button
          v-if="modelValue.length > 0"
          type="button"
          class="ui-file-upload-clear"
          @click="$emit('update:modelValue', [])"
        >
          모두 제거
        </button>
      </div>
      <ul class="ui-file-upload-items">
        <li
          v-for="(file, idx) in attachedFileList"
          :key="`attached-${file.docFileId || idx}`"
          class="ui-file-upload-item"
        >
          <i :class="['icon', 'size-16', getFileIcon(file.fileName)]" />
          <button
            v-if="isDownloadable"
            type="button"
            class="ui-file-upload-item-name ui-file-upload-item-download"
            @click="onDownloadAttachedFile(file)"
          >
            {{ file.fileName }}
          </button>
          <span
            v-else
            class="ui-file-upload-item-name"
          >
            {{ file.fileName }}
          </span>
          <span class="ui-file-upload-item-size">{{ formatSize(Number(file.fileSize || 0)) }}</span>
          <button
            type="button"
            class="ui-file-upload-item-remove"
            @click="onRemoveAttachedFile(file, idx)"
          >
            <i class="icon icon-close size-14" />
          </button>
        </li>
        <li
          v-for="(file, idx) in modelValue"
          :key="`new-${idx}`"
          class="ui-file-upload-item"
        >
          <i :class="['icon', 'size-16', getFileIcon(file.name)]" />
          <span class="ui-file-upload-item-name">{{ file.name }}</span>
          <span class="ui-file-upload-item-size">{{ formatSize(file.size) }}</span>
          <button
            type="button"
            class="ui-file-upload-item-remove"
            @click="removeFile(idx)"
          >
            <i class="icon icon-close size-14" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFileStore } from '~/composables/com/useFileStore'
import { openAlert } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'
import type { FileItem } from '~/types/repository'

interface Props {
  modelValue: File[]
  attachedFileList?: FileItem[]
  isDownloadable?: boolean
  multiple?: boolean
  accept?: string
  hint?: string
  /** 파일당 최대 크기(바이트) */
  maxSize?: number
  /** 첨부 가능한 최대 파일 개수 (미설정 시 개수 제한 없음) */
  maxFiles?: number
  /**
   * 허용 확장자(소문자, 점 없음). 예: ['pdf','docx']
   * 설정 시 파일 선택·드래그 모두에서 확장자 검사 (accept만으로는 드래그 우회 가능)
   */
  allowedExtensions?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.hwp,.csv,.txt',
  hint: 'PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, HWP, CSV, TXT (최대 50MB)',
  maxSize: 50 * 1024 * 1024,
  maxFiles: 1,
  attachedFileList: () => [],
  isDownloadable: false,
  /** 미설정 시 확장자 제한 없음 */
  allowedExtensions: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [files: File[]]
  'remove-attached-file': [file: FileItem, index: number]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const { onDownloadFile } = useFileStore()

/** 이름·크기·수정시각으로 동일 파일 여부 판별 */
const isSameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/** 이미 등록된 첨부(서버 목록)와 파일명이 같은지 — 대소문자 무시 */
const isDuplicateAttachedFileName = (file: File) => {
  const name = file.name.trim().toLowerCase()
  return props.attachedFileList.some((item) => (item.fileName ?? '').trim().toLowerCase() === name)
}

const openFilePicker = () => {
  fileInputRef.value?.click()
}

/** 파일명에서 확장자 추출 (소문자, 점 없음) */
const getFileExtension = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

const addFiles = async (newFiles: FileList | File[]) => {
  let arr = Array.from(newFiles)

  // 파일당 용량 제한
  const overSize = arr.filter((f) => f.size > props.maxSize)
  arr = arr.filter((f) => f.size <= props.maxSize)
  if (overSize.length > 0) {
    openToast({
      message: `파일당 최대 ${formatSize(props.maxSize)}까지 첨부할 수 있습니다.`,
      type: 'error',
    })
  }
  if (arr.length === 0) return

  // 허용 확장자 (드래그 등으로 accept 우회 방지)
  const allowed = props.allowedExtensions
  if (allowed && allowed.length > 0) {
    const allowSet = new Set(allowed.map((e) => e.toLowerCase().replace(/^\./, '')))
    const invalidExt = arr.filter((f) => !allowSet.has(getFileExtension(f.name)))
    arr = arr.filter((f) => allowSet.has(getFileExtension(f.name)))
    if (invalidExt.length > 0) {
      openToast({
        message: `허용 형식만 첨부할 수 있습니다. (${[...allowSet].join(', ')})`,
        type: 'error',
      })
    }
    if (arr.length === 0) return
  }

  // 이미 등록된 첨부 목록과 파일명이 겹치는 경우
  for (const f of arr) {
    if (isDuplicateAttachedFileName(f)) {
      await openAlert({
        title: '알림',
        message: '동일한 파일명의 파일이 이미 등록되어 있습니다.',
      })
      return
    }
  }

  // 이미 목록에 있거나, 이번에 선택한 파일끼리 동일한 경우
  for (let i = 0; i < arr.length; i++) {
    const f = arr[i]
    if (props.modelValue.some((existing) => isSameFile(f, existing))) {
      openToast({ message: '동일한 파일이 이미 첨부되어 있습니다.', type: 'error' })
      return
    }
    if (arr.slice(0, i).some((prev) => isSameFile(prev, f))) {
      openToast({ message: '동일한 파일이 이미 첨부되어 있습니다.', type: 'error' })
      return
    }
  }

  // 단일 파일 모드: 마지막 선택한 파일로 교체
  if (!props.multiple) {
    emit('update:modelValue', [arr[0]])
    return
  }

  // 최대 개수 제한
  const cap = props.maxFiles
  if (typeof cap === 'number' && cap >= 1) {
    const room = cap - props.modelValue.length
    if (room <= 0) {
      openToast({ message: `최대 ${cap}개까지 첨부할 수 있습니다.`, type: 'error' })
      return
    }
    if (arr.length > room) {
      openToast({
        message: `최대 ${cap}개까지 첨부 가능합니다. ${room}개만 추가했습니다.`,
        type: 'warning',
      })
      arr = arr.slice(0, room)
    }
  }

  emit('update:modelValue', [...props.modelValue, ...arr])
}

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    addFiles(input.files)
    input.value = ''
  }
}

const onDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files?.length) {
    addFiles(e.dataTransfer.files)
  }
}

const removeFile = (idx: number) => {
  const updated = [...props.modelValue]
  updated.splice(idx, 1)
  emit('update:modelValue', updated)
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

const getFileIcon = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'icon-file-pdf'
  if (ext === 'doc' || ext === 'docx') return 'icon-file-doc'
  if (ext === 'txt' || ext === 'csv') return 'icon-file-txt'
  return 'icon-document'
}

const totalFileCount = computed(() => props.attachedFileList.length + props.modelValue.length)

const onDownloadAttachedFile = async (file: FileItem) => {
  if (!props.isDownloadable) return
  const docId = String(file.docId ?? '').trim()
  if (!docId) {
    openToast({ message: '다운로드할 파일 정보가 없습니다.', type: 'warning' })
    return
  }
  const docFileId = String(file.docFileId ?? '').trim()
  await onDownloadFile(docId, docFileId)
}

const onRemoveAttachedFile = (file: FileItem, index: number) => {
  emit('remove-attached-file', file, index)
}
</script>

<style lang="scss" scoped>
.ui-file-upload-hidden {
  display: none;
}

.ui-file-upload-dropzone {
  border: 2px dashed $color-border;
  border-radius: $border-radius-lg;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color $transition-fast,
    background-color $transition-fast;

  &:hover,
  &.is-dragging {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.04);
  }
}

.ui-file-upload-icon-wrap {
  width: 40px;
  height: 40px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: $color-background;
  display: flex;
  align-items: center;
  justify-content: center;

  .ui-file-upload-icon {
    transform: rotate(180deg);
    color: var(--color-primary);
  }
}

.ui-file-upload-text {
  @include typo($body-small);
  color: $color-text-secondary;
}

.ui-file-upload-highlight {
  font-weight: 700;
  color: var(--color-primary);
}

.ui-file-upload-hint {
  @include typo($body-xsmall);
  color: $color-text-muted;
  margin-top: 4px;
}

// 파일 목록
.ui-file-upload-list {
  margin-top: 12px;
}

.ui-file-upload-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.ui-file-upload-list-count {
  @include typo($body-small-bold);
  color: $color-text-primary;
}

.ui-file-upload-clear {
  @include typo($body-xsmall);
  color: $color-text-muted;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: $color-error;
  }
}

.ui-file-upload-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ui-file-upload-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: $border-radius-base;
  background: $color-background;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  .icon {
    flex-shrink: 0;
    color: $color-text-muted;
  }
}

.ui-file-upload-item-name {
  @include typo($body-small);
  color: $color-text-primary;
  @include ellipsis(1);
  flex: 1;
  min-width: 0;
}

.ui-file-upload-item-download {
  background: none;
  border: 0;
  text-align: left;
  cursor: pointer;
  display: block;
  width: auto;

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
}

.ui-file-upload-item-size {
  @include typo($body-xsmall);
  color: $color-text-muted;
  flex-shrink: 0;
}

.ui-file-upload-item-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text-disabled;
  padding: 2px;
  flex-shrink: 0;
  border-radius: $border-radius-sm;
  transition:
    color $transition-fast,
    background-color $transition-fast;

  &:hover {
    color: $color-error;
    background: rgba($color-error, 0.08);
  }
}
</style>

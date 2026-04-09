<template>
  <UiModal
    :is-open="isOpen"
    :title="modalTitle"
    position="center"
    :max-width="'min(96vw, 900px)'"
    custom-class="chat-attachment-preview-modal"
    @close="onClose"
  >
    <div class="chat-attachment-preview-body">
      <UiLoading
        v-if="loadStatus === 'loading'"
        overlay
        text="불러오는 중..."
      />
      <div
        v-else-if="loadStatus === 'error'"
        class="chat-attachment-preview-status is-error"
      >
        <p>{{ errorMessage }}</p>
        <UiButton
          variant="secondary"
          size="md"
          @click="loadPreview"
        >
          다시 시도
        </UiButton>
      </div>
      <iframe
        v-else-if="viewerKind === 'pdf' && viewerUrl"
        :title="modalTitle"
        class="chat-attachment-preview-iframe"
        :src="viewerUrl"
      />
      <img
        v-else-if="viewerKind === 'image' && viewerUrl"
        :src="viewerUrl"
        :alt="fileName"
        class="chat-attachment-preview-img"
      />
      <pre
        v-else-if="viewerKind === 'text'"
        class="chat-attachment-preview-text"
        >{{ textContent }}</pre
      >
      <div
        v-else-if="viewerKind === 'download'"
        class="chat-attachment-preview-status"
      >
        <p>이 형식은 브라우저에서 바로 열 수 없습니다. 다운로드하여 확인해 주세요.</p>
        <UiButton
          v-if="downloadUrl"
          variant="primary"
          size="md"
          @click="openDownload"
        >
          다운로드
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { ChatFileViewResponse } from '~/types/chat'

interface Props {
  isOpen: boolean
  chatFileId: string
  fileName: string
  mimeType: string
  /** 직전에 선택한 파일의 blob URL (이미지 등, 세션 한정) */
  localPreviewUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  localPreviewUrl: undefined,
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  close: []
}>()

const { fetchViewChatFile } = useChatApi()

const modalTitle = computed(() => props.fileName?.trim() || '첨부 미리보기')

type ViewerKind = 'idle' | 'pdf' | 'image' | 'text' | 'download'
const loadStatus = ref<'loading' | 'ready' | 'error'>('ready')
const errorMessage = ref('')
const viewerKind = ref<ViewerKind>('idle')
const viewerUrl = ref('')
const textContent = ref('')
const downloadUrl = ref('')

const onClose = () => {
  emit('update:isOpen', false)
  emit('close')
}

const resetViewer = () => {
  viewerKind.value = 'idle'
  viewerUrl.value = ''
  textContent.value = ''
  downloadUrl.value = ''
}

const applyResponse = (res: ChatFileViewResponse) => {
  const vt = String(res.viewType ?? '').toUpperCase()
  if (vt === 'IMAGE' && res.url) {
    viewerKind.value = 'image'
    viewerUrl.value = res.url
    loadStatus.value = 'ready'
    return
  }
  if (vt === 'PDF' && res.url) {
    viewerKind.value = 'pdf'
    viewerUrl.value = res.url
    loadStatus.value = 'ready'
    return
  }
  if (vt === 'TEXT') {
    viewerKind.value = 'text'
    textContent.value = res.content ?? ''
    loadStatus.value = 'ready'
    return
  }
  if (vt === 'DOWNLOAD') {
    viewerKind.value = 'download'
    downloadUrl.value = String(res.downloadUrl ?? '').trim()
    loadStatus.value = 'ready'
    return
  }
  errorMessage.value = res.reason?.trim() || '미리보기를 불러올 수 없습니다.'
  loadStatus.value = 'error'
}

const useLocalImageFirst = () => {
  const mime = String(props.mimeType ?? '')
  if (!props.localPreviewUrl || !mime.startsWith('image/')) return false
  viewerKind.value = 'image'
  viewerUrl.value = props.localPreviewUrl
  loadStatus.value = 'ready'
  return true
}

const loadPreview = async () => {
  errorMessage.value = ''
  resetViewer()
  if (!props.chatFileId?.trim()) {
    loadStatus.value = 'error'
    errorMessage.value = '파일 정보가 없습니다.'
    return
  }
  if (useLocalImageFirst()) return

  loadStatus.value = 'loading'
  try {
    const res = await fetchViewChatFile(props.chatFileId.trim())
    applyResponse(res)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '불러오기에 실패했습니다.'
    loadStatus.value = 'error'
  }
}

const openDownload = () => {
  if (!downloadUrl.value) return
  window.open(downloadUrl.value, '_blank', 'noopener,noreferrer')
}

watch(
  () => [props.isOpen, props.chatFileId] as const,
  ([open]) => {
    if (!open) {
      resetViewer()
      loadStatus.value = 'ready'
      return
    }
    void loadPreview()
  },
)
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;

.chat-attachment-preview-body {
  position: relative;
  min-height: min(70vh, 640px);
  max-height: min(70vh, 640px);
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 0 0 $border-radius-lg $border-radius-lg;
  overflow: hidden;
  width: 100%;
}

.chat-attachment-preview-iframe {
  flex: 1;
  width: 100%;
  min-height: min(70vh, 640px);
  border: 0;
  background: #fff;
}

.chat-attachment-preview-img {
  display: block;
  max-width: 100%;
  max-height: min(70vh, 640px);
  margin: 0 auto;
  object-fit: contain;
}

.chat-attachment-preview-text {
  margin: 0;
  padding: 16px;
  overflow: auto;
  max-height: min(70vh, 640px);
  @include typo($body-small);
  white-space: pre-wrap;
  word-break: break-word;
  color: $color-text-primary;
  background: #fff;
}

.chat-attachment-preview-status {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px 24px;
  text-align: center;
  @include typo($body-medium);
  color: $color-text-secondary;

  &.is-error {
    color: $color-text-primary;
  }
}

:deep(.modal-dialog-body) {
  padding: 0;
  overflow: hidden;
}
</style>

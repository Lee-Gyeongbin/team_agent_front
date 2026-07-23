<template>
  <UiModal
    :is-open="isOpen"
    position="center"
    :max-width="'min(96vw, 900px)'"
    custom-class="chat-attachment-preview-modal"
    @close="onClose"
  >
    <template #header>
      <div class="modal-dialog-header">
        <h2 class="modal-dialog-title">{{ modalTitle }}</h2>
        <div class="btn-modal-header-actions">
          <button
            v-if="canDownload"
            type="button"
            class="btn btn-modal-close"
            title="다운로드"
            :disabled="isDownloading"
            @click="onDownload"
          >
            <i class="icon icon-download size-20" />
          </button>
          <button
            type="button"
            class="btn btn-modal-close"
            title="닫기"
            @click="onClose"
          >
            <i class="icon icon-close-gray size-20" />
          </button>
        </div>
      </div>
    </template>

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
          v-if="canDownload"
          variant="primary"
          size="md"
          :disabled="isDownloading"
          @click="onDownload"
        >
          {{ isDownloading ? '다운로드 중...' : '다운로드' }}
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { ChatFileViewResponse } from '~/types/chat'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'

interface Props {
  isOpen: boolean
  chatFileId: string
  fileName: string
  mimeType: string
  /** 직전에 선택한 파일의 blob URL (이미지 등, 세션 한정) */
  localPreviewUrl?: string
  /** 공유 채팅 페이지 여부 — true 시 viewChatFile_share.do 호출 */
  isShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  localPreviewUrl: undefined,
  isShare: false,
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  close: []
}>()

const { fetchViewChatFile, fetchViewChatFileShare } = useChatApi()
const { handleDownloadByUrl } = useFileStore()

/** 공유 페이지 여부에 따라 적절한 API 호출 */
const fetchFileView = (chatFileId: string) =>
  props.isShare ? fetchViewChatFileShare(chatFileId) : fetchViewChatFile(chatFileId)

const modalTitle = computed(() => props.fileName?.trim() || '첨부 미리보기')

type ViewerKind = 'idle' | 'pdf' | 'image' | 'text' | 'download'
const loadStatus = ref<'loading' | 'ready' | 'error'>('ready')
const errorMessage = ref('')
const viewerKind = ref<ViewerKind>('idle')
const viewerUrl = ref('')
const textContent = ref('')
const downloadUrl = ref('')
const resolvedFileName = ref('')
const isDownloading = ref(false)

/** 다운로드 가능한 소스(URL 또는 텍스트)가 있을 때 */
const canDownload = computed(() => {
  if (loadStatus.value !== 'ready') return false
  if (viewerKind.value === 'text') return true
  return Boolean(downloadUrl.value || viewerUrl.value)
})

const onClose = () => {
  emit('update:isOpen', false)
  emit('close')
}

const resetViewer = () => {
  viewerKind.value = 'idle'
  viewerUrl.value = ''
  textContent.value = ''
  downloadUrl.value = ''
  resolvedFileName.value = ''
  isDownloading.value = false
}

const getDownloadFileName = (): string => {
  const name = resolvedFileName.value.trim() || props.fileName?.trim() || 'attachment'
  if (viewerKind.value === 'text' && !/\.[a-z0-9]+$/i.test(name)) {
    return `${name}.txt`
  }
  return name
}

const applyResponse = (res: ChatFileViewResponse) => {
  const vt = String(res.viewType ?? '').toUpperCase()
  const apiFileName = String(res.fileName ?? '').trim()
  if (apiFileName) resolvedFileName.value = apiFileName

  const url = String(res.url ?? '').trim()
  const dl = String(res.downloadUrl ?? '').trim()

  if (vt === 'IMAGE' && url) {
    viewerKind.value = 'image'
    viewerUrl.value = url
    downloadUrl.value = dl || url
    loadStatus.value = 'ready'
    return
  }
  if (vt === 'PDF' && url) {
    viewerKind.value = 'pdf'
    viewerUrl.value = url
    downloadUrl.value = dl || url
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
    downloadUrl.value = dl
    loadStatus.value = 'ready'
    return
  }
  errorMessage.value = res.reason?.trim() || '미리보기를 불러올 수 없습니다.'
  loadStatus.value = 'error'
}

/** chatFileId 없이 localPreviewUrl만으로 이미지 표시 (답변 인라인 base64·Pexels 등) */
const useLocalImageFirst = () => {
  const url = String(props.localPreviewUrl ?? '').trim()
  if (!url) return false

  const mime = String(props.mimeType ?? '')
  const isImageUrl = mime.startsWith('image/') || url.startsWith('data:image/') || /^https?:\/\//i.test(url)
  if (!isImageUrl) return false

  viewerKind.value = 'image'
  viewerUrl.value = url
  downloadUrl.value = url
  loadStatus.value = 'ready'
  return true
}

const loadPreview = async () => {
  errorMessage.value = ''
  resetViewer()
  if (useLocalImageFirst()) return

  if (!props.chatFileId?.trim()) {
    loadStatus.value = 'error'
    errorMessage.value = '파일 정보가 없습니다.'
    return
  }

  loadStatus.value = 'loading'
  try {
    const res = await fetchFileView(props.chatFileId.trim())
    applyResponse(res)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : '불러오기에 실패했습니다.'
    loadStatus.value = 'error'
  }
}

/** URL → Blob 저장 시도 후 실패 시 iframe 다운로드로 폴백 */
const downloadFromUrl = async (url: string, fileName: string) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('다운로드에 실패했습니다.')
    const blob = await res.blob()
    downloadBlobAsFile(blob, fileName)
    return true
  } catch {
    return handleDownloadByUrl(url)
  }
}

const onDownload = async () => {
  if (isDownloading.value || !canDownload.value) return

  const fileName = getDownloadFileName()
  isDownloading.value = true
  try {
    if (viewerKind.value === 'text') {
      const blob = new Blob([`\uFEFF${textContent.value}`], { type: 'text/plain;charset=utf-8' })
      downloadBlobAsFile(blob, fileName)
      return
    }

    const url = (downloadUrl.value || viewerUrl.value).trim()
    if (!url) {
      openToast({ message: '다운로드 URL이 없습니다.', type: 'warning' })
      return
    }

    // data: / blob: 은 fetch 없이 바로 저장
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const res = await fetch(url)
      const blob = await res.blob()
      downloadBlobAsFile(blob, fileName)
      return
    }

    const ok = await downloadFromUrl(url, fileName)
    if (!ok) {
      openToast({ message: '다운로드에 실패했습니다.', type: 'error' })
    }
  } catch (e) {
    openToast({
      message: e instanceof Error ? e.message : '다운로드에 실패했습니다.',
      type: 'error',
    })
  } finally {
    isDownloading.value = false
  }
}

watch(
  () => [props.isOpen, props.chatFileId, props.localPreviewUrl] as const,
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
@use '~/assets/styles/utils/mixins' as *;

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

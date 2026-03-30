<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    position="center"
    show-fullscreen
    :max-width="modalMaxWidth"
    custom-class="file-preview-modal"
    @close="onClose"
  >
    <div class="file-preview-modal__viewer">
      <div
        v-if="docFileOptionsList.length > 1"
        class="file-preview-modal__file-select"
      >
        <UiSelect
          id="file-preview-doc-file"
          :model-value="docFileId"
          name="file-preview-doc-file"
          :options="docFileOptionsList"
          size="lg"
          @update:model-value="onDocFileChange"
        />
      </div>
      <div class="chat-pdf-toolbar">
        <div class="chat-pdf-toolbar-center">
          <div class="chat-pdf-toolbar-group">
            <button
              class="chat-pdf-icon-btn"
              :disabled="currentPage <= 1 || !hasData"
              @click="goToPage(currentPage - 1)"
            >
              <i class="icon-arrow-left-sm size-32"></i>
            </button>
            <input
              class="chat-pdf-page-input"
              type="text"
              inputmode="numeric"
              :value="currentPage"
              :disabled="!hasData"
              @change="onPageInputChange"
              @input="onPageInput"
            />
            <span class="chat-pdf-page-total">/ {{ totalPages || 0 }}</span>
            <button
              class="chat-pdf-icon-btn"
              :disabled="currentPage >= totalPages || !hasData"
              @click="goToPage(currentPage + 1)"
            >
              <i class="icon-arrow-right-sm size-32"></i>
            </button>
          </div>
          <div class="chat-pdf-toolbar-group">
            <button
              class="chat-pdf-icon-btn"
              :disabled="!hasData"
              @click="zoomOut"
            >
              <i class="icon-minus size-32"></i>
            </button>
            <span class="chat-pdf-zoom">{{ Math.round(scale * 100) }}%</span>
            <button
              class="chat-pdf-icon-btn"
              :disabled="!hasData"
              @click="zoomIn"
            >
              <i class="icon-plus-zoom size-32"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="chat-pdf-body">
        <UiLoading
          v-if="isLoading"
          overlay
          text="PDF를 불러오는 중..."
        />

        <div
          v-else-if="loadError"
          class="chat-pdf-status is-error"
        >
          <p>{{ loadError }}</p>
          <button
            type="button"
            class="chat-pdf-toolbar-btn"
            @click="loadPdf"
          >
            다시 시도
          </button>
        </div>
        <div
          v-else-if="!hasValidIds"
          class="chat-pdf-status"
        >
          미리보기할 파일 정보가 없습니다.
        </div>
        <div
          v-else-if="!hasData && !isLoading"
          class="chat-pdf-status"
        >
          표시할 PDF가 없습니다.
        </div>
        <div
          v-else
          class="chat-pdf-content"
        >
          <div class="chat-pdf-main">
            <canvas
              ref="mainCanvasRef"
              class="chat-pdf-main-canvas"
            ></canvas>
          </div>
          <div class="chat-pdf-sidebar">
            <div
              ref="thumbListRef"
              class="chat-pdf-thumb-list"
              @scroll="onThumbListScroll"
            >
              <button
                v-for="pageNum in pageList"
                :key="pageNum"
                :ref="(el) => setThumbBtnRef(pageNum, el as HTMLElement | null)"
                class="chat-pdf-thumb"
                :class="{ 'is-active': pageNum === currentPage }"
                type="button"
                @click="goToPage(pageNum)"
              >
                <canvas
                  :ref="(el) => setThumbCanvasRef(pageNum, el as HTMLCanvasElement | null)"
                  class="chat-pdf-thumb-canvas"
                ></canvas>
                <span class="chat-pdf-thumb-label">
                  <em>{{ pageNum }}</em> / {{ totalPages }}
                </span>
              </button>
              <button
                v-show="showScrollTopBtn"
                class="chat-pdf-thumb-top-btn"
                title="맨 위로"
                type="button"
                @click="scrollThumbListToTop"
              >
                <i class="icon-arrow-down size-16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import type { FilePreviewModalProps } from '~/types/file'
import { useFileStore } from '~/composables/com/useFileStore'

const props = withDefaults(defineProps<FilePreviewModalProps>(), {
  title: '파일 미리보기',
  initialPage: 1,
  docFileOptions: () => [],
})

const emit = defineEmits<{
  close: []
  'update:isOpen': [value: boolean]
  'update:docFileId': [value: string]
}>()

const docFileOptionsList = computed(() => props.docFileOptions ?? [])

const onDocFileChange = (value: string | number) => {
  emit('update:docFileId', String(value))
}

const { handleViewFileUrl } = useFileStore()

const modalMaxWidth = 'min(96vw, 1200px)'

const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbCanvasMap = new Map<number, HTMLCanvasElement>()
const thumbBtnMap = new Map<number, HTMLElement>()
const thumbListRef = ref<HTMLElement | null>(null)
const showScrollTopBtn = ref(false)

const currentFilePath = ref('')

const hasValidIds = computed(() => Boolean(props.docId?.trim() && props.docFileId?.trim()))

const setThumbCanvasRef = (pageNum: number, el: HTMLCanvasElement | null) => {
  if (el) {
    thumbCanvasMap.set(pageNum, el)
    return
  }
  thumbCanvasMap.delete(pageNum)
}

const setThumbBtnRef = (pageNum: number, el: HTMLElement | null) => {
  if (el) {
    thumbBtnMap.set(pageNum, el)
    return
  }
  thumbBtnMap.delete(pageNum)
}

const onThumbListScroll = () => {
  const el = thumbListRef.value
  if (!el) return
  showScrollTopBtn.value = el.scrollTop > 200
}

const scrollThumbListToTop = () => {
  thumbListRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const { isLoading, loadError, currentPage, totalPages, scale, pageList, hasData, loadPdf, goToPage, zoomIn, zoomOut } =
  usePdfViewer({
    filePath: currentFilePath,
    open: toRef(() => props.isOpen),
    mainCanvasRef,
    thumbCanvasMap,
  })

const onPageInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await goToPage(Number(target.value))
}

const onPageInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  target.value = target.value.replace(/[^0-9]/g, '')
}

const onClose = () => {
  emit('update:isOpen', false)
  emit('close')
}

const loadFromApi = async () => {
  if (!props.isOpen || !hasValidIds.value) return

  const url = await handleViewFileUrl(props.docId, props.docFileId)
  currentFilePath.value = url || ''
  if (!currentFilePath.value) return

  await loadPdf()

  const target = Math.max(1, props.initialPage ?? 1)
  if (target > 1) {
    await goToPage(target)
  }
}

watch(
  () => [props.isOpen, props.docId, props.docFileId] as const,
  async ([open]) => {
    if (!open) {
      currentFilePath.value = ''
      return
    }
    await loadFromApi()
  },
)

watch(currentPage, async (page) => {
  await nextTick()
  const btn = thumbBtnMap.get(page)
  btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;

.file-preview-modal__viewer {
  display: flex;
  flex-direction: column;
  min-height: min(84vh, 900px);
  max-height: min(84vh, 900px);
  // 모달 컨텐츠의 padding(20px) + overflow hidden 조합에서
  // 가로 음수 마진(-20px)이 썸네일(옆 파일 목록) 영역을 잘라 보이게 만들 수 있음
  margin: -12px 0 -20px;
  overflow: hidden;
  border-radius: 0 0 $border-radius-lg $border-radius-lg;
}

.file-preview-modal__file-select {
  flex-shrink: 0;
  padding: 12px 16px;
  border-bottom: 1px solid #ecf0f3;
  background: #fff;
  margin-top: 10px;
}

// UiModal 본문 — PDF 뷰어가 세로로 꽉 차도록
:deep(.modal-dialog-body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  min-height: min(84vh, 900px);
  padding: 0;
  overflow: hidden;
}

:deep(.modal-dialog-content) {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
}

:deep(.modal-dialog.is-fullscreen .modal-dialog-content) {
  max-height: 100%;
}

:deep(.modal-dialog.is-fullscreen .file-preview-modal__viewer) {
  max-height: none;
  flex: 1;
  min-height: 0;
}

:deep(.modal-dialog.is-fullscreen .modal-dialog-body) {
  flex: 1;
  min-height: 0;
  max-height: none;
}
</style>

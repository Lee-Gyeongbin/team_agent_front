<template>
  <div
    class="chat-pdf-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- header -->
    <div class="chat-pdf-header">
      <span class="chat-pdf-title">관련자료</span>
      <div class="chat-pdf-header-actions">
        <button
          class="btn btn-icon"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          ></i>
        </button>
        <button
          class="btn btn-icon"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>
    <div class="chat-pdf-toolbar">
      <div class="chat-pdf-toolbar-group">
        <button
          class="chat-pdf-toolbar-btn"
          :disabled="currentPage <= 1 || !hasData"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>
        <input
          class="chat-pdf-page-input"
          type="number"
          :min="1"
          :max="totalPages"
          :value="currentPage"
          :disabled="!hasData"
          @change="onPageInputChange"
        />
        <span class="chat-pdf-page-total">/ {{ totalPages || 0 }}</span>
        <button
          class="chat-pdf-toolbar-btn"
          :disabled="currentPage >= totalPages || !hasData"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </div>
      <div class="chat-pdf-toolbar-group">
        <button
          class="chat-pdf-toolbar-btn"
          :disabled="!hasData"
          @click="zoomOut"
        >
          축소
        </button>
        <span class="chat-pdf-zoom">{{ Math.round(scale * 100) }}%</span>
        <button
          class="chat-pdf-toolbar-btn"
          :disabled="!hasData"
          @click="zoomIn"
        >
          확대
        </button>
      </div>
    </div>

    <div class="chat-pdf-body">
      <div
        v-if="isLoading"
        class="chat-pdf-status"
      >
        PDF를 불러오는 중입니다.
      </div>
      <div
        v-else-if="loadError"
        class="chat-pdf-status is-error"
      >
        <p>{{ loadError }}</p>
        <button
          class="chat-pdf-toolbar-btn"
          @click="loadPdf"
        >
          다시 시도
        </button>
      </div>
      <div
        v-else-if="!hasData"
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
          <button
            v-for="pageNum in pageList"
            :key="pageNum"
            class="chat-pdf-thumb"
            :class="{ 'is-active': pageNum === currentPage }"
            @click="goToPage(pageNum)"
          >
            <canvas
              :ref="(el) => setThumbCanvasRef(pageNum, el as HTMLCanvasElement | null)"
              class="chat-pdf-thumb-canvas"
            ></canvas>
            <span class="chat-pdf-thumb-label">{{ pageNum }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  messageId?: string | null
  filePath?: string
}

interface PdfViewport {
  width: number
  height: number
}

interface PdfPageProxy {
  getViewport: (params: { scale: number }) => PdfViewport
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => {
    promise: Promise<void>
  }
}

interface PdfDocumentProxy {
  numPages: number
  getPage: (pageNum: number) => Promise<PdfPageProxy>
}

interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (params: { url: string }) => { promise: Promise<PdfDocumentProxy> }
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib
  }
}

const props = withDefaults(defineProps<Props>(), {
  messageId: null,
  filePath: '/docs/test.pdf',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const isFullscreen = ref(false)
const mainCanvasRef = ref<HTMLCanvasElement | null>(null)

// PDF.js 내부에서 private class field(#field)를 사용하므로 Vue의 deep proxy를 피해 shallowRef 사용
const pdfDoc = shallowRef<PdfDocumentProxy | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.25)
const renderingToken = ref(0)
const pageList = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))
const hasData = computed(() => totalPages.value > 0 && !!pdfDoc.value)

let pdfjsLib: PdfJsLib | null = null
const thumbCanvasMap = new Map<number, HTMLCanvasElement>()

const setThumbCanvasRef = (pageNum: number, el: HTMLCanvasElement | null) => {
  if (el) {
    thumbCanvasMap.set(pageNum, el)
    return
  }
  thumbCanvasMap.delete(pageNum)
}

const loadPdfJs = async (): Promise<PdfJsLib> => {
  if (typeof window === 'undefined') {
    throw new Error('브라우저 환경에서만 PDF를 렌더링할 수 있습니다.')
  }
  if (pdfjsLib) return pdfjsLib

  const loaded = window.pdfjsLib
  if (loaded) {
    pdfjsLib = loaded
    return pdfjsLib
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/pdfjs/build/pdf.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PDF.js 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  pdfjsLib = window.pdfjsLib || null
  if (!pdfjsLib) {
    throw new Error('PDF.js 라이브러리를 찾을 수 없습니다.')
  }
  return pdfjsLib
}

const renderMainPage = async () => {
  if (!pdfDoc.value || !mainCanvasRef.value) return

  const token = ++renderingToken.value
  const page = await pdfDoc.value.getPage(currentPage.value)
  const viewport = page.getViewport({ scale: scale.value })
  const canvas = mainCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  await page.render({ canvasContext: ctx, viewport }).promise
  if (token !== renderingToken.value) return
}

const renderThumbnail = async (pageNum: number) => {
  if (!pdfDoc.value) return
  const canvas = thumbCanvasMap.get(pageNum)
  if (!canvas) return

  const page = await pdfDoc.value.getPage(pageNum)
  const baseViewport = page.getViewport({ scale: 1 })
  const thumbScale = Math.min(108 / baseViewport.width, 140 / baseViewport.height)
  const viewport = page.getViewport({ scale: thumbScale })
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  await page.render({ canvasContext: ctx, viewport }).promise
}

const renderAllThumbnails = async () => {
  if (!pdfDoc.value) return
  await nextTick()
  await Promise.all(pageList.value.map((pageNum) => renderThumbnail(pageNum)))
}

const loadPdf = async () => {
  if (!props.filePath || !props.open) return
  isLoading.value = true
  loadError.value = ''

  try {
    const lib = await loadPdfJs()
    lib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js'

    const loadingTask = lib.getDocument({ url: props.filePath })
    const loadedPdf = await loadingTask.promise
    pdfDoc.value = loadedPdf
    totalPages.value = loadedPdf.numPages
    currentPage.value = 1
    scale.value = 1.25
    // canvas가 DOM에 마운트되도록 isLoading을 먼저 false로 설정
    isLoading.value = false
    await nextTick()
    await renderMainPage()
    await renderAllThumbnails()
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류'
    loadError.value = `PDF 로드 실패: ${message}`
    pdfDoc.value = null
    totalPages.value = 0
  } finally {
    isLoading.value = false
  }
}

const goToPage = async (page: number) => {
  if (!pdfDoc.value) return
  const target = Math.max(1, Math.min(page, totalPages.value))
  currentPage.value = target
  await renderMainPage()
}

const onPageInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await goToPage(Number(target.value))
}

const zoomIn = async () => {
  if (!hasData.value) return
  scale.value = Math.min(4, scale.value + 0.25)
  await renderMainPage()
}

const zoomOut = async () => {
  if (!hasData.value) return
  scale.value = Math.max(0.75, scale.value - 0.25)
  await renderMainPage()
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('update:fullscreen', isFullscreen.value)
}

// 닫을 때 전체화면 해제
const onClose = () => {
  isFullscreen.value = false
  emit('update:fullscreen', false)
  emit('update:open', false)
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await loadPdf()
  },
)

watch(
  () => props.filePath,
  async () => {
    if (!props.open) return
    await loadPdf()
  },
)
</script>

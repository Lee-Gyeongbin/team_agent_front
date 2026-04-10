import type { PdfDocumentProxy } from '~/types/chat'
import { loadPdfJs } from '~/utils/chat/pdfJsLoader'

export const usePdfViewer = (options: {
  filePath: MaybeRef<string | undefined>
  open: MaybeRef<boolean>
  mainCanvasRef: Ref<HTMLCanvasElement | null>
  thumbCanvasMap: Map<number, HTMLCanvasElement>
}) => {
  const { mainCanvasRef, thumbCanvasMap } = options
  const filePath = computed(() => unref(options.filePath))
  const open = computed(() => unref(options.open))

  const pdfDoc = shallowRef<PdfDocumentProxy | null>(null)
  const isLoading = ref(false)
  const loadError = ref('')
  const currentPage = ref(1)
  const totalPages = ref(0)
  const scale = ref(1)
  const renderingToken = ref(0)
  /** loadPdf 병렬 호출 시 이전 요청 결과가 나중에 덮어쓰지 않도록 함 */
  const loadGeneration = ref(0)

  const pageList = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1))
  const hasData = computed(() => totalPages.value > 0 && !!pdfDoc.value)

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
    canvas.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`
    await page.render({ canvasContext: ctx, viewport }).promise
  }

  const renderAllThumbnails = async () => {
    if (!pdfDoc.value) return
    await nextTick()
    await Promise.all(pageList.value.map((pageNum) => renderThumbnail(pageNum)))
  }

  const loadPdf = async () => {
    if (!filePath.value || !open.value) return
    const gen = ++loadGeneration.value
    isLoading.value = true
    loadError.value = ''

    try {
      const lib = await loadPdfJs()
      lib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js'

      const loadingTask = lib.getDocument({ url: filePath.value })
      const loadedPdf = await loadingTask.promise
      if (gen !== loadGeneration.value) return

      pdfDoc.value = loadedPdf
      totalPages.value = loadedPdf.numPages
      currentPage.value = 1

      // 컨테이너 너비에 맞게 초기 스케일 계산
      const firstPage = await loadedPdf.getPage(1)
      if (gen !== loadGeneration.value) return

      const baseViewport = firstPage.getViewport({ scale: 1 })
      const container = mainCanvasRef.value?.parentElement
      const containerWidth = container ? container.clientWidth - 32 : 0 // padding 16px * 2
      if (containerWidth > 0 && baseViewport.width > containerWidth) {
        scale.value = Math.floor((containerWidth / baseViewport.width) * 4) / 4 // 0.25 단위
      } else {
        scale.value = 1
      }

      isLoading.value = false
      await nextTick()
      if (gen !== loadGeneration.value) return
      await renderMainPage()
      if (gen !== loadGeneration.value) return
      await renderAllThumbnails()
    } catch (error) {
      if (gen !== loadGeneration.value) return
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      loadError.value = `PDF 로드 실패: ${message}`
      pdfDoc.value = null
      totalPages.value = 0
    } finally {
      if (gen === loadGeneration.value) {
        isLoading.value = false
      }
    }
  }

  const goToPage = async (page: number) => {
    if (!pdfDoc.value) return
    const target = Math.max(1, Math.min(page, totalPages.value))
    currentPage.value = target
    await renderMainPage()
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

  return {
    pdfDoc,
    isLoading,
    loadError,
    currentPage,
    totalPages,
    scale,
    pageList,
    hasData,
    loadPdf,
    goToPage,
    zoomIn,
    zoomOut,
    renderAllThumbnails,
  }
}

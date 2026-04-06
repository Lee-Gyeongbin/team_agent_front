<template>
  <div
    class="chat-pdf-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- 타이틀 바 -->
    <div class="chat-pdf-title-bar">
      <span class="chat-pdf-title">관련자료</span>
      <div class="chat-pdf-title-actions">
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

    <!-- 툴바 + 탭 -->
    <div class="chat-pdf-toolbar">
      <!-- 가운데: 페이지 네비 + 줌 -->
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
      <!-- 우: 프린트 + 탭 -->
      <div class="chat-pdf-toolbar-right">
        <button
          class="chat-pdf-action-btn"
          title="인쇄"
          @click="onPrint"
        >
          <i class="icon-print size-20"></i>
        </button>
        <div class="chat-pdf-tab-group">
          <button
            class="chat-pdf-tab"
            :class="{ 'is-active': activeTab === 'related' }"
            @click="activeTab = 'related'"
          >
            관련페이지
          </button>
          <button
            class="chat-pdf-tab"
            :class="{ 'is-active': activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            전체페이지
          </button>
        </div>
      </div>
    </div>

    <div class="chat-pdf-body">
      <!-- 로딩 -->
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
          <div
            v-if="activeTab === 'all'"
            class="chat-pdf-sidebar-select"
          >
            <UiSelect
              id="pdf-doc-select"
              v-model="selectedDocKey"
              name="pdf-doc-select"
              :options="documentList"
              size="lg"
            />
          </div>
          <div
            ref="thumbListRef"
            class="chat-pdf-thumb-list"
            @scroll="onThumbListScroll"
          >
            <template v-if="activeTab === 'related'">
              <div
                v-if="relatedPageEntries.length === 0"
                class="chat-pdf-empty-related"
              >
                관련 페이지가 없습니다.
              </div>
              <button
                v-for="entry in relatedPageEntries"
                :key="entry.listKey"
                :ref="(el) => setRelatedBtnRef(entry.activeKey, el as HTMLElement | null)"
                class="chat-pdf-related-item"
                :class="{ 'is-active': isRelatedEntryActive(entry) }"
                @click="onClickRelatedEntry(entry)"
              >
                <div class="chat-pdf-related-thumb-wrap">
                  <img
                    v-if="getRelatedThumbSrc(entry)"
                    :src="getRelatedThumbSrc(entry)"
                    :alt="`${entry.docLabel} ${entry.pageNum}페이지 썸네일`"
                    class="chat-pdf-related-thumb-image"
                  />
                  <div
                    v-else
                    class="chat-pdf-related-thumb-empty"
                  >
                    {{ isRelatedThumbLoading(entry) ? '로딩 중...' : '미리보기 없음' }}
                  </div>
                </div>
                <div class="chat-pdf-related-meta">
                  <span class="chat-pdf-related-doc">{{ entry.docLabel }}</span>
                  <span class="chat-pdf-related-page">
                    <em>{{ entry.pageNum }}</em
                    >페이지
                  </span>
                </div>
              </button>
            </template>
            <template v-else>
              <button
                v-for="pageNum in displayPageList"
                :key="pageNum"
                :ref="(el) => setThumbBtnRef(pageNum, el as HTMLElement | null)"
                class="chat-pdf-thumb"
                :class="{ 'is-active': pageNum === currentPage }"
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
            </template>
            <!-- 맨 위로 버튼 -->
            <button
              v-show="showScrollTopBtn"
              class="chat-pdf-thumb-top-btn"
              title="맨 위로"
              @click="scrollThumbListToTop"
            >
              <i class="icon-arrow-down size-16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatPdfPanelProps, ChatRefRow, PdfDocumentProxy, PdfJsLib } from '~/types/chat'
import { useFileStore } from '~/composables/com/useFileStore'

const { handleViewFileUrl } = useFileStore()

const props = withDefaults(defineProps<ChatPdfPanelProps>(), {
  messageId: null,
  refList: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

// 선택된 문서 키(docId + 보기용 파일 ID)
const selectedDocKey = ref<string>('')
// 현재 PDF 실제 URL (viewFile.do → presigned URL)
const currentFilePath = ref('')

// RELATED_PAGES 파싱: "[63, 75, 88]" JSON 배열 또는 "1,3,5" 쉼표 구분 모두 대응
const parseRelatedPages = (raw: string): number[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0)
  } catch {
    return raw
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  }
  return []
}

const buildDocKey = (docId: string, docFileId: string) => `${docId}::${docFileId}`

/** viewFile.do에 넘길 파일 ID — 서버가 주면 showDocFileId 우선 */
const effectiveDocFileId = (row: ChatRefRow) => {
  const s = row.showDocFileId?.trim()
  return s || row.docFileId
}

/** 참조 목록 첫 행의 초기 페이지 (showPageNo) */
const parseInitialShowPageNo = (raw: string | undefined) => {
  if (!raw?.trim()) return 1
  const n = Number(raw.trim())
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

interface RelatedPageEntry {
  listKey: string
  activeKey: string
  docKey: string
  docLabel: string
  pageNum: number
}

// refList → UiSelect 옵션
const documentList = computed(() =>
  (props.refList ?? []).map((r) => ({
    label: r.docTitle || r.fileName,
    value: buildDocKey(r.docId, effectiveDocFileId(r)),
  })),
)

// 현재 선택된 문서 row
const selectedRef = computed(() =>
  (props.refList ?? []).find((r) => buildDocKey(r.docId, effectiveDocFileId(r)) === selectedDocKey.value),
)

// 관련페이지 탭에서 사용할 전체 파일 기준 페이지 목록
const relatedPageEntries = computed<RelatedPageEntry[]>(() =>
  (props.refList ?? []).flatMap((row) => {
    const docKey = buildDocKey(row.docId, effectiveDocFileId(row))
    const docLabel = row.docTitle || row.fileName
    return parseRelatedPages(row.relatedPages).map((pageNum, index) => ({
      listKey: `${docKey}:${pageNum}:${index}`,
      activeKey: `${docKey}:${pageNum}`,
      docKey,
      docLabel,
      pageNum,
    }))
  }),
)

const thumbListRef = ref<HTMLElement | null>(null)
const showScrollTopBtn = ref(false)

const onThumbListScroll = () => {
  if (!thumbListRef.value) return
  showScrollTopBtn.value = thumbListRef.value.scrollTop > 200
}

const scrollThumbListToTop = () => {
  thumbListRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbCanvasMap = new Map<number, HTMLCanvasElement>()
const thumbBtnMap = new Map<number, HTMLElement>()
const relatedBtnMap = new Map<string, HTMLElement>()
const pendingTargetPage = ref<number | null>(null)
const relatedThumbSrcMap = ref<Record<string, string>>({})
const relatedThumbLoadingMap = ref<Record<string, boolean>>({})
const relatedDocUrlMap = new Map<string, string>()
const relatedPdfDocMap = new Map<string, PdfDocumentProxy>()
let relatedPdfJsLib: PdfJsLib | null = null

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

const setRelatedBtnRef = (activeKey: string, el: HTMLElement | null) => {
  if (el) {
    relatedBtnMap.set(activeKey, el)
    return
  }
  relatedBtnMap.delete(activeKey)
}

const setRelatedThumbSrc = (activeKey: string, src: string) => {
  relatedThumbSrcMap.value = {
    ...relatedThumbSrcMap.value,
    [activeKey]: src,
  }
}

const setRelatedThumbLoading = (activeKey: string, isLoading: boolean) => {
  relatedThumbLoadingMap.value = {
    ...relatedThumbLoadingMap.value,
    [activeKey]: isLoading,
  }
}

const getRelatedThumbSrc = (entry: RelatedPageEntry) => relatedThumbSrcMap.value[entry.activeKey] ?? ''
const isRelatedThumbLoading = (entry: RelatedPageEntry) => relatedThumbLoadingMap.value[entry.activeKey] === true

const loadRelatedPdfJs = async (): Promise<PdfJsLib> => {
  if (typeof window === 'undefined') {
    throw new Error('브라우저 환경에서만 PDF 썸네일을 렌더링할 수 있습니다.')
  }
  if (relatedPdfJsLib) return relatedPdfJsLib

  if (window.pdfjsLib) {
    relatedPdfJsLib = window.pdfjsLib
    return relatedPdfJsLib
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = '/pdfjs/build/pdf.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PDF.js 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  relatedPdfJsLib = window.pdfjsLib || null
  if (!relatedPdfJsLib) {
    throw new Error('PDF.js 라이브러리를 찾을 수 없습니다.')
  }
  return relatedPdfJsLib
}

const getDocRowByKey = (docKey: string) =>
  (props.refList ?? []).find((r) => buildDocKey(r.docId, effectiveDocFileId(r)) === docKey)

const ensureRelatedDocUrl = async (docKey: string): Promise<string | null> => {
  const cachedUrl = relatedDocUrlMap.get(docKey)
  if (cachedUrl) return cachedUrl
  const row = getDocRowByKey(docKey)
  if (!row) return null
  const url = await handleViewFileUrl(row.docId, effectiveDocFileId(row))
  if (!url) return null
  relatedDocUrlMap.set(docKey, url)
  return url
}

const ensureRelatedPdfDoc = async (docKey: string): Promise<PdfDocumentProxy | null> => {
  const cached = relatedPdfDocMap.get(docKey)
  if (cached) return cached
  const url = await ensureRelatedDocUrl(docKey)
  if (!url) return null
  const lib = await loadRelatedPdfJs()
  lib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.js'
  const loadedPdf = await lib.getDocument({ url }).promise
  relatedPdfDocMap.set(docKey, loadedPdf)
  return loadedPdf
}

/**
 * 관련 페이지 썸네일 렌더링 (서버는 문서 URL만 주고 썸네일 생성은 브라우저에서 pdf.js+canvas로 처리)
 * @param entry 관련 페이지 엔트리
 */
const renderRelatedThumbnail = async (entry: RelatedPageEntry) => {
  if (getRelatedThumbSrc(entry) || isRelatedThumbLoading(entry)) return
  setRelatedThumbLoading(entry.activeKey, true)
  try {
    const pdfDoc = await ensureRelatedPdfDoc(entry.docKey)
    if (!pdfDoc || entry.pageNum > pdfDoc.numPages) return
    const page = await pdfDoc.getPage(entry.pageNum)
    const baseViewport = page.getViewport({ scale: 1 })
    const thumbScale = Math.min(84 / baseViewport.width, 112 / baseViewport.height)
    const viewport = page.getViewport({ scale: thumbScale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    await page.render({ canvasContext: ctx, viewport }).promise
    setRelatedThumbSrc(entry.activeKey, canvas.toDataURL('image/png'))
  } catch {
    // 썸네일 생성 실패 시 텍스트 플레이스홀더 유지
  } finally {
    setRelatedThumbLoading(entry.activeKey, false)
  }
}

const ensureRelatedThumbnails = async () => {
  const tasks = relatedPageEntries.value.map((entry) => renderRelatedThumbnail(entry))
  await Promise.all(tasks)
}

const {
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
} = usePdfViewer({
  filePath: currentFilePath,
  open: toRef(() => props.open),
  mainCanvasRef,
  thumbCanvasMap,
})

const isFullscreen = ref(false)
const activeTab = ref<'related' | 'all'>('related')

// 탭에 따라 표시할 페이지 목록 결정
const displayPageList = computed(() => pageList.value)

const buildRelatedActiveKey = (docKey: string, pageNum: number) => `${docKey}:${pageNum}`

const isRelatedEntryActive = (entry: RelatedPageEntry) =>
  entry.docKey === selectedDocKey.value && entry.pageNum === currentPage.value

const onClickRelatedEntry = async (entry: RelatedPageEntry) => {
  pendingTargetPage.value = entry.pageNum
  if (selectedDocKey.value !== entry.docKey) {
    selectedDocKey.value = entry.docKey
    return
  }
  if (!props.open) return
  if (!hasData.value) {
    await loadAndGoToTargetPage()
    return
  }
  await goToPage(entry.pageNum)
}

// PDF를 새 탭에서 열어 인쇄
const onPrint = () => {
  if (!currentFilePath.value) return
  const printWindow = window.open(currentFilePath.value, '_blank')
  printWindow?.addEventListener('load', () => {
    printWindow.print()
  })
}

const onPageInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await goToPage(Number(target.value))
}

const onPageInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  target.value = target.value.replace(/[^0-9]/g, '')
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

// presigned URL 조회 + PDF 로드 후 목표 페이지로 이동하는 헬퍼
const loadAndGoToTargetPage = async () => {
  if (!props.open || !selectedRef.value) return

  // 1) /com/file/viewFile.do 로 presigned URL 조회
  const url = await handleViewFileUrl(selectedRef.value.docId, effectiveDocFileId(selectedRef.value))
  currentFilePath.value = url || ''
  if (!currentFilePath.value) return

  // 2) PDF 로드 + 목표 페이지(관련페이지 클릭 대상 또는 첫 페이지)로 이동
  await loadPdf()
  const targetPage = pendingTargetPage.value ?? 1
  pendingTargetPage.value = null
  if (targetPage >= 1) {
    await goToPage(targetPage)
  }
}

// 패널이 열릴 때 PDF 로드
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await loadAndGoToTargetPage()
  },
)

// 선택 문서가 바뀔 때 새 PDF 로드
watch(selectedDocKey, async () => {
  if (!props.open) return
  // 전체페이지 탭에서 파일 선택 시 항상 첫 페이지부터 시작
  if (activeTab.value === 'all' && pendingTargetPage.value === null) {
    pendingTargetPage.value = 1
  }
  await loadAndGoToTargetPage()
})

// refList가 바뀌면 첫 번째 문서(showDocFileId)·초기 페이지(showPageNo)로 맞춤
watch(
  () => props.refList,
  (list) => {
    const firstRow = list?.[0]
    selectedDocKey.value = firstRow ? buildDocKey(firstRow.docId, effectiveDocFileId(firstRow)) : ''
    pendingTargetPage.value = firstRow ? parseInitialShowPageNo(firstRow.showPageNo) : null
  },
  { immediate: true },
)

// 전체페이지 탭으로 전환 시 새로 마운트된 캔버스에 썸네일 그리기 (관련페이지만 DOM에 있을 때는 1~N 캔버스가 없음)
watch(activeTab, async (tab) => {
  if (tab === 'related' && props.open) {
    await nextTick()
    void ensureRelatedThumbnails()
  }
  if (tab === 'all' && hasData.value) {
    await nextTick()
    await renderAllThumbnails()
  }
})

watch(
  () => props.refList,
  () => {
    if (activeTab.value !== 'related' || !props.open) return
    void ensureRelatedThumbnails()
  },
  { deep: true },
)

// 페이지 변경 시 해당 썸네일로 자동 스크롤
watch([currentPage, selectedDocKey, activeTab], async ([page, docKey, tab]) => {
  await nextTick()
  if (tab === 'related') {
    const relatedBtn = relatedBtnMap.get(buildRelatedActiveKey(docKey, page))
    relatedBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    return
  }
  const btn = thumbBtnMap.get(page)
  btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
</script>

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
            @input="$event.target.value = $event.target.value.replace(/[^0-9]/g, '')"
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
          <div class="chat-pdf-sidebar-select">
            <UiSelect
              id="pdf-doc-select"
              v-model="selectedDocId"
              name="pdf-doc-select"
              :options="documentList"
              size="lg"
            />
          </div>
          <div class="chat-pdf-thumb-list">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatPdfPanelProps } from '~/types/chat'
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

// 선택된 문서 ID
const selectedDocId = ref<string>('')
// 현재 PDF 실제 URL (viewFile.do → presigned URL)
const currentFilePath = ref('')

// RELATED_PAGES 파싱: "[63, 75, 88]" JSON 배열 또는 "1,3,5" 쉼표 구분 모두 대응
const parseRelatedPages = (raw: string): number[] => {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number).filter(Boolean)
  } catch {
    return raw.split(',').map(Number).filter(Boolean)
  }
  return []
}

// refList → UiSelect 옵션
const documentList = computed(() => (props.refList ?? []).map((r) => ({ label: r.docTitle, value: r.docId })))

// 현재 선택된 문서 row
const selectedRef = computed(() => (props.refList ?? []).find((r) => r.docId === selectedDocId.value))

// 현재 문서의 주요 페이지 번호
const currentMainPageNo = computed(() => selectedRef.value?.mainPageNo ?? 1)

// 현재 문서의 관련 페이지 목록
const currentRelatedPages = computed(() =>
  selectedRef.value?.relatedPages ? parseRelatedPages(selectedRef.value.relatedPages) : [],
)

const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbCanvasMap = new Map<number, HTMLCanvasElement>()
const thumbBtnMap = new Map<number, HTMLElement>()

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
const displayPageList = computed(() => {
  if (activeTab.value === 'related' && currentRelatedPages.value.length > 0) {
    return currentRelatedPages.value.filter((p) => p >= 1 && p <= totalPages.value)
  }
  return pageList.value
})

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

// presigned URL 조회 + PDF 로드 후 mainPageNo로 이동하는 헬퍼
const loadAndGoToMainPage = async () => {
  if (!props.open || !selectedDocId.value) return

  // 1) /com/file/viewFile.do 로 presigned URL 조회
  const url = await handleViewFileUrl(selectedDocId.value)
  currentFilePath.value = url || ''
  if (!currentFilePath.value) return

  // 2) PDF 로드 + mainPageNo로 이동
  activeTab.value = 'related'
  await loadPdf()
  if (currentMainPageNo.value > 1) {
    await goToPage(currentMainPageNo.value)
  }
}

// 패널이 열릴 때 PDF 로드
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await loadAndGoToMainPage()
  },
)

// 선택 문서가 바뀔 때 새 PDF 로드
watch(selectedDocId, async () => {
  if (!props.open) return
  await loadAndGoToMainPage()
})

// refList가 바뀌면 첫 번째 문서로 초기화
watch(
  () => props.refList,
  (list) => {
    selectedDocId.value = list?.[0]?.docId ?? ''
  },
  { immediate: true },
)

// 전체페이지 탭으로 전환 시 새로 마운트된 캔버스에 썸네일 그리기 (관련페이지만 DOM에 있을 때는 1~N 캔버스가 없음)
watch(activeTab, async (tab) => {
  if (tab === 'all' && hasData.value) {
    await nextTick()
    await renderAllThumbnails()
  }
})

// 페이지 변경 시 해당 썸네일로 자동 스크롤
watch(currentPage, async (page) => {
  await nextTick()
  const btn = thumbBtnMap.get(page)
  btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
</script>

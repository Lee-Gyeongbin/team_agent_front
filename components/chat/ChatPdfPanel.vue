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
            type="number"
            :min="1"
            :max="totalPages"
            :value="currentPage"
            :disabled="!hasData"
            @change="onPageInputChange"
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
              v-model="selectedDocument"
              name="pdf-doc-select"
              :options="documentList"
              size="lg"
            />
          </div>
          <div class="chat-pdf-thumb-list">
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
              <span class="chat-pdf-thumb-label">{{ pageNum }} / {{ totalPages }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatPdfPanelProps } from '~/types/chat'

const props = withDefaults(defineProps<ChatPdfPanelProps>(), {
  messageId: null,
  filePath: '/docs/test.pdf',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const mainCanvasRef = ref<HTMLCanvasElement | null>(null)
const thumbCanvasMap = new Map<number, HTMLCanvasElement>()

const setThumbCanvasRef = (pageNum: number, el: HTMLCanvasElement | null) => {
  if (el) {
    thumbCanvasMap.set(pageNum, el)
    return
  }
  thumbCanvasMap.delete(pageNum)
}

const { isLoading, loadError, currentPage, totalPages, scale, pageList, hasData, loadPdf, goToPage, zoomIn, zoomOut } =
  usePdfViewer({
    filePath: toRef(() => props.filePath),
    open: toRef(() => props.open),
    mainCanvasRef,
    thumbCanvasMap,
  })

const isFullscreen = ref(false)
const activeTab = ref<'related' | 'all'>('all')

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const selectedDocument = ref('guide')
const documentList = [
  { value: 'guide', label: '협업 업무 관리 가이드' },
  { value: 'report', label: '2024년 연간 보고서' },
  { value: 'manual', label: '시스템 운영 매뉴얼' },
  { value: 'security', label: '정보보안 정책 및 개인정보 보호 지침서' },
  { value: 'onboard', label: '신규 입사자 온보딩 안내' },
  { value: 'hr', label: '인사규정 개정안 (2024.12)' },
  { value: 'infra', label: 'IT 인프라 구성도' },
]

// PDF를 새 탭에서 열어 인쇄
const onPrint = () => {
  if (!props.filePath) return
  const printWindow = window.open(props.filePath, '_blank')
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

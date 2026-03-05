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

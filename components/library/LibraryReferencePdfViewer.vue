<template>
  <div class="library-reference-pdf">
    <div class="chat-pdf-toolbar">
      <div class="chat-pdf-toolbar-center">
        <div class="chat-pdf-toolbar-group">
          <button
            class="chat-pdf-icon-btn"
            type="button"
            :disabled="!canGoRelatedPrev"
            @click="onRelatedPrev"
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
            type="button"
            :disabled="!canGoRelatedNext"
            @click="onRelatedNext"
          >
            <i class="icon-arrow-right-sm size-32"></i>
          </button>
        </div>
        <div class="chat-pdf-toolbar-group">
          <button
            class="chat-pdf-icon-btn"
            type="button"
            :disabled="!hasData"
            @click="zoomOut"
          >
            <i class="icon-minus size-32"></i>
          </button>
          <span class="chat-pdf-zoom">{{ Math.round(scale * 100) }}%</span>
          <button
            class="chat-pdf-icon-btn"
            type="button"
            :disabled="!hasData"
            @click="zoomIn"
          >
            <i class="icon-plus-zoom size-32"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="library-reference-pdf-body chat-pdf-body">
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
          @click="loadPdfFromItem"
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
            v-if="displayPageList.length === 0"
            class="library-reference-pdf-sidebar-empty"
          >
            관련 페이지 정보가 없습니다.
          </div>
          <div
            v-else
            ref="thumbListRef"
            class="chat-pdf-thumb-list"
            @scroll="onThumbListScroll"
          >
            <button
              v-for="pageNum in displayPageList"
              :key="pageNum"
              type="button"
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
            <button
              v-show="showScrollTopBtn"
              class="chat-pdf-thumb-top-btn"
              type="button"
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
import type { DocItem } from '~/types/library'
import { useFileStore } from '~/composables/com/useFileStore'

const props = defineProps<{
  item: DocItem
  open: boolean
}>()

const { handleViewFileUrl } = useFileStore()

// RELATED_PAGES 파싱: "[63, 75, 88]" JSON 배열 또는 "1,3,5" 쉼표 구분 (ChatPdfPanel과 동일)
const parseRelatedPages = (raw: string): number[] => {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(Number).filter(Boolean)
  } catch {
    return raw.split(',').map(Number).filter(Boolean)
  }
  return []
}

const rawRelatedPages = computed(() => (props.item?.relatedPages ? parseRelatedPages(props.item.relatedPages) : []))

const currentFilePath = ref('')

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

// 로드 후 총 페이지에 맞춰 필터 (관련 페이지만)
const effectiveRelatedPages = computed(() => {
  if (!totalPages.value) return []
  return rawRelatedPages.value.filter((p) => p >= 1 && p <= totalPages.value)
})

const displayPageList = computed(() => effectiveRelatedPages.value)

const relatedIndex = computed(() => {
  const list = effectiveRelatedPages.value
  return list.indexOf(currentPage.value)
})

const canGoRelatedPrev = computed(() => {
  if (!hasData.value) return false
  const list = effectiveRelatedPages.value
  if (list.length === 0) return false
  return relatedIndex.value > 0
})

const canGoRelatedNext = computed(() => {
  if (!hasData.value) return false
  const list = effectiveRelatedPages.value
  if (list.length === 0) return false
  return relatedIndex.value >= 0 && relatedIndex.value < list.length - 1
})

const onRelatedPrev = async () => {
  const list = effectiveRelatedPages.value
  if (list.length === 0) return
  const idx = relatedIndex.value
  if (idx <= 0) return
  await goToPage(list[idx - 1])
}

const onRelatedNext = async () => {
  const list = effectiveRelatedPages.value
  if (list.length === 0) return
  const idx = relatedIndex.value
  if (idx < 0 || idx >= list.length - 1) return
  await goToPage(list[idx + 1])
}

const snapToRelatedOrValidPage = async (raw: number) => {
  const list = effectiveRelatedPages.value
  const max = totalPages.value
  if (list.length === 0) {
    await goToPage(Math.min(Math.max(1, raw), max))
    return
  }
  let best = list[0]
  let bestDiff = Math.abs(best - raw)
  for (const p of list) {
    const d = Math.abs(p - raw)
    if (d < bestDiff) {
      best = p
      bestDiff = d
    }
  }
  await goToPage(best)
}

const onPageInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const n = Number(target.value)
  if (!Number.isFinite(n)) return
  await snapToRelatedOrValidPage(n)
}

const onPageInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  target.value = target.value.replace(/[^0-9]/g, '')
}

const loadPdfFromItem = async () => {
  if (!props.open) return

  const url = await handleViewFileUrl(props.item.docId, props.item.docFileId)
  currentFilePath.value = url || ''
  if (!currentFilePath.value) return

  await loadPdf()
  await nextTick()
  const list = effectiveRelatedPages.value
  if (list.length > 0) {
    await goToPage(list[0])
  }
  await nextTick()
  await renderAllThumbnails()
}

watch(
  () => [props.open, props.item.docId, props.item.docFileId] as const,
  async ([open]) => {
    if (!open) {
      currentFilePath.value = ''
      return
    }
    await loadPdfFromItem()
  },
  { immediate: true },
)

watch(currentPage, async (page) => {
  await nextTick()
  const btn = thumbBtnMap.get(page)
  btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/utils/variables' as *;

.library-reference-pdf {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  max-height: min(420px, 50vh);
  min-height: 280px;

  :deep(.chat-pdf-toolbar) {
    flex-shrink: 0;
  }
}

.library-reference-pdf-body {
  flex: 1;
  min-height: 0;
}

.library-reference-pdf-sidebar-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  text-align: center;
  line-height: 150%;
}
</style>

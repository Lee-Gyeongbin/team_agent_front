<template>
  <aside
    class="my-doc-preview-panel"
    aria-label="문서 미리보기"
  >
    <div class="my-doc-preview-panel-frame">
      <div class="my-doc-preview-panel-head">
        <div class="my-doc-preview-panel-head-row">
          <span class="my-doc-preview-panel-icon-wrap">
            <i class="icon icon-document size-16" />
          </span>
          <div class="my-doc-preview-panel-head-text">
            <h2 class="my-doc-preview-panel-title">문서 미리보기</h2>
          </div>
        </div>
        <p
          v-if="doc"
          class="my-doc-preview-panel-sub"
        >
          {{ doc.docNm }}
        </p>
        <p
          v-else
          class="my-doc-preview-panel-hint"
        >
          카드에 마우스를 올리면 내용이 표시됩니다
        </p>
      </div>

      <div class="my-doc-preview-panel-body">
        <UiEmpty
          v-if="!doc"
          icon="icon-document"
          title="미리보기할 문서를 선택하세요"
          description="목록에서 문서 카드에 마우스를 올려 보세요."
        />

        <UiEmpty
          v-else-if="!hasPreviewHtml"
          icon="icon-document"
          title="미리보기를 표시할 수 없습니다"
          description="저장된 문서 HTML이 없습니다."
        />

        <div
          v-else
          class="my-doc-preview-panel-viewport"
        >
          <div
            v-if="docDateLabel"
            class="my-doc-preview-panel-meta"
          >
            {{ docDateLabel }}
          </div>

          <div
            ref="scalerRef"
            class="my-doc-preview-panel-scaler"
          >
            <!-- eslint-disable-next-line vue/no-v-html — sanitizeMyDocPreviewHtml(DOMPurify) 적용 -->
            <div
              class="my-doc-preview-panel-content library-report-editor-body"
              :style="contentStyle"
              v-html="sanitizedHtml"
            />
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { MyDoc } from '~/types/mydoc'
import {
  getMyDocPreviewWidthFitScale,
  MY_DOC_PREVIEW_BASE_WIDTH,
  sanitizeMyDocPreviewHtml,
} from '~/utils/myDocuments/myDocPreviewUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'

interface Props {
  doc?: MyDoc | null
}

const props = withDefaults(defineProps<Props>(), {
  doc: null,
})

const scalerRef = ref<HTMLElement | null>(null)
const viewportWidth = ref(0)

const sanitizedHtml = computed(() => sanitizeMyDocPreviewHtml(props.doc?.docHtml))
const hasPreviewHtml = computed(() => !!sanitizedHtml.value)

const docDateLabel = computed(() => {
  if (!props.doc) return ''
  return formatDateTimeDisplay(props.doc.modifyDt || props.doc.createDt)
})

const activeScale = computed(() => {
  if (viewportWidth.value <= 0) return 0.4
  return getMyDocPreviewWidthFitScale(viewportWidth.value, MY_DOC_PREVIEW_BASE_WIDTH)
})

const fitOffsetX = computed(() => {
  if (!viewportWidth.value) return 0
  const scaledWidth = MY_DOC_PREVIEW_BASE_WIDTH * activeScale.value
  return Math.max(0, (viewportWidth.value - scaledWidth) / 2)
})

const contentStyle = computed(() => ({
  width: `${MY_DOC_PREVIEW_BASE_WIDTH}px`,
  transform: `translate(${fitOffsetX.value}px, 0) scale(${activeScale.value})`,
}))

const measurePreview = () => {
  if (!scalerRef.value) return
  viewportWidth.value = scalerRef.value.clientWidth
}

let resizeObserver: ResizeObserver | null = null

watch(
  () => [props.doc?.docId, sanitizedHtml.value] as const,
  async () => {
    await nextTick()
    measurePreview()
  },
)

onMounted(() => {
  measurePreview()
  resizeObserver = new ResizeObserver(() => {
    measurePreview()
  })
})

watch(scalerRef, (el, _prev, onCleanup) => {
  if (!resizeObserver || !el) return
  resizeObserver.observe(el)
  onCleanup(() => {
    resizeObserver?.unobserve(el)
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

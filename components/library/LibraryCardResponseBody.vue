<template>
  <div class="library-card-response-body">
    <ChatLunchAgentCard
      v-if="isLunchAgentResponse"
      readonly
      display-mode="result"
      :recommendations="lunchList"
      :enrichment-cache-key="lunchImageCacheKey"
      :enrichment-r-content="lunchEnrichmentRContent"
      :theme-icon-class-nm="item.iconClassNm ?? ''"
      :theme-color-hex="item.colorHex ?? ''"
    />
    <!-- eslint-disable vue/no-v-html — toHtmlContent 내 안전 처리 적용 -->
    <template v-else-if="isPsychologyRadarResponse">
      <div
        class="message-content markdown-body library-psychology-markdown"
        @click="onPsychologyMarkdownClick"
        v-html="psychologyBeforeChartHtml"
      />
      <div
        v-if="psychologyRadarLoading"
        class="pexels-loading library-psychology-chart-loading"
      >
        <div class="pexels-loading__spinner" />
      </div>
      <div
        v-else-if="psychologyRadarData"
        class="library-psychology-radar-block"
      >
        <div class="library-psychology-radar-chart">
          <UiChart
            type="radar"
            :config="psychologyRadarChartConfig"
          />
        </div>
        <div class="library-psychology-radar-metrics">
          <StressScoreGrid
            :items="psychologyStressItems"
            :core-areas-text="psychologyRadarData.coreAreasSummary"
            :risk-summary="psychologyRadarData.riskSummary"
            :risk-color="psychologyRadarData.riskColor"
          />
        </div>
      </div>
      <div
        class="message-content markdown-body library-psychology-markdown"
        @click="onPsychologyMarkdownClick"
        v-html="psychologyAfterChartHtml"
      />
    </template>
    <div
      v-else
      class="message-content markdown-body"
      v-html="responseRenderedHtml"
    />
    <!-- eslint-enable vue/no-v-html -->

    <Teleport to="body">
      <Transition name="pexels-modal">
        <div
          v-if="pexelsModalUrl"
          class="pexels-modal"
          @click.self="pexelsModalUrl = ''"
        >
          <button
            class="pexels-modal__close"
            type="button"
            @click="pexelsModalUrl = ''"
          >
            <i class="icon-close size-20"></i>
          </button>
          <img
            class="pexels-modal__img"
            :src="pexelsModalUrl"
            alt="확대 이미지"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'
import type { StressScoreItem } from '~/types/stress'
import type { LibraryCardDetail } from '~/types/library'
import {
  getLunchImageEnrichmentCacheKey,
  LUNCH_AGENT_ID,
  normalizeLunchRecommendationImages,
  parseLunchJsonArray,
} from '~/utils/chat/lunchAgentUtil'
import {
  parseSurveyAnswersFromPrompt,
  extractAiImageMarkerSection,
  extractSections1to4,
  fetchPsychologyRadarChartData,
  getRadarChartCache,
  setRadarChartCache,
  schedulePsychologyRadarUiInjection,
  buildStressItemsFromRadarChartData,
  buildPsychologyRadarUiChartConfig,
  removeKeywordLines,
  extractKeywordSection,
  PEXELS_LOADING_HTML,
  fetchAndInjectPexelsImages,
  type RadarChartData,
} from '~/utils/chat/psychologyConsultUtil'

const props = defineProps<{
  item: LibraryCardDetail
}>()

const lunchEnrichmentRContent = computed(() => String(props.item.rcontent ?? '').trim())

const lunchImageCacheKey = computed(() => {
  const fromLog = getLunchImageEnrichmentCacheKey({ logId: props.item.logId })
  if (fromLog) return fromLog
  return String(props.item.cardId ?? '').trim()
})

const lunchList = computed(() => {
  if (props.item.agentId !== LUNCH_AGENT_ID) return []
  const raw = lunchEnrichmentRContent.value
  if (!raw) return []
  return parseLunchJsonArray(raw)
})

const isLunchAgentResponse = computed(() => props.item.agentId === LUNCH_AGENT_ID && lunchList.value.length > 0)

const responseRenderedHtml = computed(() => {
  const raw = props.item.rcontent ?? ''
  if (props.item.agentId === 'AG000010') {
    return toHtmlContent(removeKeywordLines(raw))
  }
  return toHtmlContent(raw)
})

// ── AG000010 방사형 차트 (LibraryDetailModal 과 동일 로직) ──
const psychologyMarkerFound = ref(false)
const psychologyBeforeChartHtml = ref('')
const psychologyAfterChartHtml = ref('')
const psychologyRadarLoading = ref(false)
const psychologyRadarData = ref<RadarChartData | null>(null)
let cancelPsychologyRadarInjection: (() => void) | null = null

const isPsychologyRadarResponse = computed(() => props.item.agentId === 'AG000010' && psychologyMarkerFound.value)

const psychologyStressItems = computed<StressScoreItem[]>(() =>
  psychologyRadarData.value ? buildStressItemsFromRadarChartData(psychologyRadarData.value) : [],
)

const psychologyRadarChartConfig = computed<Record<string, unknown>>(() =>
  psychologyRadarData.value ? buildPsychologyRadarUiChartConfig(psychologyRadarData.value) : {},
)

const pexelsModalUrl = ref('')
const onPsychologyMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG' && target.classList.contains('pexels-img')) {
    pexelsModalUrl.value = (target as HTMLImageElement).dataset.full ?? (target as HTMLImageElement).src
  }
}

onBeforeUnmount(() => {
  cancelPsychologyRadarInjection?.()
  cancelPsychologyRadarInjection = null
  pexelsModalUrl.value = ''
})

watch(
  () =>
    [
      props.item.cardId ?? '',
      props.item.agentId ?? '',
      props.item.rcontent ?? '',
      props.item.qcontent ?? '',
      props.item.logId ?? '',
    ] as const,
  ([cardId, agentId, rcontent, qcontent, logId]) => {
    pexelsModalUrl.value = ''
    cancelPsychologyRadarInjection?.()
    cancelPsychologyRadarInjection = null
    psychologyMarkerFound.value = false
    psychologyBeforeChartHtml.value = ''
    psychologyAfterChartHtml.value = ''
    psychologyRadarData.value = null
    psychologyRadarLoading.value = false

    if (!cardId || agentId !== 'AG000010') return

    const { found, before, after } = extractAiImageMarkerSection(rcontent)
    if (!found) return

    psychologyMarkerFound.value = true
    psychologyBeforeChartHtml.value = toHtmlContent(removeKeywordLines(before))

    const answers = parseSurveyAnswersFromPrompt(qcontent)
    const cacheKey = logId || cardId

    psychologyRadarLoading.value = true
    const cached = getRadarChartCache(cacheKey)
    if (cached) {
      const keyForInject = cacheKey
      cancelPsychologyRadarInjection = schedulePsychologyRadarUiInjection(() => {
        const curKey = props.item.logId || props.item.cardId || ''
        if (curKey !== keyForInject) return
        psychologyRadarData.value = cached
        psychologyRadarLoading.value = false
      })
    } else {
      fetchPsychologyRadarChartData(extractSections1to4(rcontent), answers).then((chartData) => {
        psychologyRadarLoading.value = false
        if ((props.item.cardId ?? '') !== cardId) return
        if (chartData) {
          setRadarChartCache(cacheKey, chartData)
          psychologyRadarData.value = chartData
        }
      })
    }

    const { beforeText, afterText } = extractKeywordSection(after)
    psychologyAfterChartHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)
    fetchAndInjectPexelsImages(after, cacheKey).then(({ beforeText: bt, afterText: at, gridHtml }) => {
      if ((props.item.cardId ?? '') !== cardId) return
      psychologyAfterChartHtml.value = toHtmlContent(bt) + gridHtml + toHtmlContent(at)
    })
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.library-card-response-body {
  width: 100%;
}

// 방사형 차트 + StressScoreGrid — 채팅 대비 약 70% (403×224, 그리드 zoom 0.7)
.library-psychology-radar-block {
  max-width: 100%;
  width: 100%;
  margin: 12px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.library-psychology-radar-chart {
  width: 403px;
  max-width: 100%;
  height: 224px;
  margin-left: auto;
  margin-right: auto;
  flex-shrink: 0;
}

.library-psychology-radar-chart :deep(.ui-chart) {
  height: 100%;
  min-height: 0;
}

.library-psychology-radar-chart :deep(.ui-chart-canvas-wrap) {
  min-height: 0;
  flex: 1;
}

.library-psychology-radar-metrics {
  width: 576px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  zoom: 0.7;
}

.library-psychology-chart-loading {
  height: 224px;
  max-width: 403px;
  margin: 12px auto;
}

.library-psychology-markdown {
  :deep(.pexels-loading) {
    height: 140px;
    max-width: 288px;
    margin: 12px auto;
  }

  :deep(.pexels-grid) {
    display: flex;
    gap: 8px;
    margin: 12px auto;
    height: 140px;
    max-width: 288px;
  }

  :deep(.pexels-grid__col) {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.pexels-grid__col .pexels-img) {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: none;
    margin: 0;
    object-fit: cover;
    border-radius: 12px;
    cursor: zoom-in;
    transition: opacity 0.15s;
  }

  :deep(.pexels-grid__col .pexels-img:hover) {
    opacity: 0.85;
  }

  :deep(.pexels-grid--single) {
    height: auto;
    max-width: 288px;
  }

  :deep(.pexels-grid--single .pexels-img) {
    width: 100%;
    max-width: 288px;
    height: 140px;
    margin: 0;
    object-fit: cover;
    border-radius: 12px;
    cursor: zoom-in;
  }
}
</style>

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
    <ChatNewsCurator
      v-else-if="isNewsCuratorResponse"
      readonly
      display-mode="result"
      :news-is-new="newsIsNewFromLog"
      :news-items="newsList"
      :locked-selected-categories="newsSelectedCategories"
      :theme-icon-class-nm="item.iconClassNm ?? ''"
      :theme-color-hex="item.colorHex ?? ''"
    />
    <ChatTodayMeme
      v-else-if="isTodayMemeResponse"
      readonly
      :meme-items="memeList"
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
      v-else-if="isSurveyPexelsOnlyResponse"
      class="message-content markdown-body library-psychology-markdown"
      @click="onPsychologyMarkdownClick"
      v-html="surveyPexelsOnlyHtml"
    />
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
import { getLunchImageEnrichmentCacheKey, LUNCH_AGENT_ID, parseLunchJsonArray } from '~/utils/chat/lunchAgentUtil'
import { NEWS_CURATOR_AGENT_ID, parseNewsCuratorItems, parseNewsCuratorPromptMeta } from '~/utils/chat/newsCuratorUtil'
import { isTodayMemeLibraryCard, parseTodayMemeItems } from '~/utils/chat/todayMemeUtil'
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
  hasImageKeywordLines,
  usePsychologySurvey,
  isSurveyRadarAgentById,
  isSurveyRadarLibraryCard,
  shouldLibrarySurveyPexelsInject,
  resolveSurveyConfigByAgentId,
  setActiveSurveyConfig,
  type RadarChartData,
} from '~/utils/chat/surveyUtil'

const { surveyGender } = usePsychologySurvey()
const { chatIndexAgents } = useChatStore()

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

const newsPromptMeta = computed(() =>
  props.item.agentId === NEWS_CURATOR_AGENT_ID
    ? parseNewsCuratorPromptMeta(props.item.qcontent ?? '')
    : { categories: [] as string[], isNew: undefined as boolean | undefined },
)

const newsSelectedCategories = computed(() => newsPromptMeta.value.categories)

const newsIsNewFromLog = computed(
  () => props.item.agentId === NEWS_CURATOR_AGENT_ID && newsPromptMeta.value.isNew === true,
)

const newsList = computed(() => {
  if (props.item.agentId !== NEWS_CURATOR_AGENT_ID) return []
  const raw = String(props.item.rcontent ?? '').trim()
  if (!raw) return []
  return parseNewsCuratorItems(raw)
})

const isNewsCuratorResponse = computed(
  () =>
    props.item.agentId === NEWS_CURATOR_AGENT_ID &&
    (newsList.value.length > 0 || newsSelectedCategories.value.length > 0),
)

const memeList = computed(() => {
  if (!isTodayMemeLibraryCard(props.item)) return []
  const raw = String(props.item.rcontent ?? '').trim()
  if (!raw) return []
  return parseTodayMemeItems(raw)
})

const isTodayMemeResponse = computed(() => isTodayMemeLibraryCard(props.item) && memeList.value.length > 0)

const isSurveyRadarCard = (agentId: string, qcontent: string) =>
  isSurveyRadarLibraryCard(agentId, qcontent, chatIndexAgents.value)

const responseRenderedHtml = computed(() => {
  const raw = props.item.rcontent ?? ''
  const agentId = props.item.agentId ?? ''
  const qcontent = props.item.qcontent ?? ''
  if (
    isSurveyRadarCard(agentId, qcontent) ||
    shouldLibrarySurveyPexelsInject(agentId, qcontent, raw, chatIndexAgents.value)
  ) {
    return toHtmlContent(removeKeywordLines(raw))
  }
  return toHtmlContent(raw)
})

// ── SURVEY(showPexelsRecoveryImages) — 방사형 차트 없이 Pexels만 ──
const surveyPexelsOnlyHtml = ref('')
const isSurveyPexelsOnlyResponse = ref(false)

// ── SURVEY(showRadarChart) 방사형 차트 ──
const psychologyMarkerFound = ref(false)
const psychologyBeforeChartHtml = ref('')
const psychologyAfterChartHtml = ref('')
const psychologyRadarLoading = ref(false)
const psychologyRadarData = ref<RadarChartData | null>(null)
let cancelPsychologyRadarInjection: (() => void) | null = null
let isLibraryCardAlive = true

const isPsychologyRadarResponse = computed(
  () =>
    isSurveyRadarCard(props.item.agentId ?? '', props.item.qcontent ?? '') && psychologyMarkerFound.value,
)

const injectLibraryPexelsHtml = (raw: string, cacheKey: string) => {
  if (!hasImageKeywordLines(raw)) {
    surveyPexelsOnlyHtml.value = toHtmlContent(raw)
    return
  }
  const { beforeText, afterText } = extractKeywordSection(raw)
  surveyPexelsOnlyHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)
  fetchAndInjectPexelsImages(raw, cacheKey).then(({ beforeText: bt, afterText: at, gridHtml }) => {
    if (!isLibraryCardAlive) return
    const curKey = props.item.logId || props.item.cardId || ''
    if (curKey !== cacheKey) return
    surveyPexelsOnlyHtml.value = toHtmlContent(bt) + gridHtml + toHtmlContent(at)
  })
}

const psychologyStressItems = computed<StressScoreItem[]>(() =>
  psychologyRadarData.value ? buildStressItemsFromRadarChartData(psychologyRadarData.value, surveyGender.value) : [],
)

const psychologyRadarChartConfig = computed<Record<string, unknown>>(() =>
  psychologyRadarData.value ? buildPsychologyRadarUiChartConfig(psychologyRadarData.value, surveyGender.value) : {},
)

const pexelsModalUrl = ref('')
const onPsychologyMarkdownClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG' && target.classList.contains('pexels-img')) {
    pexelsModalUrl.value = (target as HTMLImageElement).dataset.full ?? (target as HTMLImageElement).src
  }
}

onBeforeUnmount(() => {
  isLibraryCardAlive = false
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
      chatIndexAgents.value.map((a) => a.agentId).join(','),
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
    isSurveyPexelsOnlyResponse.value = false
    surveyPexelsOnlyHtml.value = ''

    if (!cardId) return

    const surveyConfig = resolveSurveyConfigByAgentId(agentId, chatIndexAgents.value)
    if (surveyConfig) setActiveSurveyConfig(surveyConfig)

    const cacheKey = logId || cardId
    const isRadar = isSurveyRadarAgentById(agentId, chatIndexAgents.value)
    const isPexels = shouldLibrarySurveyPexelsInject(agentId, qcontent, rcontent, chatIndexAgents.value)

    // showRadarChart: false + showPexelsRecoveryImages: true (디지털 과부하 등)
    if (!isRadar && isPexels) {
      isSurveyPexelsOnlyResponse.value = true
      injectLibraryPexelsHtml(rcontent, cacheKey)
      return
    }

    if (!isSurveyRadarCard(agentId, qcontent)) return

    const { found, before, after } = extractAiImageMarkerSection(rcontent)
    if (!found) return

    psychologyMarkerFound.value = true
    psychologyBeforeChartHtml.value = toHtmlContent(removeKeywordLines(before))

    const answers = parseSurveyAnswersFromPrompt(qcontent)

    psychologyRadarLoading.value = true
    const cached = getRadarChartCache(cacheKey)
    if (cached) {
      const keyForInject = cacheKey
      cancelPsychologyRadarInjection = schedulePsychologyRadarUiInjection(() => {
        if (!isLibraryCardAlive) return
        const curKey = props.item.logId || props.item.cardId || ''
        if (curKey !== keyForInject) return
        psychologyRadarData.value = cached
        psychologyRadarLoading.value = false
      })
    } else {
      fetchPsychologyRadarChartData(extractSections1to4(rcontent), answers, surveyGender.value).then((chartData) => {
        if (!isLibraryCardAlive || (props.item.cardId ?? '') !== cardId) return
        psychologyRadarLoading.value = false
        if (chartData) {
          setRadarChartCache(cacheKey, chartData)
          psychologyRadarData.value = chartData
        }
      })
    }

    const { beforeText, afterText } = extractKeywordSection(after)
    psychologyAfterChartHtml.value = toHtmlContent(beforeText) + PEXELS_LOADING_HTML + toHtmlContent(afterText)
    fetchAndInjectPexelsImages(after, cacheKey).then(({ beforeText: bt, afterText: at, gridHtml }) => {
      if (!isLibraryCardAlive || (props.item.cardId ?? '') !== cardId) return
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

  :deep(.pexels-grid__col .pexels-img-wrap) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  :deep(.pexels-grid__col .pexels-img-wrap .pexels-img) {
    flex: 1;
    min-height: 0;
    width: 100%;
    max-width: none;
    object-fit: cover;
    border-radius: 12px;
    cursor: zoom-in;
    transition: opacity 0.15s;
  }

  :deep(.pexels-grid__col .pexels-img-wrap .pexels-img:hover) {
    opacity: 0.85;
  }

  :deep(.pexels-grid__col .pexels-img-wrap .pexels-attribution) {
    font-size: 10px;
    color: var(--color-text-secondary, #888);
    text-decoration: none;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :deep(.pexels-grid--single) {
    height: auto;
    max-width: 288px;
  }

  :deep(.pexels-grid--single .pexels-img-wrap .pexels-img) {
    width: 100%;
    max-width: 288px;
    height: 140px;
    object-fit: cover;
    border-radius: 12px;
    cursor: zoom-in;
  }

  :deep(.pexels-grid--single .pexels-img-wrap .pexels-attribution) {
    max-width: 288px;
  }
}
</style>

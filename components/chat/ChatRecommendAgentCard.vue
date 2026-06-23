<template>
  <section
    class="chat-recommend-agent-card"
    :class="{
      'is-readonly': props.readonly,
      'is-intro-playing': isIntroPlaying || (isRecommendationsPending && !isFormOnlyCard),
      'is-content-visible': isContentVisible,
      'is-result-phase': hasResultRecommendations && !isFormOnlyCard,
    }"
    :style="themeStyle"
  >
    <Transition name="agent-intro">
      <div
        v-if="isIntroPlaying && !isRecommendationsPending"
        class="chat-recommend-agent-card__intro"
        aria-live="polite"
      >
        <div class="chat-recommend-agent-card__intro-inner">
          <div class="chat-recommend-agent-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <p class="chat-recommend-agent-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`intro-title-${index}`"
              class="chat-recommend-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
          <p class="chat-recommend-agent-card__intro-subtitle">
            <span
              v-for="(char, index) in introSubtitleChars"
              :key="`intro-subtitle-${index}`"
              class="chat-recommend-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
        </div>
      </div>
    </Transition>

    <Transition name="agent-intro">
      <div
        v-if="isRecommendationsPending && !isFormOnlyCard"
        class="chat-recommend-agent-card__intro"
        aria-live="polite"
      >
        <div class="chat-recommend-agent-card__intro-inner">
          <div class="chat-recommend-agent-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <p class="chat-recommend-agent-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`pending-title-${index}`"
              class="chat-recommend-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
          <p class="chat-recommend-agent-card__intro-subtitle">
            <span
              v-for="(char, index) in pendingStatusChars"
              :key="`pending-subtitle-${index}`"
              class="chat-recommend-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
              >{{ char === ' ' ? '\u00A0' : char }}</span
            >
          </p>
        </div>
      </div>
    </Transition>

    <div
      v-if="isRecommendationsPending && !isFormOnlyCard"
      class="chat-recommend-agent-card__pending-spacer"
      aria-hidden="true"
    />

    <div
      v-if="showCardHeader"
      class="chat-recommend-agent-card__header"
    >
      <div class="chat-recommend-agent-card__header-info">
        <div class="chat-recommend-agent-card__avatar">
          <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
        </div>
        <div>
          <p class="chat-recommend-agent-card__title">
            {{ hasResultRecommendations ? recommendConfig.ui.cardTitleResult : recommendConfig.ui.cardTitle }}
          </p>
          <p class="chat-recommend-agent-card__subtitle">
            {{
              hasResultRecommendations
                ? recommendConfig.ui.cardSubtitleResult
                : props.readonly
                  ? recommendConfig.ui.cardSubtitleReadonly
                  : recommendConfig.ui.cardSubtitle
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- 선택 폼 -->
    <div
      v-if="!isRecommendationResultPhase"
      class="chat-recommend-agent-card__body"
    >
      <!-- 지역 선택 (useRegionSelect: true 일 때만) -->
      <div
        v-if="recommendConfig.form.useRegionSelect"
        ref="locationFieldRef"
        class="chat-recommend-agent-card__field"
        :class="{ 'is-answered': isLocationAnswered }"
      >
        <p class="chat-recommend-agent-card__label">
          {{ recommendConfig.form.regionSelectLabel || '지역을 선택해주세요' }}
        </p>
        <div class="chat-recommend-agent-card__location-grid">
          <UiSelect
            :model-value="form['sido']"
            :options="sidoSelectOptions"
            :disabled="props.readonly || isRegionLoading"
            @update:model-value="!props.readonly && setFormValue('sido', String($event))"
          />
          <UiSelect
            :model-value="form['sigungu']"
            :options="sigunguSelectOptions"
            :disabled="props.readonly || isRegionLoading || !hasSelectedSido"
            @update:model-value="!props.readonly && setFormValue('sigungu', String($event))"
          />
          <UiSelect
            :model-value="form['dong']"
            :options="dongSelectOptions"
            :disabled="props.readonly || isRegionLoading || !hasSelectedSigungu"
            @update:model-value="!props.readonly && setFormValue('dong', String($event))"
          />
        </div>
      </div>

      <!-- chip_select 필드 동적 렌더링 -->
      <div
        v-for="field in recommendConfig.form.fields"
        :key="field.key"
        :ref="(el) => setFieldRef(field.key, el as HTMLElement | null)"
        class="chat-recommend-agent-card__field"
        :class="{ 'is-answered': !!form[field.key] }"
      >
        <p class="chat-recommend-agent-card__label">{{ field.label }}</p>
        <div class="chat-recommend-agent-card__chip-row">
          <UiButton
            v-for="option in field.options"
            :key="option"
            :variant="form[field.key] === option ? 'primary' : 'line-secondary'"
            size="sm"
            :disabled="props.readonly"
            @click="!props.readonly && setFormValue(field.key, option)"
            >{{ option }}</UiButton
          >
        </div>
      </div>
    </div>

    <!-- 추천 결과 목록 -->
    <ul
      v-if="shouldRenderResultList"
      class="chat-recommend-agent-card__result-list"
    >
      <li
        v-for="(item, idx) in visibleRecommendations"
        :key="`${item[recommendConfig.result.nameField]}-${idx}`"
        class="chat-recommend-agent-card__result-item"
      >
        <div class="chat-recommend-agent-card__result-main">
          <!-- 썸네일 (imageField가 있고 showThumbnailImages: true 일 때만) -->
          <div
            v-if="hasThumbnailFeature"
            class="chat-recommend-agent-card__result-thumb"
            :class="{
              'is-pending': isThumbAwaitingUrlInFlight(item),
              'is-loaded': isThumbImageDecoded(idx, item),
            }"
          >
            <img
              v-if="hasThumbUrl(item)"
              :src="getThumbDisplaySrc(item)"
              :alt="`${item[recommendConfig.result.nameField]} 이미지`"
              class="chat-recommend-agent-card__result-thumb-img"
              @load="onThumbImgLoad(idx, item)"
              @error="onThumbImgError(idx, item)"
            />
            <div
              v-if="showThumbLoadingOverlay(idx, item)"
              class="pexels-loading chat-recommend-agent-card__thumb-pexels"
              aria-busy="true"
              aria-live="polite"
            >
              <div class="pexels-loading__spinner" />
            </div>
            <i
              v-if="!hasThumbUrl(item) && !showThumbLoadingOverlay(idx, item)"
              class="icon-image size-20"
              aria-hidden="true"
            />
          </div>
          <div class="chat-recommend-agent-card__result-content">
            <div class="chat-recommend-agent-card__result-item-head">
              <p class="chat-recommend-agent-card__result-name">{{ item[recommendConfig.result.nameField] }}</p>
              <span class="chat-recommend-agent-card__result-rank"
                >{{ recommendConfig.result.rankLabel }} {{ idx + 1 }}</span
              >
            </div>
            <dl class="chat-recommend-agent-card__result-meta">
              <div
                v-for="fieldDef in recommendConfig.result.fields"
                :key="fieldDef.key"
                class="chat-recommend-agent-card__result-meta-row"
              >
                <dt>{{ fieldDef.label }}</dt>
                <dd :class="{ 'chat-recommend-agent-card__result-address': fieldDef.type === 'link' }">
                  <template v-if="fieldDef.type === 'link'">
                    <a
                      v-if="resolveItemLinkUrl(item, fieldDef.key)"
                      :href="resolveItemLinkUrl(item, fieldDef.key)"
                      target="_blank"
                      rel="noopener noreferrer"
                      >{{ getItemLinkLabel(item, fieldDef.key) }}</a
                    >
                    <span v-else>-</span>
                  </template>
                  <template v-else>{{ item[fieldDef.key] || '-' }}</template>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </li>
    </ul>

    <p
      v-if="shouldRenderResultList && recommendConfig.features.showImageNotice && recommendConfig.ui.imageNotice"
      class="chat-recommend-agent-card__result-image-notice"
    >
      {{ recommendConfig.ui.imageNotice }}
    </p>

    <div
      v-if="!hasResultRecommendations && (props.readonly || !isRecommendationsPending)"
      class="chat-recommend-agent-card__footer"
    >
      <template v-if="props.readonly">
        <span class="chat-recommend-agent-card__submitted-badge">
          <i class="icon-check size-16" />
          제출 완료
        </span>
      </template>
      <template v-else>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="emit('close')"
          >닫기</UiButton
        >
        <UiButton
          variant="dark"
          size="sm"
          @click="onSubmitClick"
        >
          추천받기
          <template #icon-right>
            <i class="icon-arrow-right size-16" />
          </template>
        </UiButton>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RecommendAgentConfig } from '~/types/agent'
import type { RecommendFormPayload, RecommendResultItem, RegionLocationMap } from '~/types/chat'
import {
  isRecommendImagePlaceholderUrl,
  getRecommendThumbDisplaySrc,
  getRecommendLinkDisplayLabel,
  preloadRecommendThumbImages,
  resolveRecommendImageEnrichment,
  resolveRecommendItemLinkUrl,
  tryGetRecommendImageEnrichmentFromCache,
  getRecommendGeolocationCoords,
} from '~/utils/chat/recommendAgentUtil'
import { normalizeLunchLocationMap } from '~/utils/chat/lunchAgentUtil'
import { useChatApi } from '~/composables/chat/useChatApi'
import { openToast } from '~/composables/useToast'

interface Props {
  recommendConfig: RecommendAgentConfig
  readonly?: boolean
  displayMode?: 'form' | 'result' | 'combined'
  initialPayload?: RecommendFormPayload
  recommendations?: RecommendResultItem[]
  isRecommendationsPending?: boolean
  isRecommendationResponseStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  enrichmentCacheKey?: string
  enrichmentRContent?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  displayMode: 'combined',
  initialPayload: undefined,
  recommendations: () => [],
  isRecommendationsPending: false,
  isRecommendationResponseStreaming: false,
  themeIconClassNm: '',
  themeColorHex: '',
  enrichmentCacheKey: '',
  enrichmentRContent: '',
})

const emit = defineEmits<{
  submit: [payload: RecommendFormPayload]
  close: []
  enriched: [items: RecommendResultItem[]]
}>()

const { fetchSelectRegionTree } = useChatApi()

// ━━━ 폼 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const buildInitialForm = (): RecommendFormPayload => {
  const base: RecommendFormPayload = {}
  if (props.recommendConfig.form.useRegionSelect) {
    base['sido'] = ''
    base['sigungu'] = ''
    base['dong'] = ''
  }
  for (const field of props.recommendConfig.form.fields) {
    base[field.key] = ''
  }
  return base
}

const form = reactive<RecommendFormPayload>(buildInitialForm())

const setFormValue = (key: string, value: string) => {
  form[key] = value
}

// ━━━ 지역 선택 (useRegionSelect: true 일 때만 사용) ━━━━━━━━━━━━━━━━━━━━━━━━━

const locationMap = ref<RegionLocationMap>({})
const isRegionLoading = ref(false)
const locationFieldRef = ref<HTMLElement | null>(null)

const toSelectOptions = (list: string[]) => list.map((item) => ({ label: item, value: item }))
const sidoList = computed(() => Object.keys(locationMap.value))
const sigunguList = computed(() => Object.keys(locationMap.value[form['sido'] ?? ''] ?? {}))
const dongList = computed(() => locationMap.value[form['sido'] ?? '']?.[form['sigungu'] ?? ''] ?? [])

const mergeReadonlyOption = (base: { label: string; value: string }[], current: string) => {
  const v = String(current ?? '').trim()
  if (!v || base.some((o) => o.value === v)) return base
  return [{ label: v, value: v }, ...base]
}

const sidoSelectOptions = computed(() =>
  props.readonly
    ? mergeReadonlyOption(toSelectOptions(sidoList.value), form['sido'] ?? '')
    : toSelectOptions(sidoList.value),
)
const sigunguSelectOptions = computed(() =>
  props.readonly
    ? mergeReadonlyOption(toSelectOptions(sigunguList.value), form['sigungu'] ?? '')
    : toSelectOptions(sigunguList.value),
)
const dongSelectOptions = computed(() =>
  props.readonly
    ? mergeReadonlyOption(toSelectOptions(dongList.value), form['dong'] ?? '')
    : toSelectOptions(dongList.value),
)

const isLocationAnswered = computed(() => !!form['sido'] && !!form['sigungu'] && !!form['dong'])
const hasSelectedSido = computed(() => !!form['sido'])
const hasSelectedSigungu = computed(() => !!form['sigungu'])

watch(
  [sidoList, sigunguList, dongList],
  ([sidos, sigungus, dongs]) => {
    if (props.readonly || !props.recommendConfig.form.useRegionSelect) return
    if (!sidos.length || !sidos.includes(form['sido'] ?? '')) {
      form['sido'] = ''
      form['sigungu'] = ''
      form['dong'] = ''
      return
    }
    if (!sigungus.length || !sigungus.includes(form['sigungu'] ?? '')) {
      form['sigungu'] = ''
      form['dong'] = ''
      return
    }
    if (!dongs.length || !dongs.includes(form['dong'] ?? '')) {
      form['dong'] = ''
    }
  },
  { immediate: true },
)

const isLocationSelectionMode = computed(
  () =>
    props.recommendConfig.form.useRegionSelect &&
    !hasResultRecommendations.value &&
    !props.readonly &&
    !props.initialPayload,
)

const fetchRegionTree = async () => {
  if (!isLocationSelectionMode.value) return
  if (Object.keys(locationMap.value).length > 0) return
  isRegionLoading.value = true
  try {
    const coords = await getRecommendGeolocationCoords()
    const res = await fetchSelectRegionTree(coords)
    locationMap.value = normalizeLunchLocationMap(res.data)
    applySelectedLocationToForm(res.selected)
  } catch (error) {
    locationMap.value = {}
    const message = error instanceof Error && error.message ? error.message : '지역 정보를 불러오지 못했습니다.'
    openToast({ message, type: 'error' })
  } finally {
    isRegionLoading.value = false
  }
}

const applySelectedLocationToForm = (selected?: { sido?: string; sigungu?: string; dong?: string }) => {
  const sido = String(selected?.sido ?? '').trim()
  const sigungu = String(selected?.sigungu ?? '').trim()
  const dong = String(selected?.dong ?? '').trim()
  if (!sido || !sigungu || !dong) return
  if (form['sido'] || form['sigungu'] || form['dong']) return
  const sigunguMap = locationMap.value[sido]
  if (!sigunguMap) return
  const dongListBySigungu = sigunguMap[sigungu]
  if (!Array.isArray(dongListBySigungu) || !dongListBySigungu.includes(dong)) return
  form['sido'] = sido
  form['sigungu'] = sigungu
  form['dong'] = dong
}

// ━━━ 필드 ref 관리 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fieldRefs = ref<Record<string, HTMLElement | null>>({})
const setFieldRef = (key: string, el: HTMLElement | null) => {
  fieldRefs.value[key] = el
}

const focusField = (fieldEl: HTMLElement | null) => {
  if (!fieldEl) return
  fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusTarget = fieldEl.querySelector<HTMLElement>(
    'button,[role="combobox"],[role="button"],input,[tabindex]:not([tabindex="-1"])',
  )
  focusTarget?.focus()
}

// ━━━ 추천 결과 상태 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const displayRecommendations = ref<RecommendResultItem[]>([])
const thumbLoadedKeySet = ref(new Set<string>())
const isImageEnrichmentSettled = ref(false)
const thumbKey = (idx: number, url: string) => `${idx}::${url}`

const recommendImageField = computed(() => props.recommendConfig.result.imageField ?? 'imageUrl')

const enrichmentOptions = computed(() => ({ imageField: recommendImageField.value }))

const hasThumbnailFeature = computed(
  () => props.recommendConfig.features.showThumbnailImages && !!props.recommendConfig.result.imageField,
)

const getItemImageUrl = (item: RecommendResultItem): string => {
  const field = props.recommendConfig.result.imageField
  if (!field) return ''
  return String(item[field] ?? '').trim()
}

const resolveItemLinkUrl = (item: RecommendResultItem, fieldKey: string) => resolveRecommendItemLinkUrl(item, fieldKey)

const getItemLinkLabel = (item: RecommendResultItem, fieldKey: string) =>
  getRecommendLinkDisplayLabel(item, fieldKey, resolveItemLinkUrl(item, fieldKey))

const hasThumbUrl = (item: RecommendResultItem): boolean => {
  const url = getItemImageUrl(item)
  return url.length > 0 && !isRecommendImagePlaceholderUrl(url)
}

const getThumbDisplaySrc = (item: RecommendResultItem): string => getRecommendThumbDisplaySrc(getItemImageUrl(item))

const isThumbAwaitingUrlInFlight = (item: RecommendResultItem) =>
  !hasThumbUrl(item) && shouldRenderResultList.value && !isImageEnrichmentSettled.value

const isThumbImageDecoded = (idx: number, item: RecommendResultItem): boolean => {
  const url = getItemImageUrl(item)
  if (!url) return false
  return thumbLoadedKeySet.value.has(thumbKey(idx, url))
}

const showThumbLoadingOverlay = (idx: number, item: RecommendResultItem) =>
  isThumbAwaitingUrlInFlight(item) || (hasThumbUrl(item) && !isThumbImageDecoded(idx, item))

const onThumbImgLoad = (idx: number, item: RecommendResultItem) => {
  const url = getItemImageUrl(item)
  if (!url) return
  const next = new Set(thumbLoadedKeySet.value)
  next.add(thumbKey(idx, url))
  thumbLoadedKeySet.value = next
}

const onThumbImgError = (idx: number, item: RecommendResultItem) => onThumbImgLoad(idx, item)

const markThumbsPreloaded = (list: RecommendResultItem[]) => {
  const next = new Set<string>()
  list.forEach((item, idx) => {
    const url = getItemImageUrl(item)
    if (!url || isRecommendImagePlaceholderUrl(url)) return
    next.add(thumbKey(idx, url))
  })
  thumbLoadedKeySet.value = next
}

let syncRecommendationRunId = 0

const applyRecommendationImages = async (list: RecommendResultItem[], runId: number) => {
  if (!list.length) {
    displayRecommendations.value = []
    return
  }
  if (hasThumbnailFeature.value) {
    await preloadRecommendThumbImages(list, recommendImageField.value)
  }
  if (runId !== syncRecommendationRunId) return
  markThumbsPreloaded(list)
  displayRecommendations.value = list
  const isSameAsProps =
    createRecommendationDigest(list, recommendImageField.value) ===
    createRecommendationDigest(props.recommendations ?? [], recommendImageField.value)
  if (!isSameAsProps) {
    emit('enriched', list)
  }
}

const syncRecommendationImages = async () => {
  const runId = ++syncRecommendationRunId
  isImageEnrichmentSettled.value = false
  const items = props.recommendations ?? []
  if (!items.length || props.displayMode === 'form') {
    displayRecommendations.value = items
    isImageEnrichmentSettled.value = true
    return
  }

  // LLM 응답 스트리밍 중에는 목록만 표시, 이미지 API는 완료 후 호출
  if (props.isRecommendationResponseStreaming) {
    displayRecommendations.value = items
    isImageEnrichmentSettled.value = false
    return
  }

  if (!hasThumbnailFeature.value) {
    displayRecommendations.value = items
    isImageEnrichmentSettled.value = true
    return
  }

  const cacheKey = String(props.enrichmentCacheKey ?? '').trim()
  const rContent = String(props.enrichmentRContent ?? '').trim() || JSON.stringify(items)
  const options = enrichmentOptions.value

  try {
    if (cacheKey) {
      const cached = tryGetRecommendImageEnrichmentFromCache(cacheKey, rContent, items, options)
      if (cached?.length) {
        await applyRecommendationImages(cached, runId)
        return
      }
    }

    displayRecommendations.value = items
    if (!cacheKey) return

    const enriched = await resolveRecommendImageEnrichment(cacheKey, rContent, items, options)
    if (runId !== syncRecommendationRunId || !enriched?.length) return
    await applyRecommendationImages(enriched, runId)
  } finally {
    if (runId === syncRecommendationRunId) {
      isImageEnrichmentSettled.value = true
    }
  }
}

let syncTimer: ReturnType<typeof setTimeout> | undefined
const scheduleSyncImages = () => {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = undefined
    void syncRecommendationImages()
  }, 0)
}

const createRecommendationDigest = (items: RecommendResultItem[], imageField: string): string =>
  items
    .map((item) => {
      const title = String(item['title'] ?? '').trim()
      const artist = String(item['artist'] ?? '').trim()
      const baseKey =
        title && artist ? `${title}::${artist}` : String(item[props.recommendConfig.result.nameField] ?? '').trim()
      const image = String(item[imageField] ?? '').trim()
      return `${baseKey}::${image}`
    })
    .join('||')

const recommendationDigest = computed(() =>
  createRecommendationDigest(props.recommendations ?? [], recommendImageField.value),
)

watch(
  () =>
    [
      recommendationDigest.value,
      props.enrichmentCacheKey,
      props.enrichmentRContent,
      props.displayMode,
      props.isRecommendationResponseStreaming,
    ] as const,
  scheduleSyncImages,
  { immediate: true },
)

const visibleRecommendations = computed(() => displayRecommendations.value)
const hasResultRecommendations = computed(() => visibleRecommendations.value.length > 0)

watch(
  visibleRecommendations,
  (list) => {
    const next = new Set<string>()
    list.forEach((item, idx) => {
      const url = getItemImageUrl(item)
      if (!url || isRecommendImagePlaceholderUrl(url)) return
      const k = thumbKey(idx, url)
      if (thumbLoadedKeySet.value.has(k)) next.add(k)
    })
    thumbLoadedKeySet.value = next
  },
  { deep: true },
)

// ━━━ 카드 표시 모드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isFormOnlyCard = computed(() => props.displayMode === 'form')
const isResultOnlyCard = computed(() => props.displayMode === 'result')
const shouldRenderResultList = computed(() => !isFormOnlyCard.value && hasResultRecommendations.value)
const isRecommendationsPending = computed(() => props.isRecommendationsPending === true)

const isRecommendationResultPhase = computed(() => {
  if (isFormOnlyCard.value) return false
  if (isResultOnlyCard.value) return true
  if (props.readonly && props.initialPayload) return isRecommendationsPending.value
  return hasResultRecommendations.value || isRecommendationsPending.value
})

const showCardHeader = computed(() => {
  if (isRecommendationsPending.value && isResultOnlyCard.value) return false
  if (hasResultRecommendations.value) return true
  if (!isResultOnlyCard.value && !hasResultRecommendations.value) return true
  return isContentVisible.value && (isFormOnlyCard.value || !isRecommendationsPending.value)
})

// ━━━ 인트로 애니메이션 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const introTitleChars = computed(() => (props.recommendConfig?.ui.introTitle ?? '').split(''))
const introSubtitleChars = computed(() => (props.recommendConfig?.ui.introSubtitle ?? '').split(''))

const RECOMMEND_INTRO_CONTENT_REVEAL_MS = 2100
const RECOMMEND_INTRO_END_MS = 3100
const RECOMMEND_PENDING_INTERVAL_MS = 3000

const pendingStatusTextIndex = ref(0)
const pendingStatusTexts = computed(() => props.recommendConfig?.ui.pendingStatusTexts ?? [])
const pendingStatusText = computed(() => pendingStatusTexts.value[pendingStatusTextIndex.value] ?? '')
const pendingStatusChars = computed(() => pendingStatusText.value.split(''))

const getShouldPlayIntro = () =>
  !isResultOnlyCard.value && !props.readonly && !hasResultRecommendations.value && !props.initialPayload

const isIntroPlaying = ref(getShouldPlayIntro())
const isContentVisible = ref(!getShouldPlayIntro())

let introStartTimer: ReturnType<typeof setTimeout> | null = null
let introEndTimer: ReturnType<typeof setTimeout> | null = null
let pendingStatusTimer: ReturnType<typeof setInterval> | null = null
let isCardDestroyed = false

const clearIntroTimers = () => {
  if (introStartTimer) clearTimeout(introStartTimer)
  if (introEndTimer) clearTimeout(introEndTimer)
  introStartTimer = null
  introEndTimer = null
}

const clearPendingStatusTimer = () => {
  if (pendingStatusTimer) clearInterval(pendingStatusTimer)
  pendingStatusTimer = null
}

const startPendingStatusRotation = () => {
  clearPendingStatusTimer()
  pendingStatusTextIndex.value = 0
  pendingStatusTimer = setInterval(() => {
    pendingStatusTextIndex.value = (pendingStatusTextIndex.value + 1) % (pendingStatusTexts.value.length || 1)
  }, RECOMMEND_PENDING_INTERVAL_MS)
}

const shouldPlayIntro = computed(() => getShouldPlayIntro())

watch(
  shouldPlayIntro,
  (shouldPlay) => {
    if (shouldPlay) return
    clearIntroTimers()
    isIntroPlaying.value = false
    isContentVisible.value = true
  },
  { immediate: true },
)

watch(
  isRecommendationsPending,
  (isPending) => {
    if (isPending) startPendingStatusRotation()
    else clearPendingStatusTimer()
  },
  { immediate: true },
)

const startIntroSequence = async () => {
  clearIntroTimers()
  if (!shouldPlayIntro.value) {
    isIntroPlaying.value = false
    isContentVisible.value = true
    return
  }

  isIntroPlaying.value = true
  isContentVisible.value = false

  const startedAt = Date.now()
  if (props.recommendConfig.form.useRegionSelect) {
    await fetchRegionTree()
  }
  if (isCardDestroyed) return

  const elapsed = Date.now() - startedAt
  introStartTimer = setTimeout(
    () => {
      isContentVisible.value = true
    },
    Math.max(0, RECOMMEND_INTRO_CONTENT_REVEAL_MS - elapsed),
  )
  introEndTimer = setTimeout(
    () => {
      isIntroPlaying.value = false
    },
    Math.max(0, RECOMMEND_INTRO_END_MS - elapsed),
  )
}

onMounted(() => {
  isCardDestroyed = false
  void startIntroSequence()
})

onUnmounted(() => {
  isCardDestroyed = true
  clearIntroTimers()
  clearPendingStatusTimer()
})

// ━━━ initialPayload 반영 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

watch(
  () => props.initialPayload,
  (payload) => {
    if (!payload) return
    Object.entries(payload).forEach(([k, v]) => {
      form[k] = v
    })
  },
  { immediate: true },
)

// ━━━ 테마 스타일 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_THEME_HEX = '#3c69db'
const hexToRgb = (hex: string) => {
  const cleaned = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '60, 105, 219'
  return `${parseInt(cleaned.slice(0, 2), 16)}, ${parseInt(cleaned.slice(2, 4), 16)}, ${parseInt(cleaned.slice(4, 6), 16)}`
}

const themeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_THEME_HEX
  return {
    '--recommend-theme-color': colorHex,
    '--recommend-theme-rgb': hexToRgb(colorHex),
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

// ━━━ 제출 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const onSubmitClick = () => {
  const checks: { isInvalid: boolean; fieldRef: HTMLElement | null }[] = []

  if (props.recommendConfig.form.useRegionSelect) {
    checks.push({ isInvalid: !isLocationAnswered.value, fieldRef: locationFieldRef.value })
  }

  for (const field of props.recommendConfig.form.fields) {
    if (field.required) {
      checks.push({
        isInvalid: !form[field.key],
        fieldRef: fieldRefs.value[field.key] ?? null,
      })
    }
  }

  const firstInvalid = checks.find((c) => c.isInvalid)
  if (firstInvalid) {
    openToast({ message: '모든 항목을 선택해야 합니다.', type: 'warning' })
    focusField(firstInvalid.fieldRef)
    return
  }
  emit('submit', { ...form })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/utils/agent-intro' as *;

@mixin recommend-content-reveal($duration, $delay: 0s) {
  opacity: var(--recommend-content-opacity);
  transform: translateY(var(--recommend-content-shift));
  transition:
    opacity $duration ease $delay,
    transform $duration ease $delay;
}

@mixin recommend-theme-avatar($size) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $size;
  height: $size;
  border-radius: 50%;
  background: var(--recommend-theme-color);
  color: #fff;
}

@mixin recommend-panel-surface {
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
}

.chat-recommend-agent-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: 100%;
  min-height: 0;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;
  --recommend-content-opacity: 0;
  --recommend-content-shift: 8px;

  &.is-intro-playing {
    min-height: 0;
    border-color: transparent;
  }

  &.is-intro-playing:not(.is-content-visible) {
    --recommend-content-opacity: 0;
    --recommend-content-shift: 8px;
  }

  &.is-content-visible {
    --recommend-content-opacity: 1;
    --recommend-content-shift: 0px;
  }

  &.is-result-phase:not(.is-intro-playing) {
    min-height: 0;
  }

  // result-only + pending 단계에서 인트로 오버레이(absolute)가 잘리지 않도록 최소 높이 보장
  &.is-result-phase.is-intro-playing {
    min-height: min(520px, calc(100vh - #{$header-height} - 220px));
  }

  &__pending-spacer {
    flex: 1 1 auto;
    min-height: min(520px, calc(100vh - #{$header-height} - 220px));
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    @include recommend-content-reveal(0.32s);
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__avatar {
    @include recommend-theme-avatar(40px);
    flex-shrink: 0;
  }

  &__title {
    @include typo($body-medium-bold);
    color: $color-text-primary;
  }

  &__subtitle {
    @include typo($body-small);
    color: $color-text-muted;
    margin-top: 2px;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    @include recommend-content-reveal(0.36s, 0.04s);
    @include custom-scrollbar(4px);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md;
    @include recommend-panel-surface;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;

    &.is-answered {
      border-color: var(--recommend-theme-color);
      background: rgba(var(--recommend-theme-rgb), 0.03);
    }
  }

  &__label {
    @include typo($body-small);
    color: $color-text-primary;
  }

  &__location-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-sm;
  }

  &__chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding: 10px 12px;
    border-top: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    @include recommend-content-reveal(0.28s, 0.08s);
  }

  &__result-list {
    flex: 0 1 auto;
    max-height: min(480px, calc(78vh - 180px));
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: 16px 20px 8px;
    flex-shrink: 0;
    @include recommend-content-reveal(0.32s);
    @include custom-scrollbar(4px);
  }

  &__result-image-notice {
    flex-shrink: 0;
    margin: 0 20px 12px;
    @include typo($body-xsmall);
    color: $color-text-muted;
  }

  &__result-item {
    padding: 14px;
    @include recommend-panel-surface;
    @include typo($body-small);
    color: $color-text-primary;
  }

  &__result-main {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  &__result-thumb {
    position: relative;
    width: 120px;
    height: 115px;
    border-radius: 8px;
    border: 1px solid $color-border;
    background: $color-surface;
    color: $color-text-muted;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 0 0 auto;

    &-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &.is-loaded > &-img {
      opacity: 1;
    }

    :deep(.pexels-loading.chat-recommend-agent-card__thumb-pexels) {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      margin: 0;
      background: rgb(255 255 255 / 82%);
    }

    :deep(.pexels-loading.chat-recommend-agent-card__thumb-pexels .pexels-loading__spinner) {
      width: 28px;
      height: 28px;
      border-top-color: var(--recommend-theme-color, $color-primary);
    }

    &.is-pending {
      border-style: dashed;
      background: rgba(var(--recommend-theme-rgb), 0.06);
      animation: recommend-result-thumb-pulse 1.2s ease-in-out infinite;
    }
  }

  &__result-content {
    min-width: 0;
    flex: 1;
  }

  &__result-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__result-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    @include typo($body-medium-bold);
    color: $color-text-primary;
  }

  &__result-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-full;
    background: rgba(var(--recommend-theme-rgb), 0.08);
    @include typo($body-xsmall);
    color: var(--recommend-theme-color);
    font-weight: $font-weight-medium;
  }

  &__result-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__result-meta-row {
    display: flex;
    align-items: flex-start;
    gap: $spacing-xs;

    dt {
      min-width: 54px;
      @include typo($body-xsmall);
      font-weight: $font-weight-semibold;
      color: $color-text-secondary;
    }

    dd {
      margin: 0;
      min-width: 0;
      @include typo($body-small);
      color: $color-text-primary;
      overflow-wrap: anywhere;
      word-break: break-all;
    }
  }

  &__result-address {
    min-width: 0;

    a {
      color: var(--recommend-theme-color);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  &__submitted-badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 3.5px 10px;
    border-radius: 6px;
    border: 1px solid rgba(var(--recommend-theme-rgb), 0.22);
    background: rgba(var(--recommend-theme-rgb), 0.08);
    color: var(--recommend-theme-color);
    @include typo($body-large);
    font-weight: $font-weight-medium;
  }

  &.is-readonly {
    .chat-recommend-agent-card__chip-row {
      pointer-events: none;
    }
  }
}

@include agent-card-intro('chat-recommend-agent-card', 'intro', '--recommend-theme-color', '--recommend-theme-rgb');
@include agent-card-intro-keyframes;
@include agent-intro-transition;

@keyframes recommend-result-thumb-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>

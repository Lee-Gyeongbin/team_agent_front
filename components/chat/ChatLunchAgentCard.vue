<template>
  <section
    class="chat-lunch-agent-card"
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
        class="chat-lunch-agent-card__intro"
        aria-live="polite"
      >
        <div class="chat-lunch-agent-card__intro-inner">
          <div class="chat-lunch-agent-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <p class="chat-lunch-agent-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`intro-title-${index}`"
              class="chat-lunch-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
          <p class="chat-lunch-agent-card__intro-subtitle">
            <span
              v-for="(char, index) in introSubtitleChars"
              :key="`intro-subtitle-${index}`"
              class="chat-lunch-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
        </div>
      </div>
    </Transition>

    <!-- result 카드: 추천 스트리밍 대기 -->
    <Transition name="agent-intro">
      <div
        v-if="isRecommendationsPending && !isFormOnlyCard"
        class="chat-lunch-agent-card__intro"
        aria-live="polite"
      >
        <div class="chat-lunch-agent-card__intro-inner">
          <div class="chat-lunch-agent-card__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <p class="chat-lunch-agent-card__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`pending-title-${index}`"
              class="chat-lunch-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
          <p class="chat-lunch-agent-card__intro-subtitle">
            <span
              v-for="(char, index) in pendingStatusChars"
              :key="`pending-subtitle-${index}`"
              class="chat-lunch-agent-card__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
        </div>
      </div>
    </Transition>

    <div
      v-if="showCardHeader"
      class="chat-lunch-agent-card__header"
    >
      <div class="chat-lunch-agent-card__header-info">
        <div class="chat-lunch-agent-card__avatar">
          <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
        </div>
        <div>
          <p class="chat-lunch-agent-card__title">
            {{ hasResultRecommendations ? '점심 메뉴 추천 결과' : '점심 메뉴 추천 에이전트' }}
          </p>
          <p class="chat-lunch-agent-card__subtitle">
            {{
              hasResultRecommendations
                ? '선택하신 조건을 바탕으로 추천된 식당 목록입니다.'
                : props.readonly
                  ? '추천 요청이 완료되었습니다.'
                  : '아래 항목을 모두 선택해 주세요.'
            }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="!isRecommendationResultPhase"
      class="chat-lunch-agent-card__body"
    >
      <div
        ref="locationFieldRef"
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': isLocationAnswered }"
      >
        <p class="chat-lunch-agent-card__label">점심메뉴를 추천받을 지역은? (위치 허용 시 자동으로 선택됩니다)</p>
        <div class="chat-lunch-agent-card__location-grid">
          <UiSelect
            :model-value="form.sido"
            :options="sidoSelectOptions"
            :disabled="props.readonly || isRegionLoading"
            @update:model-value="!props.readonly && setFormValue('sido', $event)"
          />
          <UiSelect
            :model-value="form.sigungu"
            :options="sigunguSelectOptions"
            :disabled="props.readonly || isRegionLoading || !hasSelectedSido"
            @update:model-value="!props.readonly && setFormValue('sigungu', $event)"
          />
          <UiSelect
            :model-value="form.dong"
            :options="dongSelectOptions"
            :disabled="props.readonly || isRegionLoading || !hasSelectedSigungu"
            @update:model-value="!props.readonly && setFormValue('dong', $event)"
          />
        </div>
      </div>

      <div
        ref="moodFieldRef"
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': !!form.mood }"
      >
        <p class="chat-lunch-agent-card__label">오늘 어떤 음식을 드시고 싶으신가요?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in LUNCH_MOOD_OPTIONS"
            :key="option"
            :variant="form.mood === option ? 'primary' : 'line-secondary'"
            size="sm"
            :disabled="props.readonly"
            @click="!props.readonly && setFormValue('mood', option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
        ref="budgetFieldRef"
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': !!form.budget }"
      >
        <p class="chat-lunch-agent-card__label">예산은 어느 정도인가요? (1인 기준)</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in LUNCH_BUDGET_OPTIONS"
            :key="option"
            :variant="form.budget === option ? 'primary' : 'line-secondary'"
            size="sm"
            :disabled="props.readonly"
            @click="!props.readonly && setFormValue('budget', option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
        ref="peopleFieldRef"
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': !!form.peopleCount }"
      >
        <p class="chat-lunch-agent-card__label">몇 명이 식사하나요?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in LUNCH_PEOPLE_OPTIONS"
            :key="option"
            :variant="form.peopleCount === option ? 'primary' : 'line-secondary'"
            size="sm"
            :disabled="props.readonly"
            @click="!props.readonly && setFormValue('peopleCount', option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
        ref="cuisineFieldRef"
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': !!form.cuisineType }"
      >
        <p class="chat-lunch-agent-card__label">선호하는 음식종류는?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in LUNCH_CUISINE_OPTIONS"
            :key="option"
            :variant="form.cuisineType === option ? 'primary' : 'line-secondary'"
            size="sm"
            :disabled="props.readonly"
            @click="!props.readonly && setFormValue('cuisineType', option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>
    </div>

    <ul
      v-if="shouldRenderResultList"
      class="chat-lunch-agent-card__result-list"
    >
      <li
        v-for="(item, idx) in visibleRecommendations"
        :key="`${item.restaurant}-${item.menu}-${idx}`"
        class="chat-lunch-agent-card__result-item"
      >
        <div class="chat-lunch-agent-card__result-main">
          <div
            class="chat-lunch-agent-card__result-thumb"
            :class="{
              'is-pending': isThumbAwaitingUrlInFlight(item),
              'is-loaded': isThumbImageDecoded(idx, item),
            }"
          >
            <img
              v-if="hasThumbUrl(item)"
              :src="getThumbDisplaySrc(item)"
              :alt="`${item.restaurant} 이미지`"
              class="chat-lunch-agent-card__result-thumb-img"
              @load="onThumbImgLoad(idx, item)"
              @error="onThumbImgError(idx, item)"
            />
            <div
              v-if="showThumbLoadingOverlay(idx, item)"
              class="pexels-loading chat-lunch-agent-card__thumb-pexels"
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
          <div class="chat-lunch-agent-card__result-content">
            <div class="chat-lunch-agent-card__result-item-head">
              <p class="chat-lunch-agent-card__result-name">{{ item.menu }}</p>
              <span class="chat-lunch-agent-card__result-rank">추천 {{ idx + 1 }}</span>
            </div>
            <dl class="chat-lunch-agent-card__result-meta">
              <div class="chat-lunch-agent-card__result-meta-row">
                <dt>상호명</dt>
                <dd>{{ item.restaurant }}</dd>
              </div>
              <div class="chat-lunch-agent-card__result-meta-row">
                <dt>가격</dt>
                <dd>{{ item.price }}</dd>
              </div>
              <div class="chat-lunch-agent-card__result-meta-row">
                <dt>위치</dt>
                <dd>{{ item.location }}</dd>
              </div>
              <div class="chat-lunch-agent-card__result-meta-row">
                <dt>URL</dt>
                <dd class="chat-lunch-agent-card__result-address">
                  <a
                    v-if="item.address"
                    :href="item.address"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ item.address }}
                  </a>
                  <span v-else>-</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </li>
    </ul>
    <p
      v-if="shouldRenderResultList"
      class="chat-lunch-agent-card__result-image-notice"
    >
      ※ 본 이미지는 AI가 제작한 참고용 이미지입니다
    </p>

    <div
      v-if="!hasResultRecommendations && (props.readonly || !isRecommendationsPending)"
      class="chat-lunch-agent-card__footer"
    >
      <template v-if="props.readonly">
        <span class="chat-lunch-agent-card__submitted-badge">
          <i class="icon-check size-16" />
          제출 완료
        </span>
      </template>
      <template v-else>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="emit('close')"
        >
          닫기
        </UiButton>
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
import type { LunchAgentFormPayload, LunchRecommendationItem, RegionSelectedLocation } from '~/types/chat'
import {
  getLunchGeolocationCoords,
  isLunchMenuImagePlaceholderUrl,
  LUNCH_BUDGET_OPTIONS,
  LUNCH_CUISINE_OPTIONS,
  LUNCH_MOOD_OPTIONS,
  LUNCH_PEOPLE_OPTIONS,
  normalizeLunchLocationMap,
  getLunchThumbDisplaySrc,
  preloadLunchMenuThumbImages,
  resolveLunchMenuImageEnrichment,
  tryGetLunchMenuImageEnrichmentFromCache,
} from '~/utils/chat/lunchAgentUtil'
import { useChatApi } from '~/composables/chat/useChatApi'
import { openToast } from '~/composables/useToast'

/** form: 설문(q)만, result: 추천(r)만, combined: 단일 카드(인덱스 오버레이) */
type LunchCardDisplayMode = 'form' | 'result' | 'combined'

interface Props {
  readonly?: boolean
  displayMode?: LunchCardDisplayMode
  initialPayload?: LunchAgentFormPayload
  recommendations?: LunchRecommendationItem[]
  /** 추천 JSON 파싱 전·스트리밍 중 썸네일 영역(플레이스홀더) 표시 */
  isRecommendationsPending?: boolean
  /** 스트리밍 중(파싱된 행이 있어도 imageUrl이 아직 비는 경우) 썸네일 로딩 표시 */
  isRecommendationResponseStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  /** 썸네일 API·인메모리 캐시 키 — answer logId 권장 */
  enrichmentCacheKey?: string
  /** answer rContent 원문 — 캐시·중복 API 키용 */
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
  submit: [payload: LunchAgentFormPayload]
  close: []
  /** 썸네일 API·선적재 완료 시 상위 메시지 상태 동기화 */
  enriched: [items: LunchRecommendationItem[]]
}>()
const { fetchSelectRegionTree } = useChatApi()

const toSelectOptions = (list: string[]) => list.map((item) => ({ label: item, value: item }))
const locationMap = ref<Record<string, Record<string, string[]>>>({})
const isRegionLoading = ref(false)
const form = reactive<LunchAgentFormPayload>({
  sido: '',
  sigungu: '',
  dong: '',
  mood: '',
  budget: '',
  peopleCount: '',
  cuisineType: '',
})

const displayRecommendations = ref<LunchRecommendationItem[]>([])

/** 썸네일: URL 수신 전(스트리밍)·이미지 디코딩 전 스피너 */
const thumbLoadedKeySet = ref(new Set<string>())
const thumbKey = (idx: number, url: string) => `${idx}::${url}`

const markThumbsPreloaded = (list: LunchRecommendationItem[]) => {
  const next = new Set<string>()
  list.forEach((item, idx) => {
    const url = String(item.imageUrl ?? '').trim()
    if (!url || isLunchMenuImagePlaceholderUrl(url)) return
    next.add(thumbKey(idx, url))
  })
  thumbLoadedKeySet.value = next
}

const applyRecommendationImages = async (list: LunchRecommendationItem[], runId: number) => {
  if (!list.length) {
    displayRecommendations.value = []
    return
  }
  await preloadLunchMenuThumbImages(list)
  if (runId !== syncRecommendationRunId) return
  markThumbsPreloaded(list)
  displayRecommendations.value = list
  emit('enriched', list)
}

let syncRecommendationRunId = 0

const syncRecommendationImages = async () => {
  const runId = ++syncRecommendationRunId
  const items = props.recommendations ?? []
  if (!items.length || props.displayMode === 'form') {
    displayRecommendations.value = items
    return
  }

  const cacheKey = String(props.enrichmentCacheKey ?? '').trim()
  const rContent = String(props.enrichmentRContent ?? '').trim() || JSON.stringify(items)

  if (cacheKey) {
    const cached = tryGetLunchMenuImageEnrichmentFromCache(cacheKey, rContent, items)
    if (cached?.length) {
      await applyRecommendationImages(cached, runId)
      return
    }
  }

  displayRecommendations.value = items
  if (!cacheKey) return

  const enriched = await resolveLunchMenuImageEnrichment(cacheKey, rContent, items)
  if (runId !== syncRecommendationRunId || !enriched?.length) return
  await applyRecommendationImages(enriched, runId)
}

/** recommendations·cacheKey가 한 틱에 연속 변경돼도 enrichment 1회만 */
let syncRecommendationTimer: ReturnType<typeof setTimeout> | undefined
const scheduleSyncRecommendationImages = () => {
  if (syncRecommendationTimer) clearTimeout(syncRecommendationTimer)
  syncRecommendationTimer = setTimeout(() => {
    syncRecommendationTimer = undefined
    void syncRecommendationImages()
  }, 0)
}

watch(
  () => [props.recommendations, props.enrichmentCacheKey, props.enrichmentRContent, props.displayMode] as const,
  scheduleSyncRecommendationImages,
  { immediate: true, deep: true },
)

const visibleRecommendations = computed(() => displayRecommendations.value)
const hasResultRecommendations = computed(() => visibleRecommendations.value.length > 0)
const isRecommendationsPending = computed(() => props.isRecommendationsPending === true)
const isRecommendationResponseStreaming = computed(() => props.isRecommendationResponseStreaming === true)
const isFormOnlyCard = computed(() => props.displayMode === 'form')
const isResultOnlyCard = computed(() => props.displayMode === 'result')

const shouldRenderResultList = computed(() => !isFormOnlyCard.value && hasResultRecommendations.value)

/** 헤더 — 선택 폼은 인트로 중에도 DOM 유지(높이 고정), result pending 중만 숨김 */
const showCardHeader = computed(() => {
  if (isRecommendationsPending.value && isResultOnlyCard.value) return false
  if (hasResultRecommendations.value) return true
  if (!isResultOnlyCard.value && !hasResultRecommendations.value) return true
  return isContentVisible.value && (isFormOnlyCard.value || !isRecommendationsPending.value)
})

/** result 단계: 폼 숨김·추천 표시 / form 단계: 폼 유지·추천 숨김 */
const isRecommendationResultPhase = computed(() => {
  if (isFormOnlyCard.value) return false
  if (isResultOnlyCard.value) return true
  if (props.readonly && props.initialPayload) {
    return isRecommendationsPending.value
  }
  return hasResultRecommendations.value || isRecommendationsPending.value
})
const isLocationAnswered = computed(() => !!form.sido && !!form.sigungu && !!form.dong)
const hasSelectedSido = computed(() => !!form.sido)
const hasSelectedSigungu = computed(() => !!form.sigungu)
const isLocationSelectionMode = computed(
  () => !hasResultRecommendations.value && !props.readonly && !props.initialPayload,
)
const introTitleChars = '점심 메뉴 추천 에이전트'.split('')
const introSubtitleChars = '점심 메뉴 추천 에이전트를 생성 중입니다...'.split('')

const LUNCH_PENDING_STATUS_TEXTS = [
  '적합한 음식점을 찾고 있는 중입니다...',
  '주변 식당 정보를 분석하고 있습니다...',
  '예산과 취향에 맞는 메뉴를 추천하는 중입니다...',
  '지금 방문하기 좋은 음식점을 탐색하고 있습니다...',
  '사용자 조건에 적합한 식당을 매칭하고 있습니다...',
] as const
const LUNCH_PENDING_STATUS_INTERVAL_MS = 3000
const pendingStatusTextIndex = ref(0)
const pendingStatusText = computed(() => LUNCH_PENDING_STATUS_TEXTS[pendingStatusTextIndex.value])
const pendingStatusChars = computed(() => pendingStatusText.value.split(''))
const DEFAULT_THEME_HEX = '#3c69db'
const hexToRgb = (hex: string) => {
  const cleanedHex = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleanedHex)) return '60, 105, 219'
  return `${parseInt(cleanedHex.slice(0, 2), 16)}, ${parseInt(cleanedHex.slice(2, 4), 16)}, ${parseInt(cleanedHex.slice(4, 6), 16)}`
}
const themeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_THEME_HEX
  return {
    '--lunch-theme-color': colorHex,
    '--lunch-theme-rgb': hexToRgb(colorHex),
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())
const locationFieldRef = ref<HTMLElement | null>(null)
const moodFieldRef = ref<HTMLElement | null>(null)
const budgetFieldRef = ref<HTMLElement | null>(null)
const peopleFieldRef = ref<HTMLElement | null>(null)
const cuisineFieldRef = ref<HTMLElement | null>(null)

const focusField = (fieldEl: HTMLElement | null) => {
  if (!fieldEl) return
  fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const focusTarget = fieldEl.querySelector<HTMLElement>(
    'button,[role="combobox"],[role="button"],input,[tabindex]:not([tabindex="-1"])',
  )
  focusTarget?.focus()
}

const fetchLunchRegionTree = async () => {
  if (!isLocationSelectionMode.value) return
  if (Object.keys(locationMap.value).length > 0) return
  isRegionLoading.value = true
  try {
    const coords = await getLunchGeolocationCoords()
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

const applySelectedLocationToForm = (selected?: RegionSelectedLocation) => {
  const selectedSido = String(selected?.sido ?? '').trim()
  const selectedSigungu = String(selected?.sigungu ?? '').trim()
  const selectedDong = String(selected?.dong ?? '').trim()
  if (!selectedSido || !selectedSigungu || !selectedDong) return
  if (form.sido || form.sigungu || form.dong) return

  const sigunguMap = locationMap.value[selectedSido]
  if (!sigunguMap) return
  const dongListBySigungu = sigunguMap[selectedSigungu]
  if (!Array.isArray(dongListBySigungu) || !dongListBySigungu.includes(selectedDong)) return

  form.sido = selectedSido
  form.sigungu = selectedSigungu
  form.dong = selectedDong
}

const applyPayloadToForm = (payload?: LunchAgentFormPayload) => {
  if (!payload) return
  form.sido = payload.sido
  form.sigungu = payload.sigungu
  form.dong = payload.dong
  form.mood = payload.mood
  form.budget = payload.budget
  form.peopleCount = payload.peopleCount
  form.cuisineType = payload.cuisineType
}

const sidoList = computed(() => Object.keys(locationMap.value))
const sidoOptions = computed(() => toSelectOptions(sidoList.value))
const sigunguList = computed(() => Object.keys(locationMap.value[form.sido] ?? {}))
const sigunguOptions = computed(() => toSelectOptions(sigunguList.value))
const dongList = computed(() => locationMap.value[form.sido]?.[form.sigungu] ?? [])
const dongOptions = computed(() => toSelectOptions(dongList.value))

/** 읽기전용: options에 현재 값이 없으면 Radix Select에 라벨이 안 보임 — form 값을 옵션으로 합침 */
const mergeReadonlyOption = (base: { label: string; value: string }[], current: string) => {
  const v = String(current ?? '').trim()
  if (!v) return base
  if (base.some((o) => String(o.value) === v)) return base
  return [{ label: v, value: v }, ...base]
}

const sidoSelectOptions = computed(() =>
  props.readonly ? mergeReadonlyOption(sidoOptions.value, form.sido) : sidoOptions.value,
)
const sigunguSelectOptions = computed(() =>
  props.readonly ? mergeReadonlyOption(sigunguOptions.value, form.sigungu) : sigunguOptions.value,
)
const dongSelectOptions = computed(() =>
  props.readonly ? mergeReadonlyOption(dongOptions.value, form.dong) : dongOptions.value,
)

/** 지역 옵션(시도·시군구·동)과 form 값 동기화 — 상위가 바뀌면 하위만 단계적으로 정리 */
watch(
  [sidoList, sigunguList, dongList],
  ([sidos, sigungus, dongs]) => {
    if (!isLocationSelectionMode.value) return

    if (!sidos.length || !sidos.includes(form.sido)) {
      form.sido = ''
      form.sigungu = ''
      form.dong = ''
      return
    }

    if (!sigungus.length || !sigungus.includes(form.sigungu)) {
      form.sigungu = ''
      form.dong = ''
      return
    }

    if (!dongs.length || !dongs.includes(form.dong)) {
      form.dong = ''
    }
  },
  { immediate: true },
)

watch(
  () => props.initialPayload,
  (payload) => {
    if (!payload) return
    applyPayloadToForm(payload)
  },
  { immediate: true },
)

/** ChatPsychologySurvey와 동일 인트로 타이밍 */
const LUNCH_INTRO_CONTENT_REVEAL_MS = 2100
const LUNCH_INTRO_END_MS = 3100

/** form·combined 카드 최초 오픈 시 지역 로드 + 타이틀 인트로 */
const getShouldPlayFormIntro = () =>
  !isResultOnlyCard.value && !props.readonly && !hasResultRecommendations.value && !props.initialPayload

const shouldPlayIntro = computed(() => getShouldPlayFormIntro())

const isIntroPlaying = ref(getShouldPlayFormIntro())
const isContentVisible = ref(!getShouldPlayFormIntro())

let introStartTimer: ReturnType<typeof setTimeout> | null = null
let introEndTimer: ReturnType<typeof setTimeout> | null = null
let pendingStatusTimer: ReturnType<typeof setInterval> | null = null
let isIntroDestroyed = false

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
    pendingStatusTextIndex.value = (pendingStatusTextIndex.value + 1) % LUNCH_PENDING_STATUS_TEXTS.length
  }, LUNCH_PENDING_STATUS_INTERVAL_MS)
}

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
  await fetchLunchRegionTree()
  if (isIntroDestroyed) return

  const elapsed = Date.now() - startedAt
  introStartTimer = setTimeout(
    () => {
      isContentVisible.value = true
    },
    Math.max(0, LUNCH_INTRO_CONTENT_REVEAL_MS - elapsed),
  )
  introEndTimer = setTimeout(
    () => {
      isIntroPlaying.value = false
    },
    Math.max(0, LUNCH_INTRO_END_MS - elapsed),
  )
}

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
    if (isPending) {
      startPendingStatusRotation()
      return
    }
    clearPendingStatusTimer()
  },
  { immediate: true },
)

watch(
  () => isRecommendationResponseStreaming.value && hasResultRecommendations.value,
  (isStreamingResults) => {
    if (isStreamingResults) startPendingStatusRotation()
    else if (!isRecommendationsPending.value) clearPendingStatusTimer()
  },
)

onMounted(() => {
  isIntroDestroyed = false
  void startIntroSequence()
})

onUnmounted(() => {
  isIntroDestroyed = true
  clearIntroTimers()
  clearPendingStatusTimer()
})

const setFormValue = (key: keyof LunchAgentFormPayload, value: string | number) => {
  form[key] = String(value)
}

const getThumbDisplaySrc = (item: LunchRecommendationItem): string => getLunchThumbDisplaySrc(item.imageUrl)

const hasThumbUrl = (item: LunchRecommendationItem) => {
  const url = String(item.imageUrl ?? '').trim()
  return url.length > 0 && !isLunchMenuImagePlaceholderUrl(url)
}

/** 추천 목록 보이는 안 썸네일: URL 유무에 따라 스피너 표시 */
const isThumbAwaitingUrlInFlight = (item: LunchRecommendationItem) => !hasThumbUrl(item) && shouldRenderResultList.value

const isThumbImageDecoded = (idx: number, item: LunchRecommendationItem) => {
  const url = String(item.imageUrl ?? '').trim()
  if (!url) return false
  return thumbLoadedKeySet.value.has(thumbKey(idx, url))
}

const showThumbLoadingOverlay = (idx: number, item: LunchRecommendationItem) =>
  isThumbAwaitingUrlInFlight(item) || (hasThumbUrl(item) && !isThumbImageDecoded(idx, item))

const onThumbImgLoad = (idx: number, item: LunchRecommendationItem) => {
  const url = String(item.imageUrl ?? '').trim()
  if (!url) return
  const k = thumbKey(idx, url)
  const next = new Set(thumbLoadedKeySet.value)
  next.add(k)
  thumbLoadedKeySet.value = next
}

const onThumbImgError = (idx: number, item: LunchRecommendationItem) => {
  onThumbImgLoad(idx, item)
}

watch(
  visibleRecommendations,
  (list) => {
    const next = new Set<string>()
    list.forEach((item, idx) => {
      const url = String(item.imageUrl ?? '').trim()
      if (!url || isLunchMenuImagePlaceholderUrl(url)) return
      const k = thumbKey(idx, url)
      if (thumbLoadedKeySet.value.has(k)) next.add(k)
    })
    thumbLoadedKeySet.value = next
  },
  { deep: true },
)

const onSubmitClick = () => {
  const requiredChecks: Array<{ isInvalid: boolean; fieldRef: HTMLElement | null }> = [
    { isInvalid: !isLocationAnswered.value, fieldRef: locationFieldRef.value },
    { isInvalid: !form.mood, fieldRef: moodFieldRef.value },
    { isInvalid: !form.budget, fieldRef: budgetFieldRef.value },
    { isInvalid: !form.peopleCount, fieldRef: peopleFieldRef.value },
    { isInvalid: !form.cuisineType, fieldRef: cuisineFieldRef.value },
  ]
  const firstInvalid = requiredChecks.find((check) => check.isInvalid)
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

@mixin lunch-content-reveal($duration, $delay: 0s) {
  opacity: var(--lunch-content-opacity);
  transform: translateY(var(--lunch-content-shift));
  transition:
    opacity $duration ease $delay,
    transform $duration ease $delay;
}

@mixin lunch-theme-avatar($size) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: $size;
  height: $size;
  border-radius: 50%;
  background: var(--lunch-theme-color);
  color: #fff;
}

@mixin lunch-emphasis-title($typo-map) {
  @include typo($typo-map);
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

@mixin lunch-panel-surface {
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
}

.chat-lunch-agent-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: auto;
  /* 인트로·선택 폼·추천 대기·결과 카드 공통 최소 높이 (TodayMeme 인트로와 동일 계열) */
  min-height: min(640px, 78vh);
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;
  --lunch-content-opacity: 0;
  --lunch-content-shift: 8px;

  /* 채팅 인덱스 오버레이: 부모 flex 영역을 채워 인트로↔선택 폼 전환 시 외곽 크기 고정 */
  &.chat-index-survey {
    height: 100%;
    min-height: min(640px, 78vh);
  }

  &.is-intro-playing {
    min-height: min(640px, 78vh);
    border-color: transparent;
  }

  &.is-intro-playing:not(.is-content-visible) {
    --lunch-content-opacity: 0;
    --lunch-content-shift: 8px;
  }

  &.is-content-visible {
    --lunch-content-opacity: 1;
    --lunch-content-shift: 0px;
  }

  /* 결과 표시 카드드 */
  &.is-result-phase:not(.is-intro-playing) {
    min-height: 0;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    @include lunch-content-reveal(0.32s);
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__avatar {
    @include lunch-theme-avatar(40px);
    flex-shrink: 0;
  }

  &__title {
    @include lunch-emphasis-title($body-medium);
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
    @include lunch-content-reveal(0.36s, 0.04s);
    @include custom-scrollbar(4px);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md;
    @include lunch-panel-surface;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;

    &.is-answered {
      border-color: var(--lunch-theme-color);
      background: rgba(var(--lunch-theme-rgb), 0.03);
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
    @include lunch-content-reveal(0.28s, 0.08s);
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
    @include lunch-content-reveal(0.32s);
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
    @include lunch-panel-surface;
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

    // 설문 차트 슬롯과 동일 스피너 — 썸네일 박스 크기에 맞게 오버레이
    :deep(.pexels-loading.chat-lunch-agent-card__thumb-pexels) {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      min-height: 0;
      margin: 0;
      background: rgb(255 255 255 / 82%);
    }

    :deep(.pexels-loading.chat-lunch-agent-card__thumb-pexels .pexels-loading__spinner) {
      width: 28px;
      height: 28px;
      border-top-color: var(--lunch-theme-color, $color-primary);
    }

    &.is-pending {
      border-style: dashed;
      background: rgba(var(--lunch-theme-rgb), 0.06);
      animation: lunch-result-thumb-pulse 1.2s ease-in-out infinite;
    }
  }

  &__result-pending-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-md;
    width: 100%;
    padding: 20px;
    @include lunch-content-reveal(0.32s);
  }

  &__result-pending-text {
    @include typo($body-small);
    color: $color-text-muted;
    text-align: center;
  }

  &__result-pending-thumbs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $spacing-md;
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
    @include lunch-emphasis-title($body-medium);
  }

  &__result-rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-full;
    background: rgba(var(--lunch-theme-rgb), 0.08);
    @include typo($body-xsmall);
    color: var(--lunch-theme-color);
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
      min-width: 30px;
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
      color: var(--lunch-theme-color);
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
    border: 1px solid rgba(var(--lunch-theme-rgb), 0.22);
    background: rgba(var(--lunch-theme-rgb), 0.08);
    color: var(--lunch-theme-color);
    @include typo($body-large);
    font-weight: $font-weight-medium;
  }

  &.is-readonly {
    .chat-lunch-agent-card__chip-row {
      pointer-events: none;
    }
  }
}

@include agent-card-intro('chat-lunch-agent-card', 'intro', '--lunch-theme-color', '--lunch-theme-rgb');
@include agent-card-intro-keyframes;
@include agent-intro-transition;

@keyframes lunch-result-thumb-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>

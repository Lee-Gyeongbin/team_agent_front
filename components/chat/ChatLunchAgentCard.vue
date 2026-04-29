<template>
  <section
    class="chat-lunch-agent-card"
    :class="{
      'is-readonly': props.readonly,
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="themeStyle"
  >
    <Transition name="lunch-intro">
      <div
        v-if="isIntroPlaying && !hasResultRecommendations"
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

    <div class="chat-lunch-agent-card__header">
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
      v-if="!hasResultRecommendations"
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
      v-if="hasResultRecommendations"
      class="chat-lunch-agent-card__result-list"
    >
      <li
        v-for="(item, idx) in recommendations"
        :key="`${item.restaurant}-${idx}`"
        class="chat-lunch-agent-card__result-item"
      >
        <div class="chat-lunch-agent-card__result-main">
          <div class="chat-lunch-agent-card__result-thumb">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="`${item.restaurant} 이미지`"
            />
            <i
              v-else
              class="icon-image size-20"
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

    <div
      v-if="!hasResultRecommendations"
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
          조건 입력 완료 후 추천받기
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
  LUNCH_BUDGET_OPTIONS,
  LUNCH_CUISINE_OPTIONS,
  LUNCH_MOOD_OPTIONS,
  LUNCH_PEOPLE_OPTIONS,
  normalizeLunchLocationMap,
} from '~/utils/chat/lunchAgentUtil'

interface Props {
  readonly?: boolean
  initialPayload?: LunchAgentFormPayload
  recommendations?: LunchRecommendationItem[]
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialPayload: undefined,
  recommendations: () => [],
  themeIconClassNm: '',
  themeColorHex: '',
})

const emit = defineEmits<{
  submit: [payload: LunchAgentFormPayload]
  close: []
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

const recommendations = computed(() => props.recommendations ?? [])
const hasResultRecommendations = computed(() => recommendations.value.length > 0)
const isLocationAnswered = computed(() => !!form.sido && !!form.sigungu && !!form.dong)
const hasSelectedSido = computed(() => !!form.sido)
const hasSelectedSigungu = computed(() => !!form.sigungu)
const isLocationSelectionMode = computed(
  () => !hasResultRecommendations.value && !props.readonly && !props.initialPayload,
)
const introTitleChars = '점심 메뉴 추천 에이전트'.split('')
const introSubtitleChars = '조건을 분석하고 있습니다...'.split('')

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

const getShouldPlayIntro = () => !props.readonly && !hasResultRecommendations.value && !props.initialPayload
const isIntroPlaying = ref(getShouldPlayIntro())
const isContentVisible = ref(!getShouldPlayIntro())
let introStartTimer: ReturnType<typeof setTimeout> | null = null
let introEndTimer: ReturnType<typeof setTimeout> | null = null

const clearIntroTimers = () => {
  if (introStartTimer) clearTimeout(introStartTimer)
  if (introEndTimer) clearTimeout(introEndTimer)
  introStartTimer = null
  introEndTimer = null
}

const startIntroSequence = () => {
  clearIntroTimers()
  if (!getShouldPlayIntro()) {
    isIntroPlaying.value = false
    isContentVisible.value = true
    return
  }
  isIntroPlaying.value = true
  isContentVisible.value = false
  introStartTimer = setTimeout(() => {
    isContentVisible.value = true
  }, 2100)
  introEndTimer = setTimeout(() => {
    isIntroPlaying.value = false
  }, 3100)
}

onMounted(() => {
  startIntroSequence()
  if (isLocationSelectionMode.value) {
    fetchLunchRegionTree()
  }
})

onUnmounted(() => {
  clearIntroTimers()
})

const setFormValue = (key: keyof LunchAgentFormPayload, value: string | number) => {
  form[key] = String(value)
}

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
  height: 100%;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;
  --lunch-content-opacity: 0;
  --lunch-content-shift: 8px;

  &.is-content-visible {
    --lunch-content-opacity: 1;
    --lunch-content-shift: 0px;
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
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: 20px;
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

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
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
    align-items: center;
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
    @include typo($body-medium);
    font-weight: $font-weight-medium;
  }

  &__intro {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
    pointer-events: none;
  }

  &__intro-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: $spacing-xs;
  }

  &__intro-avatar {
    @include lunch-theme-avatar(44px);
  }

  &__intro-title {
    @include lunch-emphasis-title($body-large);
  }

  &__intro-subtitle {
    @include typo($body-medium);
    color: $color-text-muted;
  }

  &__intro-char {
    display: inline-block;
    animation: lunch-intro-text-bounce 1.15s ease-in-out infinite;
    animation-delay: var(--intro-char-delay, 0s);
  }

  &.is-readonly {
    .chat-lunch-agent-card__chip-row {
      pointer-events: none;
    }
  }
}

.lunch-intro-enter-active,
.lunch-intro-leave-active {
  transition: opacity 0.25s ease;
}

.lunch-intro-enter-from,
.lunch-intro-leave-to {
  opacity: 0;
}

@keyframes lunch-intro-text-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  35% {
    transform: translateY(-2px);
  }
  65% {
    transform: translateY(0.5px);
  }
}
</style>

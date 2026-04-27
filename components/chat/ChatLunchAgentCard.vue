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
          <p class="chat-lunch-agent-card__intro-title">점심 메뉴 추천 에이전트</p>
          <p class="chat-lunch-agent-card__intro-subtitle">조건을 분석하고 있습니다...</p>
        </div>
      </div>
    </Transition>

    <div
      v-if="isContentVisible"
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
      v-if="isContentVisible && !hasResultRecommendations"
      class="chat-lunch-agent-card__body"
    >
      <div
        class="chat-lunch-agent-card__field"
        :class="{ 'is-answered': isLocationAnswered }"
      >
        <p class="chat-lunch-agent-card__label">현재 위치는?</p>
        <div class="chat-lunch-agent-card__location-grid">
          <UiSelect
            :model-value="form.sido"
            :options="sidoOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeSido($event)"
          />
          <UiSelect
            :model-value="form.sigungu"
            :options="sigunguOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeSigungu($event)"
          />
          <UiSelect
            :model-value="form.dong"
            :options="dongOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeDong($event)"
          />
        </div>
      </div>

      <div
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
            @click="!props.readonly && onSelectMood(option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
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
            @click="!props.readonly && onSelectBudget(option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
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
            @click="!props.readonly && onSelectPeople(option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>

      <div
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
            @click="!props.readonly && onSelectCuisine(option)"
          >
            {{ option }}
          </UiButton>
        </div>
      </div>
    </div>

    <ul
      v-if="isContentVisible && hasResultRecommendations"
      class="chat-lunch-agent-card__result-list"
    >
      <li
        v-for="(item, idx) in recommendations"
        :key="`${item.restaurant}-${idx}`"
        class="chat-lunch-agent-card__result-item"
      >
        <div class="chat-lunch-agent-card__result-item-head">
          <p class="chat-lunch-agent-card__result-name">{{ item.restaurant }}</p>
          <span class="chat-lunch-agent-card__result-rank">추천 {{ idx + 1 }}</span>
        </div>
        <dl class="chat-lunch-agent-card__result-meta">
          <div class="chat-lunch-agent-card__result-meta-row">
            <dt>메뉴</dt>
            <dd>{{ item.menu }}</dd>
          </div>
          <div class="chat-lunch-agent-card__result-meta-row">
            <dt>가격</dt>
            <dd>{{ item.price }}</dd>
          </div>
          <div class="chat-lunch-agent-card__result-meta-row">
            <dt>위치</dt>
            <dd>{{ item.location }}</dd>
          </div>
        </dl>
      </li>
    </ul>

    <div
      v-if="isContentVisible && !hasResultRecommendations"
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
          size="md"
          @click="emit('close')"
        >
          닫기
        </UiButton>
        <UiButton
          variant="dark"
          size="md"
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
import type { LunchAgentFormPayload, LunchRecommendationItem } from '~/types/chat'
import {
  LUNCH_BUDGET_OPTIONS,
  LUNCH_CUISINE_OPTIONS,
  LUNCH_LOCATION_MAP,
  LUNCH_MOOD_OPTIONS,
  LUNCH_PEOPLE_OPTIONS,
  getLunchAnsweredCount,
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

const toSelectOptions = (list: string[]) => list.map((item) => ({ label: item, value: item }))
const sidoList = Object.keys(LUNCH_LOCATION_MAP)
const form = reactive<LunchAgentFormPayload>({
  sido: sidoList[0] ?? '',
  sigungu: '',
  dong: '',
  mood: LUNCH_MOOD_OPTIONS[0] ?? '',
  budget: LUNCH_BUDGET_OPTIONS[0] ?? '',
  peopleCount: LUNCH_PEOPLE_OPTIONS[0] ?? '',
  cuisineType: LUNCH_CUISINE_OPTIONS[0] ?? '',
})

const recommendations = computed(() => props.recommendations ?? [])
const hasResultRecommendations = computed(() => recommendations.value.length > 0)
const isLocationAnswered = computed(() => !!form.sido && !!form.sigungu && !!form.dong)
const displayAnsweredCount = computed(() => getLunchAnsweredCount(form))

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

const sidoOptions = computed(() => toSelectOptions(sidoList))
const sigunguList = computed(() => Object.keys(LUNCH_LOCATION_MAP[form.sido] ?? {}))
const sigunguOptions = computed(() => toSelectOptions(sigunguList.value))
const dongList = computed(() => LUNCH_LOCATION_MAP[form.sido]?.[form.sigungu] ?? [])
const dongOptions = computed(() => toSelectOptions(dongList.value))

watch(
  sigunguList,
  (list) => {
    if (!list.length) {
      form.sigungu = ''
      form.dong = ''
      return
    }
    if (!list.includes(form.sigungu)) form.sigungu = list[0]
  },
  { immediate: true },
)

watch(
  dongList,
  (list) => {
    if (!list.length) {
      form.dong = ''
      return
    }
    if (!list.includes(form.dong)) form.dong = list[0]
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

const getShouldPlayIntro = () => !props.readonly && !hasResultRecommendations.value && displayAnsweredCount.value === 0
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
  }, 1600)
  introEndTimer = setTimeout(() => {
    isIntroPlaying.value = false
  }, 2300)
}

onMounted(() => {
  startIntroSequence()
})

onUnmounted(() => {
  clearIntroTimers()
})

const onChangeSido = (value: string | number) => {
  form.sido = String(value)
}
const onChangeSigungu = (value: string | number) => {
  form.sigungu = String(value)
}
const onChangeDong = (value: string | number) => {
  form.dong = String(value)
}

const onSelectMood = (option: string) => {
  form.mood = option
}
const onSelectBudget = (option: string) => {
  form.budget = option
}
const onSelectPeople = (option: string) => {
  form.peopleCount = option
}
const onSelectCuisine = (option: string) => {
  form.cuisineType = option
}

const onSubmitClick = () => {
  emit('submit', { ...form })
}
</script>
<style lang="scss" scoped>
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
  --lunch-content-opacity: 1;
  --lunch-content-shift: 0px;

  &.is-intro-playing {
    --lunch-content-opacity: 0;
    --lunch-content-shift: 8px;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    opacity: var(--lunch-content-opacity);
    transform: translateY(var(--lunch-content-shift));
    transition:
      opacity 0.32s ease,
      transform 0.32s ease;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--lunch-theme-color);
    color: #fff;
    flex-shrink: 0;
  }

  &__title {
    @include typo($body-medium);
    font-weight: $font-weight-semibold;
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
    padding: $spacing-lg $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    opacity: var(--lunch-content-opacity);
    transform: translateY(var(--lunch-content-shift));
    transition:
      opacity 0.36s ease 0.04s,
      transform 0.36s ease 0.04s;
    @include custom-scrollbar(4px);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md;
    background: #fff;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
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
    gap: $spacing-sm;
    padding: $spacing-md $spacing-xl;
    border-top: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    opacity: var(--lunch-content-opacity);
    transform: translateY(var(--lunch-content-shift));
    transition:
      opacity 0.28s ease 0.08s,
      transform 0.28s ease 0.08s;
  }

  &__result-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
  }

  &__result-item {
    padding: $spacing-md;
    border: 1px solid $color-border;
    border-radius: $border-radius-base;
    @include typo($body-small);
    color: $color-text-primary;
    background: #fff;
  }

  &__result-item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__result-name {
    @include typo($body-medium);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
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
    gap: $spacing-xs;

    dt {
      min-width: 30px;
      @include typo($body-xsmall);
      font-weight: $font-weight-semibold;
      color: $color-text-secondary;
    }

    dd {
      margin: 0;
      @include typo($body-small);
      color: $color-text-primary;
      word-break: break-word;
    }
  }

  &__submitted-badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 7px 12px;
    border-radius: 8px;
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
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: var(--lunch-theme-color);
  }

  &__intro-title {
    @include typo($body-large);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__intro-subtitle {
    @include typo($body-medium);
    color: $color-text-muted;
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
</style>

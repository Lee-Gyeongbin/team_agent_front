<template>
  <section
    class="chat-lunch-agent-card"
    :class="{ 'is-readonly': props.readonly, 'is-result': isResultMode }"
  >
    <div class="chat-lunch-agent-card__header">
      <div class="chat-lunch-agent-card__header-info">
        <div class="chat-lunch-agent-card__avatar">
          <i class="icon-bot size-24" />
        </div>
        <div>
          <p class="chat-lunch-agent-card__title">
            {{ isResultMode ? '점심 메뉴 추천 결과' : '점심 메뉴 추천 에이전트' }}
          </p>
          <p class="chat-lunch-agent-card__subtitle">
            {{
              isResultMode
                ? '입력 조건을 바탕으로 추천된 식당 목록입니다.'
                : props.readonly
                  ? '추천 요청이 완료되었습니다.'
                  : '질문에 답하면 조건에 맞는 메뉴와 식당을 추천해드려요.'
            }}
          </p>
        </div>
      </div>
      <span
        v-if="isResultMode"
        class="chat-lunch-agent-card__result-count"
      >
        {{ recommendations.length }}건
      </span>
    </div>

    <div
      v-if="!isResultMode"
      class="chat-lunch-agent-card__body"
    >
      <div
        class="chat-lunch-agent-card__field"
        :class="{
          'is-answered': isLocationAnswered,
        }"
      >
        <p class="chat-lunch-agent-card__label">현재 위치는?</p>
        <div class="chat-lunch-agent-card__location-grid">
          <UiSelect
            :model-value="selectedSido"
            :options="sidoOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeSido($event)"
          />
          <UiSelect
            :model-value="selectedSigungu"
            :options="sigunguOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeSigungu($event)"
          />
          <UiSelect
            :model-value="selectedDong"
            :options="dongOptions"
            :disabled="props.readonly"
            @update:model-value="!props.readonly && onChangeDong($event)"
          />
        </div>
      </div>

      <div
        class="chat-lunch-agent-card__field"
        :class="{
          'is-answered': !!selectedMood,
        }"
      >
        <p class="chat-lunch-agent-card__label">오늘 어떤 음식을 드시고 싶으신가요?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in moodOptions"
            :key="option"
            :variant="selectedMood === option ? 'primary' : 'line-secondary'"
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
        :class="{
          'is-answered': !!selectedBudget,
        }"
      >
        <p class="chat-lunch-agent-card__label">예산은 어느 정도인가요? (1인 기준)</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in budgetOptions"
            :key="option"
            :variant="selectedBudget === option ? 'primary' : 'line-secondary'"
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
        :class="{
          'is-answered': !!selectedPeopleCount,
        }"
      >
        <p class="chat-lunch-agent-card__label">몇 명이 식사하나요?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in peopleOptions"
            :key="option"
            :variant="selectedPeopleCount === option ? 'primary' : 'line-secondary'"
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
        :class="{
          'is-answered': !!selectedCuisineType,
        }"
      >
        <p class="chat-lunch-agent-card__label">선호하는 음식종류는?</p>
        <div class="chat-lunch-agent-card__chip-row">
          <UiButton
            v-for="option in cuisineOptions"
            :key="option"
            :variant="selectedCuisineType === option ? 'primary' : 'line-secondary'"
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
      v-else
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
      v-if="!isResultMode"
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
          @click="onSubmit"
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
// 🔽 더미 데이터
const locationMap: Record<string, Record<string, string[]>> = {
  서울특별시: {
    강남구: ['역삼동', '삼성동', '논현동'],
    마포구: ['서교동', '합정동', '상암동'],
  },
  경기도: {
    성남시: ['분당동', '정자동', '서현동'],
    수원시: ['영통동', '광교동', '인계동'],
  },
}

const peopleOptions = ['1명', '2명', '3~4명', '5명 이상']
const cuisineOptions = ['한식', '중식', '양식', '일식', '패스트푸드', '아시아음식', '상관없음']
const moodOptions = ['든든하게', '가볍게', '매콤하게', '달달하게', '깔끔하게', '상관없음']
const budgetOptions = ['8,000 ~ 12,000원', '12,000 ~ 15,000원', '15,000 ~ 20,000원', '20,000원 이상']
interface Props {
  readonly?: boolean
  initialPayload?: LunchAgentFormPayload
  recommendations?: LunchRecommendationItem[]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialPayload: undefined,
  recommendations: () => [],
})

const emit = defineEmits<{
  submit: [payload: LunchAgentFormPayload]
  close: []
}>()

const toSelectOptions = (list: string[]) => list.map((item) => ({ label: item, value: item }))

const sidoList = Object.keys(locationMap)
const selectedSido = ref(sidoList[0] ?? '')
const selectedSigungu = ref('')
const selectedDong = ref('')
const selectedMood = ref(moodOptions[0])
const selectedBudget = ref(budgetOptions[0])
const selectedPeopleCount = ref(peopleOptions[0])
const selectedCuisineType = ref(cuisineOptions[0])

const sidoOptions = computed(() => toSelectOptions(sidoList))
const sigunguList = computed(() => Object.keys(locationMap[selectedSido.value] ?? {}))
const sigunguOptions = computed(() => toSelectOptions(sigunguList.value))
const dongList = computed(() => locationMap[selectedSido.value]?.[selectedSigungu.value] ?? [])
const dongOptions = computed(() => toSelectOptions(dongList.value))
const isLocationAnswered = computed(() => !!selectedSido.value && !!selectedSigungu.value && !!selectedDong.value)
const recommendations = computed(() => props.recommendations ?? [])
const isResultMode = computed(() => recommendations.value.length > 0)

const applyPayloadToForm = (payload?: LunchAgentFormPayload) => {
  if (!payload) return
  selectedSido.value = payload.sido
  selectedSigungu.value = payload.sigungu
  selectedDong.value = payload.dong
  selectedMood.value = payload.mood
  selectedBudget.value = payload.budget
  selectedPeopleCount.value = payload.peopleCount
  selectedCuisineType.value = payload.cuisineType
}

watch(
  sigunguList,
  (list) => {
    if (!list.length) {
      selectedSigungu.value = ''
      selectedDong.value = ''
      return
    }
    if (!list.includes(selectedSigungu.value)) {
      selectedSigungu.value = list[0]
    }
  },
  { immediate: true },
)

watch(
  dongList,
  (list) => {
    if (!list.length) {
      selectedDong.value = ''
      return
    }
    if (!list.includes(selectedDong.value)) {
      selectedDong.value = list[0]
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

const onChangeSido = (value: string | number) => {
  selectedSido.value = String(value)
}

const onChangeSigungu = (value: string | number) => {
  selectedSigungu.value = String(value)
}

const onChangeDong = (value: string | number) => {
  selectedDong.value = String(value)
}

const onSelectMood = (option: string) => {
  selectedMood.value = option
}

const onSelectBudget = (option: string) => {
  selectedBudget.value = option
}

const onSelectPeople = (option: string) => {
  selectedPeopleCount.value = option
}

const onSelectCuisine = (option: string) => {
  selectedCuisineType.value = option
}

const onSubmit = () => {
  if (props.readonly) return

  emit('submit', {
    sido: selectedSido.value,
    sigungu: selectedSigungu.value,
    dong: selectedDong.value,
    mood: selectedMood.value,
    budget: selectedBudget.value,
    peopleCount: selectedPeopleCount.value,
    cuisineType: selectedCuisineType.value,
  })
}
</script>

<style lang="scss" scoped>
.chat-lunch-agent-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: 100%;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
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
    background: $color-primary;
    color: #fff;
    flex-shrink: 0;
  }

  &__result-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: flex-end;
    min-width: 52px;
    padding: 3px $spacing-sm;
    border-radius: $border-radius-full;
    border: 1px solid rgba(60, 105, 219, 0.22);
    background: rgba(60, 105, 219, 0.06);
    @include typo($body-xsmall);
    font-weight: $font-weight-semibold;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: $color-primary;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    @include custom-scrollbar(4px);
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
      border-color: $color-primary;
      background: rgba(60, 105, 219, 0.03);
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
    background: rgba(60, 105, 219, 0.08);
    @include typo($body-xsmall);
    color: $color-primary;
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
    padding: $spacing-xs $spacing-md;
    border-radius: $border-radius-full;
    background: rgba(60, 105, 219, 0.08);
    color: $color-primary;
    @include typo($body-small);
    font-weight: $font-weight-medium;
  }

  &.is-readonly {
    .chat-lunch-agent-card__chip-row {
      pointer-events: none;
    }
  }

  &.is-result {
    height: auto;
  }
}
</style>

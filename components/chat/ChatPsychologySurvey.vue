<template>
  <div
    class="psychology-survey"
    :class="{ 'is-readonly': readonly }"
  >
    <!-- 헤더 -->
    <div class="psychology-survey__header">
      <div class="psychology-survey__header-info">
        <div class="psychology-survey__avatar">
          <i class="icon-bot size-24" />
        </div>
        <div>
          <p class="psychology-survey__title">산업심리 스트레스 진단</p>
          <p class="psychology-survey__subtitle">
            {{ readonly ? '진단이 완료되었습니다.' : '아래 25가지 문항에 솔직하게 응답해 주세요.' }}
          </p>
        </div>
      </div>
      <div class="psychology-survey__progress">
        <span
          class="psychology-survey__progress-text"
          :class="{ 'is-complete': readonly }"
        >
          {{ displayAnsweredCount }} / {{ PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS }}
        </span>
        <div class="psychology-survey__progress-bar">
          <div
            class="psychology-survey__progress-fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- 문항 목록 -->
    <div
      ref="surveyScrollRef"
      class="psychology-survey__body"
    >
      <div
        v-for="category in PSYCHOLOGY_SURVEY_CATEGORIES"
        :key="category.no"
        class="psychology-survey__category"
      >
        <!-- 카테고리 헤더 -->
        <div class="psychology-survey__category-header">
          <span class="psychology-survey__category-no">{{ category.no }}</span>
          <div class="psychology-survey__category-title-wrap">
            <span class="psychology-survey__category-title">{{ category.title }}</span>
            <span class="psychology-survey__category-title-en">{{ category.titleEn }}</span>
          </div>
        </div>

        <!-- 해당 카테고리 문항들 -->
        <div
          v-for="question in category.questions"
          :key="question.no"
          :id="questionBlockId(question.no)"
          class="psychology-survey__question"
          tabindex="-1"
          :class="{
            'is-answered': displayAnswers[question.no] != null,
            'is-missing-alert': !readonly && focusWarningQuestionNo === question.no,
          }"
        >
          <div class="psychology-survey__question-text">
            <span class="psychology-survey__question-no">Q{{ question.no }}</span>
            <span class="psychology-survey__question-content">{{ question.text }}</span>
          </div>
          <div class="psychology-survey__options">
            <button
              v-for="option in PSYCHOLOGY_SURVEY_SCORE_OPTIONS"
              :key="option.value"
              type="button"
              class="psychology-survey__option-btn"
              :class="{ 'is-selected': displayAnswers[question.no] === option.value }"
              :disabled="readonly"
              @click="!readonly && onSelectAnswer(question.no, option.value)"
            >
              <span class="psychology-survey__option-score">{{ option.value }}</span>
              <span class="psychology-survey__option-label">{{ option.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 액션 -->
    <div class="psychology-survey__footer">
      <template v-if="readonly">
        <span class="psychology-survey__submitted-badge">
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
          진단 완료 후 상담 시작
          <template #icon-right>
            <i class="icon-arrow-right size-16" />
          </template>
        </UiButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  usePsychologySurvey,
  PSYCHOLOGY_SURVEY_CATEGORIES,
  PSYCHOLOGY_SURVEY_SCORE_OPTIONS,
  PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS,
} from '~/utils/chat/psychologyConsultUtil'
import { openToast } from '~/composables/useToast'

interface Props {
  /** 제출 완료 상태: true이면 선택 불가·하단 버튼 숨김 */
  readonly?: boolean
  /** readonly 모드에서 표시할 응답 데이터 */
  initialAnswers?: Record<number, number>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialAnswers: undefined,
})

const { surveyAnswers, answeredCount, isSurveyComplete, setSurveyAnswer } = usePsychologySurvey()

const emit = defineEmits<{
  close: []
  submit: []
}>()

const surveyScrollRef = ref<HTMLElement | null>(null)

/** readonly일 때는 initialAnswers, 아니면 공유 상태 */
const displayAnswers = computed<Record<number, number>>(() =>
  props.readonly && props.initialAnswers ? props.initialAnswers : surveyAnswers.value,
)

const displayAnsweredCount = computed(() => {
  if (props.readonly && props.initialAnswers) return Object.keys(props.initialAnswers).length
  return answeredCount.value
})

const progressPercent = computed(() =>
  Math.round((displayAnsweredCount.value / PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS) * 100),
)

const surveyDomId = useId().replace(/:/g, '')

const questionBlockId = (questionNo: number) => `psychology-survey-q-${surveyDomId}-${questionNo}`

/** 미완료 제출 시 강조할 문항 번호 (스크롤·포커스·테두리) */
const focusWarningQuestionNo = ref<number | null>(null)

const findFirstUnansweredQuestionNo = (): number | null => {
  const answers = displayAnswers.value
  for (let i = 1; i <= PSYCHOLOGY_SURVEY_TOTAL_QUESTIONS; i++) {
    if (answers[i] == null) return i
  }
  return null
}

const onSelectAnswer = (questionNo: number, score: number) => {
  setSurveyAnswer(questionNo, score)
  focusWarningQuestionNo.value = null
}

const onSubmitClick = async () => {
  if (props.readonly) return
  if (isSurveyComplete.value) {
    emit('submit')
    return
  }
  const firstMissing = findFirstUnansweredQuestionNo()
  if (firstMissing == null) {
    emit('submit')
    return
  }
  openToast({ message: '모든 항목에 응답해야합니다.', type: 'warning' })
  focusWarningQuestionNo.value = firstMissing
  await nextTick()
  const el = document.getElementById(questionBlockId(firstMissing))
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  await nextTick()
  requestAnimationFrame(() => {
    el?.focus({ preventScroll: true })
  })
}
</script>

<style lang="scss" scoped>
.psychology-survey {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: 100%;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
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

  &__progress {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__progress-text {
    @include typo($body-small);
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    white-space: nowrap;
    min-width: 40px;
    text-align: right;
  }

  &__progress-bar {
    flex: 1;
    height: 4px;
    background: $color-border;
    border-radius: 2px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: $color-primary;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;

    @include custom-scrollbar(4px);
  }

  &__category {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__category-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-md;
    background: $color-surface;
    border-radius: $border-radius-sm;
    border-left: 3px solid $color-primary;
  }

  &__category-no {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: $color-primary;
    color: #fff;
    @include typo($body-xsmall);
    font-weight: $font-weight-semibold;
    flex-shrink: 0;
  }

  &__category-title-wrap {
    display: flex;
    align-items: baseline;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__category-title {
    @include typo($body-small);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__category-title-en {
    @include typo($body-xsmall);
    color: $color-text-muted;
  }

  &__question {
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

    &.is-missing-alert {
      border-color: $color-error;
      background: rgba(220, 53, 69, 0.06);
      box-shadow: 0 0 0 1px rgba(220, 53, 69, 0.35);
      outline: none;
    }

    &:focus-visible.is-missing-alert {
      box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.45);
    }
  }

  &__question-text {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
  }

  &__question-no {
    @include typo($body-xsmall);
    font-weight: $font-weight-semibold;
    color: $color-primary;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 1px;
  }

  &__question-content {
    @include typo($body-small);
    color: $color-text-primary;
    line-height: 1.6;
  }

  &__options {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
    margin-left: calc(28px + #{$spacing-sm});
  }

  &__option-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 70px;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    background: $color-surface;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      color 0.15s ease;

    &:hover {
      border-color: $color-primary;
      background: #fff;
    }

    &.is-selected {
      border-color: $color-primary;
      background: $color-primary;

      .psychology-survey__option-score {
        color: #fff;
      }

      .psychology-survey__option-label {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }

  &__option-score {
    @include typo($body-small);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    line-height: 1;
  }

  &__option-label {
    @include typo($body-xsmall);
    color: $color-text-muted;
    white-space: nowrap;
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

  &__progress-text.is-complete {
    color: $color-primary;
    font-weight: $font-weight-semibold;
  }

  // 읽기전용 상태: 옵션 버튼 커서·hover 비활성화
  &.is-readonly {
    .psychology-survey__option-btn {
      cursor: default;
      pointer-events: none;
    }
  }
}
</style>

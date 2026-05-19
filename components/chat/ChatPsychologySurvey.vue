<template>
  <div
    class="psychology-survey"
    :class="{
      'is-readonly': readonly,
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="surveyThemeStyle"
  >
    <Transition name="survey-intro">
      <div
        v-if="isIntroPlaying"
        class="psychology-survey__intro"
        aria-live="polite"
      >
        <div class="psychology-survey__intro-inner">
          <div class="psychology-survey__intro-avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <p class="psychology-survey__intro-title">
            <span
              v-for="(char, index) in introTitleChars"
              :key="`intro-title-${index}`"
              class="psychology-survey__intro-char"
              :style="{ '--intro-char-delay': `${index * 0.03}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
          <p class="psychology-survey__intro-subtitle">
            <span
              v-for="(char, index) in introSubtitleChars"
              :key="`intro-subtitle-${index}`"
              class="psychology-survey__intro-char"
              :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </p>
        </div>
      </div>
    </Transition>

    <!-- Step 0: 성별 선택 (readonly가 아닌 활성 설문에서만 표시) -->
    <div
      v-if="!readonly && isGenderStepVisible && !isIntroPlaying"
      class="psychology-survey__gender-step"
    >
      <div class="psychology-survey__gender-avatar">
        <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
      </div>
      <p class="psychology-survey__gender-title">진단 전 성별을 선택해 주세요</p>
      <p class="psychology-survey__gender-desc">
        KOSS-SF1 직무스트레스 척도는 성별에 따라 위험군 판정 기준이 다릅니다.
      </p>
      <div class="psychology-survey__gender-btns">
        <button
          type="button"
          class="psychology-survey__gender-btn"
          :class="{ 'is-selected': surveyGender === 'male' }"
          @click="onSelectGender('male')"
        >
          <i class="icon-user size-24" />
          <span>남성</span>
        </button>
        <button
          type="button"
          class="psychology-survey__gender-btn"
          :class="{ 'is-selected': surveyGender === 'female' }"
          @click="onSelectGender('female')"
        >
          <i class="icon-user size-24" />
          <span>여성</span>
        </button>
      </div>
      <div class="psychology-survey__gender-footer">
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="emit('close')"
        >
          닫기
        </UiButton>
      </div>
    </div>

    <!-- 헤더 -->
    <div
      v-if="isContentVisible && (!isGenderStepVisible || readonly)"
      class="psychology-survey__header"
    >
      <div class="psychology-survey__header-info">
        <div class="psychology-survey__header-info-left">
          <div class="psychology-survey__avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <div>
            <p class="psychology-survey__title">한국인 직무스트레스 요인 평가</p>
            <p
              v-if="readonly"
              class="psychology-survey__subtitle"
            >
              진단이 완료되었습니다.
            </p>
          </div>
        </div>
        <!-- 성별 배지 (성별 선택 후 노출) -->
        <div
          v-if="surveyGender"
          class="psychology-survey__gender-badge"
        >
          <i class="icon-user size-14" />
          {{ surveyGender === 'male' ? '남성' : '여성' }}
        </div>
      </div>
      <!-- KOSS-SF2 안내문 (설문 진행 중에만 표시) -->
      <div
        v-if="!readonly"
        class="psychology-survey__disclaimer"
      >
        <span class="psychology-survey__disclaimer-source">
          출처 : 한국형 직무스트레스 평가도구 (KOSS-SF2) : 한국산업안전보건공단
        </span>
        <p>
          본 AI 에이전트는 한국인 직무스트레스 요인 평가도구 단축형 2, KOSS-SF2를 기반으로 직장인의 직무스트레스 요인을
          분석합니다. 사용자의 응답 결과를 8개 영역별로 환산하여 정상, 경계, 고위험 수준을 제시하고, 주요 스트레스
          원인에 따른 맞춤형 관리 가이드를 제공합니다. 본 결과는 의학적 진단이 아니며, 건강 이상이나 심리적 어려움이
          지속될 경우 전문가 상담을 권장합니다.
        </p>
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
      v-if="isContentVisible && (!isGenderStepVisible || readonly)"
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
          :id="questionBlockId(question.no)"
          :key="question.no"
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
    <div
      v-if="isContentVisible && (!isGenderStepVisible || readonly)"
      class="psychology-survey__footer"
    >
      <template v-if="readonly">
        <span class="psychology-survey__submitted-badge">
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
  type SurveyGender,
} from '~/utils/chat/psychologyConsultUtil'
import { openToast } from '~/composables/useToast'

interface Props {
  /** 제출 완료 상태: true이면 선택 불가·하단 버튼 숨김 */
  readonly?: boolean
  /** readonly 모드에서 표시할 응답 데이터 */
  initialAnswers?: Record<number, number>
  /** 설문 헤더 아이콘 클래스명 */
  themeIconClassNm?: string
  /** 설문 테마 포인트 색상(HEX) */
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialAnswers: undefined,
  themeIconClassNm: '',
  themeColorHex: '',
})

const {
  surveyAnswers,
  surveyGender,
  isGenderStepVisible,
  answeredCount,
  isSurveyComplete,
  setSurveyAnswer,
  confirmGender,
} = usePsychologySurvey()

const emit = defineEmits<{
  close: []
  submit: []
}>()

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
const introTitleChars = '심리 스트레스 진단'.split('')
const introSubtitleChars = '상담 세션을 준비하고 있습니다...'.split('')

const surveyDomId = useId().replace(/:/g, '')

const questionBlockId = (questionNo: number) => `psychology-survey-q-${surveyDomId}-${questionNo}`

const DEFAULT_SURVEY_THEME_HEX = '#3c69db'
const hexToRgb = (hex: string) => {
  const cleanedHex = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleanedHex)) return '60, 105, 219'
  return `${parseInt(cleanedHex.slice(0, 2), 16)}, ${parseInt(cleanedHex.slice(2, 4), 16)}, ${parseInt(cleanedHex.slice(4, 6), 16)}`
}

const surveyThemeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_SURVEY_THEME_HEX
  const colorRgb = hexToRgb(colorHex)
  return {
    '--survey-theme-color': colorHex,
    '--survey-theme-rgb': colorRgb,
  }
})

const getShouldPlayIntro = () => !props.readonly && displayAnsweredCount.value === 0
const shouldPlayIntro = computed(() => getShouldPlayIntro())
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
  if (!shouldPlayIntro.value) {
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
})

onUnmounted(() => {
  clearIntroTimers()
})

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

const onSelectGender = (gender: SurveyGender) => {
  confirmGender(gender)
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
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  height: 100%;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  overflow: hidden;
  --survey-content-opacity: 1;
  --survey-content-shift: 0px;

  &.is-intro-playing {
    --survey-content-opacity: 0;
    --survey-content-shift: 8px;
    border-color: transparent;
  }

  &.is-content-visible {
    --survey-content-opacity: 1;
    --survey-content-shift: 0px;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    opacity: var(--survey-content-opacity);
    transform: translateY(var(--survey-content-shift));
    transition:
      opacity 0.32s ease,
      transform 0.32s ease;
  }

  &__header-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-md;
  }

  &__header-info-left {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    min-width: 0;
  }

  // 성별 배지 (헤더 우측 상단)
  &__gender-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 20px;
    border: 1px solid rgba(var(--survey-theme-rgb), 0.3);
    background: rgba(var(--survey-theme-rgb), 0.08);
    color: var(--survey-theme-color);
    @include typo($body-small);
    font-weight: $font-weight-medium;
  }

  // KOSS-SF2 안내문 (인라인 채팅 출처 텍스트와 유사한 스타일)
  &__disclaimer {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-left: 2px solid $color-border;
    background: $color-surface;
    border-radius: 0 $border-radius-sm $border-radius-sm 0;
  }

  &__disclaimer-source {
    display: block;
    @include typo($body-small);
    font-weight: $font-weight-bold;
    color: $color-text-secondary;
    margin-bottom: 2px;
  }

  &__disclaimer p {
    @include typo($body-small);
    color: $color-text-muted;
    line-height: 1.6;
    margin: 0;
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--survey-theme-color);
    color: #fff;
    flex-shrink: 0;
  }

  &__title {
    @include typo($body-xlarge);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__subtitle {
    @include typo($body-large);
    color: $color-text-muted;
    margin-top: 2px;
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__progress-text {
    @include typo($body-large);
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
    background: var(--survey-theme-color);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: $spacing-xl;
    opacity: var(--survey-content-opacity);
    transform: translateY(var(--survey-content-shift));
    transition:
      opacity 0.36s ease 0.04s,
      transform 0.36s ease 0.04s;

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
    border-left: 3px solid var(--survey-theme-color);
  }

  &__category-no {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--survey-theme-color);
    color: #fff;
    @include typo($body-small);
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
    @include typo($body-large);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__category-title-en {
    @include typo($body-medium);
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
      border-color: var(--survey-theme-color);
      background: rgba(var(--survey-theme-rgb), 0.03);
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
    @include typo($body-medium);
    font-weight: $font-weight-bold;
    color: var(--survey-theme-color);
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 1px;
  }

  &__question-content {
    @include typo($body-large);
    color: $color-text-primary;
    line-height: 1.6;
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-xs;
    margin-left: calc(28px + #{$spacing-sm});
    width: 80%;
  }

  &__option-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
    padding: $spacing-xs 6px;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    background: $color-surface;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease,
      color 0.15s ease;

    &:hover {
      border-color: var(--survey-theme-color);
      background: #fff;
    }

    &.is-selected {
      border-color: var(--survey-theme-color);
      background: var(--survey-theme-color);

      .psychology-survey__option-score {
        color: #fff;
      }

      .psychology-survey__option-label {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }

  &__option-score {
    @include typo($body-large);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
    line-height: 1;
  }

  &__option-label {
    @include typo($body-medium);
    color: $color-text-muted;
    white-space: normal;
    word-break: keep-all;
    text-align: center;
    line-height: 1.35;
  }

  // Step 0: 성별 선택
  &__gender-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-lg;
    flex: 1;
    padding: $spacing-xl $spacing-xl $spacing-lg;
    text-align: center;
    animation: survey-intro-rise 0.4s ease both;
  }

  &__gender-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--survey-theme-color);
    color: #fff;
    box-shadow: 0 4px 14px rgba(var(--survey-theme-rgb), 0.35);
  }

  &__gender-title {
    @include typo($body-xlarge);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__gender-desc {
    @include typo($body-large);
    color: $color-text-muted;
    max-width: 340px;
    line-height: 1.6;
    margin-top: -$spacing-sm;
  }

  &__gender-btns {
    display: flex;
    gap: $spacing-lg;
    margin-top: $spacing-xs;
  }

  &__gender-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    width: 120px;
    padding: $spacing-lg $spacing-md;
    border: 2px solid $color-border;
    border-radius: $border-radius-base;
    background: $color-surface;
    cursor: pointer;
    @include typo($body-large);
    font-weight: $font-weight-medium;
    color: $color-text-secondary;
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease;

    &:hover {
      border-color: var(--survey-theme-color);
      color: var(--survey-theme-color);
      background: rgba(var(--survey-theme-rgb), 0.04);
    }

    &.is-selected {
      border-color: var(--survey-theme-color);
      background: var(--survey-theme-color);
      color: #fff;
      box-shadow: 0 4px 14px rgba(var(--survey-theme-rgb), 0.3);
    }
  }

  &__gender-footer {
    margin-top: auto;
    display: flex;
    justify-content: flex-end;
    width: 100%;
    padding-top: $spacing-md;
    border-top: 1px solid $color-border;
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
    opacity: var(--survey-content-opacity);
    transform: translateY(var(--survey-content-shift));
    transition:
      opacity 0.28s ease 0.08s,
      transform 0.28s ease 0.08s;
  }

  &__intro {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
    backdrop-filter: blur(1px);
    pointer-events: none;
  }

  &__intro-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    text-align: center;
    animation: survey-intro-rise 0.6s ease both;
  }

  &__intro-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    background: var(--survey-theme-color);
    box-shadow: 0 0 0 0 rgba(var(--survey-theme-rgb), 0.2);
    animation: survey-intro-pulse 1.3s ease-in-out infinite;
  }

  &__intro-title {
    @include typo($body-xlarge);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__intro-subtitle {
    @include typo($body-large);
    color: $color-text-muted;
  }

  &__intro-char {
    display: inline-block;
    animation: survey-intro-text-bounce 1.15s ease-in-out infinite;
    animation-delay: var(--intro-char-delay, 0s);
  }

  &__submitted-badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: 3.5px 10px;
    border-radius: 6px;
    border: 1px solid rgba(var(--survey-theme-rgb), 0.22);
    background: rgba(var(--survey-theme-rgb), 0.08);
    color: var(--survey-theme-color);
    @include typo($body-large);
    font-weight: $font-weight-medium;
  }

  &__progress-text.is-complete {
    color: var(--survey-theme-color);
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

.survey-intro-enter-active,
.survey-intro-leave-active {
  transition: opacity 0.25s ease;
}

.survey-intro-enter-from,
.survey-intro-leave-to {
  opacity: 0;
}

@keyframes survey-intro-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes survey-intro-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--survey-theme-rgb), 0.2);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(var(--survey-theme-rgb), 0);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--survey-theme-rgb), 0);
    transform: scale(1);
  }
}

@keyframes survey-intro-text-bounce {
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

@media (prefers-reduced-motion: reduce) {
  .psychology-survey {
    &__header,
    &__body,
    &__footer {
      transition: none;
    }

    &__intro-inner,
    &__intro-avatar,
    &__intro-title,
    &__intro-subtitle {
      animation: none;
    }
  }
}
</style>

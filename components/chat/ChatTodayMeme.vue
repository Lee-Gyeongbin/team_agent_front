<template>
  <section
    class="chat-today-meme"
    :class="{
      'is-request-only': isRequestOnly,
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="themeStyle"
    :data-meme-model-id="TODAY_MEME_MODEL_ID"
  >
    <div
      v-if="showRequestComplete"
      class="chat-today-meme__request-complete"
    >
      <span class="chat-today-meme__request-badge">
        <i
          class="icon-check size-16"
          aria-hidden="true"
        />
        전달 완료
      </span>
      <h3 class="chat-today-meme__request-title">요청한 밈을 안전하게 전달했어요!</h3>
      <p class="chat-today-meme__request-desc">
        밈 배달부가 오늘의 밈을 잘 전달했어요.<br />
        아래에서 맞춤 밈을 확인해보세요!
      </p>
    </div>

    <template v-if="!isRequestOnly">
      <Transition name="today-meme-intro">
        <div
          v-if="isIntroPlaying"
          class="chat-today-meme__intro"
          aria-live="polite"
        >
          <div class="chat-today-meme__intro-inner">
            <div class="chat-today-meme__intro-avatar">
              <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
            </div>
            <p class="chat-today-meme__intro-title">
              <span
                v-for="(char, index) in introTitleChars"
                :key="`intro-title-${index}`"
                class="chat-today-meme__intro-char"
                :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >
                {{ char === ' ' ? '\u00A0' : char }}
              </span>
            </p>
            <p class="chat-today-meme__intro-subtitle">
              <span
                v-for="(char, index) in introSubtitleChars"
                :key="`intro-subtitle-${index}`"
                class="chat-today-meme__intro-char"
                :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
              >
                {{ char === ' ' ? '\u00A0' : char }}
              </span>
            </p>
          </div>
        </div>
      </Transition>

      <div
        v-if="!showRequestComplete"
        class="chat-today-meme__header"
      >
        <div class="chat-today-meme__header-info">
          <div class="chat-today-meme__avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <div>
            <p class="chat-today-meme__title">{{ TODAY_MEME_TITLE }}</p>
            <p class="chat-today-meme__subtitle">
              {{ props.readonly ? '최신 유행 밈들을 선별했어요!' : '오늘의 밈 추천을 시작해 보세요.' }}
            </p>
          </div>
        </div>
      </div>

      <div class="chat-today-meme__body">
        <div class="chat-today-meme__list">
          <article
            v-for="item in memeList"
            :key="`${item.rank}-${item.title}`"
            class="meme-card"
          >
            <div class="meme-card__top">
              <div class="meme-card__badges-left">
                <span class="meme-card__rank-badge">{{ item.rank }}</span>
                <span
                  v-if="item.contextLabel"
                  class="meme-card__pill"
                >
                  {{ item.contextLabel }}
                </span>
              </div>
              <span
                v-if="item.confidence"
                class="meme-card__pill"
              >
                신뢰도: <strong>{{ item.confidence }}</strong>
              </span>
            </div>

            <h3 class="meme-card__title">{{ item.title }}</h3>
            <p class="meme-card__source">{{ item.source }}</p>
            <div class="meme-card__divider" />

            <section class="meme-card__explain">
              <h4 class="meme-card__explain-heading">설명</h4>
              <div class="meme-card__explain-box">
                <div
                  v-for="(row, idx) in getTodayMemePointRows(item)"
                  :key="`${item.rank}-pt-${idx}`"
                  class="meme-card__explain-row"
                >
                  <span class="meme-card__explain-label">{{ row.label }}</span>
                  <span
                    class="meme-card__explain-vbar"
                    aria-hidden="true"
                  />
                  <p class="meme-card__explain-text">{{ row.text }}</p>
                </div>
              </div>
            </section>

            <footer class="meme-card__footer">
              <div class="meme-card__footer-inner">
                <div class="meme-card__footer-block">
                  <span class="meme-card__footer-key">카테고리</span>
                  <span class="meme-card__footer-val">{{ item.contextLabel?.trim() || '반응 표현' }}</span>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>

      <!-- 인덱스·방: 제출 전 사용자 액션(설문 ChatPsychologySurvey 푸터와 동일 역할) -->
      <div
        v-if="isContentVisible && !props.readonly && props.awaitingUserSubmit && !hasResultRecommendations"
        class="chat-today-meme__footer-actions"
      >
        <UiButton
          variant="dark"
          size="sm"
          @click="emit('submit')"
        >
          오늘의 밈 받기
          <template #icon-right>
            <i class="icon-arrow-right size-16" />
          </template>
        </UiButton>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { getTodayMemePointRows, TODAY_MEME_MODEL_ID, type TodayMemeItem } from '~/utils/chat/todayMemeUtil'

type TodayMemeDisplayMode = 'card' | 'request'

interface Props {
  /** card: 채팅 카드 전체, request: 라이브러리 q_content(질문) 전달 완료 UI만 */
  displayMode?: TodayMemeDisplayMode
  readonly?: boolean
  /** q_content 전송 완료 — 요청 영역 전달 완료 UI */
  requestDelivered?: boolean
  /** 제출 전(응답 없음) — 인트로 후 요청 버튼 표시 */
  awaitingUserSubmit?: boolean
  isAnswerStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  memeItems?: TodayMemeItem[]
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'card',
  readonly: false,
  requestDelivered: false,
  awaitingUserSubmit: false,
  isAnswerStreaming: false,
  themeIconClassNm: '',
  themeColorHex: '',
  memeItems: () => [],
})

const emit = defineEmits<{
  introComplete: []
  submit: []
}>()
const TODAY_MEME_TITLE = '오늘의 밈 배달부'
const TODAY_MEME_INTRO_SUBTITLE = '오늘의 밈을 고르는 중입니다...'

/** 인트로 타이포 애니메이션 */
const introTitleChars = TODAY_MEME_TITLE.split('')
const introSubtitleChars = TODAY_MEME_INTRO_SUBTITLE.split('')

const memeList = computed<TodayMemeItem[]>(() => props.memeItems)

const isRequestOnly = computed(() => props.displayMode === 'request')
const showRequestComplete = computed(() => isRequestOnly.value || props.requestDelivered)

/** 추천 밈 카드가 있으면 하단 설문 액션(받기) 숨김 — ChatLunchAgentCard와 동일 패턴 */
const hasResultRecommendations = computed(() => memeList.value.length > 0)

const themeStyle = computed(() => {
  const hex = String(props.themeColorHex).trim() || '#6d5bd0'
  return {
    '--today-meme-theme-color': hex,
    '--today-meme-request-theme-color': hex,
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

const TODAY_MEME_INTRO_MIN_MS = 3100
const hasMemeResponse = computed(() => memeList.value.length > 0 && !props.isAnswerStreaming)
const canShowContent = computed(
  () =>
    !props.isAnswerStreaming &&
    (props.requestDelivered || props.readonly || hasMemeResponse.value || props.awaitingUserSubmit === true),
)
const isIntroPlaying = ref(!canShowContent.value)
const isContentVisible = ref(canShowContent.value)
const isIntroMinElapsed = ref(false)
const hasIntroStarted = ref(false)
let introMinTimer: ReturnType<typeof setTimeout> | null = null

const clearIntroTimers = () => {
  if (introMinTimer) clearTimeout(introMinTimer)
  introMinTimer = null
}

const tryFinishIntroSequence = () => {
  if (!isIntroPlaying.value) return
  if (!isIntroMinElapsed.value) return
  if (!canShowContent.value) return
  isIntroPlaying.value = false
  isContentVisible.value = true
  emit('introComplete')
}

const startIntroSequence = () => {
  clearIntroTimers()
  if (canShowContent.value) {
    isIntroPlaying.value = false
    isContentVisible.value = true
    return
  }

  isIntroMinElapsed.value = false
  isIntroPlaying.value = true
  isContentVisible.value = false
  introMinTimer = setTimeout(() => {
    introMinTimer = null
    isIntroMinElapsed.value = true
    tryFinishIntroSequence()
  }, TODAY_MEME_INTRO_MIN_MS)
}

watch(
  canShowContent,
  () => {
    if (!hasIntroStarted.value) {
      startIntroSequence()
      hasIntroStarted.value = true
      return
    }
    tryFinishIntroSequence()
  },
  { immediate: true },
)

onUnmounted(() => {
  clearIntroTimers()
})
</script>

<style lang="scss" scoped>
.chat-today-meme {
  --today-meme-content-opacity: 0;
  --today-meme-content-shift: #{$spacing-sm};
  --meme-card-navy: #1a2b4b;
  --meme-card-pill-bg: #{$color-surface};
  --meme-card-footer-bg: #f4f6f8;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: $chat-max-width;
  margin-inline: auto;
  /* 채팅 메시지 행 안에서 점심 카드처럼 높이는 콘텐츠 기준 */
  height: auto;
  max-height: min(640px, 78vh);
  overflow: hidden;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  box-shadow: 0 2px 12px rgba(26, 43, 75, 0.06);

  &.is-intro-playing {
    border-color: transparent;
    min-height: min(640px, 78vh);
  }

  &.is-content-visible {
    --today-meme-content-opacity: 1;
    --today-meme-content-shift: 0;
  }

  &.is-request-only {
    max-height: none;
    overflow: visible;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;

    .chat-today-meme__request-complete {
      padding: 0;
      border-bottom: none;
      background: transparent;
      opacity: 1;
      transform: none;
    }
  }

  &__request-complete {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-md;
    width: 100%;
    text-align: left;
    flex-shrink: 0;
    padding: $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    opacity: var(--today-meme-content-opacity);
    transform: translateY(var(--today-meme-content-shift));
    transition:
      opacity 0.32s ease,
      transform 0.32s ease;
  }

  &__request-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--today-meme-request-theme-color) 14%, #fff);
    color: var(--today-meme-request-theme-color);
    @include typo($body-small);
    font-weight: $font-weight-semibold;
  }

  &__request-title {
    margin: 0;
    @include typo($body-2xlarge-bold);
    color: #1a2b4b;
    letter-spacing: -0.02em;
  }

  &__request-desc {
    margin: 0;
    @include typo($body-medium);
    color: $color-text-muted;
    line-height: 1.55;
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
    opacity: var(--today-meme-content-opacity);
    transform: translateY(var(--today-meme-content-shift));
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
    background: var(--today-meme-theme-color);
    color: #fff;
  }

  &__intro-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--today-meme-theme-color);
    color: #fff;
    box-shadow: 0 0 0 0 rgba(var(--today-meme-theme-rgb), 0.2);
    animation: today-meme-intro-pulse 1.3s ease-in-out infinite;
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
    min-height: 0;
    overflow-y: auto;
    padding: $spacing-lg $spacing-xl $spacing-xl;
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    opacity: var(--today-meme-content-opacity);
    transform: translateY(var(--today-meme-content-shift));
    transition:
      opacity 0.36s ease 0.04s,
      transform 0.36s ease 0.04s;

    @include custom-scrollbar(4px);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  /** 설문 ChatPsychologySurvey 푸터와 유사 — 제출 전 액션 */
  &__footer-actions {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-xl $spacing-lg;
    border-top: 1px solid $color-border;
    background: $color-surface;
    opacity: var(--today-meme-content-opacity);
    transform: translateY(var(--today-meme-content-shift));
    transition:
      opacity 0.36s ease 0.04s,
      transform 0.36s ease 0.04s;
  }

  /* 개별 밈 카드 — 시안: 랭크/필, 제목·출처, 설명 테이블, 하단 메타 */
  .meme-card {
    border: 1px solid $color-border;
    border-radius: 14px;
    background: #fff;
    padding: $spacing-lg $spacing-xl 0;
    box-shadow: 0 2px 10px rgba(26, 43, 75, 0.05);

    &__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-sm;
      flex-wrap: wrap;
      margin-bottom: $spacing-md;
    }

    &__badges-left {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      flex-wrap: wrap;
    }

    &__rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      border-radius: 6px;
      background: var(--meme-card-navy);
      color: #fff;
      font-size: $font-size-sm;
      font-weight: $font-weight-bold;
      line-height: 1;
    }

    &__pill {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--meme-card-pill-bg);
      border: 1px solid $color-border;
      @include typo($body-xsmall);
      color: $color-text-secondary;

      strong {
        font-weight: $font-weight-semibold;
        color: var(--meme-card-navy);
      }
    }

    &__title {
      margin: 0 0 $spacing-xs;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: var(--meme-card-navy);
      line-height: 1.35;
      letter-spacing: -0.02em;
    }

    &__source {
      margin: 0 0 $spacing-md;
      @include typo($body-small);
      color: $color-text-muted;
    }

    &__divider {
      height: 1px;
      background: $color-border;
      margin-bottom: $spacing-md;
    }

    &__explain-heading {
      margin: 0 0 $spacing-sm;
      font-size: $font-size-lg;
      font-weight: $font-weight-bold;
      color: var(--meme-card-navy);
    }

    &__explain-box {
      border: 1px solid $color-border;
      border-radius: $border-radius-base;
      background: #fff;
      overflow: hidden;
    }

    &__explain-row {
      display: grid;
      grid-template-columns: max-content 1px minmax(0, 1fr);
      column-gap: $spacing-sm;
      align-items: stretch;
      padding: $spacing-sm $spacing-md;

      &:not(:last-child) {
        border-bottom: 1px dashed $color-border;
      }
    }

    &__explain-label {
      font-size: $font-size-base;
      font-weight: $font-weight-bold;
      color: var(--meme-card-navy);
      line-height: 1.45;
      padding-right: 2px;
      word-break: keep-all;
    }

    &__explain-vbar {
      width: 1px;
      background: $color-border;
      align-self: stretch;
      min-height: 0;
    }

    &__explain-text {
      margin: 0;
      @include typo($body-medium);
      color: $color-text-secondary;
      line-height: 1.58;
    }

    &__footer {
      margin-top: $spacing-md;
      margin-left: -$spacing-xl;
      margin-right: -$spacing-xl;
      padding: $spacing-md $spacing-xl;
      background: var(--meme-card-footer-bg);
      border-top: 1px solid $color-border;
      border-radius: 0 0 13px 13px;
    }

    &__footer-inner {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: $spacing-md;
      flex-wrap: wrap;
    }

    &__footer-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    &__footer-key {
      @include typo($body-xsmall);
      font-weight: $font-weight-semibold;
      color: $color-text-muted;
    }

    &__footer-val {
      @include typo($body-small);
      font-weight: $font-weight-medium;
      color: var(--meme-card-navy);
    }
  }

  @media (max-width: 767px) {
    .meme-card__explain-row {
      grid-template-columns: 1fr;
      gap: $spacing-xs;

      .meme-card__explain-vbar {
        display: none;
      }

      .meme-card__explain-label {
        margin-bottom: -4px;
      }
    }
  }

  &__intro {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
    backdrop-filter: blur(1px);
  }

  &__intro-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    text-align: center;
    animation: today-meme-intro-rise 0.6s ease both;
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

  &__intro-char {
    display: inline-block;
    animation: today-meme-intro-text-bounce 1.15s ease-in-out infinite;
    animation-delay: var(--intro-char-delay, 0s);
  }
}

@keyframes today-meme-intro-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes today-meme-intro-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--today-meme-theme-rgb), 0.2);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(var(--today-meme-theme-rgb), 0);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--today-meme-theme-rgb), 0);
    transform: scale(1);
  }
}

@keyframes today-meme-intro-text-bounce {
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
  .chat-today-meme__intro-inner,
  .chat-today-meme__intro-avatar,
  .chat-today-meme__intro-char {
    animation: none !important;
  }

  .chat-today-meme__intro-avatar {
    box-shadow: none;
  }
}

.today-meme-intro-enter-active,
.today-meme-intro-leave-active {
  transition: opacity 0.25s ease;
}

.today-meme-intro-enter-from,
.today-meme-intro-leave-to {
  opacity: 0;
}
</style>

<template>
  <section
    class="chat-auto-recommend"
    :class="{
      'is-request-only': isRequestOnly,
      'is-intro-playing': isIntroPlaying,
      'is-content-visible': isContentVisible,
    }"
    :style="themeStyle"
  >
    <div
      v-if="showRequestComplete"
      class="chat-auto-recommend__request-complete"
    >
      <span class="chat-auto-recommend__request-badge">
        <i
          class="icon-check size-16"
          aria-hidden="true"
        />
        전달 완료
      </span>
      <h3 class="chat-auto-recommend__request-title">{{ requestCompleteTitle }}</h3>
      <p class="chat-auto-recommend__request-desc">
        {{ requestCompleteDesc }}
      </p>
    </div>

    <template v-if="!isRequestOnly">
      <Transition name="agent-intro">
        <div
          v-if="isIntroPlaying"
          class="chat-auto-recommend__intro"
          aria-live="polite"
        >
          <div class="chat-auto-recommend__intro-inner">
            <div class="chat-auto-recommend__intro-avatar">
              <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
            </div>
            <p class="chat-auto-recommend__intro-title">
              <span
                v-for="(char, index) in introTitleChars"
                :key="`intro-title-${index}`"
                class="chat-auto-recommend__intro-char"
                :style="{ '--intro-char-delay': `${index * 0.03}s` }"
              >
                {{ char === ' ' ? '\u00A0' : char }}
              </span>
            </p>
            <p class="chat-auto-recommend__intro-subtitle">
              <span
                v-for="(char, index) in introSubtitleChars"
                :key="`intro-subtitle-${index}`"
                class="chat-auto-recommend__intro-char"
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
        class="chat-auto-recommend__header"
      >
        <div class="chat-auto-recommend__header-info">
          <div class="chat-auto-recommend__avatar">
            <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
          </div>
          <div>
            <p class="chat-auto-recommend__title">{{ cardTitle }}</p>
            <p class="chat-auto-recommend__subtitle">
              {{ cardSubtitle }}
            </p>
          </div>
        </div>
      </div>

      <div class="chat-auto-recommend__body">
        <div class="chat-auto-recommend__list">
          <article
            v-for="item in itemList"
            :key="`${item.rank}-${item.title}`"
            class="auto-recommend-card"
          >
            <div class="auto-recommend-card__top">
              <div class="auto-recommend-card__badges-left">
                <span class="auto-recommend-card__rank-badge">{{ item.rank }}</span>
                <span
                  v-if="item.contextLabel"
                  class="auto-recommend-card__pill"
                >
                  {{ item.contextLabel }}
                </span>
              </div>
              <span
                v-if="item.confidence"
                class="auto-recommend-card__pill"
              >
                신뢰도: <strong>{{ item.confidence }}</strong>
              </span>
            </div>

            <h3 class="auto-recommend-card__title">{{ item.title }}</h3>
            <p class="auto-recommend-card__source">{{ item.source }}</p>
            <div class="auto-recommend-card__divider" />

            <section class="auto-recommend-card__explain">
              <h4 class="auto-recommend-card__explain-heading">설명</h4>
              <div class="auto-recommend-card__explain-box">
                <div
                  v-for="(row, idx) in getAutoRecommendPointRows(item)"
                  :key="`${item.rank}-pt-${idx}`"
                  class="auto-recommend-card__explain-row"
                >
                  <span class="auto-recommend-card__explain-label">{{ row.label }}</span>
                  <span
                    class="auto-recommend-card__explain-vbar"
                    aria-hidden="true"
                  />
                  <p class="auto-recommend-card__explain-text">{{ row.text }}</p>
                </div>
              </div>
            </section>

            <footer class="auto-recommend-card__footer">
              <div class="auto-recommend-card__footer-inner">
                <div class="auto-recommend-card__footer-block">
                  <span class="auto-recommend-card__footer-key">카테고리</span>
                  <span class="auto-recommend-card__footer-val">{{ item.contextLabel?.trim() || '반응 표현' }}</span>
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>

      <!-- 인덱스·방: 제출 전 사용자 액션(설문 ChatPsychologySurvey 푸터와 동일 역할) -->
      <div
        v-if="isContentVisible && !props.readonly && props.awaitingUserSubmit && !hasResultItems"
        class="chat-auto-recommend__footer-actions"
      >
        <UiButton
          variant="dark"
          size="sm"
          @click="emit('submit')"
        >
          {{ submitButtonLabel }}
          <template #icon-right>
            <i class="icon-arrow-right size-16" />
          </template>
        </UiButton>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import {
  getAutoRecommendPointRows,
  type AutoRecommendAgentConfig,
  type AutoRecommendItem,
} from '~/utils/chat/autoRecommendUtil'

type AutoRecommendDisplayMode = 'card' | 'request'

interface Props {
  /** card: 채팅 카드 전체, request: 라이브러리 q_content(질문) 전달 완료 UI만 */
  displayMode?: AutoRecommendDisplayMode
  readonly?: boolean
  /** q_content 전송 완료 — 요청 영역 전달 완료 UI */
  requestDelivered?: boolean
  /** 제출 전(응답 없음) — 인트로 후 요청 버튼 표시 */
  awaitingUserSubmit?: boolean
  isAnswerStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  items?: AutoRecommendItem[]
  config?: AutoRecommendAgentConfig | null
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'card',
  readonly: false,
  requestDelivered: false,
  awaitingUserSubmit: false,
  isAnswerStreaming: false,
  themeIconClassNm: '',
  themeColorHex: '',
  items: () => [],
  config: null,
})

const emit = defineEmits<{
  introComplete: []
  submit: []
}>()

const cardTitle = computed(() => String(props.config?.ui?.cardTitle ?? '').trim() || '자동 추천')
const cardSubtitle = computed(() => {
  if (props.readonly) {
    return String(props.config?.ui?.cardSubtitleReadonly ?? '').trim() || '추천 결과를 확인해 보세요.'
  }
  return String(props.config?.ui?.cardSubtitle ?? '').trim() || '추천을 시작해 보세요.'
})
const introSubtitle = computed(
  () => String(props.config?.ui?.introSubtitle ?? '').trim() || '추천 결과를 준비하고 있습니다...',
)
const requestCompleteTitle = computed(
  () => String(props.config?.ui?.requestCompleteTitle ?? '').trim() || '요청을 안전하게 전달했어요!',
)
const requestCompleteDesc = computed(
  () => String(props.config?.ui?.requestCompleteDesc ?? '').trim() || '아래에서 추천 결과를 확인해 보세요.',
)
const submitButtonLabel = computed(() => String(props.config?.ui?.submitButtonLabel ?? '').trim() || '추천 받기')

const introTitleChars = computed(() => cardTitle.value.split(''))
const introSubtitleChars = computed(() => introSubtitle.value.split(''))

const itemList = computed<AutoRecommendItem[]>(() => props.items)

const isRequestOnly = computed(() => props.displayMode === 'request')
const showRequestComplete = computed(() => isRequestOnly.value || props.requestDelivered)

const hasResultItems = computed(() => itemList.value.length > 0)

const hexToRgb = (hex: string) => {
  const cleanedHex = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleanedHex)) return '109, 91, 208'
  return `${parseInt(cleanedHex.slice(0, 2), 16)}, ${parseInt(cleanedHex.slice(2, 4), 16)}, ${parseInt(cleanedHex.slice(4, 6), 16)}`
}

const themeStyle = computed(() => {
  const hex = String(props.themeColorHex).trim() || '#6d5bd0'
  return {
    '--auto-recommend-theme-color': hex,
    '--auto-recommend-theme-rgb': hexToRgb(hex),
    '--auto-recommend-request-theme-color': hex,
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

const INTRO_MIN_MS = 3100
const hasItemResponse = computed(() => itemList.value.length > 0 && !props.isAnswerStreaming)
const canShowContent = computed(
  () =>
    !props.isAnswerStreaming &&
    (props.requestDelivered || props.readonly || hasItemResponse.value || props.awaitingUserSubmit === true),
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
  }, INTRO_MIN_MS)
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
@use '@/assets/styles/utils/agent-intro' as *;

.chat-auto-recommend {
  --auto-recommend-content-opacity: 0;
  --auto-recommend-content-shift: #{$spacing-sm};
  --auto-recommend-card-navy: #1a2b4b;
  --auto-recommend-card-pill-bg: #{$color-surface};
  --auto-recommend-card-footer-bg: #f4f6f8;

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

  &.is-intro-playing {
    border-color: transparent;
    min-height: min(640px, 78vh);
  }

  &.is-intro-playing:not(.is-content-visible) {
    --auto-recommend-content-opacity: 0;
    --auto-recommend-content-shift: #{$spacing-sm};
  }

  &.is-content-visible {
    --auto-recommend-content-opacity: 1;
    --auto-recommend-content-shift: 0;
  }

  &.is-request-only {
    max-height: none;
    overflow: visible;
    border: none;
    border-radius: 0;
    box-shadow: none;
    background: transparent;

    .chat-auto-recommend__request-complete {
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
    opacity: var(--auto-recommend-content-opacity);
    transform: translateY(var(--auto-recommend-content-shift));
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
    background: color-mix(in srgb, var(--auto-recommend-request-theme-color) 14%, #fff);
    color: var(--auto-recommend-request-theme-color);
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
    opacity: var(--auto-recommend-content-opacity);
    transform: translateY(var(--auto-recommend-content-shift));
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
    background: var(--auto-recommend-theme-color);
    color: #fff;
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
    opacity: var(--auto-recommend-content-opacity);
    transform: translateY(var(--auto-recommend-content-shift));
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
    opacity: var(--auto-recommend-content-opacity);
    transform: translateY(var(--auto-recommend-content-shift));
    transition:
      opacity 0.36s ease 0.04s,
      transform 0.36s ease 0.04s;
  }

  /* 개별 밈 카드 — 시안: 랭크/필, 제목·출처, 설명 테이블, 하단 메타 */
  .auto-recommend-card {
    border: 1px solid $color-border;
    border-radius: 14px;
    background: #fff;
    padding: $spacing-lg $spacing-xl 0;

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
      background: var(--auto-recommend-card-navy);
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
      background: var(--auto-recommend-card-pill-bg);
      border: 1px solid $color-border;
      @include typo($body-xsmall);
      color: $color-text-secondary;

      strong {
        font-weight: $font-weight-semibold;
        color: var(--auto-recommend-card-navy);
      }
    }

    &__title {
      margin: 0 0 $spacing-xs;
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: var(--auto-recommend-card-navy);
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
      color: var(--auto-recommend-card-navy);
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
      color: var(--auto-recommend-card-navy);
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
      background: var(--auto-recommend-card-footer-bg);
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
      color: var(--auto-recommend-card-navy);
    }
  }

  @media (max-width: 767px) {
    .auto-recommend-card__explain-row {
      grid-template-columns: 1fr;
      gap: $spacing-xs;

      .auto-recommend-card__explain-vbar {
        display: none;
      }

      .auto-recommend-card__explain-label {
        margin-bottom: -4px;
      }
    }
  }
}

@include agent-card-intro('chat-auto-recommend', 'intro', '--auto-recommend-theme-color', '--auto-recommend-theme-rgb');
@include agent-card-intro-keyframes;
@include agent-intro-transition;

@media (prefers-reduced-motion: reduce) {
  .chat-auto-recommend__intro-inner,
  .chat-auto-recommend__intro-avatar,
  .chat-auto-recommend__intro-title,
  .chat-auto-recommend__intro-subtitle {
    animation: none;
  }
}
</style>

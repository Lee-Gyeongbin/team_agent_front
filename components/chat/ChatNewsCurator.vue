<template>
  <section
    class="chat-news-curator"
    :class="{
      'chat-news-curator--compact': showCategoryPicker && !readonly,
      'chat-news-curator--stacked': readonly,
    }"
    :style="themeStyle"
  >
    <div class="chat-news-curator__content">
      <!-- 제출 후: 카테고리 패널 + 결과 패널 -->
      <template v-if="readonly">
        <article class="chat-news-curator__panel chat-news-curator__panel--selection">
          <div class="chat-news-curator__header">
            <div class="chat-news-curator__header-info">
              <div class="chat-news-curator__header-avatar">
                <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
              </div>
              <div class="chat-news-curator__header-copy">
                <p class="chat-news-curator__header-title">{{ NEWS_INTRO_TITLE }}</p>
                <p class="chat-news-curator__header-subtitle">{{ preSubmitCategoryHint }}</p>
              </div>
            </div>
          </div>

          <div class="chat-news-curator__selector">
            <ul class="chat-news-curator__selector-grid">
              <li
                v-for="category in NEWS_CATEGORY_OPTIONS"
                :key="category.value"
              >
                <div
                  class="chat-news-curator__selector-card is-readonly"
                  :class="{ 'is-selected': lockedSelectedCategoriesList.includes(category.value) }"
                >
                  <strong>{{ category.label }}</strong>
                  <p>{{ category.description }}</p>
                  <span class="chat-news-curator__selector-check"></span>
                </div>
              </li>
            </ul>
          </div>

          <div class="chat-news-curator__footer chat-news-curator__footer--readonly">
            <p class="chat-news-curator__footer-tip">{{ footerTipText }}</p>
          </div>
        </article>

        <article
          class="chat-news-curator__panel chat-news-curator__panel--results"
          :class="{ 'is-intro-playing': isIntroPlaying && readonly }"
        >
          <div class="chat-news-curator__panel-head">
            <div class="chat-news-curator__panel-avatar">
              <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
            </div>
            <div class="chat-news-curator__panel-head-text">
              <p class="chat-news-curator__panel-title">{{ newsResultsPanelTitle }}</p>
              <p class="chat-news-curator__panel-desc">{{ bottomCardSubtitle }}</p>
            </div>
          </div>

          <div class="chat-news-curator__results-body">
            <ul
              v-if="hasNewsResult"
              class="chat-news-curator__list"
            >
              <li
                v-for="item in newsItems"
                :key="`${item.rank}-${item.title}`"
                class="chat-news-curator__item"
              >
                <div class="chat-news-curator__thumb">
                  <img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    :alt="`${item.title} 이미지`"
                  />
                  <span
                    v-else
                    class="chat-news-curator__thumb-empty"
                  >
                    빈 이미지
                  </span>
                </div>
                <div class="chat-news-curator__item-body">
                  <div class="chat-news-curator__item-head">
                    <span class="chat-news-curator__rank">{{ item.rank }}</span>
                    <h4 class="chat-news-curator__title">{{ item.title }}</h4>
                  </div>
                  <dl class="chat-news-curator__meta">
                    <div class="chat-news-curator__meta-row">
                      <dt>언론사</dt>
                      <dd>{{ item.source || '-' }}</dd>
                    </div>
                    <div class="chat-news-curator__meta-row">
                      <dt>카테고리</dt>
                      <dd>{{ item.category || '-' }}</dd>
                    </div>
                    <div class="chat-news-curator__meta-row">
                      <dt>요약</dt>
                      <dd class="chat-news-curator__summary">{{ item.summary || '-' }}</dd>
                    </div>
                  </dl>
                  <div class="chat-news-curator__item-action">
                    <a
                      v-if="item.sourceUrl"
                      class="chat-news-curator__link-btn"
                      :href="item.sourceUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      기사보기
                    </a>
                  </div>
                </div>
              </li>
            </ul>

            <p
              v-else
              class="chat-news-curator__panel-empty"
            >
              아직 표시할 뉴스가 없습니다. 잠시 후 다시 확인해 주세요.
            </p>

            <p
              v-if="hasNewsResult"
              class="chat-news-curator__summary-notice"
            >
              ※ 기사에 대한 설명은 AI가 제작한 참고용으로 정확하지 않을 수 있습니다.
            </p>
          </div>

          <!-- 인트로 -->
          <Transition name="news-curator-intro">
            <div
              v-if="isIntroPlaying && readonly"
              class="chat-news-curator__results-intro"
              aria-live="polite"
            >
              <div class="chat-news-curator__results-intro-inner">
                <div class="chat-news-curator__results-intro-avatar">
                  <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
                </div>
                <p class="chat-news-curator__results-intro-title">
                  <span
                    v-for="(char, index) in introTitleChars"
                    :key="`intro-title-${index}`"
                    class="chat-news-curator__results-intro-char"
                    :style="{ '--intro-char-delay': `${index * 0.03}s` }"
                  >
                    {{ char === ' ' ? '\u00A0' : char }}
                  </span>
                </p>
                <p class="chat-news-curator__results-intro-subtitle">
                  <span
                    v-for="(char, index) in introSubtitleChars"
                    :key="`intro-subtitle-${index}`"
                    class="chat-news-curator__results-intro-char"
                    :style="{ '--intro-char-delay': `${0.12 + index * 0.024}s` }"
                  >
                    {{ char === ' ' ? '\u00A0' : char }}
                  </span>
                </p>
              </div>
            </div>
          </Transition>
        </article>
      </template>

      <!-- 제출 전: 단일 영역(분야 선택) -->
      <div
        v-else
        class="chat-news-curator__main"
      >
        <div class="chat-news-curator__header">
          <div class="chat-news-curator__header-info">
            <div class="chat-news-curator__header-avatar">
              <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
            </div>
            <div class="chat-news-curator__header-copy">
              <p class="chat-news-curator__header-title">{{ NEWS_INTRO_TITLE }}</p>
              <p class="chat-news-curator__header-subtitle">{{ preSubmitCategoryHint }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="showCategoryPicker"
          class="chat-news-curator__selector"
        >
          <ul class="chat-news-curator__selector-grid">
            <li
              v-for="category in NEWS_CATEGORY_OPTIONS"
              :key="category.value"
            >
              <button
                type="button"
                class="chat-news-curator__selector-card"
                :class="{ 'is-selected': selectedCategories.includes(category.value) }"
                :disabled="isCategoryDisabled(category.value)"
                @click="toggleCategory(category.value)"
              >
                <strong>{{ category.label }}</strong>
                <p>{{ category.description }}</p>
                <span class="chat-news-curator__selector-check"></span>
              </button>
            </li>
          </ul>
        </div>

        <div
          v-if="showCategoryPicker"
          class="chat-news-curator__footer"
        >
          <p class="chat-news-curator__footer-tip">{{ footerTipText }}</p>
          <div class="chat-news-curator__footer-actions">
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
              :disabled="selectedCategories.length === 0"
              @click="onSubmitClick"
            >
              제출하기
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { NewsCuratorItem } from '~/types/chat'

interface Props {
  readonly?: boolean
  isAnswerStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  newsItems?: NewsCuratorItem[]
  lockedSelectedCategories?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  isAnswerStreaming: false,
  themeIconClassNm: '',
  themeColorHex: '',
  newsItems: () => [],
  lockedSelectedCategories: () => [],
})

const emit = defineEmits<{
  introComplete: []
  submit: [categories: string[]]
  close: []
}>()

const DEFAULT_THEME_HEX = '#4b5bd6'
/** 인트로 펄스용 RGB */
const hexToRgb = (hex: string) => {
  const cleanedHex = String(hex || '')
    .trim()
    .replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(cleanedHex)) return '75, 91, 214'
  return `${parseInt(cleanedHex.slice(0, 2), 16)}, ${parseInt(cleanedHex.slice(2, 4), 16)}, ${parseInt(cleanedHex.slice(4, 6), 16)}`
}

const themeStyle = computed(() => {
  const colorHex = String(props.themeColorHex || '').trim() || DEFAULT_THEME_HEX
  return {
    '--news-curator-theme-color': colorHex,
    '--news-curator-theme-rgb': hexToRgb(colorHex),
  }
})
const themeIconClassNm = computed(() => String(props.themeIconClassNm || '').trim())

const lockedSelectedCategoriesList = computed(() =>
  (props.lockedSelectedCategories ?? []).map((categoryLabel) => String(categoryLabel).trim()).filter(Boolean),
)

/** 제출 전·readonly 상단 부제 */
const preSubmitCategoryHint = '보고 싶은 뉴스 종류를 선택해주세요! (최대 3개)'

const footerTipText = 'TIP. 최대 3개까지 선택할 수 있으며, 선택한 분야를 기반으로 맞춤 뉴스를 추천해드립니다.'

/** 인트로 타이틀·카드 헤더·결과 패널 제목(0건)과 동일 카피 */
const NEWS_INTRO_TITLE = '오늘의 뉴스픽'
const NEWS_INTRO_SUBTITLE = '오늘의 뉴스픽을 준비 중입니다...'
const introTitleChars = NEWS_INTRO_TITLE.split('')
const introSubtitleChars = NEWS_INTRO_SUBTITLE.split('')

const NEWS_CATEGORY_MAX_COUNT = 3
const NEWS_CATEGORY_OPTIONS = [
  { value: '정치', label: '정치', description: '정부·국회·정당·외교 등 국내외 주요 정책과 정치 이슈를 전달합니다.' },
  { value: '경제', label: '경제', description: '거시경제·환율·무역·부동산·기업 실적 등 경제 전반의 흐름을 다룹니다.' },
  { value: '사회', label: '사회', description: '사건·사고·교육·노동·복지 등 우리 사회의 다양한 현안을 다룹니다.' },
  { value: '산업', label: '산업', description: 'IT·반도체·AI·자동차·에너지 등 주요 산업과 기술 트렌드를 소개합니다.' },
  { value: '문화', label: '문화', description: '문화예술·전시·출판·영화 등 창작과 문화계 소식을 전합니다.' },
  {
    value: '세계',
    label: '세계',
    description: '해외 정세·국제관계·글로벌 이슈 등 세계 무대의 주요 뉴스를 제공합니다.',
  },
  { value: '건강', label: '건강', description: '의료·질병·웰빙·공중보건 등 몸과 마음의 건강에 관한 정보를 다룹니다.' },
  { value: '연예', label: '연예', description: '방송·영화·음악·스타 동향 등 연예계 화제를 빠르게 전합니다.' },
  {
    value: '스포츠',
    label: '스포츠',
    description: '국내외 경기·리그·선수 소식 등 스포츠 팬을 위한 뉴스를 모았습니다.',
  },
  { value: '주식', label: '주식', description: '증시·종목·투자 지표 등 주식 시장 중심의 투자·금융 소식을 전합니다.' },
] as const
const selectedCategories = ref<string[]>([])
const isCategoryDisabled = (category: string) =>
  !selectedCategories.value.includes(category) && selectedCategories.value.length >= NEWS_CATEGORY_MAX_COUNT
const toggleCategory = (category: string) => {
  if (isCategoryDisabled(category)) return
  selectedCategories.value = selectedCategories.value.includes(category)
    ? selectedCategories.value.filter((item) => item !== category)
    : [...selectedCategories.value, category]
}
const onSubmitClick = () => {
  if (selectedCategories.value.length === 0) return
  emit('submit', [...selectedCategories.value])
}

const hasNewsResult = computed(() => (props.newsItems?.length ?? 0) > 0)
/** 파싱된 기사 건수에 맞춰 제목 표시 */
const newsResultsPanelTitle = computed(() =>
  hasNewsResult.value ? `${NEWS_INTRO_TITLE} ${props.newsItems.length}건` : NEWS_INTRO_TITLE,
)
/** 제출 전에만 카테고리·제출 버튼 표시 */
const showCategoryPicker = computed(() => !props.readonly && !hasNewsResult.value)

const bottomCardSubtitle = computed(() => {
  if (hasNewsResult.value) return '골라주신 카테고리를 통해 선정한 뉴스픽입니다!'
  if (props.isAnswerStreaming) return 'AI가 맞춤 기사를 선정하는 중입니다…'
  return '추천 뉴스를 준비 중입니다.'
})

const isIntroPlaying = ref(false)
const hasIntroCompleted = ref(false)

const startIntroSequence = () => {
  hasIntroCompleted.value = false
  isIntroPlaying.value = true
}

watch(
  () => [props.readonly, props.isAnswerStreaming] as const,
  ([readonly, isAnswerStreaming]) => {
    if (!readonly) {
      isIntroPlaying.value = false
      hasIntroCompleted.value = false
      return
    }

    if (isAnswerStreaming) {
      if (!hasIntroCompleted.value && !isIntroPlaying.value) {
        startIntroSequence()
      }
      return
    }

    // complete 수신(스트리밍 종료) 시 intro를 즉시 종료한다.
    if (isIntroPlaying.value) {
      emit('introComplete')
    }
    isIntroPlaying.value = false
    hasIntroCompleted.value = true
  },
  { immediate: true },
)

onUnmounted(() => {
  isIntroPlaying.value = false
})
</script>

<style lang="scss" scoped>
.chat-news-curator {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  /** 런치/설문 에이전트 카드와 동일 너비 (768px $chat-max-width와 구분) */
  max-width: 760px;
  max-height: min(640px, 78vh);
  margin-inline: auto;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(26, 43, 75, 0.06);

  /** 런치/설문 카드와 동일 톤 — 본문 영역이 뷰포트 내에서 스크롤되도록 */
  &__content {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &--compact {
    max-height: none;
    flex: 0 0 auto;
  }

  &--stacked {
    /** 상단(카테고리)·하단(뉴스 건수) 패널을 한 높이로 묶지 않음 — 각 패널에 max-height 개별 적용 */
    height: auto;
    max-height: none;
    min-height: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    overflow: visible;

    .chat-news-curator__content {
      gap: $spacing-md;
      flex: 0 1 auto;
      min-height: 0;
      max-height: none;
      overflow: visible;
    }
  }

  &__panel {
    border: 1px solid $color-border;
    border-radius: $border-radius-lg;
    background: #fff;
    box-shadow: 0 2px 12px rgba(26, 43, 75, 0.06);
    overflow: hidden;
  }

  &__panel--selection {
    flex: 0 1 auto;
    /** 오늘의 뉴스픽 카테고리 패널만의 상한(10개·2행 그리드, 결과 패널과 독립) */
    max-height: min(520px, 58vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .chat-news-curator__header {
      flex-shrink: 0;
    }

    .chat-news-curator__selector {
      flex: 1 1 auto;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      @include custom-scrollbar(4px);
    }

    .chat-news-curator__footer {
      flex-shrink: 0;
    }
  }

  &__panel--results {
    flex: 0 1 auto;
    max-height: min(600px, 80vh);
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    &.is-intro-playing {
      min-height: min(600px, 80vh);
    }
  }

  /** 스트리밍 준비 인트로 — 결과 패널 내부에만 오버레이 */
  &__results-intro {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
    backdrop-filter: blur(1px);
  }

  &__results-intro-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    text-align: center;
    padding: $spacing-lg;
    animation: news-curator-intro-rise 0.6s ease both;
  }

  &__results-intro-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #fff;
    background: var(--news-curator-theme-color);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--news-curator-theme-color) 34%, transparent);
    animation: news-curator-intro-pulse 1.3s ease-in-out infinite;
  }

  &__results-intro-title {
    margin: 0;
    @include typo($body-medium);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__results-intro-subtitle {
    margin: 0;
    @include typo($body-small);
    color: $color-text-muted;
    font-weight: $font-weight-medium;
  }

  &__results-intro-char {
    display: inline-block;
    animation: news-curator-intro-char 1.15s ease-in-out infinite;
    animation-delay: var(--intro-char-delay, 0s);
  }

  &__results-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    @include custom-scrollbar(4px);
  }

  &__panel-head {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
    flex-shrink: 0;
  }

  &__panel-head-text {
    min-width: 0;
  }

  &__panel-empty {
    margin: 0;
    padding: $spacing-xl $spacing-lg;
    text-align: center;
    @include typo($body-small);
    color: $color-text-muted;
  }

  &__main {
    flex: 0 1 auto;
    width: 100%;
    min-height: 0;
    max-height: min(640px, 78vh);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    @include custom-scrollbar(4px);
  }

  &--compact &__main {
    max-height: none;
    overflow-y: visible;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-lg $spacing-xl;
    border-bottom: 1px solid $color-border;
    background: $color-surface;
  }

  &__header-copy {
    min-width: 0;
  }

  &__header-info {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    min-width: 0;
  }

  &__header-avatar,
  &__panel-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--news-curator-theme-color);
    color: #fff;
    flex-shrink: 0;
  }

  &__header-title,
  &__panel-title {
    margin: 0;
    @include typo($body-medium);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__header-subtitle,
  &__panel-desc {
    margin: 2px 0 0;
    @include typo($body-small);
    color: $color-text-muted;
    font-weight: $font-weight-medium;
  }

  &__selector {
    padding: 0 $spacing-lg;
  }

  &__selector-grid {
    list-style: none;
    margin: $spacing-sm 0 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: $spacing-xs;
    align-items: stretch;

    > li {
      display: flex;
      min-width: 0;
    }
  }

  &__selector-card {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    border: 1px solid $color-border;
    border-radius: 12px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: $spacing-xs;
    padding: $spacing-sm;
    cursor: pointer;
    text-align: center;

    strong {
      flex-shrink: 0;
      @include typo($body-large);
      color: $color-text-primary;
      font-weight: $font-weight-semibold;
    }

    p {
      flex: 1 1 auto;
      width: 100%;
      margin: 0;
      @include typo($body-small);
      color: $color-text-secondary;
      line-height: 1.45;
      text-align: center;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    &.is-selected {
      border-color: var(--news-curator-theme-color);
      background: color-mix(in srgb, var(--news-curator-theme-color) 7%, #fff);
    }

    &.is-readonly {
      cursor: default;
      pointer-events: none;
      user-select: none;

      &:not(.is-selected) {
        opacity: 0.88;
      }
    }
  }

  &__selector-check {
    flex-shrink: 0;
    margin-top: auto;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #7b8aa5;
    display: inline-block;
    position: relative;

    .chat-news-curator__selector-card.is-selected & {
      border-color: var(--news-curator-theme-color);
      background: var(--news-curator-theme-color);

      &::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 6px;
        width: 4px;
        height: 8px;
        border-right: 2px solid #fff;
        border-bottom: 2px solid #fff;
        transform: rotate(45deg);
      }
    }
  }

  &__list {
    margin: 0;
    padding: $spacing-md;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__item {
    display: grid;
    grid-template-columns: 156px minmax(0, 1fr);
    gap: $spacing-md;
    align-items: stretch;
    border: 1px solid $color-border;
    border-radius: 12px;
    background: #fff;
    padding: $spacing-sm;
  }

  &__thumb {
    width: 156px;
    height: 140px;
    border-radius: 10px;
    border: 1px solid $color-border;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: $color-surface;
    color: $color-text-muted;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__thumb-empty {
    @include typo($body-xsmall);
    text-align: center;
    padding: $spacing-xs;
    line-height: 1.35;
    color: $color-text-muted;
    font-weight: $font-weight-medium;
  }

  &__item-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__item-head {
    display: flex;
    align-items: flex-start;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }

  &__rank {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--news-curator-theme-color);
    color: #fff;
    @include typo($body-small);
    font-weight: $font-weight-bold;
    line-height: 1;
  }

  &__title {
    margin: 0;
    @include typo($body-medium);
    font-weight: $font-weight-semibold;
    color: $color-text-primary;
  }

  &__meta {
    margin: 0;
  }

  &__meta-row {
    display: grid;
    grid-template-columns: 70px minmax(0, 1fr);
    gap: 4px;
    align-items: flex-start;

    & + & {
      margin-top: 2px;
    }

    dt,
    dd {
      margin: 0;
      @include typo($body-small);
    }

    dt {
      color: $color-text-muted;
      font-weight: $font-weight-medium;
    }

    dd {
      color: $color-text-secondary;
      min-width: 0;
      word-break: break-word;
    }
  }

  &__summary {
    margin: 0;
  }

  &__item-action {
    margin-top: $spacing-xs;
    display: flex;
    justify-content: flex-end;
  }

  &__link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 74px;
    height: 28px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--news-curator-theme-color);
    background: color-mix(in srgb, var(--news-curator-theme-color) 8%, #fff);
    @include typo($body-small);
    color: var(--news-curator-theme-color);
    font-weight: $font-weight-medium;
    line-height: 1;
    text-decoration: none;
    transition: background-color 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--news-curator-theme-color) 14%, #fff);
    }
  }

  &__summary-notice {
    margin: 0;
    padding: 0 $spacing-md $spacing-md;
    @include typo($body-small);
    color: $color-text-muted;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md $spacing-md;
  }

  &__footer--readonly {
    justify-content: flex-start;
  }

  &__footer-tip {
    margin: 0;
    @include typo($body-small);
    color: $color-text-secondary;
  }

  &__footer-actions {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    flex-shrink: 0;
  }
}

.news-curator-intro-enter-active,
.news-curator-intro-leave-active {
  transition: opacity 0.25s ease;
}

.news-curator-intro-enter-from,
.news-curator-intro-leave-to {
  opacity: 0;
}

@keyframes news-curator-intro-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes news-curator-intro-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--news-curator-theme-rgb), 0.2);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(var(--news-curator-theme-rgb), 0);
    transform: scale(1.02);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--news-curator-theme-rgb), 0);
    transform: scale(1);
  }
}

@keyframes news-curator-intro-char {
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
  .chat-news-curator__results-intro-inner,
  .chat-news-curator__results-intro-avatar,
  .chat-news-curator__results-intro-char {
    animation: none !important;
  }

  .chat-news-curator__results-intro-avatar {
    box-shadow: none;
  }
}
</style>

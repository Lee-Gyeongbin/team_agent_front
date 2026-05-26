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
        <article
          v-if="showReadonlySelectionPanel"
          class="chat-news-curator__panel chat-news-curator__panel--selection"
        >
          <div class="chat-news-curator__header">
            <div class="chat-news-curator__header-info">
              <div class="chat-news-curator__header-avatar">
                <i :class="[themeIconClassNm || 'icon-bot', 'size-24']" />
              </div>
              <div class="chat-news-curator__header-copy">
                <p class="chat-news-curator__header-title">{{ NEWS_INTRO_TITLE }}</p>
                <p class="chat-news-curator__header-subtitle">{{ readonlyCategoryHint }}</p>
              </div>
            </div>
          </div>

          <div class="chat-news-curator__selector">
            <div
              v-if="categoryLoadError"
              class="chat-news-curator__selector-state"
            >
              <p>{{ categoryLoadError }}</p>
              <UiButton
                variant="line-secondary"
                size="sm"
                @click="onRetryLoadCategories"
              >
                다시 시도
              </UiButton>
            </div>
            <p
              v-else-if="!hasCategoryOptions && !isCategoryOptionsLoading"
              class="chat-news-curator__selector-state"
            >
              등록된 뉴스 분야가 없습니다.
            </p>
            <ul
              v-else-if="hasCategoryOptions"
              class="chat-news-curator__selector-grid"
            >
              <li
                v-for="category in categoryOptions"
                :key="category.value"
              >
                <div
                  class="chat-news-curator__selector-card is-readonly"
                  :class="{ 'is-selected': isLockedCategorySelected(category) }"
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
          v-if="showReadonlyResultsPanel"
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
                      <dd>{{ item.category ? resolveNewsCuratorCategoryLabel(item.category) : '-' }}</dd>
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

          <div
            v-if="showResultsReselectFooter"
            class="chat-news-curator__footer chat-news-curator__footer--results"
          >
            <div class="chat-news-curator__footer-actions">
              <UiButton
                variant="line-secondary"
                size="sm"
                :disabled="props.reselectDisabled"
                @click="onReselectCategoriesClick"
              >
                새로운 카테고리 선택하기
              </UiButton>
            </div>
          </div>

          <Transition name="agent-intro">
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

      <!-- 제출 전: 저장 관심분야 자동 제출 -->
      <div
        v-else-if="isPreSubmitLoading"
        class="chat-news-curator__main chat-news-curator__main--busy"
      >
        <UiLoading
          :text="isAutoSubmitting ? '저장된 관심 분야로 뉴스픽을 준비하는 중...' : '관심 분야를 확인하는 중...'"
        />
      </div>

      <!-- 제출 전: 카테고리 선택이 필요할 때만 -->
      <div
        v-else-if="shouldShowCategoryPicker"
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

        <div class="chat-news-curator__selector">
          <div
            v-if="categoryLoadError"
            class="chat-news-curator__selector-state"
          >
            <p>{{ categoryLoadError }}</p>
            <UiButton
              variant="line-secondary"
              size="sm"
              @click="onRetryLoadCategories"
            >
              다시 시도
            </UiButton>
          </div>
          <p
            v-else-if="!hasCategoryOptions && !isCategoryOptionsLoading"
            class="chat-news-curator__selector-state"
          >
            등록된 뉴스 분야가 없습니다.
          </p>
          <ul
            v-else-if="hasCategoryOptions"
            class="chat-news-curator__selector-grid"
          >
            <li
              v-for="category in categoryOptions"
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
          v-if="shouldShowCategoryPicker"
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
              :disabled="isSubmitDisabled"
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
import {
  NEWS_CURATOR_MAX_CATEGORY_COUNT,
  isNewsCuratorLockedCategorySelected,
  useNewsCuratorCategories,
  parseInterestCodeIdsFromResponse,
  type NewsCuratorCategoryOption,
} from '~/utils/chat/newsCuratorUtil'
import { useChatApi } from '~/composables/chat/useChatApi'

/** form: 분야 선택만, result: 뉴스 목록만, combined: 선택+결과(채팅 기본) */
type NewsCardDisplayMode = 'form' | 'result' | 'combined'

interface Props {
  readonly?: boolean
  displayMode?: NewsCardDisplayMode
  isAnswerStreaming?: boolean
  themeIconClassNm?: string
  themeColorHex?: string
  newsItems?: NewsCuratorItem[]
  lockedSelectedCategories?: string[]
  /** 결과 패널 하단 '새로운 카테고리 선택하기' 노출 (공유·라이브러리 등에서는 false) */
  enableReselect?: boolean
  /** 미제출 news 카드가 있을 때 재선택 버튼 비활성 (노출은 유지) */
  reselectDisabled?: boolean
  /** 로그·제출 반영 — `카테고리 제출 유형: NEW` 카드(readonly 상단 분야 패널) */
  newsIsNew?: boolean
  /** 「새로운 카테고리 선택하기」 미제출 카드 — 저장 관심분야 API 자동 제출 스킵 */
  newsReselect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  displayMode: 'combined',
  isAnswerStreaming: false,
  themeIconClassNm: '',
  themeColorHex: '',
  newsItems: () => [],
  lockedSelectedCategories: () => [],
  enableReselect: true,
  reselectDisabled: false,
  newsIsNew: undefined,
  newsReselect: false,
})

const emit = defineEmits<{
  introComplete: []
  submit: [categories: string[], options?: { isNew?: boolean }]
  close: []
  reselectCategories: []
}>()

const DEFAULT_THEME_HEX = '#4b5bd6'
const preSubmitCategoryHint = '보고 싶은 뉴스 종류를 선택해주세요! (최대 3개)'
const readonlyCategoryHint = '선택하신 뉴스 분야입니다.'
const footerTipText = 'TIP. 최대 3개까지 선택할 수 있으며, 선택한 분야를 기반으로 맞춤 뉴스를 추천해드립니다.'
const NEWS_INTRO_TITLE = '오늘의 뉴스픽'
const NEWS_INTRO_SUBTITLE = '오늘의 뉴스픽을 준비 중입니다...'
const introTitleChars = NEWS_INTRO_TITLE.split('')
const introSubtitleChars = NEWS_INTRO_SUBTITLE.split('')

const {
  categoryOptions,
  isCategoryOptionsLoading,
  categoryLoadError,
  handleLoadNewsCuratorCategories,
  resetNewsCuratorCategoriesCache,
  resolveNewsCuratorCategoryLabel,
} = useNewsCuratorCategories()
const { fetchSelectUserNewsInterestCategory } = useChatApi()

const selectedCategories = ref<string[]>([])
/** 저장 관심분야 조회 전·자동 제출 중 */
const isInterestResolving = ref(!props.readonly)
const isAutoSubmitting = ref(false)
/** select 결과 codeIds 없음·재선택 시에만 카테고리 선택 UI */
const needsCategoryPicker = ref(false)
const isIntroPlaying = ref(false)
const hasIntroCompleted = ref(false)

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
/** NEW 제출 카드만 readonly 상단 분야 패널 */
const showReadonlySelectionPanel = computed(
  () => props.newsIsNew === true && (props.displayMode === 'form' || props.displayMode === 'combined'),
)
const showReadonlyResultsPanel = computed(() => props.displayMode === 'result' || props.displayMode === 'combined')
/** 카테고리 재선택 카드 — 저장 관심분야 API 자동 제출 스킵 */
const isReselectFlow = computed(() => props.newsReselect === true)
const hasNewsResult = computed(() => (props.newsItems?.length ?? 0) > 0)

const hasCategoryOptions = computed(() => categoryOptions.value.length > 0)
const isSubmitDisabled = computed(
  () =>
    selectedCategories.value.length === 0 ||
    isCategoryOptionsLoading.value ||
    !!categoryLoadError.value ||
    !hasCategoryOptions.value,
)
const showCategoryPicker = computed(() => !props.readonly && !hasNewsResult.value)
const shouldShowCategoryPicker = computed(
  () => showCategoryPicker.value && needsCategoryPicker.value && !isInterestResolving.value,
)
/** 관심분야 조회 중·저장분야 자동 제출 중(선택 UI 없음) */
const isPreSubmitLoading = computed(() => {
  if (!showCategoryPicker.value) return false
  if (isInterestResolving.value) return true
  return isAutoSubmitting.value && !needsCategoryPicker.value
})

const newsResultsPanelTitle = computed(() =>
  hasNewsResult.value ? `${NEWS_INTRO_TITLE} ${props.newsItems.length}건` : NEWS_INTRO_TITLE,
)
const selectedCategoryDisplayNames = computed(() =>
  lockedSelectedCategoriesList.value
    .map((token) => resolveNewsCuratorCategoryLabel(token))
    .filter((name) => name && name !== '-'),
)
const bottomCardSubtitle = computed(() => {
  if (hasNewsResult.value) {
    return `골라주신 ${selectedCategoryDisplayNames.value.join(', ')} 카테고리를 통해 선정한 뉴스픽입니다!`
  }
  if (props.isAnswerStreaming) return 'AI가 맞춤 기사를 선정하는 중입니다…'
  return '추천 뉴스를 준비 중입니다.'
})
/** 제출 완료(combined) 결과 패널 — 인트로 중에는 숨김 */
const showResultsReselectFooter = computed(
  () =>
    props.readonly &&
    props.enableReselect &&
    showReadonlyResultsPanel.value &&
    props.displayMode === 'combined' &&
    !isIntroPlaying.value,
)

const isLockedCategorySelected = (category: NewsCuratorCategoryOption) =>
  isNewsCuratorLockedCategorySelected(lockedSelectedCategoriesList.value, category)
const onRetryLoadCategories = () => {
  resetNewsCuratorCategoriesCache()
  handleLoadNewsCuratorCategories()
}
const isCategoryDisabled = (category: string) =>
  !selectedCategories.value.includes(category) && selectedCategories.value.length >= NEWS_CURATOR_MAX_CATEGORY_COUNT
const toggleCategory = (category: string) => {
  if (isCategoryDisabled(category)) return
  selectedCategories.value = selectedCategories.value.includes(category)
    ? selectedCategories.value.filter((item) => item !== category)
    : [...selectedCategories.value, category]
}
const onSubmitClick = () => {
  if (selectedCategories.value.length === 0) return
  emit('submit', [...selectedCategories.value], { isNew: true })
}

/** selectUserNewsInterestCategory — 빈 codeIds면 선택 UI, 있으면 자동 제출(SAVED) */
const handleInitNewsInterestFlow = async () => {
  isInterestResolving.value = true
  isAutoSubmitting.value = false
  needsCategoryPicker.value = false

  try {
    await handleLoadNewsCuratorCategories()

    if (props.readonly) {
      return
    }

    if (isReselectFlow.value) {
      needsCategoryPicker.value = true
      return
    }

    const res = await fetchSelectUserNewsInterestCategory()
    const codeIds = parseInterestCodeIdsFromResponse(res)
    if (codeIds.length > 0) {
      needsCategoryPicker.value = false
      isInterestResolving.value = false
      isAutoSubmitting.value = true
      emit('submit', codeIds, { isNew: false })
      return
    }

    needsCategoryPicker.value = true
  } catch {
    needsCategoryPicker.value = true
  } finally {
    if (!isAutoSubmitting.value) isInterestResolving.value = false
  }
}

const onReselectCategoriesClick = () => {
  if (props.reselectDisabled) return
  emit('reselectCategories')
}
const startIntroSequence = () => {
  hasIntroCompleted.value = false
  isIntroPlaying.value = true
}

watch(
  () => props.readonly,
  (readonly) => {
    if (!readonly) return
    isAutoSubmitting.value = false
    isInterestResolving.value = false
  },
)

watch(isReselectFlow, (reselect) => {
  if (!props.readonly && reselect) {
    needsCategoryPicker.value = true
    isAutoSubmitting.value = false
  }
})

watch(
  () => [props.readonly, props.isAnswerStreaming, hasNewsResult.value] as const,
  ([readonly, isAnswerStreaming, hasResult]) => {
    if (!readonly) {
      isIntroPlaying.value = false
      hasIntroCompleted.value = false
      return
    }

    const shouldShowIntro = isAnswerStreaming || !hasResult

    if (shouldShowIntro) {
      if (!hasIntroCompleted.value && !isIntroPlaying.value) {
        startIntroSequence()
      }
      return
    }

    if (isIntroPlaying.value) {
      emit('introComplete')
    }
    isIntroPlaying.value = false
    hasIntroCompleted.value = true
  },
  { immediate: true },
)

onMounted(() => {
  handleInitNewsInterestFlow()
})

onUnmounted(() => {
  isIntroPlaying.value = false
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/utils/agent-intro' as *;

.chat-news-curator {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  /** 런치/설문 에이전트 카드와 동일 너비 (768px $chat-max-width와 구분) */
  max-width: 760px;
  height: auto;
  max-height: min(640px, 78vh);
  margin-inline: auto;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  overflow: hidden;

  /** 런치/설문 카드와 동일 톤 — 본문 영역이 뷰포트 내에서 스크롤되도록 */
  &__content {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &--compact {
    height: auto;
    max-height: none;
    flex: 0 0 auto;

    .chat-news-curator__content {
      flex: 0 0 auto;
    }
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

    .chat-news-curator__footer {
      flex-shrink: 0;
    }
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

  &__main--busy {
    align-items: center;
    justify-content: center;
    min-height: min(200px, 40vh);
    padding: $spacing-lg;
  }

  &--compact &__main {
    flex: 0 0 auto;
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

  &__selector-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    min-height: 120px;
    padding: $spacing-md 0;
    text-align: center;

    p {
      margin: 0;
      @include typo($body-small);
      color: $color-text-secondary;
    }
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

  &__footer--results {
    justify-content: flex-end;
    border-top: 1px solid $color-border;
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

@include agent-card-intro(
  'chat-news-curator',
  'results-intro',
  '--news-curator-theme-color',
  '--news-curator-theme-rgb'
);
@include agent-card-intro-keyframes;
@include agent-intro-transition;
</style>

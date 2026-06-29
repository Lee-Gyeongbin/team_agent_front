<template>
  <div
    v-if="isDataQuestionActive"
    class="dq-guide"
    :style="guideThemeStyle"
  >
    <div class="dq-guide__summary">
      <div class="dq-guide__summary-left">
        <i :class="[resolvedThemeIconClass, 'size-14']" />
        <span
          class="dq-guide__summary-score"
          :class="{ 'is-pass': score.passed }"
        >
          {{ score.passed ? '완성도 통과' : `완성도 ${score.score}점` }}
        </span>
        <span
          v-if="requiredMissingCount > 0"
          class="dq-guide__summary-missing"
        >
          필수 {{ requiredMissingCount }}개 미충족
        </span>
      </div>
      <button
        type="button"
        class="dq-guide__toggle"
        :aria-label="isOpen ? '가이드 접기' : '가이드 펼치기'"
        :title="isOpen ? '가이드 접기' : '가이드 펼치기'"
        @click="isOpen = !isOpen"
      >
        <i
          class="size-14 dq-guide__toggle-icon icon-chevron-down"
          :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
        />
      </button>
    </div>
    <div class="dq-guide__progress">
      <div
        class="dq-guide__progress-fill"
        :style="{ width: `${score.score}%` }"
      />
    </div>

    <Transition name="dq-guide-fold">
      <div
        v-if="isOpen"
        class="dq-guide__body"
      >
        <div class="dq-guide__criteria">
          <span
            v-for="c in score.criteria"
            :key="c.key"
            class="dq-guide__crit"
            :class="{ 'is-met': c.met, 'is-req': c.required && !c.met }"
          >
            <i class="size-10" :class="c.met ? 'icon-check' : 'icon-close'" />
            {{ c.label }}
          </span>
        </div>

        <template v-if="!isLoadingVocabulary && hasAutocomplete">
          <div class="dq-guide__sep" />
          <div class="dq-guide__section">
            <span class="dq-guide__label">자동완성</span>
            <div class="dq-guide__ac-list">
              <button
                v-for="item in autocompleteItems"
                :key="item.term"
                type="button"
                class="dq-guide__ac-item"
                @click="selectAutocomplete(item.term)"
              >
                <span class="dq-guide__ac-type">{{ item.type === 'METRIC' ? '지표' : '구분' }} ·</span>
                {{ item.term }}
              </button>
            </div>
          </div>
        </template>

        <template v-if="isFewshotLoading || fewshotList.length > 0">
          <div class="dq-guide__sep" />
          <div class="dq-guide__section">
            <span class="dq-guide__label">질의 예시</span>
            <template v-if="isFewshotLoading">
              <span
                v-for="n in 3"
                :key="n"
                class="dq-guide__ex-skeleton"
              />
            </template>
            <div v-else class="dq-guide__ex-list">
              <button
                v-for="item in fewshotList"
                :key="item.fewshotId"
                type="button"
                class="dq-guide__ex-item"
                :class="{ 'is-active': chatMessage === item.userQuestion }"
                :title="item.userQuestion"
                @click="chatMessage = item.userQuestion"
              >
                <span class="dq-guide__ex-text">{{ item.userQuestion }}</span>
                <i class="icon-arrow-right size-12 dq-guide__ex-arrow" />
              </button>
            </div>
          </div>
        </template>

        <template v-if="!isLoadingVocabulary && hasVocabSuggestions">
          <div class="dq-guide__sep" />
          <div class="dq-guide__section">
            <div class="dq-guide__vocab-grid">
              <div
                v-if="metricTerms.length"
                class="dq-guide__vocab-row"
              >
                <span class="dq-guide__vocab-title">지표</span>
                <ul class="dq-guide__term-list">
                  <li
                    v-for="term in metricTerms"
                    :key="`metric-${term}`"
                    class="dq-guide__term-item"
                  >
                    {{ term }}
                  </li>
                </ul>
              </div>
              <div
                v-if="dimensionTerms.length"
                class="dq-guide__vocab-row"
              >
                <span class="dq-guide__vocab-title">구분</span>
                <ul class="dq-guide__term-list">
                  <li
                    v-for="term in dimensionTerms"
                    :key="`dimension-${term}`"
                    class="dq-guide__term-item"
                  >
                    {{ term }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DatamartMetaFewshot } from '~/types/datamartMeta'
import { useDatamartApi } from '~/composables/datamart/useDatamartApi'
import { scoreFromText } from '~/utils/chat/dataQuestionRubric'

interface Props {
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeIconClassNm: 'icon-chart-ai',
  themeColorHex: '',
})

const { chatMessage } = useChatRooms()
const { subOptions, selectedSubOptions, activeSearchModes, riskAgentActive } = useChatStore()
const { isLoadingVocabulary, suggestMetric, suggestDimension } = useDatamartVocabulary()
const { fetchMetaFewshotList } = useDatamartApi()
const isOpen = ref(false)

// ── 노출 게이트 ────────────────────────────────────────────────────────────

const isDataQuestionActive = computed(
  () => activeSearchModes.value.includes('S') && !riskAgentActive.value,
)

const requiredMissingCount = computed(
  () => score.value.criteria.filter((c) => c.required && !c.met).length,
)

watch(isDataQuestionActive, (active) => {
  if (!active) return
  isOpen.value = false
})

const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '').trim()
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '46, 163, 242'
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

const resolvedThemeIconClass = computed(() => props.themeIconClassNm || 'icon-chart-ai')
const guideThemeStyle = computed(() => {
  const color = props.themeColorHex?.trim()
  if (!color) return undefined
  return {
    '--dq-theme-color': color,
    '--dq-theme-rgb': hexToRgb(color),
  }
})

// ── 실시간 채점 ────────────────────────────────────────────────────────────

const score = computed(() => scoreFromText(chatMessage.value))

// ── 현재 선택 데이터마트 ───────────────────────────────────────────────────

const currentDatamartId = computed(() => {
  const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
  return selected ?? String(subOptions.value[0]?.value ?? '')
})

// ── 퓨샷 예시 조회 (전체) ────────────────────────────────────────────────

const fewshotList = ref<DatamartMetaFewshot[]>([])
const isFewshotLoading = ref(false)

const loadFewshots = async (datamartId: string) => {
  if (!datamartId) { fewshotList.value = []; return }
  isFewshotLoading.value = true
  try {
    const res = await fetchMetaFewshotList(datamartId)
    fewshotList.value = (res.fewshotList ?? []).filter((f) => f.useYn === 'Y')
  } catch {
    fewshotList.value = []
  } finally {
    isFewshotLoading.value = false
  }
}

watch(currentDatamartId, (id) => void loadFewshots(id), { immediate: true })

// ── 타이핑 기반 자동완성 ──────────────────────────────────────────────────

interface AutocompleteItem { term: string; type: 'METRIC' | 'DIMENSION' }

const currentToken = computed(() => {
  const text = chatMessage.value
  if (!text || text.endsWith(' ')) return ''
  return text.split(/\s+/).at(-1) ?? ''
})

const autocompleteItems = computed((): AutocompleteItem[] => {
  const token = currentToken.value
  if (token.length < 1) return []
  return [
    ...suggestMetric(token).slice(0, 3).map((term) => ({ term, type: 'METRIC' as const })),
    ...suggestDimension(token).slice(0, 3).map((term) => ({ term, type: 'DIMENSION' as const })),
  ]
})

const hasAutocomplete = computed(() => autocompleteItems.value.length > 0)

const selectAutocomplete = (term: string) => {
  const text = chatMessage.value
  const idx = text.lastIndexOf(' ')
  chatMessage.value = idx === -1 ? term : text.slice(0, idx + 1) + term
}

// ── 참고 용어 (비인터랙티브) ──────────────────────────────────────────────

const MAX_VOCAB = 8
const metricTerms = computed(() => suggestMetric('').slice(0, MAX_VOCAB))
const dimensionTerms = computed(() => suggestDimension('').slice(0, MAX_VOCAB))
const hasVocabSuggestions = computed(
  () => metricTerms.value.length > 0 || dimensionTerms.value.length > 0,
)
</script>

<style lang="scss" scoped>
.dq-guide {
  width: 100%;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid $color-border;
  border-bottom: 0;
  border-top-left-radius: $border-radius-lg;
  border-top-right-radius: $border-radius-lg;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  animation: dq-guide-drop 0.48s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: '';
    display: block;
    height: 1px;
    background: linear-gradient(
      90deg,
      var(--dq-theme-color, var(--color-primary, #{$color-primary})) 0%,
      rgba(var(--dq-theme-rgb, 46, 163, 242), 0.35) 100%
    );
  }

  @keyframes dq-guide-drop {
    0% {
      opacity: 0;
      transform: translateY(-14px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-xs;
    padding: 7px $spacing-md;
    background: linear-gradient(
      180deg,
      rgba(var(--dq-theme-rgb, 46, 163, 242), 0.05) 0%,
      #f8fbfd 100%
    );
    border-bottom: 1px solid $color-border-light;
  }

  &__summary-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
  }

  &__summary-score {
    @include typo($body-caption-bold, $color-text-secondary);

    &.is-pass {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    }
  }

  &__progress {
    height: 2px;
    background: $color-border-light;
  }

  &__progress-fill {
    height: 100%;
    background: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    transition: width 0.35s ease;
  }

  &__summary-missing {
    @include typo($body-caption, #e25555);
  }

  &__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid $color-border;
    border-radius: 999px;
    background: #fff;
    padding: 0;
    cursor: pointer;
    color: $color-text-secondary;
    transition:
      border-color 0.25s ease,
      color 0.25s ease,
      background-color 0.25s ease,
      transform 0.25s ease;

    &:hover {
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 0, 102, 204), 0.08);
      transform: translateY(-1px);
    }
  }

  &__toggle-icon {
    transition: transform 0.42s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  &__body {
    max-height: min(340px, 36vh);
    overflow-y: auto;
    @include custom-scrollbar;
  }

  :deep(.dq-guide-fold-enter-active),
  :deep(.dq-guide-fold-leave-active) {
    transition: all 0.52s cubic-bezier(0.22, 0.61, 0.36, 1);
    transform-origin: top;
  }

  :deep(.dq-guide-fold-enter-from),
  :deep(.dq-guide-fold-leave-to) {
    opacity: 0;
    transform: translateY(-10px);
  }

  &__criteria {
    padding: 6px $spacing-md;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
  }

  &__crit {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding: 0 6px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    background: #fff;
    @include typo($body-caption, $color-text-muted);
    transition:
      color 0.15s,
      border-color 0.15s,
      background-color 0.15s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    i {
      opacity: 0.5;
      flex-shrink: 0;
    }

    &.is-met {
      color: #2ea66b;
      border-color: rgba(46, 166, 107, 0.25);
      background: rgba(46, 166, 107, 0.04);
      i { opacity: 1; }
    }

    &.is-req {
      color: #e25555;
      border-color: rgba(226, 85, 85, 0.25);
      background: rgba(226, 85, 85, 0.04);
      font-weight: 700;
      i { opacity: 1; }
    }
  }

  &__sep {
    height: 1px;
    background: $color-border-light;
  }

  // ── 공통 라벨 ─────────────────────────────────────────────────────────────

  &__label {
    flex-shrink: 0;
    @include typo($body-caption-bold, $color-text-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
  }

  &__section {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: 8px $spacing-md;
  }

  &__ac-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__ac-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 6px;
    border: 1px solid $color-border;
    border-radius: 999px;
    background: #fff;
    cursor: pointer;
    @include typo($body-caption, $color-text-primary);
    transition:
      border-color 0.12s,
      background-color 0.12s;

    &:hover {
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 0, 102, 204), 0.08);
    }
  }

  &__ac-type {
    flex-shrink: 0;
    @include typo($body-caption-bold, $color-text-muted);
  }

  &__ex-skeleton {
    display: block;
    height: 20px;
    border-radius: $border-radius-sm;
    background: linear-gradient(
      90deg,
      $color-background 25%,
      $color-border-light 50%,
      $color-background 75%
    );
    background-size: 200% 100%;
    animation: dq-shimmer 1.4s infinite;

    &:nth-child(2) { width: 80%; }
    &:nth-child(3) { width: 65%; }
  }

  @keyframes dq-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  &__ex-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 96px;
    overflow-y: auto;
    @include custom-scrollbar;
  }

  &__ex-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 8px;
    width: 100%;
    min-height: 34px;
    padding: 6px 10px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    background: #fff;
    text-align: left;
    @include typo($body-small, $color-text-secondary);
    cursor: pointer;
    transition:
      color 0.12s,
      border-color 0.12s,
      background-color 0.12s;

    &:hover {
      color: $color-text-heading;
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 0, 102, 204), 0.06);
    }

    .dq-guide__ex-text {
      @include ellipsis(2);
      line-height: 1.35;
    }

    .dq-guide__ex-arrow {
      color: $color-text-muted;
      opacity: 0.7;
    }

    &.is-active {
      color: var(--color-primary, #{$color-primary});
      font-weight: 600;
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 0, 102, 204), 0.08);
    }
  }

  &__vocab-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    height: 100%;
    min-height: 108px;
    padding: 7px 10px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    background: #fff;
  }

  &__vocab-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__vocab-title {
    @include typo($body-caption-bold, $color-text-muted);
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  &__term-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 68px; // 약 3개 라벨 노출
    overflow-y: auto;
    @include custom-scrollbar;
  }

  &__term-item {
    position: relative;
    padding-left: 10px;
    @include typo($body-caption, $color-text-muted);
    line-height: 1.45;
    word-break: break-word;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 7px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.65);
    }
  }

  @include mobile {
    &__criteria {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__vocab-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

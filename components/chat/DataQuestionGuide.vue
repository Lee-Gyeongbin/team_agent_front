<template>
  <div
    v-if="isDataQuestionActive"
    class="dq-guide"
    :style="guideThemeStyle"
  >
    <div
      class="dq-guide__summary"
      :class="{
        'is-required-missing': requiredMissingCount > 0,
        'is-just-passed': justPassed,
      }"
    >
      <div class="dq-guide__summary-left">
        <i :class="[resolvedThemeIconClass, 'size-14']" />
        <span
          class="dq-guide__summary-score"
          :class="{ 'is-pass': isReadyPass }"
        >
          {{ summaryLabel }}
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
          :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }"
        />
      </button>
    </div>
    <div
      v-if="hasSupplement"
      class="dq-guide__supplement"
      :class="`is-${diagnosis?.status.toLowerCase()}`"
    >
      <template v-if="diagnosis?.status === 'OUT_OF_SCOPE'">
        <p class="dq-guide__supplement-msg">현재 데이터로는 답하기 어려운 질문이에요. 이런 통계는 조회할 수 있어요.</p>
        <div class="dq-guide__chip-row">
          <button
            v-for="(alt, i) in diagnosis?.alternatives ?? []"
            :key="i"
            type="button"
            class="dq-guide__chip"
            @click="applyAlternative(alt)"
          >
            {{ alt }}
          </button>
        </div>
      </template>
      <template v-else>
        <p class="dq-guide__supplement-msg">아래 내용을 질문에 더해 다시 검증해 주세요.</p>
        <ul class="dq-guide__clarify-list">
          <li
            v-for="cq in diagnosis?.clarificationQuestions ?? []"
            :key="cq.item"
            class="dq-guide__clarify-item"
          >
            {{ cq.question }}
          </li>
        </ul>
      </template>
    </div>

    <Transition name="dq-guide-fold">
      <div
        v-if="isOpen"
        class="dq-guide__fold"
      >
        <div class="dq-guide__body">
          <div class="dq-guide__criteria">
            <span
              v-for="c in score.criteria"
              :key="c.key"
              class="dq-guide__crit"
              :class="{ 'is-met': c.met, 'is-req': c.required && !c.met }"
            >
              <i
                class="size-10"
                :class="c.met ? 'icon-check' : 'icon-close'"
              />
              {{ c.label }}
            </span>
          </div>

          <div
            v-if="showTabs"
            class="dq-guide__tabs"
            role="tablist"
          >
            <button
              v-for="tab in datamartTabs"
              :key="tab.id"
              type="button"
              role="tab"
              class="dq-guide__tab"
              :class="{ 'is-active': tab.id === activeTabId }"
              :aria-selected="tab.id === activeTabId"
              :title="tab.label"
              @click="onSelectTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>

          <Transition
            name="dq-tab"
            mode="out-in"
          >
            <div
              :key="activeTabId"
              class="dq-guide__tabpanel"
            >
              <template v-if="isFewshotLoading || fewshotList.length > 0">
                <div class="dq-guide__sep" />
                <div class="dq-guide__section">
                  <span class="dq-guide__label">모범 질의</span>
                  <template v-if="isFewshotLoading">
                    <span class="dq-guide__ex-skeleton" />
                  </template>
                  <div
                    v-else
                    class="dq-guide__ex-list"
                  >
                    <button
                      v-for="item in fewshotList.slice(0, 1)"
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

              <div
                v-if="showTabs && isTabPanelEmpty"
                class="dq-guide__tab-empty"
              >
                <i class="icon-info size-14" />
                이 데이터마트에 등록된 참고 정보가 없습니다.
              </div>
            </div>
          </Transition>
        </div>
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
const { fetchMetaFewshotList } = useDatamartApi()
const { showDiagnosis, diagnosis, applyAlternative } = useDataQuestionGate()
const isOpen = ref(false)

/** 검증 결과 노출 — 통과 외(보완/범위밖/용어모호)일 때 액션 카드 표시 */
const hasSupplement = computed(() => showDiagnosis.value && !!diagnosis.value && diagnosis.value.status !== 'READY')

/** 검증 통과 상태 (요약 라벨용) */
const isReadyPass = computed(() => showDiagnosis.value && diagnosis.value?.status === 'READY')

/** 요약 라벨 — 검증 후엔 진단 점수 노출 (검증 전엔 점수 미표시) */
const summaryLabel = computed(() => {
  if (!showDiagnosis.value || !diagnosis.value) return '질의 작성 가이드'
  const sc = Math.round(diagnosis.value.readinessScore ?? 0)
  return isReadyPass.value ? `검증 통과 · ${sc}점` : `검증 점수 ${sc}점 · 보완 필요`
})

// 보완이 필요한 진단이 나오면 가이드를 자동으로 펼쳐 사용자가 바로 보게 함
watch(hasSupplement, (next) => {
  if (next) isOpen.value = true
})

/** 검증 통과 순간 헤더 강조 — 한 번만 재생 */
const justPassed = ref(false)
watch(isReadyPass, (next, prev) => {
  if (next && prev === false) {
    justPassed.value = true
    window.setTimeout(() => (justPassed.value = false), 900)
  }
})

// ── 노출 게이트 ────────────────────────────────────────────────────────────

const isDataQuestionActive = computed(() => activeSearchModes.value.includes('S') && !riskAgentActive.value)

const requiredMissingCount = computed(() => score.value.criteria.filter((c) => c.required && !c.met).length)

watch(isDataQuestionActive, (active) => {
  if (!active) return
  isOpen.value = false
})

const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '').trim()
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
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

// ── 선택 데이터마트 탭 ─────────────────────────────────────────────────────

interface DatamartTab {
  id: string
  label: string
}

/**
 * 노출할 데이터마트 탭 목록.
 * - 특정 데이터마트를 1개 이상 체크한 경우: 체크된 것만 (subOptions 순서 유지)
 * - 'all' 또는 미선택: 선택 가능한 전체 데이터마트
 */
const datamartTabs = computed<DatamartTab[]>(() => {
  const opts = subOptions.value
  const selectedIds = selectedSubOptions.value.filter((id) => id && id !== 'all')
  const source = selectedIds.length ? opts.filter((o) => selectedIds.includes(String(o.value))) : opts
  return source.map((o) => ({ id: String(o.value), label: o.label }))
})

/** 탭은 2개 이상일 때만 노출 (단일 선택은 탭 없이 본문만) */
const showTabs = computed(() => datamartTabs.value.length > 1)

const activeTabId = ref('')

watch(
  datamartTabs,
  (tabs) => {
    if (!tabs.length) {
      activeTabId.value = ''
      return
    }
    if (!tabs.some((t) => t.id === activeTabId.value)) activeTabId.value = tabs[0].id
  },
  { immediate: true },
)

const onSelectTab = (id: string) => {
  activeTabId.value = id
}

// ── 용어사전 (활성 탭 기준) ────────────────────────────────────────────────

const { isLoadingVocabulary, suggestMetric, suggestDimension } = useDatamartVocabulary(activeTabId)

// ── 퓨샷 예시 조회 (활성 탭 기준) ─────────────────────────────────────────

const fewshotList = ref<DatamartMetaFewshot[]>([])
const isFewshotLoading = ref(false)

const loadFewshots = async (datamartId: string) => {
  if (!datamartId) {
    fewshotList.value = []
    return
  }
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

watch(activeTabId, (id) => void loadFewshots(id), { immediate: true })

// ── 참고 용어 (비인터랙티브) ──────────────────────────────────────────────

const MAX_VOCAB = 8
const metricTerms = computed(() => suggestMetric('').slice(0, MAX_VOCAB))
const dimensionTerms = computed(() => suggestDimension('').slice(0, MAX_VOCAB))
const hasVocabSuggestions = computed(() => metricTerms.value.length > 0 || dimensionTerms.value.length > 0)

// ── 탭 본문 상태 ───────────────────────────────────────────────────────────

const isTabLoading = computed(() => isFewshotLoading.value || isLoadingVocabulary.value)
const hasTabMeta = computed(() => fewshotList.value.length > 0 || hasVocabSuggestions.value)
/** 다중 탭에서 현재 탭에 노출할 메타가 전혀 없는지 (안내 문구용) */
const isTabPanelEmpty = computed(() => !isTabLoading.value && !hasTabMeta.value)
</script>

<style lang="scss" scoped>
.dq-guide {
  width: 100%;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
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
    background: linear-gradient(180deg, rgba(var(--dq-theme-rgb, 46, 163, 242), 0.05) 0%, #f8fbfd 100%);
    border-bottom: 1px solid $color-border-light;

    &.is-required-missing {
      background: linear-gradient(180deg, rgba(226, 85, 85, 0.08) 0%, #fdf9f9 100%);
      border-bottom-color: rgba(226, 85, 85, 0.12);
    }

    &.is-just-passed {
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.14);
        animation: dq-guide-pass-flash 0.85s ease-out forwards;
        pointer-events: none;
      }
    }
  }

  &__summary.is-just-passed &__summary-score.is-pass {
    animation: dq-guide-pass-label 0.85s cubic-bezier(0.34, 1.2, 0.64, 1);
  }

  @keyframes dq-guide-pass-flash {
    0% {
      opacity: 0;
    }
    28% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes dq-guide-pass-label {
    0%,
    100% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.04);
    }
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

  // ── 검증 결과 보완 카드 (선택형) ──────────────────────────────────────────
  &__supplement {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px $spacing-md 12px;
    border-top: 1px solid $color-border-light;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.04);

    &.is-out_of_scope {
      background: rgba(226, 85, 85, 0.05);
    }
  }

  &__supplement-msg {
    @include typo($body-small, $color-text-secondary);
  }

  &__clarify {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &-q {
      @include typo($body-caption-bold, $color-text-primary);
    }
  }

  &__clarify-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__clarify-item {
    position: relative;
    padding-left: 12px;
    @include typo($body-small, $color-text-primary);
    line-height: 1.45;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    }
  }

  &__chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    padding: 5px 10px;
    border: 1px solid $color-border;
    border-radius: 999px;
    background: #fff;
    cursor: pointer;
    @include typo($body-caption, $color-text-secondary);
    transition:
      color 0.15s,
      border-color 0.15s,
      background-color 0.15s;

    &:hover {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.08);
    }
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
    transition: transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  // ── 펼침/접힘 컨테이너 (grid-rows 0fr↔1fr 트릭) ──────────────────────────
  &__fold {
    display: grid;
    grid-template-rows: 1fr;
    will-change: grid-template-rows;
  }

  &__body {
    min-height: 0;
    max-height: min(340px, 36vh);
    overflow-y: auto;
    @include custom-scrollbar;
  }

  // 열림: 끝에서 부드럽게 감속하며 "펼쳐지는" 느낌
  :deep(.dq-guide-fold-enter-active) {
    transition:
      grid-template-rows 0.9s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.6s ease 0.2s;

    .dq-guide__body {
      overflow: hidden;
    }
  }

  // 닫힘: 동일한 속도로 일정하게 "닫히는" 느낌
  :deep(.dq-guide-fold-leave-active) {
    transition:
      grid-template-rows 0.9s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.5s ease;

    .dq-guide__body {
      overflow: hidden;
    }
  }

  :deep(.dq-guide-fold-enter-from),
  :deep(.dq-guide-fold-leave-to) {
    grid-template-rows: 0fr;
    opacity: 0;
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
      i {
        opacity: 1;
      }
    }

    &.is-req {
      color: #e25555;
      border-color: rgba(226, 85, 85, 0.25);
      background: rgba(226, 85, 85, 0.04);
      font-weight: 700;
      i {
        opacity: 1;
      }
    }
  }

  &__sep {
    height: 1px;
    background: $color-border-light;
  }

  // ── 데이터마트 탭 (다중 선택 시) ──────────────────────────────────────────
  &__tabs {
    display: flex;
    align-items: stretch;
    gap: 2px;
    padding: 4px $spacing-md 0;
    border-top: 1px solid $color-border-light;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tab {
    position: relative;
    flex-shrink: 0;
    max-width: 160px;
    padding: 6px 10px 8px;
    border: 0;
    background: transparent;
    cursor: pointer;
    @include typo($body-caption, $color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s ease;

    &::after {
      content: '';
      position: absolute;
      left: 6px;
      right: 6px;
      bottom: 0;
      height: 2px;
      border-radius: 2px;
      background: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &:hover {
      color: $color-text-secondary;
    }

    &.is-active {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      font-weight: 700;

      &::after {
        transform: scaleX(1);
      }
    }
  }

  &__tabpanel {
    display: flex;
    flex-direction: column;
  }

  &__tab-empty {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px $spacing-md;
    @include typo($body-caption, $color-text-muted);

    i {
      opacity: 0.6;
    }
  }

  // 탭 전환 시 부드러운 페이드
  :deep(.dq-tab-enter-active),
  :deep(.dq-tab-leave-active) {
    transition: opacity 0.18s ease;
  }

  :deep(.dq-tab-enter-from),
  :deep(.dq-tab-leave-to) {
    opacity: 0;
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
    align-items: center;
    gap: $spacing-sm;
    padding: 8px $spacing-md;
  }

  &__ex-skeleton {
    display: block;
    flex: 1;
    height: 20px;
    border-radius: $border-radius-sm;
    background: linear-gradient(90deg, $color-background 25%, $color-border-light 50%, $color-background 75%);
    background-size: 200% 100%;
    animation: dq-shimmer 1.4s infinite;
  }

  @keyframes dq-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
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

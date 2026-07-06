<template>
  <div
    v-if="isDataQuestionActive"
    class="dq-guide"
    :class="{ 'is-collapsed': !isOpen }"
    :style="guideThemeStyle"
  >
    <div
      class="dq-guide__header"
      role="button"
      tabindex="0"
      :class="{
        'is-required-missing': requiredMissingCount > 0,
        'is-just-passed': justPassed,
      }"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? '가이드 접기' : '가이드 펼치기'"
      @click="onToggleGuide"
      @keydown.enter.prevent="onToggleGuide"
      @keydown.space.prevent="onToggleGuide"
    >
      <div class="dq-guide__header-text">
        <div class="dq-guide__header-main">
          <h2 class="dq-guide__title">질의 전 가이드</h2>
          <p class="dq-guide__subtitle">단계별로 입력하면 더 정확한 데이터를 조회할 수 있어요</p>
        </div>
        <div class="dq-guide__header-status">
          <p
            v-if="showDiagnosis"
            class="dq-guide__score"
            :class="{ 'is-pass': isReadyPass }"
          >
            <i :class="[resolvedThemeIconClass, 'size-12']" />
            {{ summaryLabel }}
          </p>
          <p
            v-if="requiredMissingCount > 0"
            class="dq-guide__score-missing"
          >
            필수 {{ requiredMissingCount }}개 미충족
          </p>
        </div>
      </div>
      <span
        class="dq-guide__toggle"
        aria-hidden="true"
      >
        <i
          class="size-14 dq-guide__toggle-icon icon-chevron-down"
          :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' }"
        />
      </span>
    </div>

    <Transition name="dq-guide-fold">
      <div
        v-if="isOpen"
        class="dq-guide__content"
      >
        <div class="dq-guide__formula-example">
          <span class="dq-guide__formula-example-label">예시</span>
          <button
            type="button"
            class="dq-guide__formula-example-text"
            @click="onApplyFormulaExample"
          >
            {{ formulaExampleQuestion }}
          </button>
        </div>

        <div class="dq-guide__content-inner">
          <div class="dq-guide__formula-card">
            <div class="dq-guide__formula-head">
              <i :class="[resolvedThemeIconClass, 'size-18 dq-guide__formula-icon']" />
              <h3 class="dq-guide__formula-title">질문 작성 공식</h3>
            </div>
            <div class="dq-guide__formula-row">
              <template
                v-for="(item, index) in formulaItems"
                :key="item.key"
              >
                <span
                  v-if="index > 0"
                  class="dq-guide__formula-plus"
                >
                  +
                </span>
                <button
                  v-if="isFormulaItemClickable(item.key)"
                  type="button"
                  class="dq-guide__formula-pill"
                  :class="{
                    'is-met': item.met,
                    'is-active': activeFormulaControl === item.key,
                  }"
                  @click="onSelectFormulaItem(item.key)"
                >
                  <span class="dq-guide__formula-label">{{ item.label }}</span>
                </button>
                <span
                  v-else
                  class="dq-guide__formula-pill"
                  :class="{ 'is-met': item.met }"
                >
                  <span class="dq-guide__formula-label">{{ item.label }}</span>
                </span>
              </template>
            </div>
          </div>

          <div class="dq-guide__content-inner-right">
            <template v-if="!hasSupplement && hasDatamartConfigured">
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

              <section class="dq-guide__period-row">
                <h4 class="dq-guide__period-title">기간</h4>
                <ul
                  class="dq-guide__period-list"
                  role="listbox"
                  aria-label="기간 선택"
                >
                  <li
                    v-for="period in periodOptions"
                    :key="period"
                  >
                    <button
                      type="button"
                      role="option"
                      class="dq-guide__period-option"
                      :class="{ 'is-selected': isPeriodSelected(period) }"
                      :aria-selected="isPeriodSelected(period)"
                      @click="onSelectPeriod(period)"
                    >
                      {{ period }}
                    </button>
                  </li>
                </ul>
              </section>

              <div class="dq-guide__columns">
                <section class="dq-guide__col">
                  <header class="dq-guide__col-head">
                    <i class="icon-chat-open-book size-18 dq-guide__col-icon" />
                    <div class="dq-guide__col-head-text">
                      <h4 class="dq-guide__col-title">무엇을 조회할까요?</h4>
                      <p class="dq-guide__col-desc">필요한 정보를 선택해 주세요.</p>
                    </div>
                  </header>
                  <div class="dq-guide__col-body">
                    <div
                      v-if="isLoadingVocabulary"
                      class="dq-guide__col-state"
                    >
                      <UiLoading text="" />
                      <span>지표 목록을 불러오는 중입니다</span>
                    </div>
                    <div
                      v-else-if="metricTerms.length === 0"
                      class="dq-guide__col-state is-empty"
                    >
                      <i class="icon-info size-14" />
                      <span>등록된 지표(METRIC) 용어가 없습니다</span>
                    </div>
                    <ul
                      v-else
                      class="dq-guide__option-list"
                      role="listbox"
                      aria-label="지표 선택"
                    >
                      <li
                        v-for="(term, index) in metricTerms"
                        :key="term"
                      >
                        <button
                          type="button"
                          role="option"
                          class="dq-guide__option"
                          :class="{ 'is-selected': isMetricSelected(term) }"
                          :aria-selected="isMetricSelected(term)"
                          @click="onSelectMetric(term)"
                        >
                          <span class="dq-guide__option-radio" />
                          <span class="dq-guide__option-label">{{ term }}</span>
                          <span
                            v-if="index === 0"
                            class="dq-guide__option-badge"
                          >
                            추천
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </section>

                <section class="dq-guide__col dq-guide__col--preview">
                  <header class="dq-guide__col-head">
                    <i class="icon-sparkle size-18 dq-guide__col-icon" />
                    <div class="dq-guide__col-head-text">
                      <h4 class="dq-guide__col-title">완성된 질문 미리보기</h4>
                      <p class="dq-guide__col-desc">선택한 항목과 기준으로 최적의 질문을 제안해요.</p>
                    </div>
                  </header>
                  <div class="dq-guide__preview-card">
                    <p class="dq-guide__preview-question">
                      {{ composedQuestion }}
                    </p>
                    <p class="dq-guide__preview-tags">{{ previewTags }}</p>
                    <button
                      type="button"
                      class="dq-guide__preview-action"
                      @click="onApplyComposedQuestion"
                    >
                      <i class="icon-sparkle size-16" />
                      이 질문으로 조회하기
                    </button>
                  </div>
                </section>
              </div>
            </template>

            <section class="dq-guide__formula-panel">
              <div class="dq-guide__formula-panel-head">
                <h4 class="dq-guide__formula-panel-title">{{ activeFormulaTitle }}</h4>
                <p class="dq-guide__formula-panel-desc">{{ activeFormulaDesc }}</p>
              </div>
              <div
                v-if="activeFormulaControl === 'groupBy' && isLoadingVocabulary"
                class="dq-guide__formula-panel-state"
              >
                <UiLoading text="" />
                <span>구분 목록을 불러오는 중입니다</span>
              </div>
              <ul
                v-else
                class="dq-guide__formula-option-list"
                role="listbox"
                :aria-label="`${activeFormulaTitle} 선택`"
              >
                <li
                  v-for="option in activeFormulaOptions"
                  :key="option.value"
                >
                  <button
                    type="button"
                    role="option"
                    class="dq-guide__formula-option"
                    :class="{ 'is-selected': isFormulaOptionSelected(option) }"
                    :aria-selected="isFormulaOptionSelected(option)"
                    @click="onSelectFormulaOption(option)"
                  >
                    {{ option.label }}
                  </button>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <div
          v-if="hasSupplement"
          class="dq-guide__post-validate"
          :class="`is-${diagnosis?.status.toLowerCase()}`"
        >
          <section
            v-if="showValidationSummary"
            class="dq-guide__validation"
          >
            <header class="dq-guide__validation-head">
              <i :class="[resolvedThemeIconClass, 'size-18 dq-guide__validation-icon']" />
              <div class="dq-guide__validation-head-text">
                <h3 class="dq-guide__validation-title">{{ supplementTitle }}</h3>
                <p class="dq-guide__validation-desc">{{ supplementDesc }}</p>
              </div>
            </header>

            <p
              v-if="missingMandatoryCards.length > 0"
              class="dq-guide__validation-alert"
            >
              필수 확인이 필요한 항목
            </p>

            <div
              v-if="missingMandatoryCards.length > 0"
              class="dq-guide__validation-cards"
            >
              <article
                v-for="card in missingMandatoryCards"
                :key="card.key"
                class="dq-guide__validation-card"
              >
                <div class="dq-guide__validation-card-top">
                  <i :class="[card.icon, 'size-16 dq-guide__validation-card-icon']" />
                  <span class="dq-guide__validation-card-label">{{ card.label }}</span>
                  <span class="dq-guide__validation-card-badge">필수 확인</span>
                </div>
                <p class="dq-guide__validation-card-msg">{{ card.question }}</p>
              </article>
            </div>

            <p
              v-for="(tip, index) in clarificationTips"
              :key="`tip-${index}`"
              class="dq-guide__validation-tip"
            >
              {{ tip.question }}
            </p>

            <p
              v-if="termAlternatives.length > 0 && clarificationTips.length === 0"
              class="dq-guide__validation-tip"
            >
              질문에 사용할 용어를 선택해 주세요.
            </p>

            <div
              v-if="termAlternatives.length > 0"
              class="dq-guide__chip-row"
            >
              <UiButton
                v-for="(alt, index) in termAlternatives"
                :key="`alt-${index}`"
                variant="line-secondary"
                size="sm"
                @click="onApplyTermAlternative(alt)"
              >
                {{ alt }}
              </UiButton>
            </div>
          </section>
        </div>

        <div
          v-else-if="!hasDatamartConfigured"
          class="dq-guide__empty-datamart"
        >
          <i class="icon-info size-18" />
          <p>설정된 데이터마트가 없습니다. 데이터마트를 선택해주세요.</p>
        </div>

        <section
          v-if="!hasSupplement && hasDatamartConfigured"
          class="dq-guide__faq-row"
          aria-label="자주 묻는 질문"
        >
          <h4 class="dq-guide__faq-title">자주 묻는 질문</h4>
          <button
            type="button"
            class="dq-guide__faq-item"
            @click="onApplyComposedQuestion"
          >
            <i class="icon-sparkle size-16 dq-guide__faq-icon" />
            <span class="dq-guide__faq-text">
              <span class="dq-guide__faq-question">{{ composedQuestion }}</span>
              <span class="dq-guide__faq-tags">{{ previewTags }}</span>
            </span>
          </button>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useDataQuestionGuide } from '~/composables/chat/useDataQuestionGate'

interface Props {
  themeIconClassNm?: string
  themeColorHex?: string
}

const props = withDefaults(defineProps<Props>(), {
  themeIconClassNm: 'icon-chart-ai',
  themeColorHex: '',
})

const {
  isDataQuestionActive,
  isOpen,
  requiredMissingCount,
  justPassed,
  resolvedThemeIconClass,
  guideThemeStyle,
  showDiagnosis,
  diagnosis,
  isReadyPass,
  summaryLabel,
  formulaItems,
  formulaExampleQuestion,
  isFormulaItemClickable,
  hasSupplement,
  showValidationSummary,
  supplementTitle,
  supplementDesc,
  missingMandatoryCards,
  clarificationTips,
  termAlternatives,
  hasDatamartConfigured,
  showTabs,
  datamartTabs,
  activeTabId,
  periodOptions,
  activeFormulaControl,
  activeFormulaTitle,
  activeFormulaDesc,
  activeFormulaOptions,
  isLoadingVocabulary,
  metricTerms,
  composedQuestion,
  previewTags,
  onToggleGuide,
  onApplyTermAlternative,
  onSelectTab,
  onSelectPeriod,
  onSelectMetric,
  onSelectFormulaItem,
  onSelectFormulaOption,
  isMetricSelected,
  isPeriodSelected,
  isFormulaOptionSelected,
  onApplyComposedQuestion,
  onApplyFormulaExample,
} = useDataQuestionGuide(props)
</script>

<style lang="scss" scoped>
.dq-guide {
  width: 100%;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #c6d2db;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  animation: dq-guide-drop 0.48s cubic-bezier(0.16, 1, 0.3, 1);

  // &::before {
  //   content: '';
  //   display: block;
  //   height: 1px;
  //   background: linear-gradient(
  //     90deg,
  //     var(--dq-theme-color, var(--color-primary, #{$color-primary})) 0%,
  //     rgba(var(--dq-theme-rgb, 46, 163, 242), 0.35) 100%
  //   );
  // }

  &.is-collapsed .dq-guide__header {
    border-bottom: 0;
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

  &__header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 20px;
    border-bottom: 1px solid $color-border-light;
    background: linear-gradient(180deg, rgba(var(--dq-theme-rgb, 46, 163, 242), 0.05) 0%, #f8fbfd 100%);
    cursor: pointer;
    outline: none;

    &.is-required-missing {
      background: linear-gradient(180deg, rgba(226, 85, 85, 0.08) 0%, #fdf9f9 100%);
      border-bottom-color: rgba(226, 85, 85, 0.12);
    }

    &.is-just-passed .dq-guide__score.is-pass {
      animation: dq-guide-pass-label 0.85s cubic-bezier(0.34, 1.2, 0.64, 1);
    }

    &:focus-visible {
      outline: 2px solid var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      outline-offset: -2px;
    }
  }

  @keyframes dq-guide-pass-label {
    0% {
      transform: scale(0.92);
      opacity: 0.6;
    }
    45% {
      transform: scale(1.06);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  &__header-text {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  &__header-main {
    min-width: 0;
    text-align: left;
  }

  &__header-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
    text-align: right;
  }

  &__title {
    margin: 0;
    @include typo($body-large-bold, $color-text-heading);
    font-size: 18px;
  }

  &__subtitle {
    margin: 2px 0 0;
    @include typo($body-small, $color-text-secondary);
    font-size: 13px;
  }

  &__score {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin: 0;
    @include typo($body-caption-bold, $color-text-secondary);
    font-size: 13px;

    &.is-pass {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    }
  }

  &__score-missing {
    display: inline-flex;
    align-items: center;
    margin: 2px 0 0;
    padding: 4px 12px;
    border-radius: 999px;
    background: #e25555;
    color: #fff;
    font-weight: 500;
    font-size: 13px;
    line-height: 1.2;
  }

  &__toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 1px solid $color-border;
    border-radius: 999px;
    background: #fff;
    padding: 0;
    color: $color-text-secondary;
    transition:
      border-color 0.25s ease,
      color 0.25s ease,
      background-color 0.25s ease;

    &:hover {
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.08);
    }
  }

  &__toggle-icon {
    transition: transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__content {
    display: flex;
    flex-direction: column;
    padding: 16px 20px 20px;
  }

  &__content-inner {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding-top: 10px;
  }

  &__content-inner-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.dq-guide-fold-enter-active) {
    transition:
      opacity 0.35s ease,
      transform 0.35s ease;
  }

  :deep(.dq-guide-fold-leave-active) {
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  :deep(.dq-guide-fold-enter-from),
  :deep(.dq-guide-fold-leave-to) {
    opacity: 0;
    transform: translateY(-8px);
  }

  &__formula-card,
  &__validation,
  &__empty-datamart,
  &__col,
  &__period-row,
  &__faq-item {
    border: 1px solid $color-border-light;
    background: #fff;
  }

  &__formula-card {
    display: flex;
    flex-direction: column;
    padding: 16px 18px 14px;
    border-radius: $border-radius-lg;
  }

  &__formula-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
  }

  &__formula-icon,
  &__validation-icon,
  &__col-icon,
  &__faq-icon {
    flex-shrink: 0;
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
  }

  &__formula-title {
    margin: 0;
    line-height: 1;
    @include typo($body-medium-bold, $color-text-heading);
  }

  &__formula-row {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;
    align-content: center;
    justify-content: center;
    gap: 8px;
  }

  &__formula-plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-height: 36px;
    line-height: 1;
    @include typo($body-medium-bold, $color-text-muted);
  }

  &__formula-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-sizing: border-box;
    gap: 8px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(var(--dq-theme-rgb, 46, 163, 242), 0.35);
    border-radius: $border-radius-base;
    background: #fff;
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    line-height: 1;
    vertical-align: middle;
    font: inherit;

    &:is(button) {
      cursor: pointer;
      appearance: none;
    }

    &.is-met,
    &.is-active {
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
    }

    &.is-active {
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      box-shadow: 0 0 0 2px rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
    }
  }

  &__formula-label {
    display: block;
    line-height: 1;
    @include typo($body-small-bold, inherit);
  }

  &__formula-example {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.06);
  }

  &__formula-example-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    align-self: center;
    min-height: 22px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.14);
    line-height: 1;
    @include typo($body-caption-bold, var(--dq-theme-color, var(--color-primary, #{$color-primary})));
  }

  &__formula-example-text {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    line-height: $line-height-base;
    @include typo($body-small, $color-text-primary);

    &:hover {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      text-decoration: underline;
    }
  }

  &__formula-panel {
    padding: 12px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.04);
  }

  &__formula-panel-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__formula-panel-title {
    flex-shrink: 0;
    margin: 0;
    line-height: 1;
    @include typo($body-small-bold, $color-text-heading);
  }

  &__formula-panel-desc {
    min-width: 0;
    margin: 0;
    line-height: $line-height-base;
    @include typo($body-caption, $color-text-muted);
    @include ellipsis(1);
  }

  &__formula-option-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
    }
  }

  &__formula-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0 11px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    background: #fff;
    cursor: pointer;
    line-height: 1;
    font: inherit;
    appearance: none;
    @include typo($body-caption, $color-text-secondary);

    &.is-selected {
      border-color: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.45);
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      font-weight: 700;
    }
  }

  &__formula-panel-state {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    @include typo($body-caption, $color-text-muted);
  }

  &__post-validate {
    margin-top: 14px;

    &.is-out_of_scope .dq-guide__validation {
      border-color: rgba(226, 85, 85, 0.12);
      background: rgba(226, 85, 85, 0.03);
    }
  }

  &__validation {
    padding: 14px;
    border-radius: $border-radius-lg;
  }

  &__validation-head,
  &__validation-card-top {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__validation-head {
    margin-bottom: 12px;
  }

  &__validation-title {
    margin: 0;
    @include typo($body-medium-bold, $color-text-heading);
  }

  &__validation-desc,
  &__validation-card-msg,
  &__validation-tip {
    @include typo($body-caption, $color-text-secondary);
    line-height: 1.5;
  }

  &__validation-desc,
  &__validation-card-msg,
  &__validation-tip,
  &__validation-alert {
    margin: 0;
  }

  &__validation-alert {
    margin-bottom: 10px;
    @include typo($body-caption-bold, #e25555);
  }

  &__validation-cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 10px;
  }

  &__validation-card {
    padding: 12px;
    border: 1px solid rgba(226, 85, 85, 0.18);
    border-radius: $border-radius-base;
    background: rgba(226, 85, 85, 0.03);
  }

  &__validation-card-top {
    align-items: center;
    margin-bottom: 8px;
  }

  &__validation-card-label {
    @include typo($body-small-bold, $color-text-heading);
  }

  &__validation-card-badge {
    margin-left: auto;
    padding: 2px 7px;
    border-radius: 999px;
    background: rgba(226, 85, 85, 0.1);
    @include typo($body-caption, #e25555);
    font-weight: 600;
  }

  &__validation-tip {
    padding: 10px 12px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.08);

    & + & {
      margin-top: 8px;
    }
  }

  &__chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: 10px;
  }

  &__empty-datamart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 180px;
    margin-top: 14px;
    padding: 24px 16px;
    border-radius: $border-radius-base;
    background: $color-surface;
    text-align: center;
    @include typo($body-small, $color-text-muted);

    p {
      margin: 0;
      line-height: 1.5;
    }
  }

  &__tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 12px;
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

    &.is-active {
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      font-weight: 700;
    }
  }

  &__period-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.03);
  }

  &__period-title {
    flex-shrink: 0;
    margin: 0;
    @include typo($body-small-bold, $color-text-heading);
    white-space: nowrap;
  }

  &__period-list {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__period-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0 11px;
    border: 1px solid $color-border-light;
    border-radius: $border-radius-sm;
    background: #fff;
    cursor: pointer;
    white-space: nowrap;
    @include typo($body-caption, $color-text-secondary);

    &.is-selected {
      border-color: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.45);
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      font-weight: 700;
    }
  }

  &__columns {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__col {
    min-width: 0;
    display: flex;
    flex-direction: column;
    border-radius: $border-radius-lg;
    overflow: hidden;
  }

  &__col-head {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px 14px 12px;
    border-bottom: 1px solid $color-border-light;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.03);
  }

  &__col-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__col-title {
    margin: 0;
    @include typo($body-small-bold, $color-text-heading);
  }

  &__col-desc {
    margin: 4px 0 0;
    @include typo($body-caption, $color-text-muted);
    line-height: 1.4;
  }

  &__col-body {
    flex: 1;
    min-height: 200px;
    max-height: 240px;
    padding: 6px 8px 8px;
    overflow-y: auto;
    @include custom-scrollbar;
  }

  &__col-state {
    height: 100%;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    @include typo($body-caption, $color-text-muted);

    &.is-inline {
      min-height: 48px;
      height: auto;
      flex-direction: row;
      padding: 8px 4px;
    }
  }

  &__option-list {
    margin: 0;
    padding: 0;
    list-style: none;

    &:not(.is-compact) {
      height: 100%;
      overflow-y: auto;
      @include custom-scrollbar;
    }
  }

  &__option-group {
    padding: 4px 0 8px;

    & + & {
      border-top: 1px solid $color-border-light;
    }
  }

  &__option-group-title {
    margin: 0;
    padding: 8px 10px 4px;
    @include typo($body-caption-bold, $color-text-muted);
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 0;
    border-radius: $border-radius-sm;
    background: transparent;
    cursor: pointer;
    text-align: left;
    @include typo($body-small, $color-text-secondary);

    &:hover,
    &.is-selected {
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.08);
      color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    }

    &.is-selected {
      font-weight: 600;
    }
  }

  &__option-radio {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border: 2px solid $color-border;
    border-radius: 50%;
    position: relative;

    .dq-guide__option.is-selected & {
      border-color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));

      &::after {
        content: '';
        position: absolute;
        inset: 2px;
        border-radius: 50%;
        background: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
      }
    }
  }

  &__option-label,
  &__faq-question {
    min-width: 0;
    @include ellipsis(1);
  }

  &__option-label {
    flex: 1;
  }

  &__option-badge {
    flex-shrink: 0;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    @include typo($body-caption-bold, inherit);
  }

  &__preview-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    min-height: 200px;
    padding: 14px;
  }

  &__preview-question {
    flex: 1;
    margin: 0;
    padding: 12px;
    border-radius: $border-radius-base;
    background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.06);
    @include typo($body-small, $color-text-heading);
    line-height: 1.6;
  }

  &__preview-tags,
  &__faq-tags {
    @include typo($body-caption, $color-text-muted);
  }

  &__preview-tags {
    margin: 0;
  }

  &__preview-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    border-radius: $border-radius-base;
    background: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    color: #fff;
    cursor: pointer;
    @include typo($body-small-bold, #fff);
  }

  &__faq-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 14px;
  }

  &__faq-title {
    flex-shrink: 0;
    margin: 0;
    @include typo($body-small-bold, $color-text-heading);
  }

  &__faq-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: $border-radius-base;
    cursor: pointer;
    text-align: left;
  }

  &__faq-text {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    width: 100%;
  }

  &__faq-tags {
    flex-shrink: 0;
    white-space: nowrap;
  }

  @include mobile {
    &__header {
      padding: 16px 20px 14px;
    }

    &__content {
      padding: 14px 16px 16px;
    }

    &__formula-row {
      justify-content: flex-start;
    }

    &__content-inner {
      flex-direction: column;
    }

    &__period-row,
    &__faq-row,
    &__faq-text {
      align-items: stretch;
      flex-direction: column;
    }

    &__validation-cards {
      grid-template-columns: 1fr;
    }

    &__faq-tags {
      white-space: normal;
    }
  }
}
</style>

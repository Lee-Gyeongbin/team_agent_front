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
        <section class="dq-guide__formula-card">
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
              <span
                class="dq-guide__formula-pill"
                :class="{ 'is-met': item.met }"
              >
                <span class="dq-guide__formula-label">{{ item.label }}</span>
              </span>
            </template>
          </div>
        </section>

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
  isReadyPass,
  summaryLabel,
  formulaItems,
  formulaExampleQuestion,
  onToggleGuide,
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
    gap: 10px;
    padding: 16px 20px 20px;
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

  &__formula-card {
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

  &__formula-icon {
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
    flex-wrap: wrap;
    align-items: center;
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
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid rgba(var(--dq-theme-rgb, 46, 163, 242), 0.35);
    border-radius: $border-radius-base;
    background: #fff;
    color: var(--dq-theme-color, var(--color-primary, #{$color-primary}));
    line-height: 1;
    vertical-align: middle;
    font: inherit;

    &.is-met {
      background: rgba(var(--dq-theme-rgb, 46, 163, 242), 0.12);
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

  @include mobile {
    &__header {
      padding: 16px 20px 14px;
    }

    &__content {
      padding: 14px 16px 16px;
    }
  }
}
</style>

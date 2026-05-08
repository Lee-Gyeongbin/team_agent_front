<template>
  <div class="stress-score-grid">
    <div class="stress-score-grid-items">
      <div
        v-for="item in items"
        :key="item.name"
        class="stress-score-item"
        :class="`level-${levelClass(item.level)}`"
      >
        <p class="item-main">{{ item.name }} {{ formatValue(item.value) }}</p>
        <p class="item-level">({{ item.level }})</p>
      </div>
    </div>
    <p
      v-if="coreAreasText"
      class="stress-score-grid-footer"
    >
      {{ coreAreasText }}
    </p>
    <p
      v-if="riskSummary"
      class="stress-score-grid-footer stress-score-grid-risk-summary"
      :style="riskSummaryInlineStyle"
    >
      {{ riskSummary }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { StressScoreItem, StressLevel } from '~/types/stress'

interface Props {
  items: StressScoreItem[]
  /** 핵심 영역 안내 (예: "※ 핵심 영역: 신체인지(3.00) · 회복력(3.00)") */
  coreAreasText?: string
  /** 위험 수준 한 줄 설명 (riskColor와 함께 강조 표시) */
  riskSummary?: string
  /** 종합 위험 주색 hex (riskSummary 텍스트 색) */
  riskColor?: string
  /** 점수 표기 자릿수 (기본 2자리) */
  decimal?: number
}

const props = withDefaults(defineProps<Props>(), {
  coreAreasText: '',
  riskSummary: '',
  riskColor: '',
  decimal: 2,
})

const riskSummaryInlineStyle = computed(() => {
  const c = props.riskColor?.trim()
  if (!c) return undefined
  return { color: c }
})

const LEVEL_CLASS_MAP: Record<StressLevel, string> = {
  안정: 'stable',
  관심: 'interest',
  주의: 'warning',
  고위험: 'danger',
}

const levelClass = (level: StressLevel) => LEVEL_CLASS_MAP[level] || 'stable'

const formatValue = (value: number) => value.toFixed(props.decimal)
</script>

<style lang="scss" scoped>
.stress-score-grid {
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
  background: #fff;
}

.stress-score-grid-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.stress-score-item {
  padding: $spacing-sm $spacing-sm;
  text-align: center;
  border-right: 1px solid $color-border;
  border-bottom: 1px solid $color-border;

  &:nth-child(4n) {
    border-right: none;
  }

  &:nth-last-child(-n + 4) {
    border-bottom: none;
  }

  .item-main {
    @include typo($body-small-bold, $color-text-heading);
    margin-bottom: $spacing-xs;
  }

  .item-level {
    @include typo($body-small);
    color: $color-text-secondary;
  }

  // ===== 등급별 색상 (신호등 + 관심=하늘색) =====
  &.level-stable .item-level {
    color: $color-success;
  }

  &.level-interest .item-level {
    color: $color-info;
  }

  &.level-warning .item-level {
    color: $color-warning;
  }

  &.level-danger .item-level {
    color: $color-error;
    font-weight: 700;
  }
}

.stress-score-grid-footer {
  border-top: 1px solid $color-border;
  padding: $spacing-sm $spacing-md;
  text-align: center;
  @include typo($body-small);
  color: $color-text-secondary;
  background: #fafbfc;
}

.stress-score-grid-risk-summary {
  font-weight: 700;
  // riskColor 미전달 시에도 가독용 기본색 (inline color가 있으면 덮어씀)
  color: $color-text-heading;
}

@media (max-width: 1023px) {
  .stress-score-grid-items {
    grid-template-columns: repeat(2, 1fr);
  }

  .stress-score-item {
    &:nth-child(4n) {
      border-right: 1px solid $color-border;
    }
    &:nth-child(2n) {
      border-right: none;
    }
    &:nth-last-child(-n + 4) {
      border-bottom: 1px solid $color-border;
    }
    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }
  }
}
</style>

<template>
  <div class="ui-stat-card">
    <div class="ui-stat-card-top">
      <div
        class="ui-stat-card-icon"
        :class="`is-${color}`"
      >
        <i :class="[icon, `size-${iconSize}`]" />
      </div>
      <span class="ui-stat-card-label">{{ label }}</span>
    </div>
    <div class="ui-stat-card-bottom">
      <span class="ui-stat-card-value">
        <slot>{{ value }}</slot>
      </span>
      <span
        v-if="unit"
        class="ui-stat-card-unit"
        >{{ unit }}</span
      >
    </div>
    <span
      v-if="sub || $slots.sub"
      class="ui-stat-card-sub"
    >
      <slot name="sub">{{ sub }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  label: string
  value?: string | number
  unit?: string
  sub?: string
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  value: '',
  unit: '',
  sub: '',
  color: 'blue',
  iconSize: 24,
})
</script>

<style lang="scss" scoped>
.ui-stat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 13px 16px;
  background: #fff;
  border: 1px solid #dce4e9;
  border-radius: 16px;
  height: 138px;
}

.ui-stat-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ui-stat-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;

  &.is-blue {
    background: #dee9fb;
    color: #3c69db;
  }

  &.is-purple {
    background: #f4ebff;
    color: #8f4fdf;
  }

  &.is-green {
    background: #d4f5dd;
    color: #009f4d;
  }

  &.is-orange {
    background: #fff7ed;
    color: #f59e0b;
  }

  &.is-red {
    background: #fef2f2;
    color: #ef4444;
  }

  &.is-gray {
    background: #f4f7f9;
    color: #64748b;
  }
}

.ui-stat-card-label {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 20px;
  line-height: 1.5;
  color: #2d3139;
}

.ui-stat-card-bottom {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.ui-stat-card-value {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 27px;
  line-height: 1.5;
  color: #2d3139;
}

.ui-stat-card-unit {
  @include typo($body-large-bold);
  color: #464c53;
  margin-top: 4px;
}

.ui-stat-card-sub {
  @include typo($body-xsmall);
  color: $color-text-muted;

  :deep(strong) {
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }
}
</style>

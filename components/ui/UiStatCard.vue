<template>
  <div class="ui-stat-card">
    <div
      class="ui-stat-card-icon"
      :class="`is-${color}`"
    >
      <i
        :class="[icon, `size-${iconSize}`]"
      />
    </div>
    <div class="ui-stat-card-info">
      <span class="ui-stat-card-label">{{ label }}</span>
      <span class="ui-stat-card-value">
        <slot>{{ value }}</slot>
      </span>
      <span
        v-if="sub || $slots.sub"
        class="ui-stat-card-sub"
      >
        <slot name="sub">{{ sub }}</slot>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  label: string
  value?: string | number
  sub?: string
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray'
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  value: '',
  sub: '',
  color: 'blue',
  iconSize: 24,
})
</script>

<style lang="scss" scoped>
.ui-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
}

.ui-stat-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: $border-radius-lg;
  flex-shrink: 0;

  &.is-blue {
    background: #eef3ff;
    color: #3b82f6;
  }

  &.is-purple {
    background: #f4ebff;
    color: #8f4fdf;
  }

  &.is-green {
    background: #ecfdf5;
    color: #22c55e;
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

.ui-stat-card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ui-stat-card-label {
  @include typo($body-small);
  color: $color-text-secondary;
}

.ui-stat-card-value {
  @include typo($body-large-bold);
  color: $color-text-heading;
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

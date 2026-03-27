<template>
  <span
    class="ui-badge"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      {
        'is-icon-only': iconOnly,
      },
    ]"
  >
    <!-- 왼쪽 아이콘 -->
    <span
      v-if="$slots['icon-left']"
      class="ui-badge-icon"
    >
      <slot name="icon-left" />
    </span>
    <!-- 텍스트 -->
    <span
      v-if="$slots.default && !iconOnly"
      class="ui-badge-text"
    >
      <slot />
    </span>
    <!-- 오른쪽 아이콘 -->
    <span
      v-if="$slots['icon-right']"
      class="ui-badge-icon"
    >
      <slot name="icon-right" />
    </span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'data-line' | 'basic-chat' | 'manual-ai' | 'category' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  iconOnly?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  iconOnly: false,
})
</script>

<style lang="scss" scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 24px;
  font-size: $font-size-sm;
  white-space: nowrap;

  // ===================================
  // 사이즈
  // ===================================
  &.size-xs {
    height: 20px;
    padding: 0 6px;
    font-size: $font-size-xs;
  }

  &.size-sm {
    height: 22px;
    padding: 0 8px;
    font-size: $font-size-sm;
  }

  &.size-md {
    height: 24px;
    padding: 0 10px;
    font-size: $font-size-sm;
  }

  &.size-lg {
    height: 26px;
    padding: 0 12px;
    font-size: $font-size-base;
  }

  // ===================================
  // 아이콘 온리
  // ===================================
  &.is-icon-only {
    justify-content: center;
    padding: 0;

    &.size-xs {
      width: 20px;
    }

    &.size-sm {
      width: 22px;
    }

    &.size-md {
      width: 24px;
    }

    &.size-lg {
      width: 26px;
    }
  }

  // ===================================
  // variant
  // ===================================
  &.variant-data-line {
    background: #f0f6fe;
    color: #4589e0;
  }

  &.variant-basic-chat {
    background: #f8f4d6;
    color: #ac5e00;
  }

  &.variant-manual-ai {
    background: #f4ebff;
    color: #8f4fdf;
  }

  &.variant-category {
    background: #eef3f8;
    color: #556377;
  }

  &.variant-default {
    background: #f4f7f9;
    color: #5c6677;
  }
}

.ui-badge-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.ui-badge-text {
  display: inline-flex;
  align-items: center;
}
</style>

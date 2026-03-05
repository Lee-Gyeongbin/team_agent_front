<template>
  <button
    class="ui-button"
    :class="[
      `variant-${variant}`,
      `size-btn-${size}`,
      {
        'is-disabled': disabled,
        'is-loading': loading,
        'is-full': fullWidth,
        'is-icon-only': iconOnly,
      },
    ]"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <!-- 왼쪽 아이콘 -->
    <span
      v-if="$slots['icon-left']"
      class="ui-button-icon"
    >
      <slot name="icon-left" />
    </span>
    <!-- 텍스트 -->
    <span
      v-if="$slots.default && !iconOnly"
      class="ui-button-text"
    >
      <slot />
    </span>
    <!-- 오른쪽 아이콘 -->
    <span
      v-if="$slots['icon-right']"
      class="ui-button-icon"
    >
      <slot name="icon-right" />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'primary-dark' | 'secondary' | 'outline' | 'ghost'
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xlg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  fullWidth: false,
  iconOnly: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style lang="scss" scoped>
@use 'sass:color';
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: $border-radius-base;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all $transition-base;
  white-space: nowrap;
  letter-spacing: -0.02em;

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }

  // ===================================
  // 사이즈 (width: auto, padding으로 좌우 여백 조절)
  // ===================================
  &.size-btn-xxs {
    @include typo($body-xsmall);
    height: 24px;
    padding: 0;
  }

  &.size-btn-xs {
    @include typo($body-xsmall);
    height: $height-xs;
    padding: 0 8px;
  }

  &.size-btn-sm {
    @include typo($body-xsmall);
    height: $height-sm;
    padding: 0 10px;
  }

  &.size-btn-md {
    @include typo($body-medium);
    height: $height-md;
    padding: 0 12px;
  }

  &.size-btn-lg {
    @include typo($body-medium);
    height: $height-lg;
    padding: 0 12px;
  }

  &.size-btn-xlg {
    @include typo($body-large);
    height: $height-xlg;
    padding: 0 12px;
  }

  // ===================================
  // 아이콘 온리
  // ===================================
  &.is-icon-only {
    padding: 0;

    &.size-btn-xs {
      width: $height-xs;
    }
    &.size-btn-sm {
      width: $height-sm;
    }
    &.size-btn-md {
      width: $height-md;
    }
    &.size-btn-lg {
      width: $height-lg;
    }
    &.size-btn-xlg {
      width: $height-xlg;
    }
    &.size-btn-xxs {
      width: 24px;
    }
  }

  // ===================================
  // variant
  // ===================================
  &.variant-primary {
    background: $color-primary;
    color: #fff;

    &:hover:not(:disabled) {
      background: $color-primary-hover;
    }
  }

  &.variant-primary-dark {
    background: $color-primary-dark;
    color: #fff;

    &:hover:not(:disabled) {
      background: $color-primary-dark-hover;
    }
  }

  &.variant-secondary {
    background: $color-background;
    color: $color-text-dark;

    &:hover:not(:disabled) {
      background: color.adjust($color-background, $lightness: -4%);
    }
  }

  &.variant-outline {
    background: #fff;
    border-color: $color-border;
    color: $color-text-dark;

    &:hover:not(:disabled) {
      border-color: $color-primary;
      color: $color-primary;
    }
  }

  &.variant-ghost {
    background: transparent;
    color: $color-text-secondary;

    &:hover:not(:disabled) {
      background: $color-background;
      color: $color-text-dark;
    }
  }

  // ===================================
  // 상태
  // ===================================
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.is-loading {
    cursor: wait;
  }

  &.is-full {
    width: 100%;
  }

  // ===================================
  // 커스텀 색상 변형
  // ===================================

  // 1. 기본 흰색 배경, 호버 시 연한 회색
  &.btn-custom-white {
    background: #fff;
    border-radius: 4px;

    &:hover:not(:disabled) {
      background: #ecf0f3;
    }
  }

  // 2. 연한 회색 배경, 호버 시 더 어두운 회색
  &.btn-custom-light-gray {
    background: #ecf0f3;
    border-radius: 4px;

    &:hover:not(:disabled) {
      background: #dce4e9;
    }

    .icon {
      background-color: #6f7a93;
    }
  }

  // 3. 흰색 배경, 호버 시 중간 회색
  &.btn-copy-white {
    background: #fff;
    border-radius: 4px;

    &:hover:not(:disabled) {
      background: #dce4e9;
    }
  }

  // 4. 어두운 배경, 호버 시 흰색
  &.btn-copy-dark {
    background: #4d5462;
    border-radius: 4px;
    color: #fff;

    &:hover:not(:disabled) {
      background: #fff;
      color: #4d5462;
    }

    .icon {
      background-color: #fff;
    }

    &:hover:not(:disabled) .icon {
      background-color: #4d5462;
    }
  }

  // 5. 중간 회색 배경, 호버 시 더 어두운 회색
  &.btn-custom-gray {
    background: #828fa9;
    border-radius: 4px;
    color: #fff;

    &:hover:not(:disabled) {
      background: #6f7a93;
    }

    .icon {
      background-color: #fff;
    }
  }
}

.ui-button-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
</style>

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
  variant?: 'primary' | 'primary-dark' | 'primary-line' | 'line-secondary' | 'dark' | 'secondary' | 'outline' | 'ghost'
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
  gap: 4px;
  border: 1px solid transparent;
  border-radius: $border-radius-base;
  font-weight: $font-weight-semibold;
  cursor: pointer;
  transition: all $transition-base;
  white-space: nowrap;
  letter-spacing: -0.02em;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  // ===================================
  // 사이즈 (width: auto, padding으로 좌우 여백 조절)
  // ===================================
  &.size-btn-xxs {
    @include typo($body-xsmall);
    height: 24px; // 24px
    padding: 0;
  }

  &.size-btn-xs {
    @include typo($body-xsmall);
    height: $height-xs; // 26px
    min-width: 50px;
    padding: 0 8px;
  }

  &.size-btn-sm {
    @include typo($body-medium-bold);
    height: $height-sm; // 28px
    padding: 0 8px;
  }

  &.size-btn-md {
    @include typo($body-medium);
    height: $height-md; // 30px
    min-width: 68px;
    padding: 0 10px;
    padding-right: 7px;
  }

  &.size-btn-lg {
    @include typo($body-medium);
    height: $height-xlg; // 36px
    padding: 0 10px;
    padding-right: 7px;
  }

  &.size-btn-xlg {
    @include typo($body-large);
    height: $height-xlg; // 36px
    padding: 0 10px;
    padding-right: 7px;
  }

  // ===================================
  // 아이콘 온리
  // ===================================
  &.is-icon-only {
    padding: 0;
    min-width: auto;

    &.size-btn-xs {
      width: $height-xs; // 26px
    }
    &.size-btn-sm {
      width: $height-sm; // 28px
    }
    &.size-btn-md {
      width: $height-md; // 30px
    }
    &.size-btn-lg {
      width: $height-lg; // 32px
    }
    &.size-btn-xlg {
      width: $height-xlg; // 36px
    }
    &.size-btn-xxs {
      width: 24px; // 24px
    }
  }

  // ===================================
  // variant
  // ===================================
  &.variant-primary {
    background: var(--color-primary); // #3c69db
    color: #fff; // #fff

    &:hover:not(:disabled) {
      background: var(--color-primary-hover); // #1d4ed8
    }
  }

  &.variant-primary-dark {
    background: var(--color-primary-dark); // #2b43a2
    color: #fff; // #fff

    &:hover:not(:disabled) {
      background: var(--color-primary-dark-hover); // #1d3589
    }
  }

  &.variant-primary-line {
    background: #fff;
    border-color: var(--color-primary);
    color: var(--color-primary);
    @include typo($body-medium-bold);

    &:hover:not(:disabled) {
      background: $color-background;
    }
  }

  &.variant-secondary {
    background: #6f7a93;
    color: #fff;

    &:hover:not(:disabled) {
      background: color.adjust(#6f7a93, $lightness: -4%); // #f4f7f9에서 -4% 어둡게
    }
  }

  &.variant-outline {
    background: #fff; // #fff
    border-color: #dce4e9; // #dce4e9
    color: #2d3139; // #2d3139

    &:hover:not(:disabled) {
      border-color: var(--color-primary); // #3c69db
      color: var(--color-primary); // #3c69db
    }
  }

  &.variant-line-secondary {
    background: #fff;
    border-color: #64748b;
    color: #64748b;
    @include typo($body-medium-bold);

    &:hover:not(:disabled) {
      background: #f4f7f9;
    }
  }

  &.variant-dark {
    background: #58616a; // #58616a
    color: #fff; // #fff

    &:hover:not(:disabled) {
      background: #4a5259; // #4a5259
    }
  }

  &.variant-ghost {
    background: transparent; // transparent
    color: #64748b; // #64748b
    min-width: auto;

    &:hover:not(:disabled) {
      background: #f4f7f9; // #f4f7f9
      color: #2d3139; // #2d3139
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

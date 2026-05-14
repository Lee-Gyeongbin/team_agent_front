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
    :style="badgeStyle"
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
type HexColor = `#${string}`

interface Props {
  variant?: 'data-line' | 'basic-chat' | 'manual-ai' | 'category' | 'default' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  iconOnly?: boolean
  /** 지정 시 variant 색상 대신 이 컬러 기반으로 표시 */
  colorHex?: HexColor | string
  /** 배경 투명도 (0~1). 기본 0.12 */
  bgAlpha?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  iconOnly: false,
  colorHex: '',
  bgAlpha: 0.12,
})

const normalizeHex = (input: string): string => {
  const v = (input ?? '').trim()
  if (!v) return ''
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const r = v[1]
    const g = v[2]
    const b = v[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return ''
}

const hexToRgba = (hex: string, alpha: number) => {
  const h = normalizeHex(hex)
  if (!h) return ''
  const r = Number.parseInt(h.slice(1, 3), 16)
  const g = Number.parseInt(h.slice(3, 5), 16)
  const b = Number.parseInt(h.slice(5, 7), 16)
  const a = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 0.12
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const badgeStyle = computed((): Record<string, string> => {
  const hex = normalizeHex(props.colorHex || '')
  if (!hex) return {}
  const bg = hexToRgba(hex, props.bgAlpha)
  return {
    color: hex,
    backgroundColor: bg || '',
  }
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

  // 완료·성공 (AI 생성 완료 등)
  &.variant-success {
    background: #e6f7f0;
    color: #0d8a5b;
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

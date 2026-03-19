<template>
  <span
    class="ui-status-badge"
    :class="[`status-${status}`, `size-${size}`]"
  >
    <slot>{{ labelText }}</slot>
  </span>
</template>

<script setup lang="ts">
interface Props {
  status?: 'active' | 'inactive' | 'draft' | 'pending' | 'error' | 'success'
  label?: string
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  status: 'active',
  label: '',
  size: 'sm',
})

// 기본 라벨 (label prop 미지정 시 status에 따라 자동)
const defaultLabels: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  draft: '초안',
  pending: '대기',
  error: '오류',
  success: '성공',
}

const labelText = computed(() => props.label || defaultLabels[props.status] || props.status)
</script>

<style lang="scss" scoped>
.ui-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: $border-radius-full;
  font-weight: $font-weight-medium;
  white-space: nowrap;

  // ===== 사이즈 =====
  &.size-sm {
    height: 22px;
    padding: 0 8px;
    font-size: $font-size-xs;
  }

  &.size-md {
    height: 26px;
    padding: 0 10px;
    font-size: $font-size-sm;
  }

  // ===== status =====
  &.status-active {
    background: #ecfdf5;
    color: #16a34a;
  }

  &.status-inactive {
    background: #f4f7f9;
    color: #64748b;
  }

  &.status-draft {
    background: #fffbeb;
    color: #d97706;
  }

  &.status-pending {
    background: #f0f6fe;
    color: #2563eb;
  }

  &.status-error {
    background: #fef2f2;
    color: #dc2626;
  }

  &.status-success {
    background: #ecfdf5;
    color: #16a34a;
  }
}
</style>

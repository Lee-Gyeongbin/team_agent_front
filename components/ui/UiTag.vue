<template>
  <span
    class="ui-tag"
    :class="[`variant-${variant}`, `size-${size}`]"
  >
    <slot>{{ label }}</slot>
    <button
      v-if="closable"
      class="ui-tag-close"
      type="button"
      @click.stop="$emit('close')"
    >
      <i class="icon-close size-12" />
    </button>
  </span>
</template>

<script setup lang="ts">
interface Props {
  label?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  closable?: boolean
}

withDefaults(defineProps<Props>(), {
  label: '',
  variant: 'default',
  size: 'sm',
  closable: false,
})

defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
.ui-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: $border-radius-sm;
  white-space: nowrap;
  font-weight: $font-weight-medium;

  // ===== 사이즈 =====
  &.size-sm {
    height: 24px;
    padding: 0 8px;
    font-size: $font-size-xs;
  }

  &.size-md {
    height: 28px;
    padding: 0 10px;
    font-size: $font-size-sm;
  }

  // ===== variant =====
  &.variant-default {
    background: #f4f7f9;
    color: #5c6677;
  }

  &.variant-primary {
    background: #eef3ff;
    color: var(--color-primary);
  }

  &.variant-success {
    background: #ecfdf5;
    color: #16a34a;
  }

  &.variant-warning {
    background: #fffbeb;
    color: #d97706;
  }

  &.variant-danger {
    background: #fef2f2;
    color: #dc2626;
  }

  &.variant-info {
    background: #f0f6fe;
    color: #2563eb;
  }
}

.ui-tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity $transition-fast;

  &:hover {
    opacity: 1;
  }
}
</style>

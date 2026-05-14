<template>
  <label
    class="ui-checkbox"
    :class="{ 'is-checked': modelValue, 'is-disabled': disabled }"
  >
    <input
      type="checkbox"
      class="ui-checkbox-input"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', !modelValue)"
    />
    <span class="ui-checkbox-box">
      <svg
        v-if="modelValue"
        class="ui-checkbox-icon"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span
      v-if="label || $slots.default"
      class="ui-checkbox-label"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  label: '',
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style lang="scss" scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-checkbox-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.ui-checkbox-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1.5px solid #c6d2db;
  border-radius: 4px;
  background: #fff;
  flex-shrink: 0;
  transition: all $transition-fast;
  color: #fff;

  .is-checked & {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
}

.ui-checkbox-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-normal;
  color: $color-text-primary;
  line-height: 1.5;
}
</style>

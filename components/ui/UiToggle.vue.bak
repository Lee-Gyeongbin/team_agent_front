<template>
  <button
    class="ui-toggle"
    :class="{ 'is-active': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="ui-toggle-thumb" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style lang="scss" scoped>
.ui-toggle {
  position: relative;
  width: 32px;
  height: 20px;
  border: none;
  border-radius: 9999px;
  background: $color-border;
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &.is-active {
    background: var(--color-primary);
  }

  .ui-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background: #fff;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
  }

  &.is-active .ui-toggle-thumb {
    transform: translateX(12px);
  }
}
</style>

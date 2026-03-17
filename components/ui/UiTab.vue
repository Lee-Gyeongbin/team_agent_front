<template>
  <div class="ui-tab">
    <div class="ui-tab-inner">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="ui-tab-item"
        :class="{ 'is-active': modelValue === tab.value }"
        @click="$emit('update:modelValue', tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  label: string
  value: string
}

interface Props {
  modelValue: string
  tabs: TabItem[]
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style lang="scss" scoped>
.ui-tab {
  border-bottom: 1px solid $color-border;
}

.ui-tab-inner {
  display: flex;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}

.ui-tab-item {
  position: relative;
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  @include typo($body-large);
  color: $color-text-secondary;
  transition: color $transition-fast;

  &:hover {
    color: $color-text-dark;
  }

  &.is-active {
    color: $color-text-dark;
    font-weight: $font-weight-bold;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--color-primary);
    }
  }
}
</style>

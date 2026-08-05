<template>
  <div class="slide-flow-bar">
    <div
      v-for="(step, idx) in content?.steps"
      :key="idx"
      :class="['slide-flow-bar-step', { 'is-active': step.active }]"
    >
      {{ step.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StepFlowBarContent } from '~/types/proposal'
defineProps<{ content: StepFlowBarContent }>()
</script>

<style lang="scss" scoped>
.slide-flow-bar {
  display: flex;
  border-top: 1px solid #e5e7eb;
  padding-top: 8px;
  gap: 4px;
}

.slide-flow-bar-step {
  flex: 1;
  text-align: center;
  font-size: 13px;
  padding: 6px 4px;
  border-radius: 6px;
  color: #9ca3af;

  &.is-active {
    background: var(--slide-base-color, #5b4fe9);
    color: #fff;
    font-weight: 600;
  }
}
</style>

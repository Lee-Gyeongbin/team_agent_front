<template>
  <div class="slide-process-flow">
    <template
      v-for="(step, idx) in content?.steps"
      :key="idx"
    >
      <div class="slide-flow-step">
        <div class="slide-flow-num">{{ idx + 1 }}</div>
        <div class="slide-flow-title">{{ step.title }}</div>
        <div class="slide-flow-desc">{{ step.desc }}</div>
      </div>
      <i
        v-if="idx < (content?.steps?.length ?? 0) - 1"
        class="icon-arrow-right slide-flow-arrow"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ProcessFlowContent } from '~/types/proposal'
defineProps<{ content: ProcessFlowContent }>()
</script>

<style lang="scss" scoped>
.slide-process-flow {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.slide-flow-step {
  flex: 1;
  min-width: 100px;
  text-align: center;
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
  border-radius: 8px;
  background: #f9fafb;
}

.slide-flow-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--slide-base-color, #5b4fe9);
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 6px;
  flex-shrink: 0;
}

.slide-flow-title {
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.slide-flow-desc {
  font-size: 13px;
  color: #6b7280;
  flex: 1;
}

.slide-flow-arrow {
  align-self: center;
  flex-shrink: 0;
  color: #d1d5db;
}
</style>

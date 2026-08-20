<template>
  <div :class="['slide-callout', `is-${content?.tone ?? 'info'}`]">
    <i
      :class="content?.tone === 'warning' ? 'icon-alert-triangle' : 'icon-info'"
      class="size-14"
    />
    <span>{{ content?.text }}</span>
  </div>
</template>

<script setup lang="ts">
import type { CalloutBoxContent } from '~/types/proposal'
defineProps<{ content: CalloutBoxContent }>()
</script>

<style lang="scss" scoped>
.slide-callout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  flex-shrink: 0;

  &.is-info {
    background: #eff6ff;
    color: #1d4ed8;
  }

  &.is-warning {
    background: #fff7ed;
    color: #c2410c;
  }
}
</style>

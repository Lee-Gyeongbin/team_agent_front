<template>
  <div class="slide-chip-group">
    <span
      v-for="(chip, idx) in content?.chips"
      :key="idx"
      class="slide-chip"
      >{{ chip }}</span
    >
  </div>
</template>

<script setup lang="ts">
import type { IconChipGroupContent } from '~/types/proposal'
defineProps<{ content: IconChipGroupContent }>()
</script>

<style lang="scss" scoped>
.slide-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.slide-chip {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--slide-base-color, #5b4fe9);
  color: #fff;
}
</style>

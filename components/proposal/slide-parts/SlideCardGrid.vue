<template>
  <div class="slide-card-grid">
    <div
      v-for="(card, idx) in content?.cards"
      :key="idx"
      class="slide-card"
    >
      <div class="slide-card-title">{{ card.title }}</div>
      <div class="slide-card-desc">{{ card.desc }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardGridContent } from '~/types/proposal'
defineProps<{ content: CardGridContent }>()
</script>

<style lang="scss" scoped>
.slide-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  grid-auto-rows: 1fr;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: stretch;
}

.slide-card {
  border: 1px solid var(--slide-accent-color, #e5e7eb);
  border-radius: 8px;
  padding: 12px;
}

.slide-card-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
}

.slide-card-desc {
  font-size: 14px;
  color: #6b7280;
}
</style>

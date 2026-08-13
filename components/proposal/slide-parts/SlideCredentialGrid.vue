<template>
  <div class="slide-credential-grid">
    <div
      v-for="(item, idx) in content?.items"
      :key="idx"
      class="slide-credential-item"
    >
      <i class="icon-award size-16 slide-credential-icon" />
      <div>
        <div class="slide-credential-title">{{ item.title }}</div>
        <div class="slide-credential-desc">{{ item.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CredentialGridContent } from '~/types/proposal'
defineProps<{ content: CredentialGridContent }>()
</script>

<style lang="scss" scoped>
.slide-credential-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.slide-credential-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 8px;
  background: #f9fafb;
}

.slide-credential-icon {
  color: var(--slide-accent-color, #e08a2c);
  flex-shrink: 0;
}

.slide-credential-title {
  font-weight: 600;
  font-size: 14px;
}

.slide-credential-desc {
  font-size: 13px;
  color: #6b7280;
}
</style>

<template>
  <div class="ui-loading">
    <div class="ui-loading-spinner" />
    <p
      v-if="text"
      class="ui-loading-text"
    >
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 로딩 텍스트 */
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '불러오는 중...',
})
</script>

<style lang="scss" scoped>
.ui-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  min-height: 200px;
  width: 100%;
}

.ui-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #ecf0f3;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: ui-spin 0.8s linear infinite;
}

.ui-loading-text {
  @include typo($body-small);
  color: $color-text-muted;
}

@keyframes ui-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

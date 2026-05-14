<template>
  <div
    class="ui-loading"
    :class="{ 'is-overlay': overlay }"
  >
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
  /** 오버레이(dim) 모드 — 전체 화면 fixed 처리 */
  overlay?: boolean
}

withDefaults(defineProps<Props>(), {
  text: '불러오는 중...',
  overlay: false,
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

  // 오버레이 모드 — 전체 화면 dim
  &.is-overlay {
    position: fixed;
    inset: 0;
    min-height: 0;
    flex: none;
    z-index: $z-toast;
    background: rgba(0, 0, 0, 0.3);

    .ui-loading-spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: var(--color-primary);
    }

    .ui-loading-text {
      @include typo($body-medium-bold);
      color: #fff;
    }
  }
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

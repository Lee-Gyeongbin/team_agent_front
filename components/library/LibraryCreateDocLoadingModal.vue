<template>
  <UiModal
    :is-open="isOpen"
    title="문서 만들기"
    max-width="720px"
    custom-class="doc-dataset-create-modal library-create-doc-modal library-create-doc-loading-modal"
    show-fullscreen
    :close-on-overlay-click="false"
    @close="emit('close')"
  >
    <div class="doc-dataset-create-form com-setting-form library-create-doc-loading-form">
      <p class="doc-dataset-subsection-desc library-create-doc-lead">지식창고 내용을 기반으로 문서를 자동 생성합니다</p>

      <div class="library-create-doc-loading-center">
        <div
          class="library-create-doc-loading-ring"
          aria-hidden="true"
        >
          <span class="library-create-doc-loading-ring__track" />
          <span class="library-create-doc-loading-ring__arc" />
          <i class="icon icon-sparkle size-24 library-create-doc-loading-ring__icon" />
        </div>
        <p class="library-create-doc-loading-title">AI가 문서를 작성 중입니다</p>
        <p class="library-create-doc-loading-desc">보고서 양식에 맞게 내용을 분석하고 있습니다</p>
      </div>

      <div class="library-create-doc-loading-callout">
        <p class="library-create-doc-loading-callout__text">
          <strong class="library-create-doc-loading-callout__kbd">JSON</strong>
          형식으로 각 항목을 구성하여 표 형태로 자동 변환합니다
        </p>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
.library-create-doc-loading-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  padding-bottom: $spacing-sm;
}

.library-create-doc-loading-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xl 0;
  min-height: 220px;
}

.library-create-doc-loading-ring {
  position: relative;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
}

.library-create-doc-loading-ring__track {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(var(--color-primary-rgb, 60, 105, 219), 0.08);
}

.library-create-doc-loading-ring__arc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 4px solid transparent;
  border-top-color: var(--color-primary);
  border-right-color: rgba(var(--color-primary-rgb, 60, 105, 219), 0.35);
  animation: library-doc-spin 0.9s linear infinite;
}

.library-create-doc-loading-ring__icon {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--color-primary);
}

@keyframes library-doc-spin {
  to {
    transform: rotate(360deg);
  }
}

.library-create-doc-loading-title {
  margin: 0;
  @include typo($body-medium-bold);
  color: $color-text-heading;
  text-align: center;
}

.library-create-doc-loading-desc {
  margin: 0;
  @include typo($body-small);
  color: $color-text-secondary;
  text-align: center;
}

.library-create-doc-loading-callout {
  padding: $spacing-md $spacing-lg;
  border-radius: $border-radius-lg;
  background: #f4f6f8;
}

.library-create-doc-loading-callout__text {
  margin: 0;
  @include typo($body-small);
  color: $color-text-primary;
  line-height: 1.5;
}

.library-create-doc-loading-callout__kbd {
  font-weight: $font-weight-bold;
  color: var(--color-primary);
}
</style>

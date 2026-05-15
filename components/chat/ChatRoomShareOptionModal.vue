<template>
  <div class="share-option-modal">
    <div class="share-option-body">
      <p class="share-option-desc">이 대화에는 첨부파일이 포함되어 있습니다.<br />공유 방식을 선택해 주세요.</p>

      <div class="share-option-cards">
        <!-- 전체 공유 -->
        <button
          class="share-option-card"
          :class="{ 'is-selected': selected === 'Y' }"
          type="button"
          @click="selected = 'Y'"
        >
          <div class="share-option-card-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14 2V8H20"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M12 13V17"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M10 15H14"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="share-option-card-content">
            <span class="share-option-card-title">전체 공유</span>
            <span class="share-option-card-desc">텍스트와 첨부파일을 모두 포함합니다</span>
          </div>
          <div class="share-option-card-radio">
            <span class="radio-dot" />
          </div>
        </button>

        <!-- 텍스트만 공유 -->
        <button
          class="share-option-card"
          :class="{ 'is-selected': selected === 'N' }"
          type="button"
          @click="selected = 'N'"
        >
          <div class="share-option-card-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M4 10H20"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M4 14H14"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
              <path
                d="M4 18H10"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="share-option-card-content">
            <span class="share-option-card-title">텍스트만 공유</span>
            <span class="share-option-card-desc">텍스트 내용만 공유합니다</span>
          </div>
          <div class="share-option-card-radio">
            <span class="radio-dot" />
          </div>
        </button>
      </div>
    </div>

    <div class="modal-dialog-footer">
      <UiButton
        class="btn-modal-dialog"
        variant="outline"
        size="xlg"
        @click="emit('cancel')"
      >
        취소
      </UiButton>
      <UiButton
        class="btn-modal-dialog"
        variant="primary"
        size="xlg"
        @click="onConfirm"
      >
        공유 링크 생성
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<{
  confirm: [includeAttachment: 'Y' | 'N']
  cancel: []
}>()

const selected = ref<'Y' | 'N'>('Y')

// 모달이 열릴 때마다 기본값으로 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) selected.value = 'Y'
  },
)

const onConfirm = () => {
  emit('confirm', selected.value)
}
</script>

<style lang="scss" scoped>
.share-option-modal {
  padding: $spacing-md;
  width: 100%;
}

.share-option-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.share-option-desc {
  font-size: $font-size-base;
  color: $color-text-secondary;
  line-height: $line-height-base;
  margin: 0;
}

.share-option-cards {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.share-option-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border: 1.5px solid $color-border;
  border-radius: $border-radius-lg;
  background: #fff;
  cursor: pointer;
  transition:
    border-color $transition-base,
    background $transition-base;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: var(--color-primary);
    background: $color-surface;
  }

  &.is-selected {
    border-color: var(--color-primary);
    background: #eff6ff;

    .share-option-card-icon {
      color: var(--color-primary);
    }

    .share-option-card-title {
      color: var(--color-primary);
      font-weight: $font-weight-semibold;
    }

    .radio-dot {
      background: var(--color-primary);

      &::before {
        opacity: 1;
      }
    }
  }
}

.share-option-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $border-radius-base;
  background: $color-background;
  color: $color-text-secondary;
  flex-shrink: 0;
  transition: color $transition-base;
}

.share-option-card-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.share-option-card-title {
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
  color: $color-text-heading;
  transition: color $transition-base;
}

.share-option-card-desc {
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: $line-height-base;
}

.share-option-card-radio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: $border-radius-full;
  border: 1.5px solid $color-border;
  background: #fff;
  transition:
    background $transition-base,
    border-color $transition-base;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: $border-radius-full;
    background: #fff;
    opacity: 0;
    transition: opacity $transition-base;
  }
}

.modal-dialog-footer {
  border-top: none;
}
</style>

<template>
  <div class="chat-message-actions">
    <button
      class="btn btn-action"
      title="복사"
      @click="emit('on-copy')"
    >
      <i class="icon-copy size-16"></i>
    </button>
    <button
      class="btn btn-action"
      :class="{ 'is-active': isLiked }"
      title="좋아요"
      @click="emit('on-like')"
    >
      <i class="icon-thumbs-up size-16"></i>
    </button>
    <button
      class="btn btn-action"
      :class="{ 'is-active': isDisliked }"
      title="싫어요"
      @click="emit('on-dislike')"
    >
      <i class="icon-thumbs-down size-16"></i>
    </button>
    <button
      class="btn btn-action"
      title="재생성"
      @click="emit('on-regenerate')"
    >
      <i class="icon-refresh size-16"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLiked?: boolean
  isDisliked?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'on-copy': []
  'on-like': []
  'on-dislike': []
  'on-regenerate': []
}>()
</script>

<style lang="scss" scoped>
.chat-message-actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-top: $spacing-sm;

  .btn-action {
    width: 28px;
    height: 28px;
    border-radius: $border-radius-sm;
    color: $color-text-disabled;
    transition: all $transition-fast;

    &:hover {
      color: $color-text-primary;
      background: $color-background;
    }

    &.is-active {
      color: $color-primary;
    }
  }
}
</style>

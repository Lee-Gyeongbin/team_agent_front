<template>
  <div class="chat-message-actions">
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      title="복사"
      @click="emit('on-copy')"
    >
      <template #icon-left>
        <i class="icon-copy size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': isLiked }"
      title="좋아요"
      @click="emit('on-like')"
    >
      <template #icon-left>
        <i class="icon-thumbs-up size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': isDisliked }"
      title="싫어요"
      @click="emit('on-dislike')"
    >
      <template #icon-left>
        <i class="icon-thumbs-down size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      title="재생성"
      @click="emit('on-regenerate')"
    >
      <template #icon-left>
        <i class="icon-refresh size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      :class="{ 'is-active': isFavorited }"
      title="즐겨찾기"
      @click="emit('on-favorite')"
    >
      <template #icon-left>
        <i class="icon-heart-line size-20" />
      </template>
    </UiButton>
    <UiButton
      variant="ghost"
      size="xs"
      icon-only
      title="더보기"
      @click="emit('on-more')"
    >
      <template #icon-left>
        <i class="icon-more-line size-20" />
      </template>
    </UiButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLiked?: boolean
  isDisliked?: boolean
  isFavorited?: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'on-copy': []
  'on-like': []
  'on-dislike': []
  'on-regenerate': []
  'on-favorite': []
  'on-more': []
}>()
</script>

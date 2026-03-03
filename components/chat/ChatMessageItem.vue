<template>
  <div
    class="chat-message-item"
    :class="`role-${message.role}`"
  >
    <!-- assistant 메시지 -->
    <template v-if="message.role === 'assistant'">
      <div class="avatar">
        <i class="icon-bot size-20"></i>
      </div>
      <div class="message-body">
        <div
          class="message-content"
          v-html="message.content"
        ></div>
        <ChatMessageActions
          :is-liked="message.isLiked"
          :is-disliked="message.isDisliked"
          @on-copy="emit('on-copy', message.id)"
          @on-like="emit('on-like', message.id)"
          @on-dislike="emit('on-dislike', message.id)"
          @on-regenerate="emit('on-regenerate', message.id)"
        />
      </div>
    </template>

    <!-- user 메시지 -->
    <template v-else-if="message.role === 'user'">
      <div class="message-body">
        <div class="message-content">{{ message.content }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

interface Props {
  message: ChatMessage
}

defineProps<Props>()

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
}>()
</script>

<style lang="scss" scoped>
.chat-message-item {
  display: flex;
  gap: $spacing-sm;
  padding: $spacing-md 0;

  // assistant — 좌측 정렬
  &.role-assistant {
    justify-content: flex-start;

    .avatar {
      @include flex-center;
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: $border-radius-full;
      background: $color-background;
      color: $color-primary;
    }

    .message-content {
      line-height: $line-height-relaxed;
      color: $color-text-primary;
      font-size: $font-size-sm;
    }
  }

  // user — 우측 정렬
  &.role-user {
    justify-content: flex-end;

    .message-body {
      max-width: 70%;
    }

    .message-content {
      padding: $spacing-sm $spacing-md;
      border-radius: $border-radius-lg;
      background: $color-chat-user-bg;
      color: $color-text-primary;
      font-size: $font-size-sm;
      line-height: $line-height-base;
      word-break: break-word;
    }
  }
}
</style>

<template>
  <div
    class="chat-message-item"
    :class="`role-${message.role}`"
  >
    <!-- assistant 메시지 -->
    <template v-if="message.role === 'assistant'">
      <div
        class="avatar"
        :class="{ 'is-streaming': message.isStreaming }"
      >
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <div
          class="message-content"
          v-html="message.content"
        ></div>
        <!-- 스트리밍 중이면 액션 버튼 숨김 -->
        <ChatMessageActions
          v-if="!message.isStreaming"
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
$chat-text-color: #2D3139;

.chat-message-item {
  display: flex;
  gap: 16px;
  padding: 10px 0;

  // assistant — 좌측 정렬
  &.role-assistant {
    justify-content: flex-start;
    padding: 12px 16px;
    background: #fff;
    border-radius: 10px;

    .avatar {
      @include flex-center;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      color: $color-primary;

      // 스트리밍 중 바운스 애니메이션
      &.is-streaming {
        animation: avatar-bounce 1s ease-in-out infinite;
      }
    }

    .message-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-content {
      line-height: 1.5em;
      color: $chat-text-color;
      font-size: $font-size-base;

      // v-html 내부 요소 간격 (피그마 gap: 16px)
      :deep(p + p),
      :deep(p + ol),
      :deep(ol + p) {
        margin-top: 16px;
      }

      :deep(ol) {
        padding-left: 1.2em;
      }

      :deep(li) {
        line-height: 1.5em;
      }

      :deep(strong) {
        font-weight: $font-weight-medium;
      }
    }
  }

  // user — 우측 정렬
  &.role-user {
    justify-content: flex-end;

    .message-content {
      padding: 12px 16px;
      border-radius: 50px;
      background: #ECF0F3;
      color: $chat-text-color;
      font-size: $font-size-base;
      line-height: 1.5em;
      word-break: break-word;
    }
  }
}

@keyframes avatar-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
</style>

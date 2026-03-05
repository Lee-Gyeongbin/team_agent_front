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
        <!-- 액션 + 패널 버튼 (한 줄) -->
        <div
          v-if="!message.isStreaming"
          class="message-footer"
        >
          <ChatMessageActions
            :is-liked="message.isLiked"
            :is-disliked="message.isDisliked"
            @on-copy="emit('on-copy', message.id)"
            @on-like="emit('on-like', message.id)"
            @on-dislike="emit('on-dislike', message.id)"
            @on-regenerate="emit('on-regenerate', message.id)"
          />
          <div class="message-panel-buttons">
            <UiButton
              size="xlg"
              variant="primary-dark"
              @click="emit('on-view-source', message.id)"
            >
              원문보기
              <template #icon-right>
                <i class="icon-arrow-right size-20"></i>
              </template>
            </UiButton>
            <UiButton
              size="xlg"
              variant="primary-dark"
              @click="emit('on-view-visualization', message.id)"
            >
              시각화 보기
              <template #icon-right>
                <i class="icon-arrow-right size-20"></i>
              </template>
            </UiButton>
          </div>
        </div>
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
  'on-view-source': [id: string]
  'on-view-visualization': [id: string]
}>()
</script>

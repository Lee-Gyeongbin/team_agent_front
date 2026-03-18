<template>
  <div
    class="chat-message-item"
    :class="message.type === 'answer' ? 'role-assistant' : 'role-user'"
  >
    <!-- assistant 메시지 -->
    <template v-if="message.type === 'answer'">
      <div
        class="avatar"
        :class="{ 'is-streaming': message.isStreaming }"
      >
        <i class="icon-bot size-24"></i>
      </div>
      <div class="message-body">
        <div
          v-if="message.isStreaming && !message.rContent"
          class="message-loading"
        >
          <span class="typing-dot" /><span class="typing-dot" /><span class="typing-dot" />
        </div>
        <div
          v-else
          class="message-content"
          v-html="message.rContent"
        ></div>
        <!-- 액션 + 패널 버튼 (한 줄) -->
        <div
          v-if="!message.isStreaming"
          class="message-footer"
        >
          <ChatMessageActions
            :is-liked="message.isLiked"
            :is-disliked="message.isDisliked"
            @on-copy="emit('on-copy', message.logId)"
            @on-like="emit('on-like', message.logId)"
            @on-dislike="emit('on-dislike', message.logId)"
            @on-regenerate="emit('on-regenerate', message.logId)"
          />
          <div
            v-if="message.hasSource || message.hasVisualization"
            class="message-panel-buttons"
          >
            <UiButton
              v-show="message.hasSource"
              variant="primary-dark"
              @click="emit('on-view-source', message.logId)"
            >
              원본보기
              <template #icon-right>
                <i class="icon-arrow-right size-20"></i>
              </template>
            </UiButton>
            <UiButton
              v-show="message.hasVisualization"
              variant="primary-dark"
              @click="emit('on-view-visualization', message.logId)"
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
    <template v-else-if="message.type === 'question'">
      <div class="message-body">
        <div class="message-content">{{ message.qContent }}</div>
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

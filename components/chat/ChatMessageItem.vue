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
          <!-- 라이브러리 카테고리: Actions는 value만 알 수 있어 logId는 여기서 묶어 상위로 전달 -->
          <ChatMessageActions
            :chat-log-reaction="message.chatLogReaction"
            :knowledge-list="knowledgeList"
            :is-share="isShare"
            @on-copy="emit('on-copy', message.logId)"
            @on-like="emit('on-like', message.logId)"
            @on-dislike="emit('on-dislike', message.logId)"
            @on-regenerate="emit('on-regenerate', message.logId)"
            @on-select-category="onSelectCategoryFromActions"
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
import type { ChatMessage, KnowledgeItem } from '~/types/chat'

interface Props {
  message: ChatMessage
  knowledgeList?: KnowledgeItem[]
  /** 공유 페이지 등: 액션 영역은 복사·카테고리만 */
  isShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isShare: false,
})

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
  /** [답변 logId, categoryId, categoryNm] — Actions는 value만 알 수 있어 여기서 knowledgeList로 이름 조회 */
  'on-select-category': [id: string, categoryValue: string, categoryNm: string]
  'on-view-source': [id: string]
  'on-view-visualization': [id: string]
}>()

/** 카테고리 id만 전달되므로 표시명은 knowledgeList에서 매칭 */
const onSelectCategoryFromActions = (categoryId: string) => {
  const categoryNm = props.knowledgeList?.find((k) => k.categoryId === categoryId)?.categoryNm ?? ''
  emit('on-select-category', props.message.logId, categoryId, categoryNm)
}
</script>

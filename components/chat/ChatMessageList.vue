<template>
  <div class="chat-message-list-wrap">
    <div
      ref="listRef"
      class="chat-message-list"
      @scroll="onScroll"
    >
      <div class="chat-message-list-inner">
        <ChatMessageItem
          v-for="msg in messages"
          :key="`${msg.logId}-${msg.type}`"
          :data-log-id="msg.logId"
          :message="msg"
          :knowledge-list="knowledgeList"
          :is-share="isShare"
          @on-copy="emit('on-copy', $event)"
          @on-like="emit('on-like', $event)"
          @on-dislike="emit('on-dislike', $event)"
          @on-regenerate="emit('on-regenerate', $event)"
          @on-view-source="emit('on-view-source', $event)"
          @on-view-visualization="emit('on-view-visualization', $event)"
          @on-submit-lunch-card="onSubmitLunchCard"
          @on-lunch-card-close="emit('on-lunch-card-close', $event)"
          @on-select-category="
            (logId: string, categoryValue: string, categoryNm: string) =>
              emit('on-select-category', logId, categoryValue, categoryNm)
          "
          @on-survey-submit="emit('on-survey-submit', $event)"
          @on-survey-close="emit('on-survey-close', $event)"
        />
      </div>
    </div>
    <!-- 맨 아래로 이동 버튼 -->
    <button
      v-if="isScrolledUp"
      class="btn-scroll-bottom"
      title="마지막 메시지로 이동"
      @click="scrollToBottom"
    >
      <i class="icon-arrow-down size-16"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, KnowledgeItem, LunchAgentFormPayload } from '~/types/chat'

interface Props {
  messages: ChatMessage[]
  knowledgeList?: KnowledgeItem[]
  /** 공유 보기 페이지 등 */
  isShare?: boolean
}

withDefaults(defineProps<Props>(), {
  isShare: false,
  knowledgeList: undefined,
})

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
  /** (logId, categoryId, categoryNm) — 라이브러리 저장 시 pages/chat 등에서 @on-select-category 로 수신 */
  'on-select-category': [logId: string, categoryValue: string, categoryNm: string]
  'on-view-source': [id: string]
  'on-view-visualization': [id: string]
  'on-survey-submit': [logId: string]
  'on-survey-close': [logId: string]
  'on-lunch-card-submit': [logId: string, payload: LunchAgentFormPayload]
  'on-lunch-card-close': [logId: string]
}>()

const onSubmitLunchCard = (logId: string, payload: LunchAgentFormPayload) => {
  emit('on-lunch-card-submit', logId, payload)
}

const listRef = ref<HTMLElement | null>(null)
const innerRef = ref<HTMLElement | null>(null)
const isScrolledUp = ref(false)
const isUserScrolling = ref(false)

// 스크롤 위치 감지
const onScroll = () => {
  if (!listRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = listRef.value
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight
  isScrolledUp.value = distanceFromBottom > 200
  // 사용자가 위로 스크롤했는지 판단 (하단 50px 이내면 자동 스크롤 허용)
  isUserScrolling.value = distanceFromBottom > 50
}

// 맨 아래로 스크롤 (버튼 클릭용 — smooth)
const scrollToBottom = () => {
  if (listRef.value) {
    listRef.value.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  }
}

// 특정 logId 메시지 상단으로 즉시 스크롤
// - getBoundingClientRect 기반으로 정확한 위치 계산
// - isUserScrolling을 선점해 ResizeObserver의 scrollToBottomInstant 간섭을 차단
const scrollToMessage = (logId: string) => {
  if (!listRef.value) return
  const el = listRef.value.querySelector(`[data-log-id="${logId}"]`) as HTMLElement | null
  if (!el) return
  isUserScrolling.value = true
  const containerRect = listRef.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  listRef.value.scrollTop += elRect.top - containerRect.top
}

// 즉시 스크롤 (자동 추적용 — instant)
const scrollToBottomInstant = () => {
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

// ResizeObserver: inner 높이 변화 감지 → 자동 스크롤
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    innerRef.value = listRef.value?.querySelector('.chat-message-list-inner') as HTMLElement
    if (innerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        // 사용자가 위로 스크롤 중이면 자동 스크롤 안 함
        if (!isUserScrolling.value) {
          scrollToBottomInstant()
        }
      })
      resizeObserver.observe(innerRef.value)
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

defineExpose({ scrollToBottom, scrollToMessage })
</script>

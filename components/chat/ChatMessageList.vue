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
          :key="`${msg.id ?? msg.logId}-${msg.type}`"
          :data-log-id="msg.logId"
          :message="msg"
          :knowledge-list="knowledgeList"
          :is-share="isShare"
          :file-share-yn="fileShareYn"
          @on-copy="emit('on-copy', $event)"
          @on-like="emit('on-like', $event)"
          @on-dislike="emit('on-dislike', $event)"
          @on-regenerate="emit('on-regenerate', $event)"
          @on-view-source="emit('on-view-source', $event)"
          @on-view-visualization="emit('on-view-visualization', $event)"
          @on-view-report="emit('on-view-report', $event)"
          @on-submit-recommend-card="onSubmitRecommendCard"
          @on-recommend-card-close="emit('on-recommend-card-close', $event)"
          @on-recommend-card-retry="emit('on-recommend-card-retry', $event)"
          @on-submit-translate-card="onSubmitTranslateCard"
          @on-translate-card-close="emit('on-translate-card-close', $event)"
          @on-submit-news-card="onSubmitNewsCard"
          @on-news-card-close="emit('on-news-card-close', $event)"
          @on-news-card-reselect="emit('on-news-card-reselect', $event)"
          @on-select-category="
            (logId: string, categoryValue: string, categoryNm: string) =>
              emit('on-select-category', logId, categoryValue, categoryNm)
          "
          @on-survey-submit="emit('on-survey-submit', $event)"
          @on-survey-close="emit('on-survey-close', $event)"
          @on-auto-recommend-intro-complete="emit('on-auto-recommend-intro-complete', $event)"
          @on-news-intro-complete="emit('on-news-intro-complete', $event)"
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
import type { ChatMessage, KnowledgeItem, RecommendFormPayload, TranslateFormPayload } from '~/types/chat'

interface Props {
  messages: ChatMessage[]
  knowledgeList?: KnowledgeItem[]
  /** 공유 보기 페이지 등 */
  isShare?: boolean
  /** 파일 공유 여부 — Y: 첨부 뷰어 표시, N: '파일 업로드됨' 안내 표시 */
  fileShareYn?: 'Y' | 'N'
}

withDefaults(defineProps<Props>(), {
  isShare: false,
  knowledgeList: undefined,
  fileShareYn: 'N',
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
  'on-view-report': [id: string]
  'on-survey-submit': [logId: string]
  'on-survey-close': [logId: string]
  'on-auto-recommend-intro-complete': [logId: string]
  'on-news-intro-complete': [logId: string]
  'on-recommend-card-submit': [logId: string, payload: RecommendFormPayload]
  'on-recommend-card-close': [logId: string]
  'on-recommend-card-retry': [logId: string]
  'on-translate-card-submit': [logId: string, payload: TranslateFormPayload]
  'on-translate-card-close': [logId: string]
  'on-news-card-submit': [logId: string, categories: string[], options?: { isNew?: boolean }]
  'on-news-card-close': [logId: string]
  'on-news-card-reselect': [logId: string]
}>()

const onSubmitRecommendCard = (logId: string, payload: RecommendFormPayload) => {
  emit('on-recommend-card-submit', logId, payload)
}
const onSubmitTranslateCard = (logId: string, payload: TranslateFormPayload) => {
  emit('on-translate-card-submit', logId, payload)
}
const onSubmitNewsCard = (logId: string, categories: string[], options?: { isNew?: boolean }) => {
  emit('on-news-card-submit', logId, categories, options)
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

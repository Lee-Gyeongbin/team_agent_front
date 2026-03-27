<template>
  <div
    class="chat-detail"
    :class="{
      'is-panel-open': activePanelType !== 'none',
      'is-panel-fullscreen': isPanelFullscreen,
    }"
    :style="activePanelType !== 'none' ? { '--panel-width': panelWidthPercent + 'vw' } : undefined"
  >
    <div class="chat-detail-main flex flex-col s-center">
      <!-- 메시지 목록 (읽기 전용) -->
      <ChatMessageList
        v-if="sharedMessages.length > 0"
        :messages="sharedMessages"
        :knowledge-list="knowledgeList"
        is-share
        @on-copy="onCopy"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
        @on-select-category="handleCreateKnowledge"
      />
      <div
        v-if="!isExpired && sharedMessages.length === 0"
        class="chat-share-status"
      >
        <p>대화 내용이 없습니다.</p>
      </div>

      <!-- 공유 안내 배너 (하단 — ChatInput 자리) -->
      <div class="chat-share-banner">
        <div class="chat-share-banner-info">
          <i class="icon-share size-20"></i>
          <span>{{ shareTxt }}</span>
        </div>
        <UiButton
          v-if="!isExpired"
          variant="primary"
          size="md"
          @click="onForkChat"
        >
          대화 이어가기
        </UiButton>
      </div>
    </div>

    <!-- 리사이즈 핸들 -->
    <div
      v-if="activePanelType !== 'none' && !isPanelFullscreen"
      class="chat-panel-resizer"
      @mousedown="onResizeStart"
    ></div>
    <!-- PDF 사이드 패널 -->
    <ChatPdfPanel
      :open="activePanelType === 'pdf'"
      :message-id="activePanelMessageId"
      :ref-list="pdfRefList"
      @update:open="onPanelClose"
      @update:fullscreen="isPanelFullscreen = $event"
    />
    <!-- 시각화 사이드 패널 -->
    <ChatVisualizationPanel
      :open="activePanelType === 'visualization'"
      :message-id="activePanelMessageId"
      @update:open="onPanelClose"
      @update:fullscreen="isPanelFullscreen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { setMessagesForVisualizationGetter } from '~/composables/chat/useChatMessages'
const { sharedMessages, knowledgeList, loadSharedChatLog, onCopy, loadKnowledgeList, isExpired, shareTxt } =
  useChatRooms()
const { handleCreateKnowledge } = useChatItemActions()
const {
  activePanelType,
  isPanelFullscreen,
  activePanelMessageId,
  pdfRefList,
  onViewSource,
  onViewVisualization,
  onPanelClose,
} = useChatStore()
const route = useRoute()

// 패널 리사이즈
const panelWidthPercent = ref(50)

const onResizeStart = (e: MouseEvent) => {
  e.preventDefault()
  document.body.classList.add('is-resizing')

  const onMouseMove = (ev: MouseEvent) => {
    const vw = window.innerWidth
    const percent = ((vw - ev.clientX) / vw) * 100
    panelWidthPercent.value = Math.min(60, Math.max(45, percent))
  }

  const onMouseUp = () => {
    document.body.classList.remove('is-resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

watch(activePanelType, (type) => {
  if (type === 'none') {
    panelWidthPercent.value = 50
  }
})

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const onForkChat = () => {
  openToast({ message: '대화 이어가기 기능은 준비 중입니다.', type: 'warning' })
}

onMounted(() => {
  loadKnowledgeList()
})

watch(
  () => route.params.id,
  (id) => {
    const shareToken = String(id || '').trim()
    if (!shareToken) return
    loadSharedChatLog(shareToken)
  },
  { immediate: true },
)

// 공유 페이지는 전역 messages 대신 sharedMessages에서 시각화 데이터를 찾도록 연결
onMounted(() => {
  setMessagesForVisualizationGetter(() => sharedMessages.value)
})
onUnmounted(() => {
  setMessagesForVisualizationGetter(null)
})
</script>

<style lang="scss" scoped>
.chat-share-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  margin-top: auto;
  margin-bottom: 20px;
  background: $color-background;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  flex-shrink: 0;
}

.chat-share-banner-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: $color-text-secondary;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

:deep(.chat-message-list-inner) {
  justify-content: flex-start;
}

.chat-share-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  flex: 1;
  min-height: 0;
  color: $color-text-secondary;
  font-size: $font-size-base;

  &.is-error {
    color: #e53e3e;
  }
}
</style>

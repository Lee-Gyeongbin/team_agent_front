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
        @on-copy="onCopy"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
      />
      <div
        v-else-if="isLoading"
        class="chat-share-status"
      >
        <UiSpinner />
        <p>대화를 불러오는 중입니다...</p>
      </div>
      <div
        v-else-if="errorMessage"
        class="chat-share-status is-error"
      >
        <p>{{ errorMessage }}</p>
      </div>
      <div
        v-else
        class="chat-share-status"
      >
        <p>대화 내용이 없습니다.</p>
      </div>

      <!-- 공유 안내 배너 (하단 — ChatInput 자리) -->
      <div class="chat-share-banner">
        <div class="chat-share-banner-info">
          <i class="icon-share size-20"></i>
          <span>공유된 대화입니다.</span>
        </div>
        <UiButton
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
import type { ChatMessage } from '~/types/chat'

const {
  activePanelType,
  isPanelFullscreen,
  activePanelMessageId,
  pdfRefList,
  onViewSource,
  onViewVisualization,
  onPanelClose,
} = useChatStore()
const { onCopy } = useChatItemActions()
const route = useRoute()
const { fetchSelectChatLogList } = useReportsApi()
const { logRowToMessages } = useChatMessages()

const sharedMessages = ref<ChatMessage[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

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

const loadSharedChatLog = async (roomId: string) => {
  if (!roomId) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await fetchSelectChatLogList(roomId)
    const rawList = res.list ?? []
    if (rawList.length === 0) {
      sharedMessages.value = []
      return
    }
    const flattened = rawList.flatMap(logRowToMessages)
    flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    sharedMessages.value = flattened
  } catch {
    errorMessage.value = '대화를 불러올 수 없습니다. 접근 권한이 없거나 존재하지 않는 대화입니다.'
  } finally {
    isLoading.value = false
  }
}

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const onForkChat = () => {
  openToast({ message: '대화 이어가기 기능은 준비 중입니다.', type: 'info' })
}

watch(
  () => route.params.id,
  (id) => {
    const roomId = String(id || '').trim()
    if (!roomId) return
    loadSharedChatLog(roomId)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.chat-share-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
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

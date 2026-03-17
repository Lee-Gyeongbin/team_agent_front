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
      <ChatMessageList
        :messages="messages"
        @on-copy="onCopy"
        @on-like="onLike"
        @on-dislike="onDislike"
        @on-regenerate="onRegenerate"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
      />
      <ChatInput v-model="chatMessage" />
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
const {
  messages,
  chatMessage,
  handleSetChatRoom,
  handleSelectChatLogList,
  activePanelType,
  isPanelFullscreen,
  activePanelMessageId,
  pdfRefList,
  onCopy,
  onLike,
  onDislike,
  onRegenerate,
  onViewSource,
  onViewVisualization,
  onPanelClose,
  startChatSocket,
  stopChatSocket,
} = useChatStore()
const route = useRoute()

// 패널 리사이즈
const panelWidthPercent = ref(50)
const isResizing = ref(false)

const onResizeStart = (e: MouseEvent) => {
  e.preventDefault()
  isResizing.value = true
  document.body.classList.add('is-resizing')

  const onMouseMove = (e: MouseEvent) => {
    const vw = window.innerWidth
    const percent = ((vw - e.clientX) / vw) * 100
    // 패널: 최소 40%, 최대 60%
    panelWidthPercent.value = Math.min(60, Math.max(45, percent))
  }

  const onMouseUp = () => {
    isResizing.value = false
    document.body.classList.remove('is-resizing')
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 패널 닫을 때 너비 초기화
watch(activePanelType, (type) => {
  if (type === 'none') {
    panelWidthPercent.value = 50
  }
})

onMounted(() => {
  startChatSocket()
})

watch(
  () => route.params.id,
  async (id) => {
    const roomId = String(id || '').trim()
    if (!roomId) return
    handleSetChatRoom(roomId)
    await handleSelectChatLogList(roomId, { preserveLocalWhenEmpty: true })
  },
  { immediate: true },
)

onBeforeRouteLeave((to) => {
  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})
</script>

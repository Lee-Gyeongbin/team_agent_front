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
        :knowledge-list="knowledgeList"
        @on-copy="onCopy"
        @on-like="onLike"
        @on-dislike="onDislike"
        @on-regenerate="onRegenerate"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
        @on-select-category="onSelectCategory"
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
    <UiModal
      :is-open="isModalOpen"
      :title="modalTitle"
      position="center"
      @close="isModalOpen = false"
    >
      <UiTextarea
        v-model="modalMessage"
        :placeholder="modalPlaceholder"
        :rows="2"
        size="sm"
        :border="true"
        :auto-resize="true"
        :max-rows="5"
      />
      <template #footer>
        <div class="modal-dialog-footer">
          <UiButton
            variant="line-secondary"
            size="md"
            @click="handleModalClose"
          >
            취소
          </UiButton>
          <UiButton
            class="btn-modal-dialog"
            variant="dark"
            size="md"
            @click="handleReactionSubmit"
          >
            확인
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
const {
  messages,
  handleSelectChatLogList,
  activePanelType,
  isPanelFullscreen,
  activePanelMessageId,
  pdfRefList,
  knowledgeList,
  onViewSource,
  onViewVisualization,
  onPanelClose,
  handleResetChatPanels,
  handleSelectKnowledge,
} = useChatStore()
const { chatMessage, handleSetChatRoom } = useChatRooms()
const { startChatSocket, stopChatSocket } = useChatSocket()
const route = useRoute()
const {
  onLike,
  onDislike,
  onCopy,
  onRegenerate,
  handleReactionSubmit,
  isModalOpen,
  modalMessage,
  modalTitle,
  modalPlaceholder,
  handleModalClose,
  handleCreateKnowledge,
} = useChatItemActions()
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
  handleSelectKnowledge()
  startChatSocket()
})

watch(
  () => route.params.id,
  async (id) => {
    const roomId = String(id || '').trim()
    if (!roomId) return
    // 채팅방/로그 id가 바뀌면 이전에 열어둔 시각화/테이블 상태를 닫는다.
    handleResetChatPanels()
    handleSetChatRoom(roomId)
    await handleSelectChatLogList(roomId, { preserveLocalWhenEmpty: true })
  },
  { immediate: true },
)

onBeforeRouteLeave((to) => {
  // /chat(index)로 복귀할 때는 패널 상태/테이블 데이터가 남지 않게 초기화
  if (String(to.path) === '/chat') {
    handleResetChatPanels()
  }

  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})

const onSelectCategory = async (logId: string, categoryValue: string, categoryNm: string) => {
  await handleCreateKnowledge(logId, categoryValue, categoryNm)
}
</script>

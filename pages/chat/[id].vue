<template>
  <div
    class="chat-detail"
    :class="{
      'is-panel-open': activePanelType !== 'none',
      'is-panel-fullscreen': isPanelFullscreen,
    }"
  >
    <div class="chat-detail-main flex flex-col m-center">
      <ChatMessageList
        :messages="messages"
        @on-copy="onCopy"
        @on-like="onLike"
        @on-dislike="onDislike"
        @on-regenerate="onRegenerate"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
      />
      <ChatInput
        v-model="chatMessage"
        :selected-model="selectedModel"
        :model-options="modelOptions"
        @update:selected-model="selectedModel = $event"
        @on-send="onSend"
      />
    </div>
    <!-- PDF 사이드 패널 -->
    <ChatPdfPanel
      :open="activePanelType === 'pdf'"
      :message-id="activePanelMessageId"
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
  selectedModel,
  activePanelType,
  isPanelFullscreen,
  activePanelMessageId,
  modelOptions,
  onSend,
  onCopy,
  onLike,
  onDislike,
  onRegenerate,
  onViewSource,
  onViewVisualization,
  onPanelClose,
} = useChatStore()
</script>

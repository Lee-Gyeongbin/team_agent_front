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
        @on-select-category="onSelectCategory"
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
        <p v-if="!isExpired">대화 내용이 없습니다.</p>
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
import type { ChatMessage, KnowledgeItem } from '~/types/chat'

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
const { fetchSelectSharedChatLogList, fetchSelectKnowledgeList, fetchCreateKnowledge } = useReportsApi()
const { logRowToMessages } = useChatMessages()

const sharedMessages = ref<ChatMessage[]>([])
const knowledgeList = ref<KnowledgeItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

// 패널 리사이즈
const panelWidthPercent = ref(50)

const shareTxt = ref('공유된 대화입니다.')
const isExpired = ref(false)

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

const loadSharedChatLog = async (shareToken: string) => {
  if (!shareToken) return
  isExpired.value = false
  openLoading()
  try {
    const res = await fetchSelectSharedChatLogList(shareToken)
    if (!res.successYn) {
      shareTxt.value = res.returnMsg
      isExpired.value = true
      openToast({ message: res.returnMsg, type: 'error' })
      sharedMessages.value = []
      return
    }
    const rawList = res.list ?? []
    if (rawList.length === 0) {
      sharedMessages.value = []
      return
    }
    const flattened = rawList.flatMap(logRowToMessages)
    flattened.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    sharedMessages.value = flattened
  } catch {
    openToast({ message: '대화를 불러올 수 없습니다. 접근 권한이 없거나 존재하지 않는 대화입니다.', type: 'error' })
    sharedMessages.value = []
  } finally {
    closeLoading()
  }
}

/** 카테고리 목록 (일반 채팅방과 동일 API) */
const loadKnowledgeList = async () => {
  try {
    const res = await fetchSelectKnowledgeList()
    knowledgeList.value = res.dataList ?? []
  } catch {
    knowledgeList.value = []
  }
}

/** 답변 복사 */
const onCopy = (id: string) => {
  copyToClipboard(sharedMessages.value.find((m) => m.logId === id && m.type === 'answer')?.rContent ?? '')
  openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
}

/** 지식창고 저장 */
const onSelectCategory = async (logId: string, categoryId: string) => {
  openLoading({ text: '지식창고에 저장 중...' })
  try {
    await fetchCreateKnowledge(logId, categoryId)
    openToast({ message: '지식창고에 저장되었습니다', type: 'success' })
  } catch {
    openToast({ message: '지식창고 저장에 실패했습니다', type: 'error' })
  } finally {
    closeLoading()
  }
}

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

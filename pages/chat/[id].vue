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
        ref="chatMessageListRef"
        :messages="messages"
        :knowledge-list="knowledgeList"
        @on-copy="onCopy"
        @on-like="onLike"
        @on-dislike="onDislike"
        @on-regenerate="onRegenerate"
        @on-view-source="onViewSource"
        @on-view-visualization="onViewVisualization"
        @on-select-category="onSelectCategory"
        @on-survey-submit="onSurveyMessageSubmit"
        @on-survey-close="onSurveyMessageClose"
        @on-meme-intro-complete="handleTodayMemeIntroEnd"
        @on-news-intro-complete="handleNewsCuratorIntroEnd"
        @on-recommend-card-submit="handleSubmitRecommendAgentForm"
        @on-recommend-card-close="onRecommendMessageClose"
        @on-lunch-card-submit="handleSubmitLunchAgentForm"
        @on-news-card-submit="onNewsCuratorMessageSubmit"
        @on-news-card-close="onNewsMessageClose"
        @on-news-card-reselect="onNewsMessageReselect"
        @on-lunch-card-close="onLunchMessageClose"
      />
      <ChatInput
        v-model="chatMessage"
        :disabled="isSurveyInputLocked"
      />
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
      @close="handleModalClose"
    >
      <div class="chat-reaction-modal-body">
        <div
          v-if="satisYn === 'N' && dislikeReasonOptions.length > 0"
          class="chat-reaction-dislike-reasons"
        >
          <p class="chat-reaction-dislike-reasons__title">답변이 마음에 들지 않은 이유를 알려주세요</p>
          <RadioGroupRoot
            v-model="selectedDislikeReasonId"
            class="chat-reaction-dislike-group"
            orientation="vertical"
            name="chat-dislike-reason"
          >
            <label
              v-for="opt in dislikeReasonOptions"
              :key="opt.value"
              class="chat-reaction-dislike-row"
            >
              <RadioGroupItem
                class="chat-reaction-dislike-item"
                :value="opt.value"
              >
                <RadioGroupIndicator class="chat-reaction-dislike-indicator" />
              </RadioGroupItem>
              <span class="chat-reaction-dislike-label">{{ opt.label }}</span>
            </label>
          </RadioGroupRoot>
        </div>

        <div class="chat-reaction-textarea-wrap">
          <UiTextarea
            v-model="modalMessage"
            :placeholder="modalPlaceholder"
            :rows="2"
            size="sm"
            :border="true"
            :auto-resize="true"
            :max-rows="5"
          />
        </div>
      </div>
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
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from 'radix-vue'
import { normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'

/** 방 id가 바뀔 때마다 페이지 인스턴스 분리 — 전환 트랜지션(out-in)·조합형 라우트에서 상태 잔류 완화 */
definePageMeta({
  key: (route) => normalizeChatRoomId(route.params.id),
})

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
  handleSelectChatIndexAgents,
  onSurveyMessageSubmit,
  handleClosePsychologySurvey,
  resetTodayMemePanel,
  handleTodayMemeIntroEnd,
  handleNewsCuratorIntroEnd,
  onNewsCuratorMessageSubmit,
  handleNewsCuratorReselectCategories,
  handleCloseNewsCurator,
  handleSubmitLunchAgentForm,
  handleCloseLunchAgent,
  handleSubmitRecommendAgentForm,
  handleCloseRecommendAgent,
} = useChatStore()
const { chatMessage, handleSetChatRoom } = useChatRooms()

/** 메시지 목록의 설문 컴포넌트 "닫기" 버튼 클릭 */
const onSurveyMessageClose = (logId: string) => {
  handleClosePsychologySurvey(logId)
}
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
  satisYn,
  dislikeReasonOptions,
  selectedDislikeReasonId,
} = useChatItemActions()

type ChatMessageListExpose = {
  scrollToBottom: () => void
  scrollToMessage: (logId: string) => void
}

const chatMessageListRef = ref<ChatMessageListExpose | null>(null)
const isSurveyInputLocked = computed(() =>
  messages.value.some(
    (m) =>
      (m.type === 'survey' && !m.surveySubmitted) ||
      (m.type === 'lunch' && !m.lunchSubmitted) ||
      (m.type === 'recommend' && !m.recommendSubmitted) ||
      (m.type === 'meme' && !m.memeSubmitted) ||
      (m.type === 'news' && !m.newsSubmitted),
  ),
)

const onRecommendMessageClose = (logId: string) => {
  handleCloseRecommendAgent(logId)
}
/** 메시지 목록의 점심 카드 "닫기" 버튼 클릭 */
const onLunchMessageClose = (logId: string) => {
  handleCloseLunchAgent(logId)
}
/** 메시지 목록의 뉴스 카드 "닫기" 버튼 클릭 */
const onNewsMessageClose = (logId: string) => {
  handleCloseNewsCurator(logId)
}
/** 메시지 목록의 뉴스 카드 "새로운 카테고리 선택하기" 클릭 */
const onNewsMessageReselect = async (logId: string) => {
  const newLogId = await handleNewsCuratorReselectCategories(logId)
  if (!newLogId) return
  await nextTick()
  chatMessageListRef.value?.scrollToMessage(newLogId)
}
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
  handleSelectChatIndexAgents()
  startChatSocket()
})

watch(
  () => route.params.id,
  async (id) => {
    const roomId = String(id || '').trim()
    if (!roomId) return
    // 채팅방/로그 id가 바뀌면 이전에 열어둔 시각화/테이블 상태를 닫는다.
    handleResetChatPanels()
    // handleSetChatRoom 보다 먼저 로그를 조회해야
    // handleSelectChatLogList 내부의 isSameRoom 비교가 "이전 방 vs 새 방"으로 올바르게 동작한다.
    // (handleSetChatRoom을 먼저 호출하면 isSameRoom이 항상 true가 되어 이전 방 메시지가 잔류하는 버그 발생)
    // 설문 subCfg·Pexels 파싱을 위해 에이전트 목록을 로그 조회와 함께 보장 (handleSelectChatLogList 내부에서도 재호출)
    await handleSelectChatIndexAgents()
    await handleSelectChatLogList(roomId, { preserveLocalWhenEmpty: true })
    handleSetChatRoom(roomId)
  },
  { immediate: true },
)

watch(
  () => messages.value.length,
  async (nextLength, prevLength) => {
    if (nextLength <= prevLength) return
    await nextTick()
    const lastMsg = messages.value[messages.value.length - 1]
    if (
      (lastMsg?.type === 'survey' && !lastMsg.surveySubmitted) ||
      (lastMsg?.type === 'meme' && !lastMsg.memeSubmitted) ||
      (lastMsg?.type === 'news' && !lastMsg.newsSubmitted)
    ) {
      // ResizeObserver(scrollToBottomInstant)가 먼저 실행된 뒤에 survey 상단으로 이동해야 하므로
      // double-rAF로 두 프레임 뒤에 스크롤을 적용한다
      const logId = lastMsg.logId
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          chatMessageListRef.value?.scrollToMessage(logId)
        })
      })
    } else {
      chatMessageListRef.value?.scrollToBottom()
    }
  },
)

onBeforeRouteLeave((to) => {
  // /chat(index)로 복귀할 때는 패널 상태/테이블 데이터가 남지 않게 초기화
  if (String(to.path) === '/chat') {
    handleResetChatPanels()
  }

  // chat 영역 밖으로 나갈 때 열려 있을 수 있는 설문 닫기
  if (!String(to.path).startsWith('/chat')) {
    handleClosePsychologySurvey()
    resetTodayMemePanel()
    stopChatSocket()
  }
})

const onSelectCategory = async (logId: string, categoryValue: string, categoryNm: string) => {
  await handleCreateKnowledge(logId, categoryValue, categoryNm)
}
</script>

<style lang="scss" scoped>
.chat-reaction-dislike-reasons {
  margin-bottom: $spacing-md;

  &__title {
    margin: 0 0 $spacing-sm;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-text-primary;
  }
}

.chat-reaction-dislike-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.chat-reaction-dislike-row {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  cursor: pointer;
}

.chat-reaction-dislike-item {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin: 2px 0 0;
  padding: 0;
  border: 1px solid $color-border;
  border-radius: 50%;
  background: #fff;
  box-shadow: none;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }

  &[data-state='checked'] {
    border-color: $color-primary;
  }
}

.chat-reaction-dislike-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  &::after {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-primary;
  }
}

.chat-reaction-dislike-label {
  flex: 1;
  font-size: $font-size-sm;
  line-height: 1.45;
  color: $color-text-dark;
}

.chat-reaction-modal-body {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.chat-reaction-textarea-wrap {
  width: 100%;
  margin-top: $spacing-xs;

  :deep(.ui-textarea.has-border) {
    padding: 10px 12px;
    min-height: 72px;
  }
}
</style>

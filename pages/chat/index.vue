<template>
  <div
    class="chat-index s-center"
    :class="{ 'is-survey-mode': isSurveyVisible || isLunchVisible }"
  >
    <!-- 헤더 (설문 모드에서 숨김) -->
    <div
      v-if="!isSurveyVisible && !isLunchVisible"
      class="chat-index-header"
      data-aos="fade-up"
    >
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">{{ user?.userNm + '님, ' || '' }}어떤게 궁금하세요?</p>
    </div>

    <!-- 산업심리 상담 설문  -->
    <ChatPsychologySurvey
      v-if="isSurveyVisible"
      class="chat-index-survey"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleClosePsychologySurvey"
      @submit="handleIndexSurveySubmit"
    />
    <ChatLunchAgentCard
      v-if="isLunchVisible"
      class="chat-index-survey"
      :theme-icon-class-nm="currentSurveyAgent?.iconClassNm ?? ''"
      :theme-color-hex="currentSurveyAgent?.colorHex ?? ''"
      @close="handleCloseIndexLunchCard"
      @submit="handleIndexLunchSubmit"
    />

    <!-- 채팅 입력창 (설문 진행 중 비활성화) -->
    <div
      class="chat-index-input-wrapper"
      :class="{ 'is-survey-locked': isSurveyVisible || isLunchVisible }"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <ChatInput v-model="chatMessage" />
    </div>

    <!-- 에이전트 카드 (설문 모드 아닐 때) -->
    <template v-if="!isSurveyVisible && !isLunchVisible">
      <div
        v-if="!isLoadingChatIndexAgents && chatIndexAgents.length > 0"
        class="chat-index-card-grp"
        :class="{ 'is-few': chatIndexAgents.length <= 3 }"
        data-aos="fade-up"
        data-aos-delay="400"
      >
        <button
          v-for="agent in chatIndexAgents"
          :key="agent.agentId"
          type="button"
          class="chat-index-card"
          :class="{ 'is-active': selectedChatAgentId === agent.agentId }"
          :style="getChatIndexAgentColorStyle(agent.colorHex ?? '')"
          @click="selectChatIndexAgent(agent)"
        >
          <div class="chat-index-card-default">
            <span class="icon-circle"
              ><i :class="[agent.iconClassNm ? agent.iconClassNm : 'icon-search', 'size-24']"
            /></span>
            <div class="chat-index-card-info">
              <p class="chat-index-card-name">{{ agent.agentNm }}</p>
              <p class="chat-index-card-sub">{{ getChatIndexAgentSubLabel(agent) }}</p>
            </div>
          </div>
          <div class="chat-index-card-hover">
            <p class="chat-index-card-hover-desc">{{ agent.description }}</p>
            <span class="chat-index-card-hover-action">시작하기 <i class="icon-chevron-right-sm size-12" /></span>
          </div>
        </button>
      </div>
      <p
        v-else-if="!isLoadingChatIndexAgents && chatIndexAgents.length === 0"
        class="chat-index-agent-hint f-center"
        data-aos="fade-up"
        data-aos-delay="400"
      >
        사용 가능한 에이전트가 없습니다. 에이전트 관리에서 등록해 주세요.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { chatMessage, selectChatRoomList, selectModelOptions, resetChatRoom } = useChatRooms()
const {
  selectedChatAgentId,
  selectChatIndexAgent,
  handleResetChatPanels,
  chatIndexAgents,
  isLoadingChatIndexAgents,
  getChatIndexAgentSubLabel,
  getChatIndexAgentColorStyle,
  handleSelectChatIndexAgents,
  handleClosePsychologySurvey,
  isSurveyVisible,
  handleIndexSurveySubmit,
  isLunchVisible,
  handleCloseIndexLunchCard,
  handleIndexLunchSubmit,
} = useChatStore()
const { startChatSocket, stopChatSocket } = useChatSocket()
const { user } = useAuth()

const isMountedChatIndex = ref(true)
const currentSurveyAgent = computed(
  () => chatIndexAgents.value.find((agent) => agent.agentId === selectedChatAgentId.value) ?? null,
)

onMounted(async () => {
  // 시각화 패널에서 나와 다시 일반 채팅으로 들어올 때 이전 tableData가 남지 않게 초기화
  handleResetChatPanels()
  // 다른 메뉴 갔다 돌아올 때 설문 / 에이전트 선택 상태 초기화
  handleClosePsychologySurvey()
  handleCloseIndexLunchCard()
  // 인덱스 진입 시점에 즉시 채팅방 상태를 초기화해
  // 비동기 로딩 완료 시점의 늦은 reset으로 인한 레이스를 방지한다.
  resetChatRoom()
  await Promise.all([selectChatRoomList(), handleSelectChatIndexAgents(), selectModelOptions()])
  // /chat에서 /chat/[id]로 이미 이동한 뒤 비동기 완료 시 reset이 늦게 실행되어
  // 방금 생성한 방의 로컬 메시지가 지워지는 레이스 컨디션을 방지한다.
  if (!isMountedChatIndex.value) return
  // 채팅소켓 시작
  startChatSocket()
})

onUnmounted(() => {
  isMountedChatIndex.value = false
})

onBeforeRouteLeave((to) => {
  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})
</script>

<style lang="scss" scoped>
.chat-index-agent-hint {
  margin-top: $spacing-lg;
  @include typo($body-small);
  color: $color-text-muted;
}

// 설문 모드: justify-content를 flex-start로 전환해 설문이 위에서 시작
.chat-index.is-survey-mode {
  justify-content: flex-start;
  padding-top: $spacing-lg;

  .chat-index-input-wrapper {
    margin-bottom: $spacing-lg;
    flex-shrink: 0;
  }
}

// 설문 컴포넌트: 남은 세로 공간을 모두 차지, 입력창과 간격 확보
.chat-index-survey {
  flex: 1;
  min-height: 0;
  width: 100%;
  margin-bottom: $spacing-md;
}

// 설문 진행 중 입력창 비활성화
.chat-index-input-wrapper.is-survey-locked {
  pointer-events: none;
  opacity: 0.45;
  user-select: none;
}
</style>

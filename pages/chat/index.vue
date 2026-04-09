<template>
  <div class="chat-index flex flex-col items-center justify-center s-center">
    <div
      class="chat-index-header"
      data-aos="fade-up"
    >
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">{{ user?.userNm + '님, ' || '' }}어떤게 궁금하세요?</p>
    </div>

    <div
      class="chat-index-input-wrapper"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <ChatInput v-model="chatMessage" />
    </div>

    <div
      v-if="!isLoadingChatIndexAgents && chatIndexAgents.length > 0"
      class="btn-grp"
      data-aos="fade-up"
      data-aos-delay="400"
    >
      <button
        v-for="agent in chatIndexAgents"
        :key="agent.agentId"
        type="button"
        class="btn btn-chat-index"
        :class="{ 'is-active': selectedChatAgentId === agent.agentId }"
        @click="selectChatIndexAgent(agent)"
      >
        <span class="icon-circle"><i :class="[getChatIndexAgentIconClass(agent), 'size-20']" /></span>
        <p>{{ agent.agentNm }}</p>
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
  getChatIndexAgentIconClass,
  handleSelectChatIndexAgents,
} = useChatStore()
const { startChatSocket, stopChatSocket } = useChatSocket()
const { user } = useAuth()
const isMountedChatIndex = ref(true)

onMounted(async () => {
  // 시각화 패널에서 나와 다시 일반 채팅으로 들어올 때 이전 tableData가 남지 않게 초기화
  handleResetChatPanels()
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
</style>

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
      class="btn-grp"
      data-aos="fade-up"
      data-aos-delay="400"
    >
      <button
        class="btn btn-chat-index"
        :class="{ 'is-active': activeSearchModes.includes('M') }"
        @click="toggleSearchMode('M')"
      >
        <span class="icon-circle"><i class="icon-knowledge size-20"></i></span>
        <p>지식검색 (매뉴얼 AI)</p>
      </button>
      <button
        class="btn btn-chat-index"
        :class="{ 'is-active': activeSearchModes.includes('S') }"
        @click="toggleSearchMode('S')"
      >
        <span class="icon-circle"><i class="icon-database size-20"></i></span>
        <p>데이터분석 (SQL)</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { chatMessage, selectChatRoomList, selectModelOptions, resetChatRoom } = useChatRooms()
const { activeSearchModes, toggleSearchMode, handleResetChatPanels } = useChatStore()
const { startChatSocket, stopChatSocket } = useChatSocket()
const { user } = useAuth()

onMounted(async () => {
  // 시각화 패널에서 나와 다시 일반 채팅으로 들어올 때 이전 tableData가 남지 않게 초기화
  handleResetChatPanels()
  // 채팅방 목록 조회
  await selectChatRoomList()
  // 채팅방 초기화
  resetChatRoom()
  // 채팅소켓 시작
  startChatSocket()
  // 모델 옵션 조회
  await selectModelOptions()
})

onBeforeRouteLeave((to) => {
  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})
</script>

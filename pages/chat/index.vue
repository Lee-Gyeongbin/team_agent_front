<template>
  <div class="chat-index flex flex-col items-center justify-center m-center">
    <div
      class="chat-index-header"
      data-aos="fade-up"
    >
      <h1 class="chat-index-title f-center">TeamAgent</h1>
      <p class="chat-index-description f-center">{{ user?.userName + '님, ' || '' }}어떤게 궁금하세요?</p>
    </div>

    <div
      class="chat-index-input-wrapper"
      data-aos="fade-up"
      data-aos-delay="200"
    >
      <ChatInput
        v-model="chatMessage"
        :selected-model="selectedModel"
        :model-options="modelOptions"
        @update:selected-model="selectedModel = $event"
      />
    </div>

    <div
      class="btn-grp"
      data-aos="fade-up"
      data-aos-delay="400"
    >
      <button
        class="btn btn-chat-index"
        :class="{ 'is-active': activeSearchModes.includes('knowledge') }"
        @click="toggleSearchMode('knowledge')"
      >
        <span class="icon-circle"><i class="icon-knowledge size-20"></i></span>
        <p>지식검색 (매뉴얼 AI)</p>
      </button>
      <button
        class="btn btn-chat-index"
        :class="{ 'is-active': activeSearchModes.includes('sql') }"
        @click="toggleSearchMode('sql')"
      >
        <span class="icon-circle"><i class="icon-database size-20"></i></span>
        <p>데이터분석 (SQL)</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  selectedModel,
  modelOptions,
  chatMessage,
  activeSearchModes,
  toggleSearchMode,
  startChatSocket,
  stopChatSocket,
  resetChatRoom,
} = useChatStore()
const { user } = useAuth()

onMounted(() => {
  resetChatRoom()
  startChatSocket()
})

onBeforeRouteLeave((to) => {
  if (!String(to.path).startsWith('/chat')) {
    stopChatSocket()
  }
})
</script>

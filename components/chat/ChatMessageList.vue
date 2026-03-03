<template>
  <div
    ref="listRef"
    class="chat-message-list"
  >
    <ChatMessageItem
      v-for="msg in messages"
      :key="msg.id"
      :message="msg"
      @on-copy="emit('on-copy', $event)"
      @on-like="emit('on-like', $event)"
      @on-dislike="emit('on-dislike', $event)"
      @on-regenerate="emit('on-regenerate', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

interface Props {
  messages: ChatMessage[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'on-copy': [id: string]
  'on-like': [id: string]
  'on-dislike': [id: string]
  'on-regenerate': [id: string]
}>()

const listRef = ref<HTMLElement | null>(null)

// 메시지 추가 시 자동 스크롤
const scrollToBottom = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

watch(
  () => props.messages.length,
  () => scrollToBottom(),
)

onMounted(() => scrollToBottom())

defineExpose({ scrollToBottom })
</script>

<style lang="scss" scoped>
.chat-message-list {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md $spacing-lg;
  @include custom-scrollbar;
}
</style>

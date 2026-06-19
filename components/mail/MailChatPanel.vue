<template>
  <div class="mail-panel mail-chat-panel">
    <div class="mail-panel-header">
      <h2 class="mail-panel-title">메일 AI 채팅</h2>
      <div class="mail-ai-badge">
        <i class="icon-ai size-14" />
        메일 컨텍스트
      </div>
    </div>

    <div
      ref="chatListRef"
      class="mail-chat-log"
    >
      <ul class="mail-chat-list">
        <li
          v-for="entry in chatMessages"
          :key="entry.id"
          class="mail-chat-item"
          :class="entry.role === 'user' ? 'role-user' : 'role-assistant'"
        >
          <i
            v-if="entry.role === 'assistant'"
            class="mail-chat-avatar icon-bot size-20"
          />
          <div class="mail-chat-message-wrap">
            <p class="mail-chat-bubble">{{ entry.content }}</p>
            <span
              v-if="entry.role === 'user'"
              class="mail-chat-time"
            >
              {{ entry.timeLabel }}
            </span>
          </div>
        </li>
        <li
          v-if="isLoadingChat"
          class="mail-chat-item role-assistant"
        >
          <i class="mail-chat-avatar icon-bot size-20" />
          <div class="mail-chat-message-wrap">
            <p class="mail-chat-bubble">답변 생성 중...</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="mail-chat-input-row">
      <div
        class="mail-chat-input-bar"
        :class="{ 'is-active': !!chatDraft.trim() }"
      >
        <i
          v-show="!chatDraft.trim()"
          class="icon-sparkle size-20"
        />
        <UiInput
          v-model="chatDraft"
          size="md"
          class="mail-chat-input-field"
          :spellcheck="false"
          :disabled="isLoadingChat"
          placeholder="예: 지금 당장 처리해야 할 메일이 무엇인가요?"
          @enter="onSendChat"
        />
        <UiButton
          variant="primary"
          size="md"
          icon-only
          class="btn-chat-send mail-chat-send"
          :disabled="!chatDraft.trim() || isLoadingChat"
          aria-label="전송"
          @click="onSendChat"
        >
          <template #icon-left>
            <i class="icon-send size-20" />
          </template>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMailStore } from '~/composables/mail/useMailStore'
import type { Mail, MailChatHistoryItem } from '~/types/mail'

const props = defineProps<{
  mails: Mail[]
}>()

const { isLoadingChat, handleFetchMailChat } = useMailStore()

const INITIAL_CHAT_MESSAGE = `안녕하세요! 메일 내용에 대해 궁금한 게 있으시면 물어보세요.
예) 지금 당장 해야 할 일이 뭔가요? / 오늘 중요한 메일 요약해줘`

type MailChatMessage = MailChatHistoryItem & {
  id: string
  timeLabel: string
}

const chatIdSeq = ref(0)
const chatMessages = ref<MailChatMessage[]>([])
const chatDraft = ref('')
const chatListRef = ref<HTMLElement>()

const nextChatId = () => {
  chatIdSeq.value += 1
  return `mail-chat-${chatIdSeq.value}`
}

const formatChatTime = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const resetChatHistory = () => {
  chatMessages.value = [
    {
      id: nextChatId(),
      role: 'assistant',
      content: INITIAL_CHAT_MESSAGE,
      timeLabel: '',
    },
  ]
  chatDraft.value = ''
}

const scrollChatToBottom = () => {
  nextTick(() => {
    if (!chatListRef.value) return
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
  })
}

const buildMailContext = () => {
  if (!props.mails.length) return '조회된 메일이 없습니다.'
  return props.mails
    .map((mail, idx) => {
      const preview = mail.body ? (mail.body.length > 200 ? mail.body.slice(0, 200) + '...' : mail.body) : '-'
      const d = mail.receivedDate ? new Date(mail.receivedDate) : null
      const dateText =
        d && !Number.isNaN(d.getTime())
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          : '-'
      return `${idx + 1}. 제목: ${mail.subject || '-'} | 발신자: ${mail.fromName || mail.from || '-'} | 날짜: ${dateText} | 본문요약: ${preview}`
    })
    .join('\n')
}

const toChatHistoryForApi = () =>
  chatMessages.value.slice(-10).map((entry) => ({
    role: entry.role,
    content: entry.content,
  }))

const onSendChat = async () => {
  const message = chatDraft.value.trim()
  if (!message || isLoadingChat.value) return

  const previousHistory = toChatHistoryForApi()
  chatMessages.value.push({
    id: nextChatId(),
    role: 'user',
    content: message,
    timeLabel: formatChatTime(),
  })
  chatDraft.value = ''
  scrollChatToBottom()

  const answer = await handleFetchMailChat({
    message,
    mailContext: buildMailContext(),
    chatHistory: previousHistory,
  })

  chatMessages.value.push({
    id: nextChatId(),
    role: 'assistant',
    content: answer || '답변을 생성하지 못했습니다. 다시 시도해 주세요.',
    timeLabel: '',
  })
  scrollChatToBottom()
}

watch(
  () => chatMessages.value.length,
  () => scrollChatToBottom(),
)

resetChatHistory()

defineExpose({ resetChatHistory })
</script>

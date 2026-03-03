<template>
  <div class="chat-detail flex flex-col">
    <ChatMessageList
      :messages="messages"
      @on-copy="onCopy"
      @on-like="onLike"
      @on-dislike="onDislike"
      @on-regenerate="onRegenerate"
    />
    <ChatInput
      v-model="chatMessage"
      @on-send="onSend"
    />
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const route = useRoute()
const chatMessage = ref('')

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const messages = ref<ChatMessage[]>([
  {
    id: '1',
    role: 'user',
    content: '업무관리에서 칸반 보드는 어떻게 생성하지?',
    createdAt: '2025-03-03T10:00:00',
  },
  {
    id: '2',
    role: 'assistant',
    content: `<p>좋은 질문이에요 👍</p>
<p><strong>칸반 보드</strong>를 생성하는 방법을 안내해 드리겠습니다.</p>
<ol>
<li>업무관리 메뉴에 접속합니다.</li>
<li>상단의 "새 보드" 버튼을 클릭합니다.</li>
<li>보드 이름을 입력하고 템플릿으로 "칸반"을 선택합니다.</li>
<li>기본 컬럼(To Do, In Progress, Done)이 자동으로 생성됩니다.</li>
<li>필요에 따라 컬럼을 추가하거나 수정할 수 있습니다.</li>
</ol>
<p>추가로 칸반 보드에서는 카드를 드래그 앤 드롭으로 쉽게 이동할 수 있습니다.</p>`,
    createdAt: '2025-03-03T10:00:05',
  },
  {
    id: '3',
    role: 'user',
    content: '회의실 예약 절차 알려주세요',
    createdAt: '2025-03-03T10:01:00',
  },
  {
    id: '4',
    role: 'assistant',
    content: `<p>🏢 <strong>회의실 예약 절차</strong>를 안내해 드리겠습니다.</p>
<ol>
<li>그룹웨어 메인에서 "회의실 예약" 메뉴를 클릭합니다.</li>
<li>예약하고 싶은 날짜와 시간대를 선택합니다.</li>
<li>사용 가능한 회의실 목록에서 원하는 회의실을 선택합니다.</li>
<li>회의 제목, 참석자를 입력한 뒤 "예약 신청" 버튼을 클릭합니다.</li>
<li>승인 후 예약이 확정되면 알림을 받을 수 있습니다.</li>
</ol>`,
    createdAt: '2025-03-03T10:01:10',
  },
])

// 메시지 전송
const onSend = () => {
  const content = chatMessage.value.trim()
  if (!content) return

  messages.value.push({
    id: Date.now().toString(),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  })

  chatMessage.value = ''

  // 🔽 더미 — 백엔드 연결 시 API 스트리밍으로 교체
  simulateStreaming()
}

// 더미 스트리밍 시뮬레이션
const simulateStreaming = () => {
  const fullText = '안녕하세요! 해당 내용에 대해 안내해 드리겠습니다.\n\n확인 후 자세한 답변을 드리겠습니다. 추가 궁금한 점이 있으시면 말씀해 주세요.'
  const msgId = (Date.now() + 1).toString()

  // 스트리밍 시작 — 빈 메시지 추가
  messages.value.push({
    id: msgId,
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
    isStreaming: true,
  })

  const msg = messages.value.find((m) => m.id === msgId)
  if (!msg) return

  let idx = 0
  const interval = setInterval(() => {
    // 한 번에 2~5자씩 추가 (자연스러운 속도감)
    const chunk = fullText.slice(idx, idx + Math.floor(Math.random() * 4) + 2)
    msg.content = `<p>${fullText.slice(0, idx + chunk.length).replace(/\n/g, '<br>')}</p>`
    idx += chunk.length

    if (idx >= fullText.length) {
      clearInterval(interval)
      msg.isStreaming = false
    }
  }, 30)
}

// 액션 핸들러
const onCopy = (id: string) => {
  const msg = messages.value.find((m) => m.id === id)
  if (msg) {
    navigator.clipboard.writeText(msg.content.replace(/<[^>]*>/g, ''))
  }
}

const onLike = (id: string) => {
  const msg = messages.value.find((m) => m.id === id)
  if (msg) {
    msg.isLiked = !msg.isLiked
    if (msg.isLiked) msg.isDisliked = false
  }
}

const onDislike = (id: string) => {
  const msg = messages.value.find((m) => m.id === id)
  if (msg) {
    msg.isDisliked = !msg.isDisliked
    if (msg.isDisliked) msg.isLiked = false
  }
}

const onRegenerate = (id: string) => {
  // 🔽 더미 — 백엔드 연결 시 API 호출로 교체
  console.warn('재생성 요청:', id)
}
</script>

<style lang="scss" scoped>
.chat-detail {
  height: calc(100vh - #{$header-height});
  overflow: hidden; // 자체 스크롤 방지 → ChatMessageList가 스크롤 담당
  background: #fff;
}
</style>

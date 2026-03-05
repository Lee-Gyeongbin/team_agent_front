import type { ChatMessage, PanelType, ModelOption } from '~/types/chat'

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const modelOptions: ModelOption[] = [
  { label: '자동', value: 'auto' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
  { label: 'Claude 3 Opus', value: 'claude-3-opus' },
  { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
  { label: 'Llama 3.1 405B', value: 'llama-3.1-405b' },
  { label: 'Mixtral 8x22B', value: 'mixtral-8x22b' },
  { label: 'DeepSeek V3', value: 'deepseek-v3' },
  { label: 'Qwen 2.5 72B', value: 'qwen-2.5-72b' },
]

const dummyMessages: ChatMessage[] = [
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
    hasSource: true,
    hasVisualization: false,
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
    hasSource: true,
    hasVisualization: true,
  },
]

export const useChatStore = () => {
  // 상태
  const messages = ref<ChatMessage[]>([...dummyMessages])
  const chatMessage = ref('')
  const selectedModel = ref('auto')
  const activePanelType = ref<PanelType>('none')
  const isPanelFullscreen = ref(false)
  const activePanelMessageId = ref<string | null>(null)

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

  // 🔽 더미 스트리밍 시뮬레이션 — 백엔드 연결 시 제거
  const simulateStreaming = () => {
    const fullText =
      '안녕하세요! 해당 내용에 대해 안내해 드리겠습니다.\n\n확인 후 자세한 답변을 드리겠습니다. 추가 궁금한 점이 있으시면 말씀해 주세요.'
    const msgId = (Date.now() + 1).toString()

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

  // 패널 핸들러
  const onViewSource = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
  }

  const onViewVisualization = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'visualization'
    activePanelMessageId.value = id
  }

  const onPanelClose = (value: boolean) => {
    if (!value) {
      activePanelType.value = 'none'
      isPanelFullscreen.value = false
      activePanelMessageId.value = null
    }
  }

  return {
    // 상태
    messages,
    chatMessage,
    selectedModel,
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    modelOptions,
    // 액션
    onSend,
    onCopy,
    onLike,
    onDislike,
    onRegenerate,
    // 패널
    onViewSource,
    onViewVisualization,
    onPanelClose,
  }
}

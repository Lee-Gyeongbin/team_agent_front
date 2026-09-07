<template>
  <div class="marketing-campaign-plan-result">
    <button
      class="marketing-back-btn"
      type="button"
      @click="onClose"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      제작 내역
    </button>

    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">캠페인 기획서</h1>
        <p class="marketing-list-desc">{{ displayHeaderMeta }}</p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="outline"
          size="md"
          @click="onRegenerate"
        >
          동일 조건으로 재생성
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="onBackToForm"
        >
          입력값 다시 선택하기
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onStartContent"
        >
          이 기획으로 콘텐츠 제작 시작
          <template #icon-right>
            <UiIcon
              name="arrow-right"
              size="16"
            />
          </template>
        </UiButton>
      </div>
    </div>

    <div class="marketing-campaign-plan-result__body">
      <section class="marketing-campaign-plan-result__doc">
        <div class="marketing-campaign-plan-result__toolbar">
          <span class="marketing-campaign-plan-result__toolbar-label">
            <span class="marketing-campaign-plan-result__toolbar-dot" />
            캠페인 기획서
          </span>
        </div>

        <div class="marketing-campaign-plan-result__scroll">
          <div class="marketing-campaign-plan-result__hero">
            <img
              v-if="heroImageUrl"
              class="marketing-campaign-plan-result__hero-image"
              :src="heroImageUrl"
              :alt="draft.productNm"
            />
            <div
              v-else
              class="marketing-campaign-plan-result__hero-product"
            >
              <span>{{ draft.productNm || projectNm }}</span>
            </div>
          </div>

          <article class="marketing-campaign-plan-result__article">
            <h2>{{ draft.productNm || projectNm }} 캠페인 전략</h2>
            <p class="marketing-campaign-plan-result__period">{{ dueDateLabel }} · {{ draft.goal }}</p>

            <h3>1. 캠페인 전략 개요</h3>
            <p>{{ draft.goal }}</p>

            <h3>2. 타겟 인사이트 및 커뮤니케이션 방향</h3>
            <p>{{ draft.targetNm }}</p>

            <h3>3. 핵심 메시지 및 행동 전략</h3>
            <p>{{ draft.keyMessage || draft.requestTxt }}</p>

            <h3>4. 채널 전략 및 역할</h3>
            <p>{{ draft.recommendChannels }}</p>

            <h3>5. 콘텐츠 실행 계획</h3>
            <ul
              v-if="contentItems.length"
              class="marketing-campaign-plan-result__plan-list"
            >
              <li
                v-for="item in contentItems"
                :key="item.contentId"
              >
                {{ item.channelNm }} · {{ item.displayTitle }}
                <template v-if="item.scheduleLabel"> · {{ item.scheduleLabel }}</template>
              </li>
            </ul>
            <p v-else>채널별 콘텐츠는 이 기획서를 기준으로 생성합니다.</p>

            <h3>6. 비주얼 전략</h3>
            <p>{{ draft.visualTxt }}</p>

            <h3>7. 제작 가이드 및 리스크 관리</h3>
            <p>{{ draft.requestTxt }}</p>
          </article>
        </div>
      </section>

      <aside class="marketing-campaign-plan-result__aside">
        <div class="marketing-campaign-plan-result__tabs">
          <button
            type="button"
            :class="{ 'is-active': refineTab === 'chat' }"
            @click="refineTab = 'chat'"
          >
            AI와 대화하며 수정
          </button>
          <button
            type="button"
            :class="{ 'is-active': refineTab === 'prompt' }"
            @click="refineTab = 'prompt'"
          >
            프롬프트로 수정
          </button>
        </div>

        <div
          v-if="refineTab === 'chat'"
          class="marketing-campaign-plan-result__chat"
        >
          <div
            ref="chatListRef"
            class="marketing-campaign-plan-result__chat-list"
          >
            <p
              v-for="entry in chatLog"
              :key="entry.id"
              class="marketing-campaign-plan-result__bubble"
              :class="{ 'is-user': entry.role === 'user' }"
            >
              {{ entry.text }}
            </p>
          </div>
          <div class="marketing-campaign-plan-result__chat-bar">
            <UiInput
              v-model="chatDraft"
              placeholder="예) 추천 채널에 LinkedIn도 추가해주세요"
              size="sm"
              :disabled="isApplying"
              @enter="onSendChat"
            />
            <UiButton
              variant="primary"
              size="sm"
              :disabled="isApplying"
              @click="onSendChat"
            >
              전송
            </UiButton>
          </div>
        </div>

        <div
          v-else
          class="marketing-campaign-plan-result__prompt"
        >
          <UiTextarea
            v-model="promptDraft"
            placeholder="수정할 내용을 프롬프트로 입력해 주세요."
            :rows="8"
            border
            size="sm"
            :auto-resize="false"
            :disabled="isApplying"
          />
          <UiButton
            variant="primary"
            size="md"
            :disabled="isApplying"
            @click="onSendPrompt"
          >
            적용하기
          </UiButton>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiInput, UiTextarea } from '@leechanyong/ispark-ui'
import type { MarketingCampaignPlanContentItem, MarketingCampaignPlanDraft } from '~/types/marketing'

const props = withDefaults(
  defineProps<{
    projectNm?: string
    goal?: string
    productNm?: string
    requestTxt?: string
    targetNm?: string
    dueDateLabel?: string
    keyMessage?: string
    recommendChannels?: string
    visualTxt?: string
    visibilityLabel?: string
    heroImageUrl?: string
    contentItems?: MarketingCampaignPlanContentItem[]
  }>(),
  {
    projectNm: '',
    goal: '',
    productNm: '',
    requestTxt: '',
    targetNm: '',
    dueDateLabel: '',
    keyMessage: '',
    recommendChannels: '',
    visualTxt: '',
    visibilityLabel: '',
    heroImageUrl: '',
    contentItems: () => [],
  },
)

const emit = defineEmits<{
  close: []
  backToForm: []
  regenerate: []
  startContent: [payload: MarketingCampaignPlanDraft]
  refined: [payload: MarketingCampaignPlanDraft]
}>()

const CHANNEL_OPTIONS = [
  { re: /링크드인|linkedin/i, label: 'LinkedIn' },
  { re: /인스타(?:그램)?|instagram/i, label: 'Instagram' },
  { re: /페이스북|facebook/i, label: 'Facebook' },
  { re: /유튜브|youtube/i, label: 'YouTube' },
  { re: /이메일|email/i, label: 'Email' },
  { re: /카카오/i, label: 'Kakao' },
  { re: /sms|문자/i, label: 'SMS' },
  { re: /블로그|blog/i, label: 'Blog' },
  { re: /트위터|twitter|\bx\b/i, label: 'X' },
] as const

const draft = reactive<MarketingCampaignPlanDraft>({
  goal: props.goal,
  productNm: props.productNm,
  requestTxt: props.requestTxt,
  targetNm: props.targetNm,
  keyMessage: props.keyMessage,
  recommendChannels: props.recommendChannels,
  visualTxt: props.visualTxt,
})

const refineTab = ref<'chat' | 'prompt'>('chat')
const chatDraft = ref('')
const promptDraft = ref('')
const isApplying = ref(false)
const chatListRef = ref<HTMLElement | null>(null)
let chatSeq = 1
const chatLog = ref<{ id: number; role: 'assistant' | 'user'; text: string }[]>([])

const displayHeaderMeta = computed(() => {
  const projectNm = props.projectNm.trim() || '-'
  return `${projectNm} · 목적 ${draft.goal.trim() || '-'} · 대상 ${draft.targetNm.trim() || '-'} · 종료일 ${props.dueDateLabel || '-'} · 공개 대상 ${props.visibilityLabel || '-'}`
})

const hasChannel = (list: string, label: string) =>
  list.split(/[·,/|]/).some((part) => part.trim().toLowerCase() === label.toLowerCase())

const addChannel = (list: string, label: string) => {
  if (hasChannel(list, label)) return list
  return list.trim() ? `${list.trim()} · ${label}` : label
}

const pickChangedValue = (text: string, keywords: string[]) => {
  const key = keywords.join('|')
  const patterns = [
    new RegExp(`(?:${key})\\s*(?:고객|값)?\\s*[을를은는:]\\s*(.+?)(?:으로|로)\\s*(?:바꿔|바꾸어|변경|수정|해)`),
    new RegExp(`(?:${key})\\s*[:：]\\s*(.+)$`),
  ]
  for (const pattern of patterns) {
    const matched = text.match(pattern)
    const value = String(matched?.[1] ?? '')
      .replace(/\s*(주세요|줘)\.?$/, '')
      .trim()
    if (value) return value
  }
  return ''
}

const applyRefine = (request: string) => {
  const text = request.trim()
  const replies: string[] = []

  const addedChannels = CHANNEL_OPTIONS.filter((item) => item.re.test(text) && /추가|넣|포함/.test(text))
  addedChannels.forEach((item) => {
    const next = addChannel(draft.recommendChannels, item.label)
    if (next !== draft.recommendChannels) {
      draft.recommendChannels = next
      replies.push(`추천 채널에 ${item.label}을 추가했습니다.`)
    }
  })

  const nextGoal = pickChangedValue(text, ['목표', '목적'])
  if (nextGoal) {
    draft.goal = nextGoal
    replies.push(`캠페인 목표를 '${nextGoal}'(으)로 수정했습니다.`)
  }

  const nextTarget = pickChangedValue(text, ['타깃', '타겟', '대상'])
  if (nextTarget) {
    draft.targetNm = nextTarget
    replies.push(`타깃 고객을 '${nextTarget}'(으)로 수정했습니다.`)
  }

  const nextProduct = pickChangedValue(text, ['제품', '상품', '서비스'])
  if (nextProduct) {
    draft.productNm = nextProduct
    replies.push(`홍보 제품·서비스를 '${nextProduct}'(으)로 수정했습니다.`)
  }

  const nextMessage = pickChangedValue(text, ['핵심 메시지', '메시지'])
  if (nextMessage) {
    draft.keyMessage = nextMessage
    replies.push(`핵심 메시지를 수정했습니다.`)
  }

  const nextVisual = pickChangedValue(text, ['비주얼', '시각'])
  if (nextVisual) {
    draft.visualTxt = nextVisual
    replies.push('비주얼 전략을 수정했습니다.')
  }

  if (!replies.length) {
    draft.requestTxt = draft.requestTxt.trim() ? `${draft.requestTxt.trim()}\n${text}` : text
    replies.push('요청하신 내용을 제작 가이드에 반영했습니다.')
  }

  emit('refined', { ...draft })
  return replies.join(' ')
}

const scrollChatList = () => {
  nextTick(() => {
    const list = chatListRef.value
    if (!list) return
    list.scrollTop = list.scrollHeight
  })
}

const onSendChat = () => {
  const request = chatDraft.value.trim()
  if (!request) {
    openToast({ message: '수정할 내용을 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  isApplying.value = true
  chatLog.value.push({ id: chatSeq++, role: 'user', text: request })
  chatDraft.value = ''
  const reply = applyRefine(request)
  chatLog.value.push({ id: chatSeq++, role: 'assistant', text: reply })
  isApplying.value = false
  scrollChatList()
}

const onSendPrompt = () => {
  const request = promptDraft.value.trim()
  if (!request) {
    openToast({ message: '프롬프트를 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  isApplying.value = true
  applyRefine(request)
  promptDraft.value = ''
  isApplying.value = false
}

const onRegenerate = () => {
  emit('regenerate')
}

const onBackToForm = () => {
  emit('backToForm')
}

const onStartContent = () => {
  emit('startContent', { ...draft })
}

const onClose = () => {
  emit('close')
}
</script>

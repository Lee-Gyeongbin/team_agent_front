<template>
  <div class="marketing-campaign-plan-result">
    <button
      class="marketing-back-btn"
      type="button"
      @click="emit('close')"
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
        <h1 class="marketing-list-title">프로젝트 기획서</h1>
        <p class="marketing-list-desc">{{ displayHeaderMeta }}</p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="outline"
          size="md"
          @click="emit('regenerate')"
        >
          동일 조건으로 재생성
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('backToForm')"
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
            프로젝트 기획서
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
            <h2>{{ draft.productNm || projectNm }} 프로젝트 전략</h2>
            <p class="marketing-campaign-plan-result__period">{{ dueDateLabel }} · {{ draft.goal }}</p>

            <template
              v-for="section in draft.sections"
              :key="section.title"
            >
              <h3>{{ section.title }}</h3>
              <p>{{ section.body }}</p>
            </template>
          </article>
        </div>
      </section>

      <aside class="marketing-campaign-plan-result__aside">
        <UiTab
          v-model="refineTab"
          :tabs="REFINE_TABS"
        />

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
import { UiButton, UiIcon, UiInput, UiTab, UiTextarea } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingCampaignPlanDraft } from '~/types/marketing'

const props = withDefaults(
  defineProps<{
    projectNm?: string
    draft: MarketingCampaignPlanDraft
    dueDateLabel?: string
    visibilityLabel?: string
    heroImageUrl?: string
  }>(),
  {
    projectNm: '',
    dueDateLabel: '',
    visibilityLabel: '',
    heroImageUrl: '',
  },
)

const emit = defineEmits<{
  close: []
  backToForm: []
  regenerate: []
  startContent: [payload: MarketingCampaignPlanDraft]
  refined: [payload: MarketingCampaignPlanDraft]
}>()

const { handleRefineMarketingPlan } = useMarketingStore()

const REFINE_TABS = [
  { label: 'AI와 대화하며 수정', value: 'chat' },
  { label: '프롬프트로 수정', value: 'prompt' },
]

const refineTab = ref('chat')
const chatDraft = ref('')
const promptDraft = ref('')
const isApplying = ref(false)
const chatListRef = ref<HTMLElement | null>(null)
let chatSeq = 1
const chatLog = ref<{ id: number; role: 'assistant' | 'user'; text: string }[]>([])

const displayHeaderMeta = computed(() => {
  const projectNm = props.projectNm.trim() || '-'
  return `${projectNm} · 목적 ${props.draft.goal.trim() || '-'} · 대상 ${props.draft.targetNm.trim() || '-'} · 종료일 ${props.dueDateLabel || '-'} · 공개 대상 ${props.visibilityLabel || '-'}`
})

const scrollChatList = () => {
  nextTick(() => {
    const list = chatListRef.value
    if (!list) return
    list.scrollTop = list.scrollHeight
  })
}

const onSendChat = async () => {
  const request = chatDraft.value.trim()
  if (!request) {
    openToast({ message: '수정할 내용을 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  isApplying.value = true
  chatLog.value.push({ id: chatSeq++, role: 'user', text: request })
  chatDraft.value = ''
  scrollChatList()
  try {
    const plan = await handleRefineMarketingPlan(request)
    if (!plan) return
    emit('refined', plan)
    chatLog.value.push({ id: chatSeq++, role: 'assistant', text: '기획서를 수정했습니다.' })
    scrollChatList()
  } finally {
    isApplying.value = false
  }
}

const onSendPrompt = async () => {
  const request = promptDraft.value.trim()
  if (!request) {
    openToast({ message: '프롬프트를 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  isApplying.value = true
  try {
    const plan = await handleRefineMarketingPlan(request)
    if (!plan) return
    emit('refined', plan)
    promptDraft.value = ''
  } finally {
    isApplying.value = false
  }
}

const onStartContent = () => {
  emit('startContent', { ...props.draft })
}
</script>

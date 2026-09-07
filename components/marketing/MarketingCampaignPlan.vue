<template>
  <MarketingCampaignPlanResult
    v-if="isResultOpen"
    :project-nm="projectNm"
    :goal="goal"
    :product-nm="productNm"
    :request-txt="requestTxt"
    :target-nm="targetNm"
    :due-date-label="dueDateLabel"
    :key-message="keyMessageTxt"
    :recommend-channels="recommendChannelsTxt"
    :visual-txt="visualTxt"
    :visibility-label="visibilityLabel"
    :content-items="contentItems"
    :hero-image-url="heroImageUrl"
    @close="onClose"
    @back-to-form="onBackToForm"
    @regenerate="onGenerate"
    @start-content="onStartContent"
    @refined="onRefined"
  />

  <div
    v-else
    class="marketing-campaign-plan"
  >
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
        <h1 class="marketing-list-title">AI 캠페인 기획</h1>
        <p class="marketing-list-desc">필요한 정보만 입력하면 AI가 캠페인 기획서 초안을 만들어 줍니다.</p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="outline"
          size="md"
          @click="onSaveDraft"
        >
          임시 저장
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onGenerate"
        >
          AI 캠페인 기획 생성
          <template #icon-right>
            <UiIcon
              name="arrow-right"
              size="16"
            />
          </template>
        </UiButton>
      </div>
    </div>

    <div class="marketing-campaign-plan__layout">
      <section class="marketing-campaign-plan__card">
        <h2 class="marketing-campaign-plan__card-title">사용자 기본 입력</h2>

        <div
          ref="goalFieldRef"
          class="marketing-form-field"
        >
          <label class="marketing-form-label">캠페인 목표 <span class="marketing-req">*</span></label>
          <UiTextarea
            v-model="goal"
            placeholder="캠페인 목표를 입력해 주세요."
            :rows="3"
            border
            size="sm"
            :auto-resize="false"
          />
        </div>

        <div
          ref="productFieldRef"
          class="marketing-form-field"
        >
          <label class="marketing-form-label">홍보할 제품·서비스 <span class="marketing-req">*</span></label>
          <UiInput
            ref="productInputRef"
            v-model="productNm"
            placeholder="홍보할 제품·서비스를 입력해 주세요."
            size="sm"
          />
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">핵심 요청사항 (선택)</label>
          <UiTextarea
            v-model="requestTxt"
            placeholder="강조할 내용, 피해야 할 표현 등을 입력해 주세요."
            :rows="4"
            border
            size="sm"
            :auto-resize="false"
          />
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">타깃 고객</label>
          <UiInput
            v-model="targetNm"
            placeholder="타깃 고객을 입력해 주세요."
            size="sm"
          />
        </div>

        <p class="marketing-form-hint">톤앤매너, CTA, 추천 채널 등은 참고자료를 바탕으로 AI가 채웁니다.</p>
      </section>

      <section class="marketing-campaign-plan__card">
        <h2 class="marketing-campaign-plan__card-title">참고자료</h2>

        <div class="marketing-form-field">
          <label class="marketing-form-label">콘텐츠 참고자료 (문서)</label>
          <UiFileUpload
            v-model="contentFiles"
            hint="PDF, PPTX, DOCX 등 · 20MB까지 첨부 가능합니다."
            :max-size="20 * 1024 * 1024"
            :multiple="true"
          />
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">브랜드 참고자료 (문서)</label>
          <UiFileUpload
            v-model="brandFiles"
            hint="브랜드 가이드, 제품 소개서 · 20MB까지 첨부 가능합니다."
            :max-size="20 * 1024 * 1024"
            :multiple="true"
          />
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">이미지 참고자료 (선택)</label>
          <UiFileUpload
            v-model="imageFiles"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'webp']"
            hint="JPG, PNG, WEBP · 20MB까지 첨부 가능합니다."
            :max-size="20 * 1024 * 1024"
            :multiple="true"
          />
        </div>

        <div class="marketing-campaign-plan__note">
          <UiIcon
            name="info"
            size="16"
          />
          <p>소스 분석 에이전트가 참고자료를 먼저 분석한 뒤, 캠페인 기획 에이전트가 초안을 작성합니다.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiFileUpload, UiIcon, UiInput, UiTextarea } from '@leechanyong/ispark-ui'
import type { MarketingCampaignPlanContentItem, MarketingCampaignPlanDraft } from '~/types/marketing'

const props = withDefaults(
  defineProps<{
    projectNm?: string
    goal?: string
    targetNm?: string
    dueDateLabel?: string
    visibilityLabel?: string
    keyMessage?: string
    recommendChannels?: string
    contentItems?: MarketingCampaignPlanContentItem[]
  }>(),
  {
    projectNm: '',
    goal: '',
    targetNm: '',
    dueDateLabel: '',
    visibilityLabel: '',
    keyMessage: '',
    recommendChannels: '',
    contentItems: () => [],
  },
)

const emit = defineEmits<{
  close: []
  startContent: [payload: MarketingCampaignPlanDraft]
}>()

const isResultOpen = ref(false)

const goal = ref(props.goal)
const productNm = ref(props.projectNm)
const requestTxt = ref(props.keyMessage)
const targetNm = ref(props.targetNm)
const keyMessageTxt = ref(props.keyMessage)
const recommendChannelsTxt = ref(props.recommendChannels)
const visualTxt = ref('')

const contentFiles = ref<File[]>([])
const brandFiles = ref<File[]>([])
const imageFiles = ref<File[]>([])
const heroImageUrl = ref('')

const goalFieldRef = ref<HTMLElement | null>(null)
const productFieldRef = ref<HTMLElement | null>(null)
const productInputRef = ref<{ focus: () => void } | null>(null)

const revokeHeroImage = () => {
  if (heroImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(heroImageUrl.value)
  heroImageUrl.value = ''
}

const focusField = (fieldEl: HTMLElement | null, input?: { focus: () => void } | null) => {
  fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  if (input) {
    input.focus()
    return
  }
  fieldEl?.querySelector<HTMLElement>('textarea')?.focus()
}

const onSaveDraft = () => {
  openToast({ message: '기획서 임시 저장 API가 없습니다.', type: 'warning' })
}

const onGenerate = () => {
  if (!goal.value.trim()) {
    openToast({ message: '캠페인 목표를 입력해 주세요.', type: 'warning' })
    focusField(goalFieldRef.value)
    return
  }
  if (!productNm.value.trim()) {
    openToast({ message: '홍보할 제품·서비스를 입력해 주세요.', type: 'warning' })
    focusField(productFieldRef.value, productInputRef.value)
    return
  }
  revokeHeroImage()
  const imageFile = imageFiles.value[0]
  if (imageFile) heroImageUrl.value = URL.createObjectURL(imageFile)
  isResultOpen.value = true
}

const onBackToForm = () => {
  isResultOpen.value = false
}

const onRefined = (payload: MarketingCampaignPlanDraft) => {
  goal.value = payload.goal
  productNm.value = payload.productNm
  requestTxt.value = payload.requestTxt
  targetNm.value = payload.targetNm
  keyMessageTxt.value = payload.keyMessage
  recommendChannelsTxt.value = payload.recommendChannels
  visualTxt.value = payload.visualTxt
}

const onStartContent = (payload: MarketingCampaignPlanDraft) => {
  emit('startContent', payload)
  revokeHeroImage()
}

const onClose = () => {
  revokeHeroImage()
  emit('close')
}
</script>

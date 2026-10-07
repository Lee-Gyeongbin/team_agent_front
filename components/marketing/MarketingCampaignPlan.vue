<template>
  <div
    v-if="isGeneratingPlan"
    class="marketing-campaign-plan-preparing"
  >
    <MarketingPreparingStatus />
  </div>

  <MarketingCampaignPlanResult
    v-else-if="isResultOpen"
    :project-nm="projectNm"
    :draft="form"
    :due-date-label="dueDateLabel"
    :visibility-label="visibilityLabel"
    :hero-image-url="heroImageUrl"
    @close="onClose"
    @back-to-form="isResultOpen = false"
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
        <h1 class="marketing-list-title">AI 프로젝트 기획</h1>
        <p class="marketing-list-desc">필요한 정보만 입력하면 AI가 프로젝트 기획서 초안을 만들어 줍니다.</p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="primary"
          size="md"
          :disabled="isGeneratingPlan"
          @click="onGenerate"
        >
          AI 프로젝트 기획서 생성
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
          <label class="marketing-form-label">프로젝트 목표 <span class="marketing-req">*</span></label>
          <UiTextarea
            v-model="form.goal"
            placeholder="프로젝트 목표를 입력해 주세요."
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
            v-model="form.productNm"
            placeholder="홍보할 제품·서비스를 입력해 주세요."
            size="sm"
          />
        </div>

        <div class="marketing-form-field">
          <label class="marketing-form-label">핵심 요청사항 (선택)</label>
          <UiTextarea
            v-model="form.requestTxt"
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
            v-model="form.targetNm"
            placeholder="타깃 고객을 입력해 주세요."
            size="sm"
          />
        </div>

        <p class="marketing-form-hint">톤앤매너, CTA, 추천 채널 등은 참고자료를 바탕으로 AI가 채웁니다.</p>
      </section>

      <section class="marketing-campaign-plan__card">
        <h2 class="marketing-campaign-plan__card-title">참고자료</h2>

        <div
          v-for="item in PLAN_FILE_SLOTS"
          :key="item.slot"
          class="marketing-form-field"
        >
          <label class="marketing-form-label">{{ item.label }}</label>
          <UiFileUpload
            v-model="filesBySlot[item.slot]"
            :attached-file-list="filesOf(item.slot).map(toFileItem)"
            :accept="PLAN_FILE_ACCEPT"
            :allowed-extensions="PLAN_FILE_EXTENSIONS"
            :hint="PLAN_FILE_HINT"
            :max-size="PLAN_FILE_MAX_SIZE"
            :multiple="true"
            @remove-attached-file="onRemoveAttached"
          />
        </div>

        <div class="marketing-campaign-plan__note">
          <UiIcon
            name="info"
            size="16"
          />
          <p>소스 분석 에이전트가 참고자료를 먼저 분석한 뒤, 프로젝트 기획 에이전트가 초안을 작성합니다.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiInput, UiTextarea } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingCampaignPlanDraft, MarketingCampaignPlanSection, MarketingFile } from '~/types/marketing'
import { marketingFilePurposes } from '~/types/marketing'
import type { FileItem } from '~/types/repository'

const { handleUploadProjectFiles, handleRemoveProjectFile, handleGenerateMarketingPlan, projectFiles } =
  useMarketingStore()

/** 참고자료 칸. 파일은 filePurposeCd(001 / 002 / 003)로 나눈다 */
type PlanFileSlot = (typeof marketingFilePurposes)[number]['purposeNm']

const PLAN_FILE_SLOT_LABEL: Record<PlanFileSlot, string> = {
  content: '콘텐츠 참고자료 (문서)',
  brand: '브랜드 참고자료 (문서)',
  image: '이미지 참고자료 (선택)',
}

const PLAN_FILE_SLOTS = marketingFilePurposes.map((item) => ({
  slot: item.purposeNm,
  filePurposeCd: item.filePurposeCd,
  label: PLAN_FILE_SLOT_LABEL[item.purposeNm],
}))

const PLAN_FILE_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'hwp',
  'csv',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
]
const PLAN_FILE_ACCEPT = PLAN_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(',')
const PLAN_FILE_HINT = 'PDF, DOCX, TXT, JPG 등 · 20MB까지 첨부 가능합니다.'
const PLAN_FILE_MAX_SIZE = 20 * 1024 * 1024

const toFileItem = (file: MarketingFile): FileItem => ({
  docFileId: file.marketingFileId,
  fileName: file.fileName,
  filePath: file.filePath,
  fileSize: String(file.fileSize),
  fileType: file.fileType,
})

const filesBySlot = reactive<Record<PlanFileSlot, File[]>>({
  content: [],
  brand: [],
  image: [],
})

const filePurposeCdOf = (slot: PlanFileSlot) => PLAN_FILE_SLOTS.find((item) => item.slot === slot)?.filePurposeCd

const filesOf = (slot: PlanFileSlot) => {
  const filePurposeCd = filePurposeCdOf(slot)
  return projectFiles.value.filter((file) => file.filePurposeCd === filePurposeCd)
}

const onRemoveAttached = async (file: FileItem) => {
  if (!file.docFileId) return
  await handleRemoveProjectFile(file.docFileId)
}

const props = withDefaults(
  defineProps<{
    projectNm?: string
    productNm?: string
    goal?: string
    targetNm?: string
    dueDateLabel?: string
    visibilityLabel?: string
    keyMessage?: string
    recommendChannels?: string
    requestTxt?: string
    visualTxt?: string
    sections?: MarketingCampaignPlanSection[]
    startInResult?: boolean
  }>(),
  {
    projectNm: '',
    productNm: '',
    goal: '',
    targetNm: '',
    dueDateLabel: '',
    visibilityLabel: '',
    keyMessage: '',
    recommendChannels: '',
    requestTxt: '',
    visualTxt: '',
    sections: () => [],
    startInResult: false,
  },
)

const emit = defineEmits<{
  close: []
  generated: [payload: MarketingCampaignPlanDraft]
  startContent: [payload: MarketingCampaignPlanDraft]
}>()

const isResultOpen = ref(props.startInResult)
const isGeneratingPlan = ref(false)

const form = reactive<MarketingCampaignPlanDraft>({
  goal: props.goal,
  productNm: props.productNm,
  requestTxt: props.requestTxt,
  targetNm: props.targetNm,
  keyMessage: props.keyMessage,
  recommendChannels: props.recommendChannels,
  visualTxt: props.visualTxt,
  sections: props.sections,
})

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

/** 칸별 첨부파일을 올린다. 실패한 파일은 해당 칸에 남긴다 */
const uploadNewReferenceFiles = async () => {
  for (const { slot, filePurposeCd } of PLAN_FILE_SLOTS) {
    const pending = filesBySlot[slot]
    if (!pending.length) continue
    const uploaded = await handleUploadProjectFiles(pending, filePurposeCd)
    const succeeded = new Set(uploaded.map((item) => item.file))
    filesBySlot[slot] = pending.filter((file) => !succeeded.has(file))
  }
}

const applyDraftToForm = (draft: MarketingCampaignPlanDraft) => {
  Object.assign(form, draft)
}

const onGenerate = async () => {
  if (!form.goal.trim()) {
    openToast({ message: '프로젝트 목표를 입력해 주세요.', type: 'warning' })
    focusField(goalFieldRef.value)
    return
  }
  if (!form.productNm.trim()) {
    openToast({ message: '홍보할 제품·서비스를 입력해 주세요.', type: 'warning' })
    focusField(productFieldRef.value, productInputRef.value)
    return
  }
  if (isGeneratingPlan.value) return

  const pendingFiles = PLAN_FILE_SLOTS.flatMap((item) => filesBySlot[item.slot])
  const previewImage = pendingFiles.find((file) => file.type.startsWith('image/'))
  if (previewImage) {
    revokeHeroImage()
    heroImageUrl.value = URL.createObjectURL(previewImage)
  } else if (!projectFiles.value.length) {
    revokeHeroImage()
  }

  isGeneratingPlan.value = true
  try {
    await uploadNewReferenceFiles()
    if (PLAN_FILE_SLOTS.some(({ slot }) => filesBySlot[slot].length > 0)) return
    const plan = await handleGenerateMarketingPlan({
      goal: form.goal.trim(),
      productNm: form.productNm.trim(),
      requestTxt: form.requestTxt.trim(),
      targetNm: form.targetNm.trim(),
      contentFileIds: filesOf('content').map((file) => file.marketingFileId),
      brandFileIds: filesOf('brand').map((file) => file.marketingFileId),
      imageFileIds: filesOf('image').map((file) => file.marketingFileId),
    })
    if (!plan) return
    applyDraftToForm(plan)
    emit('generated', plan)
    isResultOpen.value = true
  } finally {
    isGeneratingPlan.value = false
  }
}

const onRefined = (payload: MarketingCampaignPlanDraft) => {
  applyDraftToForm(payload)
  emit('generated', payload)
}

const onStartContent = (payload: MarketingCampaignPlanDraft) => {
  emit('startContent', payload)
  revokeHeroImage()
}

const onClose = () => {
  revokeHeroImage()
  emit('close')
}

onUnmounted(() => {
  revokeHeroImage()
})
</script>

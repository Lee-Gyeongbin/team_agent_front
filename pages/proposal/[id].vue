<template>
  <div class="pt-detail-page">
    <!-- 헤더 -->
    <div class="pt-detail-head">
      <button
        class="pt-back-btn"
        @click="router.push('/proposal')"
      >
        <i class="icon-arrow-left-sm size-16" />
        PT 제안서
      </button>
      <span class="pt-detail-head-divider" />
      <div
        v-if="currentProject"
        class="pt-detail-title-wrap"
      >
        <span class="pt-detail-org">{{ currentProject.orgNm }}</span>
        <h2 class="pt-detail-title">{{ currentProject.projectNm }}</h2>
      </div>
    </div>

    <!-- 5단계 스텝바 -->
    <ProposalStepper
      :steps="steps"
      :max-unlocked-step="maxUnlockedStep"
      @go-step="onGoStep"
    />

    <!-- 단계별 콘텐츠 -->
    <div class="pt-step-content">
      <ProposalStepA
        v-if="currentStep === 0"
        :pt-project-id="ptProjectId"
        :project-config-json="currentProject?.projectConfigJson"
        @next="onAdvance"
      />
      <ProposalStepB
        v-else-if="currentStep === 1"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        :writing-guideline-json="currentProject?.writingGuidelineJson"
        :toc-list="tocList"
        :is-loading="isTocLoading"
        @next="onAdvance"
        @auto-extract="handleAutoExtractToc"
        @add-item="handleAddTocItem"
        @delete-item="handleDeleteTocItem"
        @update-title="handleUpdateTocTitle"
      />
      <ProposalStepC
        v-else-if="currentStep === 2"
        :pt-project-id="ptProjectId"
        @next="onAdvance"
      />
      <ProposalStepE
        v-else-if="currentStep === 3"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        :project-nm="currentProject?.projectNm"
        :org-nm="currentProject?.orgNm"
        :doc-size="docSize"
        @next="onAdvance"
      />
      <ProposalStepD
        v-else-if="currentStep === 4"
        :section-list="sectionList"
        :raw-toc-list="rawTocList"
        :slides-cache="slidesCache"
        :active-section="activeSection"
        :active-section-index="activeSectionIndex"
        :current-messages="currentMessages"
        :is-sending="isSending"
        :is-generating="isGenerating"
        :gen-progress-msg="genProgressMsg"
        :current-slides="currentSlides"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        @select-section="goToSection"
        @prev-section="goToPrevSection"
        @confirm-section="onConfirmSection"
        @send-chat="handleSendMessage"
        @generate-section="onGenerateSection"
        @slides-updated="onSlidesUpdated"
      />
      <ProposalStepF
        v-else-if="currentStep === 5"
        :pt-project-id="ptProjectId"
        :agent-id="agentId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtStep, PtProject, PtSlide } from '~/types/proposal'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalSections } from '~/composables/proposal/useProposalSections'
import { useProposalSectionChat } from '~/composables/proposal/useProposalSectionChat'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { PT_PROPOSAL_DEFAULT_AGENT_ID, PT_PROPOSAL_DEFAULT_MODEL_ID } from '~/utils/proposal/proposalLlmUtil'

const route = useRoute()
const router = useRouter()

const ptProjectId = computed(() => String(route.params.id))

// ---- LLM 모델 / 에이전트 설정 ----
// 상세 페이지 공통 설정 — Step B/D 등 하위 스텝에 props로 전달
// TODO: 프로젝트 설정 조회 또는 생성 시 선택값으로 교체
const modelId = ref(PT_PROPOSAL_DEFAULT_MODEL_ID)
const agentId = ref(PT_PROPOSAL_DEFAULT_AGENT_ID)

// ---- 프로젝트 ----
const currentProject = ref<PtProject | null>(null)

const docSize = computed<'169' | '43' | 'a4'>(() => {
  try {
    const cfg = JSON.parse(currentProject.value?.projectConfigJson ?? '{}')
    const val = cfg?.template?.docSize
    if (val === '169' || val === '43' || val === 'a4') return val
  } catch { /* ignore */ }
  return '169'
})

// ---- 스텝바 ----
const STEP_DEFS = [
  { key: 'template' as const, label: '템플릿', sub: '보완/생성' },
  { key: 'toc' as const, label: '목차', sub: 'TOC 구성' },
  { key: 'settings' as const, label: '설정', sub: '자료·스타일·컬러' },
  { key: 'template-gen' as const, label: '템플릿 생성', sub: '헤더·푸터 레이아웃' },
  { key: 'generate' as const, label: '본문 생성', sub: '소목차별 순차 진행' },
  { key: 'export' as const, label: '출력', sub: 'PDF 추출' },
]

const currentStep = ref(0)
const maxUnlockedStep = ref(0)

const steps = computed<PtStep[]>(() =>
  STEP_DEFS.map((def, idx) => ({
    ...def,
    status: idx < currentStep.value ? 'done' : idx === currentStep.value ? 'current' : 'wait',
  })),
)

const onGoStep = (idx: number) => {
  currentStep.value = idx
  onStepChanged(idx)
}

const onAdvance = () => {
  const next = Math.min(currentStep.value + 1, STEP_DEFS.length - 1)
  currentStep.value = next
  maxUnlockedStep.value = Math.max(maxUnlockedStep.value, next)
  // Step B(→2) 등 자체 저장 API 없는 단계 커버 (A·C·D는 서버에서 이미 처리, GREATEST로 중복 무해)
  fetchUpdateMaxStepNo(ptProjectId.value, next)
  onStepChanged(next)
}

// D-0: Stage2 전략분석 1회 자동 실행 여부
const stage2Triggered = ref(false)

const { fetchSelectPtProject, streamAnalyzeStage2, fetchUpdateMaxStepNo } = useProposalApi()

const STAGE2_STEP_MESSAGES: Record<string, string> = {
  analyze: '전략 분석을 수행하는 중...',
}

const runStage2 = () => {
  if (stage2Triggered.value) return
  stage2Triggered.value = true
  openLoading({ text: '전략 분석을 시작하는 중...' })
  streamAnalyzeStage2(ptProjectId.value, modelId.value, agentId.value, {
    onProgress: (data) => {
      const msg = STAGE2_STEP_MESSAGES[data.step]
      if (msg) updateLoadingText(msg)
    },
    onDone: (data) => {
      closeLoading()
      if (!data.skipped) {
        console.warn('[Stage2] 전략분석 완료:', data)
      }
    },
    onError: (msg) => {
      closeLoading()
      console.warn('[Stage2] 전략분석 실패:', msg)
      // 재실행 허용 (실패 시 다음 진입에서 재시도 가능하도록)
      stage2Triggered.value = false
    },
  })
}

const onStepChanged = (step: number) => {
  if (step === 1) handleSelectTocList()
  if (step === 4) {
    handleSelectSectionList()
    runStage2()
  }
}

// ---- TOC ----
const {
  tocList,
  isLoading: isTocLoading,
  handleSelectTocList,
  handleAutoExtractToc,
  handleAddTocItem,
  handleDeleteTocItem,
  handleUpdateTocTitle,
} = useProposalToc(ptProjectId)

// ---- 소목차 생성 ----
const {
  sectionList,
  rawTocList,
  activeSection,
  activeSectionIndex,
  isGenerating,
  genProgressMsg,
  slidesCache,
  handleSelectSectionList,
  handleSelectSlides,
  handleGenerateSection,
  handleConfirmSection,
  goToSection,
  goToPrevSection,
} = useProposalSections(ptProjectId)

// 현재 활성 소목차의 슬라이드 목록
const currentSlides = computed<PtSlide[]>(() => {
  const tocId = activeSection.value?.tocId
  if (!tocId) return []
  return slidesCache.value[tocId] ?? []
})

// ---- 소목차별 채팅 ----
const activeSectionId = computed(() => activeSection.value?.sectionId ?? '')

const onSlidesUpdated = (slides: PtSlide[]) => {
  const tocId = activeSection.value?.tocId
  if (tocId) slidesCache.value[tocId] = slides
}

const { currentMessages, isSending, handleSendMessage } = useProposalSectionChat(
  ptProjectId,
  activeSectionId,
  modelId,
  agentId,
  onSlidesUpdated,
)

// D-1: 슬라이드 생성 → onDone 내부에서 handleSelectSlides(tocId) 자동 호출로 slidesCache 갱신
const onGenerateSection = async (tocId: string) => {
  try {
    await handleGenerateSection(tocId, modelId.value, agentId.value)
  } catch {
    // 오류는 useProposalSections 내부에서 openToast 처리
  }
}

const onConfirmSection = async (sectionId: string) => {
  const allDone = await handleConfirmSection(sectionId)
  if (allDone) {
    // 모든 소목차 완료 → 출력 단계(Step F)로 자동 이동
    onAdvance()
  }
}

// ---- 초기 로드 ----
onMounted(async () => {
  const res = await fetchSelectPtProject(ptProjectId.value)
  if (res.result === 'OK') {
    currentProject.value = res.data
    // 저장된 최대 단계로 복원 (없으면 0)
    const savedStep = res.data.maxStepNo ?? 0
    maxUnlockedStep.value = savedStep
    currentStep.value = savedStep
    onStepChanged(savedStep)
  }
})
</script>

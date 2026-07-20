<template>
  <div class="pt-detail-page">
    <!-- 헤더 -->
    <div class="pt-detail-head">
      <button
        class="pt-back-btn"
        @click="router.push('/proposal')"
      >
        <i class="icon-arrow-left size-16" />
        PT 제안서
      </button>
      <div
        v-if="currentProject"
        class="pt-detail-info"
      >
        <div class="pt-detail-org">{{ currentProject.orgNm }}</div>
        <div class="pt-detail-title">{{ currentProject.projectNm }}</div>
      </div>
    </div>

    <!-- 6단계 스텝바 -->
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
        @next="onAdvance"
      />
      <ProposalStepB
        v-else-if="currentStep === 1"
        :pt-project-id="ptProjectId"
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
      <ProposalStepD
        v-else-if="currentStep === 3"
        :section-list="sectionList"
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
        @prev-section="goToPrevSection"
        @confirm-section="onConfirmSection"
        @send-chat="handleSendMessage"
        @generate-section="onGenerateSection"
        @slides-updated="onSlidesUpdated"
      />
      <ProposalStepE
        v-else-if="currentStep === 4"
        :section-list="sectionList"
        :pt-project-id="ptProjectId"
        @next="onAdvance"
      />
      <ProposalStepF
        v-else-if="currentStep === 5"
        :pt-project-id="ptProjectId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtStep, PtProject, PtSlide } from '~/types/proposal'
import { useProposalProjectsStore } from '~/composables/proposal/useProposalProjectsStore'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalSections } from '~/composables/proposal/useProposalSections'
import { useProposalSectionChat } from '~/composables/proposal/useProposalSectionChat'
import { useProposalApi } from '~/composables/proposal/useProposalApi'

const route = useRoute()
const router = useRouter()

const ptProjectId = computed(() => String(route.params.id))

// ---- LLM 모델 / 에이전트 설정 ----
// 프로젝트 설정(Step C)에서 사용한 모델·에이전트를 여기서 관리
// 실제 값은 프로젝트 설정 조회 또는 에이전트 목록에서 로드해야 함
const modelId = ref('')
const agentId = ref('')

// ---- 프로젝트 ----
const { ptProjectList, handleSelectPtProjectList } = useProposalProjectsStore()
const currentProject = computed<PtProject | null>(
  () => ptProjectList.value.find((p) => p.ptProjectId === ptProjectId.value) ?? null,
)

// ---- 스텝바 ----
const STEP_DEFS = [
  { key: 'template' as const, label: '템플릿', sub: '보완/생성' },
  { key: 'toc' as const, label: '목차', sub: 'TOC 구성' },
  { key: 'settings' as const, label: '설정', sub: '자료·스타일·컬러' },
  { key: 'generate' as const, label: '본문 생성', sub: '소목차별 순차 진행' },
  { key: 'review' as const, label: '검토', sub: '전체 확인·보완' },
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
  onStepChanged(next)
}

// D-0: Stage2 전략분석 1회 자동 실행 여부
const stage2Triggered = ref(false)

const { streamAnalyzeStage2 } = useProposalApi()

const runStage2 = () => {
  if (stage2Triggered.value) return
  stage2Triggered.value = true
  streamAnalyzeStage2(ptProjectId.value, modelId.value, agentId.value, {
    onDone: (data) => {
      if (!data.skipped) {
        console.warn('[Stage2] 전략분석 완료:', data)
      }
    },
    onError: (msg) => {
      console.warn('[Stage2] 전략분석 실패:', msg)
      // 재실행 허용 (실패 시 다음 진입에서 재시도 가능하도록)
      stage2Triggered.value = false
    },
  })
}

const onStepChanged = (step: number) => {
  if (step === 1) handleSelectTocList()
  if (step === 3) {
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
  activeSection,
  activeSectionIndex,
  isGenerating,
  genProgressMsg,
  slidesCache,
  handleSelectSectionList,
  handleSelectSlides,
  handleGenerateSection,
  handleConfirmSection,
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
    // 모든 소목차 완료 → 검토 단계(Step E)로 자동 이동
    onAdvance()
  }
}

// ---- 초기 로드 ----
onMounted(async () => {
  await handleSelectPtProjectList()
  onStepChanged(currentStep.value)
})
</script>

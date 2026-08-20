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

    <!-- 8단계 스텝바 -->
    <ProposalStepper
      :steps="steps"
      :max-unlocked-step="maxUnlockedStep"
      @go-step="onGoStep"
    />

    <!-- 단계별 콘텐츠 -->
    <!-- 0요구사항 → 1자사·경쟁사 → 2전략검토 → 3세부목차 → 4템플릿설정 → 5템플릿생성 → 6본문생성 → 7출력 -->
    <div class="pt-step-content">
      <ProposalStepRequirements
        v-if="currentStep === 0"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        :writing-guideline-json="currentProject?.writingGuidelineJson"
        :focus-tab="requirementsFocusTab"
        :focus-id="requirementsFocusId"
        @next="onAdvance"
        @focus-cleared="clearRequirementsFocus"
      />
      <ProposalStepCompanyInfo
        v-else-if="currentStep === 1"
        :pt-project-id="ptProjectId"
        @next="onAdvance"
      />
      <ProposalStepStrategy
        v-else-if="currentStep === 2"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        @next="onAdvance"
        @go-requirements="onGoRequirementsDeepLink"
      />
      <ProposalStepToc
        v-else-if="currentStep === 3"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        @next="onAdvance"
      />
      <ProposalStepTemplateConfig
        v-else-if="currentStep === 4"
        :pt-project-id="ptProjectId"
        :project-config-json="currentProject?.projectConfigJson"
        @next="onAdvance"
      />
      <ProposalStepTemplateGen
        v-else-if="currentStep === 5"
        :pt-project-id="ptProjectId"
        :model-id="modelId"
        :agent-id="agentId"
        :project-nm="currentProject?.projectNm"
        :org-nm="currentProject?.orgNm"
        :doc-size="docSize"
        @next="onAdvance"
      />
      <ProposalStepGenerate
        v-else-if="currentStep === 6"
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
        @update-planned-slide-cnt="onUpdatePlannedSlideCnt"
      />
      <ProposalStepExport
        v-else-if="currentStep === 7"
        :pt-project-id="ptProjectId"
        :agent-id="agentId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PtStep, PtStepKey, PtProject, PtSlide } from '~/types/proposal'
import { useProposalToc } from '~/composables/proposal/useProposalToc'
import { useProposalSections } from '~/composables/proposal/useProposalSections'
import { useProposalSectionChat } from '~/composables/proposal/useProposalSectionChat'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { PT_PROPOSAL_DEFAULT_AGENT_ID, PT_PROPOSAL_DEFAULT_MODEL_ID } from '~/utils/proposal/proposalLlmUtil'

const route = useRoute()
const router = useRouter()

const ptProjectId = computed(() => String(route.params.id))

// ---- LLM 모델 / 에이전트 설정 ----
// 상세 페이지 공통 설정 — Requirements/Generate 등 하위 스텝에 props로 전달
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
  } catch {
    console.error('docSize 조회 오류: 기본값 169 적용')
  }
  return '169'
})

// ---- 스텝바 ----
// 0요구사항 → 1자사·경쟁사 → 2전략검토 → 3세부목차 → 4템플릿설정 → 5템플릿생성 → 6본문생성 → 7출력
const STEP_DEFS: { key: PtStepKey; label: string; sub: string }[] = [
  { key: 'requirements', label: '요구사항·평가기준·현황이슈', sub: 'TOC / 요구사항 / 평가기준 / 현황이슈' },
  { key: 'company-info', label: '자사·경쟁사 정보', sub: '자사 / 경쟁사 / 참고자료' },
  { key: 'strategy', label: '전략검토', sub: '문제정의 / Win Theme' },
  { key: 'detail-toc', label: '세부목차', sub: '세부 슬라이드 구성' },
  { key: 'template-config', label: '템플릿 설정', sub: '생성방식 / 사이즈 / 제안대상 / 스타일' },
  { key: 'template-gen', label: '템플릿 생성', sub: '헤더·푸터 레이아웃' },
  { key: 'generate', label: '본문 생성', sub: '소목차별 순차 진행' },
  { key: 'export', label: '출력', sub: 'PDF 추출' },
]

const currentStep = ref(0)
const maxUnlockedStep = ref(0)

/** Requirements 딥링크 (전략검토 source 배지 → 요구사항/이슈 탭, 스텝 0으로 이동) */
const requirementsFocusTab = ref<'toc' | 'req' | 'ec' | 'issue' | null>(null)
const requirementsFocusId = ref<string | null>(null)
const clearRequirementsFocus = () => {
  requirementsFocusTab.value = null
  requirementsFocusId.value = null
}
const onGoRequirementsDeepLink = (payload: { tab: 'toc' | 'req' | 'ec' | 'issue'; id?: string }) => {
  requirementsFocusTab.value = payload.tab
  requirementsFocusId.value = payload.id ?? null
  onGoStep(0)
}

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
  // Requirements 등 자체 저장 API 없는 단계 커버 (서버 GREATEST로 중복 무해)
  fetchUpdateMaxStepNo(ptProjectId.value, next)
  onStepChanged(next)
}

const { fetchSelectPtProject, fetchUpdateMaxStepNo } = useProposalApi()

const onStepChanged = (step: number) => {
  if (step === 0) handleSelectTocList()
  // 본문생성(6): 섹션 목록만 로드 — Stage2는 전략검토(2)에서 처리
  if (step === 6) handleSelectSectionList()
}

// ---- TOC (Requirements 진입 시 선행 로드; 상세 CRUD는 ProposalStepRequirements 내부) ----
const { handleSelectTocList } = useProposalToc(ptProjectId)

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
  handleUpdatePlannedSlideCnt,
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

// E-1: 슬라이드 생성 → onDone 내부에서 handleSelectSlides(tocId) 자동 호출로 slidesCache 갱신
const onGenerateSection = async (tocId: string) => {
  try {
    await handleGenerateSection(tocId, modelId.value, agentId.value)
  } catch {
    // 오류는 useProposalSections 내부에서 openToast 처리
  }
}

const onUpdatePlannedSlideCnt = async (payload: { tocId: string; oldCnt: number; newCnt: number }) => {
  const hasSlides = (slidesCache.value[payload.tocId]?.length ?? 0) > 0
  try {
    await handleUpdatePlannedSlideCnt(
      payload.tocId,
      payload.oldCnt,
      payload.newCnt,
      hasSlides,
      modelId.value,
      agentId.value,
    )
  } catch {
    // 오류는 useProposalSections 내부에서 openToast 처리
  }
}

const onConfirmSection = async (sectionId: string) => {
  const allDone = await handleConfirmSection(sectionId)
  if (allDone) {
    // 모든 소목차 완료 → 출력 단계(Export)로 자동 이동
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

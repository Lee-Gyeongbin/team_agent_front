<template>
  <div class="pt-list-page">
    <!-- 헤더 -->
    <div class="pt-list-header">
      <h1 class="pt-list-title">PT 제안서</h1>
      <UiButton
        variant="primary"
        size="md"
        @click="isNewModalOpen = true"
      >
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        새 PT 제안
      </UiButton>
    </div>

    <!-- 필터 칩 -->
    <div class="pt-filter-chips">
      <button
        v-for="chip in FILTER_CHIPS"
        :key="chip.value"
        :class="['pt-filter-chip', { 'is-active': filterStatusCd === chip.value }]"
        @click="onFilterChange(chip.value)"
      >
        {{ chip.label }}
      </button>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingList"
      class="pt-card-grid"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="pt-card is-skeleton"
      >
        <UiSkeleton
          height="16px"
          width="50%"
          style="margin-bottom: 8px"
        />
        <UiSkeleton
          height="20px"
          width="80%"
          style="margin-bottom: 6px"
        />
        <UiSkeleton
          height="14px"
          width="60%"
        />
      </div>
    </div>

    <!-- 카드 그리드 -->
    <div
      v-else-if="ptProjectList.length > 0"
      class="pt-card-grid"
    >
      <div
        v-for="project in ptProjectList"
        :key="project.ptProjectId"
        class="pt-card"
        @click="onClickCard(project)"
      >
        <span :class="['pt-status-badge', `status-${project.statusCd}`]">{{ project.statusNm }}</span>
        <div class="pt-card-title">{{ project.projectNm }}</div>
        <div class="pt-card-meta">
          {{ project.orgNm }}
          <template v-if="project.dueDt"> · 마감 {{ project.dueDt }}</template>
          <template v-else> · {{ project.modifyDt }}</template>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmpty
      v-else
      icon="icon-document"
      title="PT 제안서가 없습니다."
    >
      <UiButton
        variant="primary"
        size="md"
        @click="isNewModalOpen = true"
      >
        새 PT 제안 시작
      </UiButton>
    </UiEmpty>

    <!-- 신규 생성 모달 -->
    <ProposalNewModal
      :is-open="isNewModalOpen"
      :is-saving="isSaving"
      @close="isNewModalOpen = false"
      @submit="onCreateProject"
    />
  </div>
</template>

<script setup lang="ts">
import type { PtProject } from '~/types/proposal'
import { useProposalProjectsStore } from '~/composables/proposal/useProposalProjectsStore'

const router = useRouter()

const FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'PT000001', label: '작성중' },
  { value: 'PT000002', label: '검토중' },
  { value: 'PT000003', label: '완료' },
]

const { ptProjectList, isLoadingList, handleSelectPtProjectList, handleSavePtProject } = useProposalProjectsStore()

const filterStatusCd = ref('')
const isNewModalOpen = ref(false)
const isSaving = ref(false)

const onFilterChange = (statusCd: string) => {
  filterStatusCd.value = statusCd
  void handleSelectPtProjectList({ statusCd })
}

const onClickCard = (project: PtProject) => {
  router.push(`/proposal/${project.ptProjectId}`)
}

const onCreateProject = async (form: {
  projectNm: string
  orgNm: string
  summary: string
  targetTypeCd: 'G' | 'P'
  dueDt: string
}) => {
  isSaving.value = true
  try {
    const ptProjectId = await handleSavePtProject(form)
    isNewModalOpen.value = false
    // 생성 후 상세 화면 Step A로 이동
    router.push(`/proposal/${ptProjectId}`)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => handleSelectPtProjectList())
</script>

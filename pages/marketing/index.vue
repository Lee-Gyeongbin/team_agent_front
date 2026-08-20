<template>
  <div class="marketing-list-page">
    <div
      v-if="!config || !selectedAgent"
      class="marketing-page-body"
    >
      <UiEmpty
        icon="icon-edit"
        title="마케팅 에이전트를 찾을 수 없습니다."
        description="에이전트 관리에서 마케팅 콘텐츠 작성 에이전트를 등록·활성화해 주세요."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="navigateTo('/chat')"
        >
          채팅으로 이동
        </UiButton>
      </UiEmpty>
    </div>

    <template v-else>
      <div class="marketing-list-header">
        <h1 class="marketing-list-title">마케팅 프로젝트</h1>
        <UiButton
          variant="primary"
          size="md"
          @click="openCreateModal"
        >
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          새 프로젝트
        </UiButton>
      </div>

      <div class="marketing-filter-bar">
        <div class="marketing-filter-chips">
          <button
            v-for="chip in FILTER_CHIPS"
            :key="chip.value || 'all-status'"
            type="button"
            :class="['marketing-filter-chip', { 'is-active': filterStatusCd === chip.value }]"
            @click="onFilterChange(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>
        <span class="marketing-filter-divider" />
        <UiSelect
          :model-value="filterPeriod"
          class="marketing-filter-select"
          :options="periodSelectOptions"
          placeholder="전체 기간"
          size="sm"
          @update:model-value="onSelectPeriod"
        />
        <UiSelect
          :model-value="filterSort"
          class="marketing-filter-select"
          :options="sortSelectOptions"
          placeholder="최신순"
          size="sm"
          @update:model-value="onSelectSort"
        />
      </div>

      <div
        v-if="isLoadingList"
        class="marketing-card-grid"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="marketing-card is-skeleton"
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

      <div
        v-else-if="displayedProjects.length > 0"
        class="marketing-card-grid"
      >
        <div
          v-for="project in displayedProjects"
          :key="project.marketingProjectId"
          class="marketing-card"
          @click="onClickCard(project)"
        >
          <div class="marketing-card-top">
            <span :class="['marketing-status-badge', `status-${project.statusCd}`]">{{ project.statusNm }}</span>
            <div
              class="marketing-card-actions"
              @click.stop
            >
              <UiButton
                variant="ghost"
                size="sm"
                icon-only
                title="수정"
                @click="openEditModal(project)"
              >
                <template #icon-left>
                  <i class="icon-edit size-16" />
                </template>
              </UiButton>
              <UiButton
                variant="ghost"
                size="sm"
                icon-only
                title="삭제"
                @click="onDeleteProject(project)"
              >
                <template #icon-left>
                  <i class="icon-trashcan size-16" />
                </template>
              </UiButton>
            </div>
          </div>
          <div class="marketing-card-title">{{ project.projectNm }}</div>
          <div class="marketing-card-meta">
            <template v-if="project.orgNm">{{ project.orgNm }}</template>
            <template v-if="project.orgNm && (project.dueDt || project.modifyDt)"> · </template>
            <template v-if="project.dueDt">마감일 {{ project.dueDt }}</template>
            <template v-else-if="project.modifyDt">{{ project.modifyDt }}</template>
          </div>
        </div>
      </div>

      <UiEmpty
        v-else-if="hasActiveListFilter"
        icon="icon-search"
        title="검색 결과가 없습니다."
        description="필터 조건을 변경해 보세요."
      />

      <UiEmpty
        v-else
        icon="icon-document"
        title="마케팅 프로젝트가 없습니다."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="openCreateModal"
        >
          새 프로젝트 시작
        </UiButton>
      </UiEmpty>
    </template>

    <MarketingNewModal
      :is-open="isProjectModalOpen"
      :is-saving="isSaving"
      :project="editingProject"
      @close="closeProjectModal"
      @submit="onSubmitProject"
    />
  </div>
</template>

<script setup lang="ts">
import type { MarketingProject } from '~/types/marketing'
import { useMarketingProjectsStore } from '~/composables/marketing/useMarketingProjectsStore'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()

const FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: '001', label: '작성중' },
  { value: '002', label: '검수중' },
  { value: '003', label: '완료' },
  { value: '004', label: '보류' },
]

const { selectedAgent, config, handleSelectAgents } = useMarketingStore()
const {
  marketingProjectList,
  isLoadingList,
  handleSelectMarketingProjectList,
  handleSaveMarketingProject,
  handleDeleteMarketingProject,
} = useMarketingProjectsStore()

const SORT_OPTIONS = [
  { value: 'CREATE_DT_DESC', label: '최신순' },
  { value: 'CREATE_DT_ASC', label: '오래된순' },
  { value: 'DUE_DT_ASC', label: '마감일순' },
] as const

const PERIOD_OPTIONS = [
  { value: '', label: '전체 기간' },
  { value: '3', label: '최근 3일' },
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']
type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']

const filterStatusCd = ref('')
const filterSort = ref<SortValue>('CREATE_DT_DESC')
const filterPeriod = ref<PeriodValue>('')
const isProjectModalOpen = ref(false)
const editingProject = ref<MarketingProject | null>(null)
const isSaving = ref(false)

const periodSelectOptions = computed(() => PERIOD_OPTIONS.map((item) => ({ label: item.label, value: item.value })))
const sortSelectOptions = computed(() => SORT_OPTIONS.map((item) => ({ label: item.label, value: item.value })))

const onSelectPeriod = (value: string | number) => {
  filterPeriod.value = String(value) as PeriodValue
  onListFilterChange()
}

const onSelectSort = (value: string | number) => {
  filterSort.value = String(value) as SortValue
  onListFilterChange()
}

const parseSortValue = (val: SortValue) => {
  if (val === 'CREATE_DT_ASC') return { sortField: 'CREATE_DT', sortOrder: 'ASC' }
  if (val === 'DUE_DT_ASC') return { sortField: 'DUE_DT', sortOrder: 'ASC' }
  return { sortField: 'CREATE_DT', sortOrder: 'DESC' }
}

const toTime = (value: string) => {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

/** 기간 필터 하한 (로컬 자정 기준). 없으면 null = 전체 */
const periodStartTime = (periodDays: PeriodValue): number | null => {
  if (!periodDays) return null
  const days = Number(periodDays)
  if (!days) return null
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start.getTime()
}

const listFilter = () => {
  const { sortField, sortOrder } = parseSortValue(filterSort.value)
  // 기간 필터는 selectMarketingProjectList.do가 지원하지 않아 서버로 보내지 않는다
  // (실제 기간 필터링은 아래 displayedProjects에서 periodStartTime()으로 클라이언트단에서 처리)
  return {
    statusCd: filterStatusCd.value || undefined,
    sortField,
    sortOrder,
  }
}

const hasActiveListFilter = computed(() => !!filterStatusCd.value || !!filterPeriod.value)

/** 정렬은 selectMarketingProjectList.do가 sortField/sortOrder로 이미 처리해서 내려준다 — 기간 필터만 클라이언트에서 거른다 */
const displayedProjects = computed(() => {
  const startAt = periodStartTime(filterPeriod.value)
  if (startAt == null) return marketingProjectList.value
  return marketingProjectList.value.filter((project) => toTime(project.createDt) >= startAt)
})

const onListFilterChange = () => {
  void handleSelectMarketingProjectList(listFilter())
}

const onFilterChange = (statusCd: string) => {
  filterStatusCd.value = statusCd
  onListFilterChange()
}

const onClickCard = (project: MarketingProject) => {
  const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
  void router.push({
    path: `/marketing/${project.marketingProjectId}`,
    query: agentId ? { agentId } : {},
  })
}

const openCreateModal = () => {
  editingProject.value = null
  isProjectModalOpen.value = true
}

const openEditModal = (project: MarketingProject) => {
  editingProject.value = project
  isProjectModalOpen.value = true
}

const closeProjectModal = () => {
  isProjectModalOpen.value = false
  editingProject.value = null
}

const onSubmitProject = async (form: {
  marketingProjectId?: string
  projectNm: string
  orgNm: string
  summary: string
  dueDt: string
  statusCd: string
}) => {
  isSaving.value = true
  try {
    const marketingProjectId = await handleSaveMarketingProject(form)
    const isEdit = !!form.marketingProjectId
    closeProjectModal()
    openToast({ message: isEdit ? '프로젝트를 수정했습니다.' : '프로젝트를 생성했습니다.' })
    if (isEdit) {
      await handleSelectMarketingProjectList(listFilter())
      return
    }
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    await router.push({
      path: `/marketing/${marketingProjectId}`,
      query: agentId ? { agentId } : {},
    })
  } catch {
    openToast({
      message: form.marketingProjectId ? '프로젝트 수정에 실패했습니다.' : '프로젝트 생성에 실패했습니다.',
      type: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

const onDeleteProject = async (project: MarketingProject) => {
  const confirmed = await openConfirm({
    title: '마케팅 프로젝트 삭제',
    message: `'${project.projectNm}' 프로젝트를 삭제할까요?\n삭제 후 복구할 수 없습니다.`,
    confirmText: '삭제',
    cancelText: '취소',
  })
  if (!confirmed) return
  try {
    await handleDeleteMarketingProject(project.marketingProjectId)
    openToast({ message: '프로젝트를 삭제했습니다.' })
  } catch {
    openToast({ message: '프로젝트 삭제에 실패했습니다.', type: 'error' })
  }
}

onMounted(async () => {
  openLoading({ text: '마케팅 프로젝트를 불러오는 중...' })
  try {
    await handleSelectAgents()
    if (selectedAgent.value) await handleSelectMarketingProjectList(listFilter())
  } finally {
    closeLoading()
  }
})
</script>

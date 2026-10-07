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

    <MarketingChannelConnect
      v-else-if="isChannelConnectOpen"
      @close="isChannelConnectOpen = false"
    />
    <MarketingCampaignCalendar
      v-else-if="isCalendarOpen"
      @close="isCalendarOpen = false"
    />

    <template v-else>
      <div class="marketing-list-header">
        <div class="marketing-list-header__copy">
          <h1 class="marketing-list-title">마케팅 프로젝트</h1>
          <p class="marketing-list-desc">진행 중인 프로젝트의 전체 현황을 한눈에 확인하고 관리하세요.</p>
        </div>
        <div class="marketing-list-header__actions">
          <UiButton
            variant="outline"
            size="md"
            @click="isChannelConnectOpen = true"
          >
            <template #icon-left>
              <UiIcon
                name="user"
                size="16"
              />
            </template>
            계정 관리
          </UiButton>
          <UiButton
            variant="outline"
            size="md"
            @click="isCalendarOpen = true"
          >
            <template #icon-left>
              <UiIcon
                name="calendar"
                size="16"
              />
            </template>
            프로젝트 캘린더
          </UiButton>
          <UiButton
            variant="primary"
            size="md"
            @click="openCreateModal"
          >
            <template #icon-left>
              <UiIcon
                name="plus"
                size="16"
              />
            </template>
            프로젝트 생성
          </UiButton>
        </div>
      </div>

      <div class="marketing-summary-row">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="marketing-summary-card"
        >
          <div class="marketing-summary-card__head">
            <UiIcon
              :name="card.icon"
              size="16"
            />
            <span>{{ card.label }}</span>
          </div>
          <strong
            v-if="!isLoadingList && !isListError"
            class="marketing-summary-card__value"
          >
            {{ card.count }}
          </strong>
        </div>
      </div>

      <div class="marketing-filter-bar">
        <div class="marketing-filter-bar__left">
          <div class="marketing-filter-search">
            <UiInput
              v-model="filterKeyword"
              size="sm"
              placeholder="프로젝트명 검색"
            >
              <template #icon-left>
                <UiIcon
                  name="search"
                  size="16"
                />
              </template>
            </UiInput>
          </div>
          <UiSelect
            :model-value="filterStatusCd"
            class="marketing-filter-select"
            :options="statusSelectOptions"
            placeholder="상태 전체"
            size="sm"
            @update:model-value="onSelectStatus"
          />
          <UiSelect
            :model-value="filterGoal"
            class="marketing-filter-select"
            :options="goalSelectOptions"
            placeholder="목표 전체"
            size="sm"
            @update:model-value="onSelectGoal"
          />
          <div class="marketing-filter-dates">
            <UiDatePicker
              v-model="filterStartDate"
              size="sm"
              :max-value="filterEndDate"
            />
            <span class="marketing-filter-dates__sep">~</span>
            <UiDatePicker
              v-model="filterEndDate"
              size="sm"
              :min-value="filterStartDate"
            />
          </div>
        </div>
        <UiButton
          class="marketing-filter-reset"
          variant="outline"
          size="sm"
          :disabled="!hasActiveListFilter"
          @click="onResetFilters"
        >
          <template #icon-left>
            <UiIcon
              name="refresh-cw"
              size="16"
            />
          </template>
          필터 초기화
        </UiButton>
      </div>

      <UiLoading
        v-if="isLoadingList"
        text="마케팅 프로젝트를 불러오는 중..."
      />

      <UiEmpty
        v-else-if="isListError"
        icon="icon-document"
        title="프로젝트 목록을 불러오지 못했습니다."
      >
        <UiButton
          variant="outline"
          size="md"
          @click="handleSelectMarketingProjectList(LIST_FILTER)"
        >
          다시 시도
        </UiButton>
      </UiEmpty>

      <div
        v-else-if="displayedProjects.length > 0"
        class="marketing-list-table-wrap"
      >
        <UiTable
          :columns="marketingProjectListColumns"
          :data="displayedProjects"
          clickable
          empty-text="프로젝트가 없습니다."
          @row-click="onTableRowClick"
        >
          <template #cell-projectNm="{ row }">
            <div class="marketing-list-campaign">
              <strong>{{ row.projectNm }}</strong>
              <span v-if="row.orgNm">{{ row.orgNm }}</span>
            </div>
          </template>
          <template #cell-statusNm="{ row }">
            <span :class="['marketing-status-badge', `status-${row.statusCd}`]">{{ row.statusNm }}</span>
          </template>
          <template #cell-createUserNm="{ value }">
            {{ formatMarketingCellText(value) }}
          </template>
          <template #cell-contentCnt="{ value }">
            {{ formatMarketingCellText(value) }}
          </template>
          <template #cell-dueDt="{ value }">
            {{ formatMarketingDotDate(value) || '-' }}
          </template>
          <template #cell-modifyDt="{ value }">
            {{ formatMarketingDotDate(value) || '-' }}
          </template>
          <template #cell-actions="{ row }">
            <div
              class="marketing-list-row-actions"
              @click.stop
            >
              <UiDropdownMenu
                :items="getProjectMenuItems(row)"
                align="end"
                @select="(value) => onProjectMenuSelect(row, value)"
              >
                <template #trigger>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    icon-only
                    title="더보기"
                    :disabled="isDeleting && deletingProjectId === row.marketingProjectId"
                  >
                    <template #icon-left>
                      <UiIcon
                        name="ellipsis-vertical"
                        size="16"
                      />
                    </template>
                  </UiButton>
                </template>
              </UiDropdownMenu>
            </div>
          </template>
        </UiTable>
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
        title="프로젝트가 없습니다."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="openCreateModal"
        >
          프로젝트 생성
        </UiButton>
      </UiEmpty>
    </template>

    <MarketingNewModal
      v-if="isProjectModalOpen"
      :is-open="isProjectModalOpen"
      :is-saving="isSaving"
      :project="editingProject"
      :members="editingMembers"
      @close="closeProjectModal"
      @submit="onSubmitProject"
    />
  </div>
</template>

<script setup lang="ts">
import { toCalendarDateTime, type DateValue } from '@internationalized/date'
import {
  UiButton,
  UiDatePicker,
  UiDropdownMenu,
  UiEmpty,
  UiIcon,
  UiInput,
  UiLoading,
  UiSelect,
  UiTable,
  type DropdownMenuItemDef,
} from '@leechanyong/ispark-ui'
import {
  MARKETING_PROJECT_GOAL_PRESETS,
  marketingProjectListColumns,
  marketingProjectStatuses,
  type MarketingProject,
  type MarketingProjectMember,
  type MarketingProjectSaveForm,
} from '~/types/marketing'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { formatMarketingCellText, formatMarketingDotDate } from '~/utils/marketing/marketingUtil'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()

const SUMMARY_CARD_ICONS: Record<string, string> = {
  '001': 'play',
  '002': 'refresh-cw',
  '003': 'triangle-alert',
  '004': 'check',
  '005': 'calendar',
  '006': 'check',
  '007': 'triangle-alert',
}

const SUMMARY_CARDS = [
  { key: 'all', label: '전체 프로젝트', icon: 'layout-grid', statusCd: '' },
  ...marketingProjectStatuses.map((item) => ({
    key: item.statusCd,
    label: item.statusNm,
    icon: SUMMARY_CARD_ICONS[item.statusCd],
    statusCd: item.statusCd,
  })),
]

const {
  selectedAgent,
  config,
  handleSelectAgents,
  marketingProjectList,
  isLoadingList,
  isListError,
  handleSelectMarketingProjectList,
  handleSaveMarketingProject,
  handleDeleteMarketingProject,
} = useMarketingStore()
const { fetchSelectMarketingProject } = useMarketingApi()
const { user } = useAuth()

const filterStatusCd = ref('')
const filterGoal = ref('')
const filterKeyword = ref('')
const filterStartDate = ref<DateValue | undefined>()
const filterEndDate = ref<DateValue | undefined>()
const isProjectModalOpen = ref(false)
const isChannelConnectOpen = ref(false)
const isCalendarOpen = ref(false)
const editingProject = ref<MarketingProject | null>(null)
const editingMembers = ref<MarketingProjectMember[]>([])
const isSaving = ref(false)
const isDeleting = ref(false)
const deletingProjectId = ref('')

const getProjectMenuItems = (row: MarketingProject): DropdownMenuItemDef[] => [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  {
    label: '삭제',
    value: 'delete',
    icon: 'icon-trashcan',
    color: 'danger',
    disabled:
      row.createUserId !== user.value?.userId ||
      (isDeleting.value && deletingProjectId.value === row.marketingProjectId),
  },
]

const statusSelectOptions = [
  { label: '상태 전체', value: '' },
  ...marketingProjectStatuses.map((item) => ({ label: item.statusNm, value: item.statusCd })),
]

const goalSelectOptions = [
  { label: '목표 전체', value: '' },
  ...MARKETING_PROJECT_GOAL_PRESETS.map((label) => ({ label, value: label })),
]

const summaryCards = computed(() => {
  const list = marketingProjectList.value
  return SUMMARY_CARDS.map((card) => ({
    ...card,
    count: card.statusCd ? list.filter((project) => project.statusCd === card.statusCd).length : list.length,
  }))
})

const formatDateValueToYyyyMmDd = (value: DateValue | undefined): string => {
  if (!value) return ''
  const { year, month, day } = toCalendarDateTime(value)
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${monthText}-${dayText}`
}

/** 마감일 YYYY-MM-DD. 값 없으면 '' */
const toDueDateText = (value: string) => {
  const matched = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return ''
  return `${matched[1]}-${matched[2]}-${matched[3]}`
}

const LIST_FILTER = { sortField: 'CREATE_DT', sortOrder: 'DESC' }

const hasActiveListFilter = computed(
  () =>
    !!filterStatusCd.value ||
    !!filterGoal.value ||
    !!filterKeyword.value.trim() ||
    !!filterStartDate.value ||
    !!filterEndDate.value,
)

/** 목록 API는 전체·최신순만 받고, 검색·상태·목표·마감일은 화면에서 거른다 */
const displayedProjects = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase()
  const startText = formatDateValueToYyyyMmDd(filterStartDate.value)
  const endText = formatDateValueToYyyyMmDd(filterEndDate.value)

  return marketingProjectList.value.filter((project) => {
    if (filterStatusCd.value && project.statusCd !== filterStatusCd.value) return false
    if (filterGoal.value && project.projectOverview !== filterGoal.value) return false
    if (keyword && !project.projectNm.toLowerCase().includes(keyword)) return false
    if (startText || endText) {
      const dueText = toDueDateText(project.dueDt)
      if (!dueText) return false
      if (startText && dueText < startText) return false
      if (endText && dueText > endText) return false
    }
    return true
  }) as (MarketingProject & Record<string, unknown>)[]
})

const onSelectStatus = (value: string | number) => {
  filterStatusCd.value = String(value)
}

const onSelectGoal = (value: string | number) => {
  filterGoal.value = String(value)
}

const onResetFilters = () => {
  filterKeyword.value = ''
  filterStatusCd.value = ''
  filterGoal.value = ''
  filterStartDate.value = undefined
  filterEndDate.value = undefined
}

/** 상세 이동 시 선택 에이전트를 query로 유지한다 */
const resolveAgentId = () => String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()

const onTableRowClick = (row: MarketingProject) => {
  const agentId = resolveAgentId()
  void router.push({
    path: `/marketing/${row.marketingProjectId}`,
    query: agentId ? { agentId } : {},
  })
}

const onProjectMenuSelect = (row: MarketingProject, value: string) => {
  if (value === 'edit') {
    void openEditModal(row)
    return
  }
  if (value === 'delete') void onDeleteProject(row)
}

const openCreateModal = () => {
  editingProject.value = null
  editingMembers.value = []
  isProjectModalOpen.value = true
}

/** 수정 모달은 공개범위(멤버) 목록이 필요해 목록 행이 아니라 상세를 다시 조회해서 연다 */
const openEditModal = async (project: MarketingProject) => {
  try {
    const res = await fetchSelectMarketingProject(project.marketingProjectId)
    if (!res.successYn || !res.data) {
      openToast({ message: res.returnMsg || '프로젝트 정보를 불러오지 못했습니다.', type: 'error' })
      return
    }
    editingProject.value = res.data
    editingMembers.value = res.members ?? []
  } catch {
    openToast({ message: '프로젝트 정보를 불러오지 못했습니다.', type: 'error' })
    return
  }
  isProjectModalOpen.value = true
}

const closeProjectModal = () => {
  isProjectModalOpen.value = false
  editingProject.value = null
  editingMembers.value = []
}

const onSubmitProject = async (form: MarketingProjectSaveForm) => {
  isSaving.value = true
  try {
    const marketingProjectId = await handleSaveMarketingProject(form)
    const isEdit = !!form.marketingProjectId
    closeProjectModal()
    openToast({ message: isEdit ? '프로젝트를 수정했습니다.' : '프로젝트를 생성했습니다.' })
    if (isEdit) {
      await handleSelectMarketingProjectList(LIST_FILTER)
      return
    }
    const agentId = resolveAgentId()
    await router.push({
      path: `/marketing/${marketingProjectId}`,
      query: agentId ? { agentId, startPlan: '1' } : { startPlan: '1' },
    })
  } catch (error) {
    openToast({
      message:
        error instanceof Error && error.message
          ? error.message
          : form.marketingProjectId
            ? '프로젝트 수정에 실패했습니다.'
            : '프로젝트 생성에 실패했습니다.',
      type: 'error',
    })
  } finally {
    isSaving.value = false
  }
}

const onDeleteProject = async (project: MarketingProject) => {
  if (isDeleting.value) return
  const confirmed = await openConfirm({
    title: '마케팅 프로젝트 삭제',
    message: `'${project.projectNm}' 프로젝트를 삭제할까요?\n삭제 후 복구할 수 없습니다.`,
    confirmText: '삭제',
    cancelText: '취소',
  })
  if (!confirmed) return
  isDeleting.value = true
  deletingProjectId.value = project.marketingProjectId
  try {
    await handleDeleteMarketingProject(project.marketingProjectId)
    openToast({ message: '프로젝트를 삭제했습니다.' })
  } catch (error) {
    openToast({
      message: error instanceof Error && error.message ? error.message : '프로젝트 삭제에 실패했습니다.',
      type: 'error',
    })
  } finally {
    isDeleting.value = false
    deletingProjectId.value = ''
  }
}

onMounted(async () => {
  openLoading({ text: '마케팅 프로젝트를 불러오는 중...' })
  try {
    await handleSelectAgents()
    if (selectedAgent.value) await handleSelectMarketingProjectList(LIST_FILTER)
  } finally {
    closeLoading()
  }
})
</script>

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
      @close="closeChannelConnect"
    />
    <MarketingCampaignCalendar
      v-else-if="isCalendarOpen"
      @close="closeCalendar"
    />

    <template v-else>
      <div class="marketing-list-header">
        <div class="marketing-list-header__copy">
          <h1 class="marketing-list-title">마케팅 프로젝트</h1>
          <p class="marketing-list-desc">진행 중인 캠페인의 전체 현황을 한눈에 확인하고 관리하세요.</p>
        </div>
        <div class="marketing-list-header__actions">
          <UiButton
            variant="outline"
            size="md"
            @click="onAccountManage"
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
            @click="openCalendar"
          >
            <template #icon-left>
              <UiIcon
                name="calendar"
                size="16"
              />
            </template>
            캠페인 캘린더
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
            캠페인 생성
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
            v-if="isLoadingList"
            class="marketing-summary-card__value"
          >
            <UiSkeleton
              height="28px"
              width="28px"
            />
          </strong>
          <strong
            v-else
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
              placeholder="캠페인명 검색"
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

      <div
        v-if="isLoadingList"
        class="marketing-list-table-wrap"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="marketing-list-skeleton-row"
        >
          <UiSkeleton
            height="16px"
            width="36%"
          />
          <UiSkeleton
            height="16px"
            width="12%"
          />
          <UiSkeleton
            height="16px"
            width="10%"
          />
          <UiSkeleton
            height="16px"
            width="8%"
          />
          <UiSkeleton
            height="16px"
            width="12%"
          />
          <UiSkeleton
            height="16px"
            width="12%"
          />
        </div>
      </div>

      <div
        v-else-if="displayedProjects.length > 0"
        class="marketing-list-table-wrap"
      >
        <UiTable
          :columns="marketingProjectListColumns"
          :data="displayedProjects"
          clickable
          empty-text="캠페인이 없습니다."
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
            {{ formatCellText(value) }}
          </template>
          <template #cell-contentCnt="{ value }">
            {{ formatCellText(value) }}
          </template>
          <template #cell-dueDt="{ value }">
            {{ formatDotDate(value) }}
          </template>
          <template #cell-modifyDt="{ value }">
            {{ formatDotDate(value) }}
          </template>
          <template #cell-actions="{ row }">
            <div
              class="marketing-list-row-actions"
              @click.stop
            >
              <UiDropdownMenu
                :items="projectMenuItems"
                align="end"
                @select="(value) => onProjectMenuSelect(row, value)"
              >
                <template #trigger>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    icon-only
                    title="더보기"
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
        title="캠페인이 없습니다."
      >
        <UiButton
          variant="primary"
          size="md"
          @click="openCreateModal"
        >
          캠페인 생성
        </UiButton>
      </UiEmpty>
    </template>

    <MarketingNewModal
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
  UiSelect,
  UiTable,
  type DropdownMenuItemDef,
} from '@leechanyong/ispark-ui'
import {
  marketingProjectListColumns,
  type MarketingProject,
  type MarketingProjectMember,
  type MarketingProjectSaveForm,
} from '~/types/marketing'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'

definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()

const STATUS_FILTER_OPTIONS = [
  { value: '', label: '상태 전체' },
  { value: '001', label: '작성중' },
  { value: '002', label: '검수중' },
  { value: '003', label: '완료' },
  { value: '004', label: '보류' },
]

const SUMMARY_CARDS = [
  { key: 'all', label: '전체 캠페인', icon: 'layout-grid', statusCd: '' },
  { key: '001', label: '작성중', icon: 'play', statusCd: '001' },
  { key: '002', label: '검수중', icon: 'refresh-cw', statusCd: '002' },
  { key: '003', label: '완료', icon: 'check', statusCd: '003' },
  { key: '004', label: '보류', icon: 'triangle-alert', statusCd: '004' },
] as const

const projectMenuItems: DropdownMenuItemDef[] = [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' },
]

const {
  selectedAgent,
  config,
  handleSelectAgents,
  marketingProjectList,
  isLoadingList,
  handleSelectMarketingProjectList,
  handleSaveMarketingProject,
  handleDeleteMarketingProject,
} = useMarketingStore()
const { fetchSelectMarketingProject } = useMarketingApi()

const filterStatusCd = ref('')
const filterKeyword = ref('')
const filterStartDate = ref<DateValue | undefined>()
const filterEndDate = ref<DateValue | undefined>()
const isProjectModalOpen = ref(false)
const isChannelConnectOpen = ref(false)
const isCalendarOpen = ref(false)
const editingProject = ref<MarketingProject | null>(null)
const editingMembers = ref<MarketingProjectMember[]>([])
const isSaving = ref(false)

const statusSelectOptions = computed(() =>
  STATUS_FILTER_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
)

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

const toTime = (value: string) => {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

const dateValueToStartTime = (value: DateValue | undefined): number | null => {
  const dateText = formatDateValueToYyyyMmDd(value)
  if (!dateText) return null
  const time = new Date(`${dateText}T00:00:00`).getTime()
  return Number.isNaN(time) ? null : time
}

const dateValueToEndTime = (value: DateValue | undefined): number | null => {
  const dateText = formatDateValueToYyyyMmDd(value)
  if (!dateText) return null
  const time = new Date(`${dateText}T23:59:59.999`).getTime()
  return Number.isNaN(time) ? null : time
}

/** YYYY-MM-DD → YYYY.MM.DD. 값 없으면 '-' */
const formatDotDate = (value: unknown) => {
  const text = String(value ?? '').trim()
  if (!text) return '-'
  const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!matched) return text
  return `${matched[1]}.${matched[2]}.${matched[3]}`
}

/** 목록 셀 공백은 날짜 열과 같이 '-' */
const formatCellText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text || '-'
}

const listFilter = () => ({
  sortField: 'CREATE_DT',
  sortOrder: 'DESC',
})

const hasActiveListFilter = computed(
  () => !!filterStatusCd.value || !!filterKeyword.value.trim() || !!filterStartDate.value || !!filterEndDate.value,
)

/** 목록 API는 전체·최신순만 받고, 검색·상태·기간은 화면에서 거른다 */
const displayedProjects = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase()
  const startAt = dateValueToStartTime(filterStartDate.value)
  const endAt = dateValueToEndTime(filterEndDate.value)

  return marketingProjectList.value.filter((project) => {
    if (filterStatusCd.value && project.statusCd !== filterStatusCd.value) return false
    if (keyword && !project.projectNm.toLowerCase().includes(keyword)) return false
    const createdAt = toTime(project.createDt)
    if (startAt != null && createdAt < startAt) return false
    if (endAt != null && createdAt > endAt) return false
    return true
  }) as (MarketingProject & Record<string, unknown>)[]
})

const onSelectStatus = (value: string | number) => {
  filterStatusCd.value = String(value)
}

const onResetFilters = () => {
  filterKeyword.value = ''
  filterStatusCd.value = ''
  filterStartDate.value = undefined
  filterEndDate.value = undefined
}

const onAccountManage = () => {
  isChannelConnectOpen.value = true
}

const closeChannelConnect = () => {
  isChannelConnectOpen.value = false
}

const openCalendar = () => {
  isCalendarOpen.value = true
}

const closeCalendar = () => {
  isCalendarOpen.value = false
}

const onClickCard = (project: MarketingProject) => {
  const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
  void router.push({
    path: `/marketing/${project.marketingProjectId}`,
    query: agentId ? { agentId } : {},
  })
}

const onTableRowClick = (row: MarketingProject) => {
  onClickCard(row)
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

<template>
  <div class="pt-list-page wide-center">
    <!-- 헤더 -->
    <div class="pt-list-header">
      <div class="pt-list-header-left">
        <div class="pt-list-header-icon">
          <i class="icon-document size-24" />
        </div>
        <div>
          <h1 class="pt-list-title">PT 제안 에이전트</h1>
          <p class="pt-list-subtitle">AI가 도와주는 PT 제안서 작성</p>
        </div>
      </div>

      <div class="pt-list-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="사업명 또는 발주기관 검색"
        />
        <UiButton
          variant="primary"
          size="sm"
          @click="isNewModalOpen = true"
        >
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          새 PT 제안
        </UiButton>
      </div>
    </div>

    <!-- 필터 바 -->
    <div class="pt-filter-bar">
      <!-- 상태 칩 -->
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
      <!-- 구분선 -->
      <div class="pt-filter-divider" />
      <!-- 기간 드롭다운 -->
      <select
        v-model="filterPeriod"
        class="pt-filter-select"
        @change="onPeriodChange"
      >
        <option
          v-for="opt in PERIOD_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <!-- 직접 설정 날짜 입력 -->
      <template v-if="filterPeriod === 'custom'">
        <UiDatePicker
          v-model="filterStartDateValue"
          size="xs"
          class="pt-filter-date"
        />
        <span class="pt-filter-date-sep">~</span>
        <UiDatePicker
          v-model="filterEndDateValue"
          size="xs"
          class="pt-filter-date"
        />
      </template>
      <!-- 정렬 드롭다운 -->
      <select
        v-model="filterSort"
        class="pt-filter-select"
        @change="onSortChange"
      >
        <option
          v-for="opt in SORT_OPTIONS"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <!-- 뷰 토글 -->
      <div class="pt-view-toggle">
        <button
          :class="['pt-view-btn', { 'is-active': viewMode === 'grid' }]"
          title="그리드 뷰"
          @click="setViewMode('grid')"
        >
          <i class="icon-grid size-16" />
        </button>
        <button
          :class="['pt-view-btn', { 'is-active': viewMode === 'list' }]"
          title="목록 뷰"
          @click="setViewMode('list')"
        >
          <i class="icon-list size-16" />
        </button>
      </div>
    </div>

    <!-- 활성 필터 태그 -->
    <div
      v-if="activeFilterTags.length > 0"
      class="pt-filter-tags"
    >
      <div class="pt-filter-tag-list">
        <span
          v-for="tag in activeFilterTags"
          :key="tag.key"
          class="pt-filter-tag"
        >
          {{ tag.label }}
          <button
            class="pt-filter-tag-remove"
            @click="removeFilter(tag.key)"
          >
            <i class="icon-close size-12" />
          </button>
        </span>
      </div>
      <span class="pt-filter-count">총 {{ filteredList.length }}건</span>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingList"
      :class="viewMode === 'grid' ? 'pt-card-grid' : 'pt-list-rows'"
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

    <!-- 빈 상태 -->
    <UiEmpty
      v-else-if="filteredList.length === 0"
      icon="icon-document"
      :title="hasActiveFilter ? '조건에 맞는 PT 제안서가 없습니다.' : 'PT 제안서가 없습니다.'"
    >
      <UiButton
        v-if="hasActiveFilter"
        variant="outline"
        size="md"
        @click="resetFilters"
      >
        필터 초기화
      </UiButton>
      <UiButton
        v-else
        variant="primary"
        size="md"
        @click="isNewModalOpen = true"
      >
        새 PT 제안 시작
      </UiButton>
    </UiEmpty>

    <!-- 그리드 뷰 -->
    <div
      v-else-if="viewMode === 'grid'"
      class="pt-card-grid"
    >
      <div
        v-for="project in filteredList"
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

    <!-- 목록 뷰 -->
    <div
      v-else
      class="pt-list-rows"
    >
      <div
        v-for="project in filteredList"
        :key="project.ptProjectId"
        class="pt-list-row"
        @click="onClickCard(project)"
      >
        <span :class="['pt-status-badge', `status-${project.statusCd}`]">{{ project.statusNm }}</span>
        <div class="pt-list-row-title">{{ project.projectNm }}</div>
        <div class="pt-list-row-meta">
          {{ project.orgNm }}
          <template v-if="project.dueDt"> · 마감 {{ project.dueDt }}</template>
          <template v-else> · {{ project.modifyDt }}</template>
        </div>
      </div>
    </div>

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
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import type { PtProject } from '~/types/proposal'
import { useProposalProjectsStore } from '~/composables/proposal/useProposalProjectsStore'

const router = useRouter()

const FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'PT000001', label: '작성중' },
  { value: 'PT000002', label: '검토중' },
  { value: 'PT000003', label: '완료' },
]

const PERIOD_OPTIONS = [
  { value: '', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: 'custom', label: '직접 설정' },
] as const

const SORT_OPTIONS = [
  { value: 'MODIFY_DESC', label: '최신수정순' },
  { value: 'MODIFY_ASC', label: '오래된순' },
  { value: 'NAME_ASC', label: '이름순' },
  { value: 'DUE_ASC', label: '마감일순' },
] as const

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']
type SortValue = (typeof SORT_OPTIONS)[number]['value']

const { ptProjectList, isLoadingList, handleSelectPtProjectList, handleSavePtProject } = useProposalProjectsStore()

// ── 뷰 모드 (localStorage 유지) ─────────────────────────────
const viewMode = ref<'grid' | 'list'>(
  (typeof localStorage !== 'undefined' ? (localStorage.getItem('ptViewMode') as 'grid' | 'list') : null) ?? 'grid',
)
const setViewMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode
  localStorage.setItem('ptViewMode', mode)
}

// ── 필터 상태 ────────────────────────────────────────────────
const filterStatusCd = ref('')
const filterPeriod = ref<PeriodValue>('')
const filterSort = ref<SortValue>('MODIFY_DESC')
const filterStartDate = ref('')
const filterEndDate = ref('')
const searchKeyword = ref('')
const isNewModalOpen = ref(false)
const isSaving = ref(false)

// ── 날짜 변환 유틸 ──────────────────────────────────────────
const parseYyyyMmDdToDateValue = (value: string): DateValue | undefined => {
  if (!value) return undefined
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

const formatDateValueToYyyyMmDd = (value: DateValue | undefined): string => {
  if (!value) return ''
  const { year, month, day } = toCalendarDateTime(value)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const filterStartDateValue = computed<DateValue | undefined>({
  get: () => parseYyyyMmDdToDateValue(filterStartDate.value),
  set: (value) => {
    filterStartDate.value = formatDateValueToYyyyMmDd(value)
  },
})

const filterEndDateValue = computed<DateValue | undefined>({
  get: () => parseYyyyMmDdToDateValue(filterEndDate.value),
  set: (value) => {
    filterEndDate.value = formatDateValueToYyyyMmDd(value)
  },
})

// 기간 옵션 → 날짜 변환
const getPeriodDates = (period: PeriodValue): { start: string; end: string } => {
  const todayDate = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (period === 'today') return { start: fmt(todayDate), end: fmt(todayDate) }
  if (period === '7d') {
    const start = new Date(todayDate)
    start.setDate(todayDate.getDate() - 6)
    return { start: fmt(start), end: fmt(todayDate) }
  }
  if (period === '30d') {
    const start = new Date(todayDate)
    start.setDate(todayDate.getDate() - 29)
    return { start: fmt(start), end: fmt(todayDate) }
  }
  return { start: '', end: '' }
}

// ── 클라이언트 측 필터링/정렬 ───────────────────────────────
const filteredList = computed(() => {
  let list = [...ptProjectList.value]

  // 키워드 필터 (사업명 · 발주기관)
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((p) => p.projectNm.toLowerCase().includes(kw) || p.orgNm.toLowerCase().includes(kw))
  }

  // 기간 필터 (modifyDt 기준)
  let startDt = ''
  let endDt = ''
  if (filterPeriod.value === 'custom') {
    startDt = filterStartDate.value
    endDt = filterEndDate.value
  } else if (filterPeriod.value) {
    const dates = getPeriodDates(filterPeriod.value)
    startDt = dates.start
    endDt = dates.end
  }
  if (startDt) list = list.filter((p) => (p.modifyDt || '') >= startDt)
  if (endDt) list = list.filter((p) => (p.modifyDt || '') <= endDt)

  // 정렬
  if (filterSort.value === 'MODIFY_ASC') {
    list.sort((a, b) => (a.modifyDt || '').localeCompare(b.modifyDt || ''))
  } else if (filterSort.value === 'NAME_ASC') {
    list.sort((a, b) => a.projectNm.localeCompare(b.projectNm))
  } else if (filterSort.value === 'DUE_ASC') {
    list.sort((a, b) => {
      if (!a.dueDt && !b.dueDt) return 0
      if (!a.dueDt) return 1
      if (!b.dueDt) return -1
      return a.dueDt.localeCompare(b.dueDt)
    })
  } else {
    // MODIFY_DESC (기본)
    list.sort((a, b) => (b.modifyDt || '').localeCompare(a.modifyDt || ''))
  }

  return list
})

// ── 활성 필터 태그 ───────────────────────────────────────────
const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; label: string }> = []
  if (filterStatusCd.value) {
    const chip = FILTER_CHIPS.find((c) => c.value === filterStatusCd.value)
    if (chip) tags.push({ key: 'status', label: chip.label })
  }
  if (filterPeriod.value && filterPeriod.value !== 'custom') {
    const opt = PERIOD_OPTIONS.find((o) => o.value === filterPeriod.value)
    if (opt) tags.push({ key: 'period', label: opt.label })
  }
  if (filterPeriod.value === 'custom' && (filterStartDate.value || filterEndDate.value)) {
    tags.push({ key: 'period', label: `${filterStartDate.value || '?'} ~ ${filterEndDate.value || '?'}` })
  }
  if (filterSort.value !== 'MODIFY_DESC') {
    const opt = SORT_OPTIONS.find((o) => o.value === filterSort.value)
    if (opt) tags.push({ key: 'sort', label: opt.label })
  }
  if (searchKeyword.value.trim()) {
    tags.push({ key: 'keyword', label: `"${searchKeyword.value.trim()}"` })
  }
  return tags
})

const removeFilter = (key: string) => {
  if (key === 'status') {
    filterStatusCd.value = ''
    void handleSelectPtProjectList()
  }
  if (key === 'period') {
    filterPeriod.value = ''
    filterStartDate.value = ''
    filterEndDate.value = ''
  }
  if (key === 'sort') filterSort.value = 'MODIFY_DESC'
  if (key === 'keyword') searchKeyword.value = ''
}

// 필터 활성 여부 — 상태 필터는 서버 조회라 ptProjectList 자체가 비므로
// "데이터 없음"과 "조건에 안 맞음"을 구분하려면 필터 기준으로 판단해야 함
const hasActiveFilter = computed(() => activeFilterTags.value.length > 0)

const resetFilters = () => {
  filterStatusCd.value = ''
  filterPeriod.value = ''
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterSort.value = 'MODIFY_DESC'
  searchKeyword.value = ''
  void handleSelectPtProjectList()
}

// ── 이벤트 핸들러 ────────────────────────────────────────────
const onFilterChange = (statusCd: string) => {
  filterStatusCd.value = statusCd
  void handleSelectPtProjectList({ statusCd: statusCd || undefined })
}

const onPeriodChange = () => {
  if (filterPeriod.value !== 'custom') {
    filterStartDate.value = ''
    filterEndDate.value = ''
  }
}

const onSortChange = () => {}

watch([filterStartDate, filterEndDate], () => {
  // custom 날짜 유효성 검증
  if (filterPeriod.value === 'custom' && filterStartDate.value && filterEndDate.value) {
    if (filterStartDate.value > filterEndDate.value) {
      openToast({ message: '시작일은 종료일보다 늦을 수 없습니다.', type: 'warning' })
    }
  }
})

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
    router.push(`/proposal/${ptProjectId}`)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => handleSelectPtProjectList())
</script>

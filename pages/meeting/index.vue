<template>
  <div class="meeting2-list-page">
    <!-- 헤더 -->
    <div class="meeting2-list-header">
      <h2 class="meeting2-list-title">회의록</h2>
      <div class="meeting2-list-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="회의명 검색"
        />
        <!-- 통합 모드: 발언자 표시 옵션 -->
        <label
          v-if="isIntegrateMode"
          class="meeting2-integrate-speaker-check"
        >
          <input
            v-model="integrateShowSpeaker"
            type="checkbox"
          />
          <span>결정사항에 발언자 표시</span>
        </label>
        <UiButton
          variant="primary"
          size="md"
          @click="onClickIntegrate"
        >
          <template #icon-left>
            <i class="icon-meeting-generate size-16" />
          </template>
          {{ integrateButtonLabel }}
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onClickNew"
        >
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          새 회의
        </UiButton>
      </div>
    </div>

    <!-- 필터 바 -->
    <div class="meeting2-filter-bar">
      <!-- 상태 칩 -->
      <div class="meeting2-filter-chips">
        <button
          v-for="chip in STATUS_CHIPS"
          :key="chip.value"
          :class="['meeting2-filter-chip', { 'is-active': filterStatus === chip.value }]"
          @click="onSelectStatus(chip.value)"
        >
          {{ chip.label }}
        </button>
      </div>
      <!-- 구분선 -->
      <div class="meeting2-filter-divider" />
      <!-- 기간 드롭다운 -->
      <select
        v-model="filterPeriod"
        class="meeting2-filter-select"
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
        <input
          v-model="filterStartDate"
          type="date"
          class="meeting2-filter-date"
        />
        <span class="meeting2-filter-date-sep">~</span>
        <input
          v-model="filterEndDate"
          type="date"
          class="meeting2-filter-date"
        />
      </template>
      <!-- 정렬 드롭다운 -->
      <select
        v-model="filterSort"
        class="meeting2-filter-select"
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
      <div class="meeting2-view-toggle">
        <button
          :class="['meeting2-view-btn', { 'is-active': viewMode === 'grid' }]"
          title="그리드 뷰"
          @click="setViewMode('grid')"
        >
          <i class="icon-grid size-16" />
        </button>
        <button
          :class="['meeting2-view-btn', { 'is-active': viewMode === 'list' }]"
          title="목록 뷰"
          @click="setViewMode('list')"
        >
          <i class="icon-list size-16" />
        </button>
      </div>
    </div>

    <!-- 활성 필터 표시줄 -->
    <div
      v-if="activeFilterTags.length > 0"
      class="meeting2-filter-tags"
    >
      <div class="meeting2-filter-tag-list">
        <span
          v-for="tag in activeFilterTags"
          :key="tag.key"
          class="meeting2-filter-tag"
        >
          {{ tag.label }}
          <button
            class="meeting2-filter-tag-remove"
            @click="removeFilter(tag.key)"
          >
            <i class="icon-close size-12" />
          </button>
        </span>
      </div>
      <span class="meeting2-filter-count">총 {{ filteredList.length }}건</span>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoadingList"
      :class="viewMode === 'grid' ? 'meeting2-list-grid' : 'meeting2-list-rows'"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="meeting2-list-card is-skeleton"
      >
        <UiSkeleton
          height="20px"
          width="60%"
        />
        <UiSkeleton
          height="14px"
          width="40%"
        />
        <UiSkeleton
          height="14px"
          width="30%"
        />
      </div>
    </div>

    <!-- 빈 상태 -->
    <UiEmpty
      v-else-if="filteredList.length === 0"
      icon="icon-search"
      title="등록된 회의록이 없습니다."
    />

    <!-- 그리드 뷰 -->
    <div
      v-else-if="viewMode === 'grid'"
      class="meeting2-list-grid"
    >
      <div
        v-for="meeting in filteredList"
        :key="meeting.id"
        :class="[
          'meeting2-list-card',
          { 'is-integrate-mode': isIntegrateMode, 'is-selected': isMeetingSelected(meeting.id) },
        ]"
        @click="onClickCard(meeting)"
      >
        <div
          v-if="isIntegrateMode"
          class="meeting2-list-card-check"
        >
          {{ isMeetingSelected(meeting.id) ? 'O' : '' }}
        </div>
        <p class="meeting2-list-card-title">{{ meeting.title }}</p>
        <p class="meeting2-list-card-date">{{ meeting.date }}</p>
        <div class="meeting2-list-card-meta">
          <UiBadge
            v-if="meeting.integrateYn === 'Y'"
            variant="manual-ai"
            size="sm"
          >
            통합 회의록
          </UiBadge>
          <template v-else>
            <UiBadge
              v-for="step in progressBadges(meeting.steps)"
              :key="step.key"
              :variant="step.variant"
              size="sm"
            >
              {{ step.label }}
            </UiBadge>
          </template>
        </div>
        <div
          v-if="!isIntegrateMode"
          class="meeting2-list-card-actions"
        >
          <UiButton
            variant="ghost"
            size="sm"
            icon-only
            @click.stop="doDelete(meeting.meetingId)"
          >
            <template #icon-left>
              <i class="icon-trashcan size-16" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 목록 뷰 -->
    <div
      v-else
      class="meeting2-list-rows"
    >
      <div
        v-for="meeting in filteredList"
        :key="meeting.id"
        :class="[
          'meeting2-list-row',
          { 'is-integrate-mode': isIntegrateMode, 'is-selected': isMeetingSelected(meeting.id) },
        ]"
        @click="onClickCard(meeting)"
      >
        <div
          v-if="isIntegrateMode"
          class="meeting2-list-row-check"
        >
          {{ isMeetingSelected(meeting.id) ? 'O' : '' }}
        </div>
        <div class="meeting2-list-row-title">{{ meeting.title }}</div>
        <div class="meeting2-list-row-date">{{ meeting.date }}</div>
        <div class="meeting2-list-row-meta">
          <UiBadge
            v-if="meeting.integrateYn === 'Y'"
            variant="manual-ai"
            size="sm"
          >
            통합 회의록
          </UiBadge>
          <template v-else>
            <UiBadge
              v-for="step in progressBadges(meeting.steps)"
              :key="step.key"
              :variant="step.variant"
              size="sm"
            >
              {{ step.label }}
            </UiBadge>
          </template>
        </div>
        <div
          v-if="!isIntegrateMode"
          class="meeting2-list-row-actions"
        >
          <UiButton
            variant="ghost"
            size="sm"
            icon-only
            @click.stop="doDelete(meeting.meetingId)"
          >
            <template #icon-left>
              <i class="icon-trashcan size-16" />
            </template>
          </UiButton>
        </div>
      </div>
    </div>

    <!-- 일괄 작업 바 (integrate mode + 선택된 항목 있을 때) -->
    <Transition name="meeting2-bulk-slide">
      <div
        v-if="isIntegrateMode && selectedMeetingIds.length > 0"
        class="meeting2-bulk-bar"
      >
        <span class="meeting2-bulk-count">{{ selectedMeetingIds.length }}개 선택됨</span>
        <div class="meeting2-bulk-actions">
          <UiButton
            variant="primary"
            size="sm"
            @click="doIntegrate"
          >
            통합하기
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            @click="onBulkExport"
          >
            내보내기
          </UiButton>
          <UiButton
            size="sm"
            @click="onBulkDelete"
          >
            삭제
          </UiButton>
          <UiButton
            variant="ghost"
            size="sm"
            @click="onCancelBulk"
          >
            취소
          </UiButton>
        </div>
      </div>
    </Transition>

    <!-- 새 회의 시작 모달 -->
    <MeetingStartModal
      v-if="isModalOpen"
      @close="isModalOpen = false"
      @confirm="onConfirmStart"
    />

    <!-- 비정상종료 회의 복구 모달 (페이지 진입 시 자동 조회) -->
    <MeetingRecoverModal
      v-model="isRecoverModalOpen"
      @recover="onRecover"
    />
  </div>
</template>

<script setup lang="ts">
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import type { MeetingStep } from '~/types/meeting'

definePageMeta({ path: '/meeting' })

const {
  meetingList,
  isLoadingList,
  handleSelectMeetingList,
  handleDeleteMeeting,
  handleBulkDeleteMeetings,
  handleBulkExportPdf,
  handleCreateMeeting,
  handleIntegrateMeeting,
} = useMeetingStore()

// ===== 기존 상태 (변경 없음) =====
const searchKeyword = ref('')
const isModalOpen = ref(false)
const isRecoverModalOpen = ref(false)
const isIntegrateMode = ref(false)
const selectedMeetingIds = ref<string[]>([])
const integrateShowSpeaker = ref(true)

// ===== 뷰 모드 (localStorage 유지) =====
const viewMode = ref<'grid' | 'list'>(
  (typeof localStorage !== 'undefined' ? (localStorage.getItem('meetingViewMode') as 'grid' | 'list') : null) ?? 'grid',
)

const setViewMode = (mode: 'grid' | 'list') => {
  viewMode.value = mode
  localStorage.setItem('meetingViewMode', mode)
}

// ===== 필터 상태 (로컬 ref, 페이지 이탈 시 초기화) =====
const STATUS_CHIPS = [
  { value: '', label: '전체' },
  { value: '001', label: '진행중' },
  { value: '002', label: '녹음 완료' },
  { value: '002_minutes', label: '회의록 생성' },
  { value: 'integrate', label: '통합 회의록' },
] as const

const PERIOD_OPTIONS = [
  { value: '', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: '7d', label: '최근 7일' },
  { value: '30d', label: '최근 30일' },
  { value: 'custom', label: '직접 설정' },
] as const

const SORT_OPTIONS = [
  { value: 'CREATE_DT_DESC', label: '최신순' },
  { value: 'CREATE_DT_ASC', label: '오래된순' },
  { value: 'MEETING_TITLE_ASC', label: '이름순' },
] as const

type StatusChipValue = (typeof STATUS_CHIPS)[number]['value']
type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']
type SortValue = (typeof SORT_OPTIONS)[number]['value']

const filterStatus = ref<StatusChipValue>('')
const filterPeriod = ref<PeriodValue>('')
const filterSort = ref<SortValue>('CREATE_DT_DESC')
const filterStartDate = ref('')
const filterEndDate = ref('')

// 기간 옵션 → 날짜 변환
const getPeriodDates = (period: PeriodValue): { start: string; end: string } => {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (period === 'today') return { start: fmt(today), end: fmt(today) }
  if (period === '7d') {
    const start = new Date(today)
    start.setDate(today.getDate() - 6)
    return { start: fmt(start), end: fmt(today) }
  }
  if (period === '30d') {
    const start = new Date(today)
    start.setDate(today.getDate() - 29)
    return { start: fmt(start), end: fmt(today) }
  }
  return { start: '', end: '' }
}

// sort 값 → sortField/sortOrder 분리
const parseSortValue = (val: SortValue) => {
  if (val === 'CREATE_DT_ASC') return { sortField: 'CREATE_DT', sortOrder: 'ASC' }
  if (val === 'MEETING_TITLE_ASC') return { sortField: 'MEETING_TITLE', sortOrder: 'ASC' }
  return { sortField: 'CREATE_DT', sortOrder: 'DESC' }
}

// API 파라미터 빌드
const buildApiParams = () => {
  const { sortField, sortOrder } = parseSortValue(filterSort.value)

  let statusCd = ''
  let hasMeetingMinutes = ''
  let integrateYn = ''

  if (filterStatus.value === '001') {
    statusCd = '001'
  } else if (filterStatus.value === '002') {
    statusCd = '002'
  } else if (filterStatus.value === '002_minutes') {
    statusCd = '002'
    hasMeetingMinutes = 'Y'
  } else if (filterStatus.value === 'integrate') {
    integrateYn = 'Y'
  }

  let startDate = ''
  let endDate = ''
  if (filterPeriod.value === 'custom') {
    startDate = filterStartDate.value
    endDate = filterEndDate.value
  } else if (filterPeriod.value) {
    const dates = getPeriodDates(filterPeriod.value)
    startDate = dates.start
    endDate = dates.end
  }

  return { statusCd, startDate, endDate, sortField, sortOrder, hasMeetingMinutes, integrateYn }
}

const fetchWithFilters = () => {
  handleSelectMeetingList(buildApiParams())
}

const onSelectStatus = (val: StatusChipValue) => {
  filterStatus.value = val
  fetchWithFilters()
}

const onPeriodChange = () => {
  if (filterPeriod.value !== 'custom') {
    filterStartDate.value = ''
    filterEndDate.value = ''
    fetchWithFilters()
  }
}

const onSortChange = () => {
  fetchWithFilters()
}

// 직접 설정 날짜 변경 시 API 재호출
watch([filterStartDate, filterEndDate], () => {
  if (filterPeriod.value === 'custom') {
    fetchWithFilters()
  }
})

onMounted(() => {
  fetchWithFilters()
})

// ===== 활성 필터 태그 =====
const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; label: string }> = []
  if (filterStatus.value) {
    const chip = STATUS_CHIPS.find((c) => c.value === filterStatus.value)
    if (chip) tags.push({ key: 'status', label: chip.label })
  }
  if (filterPeriod.value && filterPeriod.value !== 'custom') {
    const opt = PERIOD_OPTIONS.find((o) => o.value === filterPeriod.value)
    if (opt) tags.push({ key: 'period', label: opt.label })
  }
  if (filterPeriod.value === 'custom' && (filterStartDate.value || filterEndDate.value)) {
    tags.push({ key: 'period', label: `${filterStartDate.value || '?'} ~ ${filterEndDate.value || '?'}` })
  }
  if (filterSort.value !== 'CREATE_DT_DESC') {
    const opt = SORT_OPTIONS.find((o) => o.value === filterSort.value)
    if (opt) tags.push({ key: 'sort', label: opt.label })
  }
  return tags
})

const removeFilter = (key: string) => {
  if (key === 'status') filterStatus.value = ''
  if (key === 'period') {
    filterPeriod.value = ''
    filterStartDate.value = ''
    filterEndDate.value = ''
  }
  if (key === 'sort') filterSort.value = 'CREATE_DT_DESC'
  fetchWithFilters()
}

// ===== 기존 로직 (변경 없음) =====
const integrateButtonLabel = computed(() => {
  return isIntegrateMode.value ? '선택 취소' : '선택'
})

/**
 * API(meeting.ts) 타입의 meetingList → 템플릿 표시용 형식으로 변환 + 키워드 필터
 * steps는 meeting API 미지원 — 상태값에서 파생
 */
const filteredList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  const list = meetingList.value
  const filtered = kw ? list.filter((m) => m.meetingTitle.toLowerCase().includes(kw)) : list
  return filtered.map((m) => ({
    meetingId: m.meetingId, // 삭제/이동 시 원본 ID 사용
    id: String(m.meetingId),
    title: m.meetingTitle,
    date: m.startDt,
    status: m.status,
    integrateYn: m.integrateYn ?? 'N',
    steps: deriveDisplaySteps(m.status) satisfies MeetingStep[],
  }))
})

/** 회의 상태값 → 표시용 MeetingStep 배열 */
const deriveDisplaySteps = (status: string): MeetingStep[] => {
  if (status === '001') {
    return [{ key: 'record', label: '녹음 중', status: 'progress' }]
  }
  if (status === '002') {
    return [
      { key: 'record', label: '녹음', status: 'done' },
      { key: 'generate', label: '회의록 생성', status: 'done' },
    ]
  }
  return []
}

/** 진행 상태 뱃지 — 진행 중/완료 단계만 노출 */
const progressBadges = (steps: MeetingStep[]) => {
  return steps
    .filter((s) => s.status !== 'wait')
    .map((s) => ({
      key: s.key,
      label: s.label,
      variant: s.status === 'done' ? ('success' as const) : ('basic-chat' as const),
    }))
}

/** 새 회의 시작 모달 열기 */
const onClickNew = () => {
  isModalOpen.value = true
}

/** 카드 클릭 — 진행중인 회의(status 001)는 녹음 화면으로 이동 */
const onClickCard = (meeting: { id: string; status: string; integrateYn: string }) => {
  if (isIntegrateMode.value) {
    if (meeting.integrateYn === 'Y') {
      openToast({ message: '통합 회의록은 다시 통합할 수 없습니다.', type: 'warning' })
      return false
    }
    onToggleMeetingSelect(meeting.id)
    return
  }

  navigateTo(`/meeting/${meeting.id}`)
}

const onToggleMeetingSelect = (meetingId: string) => {
  const selectedIndex = selectedMeetingIds.value.indexOf(meetingId)

  if (selectedIndex > -1) {
    selectedMeetingIds.value.splice(selectedIndex, 1)
    return
  }

  selectedMeetingIds.value.push(meetingId)
}

const isMeetingSelected = (meetingId: string) => {
  return selectedMeetingIds.value.includes(meetingId)
}

const doDelete = (meetingId: number) => {
  handleDeleteMeeting(meetingId)
}

/** 새 회의 생성 확인 → 녹음 화면으로 이동 */
const onConfirmStart = async (params: {
  meetingTitle: string
  attendees: string
  isAutoTitle: 'Y' | 'N'
  showSpeakerYn: 'Y' | 'N'
}) => {
  isModalOpen.value = false
  const meetingId = await handleCreateMeeting(params)
  if (meetingId) {
    navigateTo(`/meeting/${meetingId}`)
  }
}

/** 복구하기 클릭 → 해당 회의 상세 페이지로 이동 */
const onRecover = ({ meetingId }: { meetingId: number }) => {
  navigateTo(`/meeting/${meetingId}`)
}

/** 헤더 버튼: 선택 모드 진입 or 취소 */
const onClickIntegrate = () => {
  if (isIntegrateMode.value) {
    // 선택 취소 — 모드 종료
    isIntegrateMode.value = false
    selectedMeetingIds.value = []
    return
  }
  // 선택 모드 진입
  isIntegrateMode.value = true
  selectedMeetingIds.value = []
  integrateShowSpeaker.value = true
}

/** 하단 바 통합하기 — 선택된 항목으로 실제 통합 실행 */
const doIntegrate = async () => {
  if (selectedMeetingIds.value.length === 0) {
    openToast({ message: '통합할 회의록을 선택해주세요.', type: 'warning' })
    return
  }
  const showSpeakerYn: 'Y' | 'N' = integrateShowSpeaker.value ? 'Y' : 'N'
  const success = await handleIntegrateMeeting(selectedMeetingIds.value.map(Number), showSpeakerYn)
  if (success) {
    isIntegrateMode.value = false
    selectedMeetingIds.value = []
  }
}

// ===== 일괄 작업 =====
const onBulkExport = () => {
  handleBulkExportPdf(selectedMeetingIds.value)
}

const onBulkDelete = async () => {
  const success = await handleBulkDeleteMeetings(selectedMeetingIds.value)
  if (success) {
    isIntegrateMode.value = false
    selectedMeetingIds.value = []
  }
}

const onCancelBulk = () => {
  isIntegrateMode.value = false
  selectedMeetingIds.value = []
}
</script>

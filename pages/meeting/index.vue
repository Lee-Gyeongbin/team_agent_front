<template>
  <div class="meeting2-list-page">
    <!-- 헤더 -->
    <div class="meeting2-list-header">
      <h2 class="meeting2-list-title">회의록</h2>
      <div class="meeting2-list-toolbar">
        <!-- 통합 모드: 발언자 표시 옵션 -->
        <UiCheckbox
          v-if="isIntegrateMode"
          v-model="integrateShowSpeaker"
          label="결정사항에 발언자 표시"
        />
        <UiButton
          variant="primary"
          size="sm"
          @click="onClickIntegrate"
        >
          <template #icon-left>
            <UiIcon
              name="square-check"
              size="16"
            />
          </template>
          {{ integrateButtonLabel }}
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          @click="onClickNew"
        >
          <template #icon-left>
            <UiIcon
              name="plus"
              size="16"
            />
          </template>
          새 회의
        </UiButton>
      </div>
    </div>

    <!-- 검색조건 -->
    <div class="meeting2-filter-bar">
      <!-- 상태 (클릭 즉시 조회) -->
      <div class="meeting2-filter-group">
        <span class="meeting2-filter-label">상태</span>
        <div class="meeting2-filter-chips">
          <button
            v-for="chip in STATUS_CHIPS"
            :key="chip.value"
            type="button"
            :class="['meeting2-filter-chip', { 'is-active': filterStatus === chip.value }]"
            @click="onSelectStatus(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>
      <!-- 기간 (프리셋은 날짜만 채움, 조회는 검색 버튼) -->
      <div class="meeting2-filter-group">
        <span class="meeting2-filter-label">기간</span>
        <UiDatePicker
          v-model="filterStartDateValue"
          size="xs"
          class="meeting2-filter-date"
          :disabled="filterPeriod !== 'custom'"
        />
        <span class="meeting2-filter-date-sep">~</span>
        <UiDatePicker
          v-model="filterEndDateValue"
          size="xs"
          class="meeting2-filter-date"
          :disabled="filterPeriod !== 'custom'"
        />
        <div class="meeting2-filter-period">
          <button
            v-for="opt in PERIOD_OPTIONS"
            :key="opt.value"
            type="button"
            :class="['meeting2-filter-period-btn', { 'is-active': filterPeriod === opt.value }]"
            @click="onSelectPeriod(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
      <!-- 회의명 -->
      <div class="meeting2-filter-group">
        <span class="meeting2-filter-label">회의명</span>
        <UiInput
          v-model="filterTitleInput"
          class="meeting2-filter-input"
          size="sm"
          placeholder="회의명 검색"
          @enter="onClickSearch"
        />
      </div>
      <!-- 참석자/공유자 (공유 기능 없음 — 참석자만 검색) -->
      <div class="meeting2-filter-group">
        <span class="meeting2-filter-label">참석자/공유자</span>
        <UiInput
          v-model="filterAttendeeInput"
          class="meeting2-filter-input"
          size="sm"
          placeholder="참석자/공유자 검색"
          @enter="onClickSearch"
        />
      </div>
      <UiButton
        class="meeting2-filter-search"
        variant="primary"
        size="sm"
        @click="onClickSearch"
      >
        검색
        <template #icon-right>
          <UiIcon
            name="search"
            size="16"
          />
        </template>
      </UiButton>
    </div>

    <!-- 건수 + 정렬 + 뷰 토글 -->
    <div class="meeting2-result-bar">
      <span class="meeting2-result-count">
        총 <strong>{{ filteredList.length }}</strong> 건
      </span>
      <div class="meeting2-result-tools">
        <UiSelect
          v-model="filterSort"
          class="meeting2-filter-select-wrap"
          :options="sortOptions"
          size="sm"
        />
        <div class="meeting2-view-toggle">
          <button
            type="button"
            :class="['meeting2-view-btn', { 'is-active': viewMode === 'grid' }]"
            title="그리드 뷰"
            @click="setViewMode('grid')"
          >
            <UiIcon
              name="layout-grid"
              size="16"
            />
          </button>
          <button
            type="button"
            :class="['meeting2-view-btn', { 'is-active': viewMode === 'list' }]"
            title="목록 뷰"
            @click="setViewMode('list')"
          >
            <UiIcon
              name="list"
              size="16"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoadingList"
      text="회의록을 불러오는 중..."
    />

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
          <!-- 표시만 — 선택은 카드 클릭과 동일 (기존 O 표시와 동일 동작) -->
          <UiCheckbox
            :model-value="isMeetingSelected(meeting.id)"
            label="회의록 선택"
            label-hidden
          />
        </div>
        <p class="meeting2-list-card-title">{{ meeting.title }}</p>
        <p class="meeting2-list-card-date">{{ meeting.date }}</p>
        <div class="meeting2-list-card-meta">
          <UiBadge
            v-if="meeting.integrateYn === 'Y'"
            variant="info"
            size="sm"
          >
            통합 회의록
          </UiBadge>
          <UiBadge
            v-else-if="meeting.abnormalYn === 'Y'"
            variant="danger"
            size="sm"
          >
            비정상 종료 · 복구 가능
          </UiBadge>
          <UiBadge
            v-else-if="meeting.pauseYn === 'Y'"
            variant="warning"
            size="sm"
          >
            일시정지
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
            aria-label="삭제"
            @click.stop="doDelete(meeting.meetingId)"
          >
            <template #icon-left>
              <UiIcon
                name="trash-2"
                size="16"
                color="muted"
              />
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
          <!-- 표시만 — 선택은 행 클릭과 동일 (기존 O 표시와 동일 동작) -->
          <UiCheckbox
            :model-value="isMeetingSelected(meeting.id)"
            label="회의록 선택"
            label-hidden
          />
        </div>
        <div class="meeting2-list-row-title">{{ meeting.title }}</div>
        <div class="meeting2-list-row-date">{{ meeting.date }}</div>
        <div class="meeting2-list-row-meta">
          <UiBadge
            v-if="meeting.integrateYn === 'Y'"
            variant="info"
            size="sm"
          >
            통합 회의록
          </UiBadge>
          <UiBadge
            v-else-if="meeting.abnormalYn === 'Y'"
            variant="danger"
            size="sm"
          >
            비정상 종료 · 복구 가능
          </UiBadge>
          <UiBadge
            v-else-if="meeting.pauseYn === 'Y'"
            variant="warning"
            size="sm"
          >
            일시정지
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
            aria-label="삭제"
            @click.stop="doDelete(meeting.meetingId)"
          >
            <template #icon-left>
              <UiIcon
                name="trash-2"
                size="16"
                color="muted"
              />
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
  </div>
</template>

<script setup lang="ts">
import { CalendarDate, toCalendarDateTime, type DateValue } from '@internationalized/date'
import {
  UiBadge,
  UiButton,
  UiCheckbox,
  UiDatePicker,
  UiEmpty,
  UiIcon,
  UiInput,
  UiLoading,
  UiSelect,
  type BadgeVariant,
  type SelectOption,
} from '@leechanyong/ispark-ui'
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
const isModalOpen = ref(false)
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
  { value: 'integrate', label: '통합 회의록' },
] as const

const PERIOD_OPTIONS = [
  { value: 'custom', label: '직접입력' },
  { value: '1w', label: '1주일' },
  { value: '1m', label: '1개월' },
  { value: '3m', label: '3개월' },
] as const

const SORT_OPTIONS = [
  { value: 'CREATE_DT_DESC', label: '최신순' },
  { value: 'CREATE_DT_ASC', label: '오래된순' },
  { value: 'MEETING_TITLE_ASC', label: '이름순' },
] as const

type StatusChipValue = (typeof STATUS_CHIPS)[number]['value']
type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value']
type SortValue = (typeof SORT_OPTIONS)[number]['value']

const sortOptions: SelectOption[] = SORT_OPTIONS.map((opt) => ({ ...opt }))

const filterStatus = ref<StatusChipValue>('')
const filterPeriod = ref<PeriodValue>('1m')
const filterSort = ref<SortValue>('CREATE_DT_DESC')
const filterStartDate = ref('')
const filterEndDate = ref('')
// 입력 중인 값 — 검색 버튼(또는 Enter) 시점에 적용값으로 복사
const filterTitleInput = ref('')
const filterAttendeeInput = ref('')
const appliedTitle = ref('')
const appliedAttendee = ref('')

const parseYyyyMmDdToDateValue = (value: string): DateValue | undefined => {
  if (!value) return undefined
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!year || !month || !day) return undefined
  return new CalendarDate(year, month, day)
}

const formatDateValueToYyyyMmDd = (value: DateValue | undefined): string => {
  if (!value) return ''
  const { year, month, day } = toCalendarDateTime(value)
  const monthText = String(month).padStart(2, '0')
  const dayText = String(day).padStart(2, '0')
  return `${year}-${monthText}-${dayText}`
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

// 로컬 날짜 → yyyy-MM-dd (toISOString 은 UTC 라 KST 오전 9시 이전엔 하루 전으로 나옴)
const formatLocalDate = (d: Date) => {
  const monthText = String(d.getMonth() + 1).padStart(2, '0')
  const dayText = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${monthText}-${dayText}`
}

// 기간 프리셋 → 날짜 변환 (오늘 포함, 예: 1개월 = 10.21 ~ 11.20)
const getPeriodDates = (period: Exclude<PeriodValue, 'custom'>): { start: string; end: string } => {
  const today = new Date()
  const start = new Date(today)
  if (period === '1w') {
    start.setDate(today.getDate() - 6)
  } else {
    start.setMonth(today.getMonth() - (period === '3m' ? 3 : 1))
    start.setDate(start.getDate() + 1)
  }
  return { start: formatLocalDate(start), end: formatLocalDate(today) }
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
  let integrateYn = ''

  if (filterStatus.value === '001') {
    statusCd = '001'
  } else if (filterStatus.value === '002') {
    statusCd = '002'
  } else if (filterStatus.value === 'integrate') {
    integrateYn = 'Y'
  }

  return {
    statusCd,
    startDate: filterStartDate.value,
    endDate: filterEndDate.value,
    sortField,
    sortOrder,
    integrateYn,
  }
}

const validateDateRange = () => {
  if (!filterStartDate.value || !filterEndDate.value) return true
  if (filterStartDate.value <= filterEndDate.value) return true
  openToast({ message: '시작일은 종료일보다 늦을 수 없습니다.', type: 'warning' })
  return false
}

/** 검색 — 입력 중인 회의명/참석자를 적용값으로 확정하고 API 재조회 */
const onClickSearch = () => {
  if (!validateDateRange()) return false
  appliedTitle.value = filterTitleInput.value.trim()
  appliedAttendee.value = filterAttendeeInput.value.trim()
  handleSelectMeetingList(buildApiParams())
  return true
}

/** 상태 칩 — 클릭 즉시 조회 */
const onSelectStatus = (val: StatusChipValue) => {
  filterStatus.value = val
  onClickSearch()
}

/** 기간 프리셋 — 날짜만 채움 (조회는 검색 버튼), 직접입력은 날짜 입력칸 활성화 */
const onSelectPeriod = (val: PeriodValue) => {
  filterPeriod.value = val
  if (val === 'custom') return
  const { start, end } = getPeriodDates(val)
  filterStartDate.value = start
  filterEndDate.value = end
}

// 정렬 변경 — 즉시 재조회
watch(filterSort, () => {
  onClickSearch()
})

onMounted(() => {
  onSelectPeriod('1m')
  onClickSearch()
})

/** 참석자 JSON([{userId, userNm}]) → 이름 목록 (구 형식 평문이면 그대로) */
const getAttendeeNames = (attendees: string | null | undefined): string => {
  if (!attendees) return ''
  try {
    const arr = JSON.parse(attendees)
    if (Array.isArray(arr)) return arr.map((u: { userNm?: string }) => u?.userNm || '').join(',')
  } catch {
    // 구 형식(평문)
  }
  return attendees
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
  const titleKw = appliedTitle.value.toLowerCase()
  const attendeeKw = appliedAttendee.value.toLowerCase()
  const filtered = meetingList.value.filter((m) => {
    if (titleKw && !(m.meetingTitle || '').toLowerCase().includes(titleKw)) return false
    if (attendeeKw && !getAttendeeNames(m.attendees).toLowerCase().includes(attendeeKw)) return false
    return true
  })
  return filtered.map((m) => ({
    meetingId: m.meetingId, // 삭제/이동 시 원본 ID 사용
    id: String(m.meetingId),
    title: m.meetingTitle,
    date: m.startDt,
    status: m.status,
    integrateYn: m.integrateYn ?? 'N',
    abnormalYn: m.abnormalYn ?? 'N',
    pauseYn: m.pauseYn || 'N',
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

/** 진행 상태 뱃지 — 진행 중/완료 단계만 노출 (ispark-ui 시맨틱 variant) */
const progressBadges = (steps: MeetingStep[]) => {
  return steps
    .filter((s) => s.status !== 'wait')
    .map((s) => ({
      key: s.key,
      label: s.label,
      variant: (s.status === 'done' ? 'success' : 'warning') as BadgeVariant,
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

/** 새 회의 생성 확인 → 참석자가 있으면 음성 등록 화면, 없으면 바로 녹음 화면 */
const onConfirmStart = async (params: {
  meetingTitle: string
  attendees: string
  isAutoTitle: 'Y' | 'N'
  showSpeakerYn: 'Y' | 'N'
}) => {
  isModalOpen.value = false
  const created = await handleCreateMeeting(params)
  if (!created) return

  const { meetingId } = created
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

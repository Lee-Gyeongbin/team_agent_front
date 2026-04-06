<template>
  <section class="my-page-sub-tab my-page-sub-tab--login-history">
    <div class="my-page-sub-tab__scroll">
      <UiLoading
        v-if="loginHistoryLoading"
        overlay
        text="로그인 이력을 불러오는 중..."
      />

      <div
        v-else-if="loginHistoryError"
        class="my-page-error"
      >
        <p class="my-page-error__message">{{ loginHistoryError }}</p>
        <UiButton
          variant="outline"
          size="md"
          @click="onRetry"
        >
          다시 시도
        </UiButton>
      </div>

      <div
        v-else
        class="my-page-login-history-body"
      >
        <div class="my-page-login-history-filters">
          <div class="my-page-login-history-filter-item">
            <span class="my-page-login-history-filter-label">시작일</span>
            <UiDatePicker
              v-model="filterDateStart"
              size="sm"
            />
          </div>
          <div class="my-page-login-history-filter-item">
            <span class="my-page-login-history-filter-label">종료일</span>
            <UiDatePicker
              v-model="filterDateEnd"
              size="sm"
            />
          </div>
          <div class="my-page-login-history-filter-item my-page-login-history-filter-item--grow">
            <span class="my-page-login-history-filter-label">IP 주소</span>
            <UiInput
              v-model="filterIpKeyword"
              type="search"
              placeholder="IP 입력"
              size="sm"
              @search="onSearch"
              @enter="onSearch"
            />
          </div>
          <div class="my-page-login-history-filter-item">
            <span class="my-page-login-history-filter-label">결과</span>
            <UiSelect
              v-model="filterResult"
              :options="resultFilterOptions"
              placeholder="전체"
              size="sm"
            />
          </div>
          <div class="my-page-login-history-filter-actions">
            <UiButton
              variant="primary"
              size="sm"
              @click="onSearch"
            >
              조회
            </UiButton>
          </div>
        </div>

        <div class="my-page-login-history-table-wrap">
          <UiTable
            :columns="historyColumns"
            :data="loginHistoryList"
            empty-text="로그인 이력이 없습니다."
            sticky-header
            size="sm"
          >
            <template #cell-createDt="{ value }">
              {{ formatDateTimeDisplay(String(value ?? '')) }}
            </template>
          </UiTable>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getLocalTimeZone, today, toCalendarDate, toCalendarDateTime, CalendarDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { historyColumns, type MyPageHistoryParams } from '~/types/my-page'
import { openToast } from '~/composables/useToast'
import { apiStringFromDateValue, dateValueFromApiString, formatDateTimeDisplay } from '~/utils/global/dateUtil'

/** 첫 진입 기본 조회 기간(일) */
const INITIAL_RANGE_DAYS = 7
const rangeEnd = today(getLocalTimeZone())
const rangeStart = rangeEnd.subtract({ days: INITIAL_RANGE_DAYS - 1 })

const toApiDateTime = (d: DateValue, isEnd = false) => {
  const { year, month, day } = toCalendarDateTime(d)
  const [hour, minute, second] = isEnd ? [23, 59, 59] : [0, 0, 0]
  return apiStringFromDateValue(new CalendarDateTime(year, month, day, hour, minute, second))
}

const lastParams = ref<MyPageHistoryParams>({
  fromDt: toApiDateTime(rangeStart, false),
  toDt: toApiDateTime(rangeEnd, true),
  ipAddr: '',
  result: '',
})

const { loginHistoryList, loginHistoryLoading, loginHistoryError, handleLoadHistory } = useMyPageStore()

const filterDateStart = ref<DateValue | undefined>()
const filterDateEnd = ref<DateValue | undefined>()
const filterIpKeyword = ref('')
const filterResult = ref('')

const buildParams = () => ({
  fromDt: filterDateStart.value ? toApiDateTime(filterDateStart.value) : '',
  toDt: filterDateEnd.value ? toApiDateTime(filterDateEnd.value, true) : '',
  ipAddr: String(filterIpKeyword.value),
  result: String(filterResult.value ?? ''),
})

const parseApiDate = (v?: string) => {
  if (!v?.trim()) return undefined
  const parsed = dateValueFromApiString(v)
  return parsed ? toCalendarDate(parsed) : undefined
}

const syncFilters = () => {
  const p = lastParams.value
  filterDateStart.value = parseApiDate(p.fromDt)
  filterDateEnd.value = parseApiDate(p.toDt)
  filterIpKeyword.value = String(p.ipAddr ?? '')
  filterResult.value = p.result ?? ''
}

onMounted(() => {
  syncFilters()
  void handleLoadHistory(lastParams.value)
})

const isInvalidDateRange = computed(() => {
  const s = filterDateStart.value
  const e = filterDateEnd.value
  if (!s || !e) return false
  return toCalendarDate(toCalendarDateTime(s)).compare(toCalendarDate(toCalendarDateTime(e))) > 0
})

/** 결과 필터 */
const resultFilterOptions = [
  { label: '전체', value: '' },
  { label: 'SUCCESS', value: 'SUCCESS' },
  { label: 'FAIL', value: 'FAIL' },
]

const onRetry = () => {
  void handleLoadHistory(lastParams.value)
}

const onSearch = () => {
  if (isInvalidDateRange.value) {
    openToast({
      message: '시작일이 종료일보다 늦습니다. 날짜를 다시 선택해 주세요.',
      type: 'warning',
    })
    return
  }
  const params = buildParams()
  lastParams.value = params
  void handleLoadHistory(params)
}
</script>

<template>
  <div
    class="ui-datepicker-wrap"
    :class="{ 'has-time': type === 'datetime', 'is-month': type === 'month' }"
  >
    <DatePickerRoot
      v-model="internalDate"
      v-model:placeholder="calendarPlaceholder"
      :open="type === 'month' ? monthPickerOpen : undefined"
      :locale="locale"
      :granularity="pickerGranularity"
      :disabled="disabled"
      :min-value="minValue"
      :max-value="maxValue"
      @update:open="onRootOpenUpdate"
    >
      <DatePickerField
        v-slot="{ segments }"
        class="ui-datepicker-field"
        :class="[`size-dp-${size}`, { 'is-disabled': disabled }]"
      >
        <template
          v-for="item in segments"
          :key="item.part"
        >
          <DatePickerInput
            v-if="item.part === 'literal'"
            :part="item.part"
            class="ui-datepicker-literal"
          >
            {{ item.value }}
          </DatePickerInput>
          <DatePickerInput
            v-else
            :part="item.part"
            class="ui-datepicker-segment"
          >
            {{ item.value }}
          </DatePickerInput>
        </template>

        <DatePickerTrigger class="ui-datepicker-trigger">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <rect
              x="2"
              y="3"
              width="12"
              height="11"
              rx="2"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M2 7h12"
              stroke="currentColor"
              stroke-width="1.5"
            />
            <path
              d="M5.5 1.5v3M10.5 1.5v3"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </DatePickerTrigger>
      </DatePickerField>

      <DatePickerContent
        class="ui-datepicker-popover"
        :side-offset="4"
      >
        <!-- type=month: 일 그리드 대신 월 선택 (granularity=month는 필드 세그먼트만 처리, 캘린더는 day 고정) -->
        <div
          v-if="type === 'month'"
          class="ui-datepicker-month-panel"
        >
          <div class="ui-datepicker-header ui-datepicker-header--month">
            <button
              type="button"
              class="ui-datepicker-nav"
              :disabled="disabled || isPrevYearDisabled"
              aria-label="이전 연도"
              @click="onMonthPanelPrevYear"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M10 4l-4 4 4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <UiSelect
              class="ui-datepicker-select ui-datepicker-select--year-only"
              :model-value="String(calendarPlaceholder?.year)"
              :options="yearSelectOptions"
              size="xs"
              :disabled="disabled"
              @update:model-value="onYearSelect"
            />

            <button
              type="button"
              class="ui-datepicker-nav"
              :disabled="disabled || isNextYearDisabled"
              aria-label="다음 연도"
              @click="onMonthPanelNextYear"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            class="ui-datepicker-month-grid"
            role="grid"
            :aria-label="`${calendarPlaceholder?.year}년 월 선택`"
          >
            <button
              v-for="m in monthGridValues"
              :key="m"
              type="button"
              role="gridcell"
              class="ui-datepicker-month-cell"
              :disabled="disabled || isMonthOutOfRange(calendarPlaceholder?.year ?? now.getFullYear(), m)"
              :class="{
                'is-selected': isMonthCellSelected(calendarPlaceholder?.year ?? now.getFullYear(), m),
              }"
              @click="onSelectMonth(m)"
            >
              {{ m }}월
            </button>
          </div>
        </div>

        <DatePickerCalendar
          v-else
          v-slot="{ weekDays, grid }"
          class="ui-datepicker-calendar"
        >
          <div class="ui-datepicker-header">
            <DatePickerPrev class="ui-datepicker-nav">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M10 4l-4 4 4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </DatePickerPrev>

            <div class="ui-datepicker-selects">
              <UiSelect
                class="ui-datepicker-select"
                :model-value="String(calendarPlaceholder?.year)"
                :options="yearSelectOptions"
                size="xs"
                @update:model-value="onYearSelect"
              />
              <UiSelect
                class="ui-datepicker-select"
                :model-value="String(calendarPlaceholder?.month)"
                :options="monthSelectOptions"
                size="xs"
                @update:model-value="onMonthSelect"
              />
            </div>

            <DatePickerNext class="ui-datepicker-nav">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </DatePickerNext>
          </div>

          <DatePickerGrid
            v-for="month in grid"
            :key="month.value.toString()"
          >
            <DatePickerGridHead>
              <DatePickerGridRow class="ui-datepicker-row">
                <DatePickerHeadCell
                  v-for="day in weekDays"
                  :key="day"
                  class="ui-datepicker-head-cell"
                >
                  {{ day }}
                </DatePickerHeadCell>
              </DatePickerGridRow>
            </DatePickerGridHead>

            <DatePickerGridBody>
              <DatePickerGridRow
                v-for="(weekDates, index) in month.rows"
                :key="`row-${index}`"
                class="ui-datepicker-row"
              >
                <DatePickerCell
                  v-for="weekDate in weekDates"
                  :key="weekDate.toString()"
                  :date="weekDate"
                  class="ui-datepicker-cell"
                >
                  <DatePickerCellTrigger
                    :day="weekDate"
                    :month="month.value"
                    class="ui-datepicker-cell-trigger"
                  />
                </DatePickerCell>
              </DatePickerGridRow>
            </DatePickerGridBody>
          </DatePickerGrid>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>

    <!-- 시간 입력 (datetime 전용) -->
    <div
      v-if="type === 'datetime'"
      class="ui-datepicker-time"
      :class="[`size-dp-${size}`, { 'is-disabled': disabled }]"
    >
      <input
        :value="timeHourDisplay"
        class="ui-datepicker-time-input"
        maxlength="2"
        placeholder="00"
        :disabled="disabled"
        @focus="onTimeFieldFocus"
        @blur="onTimeBlur($event, 'hour')"
        @keydown="onTimeKeydown($event, 'hour')"
      />
      <span class="ui-datepicker-time-sep">:</span>
      <input
        :value="timeMinuteDisplay"
        class="ui-datepicker-time-input"
        maxlength="2"
        placeholder="00"
        :disabled="disabled"
        @focus="onTimeFieldFocus"
        @blur="onTimeBlur($event, 'minute')"
        @keydown="onTimeKeydown($event, 'minute')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'radix-vue'
import { CalendarDate, CalendarDateTime, endOfMonth, toCalendarDate, type DateValue } from '@internationalized/date'
import type { Ref } from 'vue'

interface Props {
  modelValue?: DateValue
  type?: 'date' | 'datetime' | 'month'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  disabled?: boolean
  locale?: string
  minValue?: DateValue
  maxValue?: DateValue
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  type: 'date',
  size: 'sm',
  disabled: false,
  locale: 'ko-KR',
  minValue: undefined,
  maxValue: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: DateValue | undefined]
}>()

/** date/datetime → day, month → month (입력 세그먼트에서 일 숨김) — radix-vue DatePickerRoot Granularity 타입에 month 미기재 */
const pickerGranularity = computed(() => (props.type === 'month' ? 'month' : 'day') as never)

/** month 타입만 팝업 open 제어(월 선택 후 닫기) */
const monthPickerOpen = ref(false)

const onRootOpenUpdate = (open: boolean) => {
  if (props.type === 'month') {
    monthPickerOpen.value = open
  }
}

const monthGridValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** 해당 연·월이 min/max와 겹치는 날이 하나도 없으면 비활성 */
const isMonthOutOfRange = (year: number, month: number) => {
  const monthStart = new CalendarDate(year, month, 1)
  const monthEnd = toCalendarDate(endOfMonth(monthStart))
  if (props.minValue) {
    const minD = toCalendarDate(props.minValue)
    if (monthEnd.compare(minD) < 0) return true
  }
  if (props.maxValue) {
    const maxD = toCalendarDate(props.maxValue)
    if (monthStart.compare(maxD) > 0) return true
  }
  return false
}

const isMonthCellSelected = (year: number, month: number) => {
  const v = props.modelValue
  if (!v || props.type !== 'month') return false
  const cd = toCalendarDate(v)
  return cd.year === year && cd.month === month
}

// ===== 시간 입력 (datetime 전용) =====
const timeHour = ref(0)
const timeMinute = ref(0)

// modelValue 변경 시 시간 동기화
watch(
  () => props.modelValue,
  (v: DateValue | undefined) => {
    if (v && 'hour' in v) {
      const dt = v as CalendarDateTime
      timeHour.value = dt.hour
      timeMinute.value = dt.minute
    }
  },
  { immediate: true },
)

const timeHourDisplay = computed(() => String(timeHour.value).padStart(2, '0'))
const timeMinuteDisplay = computed(() => String(timeMinute.value).padStart(2, '0'))

const onTimeFieldFocus = (e: FocusEvent) => {
  const el = e.target as HTMLInputElement
  el.select()
}

const emitDateTime = () => {
  const v = props.modelValue
  if (!v) return
  emit('update:modelValue', new CalendarDateTime(v.year, v.month, v.day, timeHour.value, timeMinute.value))
}

const onTimeBlur = (e: Event, field: 'hour' | 'minute') => {
  const input = e.target as HTMLInputElement
  const n = parseInt(input.value, 10)
  if (field === 'hour' && !isNaN(n) && n >= 0 && n <= 23) {
    timeHour.value = n
  } else if (field === 'minute' && !isNaN(n) && n >= 0 && n <= 59) {
    timeMinute.value = n
  }
  // 포맷 복원
  input.value = field === 'hour' ? timeHourDisplay.value : timeMinuteDisplay.value
  emitDateTime()
}

const onTimeKeydown = (e: KeyboardEvent, field: 'hour' | 'minute') => {
  const input = e.target as HTMLInputElement
  // 화살표 키로 증감
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault()
    const delta = e.key === 'ArrowUp' ? 1 : -1
    if (field === 'hour') {
      timeHour.value = (timeHour.value + delta + 24) % 24
    } else {
      timeMinute.value = (timeMinute.value + delta + 60) % 60
    }
    input.value = field === 'hour' ? timeHourDisplay.value : timeMinuteDisplay.value
    input.select()
    emitDateTime()
  }
  // Enter 키로 확정
  if (e.key === 'Enter') {
    input.blur()
  }
  // 숫자, 백스페이스, Tab, 화살표 외 입력 차단
  if (!/^\d$/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
  }
}

// ===== DatePicker (날짜만) =====
const internalDate = computed({
  get: () => {
    const v = props.modelValue
    if (!v) return undefined
    // datetime 모드에서는 날짜만 추출
    if (props.type === 'datetime') {
      return new CalendarDate(v.year, v.month, v.day)
    }
    // month: 항상 1일로 정규화 (granularity=month 와 값 일치)
    if (props.type === 'month') {
      return new CalendarDate(v.year, v.month, 1)
    }
    return v
  },
  set: (val: DateValue | undefined) => {
    if (!val) {
      emit('update:modelValue', undefined)
      return
    }
    // datetime 모드에서는 시간 값과 결합
    if (props.type === 'datetime') {
      emit('update:modelValue', new CalendarDateTime(val.year, val.month, val.day, timeHour.value, timeMinute.value))
    } else if (props.type === 'month') {
      emit('update:modelValue', new CalendarDate(val.year, val.month, 1))
    } else {
      emit('update:modelValue', val)
    }
  },
})

// 캘린더에 표시되는 현재 월 (placeholder)
const now = new Date()
const calendarPlaceholder = ref(new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)) as Ref<DateValue>

// 년도 옵션 (현재 기준 ±10년)
const yearOptions = computed((): number[] => {
  const current = calendarPlaceholder.value?.year ?? now.getFullYear()
  const years: number[] = []
  for (let y = current - 10; y <= current + 10; y++) {
    years.push(y)
  }
  return years
})

// UiSelect용 옵션
const yearSelectOptions = computed(() => yearOptions.value.map((y: number) => ({ label: `${y}년`, value: String(y) })))

const monthSelectOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}월`, value: String(i + 1) })),
)

const onYearSelect = (val: string | number) => {
  const year = Number(val)
  const month = calendarPlaceholder.value?.month ?? 1
  calendarPlaceholder.value = new CalendarDate(year, month, 1)
}

const onMonthSelect = (val: string | number) => {
  const month = Number(val)
  const year = calendarPlaceholder.value?.year ?? now.getFullYear()
  calendarPlaceholder.value = new CalendarDate(year, month, 1)
}

// ===== 월 선택 패널 (type=month, placeholder 이후) =====
const onSelectMonth = (month: number) => {
  const y = calendarPlaceholder.value?.year ?? now.getFullYear()
  if (isMonthOutOfRange(y, month)) return
  const next = new CalendarDate(y, month, 1)
  emit('update:modelValue', next)
  calendarPlaceholder.value = next
  monthPickerOpen.value = false
}

const onMonthPanelPrevYear = () => {
  const ph = calendarPlaceholder.value
  if (!ph) return
  calendarPlaceholder.value = ph.subtract({ years: 1 })
}

const onMonthPanelNextYear = () => {
  const ph = calendarPlaceholder.value
  if (!ph) return
  calendarPlaceholder.value = ph.add({ years: 1 })
}

const isPrevYearDisabled = computed(() => {
  if (!props.minValue || !calendarPlaceholder.value) return false
  const minY = toCalendarDate(props.minValue).year
  return (calendarPlaceholder.value.year ?? 0) <= minY
})

const isNextYearDisabled = computed(() => {
  if (!props.maxValue || !calendarPlaceholder.value) return false
  const maxY = toCalendarDate(props.maxValue).year
  return (calendarPlaceholder.value.year ?? 0) >= maxY
})
</script>

<!-- 글로벌: Radix 내부 요소에 scoped가 적용 안 되므로 -->
<style lang="scss">
// 필드 영역
.ui-datepicker-field {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  padding: 0 10px;
  gap: 0;

  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;
  transition: border-color $transition-base;
  cursor: text;

  &:hover:not(.is-disabled) {
    border-color: var(--color-primary);
  }

  &:focus-within:not(.is-disabled) {
    border-color: var(--color-primary);
  }

  // 사이즈
  &.size-dp-xs {
    height: $height-xs;
    font-size: $font-size-sm;
  }

  &.size-dp-sm {
    height: $height-sm;
    font-size: $font-size-base;
  }

  &.size-dp-md {
    height: $height-md;
    font-size: $font-size-base;
  }

  &.size-dp-lg {
    height: $height-lg;
    font-size: $font-size-base;
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-datepicker-segment {
  display: inline;
  padding: 1px 2px;
  border-radius: 2px;
  color: $color-text-primary;
  font-weight: $font-weight-medium;
  outline: none;

  &:focus {
    background: var(--color-primary);
    color: #fff;
  }

  &[data-placeholder] {
    color: #aebccb;
  }
}

.ui-datepicker-literal {
  display: inline;
  color: $color-text-muted;
  padding: 0 1px;
}

.ui-datepicker-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 4px;
  color: $color-text-muted;
  cursor: pointer;
  border: none;
  background: none;
  outline: none;
  flex-shrink: 0;

  &:hover {
    color: var(--color-primary);
  }
}

// datetime 모드 — 날짜 + 시간 가로 배치
.ui-datepicker-wrap.has-time {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

// 시간 입력
.ui-datepicker-time {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  background-color: #fff;
  border: 1px solid #c6d2db;
  border-radius: $border-radius-base;
  transition: border-color $transition-base;
  flex-shrink: 0;

  &:hover:not(.is-disabled) {
    border-color: var(--color-primary);
  }

  &:focus-within:not(.is-disabled) {
    border-color: var(--color-primary);
  }

  // 사이즈
  &.size-dp-xs {
    height: $height-xs;
    font-size: $font-size-sm;
  }

  &.size-dp-sm {
    height: $height-sm;
    font-size: $font-size-base;
  }

  &.size-dp-md {
    height: $height-md;
    font-size: $font-size-base;
  }

  &.size-dp-lg {
    height: $height-lg;
    font-size: $font-size-base;
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.ui-datepicker-time-input {
  width: 24px;
  border: none;
  outline: none;
  background: none;
  text-align: center;
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  font-size: inherit;
  padding: 0;

  &:focus {
    background: var(--color-primary);
    color: #fff;
    border-radius: 2px;
  }

  &::placeholder {
    color: #aebccb;
  }
}

.ui-datepicker-time-sep {
  color: $color-text-muted;
  font-weight: $font-weight-medium;
}

// 캘린더 팝오버
.ui-datepicker-popover {
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-lg;
  padding: $spacing-md;
  z-index: $z-modal;
}

.ui-datepicker-calendar {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.ui-datepicker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ui-datepicker-selects {
  display: flex;
  align-items: center;
  gap: 4px;
}

// UiSelect 래퍼 — 캘린더 내부 셀렉트 스타일 오버라이드
.ui-datepicker-select {
  .ui-select-wrap {
    border: none;
    background: none;
    @include typo($body-medium-bold);
    color: $color-text-heading;
    height: auto;
    padding: 2px 4px;

    &:hover {
      background: $color-background;
      border-radius: $border-radius-sm;
    }
  }
}

.ui-datepicker-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  cursor: pointer;
  outline: none;

  &:hover {
    background: $color-background;
    color: $color-text-primary;
  }
}

.ui-datepicker-head-cell {
  width: 36px;
  height: 28px;
  text-align: center;
  @include typo($body-xsmall);
  color: $color-text-muted;
  font-weight: $font-weight-semibold;
}

.ui-datepicker-row {
  display: flex;
}

.ui-datepicker-cell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ui-datepicker-cell-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: $border-radius-full;
  font-size: $font-size-sm;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;
  transition: all $transition-fast;

  &:hover {
    background: $color-background;
  }

  // 오늘
  &[data-today] {
    font-weight: $font-weight-bold;
    color: var(--color-primary);
  }

  // 선택됨
  &[data-selected] {
    background: var(--color-primary);
    color: #fff;
    font-weight: $font-weight-bold;

    &:hover {
      background: var(--color-primary-hover);
    }
  }

  // 비활성 날짜
  &[data-disabled] {
    color: $color-text-disabled;
    cursor: not-allowed;
  }

  // 다른 달
  &[data-outside-month] {
    color: $color-text-disabled;
    opacity: 0.4;
  }

  // 사용 불가
  &[data-unavailable] {
    color: $color-text-disabled;
    text-decoration: line-through;
  }
}

// 월 선택 패널 (type=month)
.ui-datepicker-month-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  min-width: 260px;
}

.ui-datepicker-header--month {
  justify-content: center;
  gap: $spacing-sm;
}

.ui-datepicker-select--year-only.ui-datepicker-select {
  flex: 1;
  min-width: 0;
  max-width: 140px;
}

.ui-datepicker-month-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-xs;
}

.ui-datepicker-month-cell {
  height: 40px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
  @include typo($body-small);
  font-weight: $font-weight-medium;
  color: $color-text-primary;
  cursor: pointer;
  outline: none;
  transition:
    background $transition-fast,
    border-color $transition-fast,
    color $transition-fast;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: $color-background;
  }

  &:focus-visible {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(60, 105, 219, 0.2);
  }

  &.is-selected {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: #fff;
    font-weight: $font-weight-bold;

    &:hover:not(:disabled) {
      background: var(--color-primary-hover);
      border-color: var(--color-primary-hover);
    }
  }

  &:disabled {
    color: $color-text-disabled;
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>

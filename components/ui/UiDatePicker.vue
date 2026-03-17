<template>
  <div class="ui-datepicker-wrap">
    <DatePickerRoot
      v-model="dateValue"
      v-model:placeholder="calendarPlaceholder"
      :locale="locale"
      :granularity="granularity"
      :disabled="disabled"
      :min-value="minValue"
      :max-value="maxValue"
      :hour-cycle="24"
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
        <DatePickerCalendar
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
              <select
                class="ui-datepicker-select"
                :value="calendarPlaceholder?.year"
                @change="onYearChange"
              >
                <option
                  v-for="y in yearOptions"
                  :key="y"
                  :value="y"
                >
                  {{ y }}년
                </option>
              </select>
              <select
                class="ui-datepicker-select"
                :value="calendarPlaceholder?.month"
                @change="onMonthChange"
              >
                <option
                  v-for="m in 12"
                  :key="m"
                  :value="m"
                >
                  {{ m }}월
                </option>
              </select>
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
import { CalendarDate, type DateValue } from '@internationalized/date'
import type { Ref } from 'vue'

interface Props {
  modelValue?: DateValue
  type?: 'date' | 'datetime'
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

const granularity = computed(() => (props.type === 'datetime' ? 'minute' : 'day'))

const dateValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 캘린더에 표시되는 현재 월 (placeholder)
const now = new Date()
const calendarPlaceholder = ref(new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)) as Ref<DateValue>

// 년도 옵션 (현재 기준 ±10년)
const yearOptions = computed(() => {
  const current = calendarPlaceholder.value?.year ?? now.getFullYear()
  const years: number[] = []
  for (let y = current - 10; y <= current + 10; y++) {
    years.push(y)
  }
  return years
})

const onYearChange = (e: Event) => {
  const year = Number((e.target as HTMLSelectElement).value)
  const month = calendarPlaceholder.value?.month ?? 1
  calendarPlaceholder.value = new CalendarDate(year, month, 1)
}

const onMonthChange = (e: Event) => {
  const month = Number((e.target as HTMLSelectElement).value)
  const year = calendarPlaceholder.value?.year ?? now.getFullYear()
  calendarPlaceholder.value = new CalendarDate(year, month, 1)
}
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

.ui-datepicker-select {
  @include typo($body-medium-bold);
  color: $color-text-heading;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  padding: 2px 4px;
  border-radius: $border-radius-sm;

  &:hover {
    background: $color-background;
  }

  &:focus {
    background: $color-background;
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
</style>

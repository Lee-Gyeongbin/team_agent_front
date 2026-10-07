import type { ComputedRef } from 'vue'

const MARKETING_CALENDAR_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

export interface MarketingCalendarCell<T> {
  key: string
  day: number | null
  isToday: boolean
  events: T[]
}

const formatMarketingCalendarKey = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** 캘린더 이벤트의 날짜(YYYY-MM-DD) 키 추출 — 시간 포함 문자열도 허용 */
export const toMarketingCalendarDateKey = (raw: string) => {
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  return formatMarketingCalendarKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/** 월간 캘린더 그리드 공통 로직 — 요일 헤더, 월 이동, 패딩 포함 셀 배열 조립 */
export const useMarketingCalendarGrid = <T>(
  eventsByDate: ComputedRef<Map<string, T[]>>,
  options: { padEnd?: boolean } = {},
) => {
  const now = new Date()
  const year = ref(now.getFullYear())
  const month = ref(now.getMonth() + 1)
  const todayKey = formatMarketingCalendarKey(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const cells = computed(() => {
    const first = new Date(year.value, month.value - 1, 1)
    const daysInMonth = new Date(year.value, month.value, 0).getDate()
    const startWeekday = first.getDay()
    const result: MarketingCalendarCell<T>[] = []

    for (let i = 0; i < startWeekday; i += 1) {
      result.push({ key: `pad-${i}`, day: null, isToday: false, events: [] })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = formatMarketingCalendarKey(year.value, month.value, day)
      result.push({
        key: dateKey,
        day,
        isToday: dateKey === todayKey,
        events: eventsByDate.value.get(dateKey) ?? [],
      })
    }
    if (options.padEnd) {
      const remainder = result.length % 7
      if (remainder !== 0) {
        for (let i = remainder; i < 7; i += 1) {
          result.push({ key: `pad-end-${i}`, day: null, isToday: false, events: [] })
        }
      }
    }
    return result
  })

  const onPrevMonth = () => {
    if (month.value === 1) {
      year.value -= 1
      month.value = 12
      return
    }
    month.value -= 1
  }

  const onNextMonth = () => {
    if (month.value === 12) {
      year.value += 1
      month.value = 1
      return
    }
    month.value += 1
  }

  return {
    WEEKDAYS: MARKETING_CALENDAR_WEEKDAYS,
    year,
    month,
    cells,
    onPrevMonth,
    onNextMonth,
  }
}

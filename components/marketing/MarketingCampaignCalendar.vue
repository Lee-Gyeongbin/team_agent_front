<template>
  <div class="marketing-campaign-calendar">
    <button
      class="marketing-back-btn"
      type="button"
      @click="emit('close')"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      마케팅 프로젝트
    </button>

    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">캠페인 캘린더</h1>
        <p class="marketing-list-desc">전체 캠페인의 콘텐츠 발행 일정을 한눈에 확인하세요.</p>
      </div>
    </div>

    <div class="marketing-campaign-calendar__head">
      <UiButton
        class="marketing-campaign-calendar__today"
        variant="outline"
        size="sm"
        @click="onToday"
      >
        오늘
      </UiButton>
      <div class="marketing-campaign-calendar__nav">
        <button
          type="button"
          class="marketing-campaign-calendar__nav-btn"
          aria-label="이전 달"
          @click="onPrevMonth"
        >
          <UiIcon
            name="arrow-right"
            size="24"
            class="marketing-campaign-calendar__nav-prev"
          />
        </button>
        <span>{{ year }}년 {{ month }}월</span>
        <button
          type="button"
          class="marketing-campaign-calendar__nav-btn"
          aria-label="다음 달"
          @click="onNextMonth"
        >
          <UiIcon
            name="arrow-right"
            size="24"
          />
        </button>
      </div>
      <select
        v-model="campaignFilter"
        class="marketing-calendar-filter marketing-campaign-calendar__filter"
      >
        <option value="">캠페인 전체</option>
        <option
          v-for="name in campaignNames"
          :key="name"
          :value="name"
        >
          {{ name }}
        </option>
      </select>
    </div>

    <UiLoading
      v-if="isLoadingCalendarEvents"
      text="일정을 불러오는 중..."
    />
    <template v-else>
      <div class="marketing-campaign-calendar__weekdays">
        <span
          v-for="weekday in WEEKDAYS"
          :key="weekday"
        >
          {{ weekday }}
        </span>
      </div>

      <div class="marketing-campaign-calendar__grid">
        <div
          v-for="cell in cells"
          :key="cell.key"
          class="marketing-campaign-calendar__cell"
          :class="{ 'is-empty': !cell.day, 'is-today': cell.isToday }"
        >
          <span v-if="cell.day">{{ cell.day }}</span>
          <div
            v-for="event in cell.events"
            :key="event.eventId"
            class="marketing-campaign-calendar__event"
            :class="`status-${event.statusKey}`"
            :title="`${event.campaignNm} · ${event.title}`"
          >
            {{ event.title }}
          </div>
        </div>
      </div>

      <div class="marketing-campaign-calendar__legend">
        <span
          v-for="item in LEGEND"
          :key="item.key"
        >
          <i :class="`status-${item.key}`" />{{ item.label }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiLoading } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'

const emit = defineEmits<{
  close: []
}>()

const props = withDefaults(
  defineProps<{
    selectedCampaignNm?: string
  }>(),
  {
    selectedCampaignNm: '',
  },
)

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const LEGEND = [
  { key: 'draft', label: '초안 작성 중' },
  { key: 'review', label: '검수 중' },
  { key: 'needsapprove', label: '승인 필요' },
  { key: 'approved', label: '승인 완료' },
  { key: 'scheduled', label: '발행 예약' },
  { key: 'done', label: '발행 완료' },
  { key: 'failed', label: '발행 실패' },
] as const

const { calendarEvents, isLoadingCalendarEvents, handleSelectCalendarEvents } = useMarketingStore()

const campaignFilter = ref(props.selectedCampaignNm.trim())
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const campaignNames = computed(() => {
  const names = [...new Set(calendarEvents.value.map((event) => event.campaignNm))]
  const selected = props.selectedCampaignNm.trim()
  if (selected && !names.includes(selected)) names.unshift(selected)
  return names
})

const filteredEvents = computed(() =>
  campaignFilter.value
    ? calendarEvents.value.filter((event) => event.campaignNm === campaignFilter.value)
    : calendarEvents.value,
)

const toDateKey = (raw: string) => {
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  const monthText = String(date.getMonth() + 1).padStart(2, '0')
  const dayText = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${monthText}-${dayText}`
}

const eventsByDate = computed(() => {
  const map = new Map<string, typeof filteredEvents.value>()
  filteredEvents.value.forEach((event) => {
    const dateKey = toDateKey(event.eventDt)
    if (!dateKey) return
    const list = map.get(dateKey) ?? []
    list.push(event)
    map.set(dateKey, list)
  })
  return map
})

const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const startWeekday = first.getDay()
  const result: { key: string; day: number | null; isToday: boolean; events: typeof filteredEvents.value }[] = []

  for (let i = 0; i < startWeekday; i += 1) {
    result.push({ key: `pad-${i}`, day: null, isToday: false, events: [] })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year.value}-${String(month.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    result.push({
      key: dateKey,
      day,
      isToday: dateKey === todayKey,
      events: eventsByDate.value.get(dateKey) ?? [],
    })
  }
  const remainder = result.length % 7
  if (remainder !== 0) {
    for (let i = remainder; i < 7; i += 1) {
      result.push({ key: `pad-end-${i}`, day: null, isToday: false, events: [] })
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

const onToday = () => {
  const today = new Date()
  year.value = today.getFullYear()
  month.value = today.getMonth() + 1
}

onMounted(() => void handleSelectCalendarEvents())
</script>

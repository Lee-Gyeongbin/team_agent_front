<template>
  <section class="marketing-publish-calendar">
    <div class="marketing-publish-calendar__head">
      <strong>발행 캘린더</strong>
      <div class="marketing-publish-calendar__nav">
        <button
          type="button"
          class="marketing-publish-calendar__nav-btn"
          aria-label="이전 달"
          @click="onPrevMonth"
        >
          <i class="icon-arrow-right size-16 marketing-publish-calendar__nav-prev" />
        </button>
        <span>{{ year }}년 {{ month }}월</span>
        <button
          type="button"
          class="marketing-publish-calendar__nav-btn"
          aria-label="다음 달"
          @click="onNextMonth"
        >
          <i class="icon-arrow-right size-16" />
        </button>
      </div>
    </div>

    <div class="marketing-publish-calendar__weekdays">
      <span
        v-for="weekday in WEEKDAYS"
        :key="weekday"
      >
        {{ weekday }}
      </span>
    </div>

    <div class="marketing-publish-calendar__grid">
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="marketing-publish-calendar__cell"
        :class="{
          'is-empty': !cell.day,
          'is-today': cell.isToday,
        }"
      >
        <span v-if="cell.day">{{ cell.day }}</span>
        <button
          v-for="event in cell.events"
          :key="event.contentId"
          type="button"
          class="marketing-publish-calendar__event"
          :class="`is-${event.progressKey}`"
          :title="event.displayTitle"
          @click="emit('select', event.contentId)"
        >
          {{ event.label }}
        </button>
      </div>
    </div>

    <div class="marketing-publish-calendar__legend">
      <span><i class="is-review" />검수 중</span>
      <span><i class="is-scheduled" />예약됨</span>
      <span><i class="is-done" />발행 완료</span>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface MarketingCalendarEvent {
  contentId: string
  displayTitle: string
  channelNm: string
  publishScheduledDt: string
  progressKey: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

const props = defineProps<{
  items: MarketingCalendarEvent[]
}>()

const emit = defineEmits<{
  select: [contentId: string]
}>()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const toDateKey = (raw: string) => {
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  const monthText = String(date.getMonth() + 1).padStart(2, '0')
  const dayText = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${monthText}-${dayText}`
}

const formatHm = (raw: string) => {
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return ''
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const eventsByDate = computed(() => {
  const map = new Map<string, { contentId: string; displayTitle: string; progressKey: string; label: string }[]>()
  props.items.forEach((item) => {
    const dateKey = toDateKey(item.publishScheduledDt)
    if (!dateKey) return
    const time = formatHm(item.publishScheduledDt)
    const name = item.channelNm || item.displayTitle
    const label = time ? `${name} ${time}` : name
    const list = map.get(dateKey) ?? []
    list.push({
      contentId: item.contentId,
      displayTitle: item.displayTitle,
      progressKey: item.progressKey,
      label,
    })
    map.set(dateKey, list)
  })
  return map
})

const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const startWeekday = first.getDay()
  const result: {
    key: string
    day: number | null
    isToday: boolean
    events: { contentId: string; displayTitle: string; progressKey: string; label: string }[]
  }[] = []

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
</script>

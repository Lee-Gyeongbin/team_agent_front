<template>
  <section class="marketing-publish-calendar">
    <div class="marketing-publish-calendar__head">
      <div class="marketing-publish-calendar__title">
        <strong>발행 캘린더</strong>
        <button
          type="button"
          class="marketing-publish-calendar__nav-btn"
          title="프로젝트 캘린더"
          aria-label="프로젝트 캘린더"
          @click="emit('openFull')"
        >
          <UiIcon
            name="calendar"
            size="16"
          />
        </button>
      </div>
      <div class="marketing-publish-calendar__nav">
        <button
          type="button"
          class="marketing-publish-calendar__nav-btn"
          aria-label="이전 달"
          @click="onPrevMonth"
        >
          <UiIcon
            name="arrow-right"
            size="16"
            class="marketing-publish-calendar__nav-prev"
          />
        </button>
        <span>{{ year }}년 {{ month }}월</span>
        <button
          type="button"
          class="marketing-publish-calendar__nav-btn"
          aria-label="다음 달"
          @click="onNextMonth"
        >
          <UiIcon
            name="arrow-right"
            size="16"
          />
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
      <span
        v-for="item in marketingProjectStatuses"
        :key="item.statusCd"
      >
        <i :class="`is-${item.statusCd}`" />{{ item.statusNm }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UiIcon } from '@leechanyong/ispark-ui'
import { toMarketingCalendarDateKey, useMarketingCalendarGrid } from '~/composables/marketing/useMarketingCalendarGrid'
import { marketingProjectStatuses, type MarketingCalendarEvent } from '~/types/marketing'

const props = defineProps<{
  items: MarketingCalendarEvent[]
}>()

const emit = defineEmits<{
  select: [contentId: string]
  openFull: []
}>()

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
    const dateKey = toMarketingCalendarDateKey(item.publishScheduledDt)
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

const { WEEKDAYS, year, month, cells, onPrevMonth, onNextMonth } = useMarketingCalendarGrid(eventsByDate)
</script>

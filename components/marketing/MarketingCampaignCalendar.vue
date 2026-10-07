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
        <h1 class="marketing-list-title">프로젝트 캘린더</h1>
        <p class="marketing-list-desc">전체 프로젝트의 콘텐츠 발행 일정을 한눈에 확인하세요.</p>
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
      <UiSelect
        :model-value="projectFilter"
        class="marketing-campaign-calendar__filter"
        :options="projectSelectOptions"
        placeholder="전체"
        size="sm"
        @update:model-value="onSelectProject"
      />
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
            :class="`status-${event.statusCd}`"
            :title="`${event.projectNm} · ${event.title}`"
          >
            {{ event.title }}
          </div>
        </div>
      </div>

      <div class="marketing-campaign-calendar__legend">
        <span
          v-for="item in marketingProjectStatuses"
          :key="item.statusCd"
        >
          <i :class="`status-${item.statusCd}`" />{{ item.statusNm }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiIcon, UiLoading, UiSelect } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import { toMarketingCalendarDateKey, useMarketingCalendarGrid } from '~/composables/marketing/useMarketingCalendarGrid'
import { marketingProjectStatuses } from '~/types/marketing'

const emit = defineEmits<{
  close: []
}>()

const props = withDefaults(
  defineProps<{
    selectedProjectNm?: string
  }>(),
  {
    selectedProjectNm: '',
  },
)

const {
  calendarEvents,
  isLoadingCalendarEvents,
  handleSelectCalendarEvents,
  marketingProjectList,
  handleSelectMarketingProjectList,
} = useMarketingStore()

/** 빈 값 = 전체. 값은 marketingProjectId */
const projectFilter = ref('')

const projectSelectOptions = computed(() => [
  { label: '전체', value: '' },
  ...marketingProjectList.value.map((project) => ({
    label: project.projectNm,
    value: project.marketingProjectId,
  })),
])

const onSelectProject = (value: string | number) => {
  projectFilter.value = String(value)
}

const filteredEvents = computed(() =>
  projectFilter.value
    ? calendarEvents.value.filter((event) => event.marketingProjectId === projectFilter.value)
    : calendarEvents.value,
)

const eventsByDate = computed(() => {
  const map = new Map<string, typeof filteredEvents.value>()
  filteredEvents.value.forEach((event) => {
    const dateKey = toMarketingCalendarDateKey(event.eventDt)
    if (!dateKey) return
    const list = map.get(dateKey) ?? []
    list.push(event)
    map.set(dateKey, list)
  })
  return map
})

const { WEEKDAYS, year, month, cells, onPrevMonth, onNextMonth } = useMarketingCalendarGrid(eventsByDate, {
  padEnd: true,
})

const onToday = () => {
  const today = new Date()
  year.value = today.getFullYear()
  month.value = today.getMonth() + 1
}

onMounted(async () => {
  await Promise.all([
    handleSelectCalendarEvents(),
    marketingProjectList.value.length
      ? Promise.resolve()
      : handleSelectMarketingProjectList({ sortField: 'CREATE_DT', sortOrder: 'DESC' }),
  ])
  const selectedNm = props.selectedProjectNm.trim()
  if (!selectedNm) return
  const match = marketingProjectList.value.find((project) => project.projectNm === selectedNm)
  if (match) projectFilter.value = match.marketingProjectId
})
</script>

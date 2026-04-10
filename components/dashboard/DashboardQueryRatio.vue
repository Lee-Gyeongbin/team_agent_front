<template>
  <div class="dashboard-card dashboard-query-ratio">
    <div class="dashboard-card-header">
      <span class="card-title">에이전트 사용 비율</span>
      <div class="query-ratio-filter">
        <span class="query-ratio-filter-label">기준연월</span>
        <UiDatePicker
          v-model="month"
          type="month"
          :min-value="monthPickerMin"
          :max-value="monthPickerMax"
        />
      </div>
    </div>
    <div class="dashboard-chart-area query-ratio-chart">
      <UiChart
        type="pie"
        :config="queryRatioChartConfig"
        show-legend
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const { queryRatioChartConfig, handleSelectDashboardQueryRatio } = useDashboardStore()

const now = new Date()
const monthInner = shallowRef(new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1))
const monthPickerMin = new CalendarDate(now.getFullYear() - 10, 1, 1)
const monthPickerMax = new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)
const month = computed({
  get: () => monthInner.value,
  set: (value) => {
    monthInner.value = new CalendarDate(value.year, value.month, 1)
    handleSelectDashboardQueryRatio(`${value.year}-${String(value.month).padStart(2, '0')}`)
  },
})
</script>

<style lang="scss" scoped>
.dashboard-query-ratio {
  .query-ratio-filter {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  .query-ratio-filter-label {
    @include typo($body-medium-medium);
    color: $color-text-secondary;
    white-space: nowrap;
  }
}
</style>

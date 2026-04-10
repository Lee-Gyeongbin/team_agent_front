<template>
  <div class="dashboard-card dashboard-token-usage">
    <div class="dashboard-card-header">
      <span class="card-title">토큰 사용량</span>
      <div class="token-usage-header-right">
        <div class="token-usage-filter">
          <span class="token-usage-filter-label">기준연월</span>
          <UiDatePicker
            v-model="month"
            type="month"
            :min-value="monthPickerMin"
            :max-value="monthPickerMax"
          />
        </div>
        <span class="card-badge">이번달 사용량 : {{ monthlyUsage.toLocaleString() }} 토큰</span>
      </div>
    </div>
    <div
      class="dashboard-chart-area"
      style="height: 300px"
    >
      <UiChart
        type="mixed"
        :config="tokenUsageChartConfig"
        show-legend
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'

const { tokenUsageChartConfig, monthlyUsage, handleSelectDashboardTokenUsage } = useDashboardStore()
const now = new Date()
const monthInner = shallowRef(new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1))
const monthPickerMin = new CalendarDate(now.getFullYear() - 10, 1, 1)
const monthPickerMax = new CalendarDate(now.getFullYear(), now.getMonth() + 1, 1)
const month = computed({
  get: () => monthInner.value,
  set: (value) => {
    monthInner.value = new CalendarDate(value.year, value.month, 1)
    handleSelectDashboardTokenUsage(`${value.year}-${String(value.month).padStart(2, '0')}`)
  },
})
</script>

<style lang="scss" scoped>
.dashboard-token-usage {
  .token-usage-header-right {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex-shrink: 0;
  }

  .token-usage-filter {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    flex-shrink: 0;
  }

  .token-usage-filter-label {
    @include typo($body-medium-medium);
    color: $color-text-secondary;
    white-space: nowrap;
  }
}
</style>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <span class="card-title">일별 로그인 사용자 추이</span>
    </div>
    <div
      class="dashboard-chart-area"
      style="height: 300px"
    >
      <UiChart
        type="line"
        :config="visitorTrendChartConfig"
        show-legend
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const { visitorTrendChartConfig } = useDashboardStore()
</script>

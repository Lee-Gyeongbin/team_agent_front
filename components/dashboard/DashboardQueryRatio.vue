<template>
  <div class="dashboard-card dashboard-query-ratio">
    <div class="dashboard-card-header">
      <span class="card-title">LLM / RAG / TextToSQL 비율</span>
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
const { queryRatioChartConfig } = useDashboardStore()
</script>

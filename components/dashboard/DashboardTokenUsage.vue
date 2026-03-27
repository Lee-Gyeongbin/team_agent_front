<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <span class="card-title">토큰 사용량</span>
      <span class="card-badge">이번달 사용량 : {{ monthlyUsage.toLocaleString() }} 토큰</span>
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
const { tokenUsageChartConfig, monthlyUsage } = useDashboardStore()
</script>

<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <span class="card-title">방문자추이</span>
    </div>
    <div
      class="dashboard-chart-area"
      style="height: 300px"
    >
      <UiChart
        type="line"
        :config="chartConfig"
        show-legend
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================
const chartConfig = computed(() => ({
  categories: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  datasets: [
    {
      label: '가입자',
      data: [1624000, 1624800, 1624900, 1624950, 1625000, 1625050, 1625100, 1625200, 1625250, 1625300, 1625400, 1625500],
      colorKey: 'line.primary',
    },
  ],
  minValue: 1623500,
  maxValue: 1625500,
  yAxisStepSize: 500,
  scales: {
    y: {
      ticks: {
        callback: (value: number) => `${value.toLocaleString()}`,
      },
    },
  },
}))
</script>

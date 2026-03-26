<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <span class="card-title">토큰 사용량</span>
      <span class="card-badge">이번달 사용량 : {{ monthlyUsage }} 건</span>
    </div>
    <div
      class="dashboard-chart-area"
      style="height: 300px"
    >
      <UiChart
        type="mixed"
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
const monthlyUsage = '120,256'

const chartConfig = computed(() => ({
  categories: ['23년', '24년', '25년', '26년 02월'],
  datasets: [
    {
      label: '수익대비 비율',
      type: 'bar',
      data: [0, 0, 0, 63.21],
      colorKey: 'bar.set1',
      colorIndex: 0,
      yAxisID: 'y',
    },
    {
      label: '비율(%)',
      type: 'line',
      data: [0, 0, 0, 63.21],
      borderColor: '#22c55e',
      yAxisID: 'y1',
    },
  ],
  maxValue: 150,
  maxValue2: 80,
  showDataLabels: true,
}))
</script>

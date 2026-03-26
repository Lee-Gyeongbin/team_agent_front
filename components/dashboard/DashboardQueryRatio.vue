<template>
  <div class="dashboard-card dashboard-query-ratio">
    <div class="dashboard-card-header">
      <span class="card-title">LLM / RAG / TextToSQL 비율</span>
    </div>
    <div class="dashboard-chart-area query-ratio-chart">
      <UiChart
        type="pie"
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
  items: [
    { name: 'LLM', value: 18 },
    { name: 'RAG', value: 6 },
    { name: 'TextToSQL', value: 76 },
  ],
  useSvgDonut: true,
  labelColor: ['#FF9037', '#73BDE7', '#3C69DB'],
  svgConfig: {
    width: 420,
    height: 210,
    centerX: 180,
    centerY: 105,
    radius: 55,
    strokeWidth: 28,
    diagonalLength: 12,
    horizontalLineLength: 60,
    showCenterText: false,
  },
}))
</script>

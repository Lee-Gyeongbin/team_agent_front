<template>
  <div class="ui-chart">
    <div
      v-if="showLegend"
      :id="legendId"
      class="ui-chart-legend"
    />
    <div class="ui-chart-canvas-wrap">
      <canvas :id="chartId" />
    </div>
  </div>
</template>

<script setup lang="ts">
type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'

interface Props {
  /** 차트 타입 */
  type: ChartType
  /** 차트 설정 객체 (categories, data/datasets, colorKey, maxValue 등) */
  config: Record<string, any>
  /** 범례 표시 여부 */
  showLegend?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLegend: false,
})

const { chartId, legendId, createChart, destroyChart } = useChart()

/** 차트 렌더링 */
const renderChart = () => {
  destroyChart()
  nextTick(() => {
    createChart(props.type, {
      ...props.config,
      showLegend: props.showLegend,
    })
  })
}

onMounted(() => {
  renderChart()
})

// config 또는 type 변경 시 차트 재생성
watch(
  () => [props.type, props.config],
  () => {
    renderChart()
  },
  { deep: true },
)
</script>

<style lang="scss" scoped>
.ui-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.ui-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  flex-shrink: 0;

  :deep(.legend-item) {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
    @include typo($body-xsmall);
    color: $color-text-secondary;

    &:hover {
      opacity: 0.8;
    }
  }

  :deep(.legend-item__dot) {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  :deep(.legend-item__text) {
    white-space: nowrap;
  }

  :deep(.legend-item__info) {
    @include typo($body-xsmall);
    color: $color-text-disabled;
    margin-left: 2px;
  }
}

.ui-chart-canvas-wrap {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
}
</style>

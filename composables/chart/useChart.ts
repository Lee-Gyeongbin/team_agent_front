/**
 * 차트 생명주기 관리 composable
 * 차트 생성/업데이트/파괴를 Vue 생명주기에 맞춰 관리
 */
import {
  ChartConfig,
  BarChartModule,
  LineChartModule,
  PieChartModule,
  MixedChartModule,
  XBarChartModule,
} from '~/utils/chart'

type ChartType = 'bar' | 'line' | 'pie' | 'mixed' | 'horizontalBar'

/** 차트 타입에 맞는 모듈 반환 */
function getModule(type: ChartType) {
  switch (type) {
    case 'bar': return BarChartModule
    case 'line': return LineChartModule
    case 'pie': return PieChartModule
    case 'mixed': return MixedChartModule
    case 'horizontalBar': return XBarChartModule
    default: return BarChartModule
  }
}

export const useChart = () => {
  // 고유 ID 생성 (canvas, legend)
  const chartId = `chart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const legendId = `legend-${chartId}`

  /** 차트 생성 */
  const createChart = (type: ChartType, config: any) => {
    const module = getModule(type)
    module.create({ ...config, id: chartId, legendId })
  }

  /** 차트 업데이트 */
  const updateChart = (type: ChartType, newData: any) => {
    const module = getModule(type)
    module.update(chartId, newData)
  }

  /** 차트 파괴 */
  const destroyChart = () => {
    if (ChartConfig.instances[chartId]) {
      ChartConfig.instances[chartId].destroy()
      delete ChartConfig.instances[chartId]
    }
    // SVG 도넛 인스턴스 정리
    if (ChartConfig.svgDonutInstances[chartId]) {
      delete ChartConfig.svgDonutInstances[chartId]
    }
  }

  // cleanup
  onUnmounted(() => destroyChart())

  return { chartId, legendId, createChart, updateChart, destroyChart }
}

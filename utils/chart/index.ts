/**
 * 차트 모듈 통합 export + Chart.js 플러그인 등록
 */
import { Chart } from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// 플러그인 1회 등록
Chart.register(ChartDataLabels)

// datalabels 기본값: 표시 안 함 (각 차트에서 필요 시 활성화)
Chart.defaults.set('plugins.datalabels', { display: false })

export { ChartColors } from './chart-colors'
export { ChartConfig } from './chart-config'
export { BarChartModule } from './chart-bar'
export { LineChartModule } from './chart-line'
export { PieChartModule } from './chart-pie'
export { MixedChartModule } from './chart-mixed'
export { XBarChartModule } from './chart-horizontal-bar'

/**
 * 혼합 차트 모듈 (Mixed Chart - Bar + Line)
 * @module MixedChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartColors } from './chart-colors'
import { ChartConfig } from './chart-config'

export const MixedChartModule = {
  /** 범례 생성 */
  createLegend(chartId: string, legendId: string, datasets: any[]) {
    const legendContainer = document.getElementById(legendId)
    if (!legendContainer) {
      console.warn(`Legend container with id '${legendId}' not found`)
      return
    }

    legendContainer.innerHTML = ''
    legendContainer.classList.add('bar-chart__legend')

    datasets.forEach((dataset, datasetIndex) => {
      const isLine = dataset.type === 'line'
      const legendItem = ChartConfig.createLegendItem({
        label: dataset.label,
        color: isLine ? dataset.borderColor : dataset.backgroundColor,
        dotStyle: isLine ? 'circle' : 'square',
        onClick: () => {
          const chart = ChartConfig.instances[chartId]
          if (chart) {
            ChartConfig.toggleLegend(legendItem, chart, datasetIndex, 'dataset')
          }
        },
      })
      legendContainer.appendChild(legendItem)
    })
  },

  /** 막대 배경색 플러그인 (공통 참조) */
  get backgroundBarPlugin() {
    return ChartConfig.plugins.backgroundBar
  },

  /** 혼합 차트 생성 */
  create(config: any) {
    const {
      id,
      legendId,
      categories,
      datasets,
      maxValue,
      maxValue2,
      yAxisStepSize,
      y1AxisStepSize,
      showLegend = false,
      hideDataLabels = false,
    } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 데이터셋에 색상 및 스타일 적용
    const styledDatasets = datasets.map((dataset: any) => {
      const newDataset = { ...dataset }

      if (dataset.type === 'bar') {
        if (dataset.colorKey) {
          newDataset.backgroundColor = ChartConfig.getColor(dataset.colorKey, dataset.colorIndex)
        }
        return {
          ...newDataset,
          borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
          borderSkipped: false,
          barPercentage: 0.8,
          categoryPercentage: 0.5,
          yAxisID: dataset.yAxisID || 'y',
          order: 1,
        }
      } else {
        if (dataset.colorKey && !dataset.borderColor) {
          const color = ChartConfig.getColor(dataset.colorKey, dataset.colorIndex)
          newDataset.borderColor = color
          newDataset.pointBackgroundColor = color
          newDataset.backgroundColor = `${color}1A`
        }
        return {
          ...ChartConfig.lineStyles.default,
          ...newDataset,
          order: 0,
          tension: 0.4,
          fill: false,
        }
      }
    })

    if (showLegend && legendId) {
      this.createLegend(id, legendId, styledDatasets)
    }

    const mixedChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 30 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            labelColor(context: any) {
              const isLine = context.dataset.type === 'line'
              const color = isLine ? context.dataset.borderColor : context.dataset.backgroundColor
              return {
                borderColor: color,
                backgroundColor: color,
                borderWidth: 1,
                borderRadius: 2,
              }
            },
            label(context: any) {
              const datasetLabel = context.dataset.label || ''
              const value = context.parsed.y
              const tooltipValueSuffix =
                typeof context.dataset.tooltipValueSuffix === 'string'
                  ? context.dataset.tooltipValueSuffix
                  : typeof config.tooltipValueSuffix === 'string'
                    ? config.tooltipValueSuffix
                    : ''
              if (tooltipValueSuffix) {
                return `${datasetLabel}: ${value.toLocaleString()}${tooltipValueSuffix}`
              }
              const unit = context.dataset.unit || ''

              if (context.dataset.type === 'line') {
                return `${datasetLabel}: ${value}%`
              }
              if (unit === '%') return `${datasetLabel}: ${value}%`
              return `${datasetLabel}: ${value.toLocaleString()}원`
            },
          },
        },
        datalabels: {
          display(context: any) {
            if (hideDataLabels) return false
            return context.dataset.type === 'line'
          },
          formatter(value: any, context: any) {
            if (context.dataset.type === 'line') return value + '%'
            return null
          },
          anchor: 'end',
          align: 'top',
          offset: 5,
          color(context: any) {
            if (context.dataset.type === 'line') return context.dataset.borderColor
            return ChartColors.label.default
          },
          font: {
            size: ChartConfig.font.size.small,
            weight: 'bold',
            family: ChartConfig.font.family,
          },
          clip: false,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor(context: any) {
            if (context.dataset.type === 'line') return context.dataset.borderColor
            return ChartColors.label.default
          },
          borderRadius: 4,
          borderWidth: 1,
          padding: { top: 2, bottom: 2, left: 4, right: 4 },
        },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: { display: false, drawBorder: false },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          max: maxValue,
          ticks: {
            stepSize: yAxisStepSize || Math.floor(maxValue / 5),
            callback: (value: number) => value.toLocaleString(),
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: true },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          max: maxValue2,
          ticks: {
            stepSize: y1AxisStepSize || 20,
            callback: (value: number) => value + '%',
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: { drawOnChartArea: false, drawBorder: true },
        },
      },
    }

    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'bar',
      data: { labels: categories, datasets: styledDatasets },
      options: mixedChartOptions,
      plugins: [this.backgroundBarPlugin, ChartConfig.plugins.averageLine],
    })
  },

  /** 차트 업데이트 */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) chart.data.labels = newData.categories
    if (newData.datasets) chart.data.datasets = newData.datasets

    chart.update()
  },
}

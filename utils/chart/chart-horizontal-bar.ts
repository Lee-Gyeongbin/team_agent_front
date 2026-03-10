/**
 * 가로 막대 차트 모듈
 * @module XBarChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

export const XBarChartModule = {
  /** 범례 생성 */
  createLegend(legendId: string, categories: string[], colors: any) {
    const legendContainer = document.getElementById(legendId)
    if (!legendContainer) {
      console.warn(`Legend container with id '${legendId}' not found`)
      return
    }

    legendContainer.innerHTML = ''
    legendContainer.classList.add('bar-chart__legend')

    categories.forEach((category, index) => {
      const color = Array.isArray(colors) ? colors[index] || colors[0] : colors
      const legendItem = ChartConfig.createLegendItem({
        label: category,
        color,
        onClick: () => {
          const chart = ChartConfig.instances[legendId.replace('legend-', '')]
          if (chart) {
            ChartConfig.toggleLegend(legendItem, chart, index, 'bar')
          }
        },
      })
      legendContainer.appendChild(legendItem)
    })
  },

  /** 막대 배경색 플러그인 (공통 참조) */
  get backgroundBarPlugin() {
    return ChartConfig.plugins.backgroundBarHorizontal
  },

  /** 막대 끝에 포인트 색상 추가 플러그인 */
  barPointPlugin: {
    id: 'barPoints',
    afterDatasetDraw(chart: any, args: any) {
      const { ctx } = chart
      const { meta } = args
      const config = chart.options.plugins.barPointsConfig

      if (!config) return

      const pointColor = config.pointColor
      const pointSize = config.pointSize

      if (!pointColor || !pointSize) return

      ctx.save()
      ctx.fillStyle = pointColor

      meta.data.forEach((bar: any) => {
        const barX = bar.x
        const barY = bar.y
        const barHeight = bar.height

        ctx.fillRect(barX - pointSize / 2, barY - barHeight / 2, pointSize, barHeight)
      })

      ctx.restore()
    },
  },

  /** 가로 막대 차트 생성 */
  create(config: any) {
    const {
      id,
      legendId,
      categories,
      data,
      colorKey,
      colorIndex,
      maxValue,
      yAxisStepSize,
      showDataLabels = false,
      labelColorKey,
      labelColorIndex,
      showLegend = false,
      datasets,
      unit = '',
      pointColorKey,
      pointColorIndex,
      pointSize,
      showBackground = true,
    } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    const colors = ChartConfig.getColor(colorKey, colorIndex)
    const labelColor = ChartConfig.getColor(labelColorKey, labelColorIndex) || '#6D7882'
    const pointColor = ChartConfig.getColor(pointColorKey, pointColorIndex)

    if (showLegend && legendId) {
      const legendCategories = datasets ? datasets.map((d: any) => d.label) : categories
      const legendColors = datasets ? datasets.map((d: any) => ChartConfig.getColor(d.colorKey, d.colorIndex)) : colors
      this.createLegend(legendId, legendCategories, legendColors)
    }

    const barStyle = {
      borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
      borderSkipped: false as const,
      barThickness: 22,
      maxBarThickness: 40,
      barPercentage: 0.8,
      categoryPercentage: 0.8,
    }

    const barChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      layout: { padding: { top: 10, bottom: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            label(context: any) {
              const value = context.parsed.x
              return (context.dataset.label ? `${context.dataset.label}: ` : '') + value.toLocaleString() + unit
            },
          },
        },
        datalabels: {
          display: showDataLabels,
          anchor: 'end',
          align: 'left',
          offset: 2,
          color: labelColor,
          font: {
            size: ChartConfig.font.size.small,
            weight: 'bold',
            family: ChartConfig.font.family,
          },
          formatter: (value: number) => value.toLocaleString() + unit,
        },
        barPointsConfig: { pointColor, pointSize },
      },
      scales: {
        x: {
          position: 'top',
          beginAtZero: true,
          max: maxValue,
          ticks: {
            stepSize: yAxisStepSize || Math.floor(maxValue / 6),
            callback: (value: number) => value.toLocaleString(),
            color: '#6D7882',
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: true, display: true },
        },
        y: {
          display: true,
          ticks: {
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: { display: true, color: 'rgba(0, 0, 0, 0.1)', drawBorder: true },
        },
      },
    }

    const chartDatasets = datasets
      ? datasets.map((dataset: any) => ({
          ...dataset,
          backgroundColor: ChartConfig.getColor(dataset.colorKey, dataset.colorIndex),
          ...barStyle,
        }))
      : [{ data, backgroundColor: colors, ...barStyle }]

    const activePlugins: any[] = [this.barPointPlugin]
    if (showBackground) {
      activePlugins.unshift(this.backgroundBarPlugin)
    }

    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'bar',
      data: { labels: categories, datasets: chartDatasets },
      options: barChartOptions,
      plugins: activePlugins,
    })
  },

  /** 차트 업데이트 */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) chart.data.labels = newData.categories
    if (newData.data) chart.data.datasets[0].data = newData.data
    if (newData.colors) chart.data.datasets[0].backgroundColor = newData.colors

    chart.update()
  },
}

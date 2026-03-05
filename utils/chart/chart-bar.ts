/**
 * 바 차트 모듈 (최적화 버전)
 * @module BarChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

export const BarChartModule = {
  /** 범례 생성 */
  createLegend(legendId: string, categories: string[], colors: any, chartId: string) {
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
          const chart = ChartConfig.instances[chartId]
          if (chart) {
            const type = chart.data.datasets.length > 1 ? 'dataset' : 'single'
            ChartConfig.toggleLegend(legendItem, chart, index, type)
          }
        },
      })
      legendContainer.appendChild(legendItem)
    })
  },

  /** 막대 배경색 플러그인 */
  backgroundBarPlugin: {
    id: 'backgroundBars',
    beforeDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart
      const useCenterBars = chart.config.options.useCenterBars
      const thinBars = chart.config.options.thinBars

      ctx.save()
      ctx.fillStyle = 'rgba(230, 232, 234, 0.3)'

      const barY = scales.y.getPixelForValue(scales.y.max)
      const barHeight = chartArea.bottom - barY

      if (useCenterBars) {
        const totalWidth = chartArea.right - chartArea.left
        const sidePadding = totalWidth * 0.1
        const activeWidth = totalWidth * 0.8
        const numCategories = chart.data.labels.length
        const numDatasets = chart.data.datasets.length
        const groupWidth = activeWidth / numCategories
        const maxBarWidth = thinBars ? 60 : 100

        for (let categoryIndex = 0; categoryIndex < numCategories; categoryIndex++) {
          const groupX = chartArea.left + sidePadding + groupWidth * categoryIndex

          if (numDatasets > 1) {
            let barWidth = (groupWidth / numDatasets) * 0.75
            barWidth = Math.min(barWidth, maxBarWidth)
            const totalBarsWidth = barWidth * numDatasets
            const startX = groupX + (groupWidth - totalBarsWidth) / 2

            for (let datasetIndex = 0; datasetIndex < numDatasets; datasetIndex++) {
              const barX = startX + barWidth * datasetIndex + barWidth / 2
              ctx.fillRect(barX - (barWidth * 0.85) / 2, barY, barWidth * 0.85, barHeight)
            }
          } else {
            const meta = chart.getDatasetMeta(0)
            const bar = meta.data[categoryIndex]
            const barWidth = bar ? bar.width : groupWidth * 0.5
            const barX = groupX + groupWidth / 2
            ctx.fillRect(barX - barWidth / 2, barY, barWidth, barHeight)
          }
        }
      } else {
        chart.data.datasets.forEach((_dataset: any, datasetIndex: number) => {
          const meta = chart.getDatasetMeta(datasetIndex)
          meta.data.forEach((bar: any) => {
            const barWidth = bar.width
            const barX = bar.x
            ctx.fillRect(barX - barWidth / 2, barY, barWidth, barHeight)
          })
        })
      }

      ctx.restore()
    },
  },

  /** 막대 중앙 정렬 플러그인 */
  centerBarsPlugin: {
    id: 'centerBars',
    beforeDatasetsDraw(chart: any) {
      if (!chart.config.options.useCenterBars) return

      const xScale = chart.scales.x
      if (!xScale) return

      const chartArea = chart.chartArea
      const totalWidth = chartArea.right - chartArea.left
      const sidePadding = totalWidth * 0.1
      const activeWidth = totalWidth * 0.8
      const numCategories = chart.data.labels.length
      const numDatasets = chart.data.datasets.length
      const groupWidth = activeWidth / numCategories
      const thinBars = chart.config.options.thinBars
      const maxBarWidth = thinBars ? 60 : 100

      chart.data.datasets.forEach((_dataset: any, datasetIndex: number) => {
        const meta = chart.getDatasetMeta(datasetIndex)

        meta.data.forEach((bar: any, categoryIndex: number) => {
          const groupX = chartArea.left + sidePadding + groupWidth * categoryIndex

          if (numDatasets > 1) {
            let barWidth = (groupWidth / numDatasets) * 0.75
            barWidth = Math.min(barWidth, maxBarWidth)
            const totalBarsWidth = barWidth * numDatasets
            const startX = groupX + (groupWidth - totalBarsWidth) / 2
            const barX = startX + barWidth * datasetIndex + barWidth / 2

            bar.x = barX
            bar.width = barWidth * 0.85
          } else {
            const barX = groupX + groupWidth / 2
            bar.x = barX
          }
        })
      })
    },
  },

  /** 바 차트 생성 */
  create(config: any) {
    const {
      id,
      legendId,
      categories,
      data,
      colorKey,
      maxValue,
      yAxisStepSize,
      showDataLabels = false,
      labelColor = '#6D7882',
      showLegend = false,
      datasets,
      barStyleType,
      useCenterBars = false,
      thinBars = false,
      boldXAxis = false,
    } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트가 있으면 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 색상 적용
    let colors: any
    if (datasets) {
      colors = datasets.map((d: any) => ChartConfig.getColor(d.colorKey || 'bar.set1', d.colorIndex))
    } else {
      colors = ChartConfig.getColor(colorKey || 'bar.set1')
    }

    // 범례 생성
    if (showLegend && legendId) {
      if (datasets) {
        const legendCategories = datasets.map((d: any) => d.label)
        const legendColors = datasets.map((d: any) => ChartConfig.getColor(d.colorKey || 'bar.set1', d.colorIndex))
        this.createLegend(legendId, legendCategories, legendColors, id)
      } else {
        this.createLegend(legendId, categories, colors, id)
      }
    }

    const showXAxis = !!datasets
    const tooltipValueSuffix = (typeof config.tooltipValueSuffix === 'string') ? config.tooltipValueSuffix : '명'

    // 차트 옵션 설정
    const barChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      useCenterBars,
      thinBars,
      averageLine: config.averageLine || null,
      animation: ChartConfig.animationConfig,
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            label(context: any) {
              const datasetLabel = context.dataset.label ? `${context.dataset.label}: ` : ''
              return datasetLabel + context.parsed.y.toLocaleString() + tooltipValueSuffix
            },
          },
        },
        datalabels: {
          display: showDataLabels,
          anchor: 'end',
          align: 'top',
          color: ((lc: any) => {
            return (context: any) => {
              if (Array.isArray(lc)) return lc[context.dataIndex] || lc[0]
              return lc
            }
          })(labelColor),
          font: {
            size: ChartConfig.font.size.small,
            weight: 'bold',
            family: ChartConfig.font.family,
          },
          formatter: (value: number) => value.toLocaleString(),
        },
      },
      scales: {
        x: {
          display: showXAxis,
          offset: true,
          ticks: {
            font: {
              size: boldXAxis ? 14 : ChartConfig.font.size.small,
              weight: boldXAxis ? 'bold' : 'normal',
              family: ChartConfig.font.family,
            },
            color: boldXAxis ? '#5C6268' : '#6D7882',
          },
          grid: { display: false, drawBorder: false },
        },
        y: {
          beginAtZero: true,
          min: config.minValue || 0,
          max: maxValue,
          ticks: {
            stepSize: yAxisStepSize || Math.floor(maxValue / 9),
            callback: (value: number) => value.toLocaleString(),
            font: {
              size: ChartConfig.font.size.small,
              family: ChartConfig.font.family,
            },
            color: '#6D7882',
          },
          grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: true },
        },
      },
    }

    // 외부 scales override 병합
    if (config.scales && typeof config.scales === 'object') {
      barChartOptions.scales = { ...(barChartOptions.scales || {}), ...config.scales }
    }

    // 데이터셋 개수에 따른 스타일 결정
    const datasetCount = datasets ? datasets.length : 1
    const radius = ChartConfig.getBorderRadius(datasetCount)

    // 막대 스타일 설정
    let barStyle: any
    if (barStyleType === 'quarterly') {
      barStyle = { ...ChartConfig.barStyles.quarterly }
    } else if (datasets) {
      barStyle = { ...ChartConfig.barStyles.group }
    } else {
      barStyle = { ...ChartConfig.barStyles.single }
    }

    if (thinBars) {
      barStyle.maxBarThickness = 60
      barStyle.barPercentage = 0.75
      barStyle.categoryPercentage = 0.8
    }

    barStyle.borderRadius = {
      topLeft: radius,
      topRight: radius,
      bottomLeft: 0,
      bottomRight: 0,
    }

    // 데이터셋 구성
    const chartDatasets = datasets
      ? datasets.map((dataset: any) => ({
          ...dataset,
          backgroundColor: ChartConfig.getColor(dataset.colorKey || 'bar.set1', dataset.colorIndex),
          ...barStyle,
        }))
      : [{ data, backgroundColor: colors, ...barStyle }]

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'bar',
      data: { labels: categories, datasets: chartDatasets },
      options: barChartOptions,
      plugins: [this.backgroundBarPlugin, this.centerBarsPlugin, ChartConfig.plugins.averageLine],
    })
  },

  /** 차트 업데이트 */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) {
      chart.data.labels = newData.categories
    }
    if (newData.data) {
      chart.data.datasets[0].data = newData.data
    }
    if (newData.colors) {
      chart.data.datasets[0].backgroundColor = newData.colors
    }

    chart.update()
  },
}

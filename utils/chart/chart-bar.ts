/**
 * 바 차트 모듈 (최적화 버전)
 * @module BarChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

/**
 * 단일 데이터셋·카테고리 다건 → bar.* 팔레트를 막대 인덱스마다 순환
 * (colorIndex가 있으면 시리즈별 단색 유지 — 다중 데이터셋/이축 등)
 */
const resolveBarDatasetBackground = (dataset: any, allDatasets: any[]) => {
  const key = dataset.colorKey || 'bar.set1'
  const palette = ChartConfig.getColor(key)
  if (
    allDatasets.length === 1 &&
    Array.isArray(dataset.data) &&
    dataset.data.length > 1 &&
    Array.isArray(palette) &&
    dataset.colorIndex == null
  ) {
    return dataset.data.map((_: unknown, i: number) => palette[i % palette.length])
  }
  return ChartConfig.getColor(key, dataset.colorIndex)
}

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

    const isSingle = categories.length <= 1
    categories.forEach((category, index) => {
      const color = Array.isArray(colors) ? colors[index] || colors[0] : colors
      const legendItem = ChartConfig.createLegendItem({
        label: category,
        color,
        // 단일 데이터셋이면 클릭 비활성화
        onClick: isSingle
          ? undefined
          : () => {
              const chart = ChartConfig.instances[chartId]
              if (chart) {
                const type = chart.data.datasets.length > 1 ? 'dataset' : 'single'
                ChartConfig.toggleLegend(legendItem, chart, index, type)
              }
            },
      })
      if (isSingle) {
        legendItem.style.cursor = 'default'
      }
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
      ctx.fillStyle = 'rgba(236, 240, 243, 0.8)'

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
      colorIndex,
      maxValue,
      minValue,
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

    const yMinResolved = typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : 0
    const yMaxResolved = typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : undefined
    const yRange = yMaxResolved != null ? Math.max(yMaxResolved - yMinResolved, 1) : Math.max(maxValue ?? 0, 1)
    const yStepResolved =
      typeof yAxisStepSize === 'number' && Number.isFinite(yAxisStepSize)
        ? yAxisStepSize
        : Math.max(1, Math.floor(yRange / 9))

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트가 있으면 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 색상 적용 (단일 데이터셋·막대 여러 개 → 팔레트 순환)
    let colors: any
    if (datasets) {
      colors = datasets.map((d: any) => {
        const bg = resolveBarDatasetBackground(d, datasets)
        return Array.isArray(bg) ? bg[0] : bg
      })
    } else {
      const key = colorKey || 'bar.set1'
      const palette = ChartConfig.getColor(key)
      if (Array.isArray(data) && data.length > 1 && Array.isArray(palette) && colorIndex == null) {
        colors = data.map((_: unknown, i: number) => palette[i % palette.length])
      } else {
        colors = ChartConfig.getColor(key, colorIndex)
      }
    }

    // 범례 생성
    if (showLegend && legendId) {
      if (datasets) {
        const legendCategories = datasets.map((d: any) => d.label)
        const legendColors = datasets.map((d: any) => {
          const bg = resolveBarDatasetBackground(d, datasets)
          return Array.isArray(bg) ? bg[0] : bg
        })
        this.createLegend(legendId, legendCategories, legendColors, id)
      } else {
        this.createLegend(legendId, categories, colors, id)
      }
    }

    const showXAxis = !!datasets
    const tooltipValueSuffix = typeof config.tooltipValueSuffix === 'string' ? config.tooltipValueSuffix : '명'

    // 차트 옵션 설정
    const barChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      useCenterBars,
      thinBars,
      averageLine: config.averageLine || null,
      animation: ChartConfig.animationConfig,
      layout: { padding: { top: 4 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          mode: 'index',
          intersect: false,
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
            color: boldXAxis ? '#5C6268' : '#5C6677',
          },
          grid: { display: false, drawBorder: false },
          border: { color: 'rgba(0, 0, 26, 0.3)' },
        },
        y: {
          beginAtZero: yMinResolved >= 0,
          min: yMinResolved,
          max: yMaxResolved,
          ticks: {
            stepSize: yStepResolved,
            callback: (value: number) => value.toLocaleString(),
            font: {
              size: ChartConfig.font.size.small,
              family: ChartConfig.font.family,
            },
            color: '#5C6677',
          },
          grid: { display: false },
        },
      },
    }

    /** scales 축 병합 (ticks 등 중첩 필드 유지) */
    const mergeAxisScale = (base: Record<string, unknown> | undefined, incoming: Record<string, unknown>) => {
      if (!base) return incoming
      return {
        ...base,
        ...incoming,
        ticks: {
          ...((base.ticks as object) || {}),
          ...((incoming.ticks as object) || {}),
        },
      }
    }

    // 외부 scales override 병합 (y/y1 부분 덮어쓰기 시 min·ticks 유실 방지)
    if (config.scales && typeof config.scales === 'object') {
      const baseScales = barChartOptions.scales || {}
      const merged: Record<string, unknown> = { ...baseScales }
      Object.keys(config.scales).forEach((key) => {
        const inc = (config.scales as Record<string, unknown>)[key]
        if (typeof inc === 'object' && inc !== null && typeof merged[key] === 'object' && merged[key] !== null) {
          merged[key] = mergeAxisScale(merged[key] as Record<string, unknown>, inc as Record<string, unknown>)
        } else {
          merged[key] = inc
        }
      })
      barChartOptions.scales = merged
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

    // 양수: 0축에서 맞닿는 쪽(아래) 평평·값 끝(위) 둥글게 / 음수: 0축(위) 평평·극단(아래) 둥글게
    barStyle.borderRadius = (ctx: {
      parsed?: { y?: number }
      raw?: unknown
      dataIndex?: number
      dataset?: { data?: unknown[] }
    }) => {
      const fromParsed = ctx.parsed?.y
      const fromRaw = ctx.raw
      const fromData = typeof ctx.dataIndex === 'number' ? ctx.dataset?.data?.[ctx.dataIndex] : undefined
      const n = fromParsed ?? fromRaw ?? fromData
      const v = typeof n === 'number' ? n : Number(n)
      if (Number.isFinite(v) && v < 0) {
        return { topLeft: 0, topRight: 0, bottomLeft: radius, bottomRight: radius }
      }
      return { topLeft: radius, topRight: radius, bottomLeft: 0, bottomRight: 0 }
    }

    // 데이터셋 구성
    const chartDatasets = datasets
      ? datasets.map((dataset: any) => ({
          ...dataset,
          backgroundColor: resolveBarDatasetBackground(dataset, datasets),
          ...barStyle,
        }))
      : [{ data, backgroundColor: colors, ...barStyle }]

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'bar',
      data: { labels: categories, datasets: chartDatasets },
      options: barChartOptions,
      plugins: [
        this.backgroundBarPlugin,
        this.centerBarsPlugin,
        ChartConfig.plugins.dottedGrid,
        ChartConfig.plugins.averageLine,
      ],
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

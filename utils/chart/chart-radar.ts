/**
 * 방사선(Radar) 차트 모듈
 * 다축 점수 비교 (스트레스 진단, 역량 평가 등)
 * @module RadarChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

/** 색상을 rgba 문자열로 변환 (chart-line.ts와 동일 패턴) */
function colorToRgba(color: string, alpha: number): string {
  const rgb = ChartConfig.parseColorToRgb(color)
  if (!rgb) return color
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
}

export const RadarChartModule = {
  /** 범례 생성 */
  createLegend(chartId: string, legendId: string, datasets: any[]) {
    const legendContainer = document.getElementById(legendId)
    if (!legendContainer) {
      console.warn(`Legend container with id '${legendId}' not found`)
      return
    }

    legendContainer.innerHTML = ''

    const isSingle = datasets.length <= 1
    datasets.forEach((dataset, datasetIndex) => {
      const legendItem = ChartConfig.createLegendItem({
        label: dataset.label,
        color: dataset.borderColor,
        dotStyle: 'circle',
        onClick: isSingle
          ? undefined
          : () => {
              const chart = ChartConfig.instances[chartId]
              if (chart) {
                ChartConfig.toggleLegend(legendItem, chart, datasetIndex, 'dataset')
              }
            },
      })
      if (isSingle) {
        legendItem.style.cursor = 'default'
      }
      legendContainer.appendChild(legendItem)
    })
  },

  /** 방사선 차트 생성 */
  create(config: any) {
    const {
      id,
      legendId,
      categories = [],
      data,
      datasets,
      color,
      colorKey = 'radar.primary',
      colorIndex = 0,
      maxValue,
      stepSize,
      showDataLabels = false,
      fillOpacity = 0.35,
      showLegend = false,
      pointLabelFormat,
    } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 카테고리 검증
    if (!Array.isArray(categories) || categories.length < 3) {
      console.warn('Radar chart: categories should have at least 3 axes')
    }

    // 데이터셋 정규화
    let normalizedDatasets: any[] = []
    if (Array.isArray(datasets) && datasets.length > 0) {
      // 다중 모드
      normalizedDatasets = datasets.map((ds: any, idx: number) => {
        const resolvedColor =
          ds.color ||
          (ds.colorKey
            ? ChartConfig.getColor(ds.colorKey, ds.colorIndex ?? idx)
            : ChartConfig.getColor('radar.set1', idx))
        return {
          label: ds.label,
          data: ds.data,
          borderColor: resolvedColor,
          backgroundColor: colorToRgba(resolvedColor, fillOpacity),
          pointBackgroundColor: resolvedColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: true,
        }
      })
    } else if (Array.isArray(data)) {
      // 단일 모드
      const resolvedColor = color || ChartConfig.getColor(colorKey, colorIndex)
      normalizedDatasets = [
        {
          label: '',
          data,
          borderColor: resolvedColor,
          backgroundColor: colorToRgba(resolvedColor, fillOpacity),
          pointBackgroundColor: resolvedColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          fill: true,
        },
      ]
    } else {
      console.error('Radar chart: either `data` or `datasets` is required')
      return
    }

    // 범례
    if (showLegend && legendId) {
      this.createLegend(id, legendId, normalizedDatasets)
    }

    // Chart.js 옵션
    const radarOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 16, bottom: 16, left: 16, right: 16 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            label(context: any) {
              const label = context.dataset.label || ''
              const value = context.parsed.r
              return label ? `${label}: ${value}` : `${value}`
            },
          },
        },
        datalabels: showDataLabels
          ? {
              display: true,
              anchor: 'end',
              align: 'end',
              offset: 4,
              color: '#464C53',
              font: {
                family: ChartConfig.font.family,
                size: ChartConfig.font.size.small,
                weight: 'bold',
              },
              formatter: (value: number) => value,
            }
          : { display: false },
      },
      scales: {
        r: {
          min: 0,
          ...(typeof maxValue === 'number' ? { max: maxValue } : {}),
          ticks: {
            ...(typeof stepSize === 'number' ? { stepSize } : {}),
            showLabelBackdrop: false,
            color: '#9CA3AF',
            font: {
              family: ChartConfig.font.family,
              size: 11,
            },
          },
          grid: { color: 'rgba(0, 0, 26, 0.12)' },
          angleLines: { color: 'rgba(0, 0, 26, 0.12)' },
          pointLabels: {
            color: '#5C6677',
            font: {
              family: ChartConfig.font.family,
              size: ChartConfig.font.size.medium,
              weight: 500,
            },
            ...(typeof pointLabelFormat === 'function'
              ? {
                  callback: (label: string, index: number) => {
                    // 첫 번째 데이터셋의 값을 전달 (단일 모드 + 다중에서 가장 자주 쓰는 케이스)
                    const value = normalizedDatasets[0]?.data?.[index]
                    return pointLabelFormat(label, value, index)
                  },
                }
              : {}),
          },
        },
      },
      elements: {
        line: { tension: 0 },
      },
    }

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'radar',
      data: { labels: categories, datasets: normalizedDatasets },
      options: radarOptions,
    })
  },

  /** 차트 업데이트 (재생성 없이 데이터만) */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) {
      chart.data.labels = newData.categories
    }
    if (newData.datasets) {
      chart.data.datasets = newData.datasets
    } else if (newData.data) {
      // 단일 모드 업데이트
      if (chart.data.datasets[0]) {
        chart.data.datasets[0].data = newData.data
      }
    }

    chart.update('none')
  },
}

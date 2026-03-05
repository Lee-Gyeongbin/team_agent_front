/**
 * 라인 차트 모듈 (Line Chart)
 * 시계열 데이터 추이 및 비교 표시
 * @module LineChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartConfig } from './chart-config'

/** 색상을 rgba 문자열로 변환 */
function colorToRgba(color: string, alpha: number): string {
  const rgb = ChartConfig.parseColorToRgb(color)
  if (!rgb) return color
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`
}

export const LineChartModule = {

  /** 그라데이션 배경 생성 */
  createGradient(ctx: CanvasRenderingContext2D, chartArea: any, color: string) {
    return ChartConfig.createGradient(ctx, chartArea, color)
  },

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
      const legendItem = ChartConfig.createLegendItem({
        label: dataset.label,
        color: dataset.borderColor,
        dotStyle: 'circle',
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

  /** 라인 차트 생성 */
  create(config: any) {
    // 커스텀 포인트 플러그인
    const customPointPlugin = {
      id: 'customPoint',
      _scales: {} as Record<string, any>,

      afterDatasetsDraw(chart: any) {
        const ctx = chart.ctx
        const s = (customPointPlugin._scales[chart.id] = customPointPlugin._scales[chart.id] || {})

        const active = chart.getActiveElements()[0]
        let needsUpdate = false

        chart.data.datasets.forEach((ds: any, di: number) => {
          const meta = chart.getDatasetMeta(di)
          if (meta.hidden) return

          meta.data.forEach((p: any, pi: number) => {
            if (p.skip || chart.data.datasets[di].data[pi] === null) return

            const key = `${di}-${pi}`
            const isHover = active && active.datasetIndex === di && active.index === pi
            const target = isHover ? 1.2 : 1

            s[key] = s[key] || 1
            s[key] += (target - s[key]) * 0.2
            if (Math.abs(target - s[key]) > 0.01) needsUpdate = true

            const scale = s[key]
            const color = ds.borderColor

            // 바깥 원
            ctx.beginPath()
            ctx.arc(p.x, p.y, 10 * scale, 0, Math.PI * 2)
            ctx.fillStyle = colorToRgba(color, 0.25)
            ctx.fill()

            // 중간 원
            ctx.beginPath()
            ctx.arc(p.x, p.y, 5 * scale, 0, Math.PI * 2)
            ctx.fillStyle = '#fff'
            ctx.fill()

            // 안쪽 원
            ctx.beginPath()
            ctx.arc(p.x, p.y, 4 * scale, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
          })
        })

        if (needsUpdate) requestAnimationFrame(() => chart.draw())
      },
    }

    const { id, legendId, categories, datasets, maxValue, yAxisStepSize, showLegend = false, useGradient = false } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트가 있으면 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 데이터셋에 색상 및 스타일 적용
    const styledDatasets = datasets.map((dataset: any) => {
      const color = dataset.borderColor || ChartConfig.getColor(dataset.colorKey, dataset.colorIndex)
      const lineStyle = useGradient ? ChartConfig.lineStyles.filled : ChartConfig.lineStyles.default

      const newDataset: any = {
        ...lineStyle,
        ...dataset,
        borderColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 10,
      }

      if (useGradient && (dataset.fill || lineStyle.fill)) {
        newDataset.backgroundColor = (context: any) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return color
          return this.createGradient(ctx, chartArea, color)
        }
      } else {
        newDataset.backgroundColor = dataset.backgroundColor || 'rgba(160, 165, 222, 0.1)'
      }

      return newDataset
    })

    // 범례 생성
    if (showLegend && legendId) {
      this.createLegend(id, legendId, styledDatasets)
    }

    // 차트 옵션 설정
    const lineChartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      averageLine: config.averageLine || null,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          callbacks: {
            label(context: any) {
              const label = context.dataset.label || ''
              const value = context.parsed.y
              return `${label}: ${value.toLocaleString()}`
            },
          },
        },
        datalabels: { display: false },
      },
      scales: {
        x: {
          display: true,
          ticks: {
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: { display: true, drawBorder: false, color: '#E0E0E0', borderDash: [4, 4] },
        },
        y: {
          beginAtZero: false,
          min: config.minValue || 0,
          max: maxValue,
          ticks: {
            stepSize: yAxisStepSize || Math.floor((maxValue - (config.minValue || 0)) / 9) || 1,
            callback: (value: number) => value.toLocaleString(),
            font: { size: ChartConfig.font.size.small, family: ChartConfig.font.family },
            color: '#6D7882',
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            drawBorder: true,
            borderDash: [5, 5],
            borderWidth: 1,
            borderColor: '#E0E0E0',
          },
        },
      },
      elements: {
        line: { borderWidth: 3 },
        point: { hitRadius: 10, hoverBorderWidth: 3 },
      },
    }

    // custom scales override
    if (config.scales && typeof config.scales === 'object') {
      lineChartOptions.scales = { ...(lineChartOptions.scales || {}), ...config.scales }
      if (Object.keys(config.scales).some((k: string) => k.startsWith('y-'))) {
        delete lineChartOptions.scales.y
      }
    }

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'line',
      data: { labels: categories, datasets: styledDatasets },
      options: lineChartOptions,
      plugins: [customPointPlugin, ChartConfig.plugins.averageLine],
    })
  },

  /** 차트 업데이트 */
  update(chartId: string, newData: any) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    if (newData.categories) {
      chart.data.labels = newData.categories
    }
    if (newData.datasets) {
      chart.data.datasets = newData.datasets
    }

    chart.update()
  },
}

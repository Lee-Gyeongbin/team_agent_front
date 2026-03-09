/**
 * 파이 차트 모듈
 * - 기본 파이/도넛 차트 (Chart.js 기반)
 * - SVG 도넛 차트 (외부 라벨 + 연결선, 커스텀 구현)
 * @module PieChartModule
 */
import { Chart } from 'chart.js/auto'
import { ChartColors } from './chart-colors'
import { ChartConfig, getContrastColor } from './chart-config'

export const PieChartModule = {
  /** 색상 가져오기 */
  getColors(style: string): string[] {
    return (ChartColors.pie as any)[style] || ChartColors.pie.secondary
  },

  /** 파이 차트 생성 (분기 처리) */
  create(config: any) {
    const { id, legendId, items, style, textStyle, labelColor, useSvgDonut, type } = config
    const valueMode = config?.valueMode ? String(config.valueMode) : 'percent'

    function formatRawNumber(v: any): string {
      if (v === null || v === undefined || isNaN(v)) return ''
      try {
        return Number(v).toLocaleString('ko-KR')
      } catch {
        return String(v)
      }
    }

    if (type === 'outerLabel') {
      this.createOuterLabelPie(config)
      return
    }

    if (useSvgDonut) {
      this.createSvgDonut(config)
      return
    }

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    // 기존 차트 제거
    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    // 색상 적용
    let itemsWithColors: any[]
    if (labelColor && labelColor.length > 0) {
      itemsWithColors = items.map((item: any, index: number) => ({
        ...item,
        color: labelColor[index] || labelColor[0],
      }))
    } else {
      const colors = this.getColors(style)
      itemsWithColors = items.map((item: any, index: number) => ({
        ...item,
        color: colors[index] || colors[0],
      }))
    }

    // 범례 생성
    this.createLegend(legendId, itemsWithColors, id)

    // 텍스트 스타일
    const txtStyle = ChartConfig.textStyles[textStyle] || ChartConfig.textStyles.secondary

    // 파이 스타일
    const pieStyle = ChartConfig.pieStyles[style] || ChartConfig.pieStyles.secondary
    const isDonut = pieStyle.cutout !== undefined

    // 차트 옵션
    const chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: pieStyle.cutout || 0,
      layout: { padding: 6 },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...ChartConfig.tooltipConfig,
          enabled: style !== 'empty',
          callbacks: {
            label(context: any) {
              if (valueMode === 'raw') {
                return `${context.label}: ${formatRawNumber(context.parsed)}`
              }
              return `${context.label}: ${context.parsed}%`
            },
          },
        },
        datalabels: isDonut
          ? { display: false }
          : {
              color(context: any) {
                // 슬라이스 배경색 기반 자동 대비 색상
                const bgColor = context.dataset.backgroundColor[context.dataIndex]
                if (bgColor && bgColor.startsWith('#')) {
                  return getContrastColor(bgColor)
                }
                // fallback: textStyle 색상
                const index = context.dataIndex
                if (txtStyle.colors && txtStyle.colors[index]) {
                  return txtStyle.colors[index]
                }
                return txtStyle.color || '#FFFFFF'
              },
              font: {
                size: txtStyle.fontSize,
                weight: txtStyle.fontWeight,
                family: txtStyle.fontFamily,
              },
              formatter(value: any) {
                if (valueMode === 'raw') return formatRawNumber(value)
                return value + '%'
              },
              anchor: 'center',
              align: 'center',
            },
      },
      animation: {
        animateRotate: true,
        animateScale: false,
        duration: ChartConfig.animationConfig.duration,
      },
    }

    // 차트 생성
    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: itemsWithColors.map((item: any) => item.name),
        datasets: [{
          data: itemsWithColors.map((item: any) => item.value),
          backgroundColor: itemsWithColors.map((item: any) => item.color),
          borderColor: pieStyle.borderColor,
          borderWidth: pieStyle.borderWidth,
          hoverOffset: pieStyle.hoverOffset,
          hoverBorderWidth: pieStyle.hoverBorderWidth,
        }],
      },
      options: chartOptions,
    })
  },

  /** 범례 생성 */
  createLegend(legendId: string, items: any[], chartId: string, isSvgDonut = false) {
    const legendContainer = document.getElementById(legendId)
    if (!legendContainer) return

    legendContainer.innerHTML = ''

    items.forEach((item, index) => {
      const legendItem = document.createElement('div')
      legendItem.className = 'legend-item'

      const dot = document.createElement('span')
      dot.className = 'legend-item__dot'
      dot.style.backgroundColor = item.color

      const text = document.createElement('span')
      text.className = 'legend-item__text'
      text.style.setProperty('--dot-color', item.color)

      if (item.count !== undefined) {
        text.textContent = `${item.name}`

        const info = document.createElement('span')
        info.className = 'legend-item__info'
        info.textContent = `${item.count}개(${item.value}%)`

        legendItem.appendChild(dot)
        legendItem.appendChild(text)
        legendItem.appendChild(info)
      } else {
        text.textContent = item.name
        legendItem.appendChild(dot)
        legendItem.appendChild(text)
      }

      legendContainer.appendChild(legendItem)

      legendItem.addEventListener('click', () => {
        if (isSvgDonut) {
          this.toggleSvgDonutLegend(chartId, index, legendItem)
        } else {
          const chart = ChartConfig.instances[chartId]
          if (chart) {
            ChartConfig.toggleLegend(legendItem, chart, index, 'pie')
          }
        }
      })
    })
  },

  /** SVG 도넛 범례 토글 */
  toggleSvgDonutLegend(chartId: string, index: number, legendItem: HTMLElement) {
    const instance = ChartConfig.svgDonutInstances?.[chartId]
    if (!instance) return

    instance.data[index].hidden = !instance.data[index].hidden
    const isHidden = instance.data[index].hidden

    const textEl = legendItem.querySelector('.legend-item__text') as HTMLElement | null
    const infoEl = legendItem.querySelector('.legend-item__info') as HTMLElement | null
    const dotEl = legendItem.querySelector('.legend-item__dot') as HTMLElement | null

    if (textEl) {
      textEl.style.textDecoration = isHidden ? 'line-through' : 'none'
      textEl.style.opacity = isHidden ? '0.5' : '1'
    }
    if (infoEl) {
      infoEl.style.textDecoration = isHidden ? 'line-through' : 'none'
      infoEl.style.opacity = isHidden ? '0.5' : '1'
    }
    if (dotEl) {
      dotEl.style.opacity = isHidden ? '0.5' : '1'
    }

    this.redrawSvgDonut(chartId)
  },

  /** 차트 업데이트 (Chart.js용) */
  update(chartId: string, newData: any[]) {
    const chart = ChartConfig.instances[chartId]
    if (!chart) return

    chart.data.datasets[0].data = newData.map(item => item.value)
    chart.data.labels = newData.map(item => item.name)
    chart.data.datasets[0].backgroundColor = newData.map(item => item.color)
    chart.update()
  },

  /** 외부 라벨 파이 차트 */
  createOuterLabelPie(config: any) {
    const { id, legendId, items, labelColor, style, outerLabelConfig = {} } = config

    const canvas = document.getElementById(id) as HTMLCanvasElement | null
    if (!canvas) {
      console.warn(`Canvas element with id '${id}' not found`)
      return
    }

    if (ChartConfig.instances[id]) {
      ChartConfig.instances[id].destroy()
    }

    const settings = {
      size: outerLabelConfig.size || 120,
      labelOffset: outerLabelConfig.labelOffset || 20,
      labelFontSize: outerLabelConfig.labelFontSize || 14,
      labelFontWeight: outerLabelConfig.labelFontWeight || 700,
    }

    const colors = labelColor || (style ? this.getColors(style) : ChartColors.pie.regionRatio)
    const itemsWithColors = items.map((item: any, index: number) => ({
      ...item,
      color: colors[index] || colors[0],
    }))

    if (legendId) {
      this.createLegend(legendId, itemsWithColors, id)
    }

    ChartConfig.instances[id] = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: itemsWithColors.map((item: any) => item.name),
        datasets: [{
          data: itemsWithColors.map((item: any) => item.value),
          backgroundColor: itemsWithColors.map((item: any) => item.color),
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 36, bottom: 36, left: 50, right: 50 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...ChartConfig.tooltipConfig,
            callbacks: {
              label(context: any) {
                return `${context.label}: ${context.parsed}%`
              },
            },
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'end',
            offset: settings.labelOffset,
            color(context: any) {
              return itemsWithColors[context.dataIndex].color
            },
            font: {
              size: settings.labelFontSize,
              weight: settings.labelFontWeight,
              family: 'Pretendard, sans-serif',
            },
            formatter(value: any) {
              return value + '%'
            },
          },
        },
        animation: {
          animateRotate: true,
          duration: ChartConfig.animationConfig.duration,
        },
      },
    })
  },

  /** SVG 도넛 차트 생성 */
  createSvgDonut(config: any) {
    const { id, legendId, items, labelColor, svgConfig = {}, style } = config

    const container = document.getElementById(id)?.parentElement
    if (!container) {
      console.warn(`Container for '${id}' not found`)
      return
    }

    const settings = {
      width: svgConfig.width || 524,
      height: svgConfig.height || 163,
      centerX: svgConfig.centerX || 262,
      centerY: svgConfig.centerY || 81,
      radius: svgConfig.radius || 50,
      strokeWidth: svgConfig.strokeWidth || 28,
      diagonalLength: svgConfig.diagonalLength || 12,
      horizontalLineLength: svgConfig.horizontalLineLength || 140,
      showCenterText: svgConfig.showCenterText,
    }

    const data = items.map((item: any, index: number) => ({
      ...item,
      color: labelColor?.[index] || ChartColors.pie.workProgress[index] || '#999',
      hidden: false,
    }))

    const canvas = document.getElementById(id)
    if (canvas) (canvas as HTMLElement).style.display = 'none'

    const existingSvg = document.getElementById(`${id}-svg`)
    if (existingSvg) existingSvg.remove()

    const svg = ChartConfig.svgDonut.createSVGElement('svg', {
      width: settings.width,
      height: settings.height,
      viewBox: `0 0 ${settings.width} ${settings.height}`,
      id: `${id}-svg`,
      style: 'overflow: visible;',
    })

    const positions = this.calculateSvgPositions(data, settings)
    this.renderSvgDonut(svg, data, settings)

    if (style !== 'empty') {
      this.renderSvgLabels(svg, positions)
    }

    container.appendChild(svg)

    ChartConfig.svgDonutInstances[id] = {
      config,
      data,
      settings,
      container,
    }

    this.createLegend(legendId, data, id, true)
  },

  /** SVG 도넛 라벨 위치 계산 */
  calculateSvgPositions(data: any[], settings: any): any[] {
    const { centerX, centerY, radius, strokeWidth, diagonalLength, horizontalLineLength } = settings
    const total = data.reduce((sum: number, d: any) => sum + d.value, 0)
    const outerRadius = radius + strokeWidth / 2

    let currentAngle = -Math.PI / 2

    return data.map((item: any) => {
      const percentage = item.value / total
      const angleSpan = percentage * 2 * Math.PI
      const midAngle = currentAngle + angleSpan / 2

      const midPointX = centerX + Math.cos(midAngle) * outerRadius
      const midPointY = centerY + Math.sin(midAngle) * outerRadius
      const diagonalEndX = centerX + Math.cos(midAngle) * (outerRadius + diagonalLength)
      const diagonalEndY = centerY + Math.sin(midAngle) * (outerRadius + diagonalLength)
      const isLeftSide = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5
      const horizontalEndX = isLeftSide ? diagonalEndX - horizontalLineLength : diagonalEndX + horizontalLineLength
      const horizontalEndY = diagonalEndY

      currentAngle += angleSpan

      return {
        ...item,
        midAngle,
        midPointX,
        midPointY,
        diagonalEndX,
        diagonalEndY,
        labelX: horizontalEndX,
        labelY: horizontalEndY,
        isLeftSide,
        textAnchor: isLeftSide ? 'end' : 'start',
        lineColor: ChartConfig.svgDonut.darkenColor(item.color, 25),
      }
    })
  },

  /** SVG 도넛 렌더링 */
  renderSvgDonut(svg: SVGElement, data: any[], settings: any) {
    const { centerX, centerY, radius, strokeWidth, showCenterText } = settings
    const circumference = 2 * Math.PI * radius
    const total = data.reduce((sum: number, d: any) => sum + d.value, 0)

    let offset = 0

    data.forEach((item: any, index: number) => {
      const percentage = item.value / total
      const dashLength = circumference * percentage

      const circle = ChartConfig.svgDonut.createSVGElement('circle', {
        cx: centerX,
        cy: centerY,
        r: radius,
        fill: 'none',
        stroke: item.color,
        'stroke-width': strokeWidth,
        'stroke-dasharray': `${dashLength} ${circumference}`,
        'stroke-dashoffset': -offset,
        transform: `rotate(-90 ${centerX} ${centerY})`,
        'data-donut': 'true',
        'data-index': index,
        style: 'transition: stroke-dasharray 0.3s ease-out, stroke-dashoffset 0.3s ease-out;',
      })
      svg.appendChild(circle)

      offset += dashLength
    })

    if (showCenterText !== false) {
      const text = ChartConfig.svgDonut.createSVGElement('text', {
        x: centerX,
        y: centerY,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-size': '28',
        'font-weight': '700',
        fill: '#1f2937',
        'font-family': 'Pretendard, sans-serif',
      })
      text.textContent = String(total)
      svg.appendChild(text)
    }
  },

  /** SVG 라벨 + 연결선 렌더링 */
  renderSvgLabels(svg: SVGElement, positions: any[]) {
    positions.forEach((pos: any, index: number) => {
      if (pos.value === 0) return
      this.renderSvgLabelGroup(svg, pos, index)
    })
  },

  /** SVG 라벨 그룹 렌더링 (개별 항목) */
  renderSvgLabelGroup(svg: SVGElement, pos: any, index: number) {
    const group = ChartConfig.svgDonut.createSVGElement('g', {
      'data-label-index': index,
      style: 'transition: opacity 0.3s ease-out;',
    })

    const midPoint = ChartConfig.svgDonut.createSVGElement('circle', {
      cx: pos.midPointX, cy: pos.midPointY, r: 4, fill: pos.lineColor,
      class: 'label-midpoint', style: 'transition: cx 0.3s ease-out, cy 0.3s ease-out;',
    })
    group.appendChild(midPoint)

    const diagonalLine = ChartConfig.svgDonut.createSVGElement('line', {
      x1: pos.midPointX, y1: pos.midPointY, x2: pos.diagonalEndX, y2: pos.diagonalEndY,
      stroke: pos.lineColor, 'stroke-width': 1.5, class: 'label-diagonal',
    })
    group.appendChild(diagonalLine)

    const horizontalLine = ChartConfig.svgDonut.createSVGElement('line', {
      x1: pos.diagonalEndX, y1: pos.diagonalEndY, x2: pos.labelX, y2: pos.labelY,
      stroke: pos.lineColor, 'stroke-width': 1.5, class: 'label-horizontal',
    })
    group.appendChild(horizontalLine)

    const nameText = ChartConfig.svgDonut.createSVGElement('text', {
      x: pos.labelX, y: pos.labelY - 5,
      'text-anchor': pos.textAnchor, 'font-size': '12', 'font-weight': '500',
      fill: pos.lineColor, 'font-family': 'Pretendard, sans-serif', class: 'label-name',
    })
    nameText.textContent = pos.name
    group.appendChild(nameText)

    const valueText = ChartConfig.svgDonut.createSVGElement('text', {
      x: pos.labelX, y: pos.labelY + 12,
      'text-anchor': pos.textAnchor, 'font-size': '14', 'font-weight': '700',
      fill: pos.lineColor, 'font-family': 'Pretendard, sans-serif', class: 'label-value',
    })
    valueText.textContent = `${pos.value}%`
    group.appendChild(valueText)

    svg.appendChild(group)
  },

  /** SVG 도넛 다시 그리기 (토글 시) */
  redrawSvgDonut(chartId: string) {
    const instance = ChartConfig.svgDonutInstances?.[chartId]
    if (!instance) return

    const { data, settings } = instance
    const { radius } = settings
    const circumference = 2 * Math.PI * radius

    const visibleData = data.map((item: any) => ({
      ...item,
      displayValue: item.hidden ? 0 : item.value,
    }))

    const total = visibleData.reduce((sum: number, d: any) => sum + d.displayValue, 0)
    const existingSvg = document.getElementById(`${chartId}-svg`)
    if (!existingSvg) return

    if (total === 0) {
      existingSvg.querySelectorAll('circle[data-donut]').forEach((circle) => {
        circle.setAttribute('stroke-dasharray', `0 ${circumference}`)
      })
      existingSvg.querySelectorAll('[data-label-index]').forEach((el) => el.remove())
      return
    }

    const newPositions = this.calculateSvgPositions(
      visibleData.map((item: any) => ({ ...item, value: item.displayValue })),
      settings,
    )

    let offset = 0
    visibleData.forEach((item: any, index: number) => {
      const circle = existingSvg.querySelector(`circle[data-index="${index}"]`)
      if (!circle) return

      const percentage = item.displayValue / total
      const dashLength = circumference * percentage

      circle.setAttribute('stroke-dasharray', `${dashLength} ${circumference}`)
      circle.setAttribute('stroke-dashoffset', String(-offset))

      offset += dashLength
    })

    data.forEach((item: any, index: number) => {
      const pos = newPositions[index]
      const labelGroup = existingSvg.querySelector(`[data-label-index="${index}"]`)

      if (item.hidden) {
        if (labelGroup) {
          ;(labelGroup as HTMLElement).style.transition = 'opacity 0.3s ease-out'
          ;(labelGroup as HTMLElement).style.opacity = '0'
          setTimeout(() => labelGroup.remove(), 300)
        }
      } else if (labelGroup && pos.value > 0) {
        const midPointCircle = labelGroup.querySelector('.label-midpoint')
        const diagonalLine = labelGroup.querySelector('.label-diagonal')
        const horizontalLine = labelGroup.querySelector('.label-horizontal')
        const nameText = labelGroup.querySelector('.label-name')
        const valueText = labelGroup.querySelector('.label-value')

        if (midPointCircle) {
          midPointCircle.setAttribute('cx', pos.midPointX)
          midPointCircle.setAttribute('cy', pos.midPointY)
        }
        if (diagonalLine) {
          diagonalLine.setAttribute('x1', pos.midPointX)
          diagonalLine.setAttribute('y1', pos.midPointY)
          diagonalLine.setAttribute('x2', pos.diagonalEndX)
          diagonalLine.setAttribute('y2', pos.diagonalEndY)
        }
        if (horizontalLine) {
          horizontalLine.setAttribute('x1', pos.diagonalEndX)
          horizontalLine.setAttribute('y1', pos.diagonalEndY)
          horizontalLine.setAttribute('x2', pos.labelX)
          horizontalLine.setAttribute('y2', pos.labelY)
        }
        if (nameText) {
          nameText.setAttribute('x', pos.labelX)
          nameText.setAttribute('y', String(pos.labelY - 5))
          nameText.setAttribute('text-anchor', pos.textAnchor)
        }
        if (valueText) {
          valueText.setAttribute('x', pos.labelX)
          valueText.setAttribute('y', String(pos.labelY + 12))
          valueText.setAttribute('text-anchor', pos.textAnchor)
        }
      } else if (!labelGroup && pos.value > 0) {
        this.renderSvgLabelGroup(existingSvg, pos, index)
      }
    })
  },
}

/**
 * 차트 공통 설정 파일
 * 모든 차트에서 사용하는 스타일, 옵션, 인스턴스 관리
 * @module ChartConfig
 */
import type { Chart } from 'chart.js'
import { ChartColors } from './chart-colors'

export const ChartConfig = {
  // ===== 색상 테마 (ChartColors 참조) =====
  get colors() {
    return ChartColors
  },

  // ===== 폰트 설정 =====
  font: {
    family: 'Pretendard',
    size: {
      small: 12,
      medium: 14,
      large: 16,
    },
    weight: {
      normal: 500,
      bold: 700,
    },
  },

  // ===== 공통 레이아웃 =====
  layout: {
    padding: {
      default: 20,
      top: 20,
      bottom: 10,
    },
  },

  // ===== 기본 배경색 =====
  backgroundColor: '#FFFFFF',

  // ===== 텍스트 스타일 =====
  textStyles: {
    primary: {
      colors: ['#FFFFFF', '#FFFFFF'],
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'Pretendard',
    },
    secondary: {
      colors: ['#004F99', '#CC7700'],
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Pretendard',
    },
    bar: {
      color: '#FF0000',
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'Pretendard',
    },
  } as Record<string, any>,

  // ===== 차트 인스턴스 저장소 =====
  instances: {} as Record<string, Chart>,

  // ===== SVG 도넛 인스턴스 저장소 =====
  svgDonutInstances: {} as Record<string, any>,

  // ===== 공통 툴팁 설정 =====
  tooltipConfig: {
    enabled: true,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    titleColor: '#fff',
    bodyColor: '#fff',
    padding: 10,
    displayColors: true,
    cornerRadius: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },

  // ===== 공통 범례 스타일 =====
  legendConfig: {
    position: 'top' as const,
    align: 'start' as const,
    labels: {
      color: '#464C53',
      font: {
        family: 'Pretendard',
        size: 12,
        weight: 500,
      },
      usePointStyle: true,
      padding: 16,
    },
  },

  // ===== 공통 축 설정 =====
  scalesConfig: {
    x: {
      display: true,
      ticks: {
        font: {
          family: 'Pretendard',
          size: 12,
        },
        color: '#6D7882',
      },
      grid: {
        display: false,
        drawBorder: false,
      },
    },
    y: {
      display: true,
      beginAtZero: true,
      ticks: {
        font: {
          family: 'Pretendard',
          size: 12,
        },
        color: '#6D7882',
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
        drawBorder: true,
      },
    },
  },

  // ===== 공통 애니메이션 설정 =====
  animationConfig: {
    duration: 300,
    easing: 'easeOutQuart' as const,
  },

  // ===== 공통 데이터 라벨 설정 =====
  dataLabelsConfig: {
    display: false,
    anchor: 'end' as const,
    align: 'top' as const,
    offset: 4,
    font: {
      family: 'Pretendard',
      size: 12,
      weight: 'bold' as const,
    },
    color: '#6D7882',
  },

  // ===== 막대 차트 기본 스타일 =====
  barStyles: {
    single: {
      borderRadius: {
        topLeft: 15,
        topRight: 15,
        bottomLeft: 0,
        bottomRight: 0,
      },
      borderSkipped: false as const,
      barThickness: 60,
      maxBarThickness: 80,
      barPercentage: 0.9,
      categoryPercentage: 0.8,
    },
    group: {
      borderRadius: {
        topLeft: 10,
        topRight: 10,
        bottomLeft: 0,
        bottomRight: 0,
      },
      borderSkipped: false as const,
      barPercentage: 0.8,
      categoryPercentage: 0.85,
    },
    quarterly: {
      borderRadius: {
        topLeft: 10,
        topRight: 10,
        bottomLeft: 0,
        bottomRight: 0,
      },
      barThickness: 80,
      maxBarThickness: 100,
      borderSkipped: false as const,
      barPercentage: 0.75,
      categoryPercentage: 0.8,
    },
  },

  // ===== 라인 차트 기본 스타일 =====
  lineStyles: {
    default: {
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    },
    filled: {
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    },
  },

  // ===== 파이 차트 기본 스타일 =====
  pieStyles: {
    primary: {
      borderColor: '#FFFFFF',
      borderWidth: 4,
      hoverOffset: 6,
      hoverBorderWidth: 5,
    },
    secondary: {
      borderColor: '#FFFFFF',
      borderWidth: 0,
      hoverOffset: 6,
      hoverBorderWidth: 5,
    },
    taskStatus: {
      borderColor: '#FFFFFF',
      borderWidth: 0,
      hoverOffset: 4,
      hoverBorderWidth: 2,
      cutout: '48%',
    },
    empty: {
      borderColor: '#FFFFFF',
      borderWidth: 0,
      hoverOffset: 4,
      hoverBorderWidth: 2,
      cutout: '48%',
    },
  } as Record<string, any>,

  // ===== 공통 플러그인 =====
  plugins: {
    /** 평균선(기준선) 플러그인 */
    averageLine: {
      id: 'averageLine',
      afterDatasetsDraw(chart: any) {
        const averageValue = chart.config.options.averageLine
        if (averageValue == null) return

        const { ctx, chartArea, scales } = chart
        const y = scales.y.getPixelForValue(averageValue)

        ctx.save()
        ctx.beginPath()
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = '#d32f2f'
        ctx.lineWidth = 2
        ctx.moveTo(chartArea.left, y)
        ctx.lineTo(chartArea.right, y)
        ctx.stroke()
        ctx.restore()
      },
    },
  },

  // ===== 유틸리티 함수 =====

  /** 색상 키 경로로 ChartColors에서 색상 가져오기 */
  getColor(colorKey: string, colorIndex?: number, defaultColor = '#A0A5DE'): any {
    if (!colorKey) return defaultColor

    const keys = colorKey.split('.')
    let color: any = ChartColors

    for (const key of keys) {
      color = color[key]
      if (!color) return defaultColor
    }

    if (typeof colorIndex === 'number' && Array.isArray(color)) {
      return color[colorIndex] || color[0]
    }

    return color
  },

  /** 범례 아이템 DOM 생성 헬퍼 */
  createLegendItem(opts: {
    label: string
    color: string
    dotStyle?: 'square' | 'circle'
    onClick?: () => void
  }): HTMLElement {
    const legendItem = document.createElement('div')
    legendItem.className = 'legend-item'

    const dot = document.createElement('span')
    dot.className = 'legend-item__dot'
    dot.style.backgroundColor = opts.color
    if (opts.dotStyle === 'circle') {
      dot.style.borderRadius = '50%'
    }

    const text = document.createElement('span')
    text.className = 'legend-item__text'
    text.textContent = opts.label

    legendItem.appendChild(dot)
    legendItem.appendChild(text)

    if (opts.onClick) {
      legendItem.addEventListener('click', opts.onClick)
    }

    return legendItem
  },

  /** 숫자 포맷팅 (천 단위 콤마) */
  formatNumber(value: number): string {
    return value.toLocaleString()
  },

  // 원본 데이터 저장소 (single 타입 토글용)
  _originalData: {} as Record<string, any>,

  /** 범례 클릭 토글 기능 (공통) */
  toggleLegend(legendItem: HTMLElement, chart: any, index: number, type = 'dataset') {
    let isHidden: boolean

    if (type === 'single') {
      const dataset = chart.data.datasets[0]

      if (!this._originalData[chart.id]) {
        this._originalData[chart.id] = {
          data: [...dataset.data],
          hidden: {} as Record<number, boolean>,
        }
      }

      const store = this._originalData[chart.id]
      const yMin = chart.options.scales?.y?.min ?? 0
      const currentlyHidden = !!store.hidden[index]

      if (!currentlyHidden) {
        store.data[index] = dataset.data[index]
        dataset.data[index] = yMin
      } else {
        dataset.data[index] = store.data[index]
      }

      store.hidden[index] = !currentlyHidden
      isHidden = !currentlyHidden
      chart.update()
    } else if (type === 'pie') {
      chart.toggleDataVisibility(index)
      isHidden = !chart.getDataVisibility(index)
      chart.update()
    } else {
      const meta = chart.getDatasetMeta(index)
      meta.hidden = !meta.hidden
      isHidden = meta.hidden
      chart.update()
    }

    // 범례 스타일 업데이트
    const textEl = legendItem.querySelector('.legend-item__text') as HTMLElement | null
    if (textEl) {
      textEl.style.textDecoration = isHidden ? 'line-through' : 'none'
      textEl.style.opacity = isHidden ? '0.5' : '1'
    }
    const dotEl = legendItem.querySelector('.legend-item__dot') as HTMLElement | null
    if (dotEl) {
      dotEl.style.opacity = isHidden ? '0.5' : '1'
    }
  },

  /** 데이터셋 개수에 따른 borderRadius 계산 */
  getBorderRadius(count: number): number {
    switch (count) {
      case 1:
        return 15
      case 2:
        return 12
      case 3:
        return 8
      default:
        return 6
    }
  },

  /** 색상 문자열에서 RGB 값 추출 (hex, rgb, rgba 모두 지원) */
  parseColorToRgb(color: string): [number, number, number] | null {
    // hex 색상 (#RRGGBB 또는 #RGB)
    if (color.startsWith('#')) {
      let hex = color.slice(1)
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      }
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return [r, g, b]
    }
    // rgba/rgb 색상
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    }
    return null
  },

  /** 그라데이션 배경 생성 */
  createGradient(ctx: CanvasRenderingContext2D, chartArea: any, color: string) {
    if (!chartArea) return color

    const rgb = this.parseColorToRgb(color)
    if (!rgb) return color

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
    gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)`)
    gradient.addColorStop(0.5, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.15)`)
    gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)

    return gradient
  },

  // ===== SVG 도넛 차트 유틸리티 =====
  svgDonut: {
    /** 색상을 더 진하게 만드는 함수 */
    darkenColor(hex: string, percent = 25): string {
      let r = parseInt(hex.slice(1, 3), 16)
      let g = parseInt(hex.slice(3, 5), 16)
      let b = parseInt(hex.slice(5, 7), 16)

      r = Math.max(0, Math.floor(r * (1 - percent / 100)))
      g = Math.max(0, Math.floor(g * (1 - percent / 100)))
      b = Math.max(0, Math.floor(b * (1 - percent / 100)))

      return `rgb(${r}, ${g}, ${b})`
    },

    /** SVG 요소 생성 */
    createSVGElement(tag: string, attrs: Record<string, any> = {}): SVGElement {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, String(value))
      })
      return el
    },
  },
}

import type { Chart } from 'chart.js'
import { ChartConfig } from '~/utils/chart'
import { escapeHTML } from '~/utils/global/htmlUtil'

const PRINT_HOST_ID = 'mtlcare-report-print-host'
const PRINT_STYLE_ID = 'mtlcare-report-print-style'
const CAPTURE_OVERLAY_ID = 'mtlcare-capture-overlay'

/** PDF 캡처 시 축 라벨(하단)이 잘리지 않도록 여유 공간 */
const RADAR_CAPTURE_EXTRA_HEIGHT = 80
const RADAR_CAPTURE_LAYOUT_PADDING = { top: 24, bottom: 52, left: 28, right: 28 }

type ChartLayoutPadding =
  | number
  | {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
  | undefined

export interface MtlcareReportPdfParams {
  reqUserNm: string
  createDt: string
  reqComment?: string
  reportHtml: string
  /** 스트레스 진단 분석 — mtlcare-report-sheet-body 전체 */
  analysisSheetBodyElement: HTMLElement | null
}

/** 파일명에 사용할 수 없는 문자 제거 */
export const sanitizeMtlcareReportFileName = (name: string): string => {
  const trimmed = name.trim() || '스트레스진단'
  return trimmed.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100)
}

const waitForChartPaint = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })

const applyTempStyle = (el: HTMLElement, styles: Record<string, string>, restoreFns: Array<() => void>) => {
  const prev = new Map<string, string>()
  Object.entries(styles).forEach(([key, value]) => {
    prev.set(key, el.style.getPropertyValue(key))
    el.style.setProperty(key, value ?? '')
  })
  restoreFns.push(() => {
    prev.forEach((value, key) => {
      if (value) el.style.setProperty(key, value)
      else el.style.removeProperty(key)
    })
  })
}

const waitForImageLoad = (img: HTMLImageElement): Promise<void> =>
  new Promise((resolve, reject) => {
    if (img.complete) {
      resolve()
      return
    }
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('chart image load failed'))
  })

const ANALYSIS_CAPTURE_OVERFLOW_CLASSES = [
  'mtlcare-report-layout',
  'mtlcare-report-main',
  'mtlcare-report-sheet',
  'mtlcare-report-sheet-body',
] as const

/** 캡처 중 좌측 패널 덮기 (차트 resize가 보이지 않도록) */
const createCaptureOverlay = (reportMain: HTMLElement): HTMLElement => {
  document.getElementById(CAPTURE_OVERLAY_ID)?.remove()
  const rect = reportMain.getBoundingClientRect()
  const overlay = document.createElement('div')
  overlay.id = CAPTURE_OVERLAY_ID
  overlay.setAttribute('aria-hidden', 'true')
  overlay.style.cssText = [
    'position:fixed',
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'background:#fff',
    'z-index:10000',
    'pointer-events:none',
  ].join(';')
  document.body.appendChild(overlay)
  return overlay
}

/**
 * mtlcare-report-sheet-body 전체를 한 장으로 캡처 (화면 DOM 기준 — PDF 품질 확보)
 */
const captureAnalysisSheetBodyAsDataUrl = async (sheetBody: HTMLElement | null): Promise<string | null> => {
  if (!sheetBody) return null

  const restoreFns: Array<() => void> = []
  let prevLayoutPadding: ChartLayoutPadding | undefined
  let restoreCanvas: (() => void) | null = null

  const reportMain = sheetBody.closest('.mtlcare-report-main') as HTMLElement | null
  const overlay = reportMain ? createCaptureOverlay(reportMain) : null

  ANALYSIS_CAPTURE_OVERFLOW_CLASSES.forEach((className) => {
    const el = sheetBody.closest(`.${className}`) as HTMLElement | null
    if (!el) return
    applyTempStyle(
      el,
      {
        overflow: 'visible',
        height: 'auto',
        minHeight: '0',
        maxHeight: 'none',
      },
      restoreFns,
    )
  })

  applyTempStyle(
    sheetBody,
    {
      overflow: 'visible',
      height: 'auto',
      minHeight: 'auto',
      maxHeight: 'none',
      display: 'block',
    },
    restoreFns,
  )

  const chartWrap = sheetBody.querySelector('.mtlcare-report-radar-chart') as HTMLElement | null
  const metricsWrap = sheetBody.querySelector('.mtlcare-report-radar-metrics') as HTMLElement | null
  const canvas = chartWrap?.querySelector('canvas') as HTMLCanvasElement | null
  const chart = canvas?.id ? (ChartConfig.instances[canvas.id] as Chart | undefined) : undefined

  if (chartWrap) {
    const baseHeight = chartWrap.offsetHeight || 300
    applyTempStyle(
      chartWrap,
      {
        height: `${baseHeight + RADAR_CAPTURE_EXTRA_HEIGHT}px`,
        minHeight: `${baseHeight + RADAR_CAPTURE_EXTRA_HEIGHT}px`,
        overflow: 'visible',
      },
      restoreFns,
    )
  }

  if (metricsWrap) {
    applyTempStyle(metricsWrap, { overflow: 'visible', height: 'auto', maxHeight: 'none' }, restoreFns)
  }

  const uiChart = chartWrap?.querySelector('.ui-chart') as HTMLElement | null
  const canvasWrap = chartWrap?.querySelector('.ui-chart-canvas-wrap') as HTMLElement | null
  if (uiChart) applyTempStyle(uiChart, { overflow: 'visible', height: '100%' }, restoreFns)
  if (canvasWrap) applyTempStyle(canvasWrap, { overflow: 'visible', minHeight: '0' }, restoreFns)

  if (chart?.options?.layout) {
    prevLayoutPadding = chart.options.layout.padding
    chart.options.layout.padding = RADAR_CAPTURE_LAYOUT_PADDING
    chart.resize()
    chart.update('none')
    await waitForChartPaint()
  }

  try {
    if (chart && canvas?.parentElement) {
      const chartDataUrl = chart.toBase64Image('image/png', 2)
      const chartImg = document.createElement('img')
      chartImg.src = chartDataUrl
      chartImg.alt = '스트레스 진단 방사형 차트'
      chartImg.style.cssText = 'display:block;width:100%;height:auto;'

      const canvasParent = canvas.parentElement
      canvasParent.replaceChild(chartImg, canvas)
      restoreCanvas = () => {
        if (chartImg.parentElement === canvasParent) {
          canvasParent.replaceChild(canvas, chartImg)
        }
      }

      await waitForImageLoad(chartImg)
    }

    const { toPng } = await import('html-to-image')
    await waitForChartPaint()

    const width = Math.max(sheetBody.scrollWidth, sheetBody.offsetWidth)
    const height = Math.max(sheetBody.scrollHeight, sheetBody.offsetHeight)

    return await toPng(sheetBody, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width,
      height,
    })
  } catch {
    return null
  } finally {
    restoreCanvas?.()

    if (chart?.options?.layout && prevLayoutPadding !== undefined) {
      chart.options.layout.padding = prevLayoutPadding
      chart.resize()
      chart.update('none')
    }

    restoreFns.reverse().forEach((restore) => restore())
    overlay?.remove()
  }
}

const buildCommentBlock = (reqComment?: string): string => {
  const text = reqComment?.trim()
  if (!text) return ''

  return `
  <div class="mtlcare-print-comment">
    <span class="mtlcare-print-comment-label">요청 메시지</span>
    <p class="mtlcare-print-comment-text">${escapeHTML(text)}</p>
  </div>`
}

const buildAnalysisBlock = (analysisDataUrl: string | null): string => {
  if (!analysisDataUrl) return ''

  return `
  <section class="mtlcare-print-section">
    <h2 class="mtlcare-print-section-title">스트레스 진단 분석</h2>
    <img class="mtlcare-print-analysis-img" src="${analysisDataUrl}" alt="스트레스 진단 분석" />
  </section>`
}

/** PDF 인쇄 전용 — 수기 작성용 면담 기록란 */
const buildCounselingNotesBlock = (): string => `
  <section class="mtlcare-print-section mtlcare-print-report-section mtlcare-print-notes-section">
    <div class="mtlcare-print-report-head">
      <span
        class="mtlcare-print-report-head-icon"
        aria-hidden="true"
      >✎</span>
      <h2 class="mtlcare-print-report-head-title">면담 기록</h2>
    </div>
    <div class="mtlcare-print-report-sheet">
      <div
        class="mtlcare-print-notes-body"
        aria-label="면담 기록 수기 작성란"
      ></div>
    </div>
  </section>`

const buildPrintInnerHtml = (params: MtlcareReportPdfParams, analysisDataUrl: string | null): string => {
  const title = `${escapeHTML(params.reqUserNm)}님의 스트레스 진단`

  return `
  <article class="mtlcare-print">
    <header class="mtlcare-print-header">
      <h1 class="mtlcare-print-title">${title}</h1>
      <p class="mtlcare-print-meta">요청일 ${escapeHTML(params.createDt)}</p>
      ${buildCommentBlock(params.reqComment)}
    </header>
    ${buildAnalysisBlock(analysisDataUrl)}
    <section class="mtlcare-print-section mtlcare-print-report-section">
      <div class="mtlcare-print-report-head">
        <span
          class="mtlcare-print-report-head-icon"
          aria-hidden="true"
        >✦</span>
        <h2 class="mtlcare-print-report-head-title">AI 진단 보고서</h2>
      </div>
      <div class="mtlcare-print-report-sheet">
        <div class="mtlcare-print-report-body">${params.reportHtml}</div>
      </div>
    </section>
    ${buildCounselingNotesBlock()}
  </article>`
}

const buildPrintStyles = (): string => `
@media screen {
  #${PRINT_HOST_ID} {
    position: fixed;
    left: -99999px;
    top: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    pointer-events: none;
  }
}

@media print {
  @page {
    margin: 12mm 12mm;
    size: A4;
  }

  html,
  body {
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  body * {
    visibility: hidden !important;
  }

  #${PRINT_HOST_ID},
  #${PRINT_HOST_ID} * {
    visibility: visible !important;
  }

  #${PRINT_HOST_ID} {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    clip: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    box-sizing: border-box !important;
    font-family: 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
    font-size: 10pt !important;
    line-height: 1.5 !important;
    color: #1e293b !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  #${PRINT_HOST_ID} * {
    box-sizing: border-box !important;
    max-height: none !important;
    overflow: visible !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 4mm !important;
    overflow: visible !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-header {
    margin-bottom: 20px !important;
    page-break-after: avoid;
  }

  #${PRINT_HOST_ID} .mtlcare-print-title {
    margin: 0 !important;
    font-size: 18pt !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    line-height: 1.35 !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-meta {
    margin: 8px 0 0 !important;
    font-size: 10pt !important;
    color: #64748b !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-comment {
    margin-top: 12px !important;
    padding: 10px 14px !important;
    border: 1px solid #dfe3e8 !important;
    border-radius: 8px !important;
    background: #ecf0f3 !important;
    page-break-inside: avoid;
  }

  #${PRINT_HOST_ID} .mtlcare-print-comment-label {
    display: block !important;
    margin-bottom: 4px !important;
    font-size: 9pt !important;
    font-weight: 700 !important;
    color: #475569 !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-comment-text {
    margin: 0 !important;
    font-size: 10pt !important;
    line-height: 1.45 !important;
    color: #1e293b !important;
    white-space: pre-line !important;
    word-break: break-word !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-section {
    margin-bottom: 24px !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-section-title {
    margin: 0 0 12px !important;
    padding-bottom: 6px !important;
    border-bottom: 2px solid #3b82f6 !important;
    font-size: 13pt !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    page-break-after: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-analysis-img {
    display: block !important;
    width: 85% !important;
    max-width: 85% !important;
    height: auto !important;
    margin: 0 auto 12px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-section {
    margin-top: 8px !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-head {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin: 0 !important;
    padding: 10px 14px !important;
    background: #f1f5f9 !important;
    border: 1px solid #c6d2db !important;
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 8px 8px 0 0 !important;
    page-break-after: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-head-icon {
    flex-shrink: 0 !important;
    font-size: 14pt !important;
    line-height: 1 !important;
    color: #3b82f6 !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-head-title {
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    font-size: 11pt !important;
    font-weight: 700 !important;
    color: #0f172a !important;
    line-height: 1.3 !important;
    letter-spacing: -0.01em !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-sheet {
    padding: 16px 18px !important;
    border: 1px solid #c6d2db !important;
    border-top: none !important;
    border-radius: 0 0 8px 8px !important;
    background: #fff !important;
    box-shadow: none !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report {
    display: block !important;
    overflow: visible !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__section {
    display: block !important;
    padding: 0 !important;
    margin: 0 0 20px !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
    overflow: visible !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__section:not(:last-child) {
    padding-bottom: 16px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__section h3 {
    margin: 0 0 10px !important;
    padding: 0 0 0 10px !important;
    border: none !important;
    border-left: 3px solid #94a3b8 !important;
    font-size: 10.5pt !important;
    font-weight: 600 !important;
    color: #334155 !important;
    line-height: 1.4 !important;
    page-break-after: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__section p {
    margin: 0 !important;
    font-size: 10pt !important;
    line-height: 1.75 !important;
    color: #1e293b !important;
    white-space: pre-line !important;
    word-break: break-word !important;
    orphans: 3;
    widows: 3;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__recommend-list {
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    overflow: visible !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__recommend-list li {
    position: relative !important;
    display: block !important;
    margin: 0 0 10px !important;
    padding: 10px 10px 10px 24px !important;
    background: #f8fafc !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 6px !important;
    font-size: 10pt !important;
    line-height: 1.7 !important;
    color: #1e293b !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-report-body .mtlcare-report__recommend-list li::before {
    content: '' !important;
    position: absolute !important;
    left: 10px !important;
    top: 16px !important;
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: #3b82f6 !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-notes-section {
    margin-top: 24px !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  #${PRINT_HOST_ID} .mtlcare-print-notes-body {
    min-height: 80mm !important;
    border: 1px dashed #cbd5e1 !important;
    border-radius: 6px !important;
    background: #fff !important;
  }
}
`

const removeEl = (id: string) => {
  document.getElementById(id)?.remove()
}

const waitForImages = (root: HTMLElement): Promise<void> => {
  const images = Array.from(root.querySelectorAll('img'))
  if (!images.length) return Promise.resolve()

  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  ).then(() => undefined)
}

/**
 * 면담 리포트 전체 → PDF (브라우저 인쇄 대화상자 — PDF로 저장)
 * 스트레스 진단 분석(sheet-body 전체)은 이미지로, AI 진단 보고서는 HTML로 포함
 */
export const downloadMtlcareReportAsPdf = async (params: MtlcareReportPdfParams): Promise<boolean> => {
  if (typeof document === 'undefined') return false
  if (!params.reportHtml?.trim()) return false

  const analysisDataUrl = params.analysisSheetBodyElement
    ? await captureAnalysisSheetBodyAsDataUrl(params.analysisSheetBodyElement)
    : null

  if (!analysisDataUrl && !params.reportHtml.trim()) return false

  const prevTitle = document.title
  const fileTitle = sanitizeMtlcareReportFileName(`${params.reqUserNm}_스트레스진단`)

  removeEl(PRINT_STYLE_ID)
  removeEl(PRINT_HOST_ID)

  const styleEl = document.createElement('style')
  styleEl.id = PRINT_STYLE_ID
  styleEl.textContent = buildPrintStyles()
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = buildPrintInnerHtml(params, analysisDataUrl)
  document.body.appendChild(host)

  await waitForImages(host)

  const cleanup = () => {
    removeEl(PRINT_STYLE_ID)
    removeEl(PRINT_HOST_ID)
    document.title = prevTitle
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  document.title = fileTitle
  window.print()

  return true
}

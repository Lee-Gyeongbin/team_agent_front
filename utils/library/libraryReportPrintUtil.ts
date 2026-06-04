/**
 * 라이브러리 AI 생성 보고서 — 브라우저 인쇄용 HTML
 * (현재 창에서 인쇄 대화상자만 띄움 — 새 탭·about:blank URL 없음)
 */

import type { LibraryGeneratedReportValues } from '~/types/library'
import { escapeHTML } from '~/utils/global/htmlUtil'
import { toHtmlContent } from '~/utils/chat/htmlUtil'

export type LibraryReportRow = { labelKey: string; valueKey: string }

const PRINT_HOST_ID = 'library-report-print-host'
const PRINT_STYLE_ID = 'library-report-print-style'

const LABEL_SUFFIX = '_label'
const LABEL_SUFFIX_LEN = LABEL_SUFFIX.length

const asReportValues = (values: LibraryGeneratedReportValues | null | undefined): LibraryGeneratedReportValues => {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {}
  return values
}

/**
 * 보고서 표 행 — JSON `Object.keys` 순서 중 **값 키(valueKey)가 처음 나오는 순서**로 정렬.
 * (보완 재응답 등에서 본문 키가 앞에 오고 `_label`이 뒤에 와도, API가 준 키 순서를 따름)
 *
 * 1) `_label`로 끝나지 않는 키 k에 대해 `k + '_label'`이 있으면 한 행으로 추가
 * 2) 아직 없는 쌍은 `*_label` 키만 있는 경우 등 — 키 나열 순서대로 보충
 */
export const getLibraryReportRows = (values: LibraryGeneratedReportValues | null | undefined): LibraryReportRow[] => {
  const v = asReportValues(values)
  const rows: LibraryReportRow[] = []
  const seenValueKeys = new Set<string>()
  const keys = Object.keys(v)

  for (const k of keys) {
    if (k.endsWith(LABEL_SUFFIX)) continue
    const labelKey = `${k}${LABEL_SUFFIX}`
    if (!Object.prototype.hasOwnProperty.call(v, labelKey)) continue
    if (seenValueKeys.has(k)) continue
    seenValueKeys.add(k)
    rows.push({ labelKey, valueKey: k })
  }

  for (const labelKey of keys) {
    if (!labelKey.endsWith(LABEL_SUFFIX)) continue
    const valueKey = labelKey.slice(0, -LABEL_SUFFIX_LEN)
    if (!valueKey || seenValueKeys.has(valueKey)) continue
    seenValueKeys.add(valueKey)
    rows.push({ labelKey, valueKey })
  }

  return rows
}

/** Date → YYYY.MM.DD (인쇄 부제 «작성» 줄용) */
const formatYyyyMmDdDots = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

/** 본문에 삽입할 보고서 마크업(라벨은 이스케이프, 본문 값은 sanitize된 HTML 렌더) */
const buildPrintHostInnerHtml = (
  rows: LibraryReportRow[],
  values: LibraryGeneratedReportValues,
  writtenOn: string,
  reportTitle: string,
): string => {
  const bodyRows = rows
    .map((row) => {
      const label = escapeHTML(values[row.labelKey] ?? '')
      const raw = values[row.valueKey] ?? ''
      const value = toHtmlContent(raw)
      return `<tr><th scope="row">${label}</th><td class="report-print-value">${value}</td></tr>`
    })
    .join('')

  return `
  <header class="report-print-header">
    <h1 class="report-print-title">${escapeHTML(reportTitle)}</h1>
    <p class="report-print-sub">${escapeHTML(writtenOn)} 작성</p>
  </header>
  <hr class="report-print-rule" />
  <table class="report-print-table" role="presentation">
    <tbody>
      ${bodyRows}
    </tbody>
  </table>`
}

const buildPrintHostStyles = (): string => `
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
  /* 여백 축소 → 인쇄 가능 영역 확대 (브라우저·프린터 여백 한계는 남음) */
  @page { margin: 12mm 12mm; }
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
    overflow: visible !important;
    clip: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    box-sizing: border-box !important;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
    font-size: 10pt !important;
    line-height: 1.45 !important;
    color: #1e293b !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  #${PRINT_HOST_ID} * {
    box-sizing: border-box !important;
  }
  #${PRINT_HOST_ID} .report-print-header {
    text-align: center !important;
    margin-bottom: 12px !important;
  }
  #${PRINT_HOST_ID} .report-print-title {
    margin: 0 0 8px !important;
    font-size: 20pt !important;
    font-weight: 700 !important;
    letter-spacing: 0.02em !important;
  }
  #${PRINT_HOST_ID} .report-print-sub {
    margin: 0 !important;
    font-size: 11pt !important;
    color: #475569 !important;
  }
  #${PRINT_HOST_ID} .report-print-rule {
    border: none !important;
    border-top: 1px solid #1e293b !important;
    margin: 16px 0 20px !important;
  }
  #${PRINT_HOST_ID} table.report-print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
  }
  #${PRINT_HOST_ID} .report-print-table th {
    width: 120px !important;
    padding: 10px 12px !important;
    font-size: 10.5pt !important;
    font-weight: 600 !important;
    text-align: left !important;
    vertical-align: top !important;
    color: #334155 !important;
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
  }
  #${PRINT_HOST_ID} .report-print-table td {
    padding: 10px 12px !important;
    font-size: 10.5pt !important;
    vertical-align: top !important;
    border: 1px solid #cbd5e1 !important;
    background: #fff !important;
    word-break: break-word !important;
  }
  #${PRINT_HOST_ID} .report-print-value {
    white-space: pre-wrap !important;
  }
  #${PRINT_HOST_ID} .report-print-value p {
    margin: 0 0 8px !important;
  }
  #${PRINT_HOST_ID} .report-print-value p:last-child {
    margin-bottom: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-value ul,
  #${PRINT_HOST_ID} .report-print-value ol {
    margin: 8px 0 !important;
    padding-left: 1.4em !important;
  }
  #${PRINT_HOST_ID} .report-print-value table {
    width: 100% !important;
    margin: 10px 0 !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    font-size: 10pt !important;
  }
  #${PRINT_HOST_ID} .report-print-value th,
  #${PRINT_HOST_ID} .report-print-value td {
    border: 1px solid #cbd5e1 !important;
    padding: 6px 8px !important;
    vertical-align: top !important;
    text-align: left !important;
  }
  #${PRINT_HOST_ID} .report-print-value thead th {
    background: #f1f5f9 !important;
  }
  #${PRINT_HOST_ID} .report-print-value th,
  #${PRINT_HOST_ID} .report-print-value td {
    overflow: hidden !important;
    min-width: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-value td img,
  #${PRINT_HOST_ID} .report-print-value th img {
    max-width: 100% !important;
    height: auto !important;
    box-sizing: border-box !important;
    object-fit: contain !important;
    float: none !important;
  }

  /* 에디터 HTML 직접 인쇄 — 화면 미리보기보다 한 단계 작게(페이지 분산 완화) */
  #${PRINT_HOST_ID} .report-print-editor-body {
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
    font-size: 9.5pt !important;
    color: #1e293b !important;
    line-height: 1.45 !important;
    text-align: left !important;
  }
  /* 인라인 style(font-size 등)은 그대로 적용됨 → 에디터에서 큰 글꼴을 쓰면 인쇄도 커짐 */
  #${PRINT_HOST_ID} .report-print-editor-body h1 {
    font-size: 15pt !important;
    font-weight: 700 !important;
    margin: 8px 0 5px !important;
    line-height: 1.3 !important;
    padding-bottom: 4px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  /* h2 — doc-content 와 동일: 둥근 사각형 + 체크(√) 마스크 아이콘 */
  #${PRINT_HOST_ID} .report-print-editor-body h2 {
    display: flex !important;
    align-items: center !important;
    gap: 4px !important;
    font-size: 12.5pt !important;
    font-weight: 700 !important;
    margin: 10px 0 4px !important;
    line-height: 1.3 !important;
    color: #2563eb !important;
    padding-bottom: 3px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h2::before {
    content: '' !important;
    flex-shrink: 0 !important;
    width: 11pt !important;
    height: 11pt !important;
    background-color: #2563eb !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m8 12 3 3 5-6'/%3E%3C/svg%3E") !important;
    mask-repeat: no-repeat !important;
    mask-position: center !important;
    mask-size: contain !important;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='3'/%3E%3Cpath d='m8 12 3 3 5-6'/%3E%3C/svg%3E") !important;
    -webkit-mask-repeat: no-repeat !important;
    -webkit-mask-position: center !important;
    -webkit-mask-size: contain !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h3 {
    font-size: 11pt !important;
    font-weight: 700 !important;
    margin: 8px 0 3px !important;
    line-height: 1.35 !important;
    color: #1e293b !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h4 {
    font-size: 10pt !important;
    font-weight: 700 !important;
    margin: 6px 0 3px !important;
    line-height: 1.35 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h5 {
    font-size: 9.5pt !important;
    font-weight: 700 !important;
    margin: 5px 0 2px !important;
    line-height: 1.4 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h6 {
    font-size: 9pt !important;
    font-weight: 700 !important;
    margin: 4px 0 2px !important;
    line-height: 1.4 !important;
    color: #475569 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body p { margin: 0 0 5px !important; line-height: 1.5 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body p:empty::after { content: '\u00A0'; }
  #${PRINT_HOST_ID} .report-print-editor-body strong,
  #${PRINT_HOST_ID} .report-print-editor-body b { font-weight: 700 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body em,
  #${PRINT_HOST_ID} .report-print-editor-body i { font-style: italic !important; }
  #${PRINT_HOST_ID} .report-print-editor-body u { text-decoration: underline !important; }
  #${PRINT_HOST_ID} .report-print-editor-body s,
  #${PRINT_HOST_ID} .report-print-editor-body strike,
  #${PRINT_HOST_ID} .report-print-editor-body del { text-decoration: line-through !important; }
  #${PRINT_HOST_ID} .report-print-editor-body mark {
    padding: 1px 3px !important;
    border-radius: 2px !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body hr {
    border: none !important;
    border-top: 1px solid #cbd5e1 !important;
    margin: 8px 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body ul,
  #${PRINT_HOST_ID} .report-print-editor-body ol { margin: 5px 0 !important; padding-left: 1.35em !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ul { list-style-type: disc !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ol { list-style-type: decimal !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ul ul { list-style-type: circle !important; margin-top: 4px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ul ul ul { list-style-type: square !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ol ol { list-style-type: lower-alpha !important; margin-top: 4px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body li {
    margin-bottom: 2px !important;
    list-style-position: outside !important;
    line-height: 1.5 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body li > p {
    margin: 0 !important;
    font-size: inherit !important;
    line-height: inherit !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body p:last-child { margin-bottom: 0 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body blockquote {
    margin: 5px 0 !important;
    padding: 4px 10px !important;
    border-left: 3px solid #3b82f6 !important;
    background: #f8fafc !important;
    font-style: italic !important;
    line-height: 1.6 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body pre {
    margin: 5px 0 !important;
    padding: 8px 10px !important;
    background: #2d3139 !important;
    color: #fff !important;
    border-radius: 4px !important;
    overflow-x: auto !important;
    font-family: Menlo, Consolas, monospace !important;
    font-size: 8.5pt !important;
    line-height: 1.4 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body pre code {
    background: transparent !important;
    color: inherit !important;
    padding: 0 !important;
    font-size: inherit !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body code {
    font-family: Menlo, Consolas, monospace !important;
    font-size: 0.92em !important;
    background: #f1f5f9 !important;
    padding: 2px 5px !important;
    border-radius: 3px !important;
    color: #b42318 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin: 5px 0 7px !important;
    font-size: 9pt !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body th {
    width: 20%;
    padding: 5px 8px !important;
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    text-align: left !important;
    vertical-align: top !important;
    color: #334155 !important;
    overflow: hidden !important;
    min-width: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td {
    padding: 5px 8px !important;
    background: #fff !important;
    border: 1px solid #cbd5e1 !important;
    vertical-align: top !important;
    text-align: left !important;
    word-break: break-word !important;
    overflow: hidden !important;
    min-width: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td h1,
  #${PRINT_HOST_ID} .report-print-editor-body td h2,
  #${PRINT_HOST_ID} .report-print-editor-body td h3,
  #${PRINT_HOST_ID} .report-print-editor-body td h4,
  #${PRINT_HOST_ID} .report-print-editor-body td h5,
  #${PRINT_HOST_ID} .report-print-editor-body td h6 {
    margin-top: 4px !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td h1:first-child,
  #${PRINT_HOST_ID} .report-print-editor-body td h2:first-child,
  #${PRINT_HOST_ID} .report-print-editor-body td h3:first-child { margin-top: 0 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body td p { margin: 0 0 4px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body td p:last-child { margin-bottom: 0 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body td p:empty::after { content: '\u00A0'; }
  #${PRINT_HOST_ID} .report-print-editor-body td ul,
  #${PRINT_HOST_ID} .report-print-editor-body td ol { margin: 3px 0 5px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body a { color: #2563eb !important; text-decoration: underline !important; }
  #${PRINT_HOST_ID} .report-print-editor-body img {
    max-width: 100% !important;
    height: auto !important;
    /* block이면 width 미지정 시 셀 전체로 늘어남 → 인라인 width(px·%) 유지 */
    display: inline-block !important;
    vertical-align: top !important;
    box-sizing: border-box !important;
    object-fit: contain !important;
  }
  /* 표 셀 안 이미지 — 인라인 px width·figure 래퍼가 셀 밖으로 나가는 것 방지 */
  #${PRINT_HOST_ID} .report-print-editor-body td img,
  #${PRINT_HOST_ID} .report-print-editor-body th img {
    max-width: 100% !important;
    float: none !important;
    clear: both !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td figure,
  #${PRINT_HOST_ID} .report-print-editor-body th figure {
    display: block !important;
    max-width: 100% !important;
    width: auto !important;
    margin-top: 4px !important;
    margin-bottom: 4px !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td figure img,
  #${PRINT_HOST_ID} .report-print-editor-body th figure img {
    max-width: 100% !important;
    height: auto !important;
  }
  /* 가운데/우측 정렬 — block + margin auto (inline-block에서는 margin auto 무효) */
  #${PRINT_HOST_ID} .report-print-editor-body img[data-align="center"] {
    display: block !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body img[data-align="right"] {
    display: block !important;
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body img[data-align="left"] {
    display: block !important;
    margin-left: 0 !important;
    margin-right: auto !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body figure[data-align="center"] {
    margin-left: auto !important;
    margin-right: auto !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body figure[data-align="right"] {
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body figure[data-align="left"] {
    margin-left: 0 !important;
    margin-right: auto !important;
  }
}
`

const applyImageAlignForPrint = (el: HTMLImageElement) => {
  const align = el.getAttribute('data-align') || 'left'
  el.style.setProperty('display', 'block')
  if (align === 'center') {
    el.style.setProperty('margin-left', 'auto')
    el.style.setProperty('margin-right', 'auto')
  } else if (align === 'right') {
    el.style.setProperty('margin-left', 'auto')
    el.style.setProperty('margin-right', '0')
  } else {
    el.style.setProperty('margin-left', '0')
    el.style.setProperty('margin-right', 'auto')
  }
}

const applyFigureAlignForPrint = (fig: HTMLElement, align: string) => {
  fig.setAttribute('data-align', align)
  fig.style.setProperty('display', 'block')
  if (align === 'center') {
    fig.style.setProperty('margin-left', 'auto')
    fig.style.setProperty('margin-right', 'auto')
  } else if (align === 'right') {
    fig.style.setProperty('margin-left', 'auto')
    fig.style.setProperty('margin-right', '0')
  } else {
    fig.style.setProperty('margin-left', '0')
    fig.style.setProperty('margin-right', 'auto')
  }
}

/** 인쇄 전 이미지 — width 유지·정렬·셀 overflow 방지 */
const normalizeImagesForPrint = (root: HTMLElement) => {
  root.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement
    el.style.setProperty('max-width', '100%')
    el.style.setProperty('height', 'auto')
    el.style.setProperty('box-sizing', 'border-box')
    el.style.setProperty('float', 'none')
    el.removeAttribute('width')
    el.removeAttribute('height')
    applyImageAlignForPrint(el)
  })

  root.querySelectorAll('figure').forEach((fig) => {
    const el = fig as HTMLElement
    const inner = el.querySelector('img')
    const align = inner?.getAttribute('data-align') || 'left'
    const imgWidth = inner?.style.width?.trim() || inner?.getAttribute('width') || ''
    el.style.setProperty('max-width', '100%')
    el.style.setProperty('box-sizing', 'border-box')
    if (!el.style.width?.trim() && imgWidth) {
      el.style.setProperty('width', imgWidth)
    }
    applyFigureAlignForPrint(el, align)
  })
}

const removeEl = (id: string) => {
  document.getElementById(id)?.remove()
}

/** 에디터 HTML 그대로 인쇄 — 제목·작성일자는 tmplHtml에서 관리하므로 에디터 내용만 출력 */
export const printLibraryReportFromHtml = (editorHtml: string): boolean => {
  if (typeof document === 'undefined' || !editorHtml.trim()) return false
  const prevTitle = document.title

  removeEl(PRINT_STYLE_ID)
  removeEl(PRINT_HOST_ID)

  const styleEl = document.createElement('style')
  styleEl.id = PRINT_STYLE_ID
  styleEl.textContent = buildPrintHostStyles()
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = `<div class="report-print-editor-body">${editorHtml}</div>`
  document.body.appendChild(host)
  normalizeImagesForPrint(host)

  const cleanup = () => {
    removeEl(PRINT_STYLE_ID)
    removeEl(PRINT_HOST_ID)
    document.title = prevTitle
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  document.title = 'TeamAgent'
  window.print()

  return true
}

/**
 * 현재 페이지 URL 기준으로 인쇄 미리보기를 연다(새 창 없음, 하단 URL에 about:blank 없음).
 * @returns 인쇄할 행이 없으면 false
 */
export const printLibraryReport = (values: LibraryGeneratedReportValues, reportTitle = '보고서'): boolean => {
  if (typeof document === 'undefined') return false

  const rows = getLibraryReportRows(values)
  if (rows.length === 0) return false
  const prevTitle = document.title

  removeEl(PRINT_STYLE_ID)
  removeEl(PRINT_HOST_ID)

  const styleEl = document.createElement('style')
  styleEl.id = PRINT_STYLE_ID
  styleEl.textContent = buildPrintHostStyles()
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = buildPrintHostInnerHtml(rows, values, formatYyyyMmDdDots(new Date()), reportTitle)
  document.body.appendChild(host)
  normalizeImagesForPrint(host)

  const cleanup = () => {
    removeEl(PRINT_STYLE_ID)
    removeEl(PRINT_HOST_ID)
    document.title = prevTitle
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  document.title = 'TeamAgent'
  window.print()

  return true
}

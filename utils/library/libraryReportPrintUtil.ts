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
  @page { margin: 18mm 16mm; }
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
    font-size: 12pt !important;
    line-height: 1.5 !important;
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

  /* 에디터 HTML 직접 인쇄 스타일 (printLibraryReportFromHtml) */
  #${PRINT_HOST_ID} .report-print-editor-body {
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif !important;
    font-size: 11pt !important;
    color: #1e293b !important;
    line-height: 1.55 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body h1 { font-size: 18pt !important; font-weight: 700 !important; margin: 12px 0 8px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body h2 { font-size: 15pt !important; font-weight: 700 !important; margin: 10px 0 6px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body h3 { font-size: 12pt !important; font-weight: 700 !important; margin: 8px 0 4px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body p { margin: 0 0 6px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body ul,
  #${PRINT_HOST_ID} .report-print-editor-body ol { margin: 6px 0 !important; padding-left: 1.4em !important; }
  #${PRINT_HOST_ID} .report-print-editor-body li { margin-bottom: 2px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body blockquote {
    margin: 6px 0 !important;
    padding: 4px 10px !important;
    border-left: 3px solid #3b82f6 !important;
    background: #f8fafc !important;
    font-style: italic !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    margin: 8px 0 10px !important;
    font-size: 10.5pt !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body th {
    width: 28% !important;
    padding: 8px 10px !important;
    background: #f8fafc !important;
    border: 1px solid #cbd5e1 !important;
    font-weight: 600 !important;
    text-align: left !important;
    vertical-align: top !important;
    color: #334155 !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td {
    padding: 8px 12px !important;
    background: #fff !important;
    border: 1px solid #cbd5e1 !important;
    vertical-align: top !important;
    word-break: break-word !important;
  }
  #${PRINT_HOST_ID} .report-print-editor-body td p { margin: 0 0 4px !important; }
  #${PRINT_HOST_ID} .report-print-editor-body td p:last-child { margin-bottom: 0 !important; }
  #${PRINT_HOST_ID} .report-print-editor-body a { color: #3b82f6 !important; text-decoration: underline !important; }
}
`

const removeEl = (id: string) => {
  document.getElementById(id)?.remove()
}

/** 에디터 HTML 그대로 인쇄 (표 외 텍스트 포함) — Tiptap getHTML() 결과물을 받아 인쇄 */
export const printLibraryReportFromHtml = (editorHtml: string, reportTitle = '보고서'): boolean => {
  if (typeof document === 'undefined' || !editorHtml.trim()) return false
  const prevTitle = document.title

  removeEl(PRINT_STYLE_ID)
  removeEl(PRINT_HOST_ID)

  const styleEl = document.createElement('style')
  styleEl.id = PRINT_STYLE_ID
  styleEl.textContent = buildPrintHostStyles()
  document.head.appendChild(styleEl)

  const writtenOn = formatYyyyMmDdDots(new Date())
  const host = document.createElement('div')
  host.id = PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = `
  <header class="report-print-header">
    <h1 class="report-print-title">${escapeHTML(reportTitle)}</h1>
    <p class="report-print-sub">${escapeHTML(writtenOn)} 작성</p>
  </header>
  <hr class="report-print-rule" />
  <div class="report-print-editor-body">${editorHtml}</div>`
  document.body.appendChild(host)

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

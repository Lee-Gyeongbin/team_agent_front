import { MEETING_DOCX_CSS } from '~/composables/meeting/meetingExportStyles'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import {
  extractReportRowsFromHtml,
  formatReportRowsAsPlainText,
  htmlDocumentToPlainText,
} from '~/utils/myDocuments/myDocExcelExportUtil'
import { printLibraryReportFromHtml } from '~/utils/library/libraryReportPrintUtil'

/** 파일명에 사용할 수 없는 문자 제거 */
export const sanitizeMyDocFileName = (name: string): string => {
  const trimmed = name.trim() || '문서'
  return trimmed.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100)
}

const buildDocxHtml = (html: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${MEETING_DOCX_CSS}</style></head><body>${html}</body></html>`

/** HTML 보고서 → Word(.docx) 다운로드 */
export const downloadMyDocAsWord = async (html: string, docNm: string): Promise<boolean> => {
  if (!html?.trim()) return false

  try {
    const { asBlob } = await import('html-docx-js-typescript')
    const blob = (await asBlob(buildDocxHtml(html))) as Blob
    downloadBlobAsFile(blob, `${sanitizeMyDocFileName(docNm)}.docx`)
    return true
  } catch {
    return false
  }
}

/** HTML 보고서 → PDF (브라우저 인쇄 대화상자 — PDF로 저장) */
export const downloadMyDocAsPdf = async (html: string, docNm: string): Promise<boolean> => {
  if (!html?.trim()) return false
  return printLibraryReportFromHtml(html)
}

/** HTML 보고서 → TXT(.txt) 다운로드 */
export const downloadMyDocAsTxt = async (html: string, docNm: string): Promise<boolean> => {
  if (!html?.trim()) return false

  const rows = extractReportRowsFromHtml(html)
  const content = rows.length > 0 ? formatReportRowsAsPlainText(rows) : htmlDocumentToPlainText(html)
  if (!content.trim()) return false

  try {
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' })
    downloadBlobAsFile(blob, `${sanitizeMyDocFileName(docNm)}.txt`)
    return true
  } catch {
    return false
  }
}

/** 보고서 시트 영역 → PNG 스냅샷 다운로드 */
export const downloadMyDocAsPng = async (sheetElement: HTMLElement | null, docNm: string): Promise<boolean> => {
  if (!sheetElement) return false

  const toolbar = sheetElement.querySelector('.library-report-editor-toolbar') as HTMLElement | null
  const scrollEl = sheetElement.querySelector('.library-report-editor-scroll') as HTMLElement | null
  const restoreFns: Array<() => void> = []

  const applyTempStyle = (el: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
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

  applyTempStyle(sheetElement, { overflow: 'visible', height: 'auto', maxHeight: 'none' })
  if (scrollEl) {
    applyTempStyle(scrollEl, { overflow: 'visible', height: 'auto', maxHeight: 'none' })
  }
  if (toolbar) {
    const prevDisplay = toolbar.style.display
    toolbar.style.display = 'none'
    restoreFns.push(() => {
      toolbar.style.display = prevDisplay
    })
  }

  try {
    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(sheetElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      width: sheetElement.scrollWidth,
      height: sheetElement.scrollHeight,
    })

    const response = await fetch(dataUrl)
    const blob = await response.blob()
    downloadBlobAsFile(blob, `${sanitizeMyDocFileName(docNm)}.png`)
    return true
  } catch {
    return false
  } finally {
    restoreFns.reverse().forEach((restore) => restore())
  }
}

/** HTML 보고서 → Excel(.xlsx) 다운로드 */
export const downloadMyDocAsExcel = async (html: string, docNm: string): Promise<boolean> => {
  const rows = extractReportRowsFromHtml(html)
  if (rows.length === 0) return false

  try {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('보고서')

    worksheet.addRows([['항목', '내용'], ...rows])
    worksheet.getColumn(1).width = 24
    worksheet.getColumn(2).width = 64
    worksheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    downloadBlobAsFile(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `${sanitizeMyDocFileName(docNm)}.xlsx`,
    )
    return true
  } catch {
    return false
  }
}

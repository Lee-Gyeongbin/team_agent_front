import { asBlob } from 'html-docx-js-typescript'
import { formatChatStoreFileNameBase } from '~/utils/global/dateUtil'
import { printLibraryReportFromHtml } from '~/utils/library/libraryReportPrintUtil'

/** 다운로드 파일명 — 제목_yyyyMMddHHmmssSSS */
const buildReportDownloadFileName = (title: string) => `${title}_${formatChatStoreFileNameBase()}`

/**
 * 리서치 리포트 HTML을 DOCX 파일로 다운로드한다.
 */
export const downloadReportAsDocx = async (html: string, filename = '리포트') => {
  const downloadName = buildReportDownloadFileName(filename)
  const wrappedHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.7; color: #000; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 16pt; }
        h2 { font-size: 14pt; margin-top: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
        h3 { font-size: 12pt; margin-top: 10pt; }
        table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
        th, td { border: 1px solid #999; padding: 6pt 8pt; font-size: 10pt; }
        th { background: #f0f0f0; }
        img { max-width: 100%; }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `
  const blob = (await asBlob(wrappedHtml)) as Blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${downloadName}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 리서치 리포트 HTML을 브라우저 인쇄 다이얼로그로 PDF 저장한다.
 * (jspdf 의존 없이 window.print 기반 — 라이브러리 리포트와 동일한 인쇄 유틸 사용)
 */
export const downloadReportAsPdf = async (html: string, _filename = '리포트') => {
  printLibraryReportFromHtml(html)
}

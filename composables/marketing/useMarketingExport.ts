// 마케팅 콘텐츠 내보내기(PDF/DOCX)

import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import {
  buildMarketingPrintCss,
  MARKETING_DOCX_CSS,
  applyMarketingDocxInlineAlign,
} from '~/composables/marketing/marketingExportStyles'

const MARKETING_PRINT_HOST_ID = 'marketing-export-print-host'
const MARKETING_PRINT_STYLE_ID = 'marketing-export-print-style'

/**
 * PDF 내보내기 — 브라우저 window.print() 사용
 * 서버는 템플릿에 콘텐츠를 채운 HTML만 주고, 실제 인쇄 스타일은 buildMarketingPrintCss로 여기서 입힌다.
 */
const exportMarketingHtmlAsPdf = async (html: string) => {
  document.getElementById(MARKETING_PRINT_STYLE_ID)?.remove()
  document.getElementById(MARKETING_PRINT_HOST_ID)?.remove()

  const styleEl = document.createElement('style')
  styleEl.id = MARKETING_PRINT_STYLE_ID
  styleEl.textContent = buildMarketingPrintCss(MARKETING_PRINT_HOST_ID)
  document.head.appendChild(styleEl)

  const host = document.createElement('div')
  host.id = MARKETING_PRINT_HOST_ID
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = html
  document.body.appendChild(host)

  // base64 이미지가 렌더링되기 전에 print()가 호출되면 이미지가 누락됨
  const images = Array.from(host.querySelectorAll('img'))
  if (images.length > 0) {
    await Promise.all(
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
    )
  }

  const cleanup = () => {
    document.getElementById(MARKETING_PRINT_STYLE_ID)?.remove()
    document.getElementById(MARKETING_PRINT_HOST_ID)?.remove()
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
}

/** Word 본문 폭(A4 기본 여백 기준 약 16cm)에 맞춘 이미지 최대 폭(px) */
const DOCX_IMAGE_MAX_WIDTH = 600

/**
 * Word는 CSS max-width를 무시하고 이미지를 원본 픽셀 크기로 넣는다.
 * 폭이 지정되지 않은 이미지에 본문 폭 이하로 줄인 width/height를 직접 넣는다(로고처럼 폭이 있는 이미지는 그대로).
 */
const fitDocxImageWidth = async (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const images = Array.from(doc.querySelectorAll('img')).filter((img) => !img.style.width && !img.getAttribute('width'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const probe = new Image()
          probe.onload = () => {
            if (probe.naturalWidth > 0) {
              const width = Math.min(probe.naturalWidth, DOCX_IMAGE_MAX_WIDTH)
              const height = Math.round((probe.naturalHeight * width) / probe.naturalWidth)
              img.setAttribute('width', String(width))
              img.setAttribute('height', String(height))
              img.style.width = `${width}px`
              img.style.height = `${height}px`
            }
            resolve()
          }
          probe.onerror = () => resolve()
          probe.src = img.getAttribute('src') ?? ''
        }),
    ),
  )
  return doc.body.innerHTML
}

/**
 * DOCX 내보내기 — html-docx-js-typescript로 브라우저에서 직접 변환 (회의록과 동일 패턴).
 * Word는 <style> 블록의 정렬을 안 지키므로 인라인 style로 한 번 더 넣는다.
 */
const exportMarketingHtmlAsDocx = async (html: string, fileName: string) => {
  const { asBlob } = await import('html-docx-js-typescript')
  const alignedHtml = applyMarketingDocxInlineAlign(await fitDocxImageWidth(html))
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${MARKETING_DOCX_CSS}</style></head><body>${alignedHtml}</body></html>`
  const blob = (await asBlob(fullHtml)) as Blob
  downloadBlobAsFile(blob, `${fileName}.docx`)
}

export const useMarketingExport = () => ({
  exportMarketingHtmlAsPdf,
  exportMarketingHtmlAsDocx,
})

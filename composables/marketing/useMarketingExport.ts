// =========================================================
// 마케팅 콘텐츠 내보내기(PDF/DOCX) 공통 로직
// MarketingResult.vue에 있던 exportAsPdf/exportAsDocx를 추출 —
// MarketingReview.vue 등 다른 화면에서도 동일한 다운로드 동작을 재사용한다.
// =========================================================

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
 * 서버는 LLM+템플릿 렌더링 HTML만 주고, 실제 인쇄 스타일은 buildMarketingPrintCss로 여기서 입힌다.
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

/**
 * DOCX 내보내기 — html-docx-js-typescript로 브라우저에서 직접 변환 (회의록과 동일 패턴).
 * Word는 <style> 블록의 정렬을 안 지키므로 인라인 style로 한 번 더 넣는다.
 */
const exportMarketingHtmlAsDocx = async (html: string, fileName: string) => {
  const { asBlob } = await import('html-docx-js-typescript')
  const alignedHtml = applyMarketingDocxInlineAlign(html)
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${MARKETING_DOCX_CSS}</style></head><body>${alignedHtml}</body></html>`
  const blob = (await asBlob(fullHtml)) as Blob
  downloadBlobAsFile(blob, `${fileName}.docx`)
}

export const useMarketingExport = () => ({
  exportMarketingHtmlAsPdf,
  exportMarketingHtmlAsDocx,
})

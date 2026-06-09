import type { PdfJsLib } from '~/types/chat'

/**
 * pdf.js 라이브러리를 로드하는 공통 헬퍼
 * - window.pdfjsLib가 이미 존재하면 즉시 반환
 * - 없으면 <script> 태그로 로드 후 반환
 * usePdfViewer, ChatPdfPanel 등에서 공통 사용
 */
let cachedLib: PdfJsLib | null = null
let loadingPromise: Promise<PdfJsLib> | null = null

export const loadPdfJs = (): Promise<PdfJsLib> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 PDF를 렌더링할 수 있습니다.'))
  }
  if (cachedLib) return Promise.resolve(cachedLib)
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const loaded = window.pdfjsLib
    if (loaded) {
      cachedLib = loaded
      resolve(cachedLib)
      return
    }
    const script = document.createElement('script')
    script.src = '/pdfjs/build/pdf.js'
    script.onload = () => {
      cachedLib = window.pdfjsLib || null
      if (!cachedLib) {
        reject(new Error('PDF.js 라이브러리를 찾을 수 없습니다.'))
        return
      }
      resolve(cachedLib)
    }
    script.onerror = () => reject(new Error('PDF.js 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
  return loadingPromise
}

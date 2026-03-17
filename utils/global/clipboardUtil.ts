/**
 * navigator.clipboard가 없는 환경(HTTP)에서도 동작하는 클립보드 복사 유틸
 * - Secure Context(HTTPS, localhost): navigator.clipboard API 사용
 * - Non-secure Context(HTTP): textarea + execCommand('copy') 폴백
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

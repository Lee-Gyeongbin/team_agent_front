/**
 * 채팅 답변/로그 본문을 화면 표시용 HTML 문자열로 변환
 * 로직은 useChatMessages.toHtmlContent 와 동일 (복제)
 */
export const toHtmlContent = (value: string) => {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\\n/g, '\n')
  return normalized.replace(/\n/g, '<br>')
}

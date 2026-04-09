/** 채팅 WebSocket URL 생성 — useChatSocket, useChatTestSocket 공통 */
export const getWebSocketUrl = (): string => {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = import.meta.dev ? 'localhost:8082' : window.location.host
  return `${protocol}://${host}/ws/chat`
}

/** API(숫자)·라우트(문자열) 등 roomId 타입 불일치 시 비교·URL·WS threadId 통일 */
export const normalizeChatRoomId = (id: unknown) => String(id ?? '').trim()

/** Vue Router params와 무관하게 `route.path`에서 `/chat/:roomId`만 추출 (/chat/share/* 제외) — 동적 세그먼트 전환 시 사이드바 활성 표시 꼬임 완화 */
export function parseChatRoomIdFromChatPath(routePath: string): string {
  const pathOnly = routePath.trim().split(/[?#]/)[0] ?? ''
  const m = /^\/chat\/([^/]+)\/?$/.exec(pathOnly)
  if (!m?.[1] || m[1] === 'share') return ''
  return normalizeChatRoomId(m[1])
}

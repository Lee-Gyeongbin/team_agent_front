/** API(숫자)·라우트(문자열) 등 roomId 타입 불일치 시 비교·URL·WS threadId 통일 */
export const normalizeChatRoomId = (id: unknown) => String(id ?? '').trim()

/** 검증 미리보기 전용 가짜 roomId — 서버에 채팅방/로그를 만들지 않는다 */
export const EPHEMERAL_VALIDATION_ROOM_ID = '__dq_preview__'

export const isEphemeralValidationRoomId = (roomId: unknown): boolean =>
  normalizeChatRoomId(roomId) === EPHEMERAL_VALIDATION_ROOM_ID

/** Vue Router params와 무관하게 `route.path`에서 `/chat/:roomId`만 추출 (/chat/share/* 제외) — 동적 세그먼트 전환 시 사이드바 활성 표시 꼬임 완화 */
export function parseChatRoomIdFromChatPath(routePath: string): string {
  const pathOnly = routePath.trim().split(/[?#]/)[0] ?? ''
  const m = /^\/chat\/([^/]+)\/?$/.exec(pathOnly)
  if (!m?.[1] || m[1] === 'share') return ''
  return normalizeChatRoomId(m[1])
}

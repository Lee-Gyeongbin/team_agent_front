/** API(숫자)·라우트(문자열) 등 roomId 타입 불일치 시 비교·URL·WS threadId 통일 */
export const normalizeChatRoomId = (id: unknown) => String(id ?? '').trim()

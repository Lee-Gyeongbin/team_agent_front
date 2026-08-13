import { CHAT_GUIDE_API_ERROR_KEYS } from '~/types/chat-guide'
import { useChatGuide } from '~/composables/com/useChatGuide'
import { openToast } from '~/composables/useToast'

/** 동일 guideKey toast 중복 방지 간격 */
const DEDUPE_MS = 2000

const lastNotifiedAtByKey = new Map<string, number>()

/** HTTP status → API 오류 guideKey */
export const resolveApiErrorGuideKey = (status: number): string | null => {
  if (status === 401 || status === 403) return CHAT_GUIDE_API_ERROR_KEYS.status401_403
  if (status === 408) return CHAT_GUIDE_API_ERROR_KEYS.status408
  if (status === 429) return CHAT_GUIDE_API_ERROR_KEYS.status429
  if (status >= 500 && status < 600) return CHAT_GUIDE_API_ERROR_KEYS.status500
  return null
}

/**
 * chatGuideList 캐시에서 API 오류 안내 문구 조회
 * - enblYn=Y 이고 content가 있을 때만 반환
 */
export const resolveApiErrorGuideMessage = (status: number): string | null => {
  const guideKey = resolveApiErrorGuideKey(status)
  if (!guideKey) return null

  const { getChatGuideByKey } = useChatGuide()
  const guide = getChatGuideByKey(guideKey)
  if (guide?.enblYn !== 'Y') return null

  const content = String(guide.content ?? '').trim()
  return content || null
}

/**
 * API HTTP 오류 toast — useApi · useApi_multipart에서 호출
 * @returns 표시한 안내 문구 (없으면 null — 호출측에서 서버/기본 메시지 사용)
 */
export function notifyApiError(status: number): string | null {
  const guideKey = resolveApiErrorGuideKey(status)
  if (!guideKey) return null

  const message = resolveApiErrorGuideMessage(status)
  if (!message) return null

  // SSR에서는 요청 간에 toast 상태와 dedupe 시각을 공유하지 않는다.
  if (!import.meta.client) return message

  const now = Date.now()
  const lastAt = lastNotifiedAtByKey.get(guideKey) ?? 0
  if (now - lastAt < DEDUPE_MS) return message

  lastNotifiedAtByKey.set(guideKey, now)
  openToast({ message, type: 'error' })
  return message
}

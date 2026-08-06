import { ref } from 'vue'
import type { ChatMessage, ChatRoom } from '~/types/chat'
import { normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import {
  buildMarketingHistoryMetaBadges,
  extractMarketingHistoryMetaBadgesFromPrompt,
  isMarketingAuthoringPrompt,
  isMarketingImagePrompt,
  isMarketingTextPrompt,
  resolveMarketingHistoryConditions,
  resolveMarketingPromptMode,
  resolveMarketingRoomQContent,
} from '~/utils/chat/marketingAuthoringUtil'

// ─── Panel mode ──────────────────────────────────────────────────────────────

// ─── Room registry (stateful) ────────────────────────────────────────────────

const marketingAuthoringRoomIds = ref<Set<string>>(new Set())

const MARKETING_ROOM_MODE_STORAGE_KEY = 'ta-marketing-room-modes'
const MARKETING_ROOM_SUMMARY_STORAGE_KEY = 'ta-marketing-room-summaries'

export type MarketingRoomMode = 'TEXT' | 'IMAGE' | 'BOTH'
type MarketingRoomModeMap = Record<string, MarketingRoomMode>
type MarketingRoomSummaryMap = Record<string, string[]>

const readStorageMap = <T>(key: string, normalize: (value: unknown) => T): Record<string, T> => {
  if (typeof localStorage === 'undefined') return {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).map(([roomId, value]) => [roomId, normalize(value)]))
  } catch {
    return {}
  }
}

const writeStorageMap = (key: string, value: object) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
}

const normalizeSummaryBadges = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 3)

const marketingRoomModeMap = ref<MarketingRoomModeMap>(
  readStorageMap(MARKETING_ROOM_MODE_STORAGE_KEY, (value) =>
    value === 'IMAGE' ? 'IMAGE' : value === 'BOTH' ? 'BOTH' : 'TEXT',
  ),
)
const marketingRoomSummaryMap = ref<MarketingRoomSummaryMap>(
  readStorageMap(MARKETING_ROOM_SUMMARY_STORAGE_KEY, normalizeSummaryBadges),
)

export const getMarketingRoomMode = (roomId: string): MarketingRoomMode | undefined => {
  const id = normalizeChatRoomId(roomId)
  return id ? marketingRoomModeMap.value[id] : undefined
}

export const getMarketingRoomSummary = (roomId: string): string[] | undefined => {
  const id = normalizeChatRoomId(roomId)
  return id ? marketingRoomSummaryMap.value[id] : undefined
}

export const registerMarketingRoomMode = (roomId: string, mode: MarketingRoomMode) => {
  const id = normalizeChatRoomId(roomId)
  if (!id) return
  marketingRoomModeMap.value = { ...marketingRoomModeMap.value, [id]: mode }
  writeStorageMap(MARKETING_ROOM_MODE_STORAGE_KEY, marketingRoomModeMap.value)
}

export const registerMarketingRoomSummary = (roomId: string, badges: string[]) => {
  const id = normalizeChatRoomId(roomId)
  const normalized = normalizeSummaryBadges(badges)
  if (!id || !normalized.length) return
  marketingRoomSummaryMap.value = { ...marketingRoomSummaryMap.value, [id]: normalized }
  writeStorageMap(MARKETING_ROOM_SUMMARY_STORAGE_KEY, marketingRoomSummaryMap.value)
}

const findMarketingQuestionPrompt = (messageList: ChatMessage[]): string =>
  String(
    messageList.find((item) => item.type === 'question' && isMarketingAuthoringPrompt(item.qContent ?? ''))?.qContent ??
      '',
  )

/** 채팅방 목록 qContent로 모드 캐시 보강 — qContent가 있는 방만 */
export const syncMarketingRoomModesFromChatRooms = (rooms: ChatRoom[]) => {
  for (const room of rooms) {
    const id = normalizeChatRoomId(room.roomId)
    if (!id || marketingRoomModeMap.value[id]) continue
    const titled = String(room.roomTitle || room.title || '').trim()
    if (/^통합(\s*[·|]|\s|$)/.test(titled) || titled.startsWith('[통합]')) {
      registerMarketingRoomMode(id, 'BOTH')
      continue
    }
    const mode = resolveMarketingPromptMode(resolveMarketingRoomQContent(room))
    if (mode) registerMarketingRoomMode(id, mode)
  }
}

/** 채팅방 목록 qContent로 메타 배지 캐시 보강 */
export const syncMarketingRoomSummariesFromChatRooms = (rooms: ChatRoom[]) => {
  for (const room of rooms) {
    const id = normalizeChatRoomId(room.roomId)
    if (!id || marketingRoomSummaryMap.value[id]?.length) continue
    const badges = extractMarketingHistoryMetaBadgesFromPrompt(resolveMarketingRoomQContent(room))
    if (badges.length) registerMarketingRoomSummary(id, badges)
  }
}

/** 로그의 첫 마케팅 question으로 모드 캐시 보강 */
export const syncMarketingRoomModeFromMessages = (roomId: string, messageList: ChatMessage[]) => {
  const id = normalizeChatRoomId(roomId)
  if (!id) return
  let hasText = false
  let hasImage = false
  for (const msg of messageList) {
    if (msg.type !== 'question') continue
    const q = String(msg.qContent ?? '')
    if (isMarketingImagePrompt(q)) hasImage = true
    else if (isMarketingTextPrompt(q) || isMarketingAuthoringPrompt(q)) hasText = true
  }
  if (hasText && hasImage) {
    registerMarketingRoomMode(id, 'BOTH')
    return
  }
  if (hasImage) {
    registerMarketingRoomMode(id, 'IMAGE')
    return
  }
  if (hasText) {
    registerMarketingRoomMode(id, 'TEXT')
  }
}

/** 로그의 첫 마케팅 question으로 메타 배지 캐시 보강 */
export const syncMarketingRoomSummaryFromMessages = (roomId: string, messageList: ChatMessage[]) => {
  const id = normalizeChatRoomId(roomId)
  if (!id || marketingRoomSummaryMap.value[id]?.length) return
  const badges = extractMarketingHistoryMetaBadgesFromPrompt(findMarketingQuestionPrompt(messageList))
  if (badges.length) registerMarketingRoomSummary(id, badges)
}

export const registerMarketingAuthoringRoom = (roomId: string) => {
  const id = String(roomId ?? '').trim()
  if (!id) return
  marketingAuthoringRoomIds.value = new Set([...marketingAuthoringRoomIds.value, id])
}

export const isMarketingAuthoringRoom = (roomId: string) =>
  marketingAuthoringRoomIds.value.has(String(roomId ?? '').trim())

// ─── History resolvers (room cache 의존) ─────────────────────────────────────

const isJunkMarketingHistoryTitle = (title: string) =>
  /작성 조건|출력 형식|이미지 제작 조건|agentType\s*:|생성 요구사항/.test(title)

const stripMarketingHistoryModePrefix = (title: string) =>
  String(title ?? '')
    .replace(/^\[?(통합|문구|이미지)\]?\s*[·|—-]\s*/, '')
    .trim()

const resolveMarketingModeFallbackLabel = (mode: MarketingRoomMode) =>
  mode === 'BOTH' ? '통합 제작' : mode === 'IMAGE' ? '이미지 제작' : '문구 제작'

const resolveMarketingHistoryModeFromTitle = (title: string): MarketingRoomMode | null => {
  const titled = String(title ?? '').trim()
  if (!titled) return null
  if (/^통합(\s*[·|]|\s|$)/.test(titled) || titled.startsWith('[통합]')) return 'BOTH'
  if (/^이미지(\s*[·|]|\s|$)/.test(titled) || titled.startsWith('[이미지]')) return 'IMAGE'
  if (/^문구(\s*[·|]|\s|$)/.test(titled) || titled.startsWith('[문구]')) return 'TEXT'
  return null
}

/** 목록 카드용 모드 — 캐시 → 프롬프트 마커 → 저장 제목 접두 → 기본 문구 */
export const resolveMarketingHistoryMode = (
  room: Pick<ChatRoom, 'roomTitle' | 'title' | 'qContent'> & { roomId?: string; qcontent?: string },
): MarketingRoomMode => {
  const id = normalizeChatRoomId(room.roomId ?? '')
  const cached = id ? getMarketingRoomMode(id) : undefined
  if (cached) return cached

  const fromPrompt = resolveMarketingPromptMode(resolveMarketingRoomQContent(room))
  if (fromPrompt) return fromPrompt

  const fromTitle = resolveMarketingHistoryModeFromTitle(String(room.roomTitle || room.title || '').trim())
  if (fromTitle) return fromTitle

  return 'TEXT'
}

/** 제작 내역 카드 title — 비어 있지 않게 보장 */
export const resolveMarketingHistoryTitle = (
  room: Pick<ChatRoom, 'qContent' | 'roomTitle' | 'title'> & { qcontent?: string; roomId?: string },
): string => {
  const mode = resolveMarketingHistoryMode(room)
  const fallbackLabel = resolveMarketingModeFallbackLabel(mode)
  const conditions = resolveMarketingHistoryConditions(room)

  if (conditions) {
    const parts =
      mode === 'IMAGE'
        ? [conditions.channel, conditions.purpose, conditions.keyMessage]
        : [conditions.contentType, conditions.purpose, conditions.keyMessage]
    const summary = parts.filter(Boolean).slice(0, 2).join(' · ')
    if (summary) return summary
  }

  const titled = stripMarketingHistoryModePrefix(String(room.roomTitle || room.title || ''))
  if (titled && !isJunkMarketingHistoryTitle(titled)) return titled
  return fallbackLabel
}

/** 목록 카드 제목 — 사용자 저장 이름 우선, 없으면 핵심 메시지 */
export const resolveMarketingHistoryDisplayTitle = (
  room: Pick<ChatRoom, 'qContent' | 'roomTitle' | 'title'> & { qcontent?: string; roomId?: string },
): string => {
  const fallbackLabel = resolveMarketingModeFallbackLabel(resolveMarketingHistoryMode(room))

  const titled = stripMarketingHistoryModePrefix(String(room.roomTitle || room.title || ''))
  if (titled && !isJunkMarketingHistoryTitle(titled)) return titled

  const keyMessage = String(resolveMarketingHistoryConditions(room)?.keyMessage ?? '').trim()
  if (keyMessage) return keyMessage

  return fallbackLabel
}

/** 목록 카드 메타 배지 — contentType · channel · purpose (각각 별도 칩) */
export const resolveMarketingHistoryMetaBadges = (
  room: Pick<ChatRoom, 'qContent' | 'roomTitle' | 'title'> & { qcontent?: string; roomId?: string },
): string[] => {
  const id = normalizeChatRoomId(room.roomId ?? '')

  const fromConditions = buildMarketingHistoryMetaBadges(resolveMarketingHistoryConditions(room))
  if (fromConditions.length) {
    if (id) registerMarketingRoomSummary(id, fromConditions)
    return fromConditions
  }

  const fromPrompt = extractMarketingHistoryMetaBadgesFromPrompt(resolveMarketingRoomQContent(room))
  if (fromPrompt.length) {
    if (id) registerMarketingRoomSummary(id, fromPrompt)
    return fromPrompt
  }

  const cached = id ? getMarketingRoomSummary(id) : undefined
  if (cached?.length) {
    return cached
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 3)
  }

  const titled = stripMarketingHistoryModePrefix(String(room.roomTitle || room.title || ''))
  if (titled.includes(' · ')) {
    const badges = titled
      .split(' · ')
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .slice(0, 3)
    if (badges.length && id) registerMarketingRoomSummary(id, badges)
    return badges
  }

  return []
}

const MARKETING_CONTENT_TYPE_LABEL_TO_FILTER_KEY: Record<string, string> = {
  'SNS 게시글': 'SNS',
  블로그: 'BLOG',
  '광고 문구': 'AD_COPY',
  '이메일·뉴스레터': 'EMAIL',
  '랜딩페이지 문구': 'LANDING_PAGE',
  랜딩페이지: 'LANDING_PAGE',
}

/** 목록 유형 필터 키 — SNS | BLOG | AD_COPY | EMAIL | LANDING_PAGE | OTHER */
export const resolveMarketingHistoryContentTypeFilterKey = (
  room: Pick<ChatRoom, 'qContent' | 'roomTitle' | 'title'> & { qcontent?: string; roomId?: string },
): string => {
  const mode = resolveMarketingHistoryMode(room)
  const conditions = resolveMarketingHistoryConditions(room)
  const contentTypeLabel = String(conditions?.contentType ?? '').trim()
  const channel = String(conditions?.channel ?? '').trim()

  if (mode === 'IMAGE') {
    if (/SNS|인스타|페이스북|소셜|틱톡|링크드/i.test(`${contentTypeLabel} ${channel}`)) return 'SNS'
    return 'OTHER'
  }

  const mapped = MARKETING_CONTENT_TYPE_LABEL_TO_FILTER_KEY[contentTypeLabel]
  if (mapped) return mapped

  if (/SNS|소셜/i.test(contentTypeLabel)) return 'SNS'
  if (/블로그/i.test(contentTypeLabel)) return 'BLOG'
  if (/광고/i.test(contentTypeLabel)) return 'AD_COPY'
  if (/이메일|뉴스레터/i.test(contentTypeLabel)) return 'EMAIL'
  if (/랜딩/i.test(contentTypeLabel)) return 'LANDING_PAGE'

  return 'OTHER'
}

// ─── Composable API ──────────────────────────────────────────────────────────

export const useMarketingAuthoring = () => {
  return {
    registerMarketingAuthoringRoom,
    registerMarketingRoomMode,
    registerMarketingRoomSummary,
    syncMarketingRoomModesFromChatRooms,
    syncMarketingRoomSummariesFromChatRooms,
    syncMarketingRoomModeFromMessages,
    syncMarketingRoomSummaryFromMessages,
    isMarketingAuthoringRoom,
    getMarketingRoomMode,
    getMarketingRoomSummary,
  }
}

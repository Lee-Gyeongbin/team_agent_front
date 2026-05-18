import { computed, ref } from 'vue'
import { useApi } from '~/composables/com/useApi'
import type { ChatMessage, LunchAgentFormPayload, LunchRecommendationItem, RegionLocationMap } from '~/types/chat'

/** 채팅·로그 재구성 시 에이전트 식별 — 변경 시 useChatStore AGENT_ID_LUNCH 와 동기화 */
export const LUNCH_AGENT_ID = 'AG000009'

/**
 * 브라우저 geolocation으로 WGS84 좌표 획득 (selectRegionTree.do lat/lng 쿼리용).
 * 비지원·거부·타임아웃 시 null.
 */
export const getLunchGeolocationCoords = (): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          resolve(null)
          return
        }
        resolve({ lat, lng })
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })

/** 지역 트리 응답(data)을 점심카드 위치 셀렉트 맵으로 정규화 */
export const normalizeLunchLocationMap = (regionData?: RegionLocationMap): RegionLocationMap => {
  if (!regionData || typeof regionData !== 'object') return {}

  return Object.fromEntries(
    Object.entries(regionData).map(([sidoName, sigunguObj]) => [
      sidoName,
      Object.fromEntries(
        Object.entries(sigunguObj ?? {}).map(([sigunguName, dongList]) => [
          sigunguName,
          Array.isArray(dongList) ? dongList.map((dong) => String(dong ?? '').trim()).filter(Boolean) : [],
        ]),
      ),
    ]),
  )
}

export const LUNCH_PEOPLE_OPTIONS = ['1명', '2명', '3~4명', '5명 이상']
export const LUNCH_CUISINE_OPTIONS = ['한식', '중식', '양식', '일식', '패스트푸드', '아시아음식', '상관없음']
export const LUNCH_MOOD_OPTIONS = ['든든하게', '가볍게', '매콤하게', '달달하게', '깔끔하게', '상관없음']
export const LUNCH_BUDGET_OPTIONS = ['8,000 ~ 12,000원', '12,000 ~ 15,000원', '15,000 ~ 20,000원', '20,000원 이상']

export const getLunchAnsweredCount = (payload: Partial<LunchAgentFormPayload>): number => {
  const checks = [
    !!payload.sido && !!payload.sigungu && !!payload.dong,
    !!payload.mood,
    !!payload.budget,
    !!payload.peopleCount,
    !!payload.cuisineType,
  ]
  return checks.filter(Boolean).length
}

// ── [음식이미지] placeholder (JSON) → getLunchMenuImageData.do ──

/** LLM이 imageUrl 필드에 넣는 플레이스홀더 패턴 */
const LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX = /^\[?음식이미지\]?$/u

/** API·캐시 imageUrl — 항상 data:image/...;base64,... 형식 */
const isLunchMenuDataImageUrl = (url: string): boolean => {
  const v = String(url ?? '').trim()
  return v.length > 0 && v.startsWith('data:image')
}

/** 표시·캐시용 imageUrl (data URL만 유효) */
export const normalizeLunchMenuImageUrl = (raw: string | undefined | null): string | null => {
  const v = String(raw ?? '').trim()
  if (!isLunchMenuDataImageUrl(v)) return null
  return v
}

/** API data URL은 변환 없이 그대로 사용 */
export const normalizeLunchRecommendationImages = (items: LunchRecommendationItem[]): LunchRecommendationItem[] => items

export const isLunchMenuImagePlaceholderUrl = (imageUrl: string | undefined | null): boolean => {
  const v = String(imageUrl ?? '').trim()
  if (!v) return true
  if (isLunchMenuDataImageUrl(v)) return false
  if (LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX.test(v)) return true
  return true
}

/** JSON 각 행에 유효한 imageUrl이 없는지 */
export const hasLunchMenuImagePlaceholderInItems = (items: LunchRecommendationItem[]): boolean =>
  items.some((row) => String(row.menu ?? '').trim() && isLunchMenuImagePlaceholderUrl(row.imageUrl))

/** 썸네일 API 호출 조건 — 유효 URL이 없는 행이 하나라도 있으면 조회 */
export const shouldFetchLunchMenuImages = (items: LunchRecommendationItem[]): boolean =>
  hasLunchMenuImagePlaceholderInItems(items)

/** 답변 본문 JSON 배열 — LLM은 LunchRecommendationItem[] JSON 배열만 반환 */
export const parseLunchJsonArray = (jsonSource: string): LunchRecommendationItem[] => {
  const raw = String(jsonSource ?? '').trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as LunchRecommendationItem[]) : []
  } catch {
    return []
  }
}

/** 동일 추천 JSON인지 비교 — 스트리밍 완료 후 본문 변경 감지·중복 fetch 방지용 */
export const lunchRecommendationsJsonKey = (rContent: string): string => {
  const items = parseLunchJsonArray(rContent)
  return items.length > 0 ? JSON.stringify(items) : ''
}

const lunchRecommendationRowKey = (row: LunchRecommendationItem): string =>
  `${String(row.restaurant ?? '').trim()}::${String(row.menu ?? '').trim()}`

/**
 * 스트리밍 갱신 시 API로 받은 imageUrl 유지
 */
export const mergeLunchRecommendationsPreservingImages = (
  next: LunchRecommendationItem[],
  existing?: LunchRecommendationItem[] | null,
): LunchRecommendationItem[] => {
  const normalized = normalizeLunchRecommendationImages(next)
  if (!existing?.length) return normalized

  const imageByKey = new Map<string, string>()
  for (const row of existing) {
    const url = normalizeLunchMenuImageUrl(row.imageUrl)
    if (url) imageByKey.set(lunchRecommendationRowKey(row), url)
  }

  return normalized.map((row) => {
    const preserved = imageByKey.get(lunchRecommendationRowKey(row))
    if (preserved && isLunchMenuImagePlaceholderUrl(row.imageUrl)) {
      return { ...row, imageUrl: preserved }
    }
    return row
  })
}

// ── 점심 썸네일 결과 캐시 (logId) ─────────────────────

const lunchMenuImageEnrichedCache = new Map<string, LunchRecommendationItem[]>()

export const getLunchMenuImageEnrichedCache = (logId: string): LunchRecommendationItem[] | null =>
  lunchMenuImageEnrichedCache.get(logId) ?? null

export const setLunchMenuImageEnrichedCache = (logId: string, rows: LunchRecommendationItem[]): void => {
  lunchMenuImageEnrichedCache.set(logId, rows)
}

/**
 * 인메모리 캐시·이미 enrichment된 imageUrl 동기 조회 — API 대기 없이 즉시 표시
 */
export const tryGetLunchMenuImageEnrichmentFromCache = (
  logId: string,
  rContent: string,
  items: LunchRecommendationItem[],
): LunchRecommendationItem[] | null => {
  if (!items.length) return null

  const normalized = normalizeLunchRecommendationImages(items)
  if (!shouldFetchLunchMenuImages(normalized)) return normalized

  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId) return null

  const jsonKey = lunchRecommendationsJsonKey(rContent)
  const cached = getLunchMenuImageEnrichedCache(trimmedLogId)
  if (cached && lunchMenuImageFetchJsonKeyByLogId.get(trimmedLogId) === jsonKey) {
    return cached
  }
  return null
}

/** answer·result 카드 연결·썸네일 캐시 키 (answer logId) */
export const getLunchImageEnrichmentCacheKey = (source: {
  lunchAnswerLogId?: string | null
  logId?: string | null
}): string => {
  const answerLogId = String(source.lunchAnswerLogId ?? '').trim()
  if (answerLogId) return answerLogId
  const logId = String(source.logId ?? '').trim()
  if (!logId) return ''
  if (logId.endsWith('-lunch-result')) return logId.slice(0, -'-lunch-result'.length)
  return logId
}

/** logId별 마지막 enrichment 대상 JSON 키 — 중복 API 호출 방지 */
const lunchMenuImageFetchJsonKeyByLogId = new Map<string, string>()

/** 동일 logId·jsonKey 동시 요청 병합 */
const lunchMenuImageEnrichmentInflight = new Map<string, Promise<LunchRecommendationItem[] | null>>()

/** 썸네일 `<img src>` */
export const getLunchThumbDisplaySrc = (imageUrl: string | undefined | null): string =>
  normalizeLunchMenuImageUrl(imageUrl) ?? ''

/**
 * DOM 반영 전 브라우저에 썸네일 선적재
 * → 갱신 시점에 이미 디코딩되어 레이아웃 재계산 없이 표시 (fetchAndInjectPexelsImages 와 동일)
 */
export const preloadLunchMenuThumbImages = async (items: LunchRecommendationItem[]): Promise<void> => {
  if (typeof window === 'undefined') return
  const urls = [...new Set(items.map((row) => getLunchThumbDisplaySrc(row.imageUrl)).filter((src) => src.length > 0))]
  if (!urls.length) return
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const el = new window.Image()
          el.onload = () => resolve()
          el.onerror = () => resolve()
          el.src = src
        }),
    ),
  )
}

/**
 * JSON imageUrl placeholder가 있으면 썸네일 API 조회
 * - 캐시 히트(동일 jsonKey) → 캐시 반환
 */
export const resolveLunchMenuImageEnrichment = async (
  logId: string,
  rContent: string,
  items: LunchRecommendationItem[],
): Promise<LunchRecommendationItem[] | null> => {
  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId || !items.length) return null

  const fromCache = tryGetLunchMenuImageEnrichmentFromCache(trimmedLogId, rContent, items)
  if (fromCache) return fromCache

  if (!shouldFetchLunchMenuImages(items)) {
    return items
  }

  const jsonKey = lunchRecommendationsJsonKey(rContent)
  const inflightKey = jsonKey ? `json::${jsonKey}` : `${trimmedLogId}::${jsonKey}`
  const existing = lunchMenuImageEnrichmentInflight.get(inflightKey)
  if (existing) return existing

  const promise = (async () => {
    const enriched = await fetchLunchMenuImagesForRecommendations(items)
    if (!enriched) return null
    if (!shouldFetchLunchMenuImages(enriched)) {
      setLunchMenuImageEnrichedCache(trimmedLogId, enriched)
      lunchMenuImageFetchJsonKeyByLogId.set(trimmedLogId, jsonKey)
    }
    return enriched
  })()

  lunchMenuImageEnrichmentInflight.set(inflightKey, promise)
  try {
    return await promise
  } finally {
    lunchMenuImageEnrichmentInflight.delete(inflightKey)
  }
}

/** result lunch 메시지에 썸네일 URL 반영 (스트리밍 완료·히스토리 로드 공통) */
export const applyLunchMenuImageEnrichmentToResultMessage = async (
  resultMsg: ChatMessage,
  rContent: string,
): Promise<void> => {
  if (resultMsg.type !== 'lunch' || resultMsg.lunchCardRole === 'form') return

  const cacheKey = getLunchImageEnrichmentCacheKey(resultMsg)
  if (!cacheKey) return

  const parsed = parseLunchJsonArray(rContent)
  const items =
    Array.isArray(resultMsg.lunchDisplayRecommendations) && resultMsg.lunchDisplayRecommendations.length > 0
      ? mergeLunchRecommendationsPreservingImages(parsed, resultMsg.lunchDisplayRecommendations)
      : parsed
  if (!items.length) return

  const enriched = await resolveLunchMenuImageEnrichment(cacheKey, rContent, items)
  if (enriched?.length) resultMsg.lunchDisplayRecommendations = enriched
}

const pickDataImageUrlFromApi = (raw: string): string | null => {
  const v = String(raw ?? '').trim()
  return isLunchMenuDataImageUrl(v) ? v : null
}

/** getLunchMenuImageData.do — imageUrl은 data:image/...;base64,... */
const resolveImageUrlFromLunchMenuApiResponse = (data: unknown): string | null => {
  if (data == null) return null
  if (typeof data === 'string') {
    const fromRaw = pickDataImageUrlFromApi(data)
    if (fromRaw) return fromRaw
    try {
      return resolveImageUrlFromLunchMenuApiResponse(JSON.parse(data.trim()) as unknown)
    } catch {
      return null
    }
  }
  if (typeof data !== 'object') return null

  const d = data as Record<string, unknown>
  if (d.successYn === false) return null

  const directUrl = String(d.imageUrl ?? d.url ?? d.imgUrl ?? '').trim()
  const fromDirect = pickDataImageUrlFromApi(directUrl)
  if (fromDirect) return fromDirect

  const nested = d.result ?? d.data
  if (typeof nested === 'string' && nested.trim()) {
    const fromNested = resolveImageUrlFromLunchMenuApiResponse(nested)
    if (fromNested) return fromNested
  }
  if (nested != null && typeof nested === 'object') {
    const fromNestedObj = resolveImageUrlFromLunchMenuApiResponse(nested)
    if (fromNestedObj) return fromNestedObj
  }

  const items = d.items ?? d.list
  if (!Array.isArray(items) || items.length === 0) return null
  const first = items[0]
  if (typeof first === 'string') return pickDataImageUrlFromApi(first)
  if (first != null && typeof first === 'object') {
    const row = first as Record<string, unknown>
    return pickDataImageUrlFromApi(String(row.imageUrl ?? row.url ?? row.imgUrl ?? ''))
  }
  return null
}

/** getLunchMenuImageData.do 다건 병렬 호출 시 UI 스피너 */
const lunchMenuImageApiInflight = ref(0)
export const isLunchMenuImageApiLoading = computed(() => lunchMenuImageApiInflight.value > 0)

/**
 * 추천 행마다 menu로 getLunchMenuImageData.do 호출
 * - 요청: `{ prompt: "<menu>" }` (getPsychologyChartData.do와 동일 키)
 */
export const fetchLunchMenuImagesForRecommendations = async (
  items: LunchRecommendationItem[],
): Promise<LunchRecommendationItem[] | null> => {
  if (!items.length) return null
  lunchMenuImageApiInflight.value += 1
  try {
    const { post } = useApi()

    const settled = await Promise.allSettled(
      items.map(async (row) => {
        const menu = String(row.menu ?? '').trim()
        if (!menu) return row
        if (!isLunchMenuImagePlaceholderUrl(row.imageUrl)) return row

        const data = await post<Record<string, unknown>>('/ai/chatbot/getLunchMenuImageData.do', {
          prompt: menu,
        })
        const url = resolveImageUrlFromLunchMenuApiResponse(data)
        return url ? { ...row, imageUrl: url } : row
      }),
    )

    return items.map((row, i) => {
      const s = settled[i]
      if (s.status === 'fulfilled') return s.value
      return row
    })
  } catch {
    return null
  } finally {
    lunchMenuImageApiInflight.value = Math.max(0, lunchMenuImageApiInflight.value - 1)
  }
}

/** 썸네일 enrichment 캐시 — answer logId 변경 시 이전 키에서 새 키로 이전 */
const migrateLunchMenuImageCacheForAnswerLogId = (oldLogId: string, newLogId: string): void => {
  const oldId = String(oldLogId ?? '').trim()
  const newId = String(newLogId ?? '').trim()
  if (!oldId || !newId || oldId === newId) return

  const oldKeys = [oldId, `${oldId}-lunch-result`]
  for (const oldKey of oldKeys) {
    const cached = lunchMenuImageEnrichedCache.get(oldKey)
    if (cached && !lunchMenuImageEnrichedCache.has(newId)) {
      lunchMenuImageEnrichedCache.set(newId, cached)
    }
    const fetchedJsonKey = lunchMenuImageFetchJsonKeyByLogId.get(oldKey)
    if (fetchedJsonKey && !lunchMenuImageFetchJsonKeyByLogId.has(newId)) {
      lunchMenuImageFetchJsonKeyByLogId.set(newId, fetchedJsonKey)
    }
    lunchMenuImageEnrichedCache.delete(oldKey)
    lunchMenuImageFetchJsonKeyByLogId.delete(oldKey)
  }
}

export const buildLunchRecommendationPrompt = (payload: LunchAgentFormPayload): string => {
  const location = `${payload.sido} ${payload.sigungu} ${payload.dong}`.trim()
  return `현재 위치는 ${location}, ${payload.mood} 먹고싶고, 예산은 1인당 ${payload.budget}, 식사 인원은 ${payload.peopleCount}, 선호하는 음식종류는 ${payload.cuisineType}입니다. 점심 메뉴를 추천해줘.`
}

/** 점심 추천 프롬프트에서 폼 payload를 역추출 (로그 재구성용) */
export const parseLunchPayloadFromPrompt = (promptText: string): LunchAgentFormPayload | null => {
  const raw = String(promptText ?? '').trim()
  if (!raw) return null
  const match = raw.match(
    /^현재 위치는\s+(.+?)\s+(.+?)\s+(.+?),\s+(.+?)\s+먹고싶고,\s+예산은 1인당\s+(.+?),\s+식사 인원은\s+(.+?),\s+선호하는 음식종류는\s+(.+?)입니다\.\s*점심 메뉴를 추천해줘\.$/u,
  )
  if (!match) return null
  const [, sido, sigungu, dong, mood, budget, peopleCount, cuisineType] = match
  const payload: LunchAgentFormPayload = {
    sido: String(sido ?? '').trim(),
    sigungu: String(sigungu ?? '').trim(),
    dong: String(dong ?? '').trim(),
    mood: String(mood ?? '').trim(),
    budget: String(budget ?? '').trim(),
    peopleCount: String(peopleCount ?? '').trim(),
    cuisineType: String(cuisineType ?? '').trim(),
  }
  return payload.sido && payload.sigungu && payload.dong ? payload : null
}

/** WebSocket complete 시 서버 logId로 answer·lunch result 카드 연결 갱신 */
export const migrateLunchMessagesForAnswerLogId = (
  messages: ChatMessage[],
  oldLogId: string,
  newLogId: string,
): void => {
  const oldId = String(oldLogId ?? '').trim()
  const newId = String(newLogId ?? '').trim()
  if (!oldId || !newId || oldId === newId) return

  for (const m of messages) {
    if (m.type !== 'lunch') continue
    if (m.lunchAnswerLogId === oldId) m.lunchAnswerLogId = newId
    if (m.logId === `${oldId}-lunch-result`) m.logId = `${newId}-lunch-result`
  }

  migrateLunchMenuImageCacheForAnswerLogId(oldId, newId)
}

/** answer rContent → 연결된 result 카드 lunchDisplayRecommendations 반영 */
export const syncLunchResultRecommendationsFromAnswer = (messages: ChatMessage[], answerMessage: ChatMessage): void => {
  if (answerMessage.type !== 'answer') return
  if (String(answerMessage.agentId ?? '').trim() !== LUNCH_AGENT_ID) return

  const rContent = String(answerMessage.rContent ?? '')
  const items = normalizeLunchRecommendationImages(parseLunchJsonArray(rContent))
  if (!items.length) return

  const resultMsg = findLunchResultMessageForAnswer(messages, answerMessage.logId)
  if (!resultMsg) return

  const nextKey = lunchRecommendationsJsonKey(rContent)
  const prevKey = lunchRecommendationsJsonKey(JSON.stringify(resultMsg.lunchDisplayRecommendations ?? []))
  if (nextKey === prevKey && (resultMsg.lunchDisplayRecommendations?.length ?? 0) > 0) return

  resultMsg.lunchDisplayRecommendations = mergeLunchRecommendationsPreservingImages(
    items,
    resultMsg.lunchDisplayRecommendations,
  )
}

/** result lunch 카드에 연결된 answer 메시지 (재질문 시 마지막 answer 우선) */
export const findLinkedLunchAnswerMessage = (
  messages: ChatMessage[],
  lunchMessage: ChatMessage,
): ChatMessage | undefined => {
  if (lunchMessage.type !== 'lunch' || lunchMessage.lunchCardRole === 'form') return undefined

  const answerLogId = String(lunchMessage.lunchAnswerLogId ?? '').trim()
  if (answerLogId) {
    const linked = messages.find((m) => m.type === 'answer' && m.logId === answerLogId)
    if (linked) return linked
  }

  const lunchIndex = messages.findIndex((m) => m.logId === lunchMessage.logId)
  if (lunchIndex < 0) return undefined

  const lunchAnswers = messages
    .slice(lunchIndex + 1)
    .filter((m) => m.type === 'answer' && String(m.agentId ?? '').trim() === LUNCH_AGENT_ID)
  return lunchAnswers[lunchAnswers.length - 1]
}

/** answer logId에 연결된 점심 추천(result) 카드 */
export const findLunchResultMessageForAnswer = (
  messages: ChatMessage[],
  answerLogId: string,
): ChatMessage | undefined => {
  const id = String(answerLogId ?? '').trim()
  if (!id) return undefined

  const byLink = messages.find(
    (m) =>
      m.type === 'lunch' &&
      m.lunchCardRole === 'result' &&
      (m.logId === `${id}-lunch-result` || m.lunchAnswerLogId === id),
  )
  if (byLink) return byLink

  /** 구 로그: 단일 lunch-card + lunchAnswerLogId */
  const legacy = messages.find(
    (m) => m.type === 'lunch' && (m.logId === `${id}-lunch-card` || m.lunchAnswerLogId === id),
  )
  if (legacy) return legacy

  const answerIndex = messages.findIndex((m) => m.type === 'answer' && m.logId === id)
  if (answerIndex < 0) return undefined
  for (let i = answerIndex - 1; i >= 0; i--) {
    const candidate = messages[i]
    if (candidate?.type === 'lunch' && candidate.lunchCardRole === 'result') return candidate
  }
  return undefined
}

export const createLunchResultCardMessage = (options: {
  answerLogId: string
  createdAt?: string
  svcTy?: string
  refId?: string
  agentId?: string
  lunchDisplayRecommendations?: LunchRecommendationItem[]
}): ChatMessage => ({
  logId: `${options.answerLogId}-lunch-result`,
  type: 'lunch',
  lunchCardRole: 'result',
  qContent: '',
  rContent: '',
  createdAt: options.createdAt ?? new Date().toISOString(),
  svcTy: options.svcTy ?? 'C',
  refId: options.refId ?? '',
  agentId: options.agentId ?? LUNCH_AGENT_ID,
  isStreaming: false,
  hasSource: false,
  hasVisualization: false,
  lunchSubmitted: true,
  lunchAnswerLogId: options.answerLogId,
  ...(options.lunchDisplayRecommendations?.length
    ? { lunchDisplayRecommendations: options.lunchDisplayRecommendations }
    : {}),
})

export const createLunchCardMessage = (options?: {
  createdAt?: string
  svcTy?: string
  refId?: string
  agentId?: string
}): ChatMessage => ({
  logId: `lunch-card-${Date.now()}`,
  type: 'lunch',
  qContent: '',
  rContent: '',
  createdAt: options?.createdAt ?? new Date().toISOString(),
  svcTy: options?.svcTy ?? 'C',
  refId: options?.refId ?? '',
  agentId: options?.agentId ?? '',
  isStreaming: false,
  hasSource: false,
  hasVisualization: false,
  lunchSubmitted: false,
})

// ============================================================
// 모듈 스코프 반응형 상태
// ============================================================
const isLunchVisible = ref(false)

export const useLunchAgent = () => {
  const openLunchAgent = () => {
    isLunchVisible.value = true
  }

  const closeLunchAgent = () => {
    isLunchVisible.value = false
  }

  return {
    isLunchVisible,
    openLunchAgent,
    closeLunchAgent,
  }
}

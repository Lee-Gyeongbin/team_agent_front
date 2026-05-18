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

// ── [음식이미지] 플레이스홀더 (JSON imageUrl) ──

/** LLM이 imageUrl 필드에 넣는 플레이스홀더 패턴 */
const LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX = /^\[?음식이미지\]?$/u

const isLikelyImageResourceUrl = (url: string): boolean => {
  const v = String(url ?? '').trim()
  if (!v || LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX.test(v)) return false
  return /^https?:\/\//i.test(v) || v.startsWith('data:image') || v.startsWith('/')
}

export const isLunchMenuImagePlaceholderUrl = (imageUrl: string | undefined | null): boolean => {
  const v = String(imageUrl ?? '').trim()
  if (!v) return true
  if (isLikelyImageResourceUrl(v)) return false
  if (LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX.test(v)) return true
  return true
}

/** JSON 각 행에 유효한 imageUrl이 없는지 */
export const hasLunchMenuImagePlaceholderInItems = (items: LunchRecommendationItem[]): boolean =>
  items.some((row) => String(row.menu ?? '').trim() && isLunchMenuImagePlaceholderUrl(row.imageUrl))

/** 썸네일 API 호출 조건 — 유효 URL이 없는 행이 하나라도 있으면 조회 */
export const shouldFetchLunchMenuImages = (items: LunchRecommendationItem[]): boolean =>
  hasLunchMenuImagePlaceholderInItems(items)

/** LLM 응답에서 JSON 배열 구간만 추출 (마크다운 코드펜스·앞뒤 설명문 허용) */
const extractLunchJsonSource = (raw: string): string => {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch?.[1]) return fenceMatch[1].trim()
  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
  return trimmed
}

/** 답변 본문 JSON 배열 — LLM은 JSON 배열(또는 코드펜스 래핑) 반환 */
const parseLunchJsonArray = (jsonSource: string): LunchRecommendationItem[] => {
  const raw = extractLunchJsonSource(jsonSource)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as LunchRecommendationItem[]) : []
  } catch {
    return []
  }
}

/** 답변 본문 JSON 배열 — 점심 추천 결과 (로그 재구성·메시지 주입용) */
export const parseLunchRecommendationsFromAnswerRContent = (rContent: string): LunchRecommendationItem[] =>
  parseLunchJsonArray(rContent)

/** menu는 있는데 유효 imageUrl이 없는 행이 하나라도 있으면 API enrichment 필요 */
export const needsLunchMenuImageApiEnrichment = (items: LunchRecommendationItem[]): boolean =>
  hasLunchMenuImagePlaceholderInItems(items)

/** 동일 추천 JSON인지 비교 — 스트리밍 완료 후 본문 변경 감지·중복 fetch 방지용 */
export const lunchRecommendationsJsonKey = (rContent: string): string => {
  const items = parseLunchRecommendationsFromAnswerRContent(rContent)
  return items.length > 0 ? JSON.stringify(items) : ''
}

// ── 점심 썸네일 결과 캐시 (logId) — 방사형 차트 캐시와 동일 용도 ─────────────────────

const lunchMenuImageEnrichedCache = new Map<string, LunchRecommendationItem[]>()

export const getLunchMenuImageEnrichedCache = (logId: string): LunchRecommendationItem[] | null =>
  lunchMenuImageEnrichedCache.get(logId) ?? null

export const setLunchMenuImageEnrichedCache = (logId: string, rows: LunchRecommendationItem[]): void => {
  lunchMenuImageEnrichedCache.set(logId, rows)
}

/** logId별 마지막 enrichment 대상 JSON 키 — 중복 API 호출 방지 */
const lunchMenuImageFetchJsonKeyByLogId = new Map<string, string>()

/** 동일 logId·jsonKey 동시 요청 병합 (answer·lunch 카드 이중 마운트) */
const lunchMenuImageEnrichmentInflight = new Map<string, Promise<LunchRecommendationItem[] | null>>()

/**
 * JSON imageUrl 플레이스홀더가 있으면 썸네일 API 조회
 * - 캐시 히트(동일 jsonKey) → 캐시 반환
 */
export const resolveLunchMenuImageEnrichment = async (
  logId: string,
  rContent: string,
  items: LunchRecommendationItem[],
): Promise<LunchRecommendationItem[] | null> => {
  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId || !items.length) return null

  if (!shouldFetchLunchMenuImages(items)) return null

  const jsonKey = lunchRecommendationsJsonKey(rContent)
  const cached = getLunchMenuImageEnrichedCache(trimmedLogId)
  if (cached && lunchMenuImageFetchJsonKeyByLogId.get(trimmedLogId) === jsonKey) {
    return cached
  }

  const inflightKey = `${trimmedLogId}::${jsonKey}`
  const existing = lunchMenuImageEnrichmentInflight.get(inflightKey)
  if (existing) return existing

  const promise = (async () => {
    const enriched = await fetchLunchMenuImagesForRecommendations(items)
    if (!enriched) return null
    // API 실패·URL 미반환 시 빈 캐시를 남기면 이후 호출이 영구 스킵됨
    if (!needsLunchMenuImageApiEnrichment(enriched)) {
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

  const items =
    Array.isArray(resultMsg.lunchDisplayRecommendations) && resultMsg.lunchDisplayRecommendations.length > 0
      ? resultMsg.lunchDisplayRecommendations
      : parseLunchRecommendationsFromAnswerRContent(rContent)
  if (!items.length) return

  const enriched = await resolveLunchMenuImageEnrichment(resultMsg.logId, rContent, items)
  if (enriched?.length) resultMsg.lunchDisplayRecommendations = enriched
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

/** getLunchMenuImageData.do — { successYn, items: [{ imageUrl, menu }] } 등 다양한 스키마 */
const resolveImageUrlFromLunchMenuApiResponse = (data: unknown): string | null => {
  if (data == null) return null
  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (isLikelyImageResourceUrl(trimmed)) return trimmed
    try {
      return resolveImageUrlFromLunchMenuApiResponse(JSON.parse(trimmed) as unknown)
    } catch {
      return null
    }
  }
  if (typeof data !== 'object') return null

  const d = data as Record<string, unknown>
  if (d.successYn === false) return null

  const directUrl = String(d.imageUrl ?? d.url ?? d.imgUrl ?? '').trim()
  if (isLikelyImageResourceUrl(directUrl)) return directUrl

  const nested = d.result ?? d.data ?? d.chartData
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
  if (typeof first === 'string' && isLikelyImageResourceUrl(first)) return first
  if (first != null && typeof first === 'object') {
    const row = first as Record<string, unknown>
    const imageUrl = String(row.imageUrl ?? row.url ?? row.imgUrl ?? '').trim()
    if (isLikelyImageResourceUrl(imageUrl)) return imageUrl
  }
  return null
}

/** getLunchMenuImageData.do 다건 병렬 호출 시 UI 스피너 — ChatLunchAgentCard에서 사용 */
const lunchMenuImageApiInflight = ref(0)
export const isLunchMenuImageApiLoading = computed(() => lunchMenuImageApiInflight.value > 0)

/**
 * 추천 행마다 음식 이름(menu)을 하나씩 API로 보내 imageUrl 조회
 * - 백엔드: /ai/chatbot/getLunchMenuImageData.do (엔드포인트·스키마는 백엔드와 맞출 것)
 * - 요청 본문: 행마다 `{ prompt: "<해당 카드의 menu>" }` (getPsychologyChartData.do와 동일 키)
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

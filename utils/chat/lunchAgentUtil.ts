import { ref } from 'vue'
import { useApi } from '~/composables/com/useApi'
import type { LunchRecommendationItem, RegionLocationMap } from '~/types/chat'

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

/** 지역 트리 응답(data)을 RECOMMEND 카드 위치 셀렉트 맵으로 정규화 */
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

// ── [음식이미지] placeholder (JSON) → getLunchMenuImageData.do ──

/** LLM이 imageUrl 필드에 넣는 플레이스홀더 패턴 */
const LUNCH_FOOD_IMAGE_PLACEHOLDER_TEXT_REGEX = /^\[?음식이미지\]?$/u

/** API·캐시 imageUrl — 항상 data:image/...;base64,... 형식 */
const isLunchMenuDataImageUrl = (url: string): boolean => {
  const v = String(url ?? '').trim()
  return v.length > 0 && v.startsWith('data:image')
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

// ── 점심 썸네일 결과 캐시 (logId) ─────────────────────

const lunchMenuImageEnrichedCache = new Map<string, LunchRecommendationItem[]>()

export const getLunchMenuImageEnrichedCache = (logId: string): LunchRecommendationItem[] | null =>
  lunchMenuImageEnrichedCache.get(logId) ?? null

export const setLunchMenuImageEnrichedCache = (logId: string, rows: LunchRecommendationItem[]): void => {
  lunchMenuImageEnrichedCache.set(logId, rows)
}

/** logId별 마지막 enrichment 대상 JSON 키 — 중복 API 호출 방지 */
const lunchMenuImageFetchJsonKeyByLogId = new Map<string, string>()

/** 동일 logId·jsonKey 동시 요청 병합 */
const lunchMenuImageEnrichmentInflight = new Map<string, Promise<LunchRecommendationItem[] | null>>()

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

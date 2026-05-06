import type { ChatMessage, LunchAgentFormPayload, RegionLocationMap } from '~/types/chat'

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

export const createLunchCardMessage = (options?: {
  createdAt?: string
  svcTy?: string
  refId?: string
  agentId?: string
}): ChatMessage => ({
  logId: `lunch-card-${Date.now()}`,
  type: 'answer',
  qContent: '',
  rContent: '',
  createdAt: options?.createdAt ?? new Date().toISOString(),
  svcTy: options?.svcTy ?? 'C',
  refId: options?.refId ?? '',
  agentId: options?.agentId ?? '',
  isStreaming: false,
  hasSource: false,
  hasVisualization: false,
  uiType: 'lunch-card',
  lunchSubmitted: false,
})

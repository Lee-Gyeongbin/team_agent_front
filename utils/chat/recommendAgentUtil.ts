import type { Agent, RecommendAgentConfig } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'
import type {
  ChatLogListRow,
  ChatMessage,
  LunchRecommendationItem,
  RecommendFormPayload,
  RecommendResultItem,
} from '~/types/chat'
import {
  getLunchGeolocationCoords,
  resolveLunchMenuImageEnrichment,
  tryGetLunchMenuImageEnrichmentFromCache,
} from '~/utils/chat/lunchAgentUtil'

// ━━━ 상수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const RECOMMEND_SUB_TY = 'RECOMMEND'

// ━━━ 에이전트 판별 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** svcTy=C · USE_YN=Y · subTy=RECOMMEND — 채팅 에이전트 선택·전송용 */
export const isRecommendAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === RECOMMEND_SUB_TY
}

/** svcTy=C · subTy=RECOMMEND — 지식창고 상세·카드 UI용 (useYn 무관, isSurveyAgent와 동일) */
export const isRecommendAgentForLibrary = (agent: Pick<Agent, 'svcTy' | 'subCfg'> | null | undefined): boolean => {
  if (!agent || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === RECOMMEND_SUB_TY
}

/** 일반 채팅 전송용 agentId — RECOMMEND 에이전트 선택 상태는 빈 문자열로 정규화 */
export const resolveNormalChatAgentId = (selectedAgentId: string | null | undefined, agents: Agent[]): string => {
  const id = String(selectedAgentId ?? '').trim()
  if (!id) return ''
  const agent = agents.find((a) => a.agentId === id)
  if (agent && isRecommendAgent(agent)) return ''
  return id
}

// ━━━ Config 파서 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parseRecommendConfigCore = (agent: Agent): RecommendAgentConfig | null => {
  const raw = agent.subCfg?.additionalConfig
  if (!raw) return null
  const config = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (config?.agentType !== 'recommend') return null
  return config as RecommendAgentConfig
}

export const parseRecommendConfigFromAgent = (agent: Agent): RecommendAgentConfig | null => {
  if (!isRecommendAgent(agent)) return null
  return parseRecommendConfigCore(agent)
}

/** 지식창고 — selectAgentListForLibrary 에이전트는 useYn과 무관하게 폼·결과 카드 재현 */
export const parseRecommendConfigFromAgentForLibrary = (agent: Agent): RecommendAgentConfig | null => {
  if (!isRecommendAgentForLibrary(agent)) return null
  return parseRecommendConfigCore(agent)
}

export const resolveRecommendConfigByAgentId = (agentId: string, agents: Agent[]): RecommendAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseRecommendConfigFromAgent(agent)
}

export const resolveRecommendConfigByAgentIdForLibrary = (
  agentId: string,
  agents: Agent[],
): RecommendAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseRecommendConfigFromAgentForLibrary(agent)
}

/** 라이브러리 카드 — RECOMMEND readonly UI 표시 여부 (에이전트 미로드 시 qcontent 폴백) */
export const isRecommendLibraryCardItem = (item: { agentId?: string; qcontent?: string }, agents: Agent[]): boolean => {
  const qcontent = item.qcontent ?? ''
  if (!isRecommendAgentPrompt(qcontent)) return false
  const agentId = (item.agentId ?? '').trim()
  if (agentId) {
    const agent = agents.find((a) => a.agentId === agentId)
    if (agent) return isRecommendAgentForLibrary(agent)
  }
  return true
}

// ━━━ 폼 초기값 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const createEmptyRecommendFormPayload = (config: RecommendAgentConfig): RecommendFormPayload => {
  const base: RecommendFormPayload = {}
  if (config.form.useRegionSelect) {
    base['sido'] = ''
    base['sigungu'] = ''
    base['dong'] = ''
  }
  for (const field of config.form.fields) {
    base[field.key] = ''
  }
  return base
}

// ━━━ 프롬프트 빌더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const buildRecommendPrompt = (formValues: RecommendFormPayload, config: RecommendAgentConfig): string => {
  const lines: string[] = []

  lines.push(`당신은 ${config.agent.persona}입니다.`)
  lines.push(`임무: ${config.agent.mission}`)
  lines.push('')
  lines.push('## 사용자 조건')

  if (config.form.useRegionSelect) {
    const location = ['sido', 'sigungu', 'dong']
      .map((k) => formValues[k] ?? '')
      .filter(Boolean)
      .join(' ')
    if (location) lines.push(`- 위치: ${location}`)
  }

  for (const field of config.form.fields) {
    const value = formValues[field.key]
    if (value && value !== '상관없음') {
      const labelBase = field.label
        .replace(/\?.*$/, '')
        .replace(/[은는이가]/g, '')
        .trim()
      lines.push(`- ${labelBase}: ${value}`)
    }
  }
  lines.push('')

  if (config.engine?.outputSchema?.type === 'json_array') {
    const itemFields = config.engine.outputSchema.itemFields
    const schemaExample = Object.fromEntries(itemFields.map((f) => [f, '']))
    lines.push('## 출력 형식')
    lines.push(`JSON 배열만 응답. 코드블록·마크다운·설명 텍스트 금지. 최대 ${config.result.topN}개.`)
    lines.push(JSON.stringify([schemaExample], null, 2))
    lines.push('')
  }

  if (config.constraints.length > 0) {
    lines.push('## 제약')
    config.constraints.forEach((c) => lines.push(`- ${c}`))
  }

  return lines.join('\n')
}

// ━━━ 프롬프트 역파싱 (히스토리 재현용) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const parseRecommendPayloadFromPrompt = (
  promptText: string,
  config: RecommendAgentConfig,
): RecommendFormPayload => {
  const result: RecommendFormPayload = {}
  const conditionBlock = promptText.match(/## 사용자 조건\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? ''
  const lines = conditionBlock.split('\n').filter((l) => l.startsWith('- '))

  if (config.form.useRegionSelect) {
    const locationLine = lines.find((l) => l.startsWith('- 위치:'))
    if (locationLine) {
      const parts = locationLine.replace('- 위치:', '').trim().split(' ')
      result['sido'] = parts[0] ?? ''
      result['sigungu'] = parts[1] ?? ''
      result['dong'] = parts[2] ?? ''
    }
  }

  for (const field of config.form.fields) {
    const labelBase = field.label
      .replace(/\?.*$/, '')
      .replace(/[은는이가]/g, '')
      .trim()
    const line = lines.find((l) => l.includes(`${labelBase}:`))
    if (line) {
      result[field.key] = line.split(':').slice(1).join(':').trim()
    }
  }

  return result
}

/** RECOMMEND 에이전트 진단 프롬프트 여부 (채팅 로그 재구성용) */
export const isRecommendAgentPrompt = (promptText: string): boolean => {
  const raw = String(promptText ?? '').trim()
  if (!raw) return false
  return (
    raw.includes('## 사용자 조건') &&
    (raw.includes('## 출력 형식') || raw.includes('JSON 배열만 응답') || raw.includes('## 제약'))
  )
}

// ━━━ JSON 파싱 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** LLM 응답에서 JSON 배열 구간 추출 (코드블록·앞뒤 설명 텍스트 제거) */
const extractRecommendJsonArrayText = (rContent: string): string => {
  const raw = String(rContent ?? '').trim()
  if (!raw) return ''
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  const source = fenced || raw
  const complete = source.match(/\[[\s\S]*\]/)
  if (complete) return complete[0].trim()
  // 스트리밍 중 — `[` 는 있으나 `]` 미수신
  const start = source.indexOf('[')
  if (start >= 0) return source.slice(start).trim()
  return ''
}

/**
 * LLM이 `"url": "` 처럼 닫히지 않은 문자열을 출력하는 경우 보정
 * → `"url": ""` 형태로 치환
 */
const repairMalformedRecommendJson = (jsonText: string): string => {
  let text = jsonText
  // `"key": "` + 줄바꿈 + `"nextKey"`
  text = text.replace(/"(\w+)":\s*"\s*\r?\n(\s*)"(\w+)"/g, '"$1": "",\n$2"$3"')
  // `"key": "` + 줄바꿈 + `},` — 객체 내 마지막 필드
  text = text.replace(/"(\w+)":\s*"\s*\r?\n(\s*)\},/g, '"$1": "",\n$2},')
  // `"key": "` + 줄바꿈 + `}` — 배열 내 마지막 객체
  text = text.replace(/"(\w+)":\s*"\s*\r?\n(\s*)\}/g, '"$1": ""\n$2}')
  // `"key": "` + (줄바꿈) + `}` / `},` — 줄바꿈 없이 이어지는 경우
  text = text.replace(/"(\w+)":\s*"(\s*)\},/g, '"$1": ""$2},')
  text = text.replace(/"(\w+)":\s*"(\s*)\}/g, '"$1": ""$2}')
  // 스트리밍 중 필드 값 미완성 — 문자열 끝
  text = text.replace(/"(\w+)":\s*"$/gm, '"$1": ""')
  // trailing comma before ] or }
  text = text.replace(/,\s*([\]}])/g, '$1')
  return text
}

const buildRecommendJsonParseCandidates = (jsonText: string): string[] => {
  const trimmed = jsonText.trim()
  if (!trimmed) return []
  const candidates = [trimmed, repairMalformedRecommendJson(trimmed)]
  if (trimmed.startsWith('[') && !trimmed.endsWith(']')) {
    candidates.push(repairMalformedRecommendJson(`${trimmed}\n]`))
  }
  return [...new Set(candidates)]
}

/** 배열 파싱 실패 시 객체 블록 단위 폴백 파싱 (스트리밍 중 완성된 `{...}` 만 추출) */
const parseRecommendJsonObjectBlocks = (jsonText: string): RecommendResultItem[] => {
  const fromRegex = (): RecommendResultItem[] => {
    const blocks = jsonText.match(/\{[^{}]*\}/g) ?? []
    const items: RecommendResultItem[] = []
    for (const block of blocks) {
      const repaired = repairMalformedRecommendJson(block)
      try {
        const parsed = JSON.parse(repaired) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue
        items.push(parsed as RecommendResultItem)
      } catch {
        /* skip malformed block */
      }
    }
    return items
  }

  const fromBraceScan = (): RecommendResultItem[] => {
    const items: RecommendResultItem[] = []
    let depth = 0
    let start = -1
    let inString = false
    let escaped = false

    for (let i = 0; i < jsonText.length; i += 1) {
      const ch = jsonText[i]
      if (inString) {
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\') {
          escaped = true
          continue
        }
        if (ch === '"') inString = false
        continue
      }

      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') {
        if (depth === 0) start = i
        depth += 1
        continue
      }
      if (ch === '}' && depth > 0) {
        depth -= 1
        if (depth === 0 && start >= 0) {
          const block = jsonText.slice(start, i + 1)
          const repaired = repairMalformedRecommendJson(block)
          try {
            const parsed = JSON.parse(repaired) as unknown
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              items.push(parsed as RecommendResultItem)
            }
          } catch {
            /* skip malformed block */
          }
          start = -1
        }
      }
    }
    return items
  }

  const scanned = fromBraceScan()
  if (scanned.length > 0) return scanned
  return fromRegex()
}

const parseRecommendJsonArrayInternal = (jsonText: string): RecommendResultItem[] => {
  if (!jsonText) return []
  for (const candidate of buildRecommendJsonParseCandidates(jsonText)) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!Array.isArray(parsed)) continue
      return parsed.filter(
        (item): item is RecommendResultItem => item && typeof item === 'object' && !Array.isArray(item),
      )
    } catch {
      /* try next */
    }
  }
  return parseRecommendJsonObjectBlocks(jsonText)
}

export const parseRecommendJsonArray = (rContent: string): RecommendResultItem[] => {
  const arrayText = extractRecommendJsonArrayText(rContent)
  if (!arrayText) return []
  return parseRecommendJsonArrayInternal(arrayText)
}

export const isMusicRecommendResultItem = (item: RecommendResultItem): boolean => {
  const title = String(item.title ?? '').trim()
  const artist = String(item.artist ?? '').trim()
  const menu = String(item.menu ?? '').trim()
  return Boolean(title && artist && !menu)
}

/** 음악 추천 — title + artist 로 YouTube 검색 URL 생성 */
export const buildRecommendYoutubeSearchUrl = (title: string, artist: string): string => {
  const query = [title, artist]
    .map((s) => String(s ?? '').trim())
    .filter(Boolean)
    .join(' ')
  if (!query) return ''
  return `https://www.youtube.com/results?search_query=${query.replace(/\s+/g, '+')}`
}

/** 결과 항목 링크 필드 URL — 음악은 LLM url 무시, YouTube 검색 URL 사용 */
export const resolveRecommendItemLinkUrl = (item: RecommendResultItem, fieldKey: string): string => {
  if (fieldKey === 'url' && isMusicRecommendResultItem(item)) {
    return buildRecommendYoutubeSearchUrl(String(item.title ?? ''), String(item.artist ?? ''))
  }
  return String(item[fieldKey] ?? '').trim()
}

/** 링크 표시 텍스트 — 음악 YouTube 검색은 곡명·아티스트로 표시 */
export const getRecommendLinkDisplayLabel = (item: RecommendResultItem, fieldKey: string, href: string): string => {
  if (fieldKey === 'url' && isMusicRecommendResultItem(item) && href) {
    const title = String(item.title ?? '').trim()
    const artist = String(item.artist ?? '').trim()
    if (title && artist) return `${title} · ${artist}`
    return 'YouTube에서 검색'
  }
  return href
}

export const normalizeRecommendResultItems = (items: RecommendResultItem[]): RecommendResultItem[] =>
  items.map((item) => {
    const normalized: RecommendResultItem = {
      ...item,
      imageUrl: item.imageUrl ?? '',
    }
    if (isMusicRecommendResultItem(item)) {
      const youtubeUrl = buildRecommendYoutubeSearchUrl(String(item.title ?? ''), String(item.artist ?? ''))
      if (youtubeUrl) normalized.url = youtubeUrl
    }
    return normalized
  })

// ━━━ 이미지 enrichment ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { getLunchGeolocationCoords as getRecommendGeolocationCoords }

const RECOMMEND_FOOD_IMAGE_PLACEHOLDER_REGEX = /^\[?음식이미지\]?$/u
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search'

/** RECOMMEND 카드 썸네일 — data URL·https 는 유효, 빈 값·음식 placeholder만 대상 */
export const isRecommendImagePlaceholderUrl = (imageUrl: string | undefined | null): boolean => {
  const v = String(imageUrl ?? '').trim()
  if (!v) return true
  if (v.startsWith('data:image')) return false
  if (/^https?:\/\//i.test(v)) return false
  if (RECOMMEND_FOOD_IMAGE_PLACEHOLDER_REGEX.test(v)) return true
  return true
}

/** `<img src>` — data URL 또는 https 원격 URL */
export const getRecommendThumbDisplaySrc = (imageUrl: string | undefined | null): string => {
  const v = String(imageUrl ?? '').trim()
  if (!v) return ''
  if (v.startsWith('data:image')) return v
  if (/^https?:\/\//i.test(v)) return v
  return ''
}

export const shouldFetchMusicRecommendImages = (items: RecommendResultItem[], imageField = 'imageUrl'): boolean =>
  items.some(
    (item) => isMusicRecommendResultItem(item) && isRecommendImagePlaceholderUrl(String(item[imageField] ?? '')),
  )

/** lunch 썸네일 API 호출용 — 동적 RecommendResultItem은 menu·imageUrl만 사용 */
const asLunchItemsForImageApi = (items: RecommendResultItem[]): LunchRecommendationItem[] =>
  items as unknown as LunchRecommendationItem[]

const recommendRecommendationsJsonKey = (rContent: string): string => {
  const items = parseRecommendJsonArray(rContent)
  return items.length > 0 ? JSON.stringify(items) : ''
}

const recommendRecommendationRowKey = (row: RecommendResultItem): string => {
  const title = String(row.title ?? '').trim()
  const artist = String(row.artist ?? '').trim()
  if (title && artist) return `${title}::${artist}`
  return JSON.stringify(row)
}

/** 스트리밍 갱신 시 enrichment로 받은 imageUrl 유지 */
export const mergeRecommendRecommendationsPreservingImages = (
  next: RecommendResultItem[],
  existing?: RecommendResultItem[] | null,
  imageField = 'imageUrl',
): RecommendResultItem[] => {
  const normalized = normalizeRecommendResultItems(next)
  if (!existing?.length) return normalized

  const imageByKey = new Map<string, string>()
  for (const row of existing) {
    const imageUrl = String(row[imageField] ?? '').trim()
    if (imageUrl && !isRecommendImagePlaceholderUrl(imageUrl)) {
      imageByKey.set(recommendRecommendationRowKey(row), imageUrl)
    }
  }

  return normalized.map((row) => {
    const preserved = imageByKey.get(recommendRecommendationRowKey(row))
    if (preserved && isRecommendImagePlaceholderUrl(String(row[imageField] ?? ''))) {
      return { ...row, [imageField]: preserved }
    }
    return row
  })
}

/** enrichment 결과 imageField에 병합 (동적 JSON 키 유지) */
const mergeRecommendImageEnrichment = (
  originals: RecommendResultItem[],
  enriched: RecommendResultItem[],
  imageField = 'imageUrl',
): RecommendResultItem[] =>
  originals.map((original, i) => ({
    ...original,
    [imageField]: String(enriched[i]?.[imageField] ?? original[imageField] ?? ''),
  }))

// ── 음악(iTunes Search API) 캐시 ───────────────────────────────────────────

const musicRecommendImageEnrichedCache = new Map<string, RecommendResultItem[]>()
const musicRecommendImageFetchJsonKeyByLogId = new Map<string, string>()
const musicRecommendImageEnrichmentInflight = new Map<string, Promise<RecommendResultItem[] | null>>()

const migrateMusicRecommendImageCacheForAnswerLogId = (oldLogId: string, newLogId: string): void => {
  const oldId = String(oldLogId ?? '').trim()
  const newId = String(newLogId ?? '').trim()
  if (!oldId || !newId || oldId === newId) return

  const oldKeys = [oldId, `${oldId}-recommend-result`]
  for (const oldKey of oldKeys) {
    const cached = musicRecommendImageEnrichedCache.get(oldKey)
    if (cached && !musicRecommendImageEnrichedCache.has(newId)) {
      musicRecommendImageEnrichedCache.set(newId, cached)
    }
    const fetchedJsonKey = musicRecommendImageFetchJsonKeyByLogId.get(oldKey)
    if (fetchedJsonKey && !musicRecommendImageFetchJsonKeyByLogId.has(newId)) {
      musicRecommendImageFetchJsonKeyByLogId.set(newId, fetchedJsonKey)
    }
    musicRecommendImageEnrichedCache.delete(oldKey)
    musicRecommendImageFetchJsonKeyByLogId.delete(oldKey)
  }
}

const tryGetMusicRecommendImageEnrichmentFromCache = (
  logId: string,
  rContent: string,
  items: RecommendResultItem[],
  imageField: string,
): RecommendResultItem[] | null => {
  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId || !items.length) return null

  const jsonKey = recommendRecommendationsJsonKey(rContent)
  const cached = musicRecommendImageEnrichedCache.get(trimmedLogId)
  if (cached && musicRecommendImageFetchJsonKeyByLogId.get(trimmedLogId) === jsonKey) {
    return mergeRecommendImageEnrichment(items, cached, imageField)
  }
  return null
}

const setMusicRecommendImageEnrichedCache = (logId: string, rContent: string, items: RecommendResultItem[]) => {
  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId) return
  musicRecommendImageEnrichedCache.set(trimmedLogId, items)
  musicRecommendImageFetchJsonKeyByLogId.set(trimmedLogId, recommendRecommendationsJsonKey(rContent))
}

/** iTunes Search API — title + artist 로 앨범 아트 URL 조회 */
export const fetchItunesArtworkUrl = async (title: string, artist: string): Promise<string | null> => {
  const term = `${String(title ?? '').trim()} ${String(artist ?? '').trim()}`.trim()
  if (!term) return null

  const query = new URLSearchParams({ term, media: 'music', limit: '1' })
  try {
    const res = await fetch(`${ITUNES_SEARCH_API}?${query.toString()}`)
    if (!res.ok) return null
    const data = (await res.json()) as { results?: { artworkUrl100?: string }[] }
    const artwork = String(data.results?.[0]?.artworkUrl100 ?? '').trim()
    if (!artwork) return null
    return artwork.replace(/100x100bb\.jpg$/i, '300x300bb.jpg')
  } catch {
    return null
  }
}

const fetchMusicRecommendImagesFromItunes = async (
  items: RecommendResultItem[],
  imageField: string,
): Promise<RecommendResultItem[] | null> => {
  if (!items.length) return null

  const settled = await Promise.allSettled(
    items.map(async (item) => {
      if (!isMusicRecommendResultItem(item)) return item
      if (!isRecommendImagePlaceholderUrl(String(item[imageField] ?? ''))) return item

      const artworkUrl = await fetchItunesArtworkUrl(String(item.title ?? ''), String(item.artist ?? ''))
      if (!artworkUrl) return item
      return { ...item, [imageField]: artworkUrl }
    }),
  )

  return items.map((item, i) => {
    const result = settled[i]
    return result?.status === 'fulfilled' ? result.value : item
  })
}

const resolveMusicRecommendImageEnrichment = async (
  logId: string,
  rContent: string,
  items: RecommendResultItem[],
  imageField: string,
): Promise<RecommendResultItem[] | null> => {
  const trimmedLogId = String(logId ?? '').trim()
  if (!trimmedLogId || !items.length) return null

  const fromCache = tryGetMusicRecommendImageEnrichmentFromCache(trimmedLogId, rContent, items, imageField)
  if (fromCache) return fromCache

  if (!shouldFetchMusicRecommendImages(items, imageField)) {
    return items
  }

  const jsonKey = recommendRecommendationsJsonKey(rContent)
  const inflightKey = jsonKey ? `itunes::${jsonKey}` : `${trimmedLogId}::${jsonKey}`
  const existing = musicRecommendImageEnrichmentInflight.get(inflightKey)
  if (existing) return existing

  const promise = (async () => {
    const enriched = await fetchMusicRecommendImagesFromItunes(items, imageField)
    if (!enriched?.length) return null
    setMusicRecommendImageEnrichedCache(trimmedLogId, rContent, enriched)
    return enriched
  })()

  musicRecommendImageEnrichmentInflight.set(inflightKey, promise)
  try {
    return await promise
  } finally {
    musicRecommendImageEnrichmentInflight.delete(inflightKey)
  }
}

export interface RecommendImageEnrichmentOptions {
  imageField?: string
}

export const tryGetRecommendImageEnrichmentFromCache = (
  logId: string,
  rContent: string,
  items: RecommendResultItem[],
  options?: RecommendImageEnrichmentOptions,
): RecommendResultItem[] | null => {
  const imageField = options?.imageField ?? 'imageUrl'

  if (shouldFetchMusicRecommendImages(items, imageField)) {
    return tryGetMusicRecommendImageEnrichmentFromCache(logId, rContent, items, imageField)
  }

  const cached = tryGetLunchMenuImageEnrichmentFromCache(logId, rContent, asLunchItemsForImageApi(items))
  if (!cached?.length) return null
  return mergeRecommendImageEnrichment(items, cached as unknown as RecommendResultItem[], imageField)
}

export const resolveRecommendImageEnrichment = async (
  logId: string,
  rContent: string,
  items: RecommendResultItem[],
  options?: RecommendImageEnrichmentOptions,
): Promise<RecommendResultItem[] | null> => {
  const imageField = options?.imageField ?? 'imageUrl'

  if (shouldFetchMusicRecommendImages(items, imageField)) {
    const enriched = await resolveMusicRecommendImageEnrichment(logId, rContent, items, imageField)
    if (!enriched?.length) return null
    return mergeRecommendImageEnrichment(items, enriched, imageField)
  }

  const enriched = await resolveLunchMenuImageEnrichment(logId, rContent, asLunchItemsForImageApi(items))
  if (!enriched?.length) return null
  return mergeRecommendImageEnrichment(items, enriched as unknown as RecommendResultItem[], imageField)
}

export const preloadRecommendThumbImages = async (
  items: RecommendResultItem[],
  imageField = 'imageUrl',
): Promise<void> => {
  if (typeof window === 'undefined') return
  const urls = [
    ...new Set(
      items.map((item) => getRecommendThumbDisplaySrc(String(item[imageField] ?? ''))).filter((src) => src.length > 0),
    ),
  ]
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

// ━━━ 메시지 생성 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const genRecommendLogId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createRecommendCardMessage = (opts: {
  agentId: string
  createdAt: string
  svcTy?: string
  refId?: string
  config: RecommendAgentConfig
}): ChatMessage => ({
  logId: genRecommendLogId('rec-form'),
  type: 'recommend',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  recommendCardRole: 'form',
  recommendFormPayload: createEmptyRecommendFormPayload(opts.config),
  recommendSubmitted: false,
})

export const createRecommendResultCardMessage = (opts: {
  answerLogId: string
  agentId: string
  createdAt: string
  svcTy?: string
  refId?: string
}): ChatMessage => ({
  logId: `${opts.answerLogId}-recommend-result`,
  type: 'recommend',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  recommendCardRole: 'result',
  recommendAnswerLogId: opts.answerLogId,
  recommendSubmitted: true,
})

export const createReadonlyRecommendMessage = (
  payload: RecommendFormPayload,
  opts: { agentId: string; createdAt: string; svcTy?: string; refId?: string },
): ChatMessage => ({
  logId: genRecommendLogId('rec-form-ro'),
  type: 'recommend',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  recommendCardRole: 'form',
  recommendFormPayload: { ...payload },
  recommendSubmitted: true,
})

// ━━━ 메시지 연결 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** RECOMMEND 파이프라인 answer — 카드·숨김 행 연동 대상 (일반 채팅 answer와 구분) */
export const isRecommendPipelineAnswer = (answerMsg: ChatMessage, messages: ChatMessage[]): boolean => {
  if (answerMsg.type !== 'answer') return false
  if (answerMsg.hiddenFromDisplay) return true
  const logId = String(answerMsg.logId ?? '').trim()
  if (!logId) return false
  return messages.some(
    (m) =>
      m.type === 'recommend' &&
      m.recommendCardRole === 'result' &&
      String(m.recommendAnswerLogId ?? '').trim() === logId,
  )
}

export const findLinkedRecommendAnswerMessage = (
  messages: ChatMessage[],
  resultMsg: ChatMessage,
): ChatMessage | undefined => {
  const answerLogId = String(resultMsg.recommendAnswerLogId ?? '').trim()
  if (answerLogId) {
    return messages.find((m) => m.type === 'answer' && m.logId === answerLogId)
  }
  const cardIndex = messages.findIndex((m) => m.logId === resultMsg.logId)
  if (cardIndex < 0) return undefined
  const nextAnswer = messages.slice(cardIndex + 1).find((m) => m.type === 'answer')
  if (!nextAnswer || !isRecommendPipelineAnswer(nextAnswer, messages)) return undefined
  return nextAnswer
}

/** 채팅 로그 한 건 → readonly form + result 카드 + 숨김 answer (점심 에이전트와 동일 패턴) */
export const buildRecommendMessagesFromLogRow = (
  row: ChatLogListRow,
  answerMessage: ChatMessage,
  config: RecommendAgentConfig | null,
): ChatMessage[] | null => {
  const qcontent = row.qcontent ?? ''
  if (!isRecommendAgentPrompt(qcontent)) return null

  const logId = String(row.logId ?? '')
  const payload = config ? parseRecommendPayloadFromPrompt(qcontent, config) : {}
  const recommendDisplayRecommendations = normalizeRecommendResultItems(
    parseRecommendJsonArray(String(row.rcontent ?? '')),
  )
  const agentId = typeof row.agentId === 'string' ? row.agentId.trim() : ''
  const createdAt = row.createDt ?? ''
  const svcTy = row.svcTy ?? 'C'
  const modelId = row.modelId ?? 'all'
  const refId = row.refId ?? ''
  const baseFields = {
    createdAt,
    svcTy,
    modelId,
    refId,
    ...(agentId ? { agentId } : {}),
    hasSource: false,
    hasVisualization: false,
  }

  return [
    {
      logId: `${logId}-rec-form`,
      type: 'recommend',
      qContent: '',
      rContent: '',
      recommendCardRole: 'form',
      recommendSubmitted: true,
      recommendFormPayload: { ...payload },
      ...baseFields,
    },
    {
      logId: `${logId}-rec-result`,
      type: 'recommend',
      qContent: '',
      rContent: '',
      recommendCardRole: 'result',
      recommendSubmitted: true,
      recommendDisplayRecommendations,
      recommendAnswerLogId: logId,
      ...baseFields,
    },
    { ...answerMessage, hiddenFromDisplay: true },
  ]
}

/** answer·result 카드 연결·썸네일 캐시 키 (answer logId) */
export const getRecommendImageEnrichmentCacheKey = (source: {
  recommendAnswerLogId?: string | null
  logId?: string | null
}): string => {
  const answerLogId = String(source.recommendAnswerLogId ?? '').trim()
  if (answerLogId) return answerLogId
  const logId = String(source.logId ?? '').trim()
  return logId.replace(/-recommend-result$/, '')
}

export const migrateRecommendMessagesForAnswerLogId = (messages: ChatMessage[], oldLogId: string, newLogId: string) => {
  migrateMusicRecommendImageCacheForAnswerLogId(oldLogId, newLogId)
  messages.forEach((m) => {
    if (m.type === 'recommend' && m.recommendAnswerLogId === oldLogId) {
      m.recommendAnswerLogId = newLogId
      if (m.logId === `${oldLogId}-recommend-result`) {
        m.logId = `${newLogId}-recommend-result`
      }
    }
  })
}

export const syncRecommendResultFromAnswer = (messages: ChatMessage[], answerMsg: ChatMessage) => {
  if (answerMsg.type !== 'answer' || !isRecommendPipelineAnswer(answerMsg, messages)) return

  const rContent = String(answerMsg.rContent ?? '')
  const items = normalizeRecommendResultItems(parseRecommendJsonArray(rContent))
  if (!items.length) return

  const resultMsg = messages.find(
    (m) =>
      m.type === 'recommend' &&
      m.recommendCardRole === 'result' &&
      (m.recommendAnswerLogId === answerMsg.logId || m.logId === `${answerMsg.logId}-recommend-result`),
  )
  if (!resultMsg) return

  const nextKey = recommendRecommendationsJsonKey(rContent)
  const prevKey = recommendRecommendationsJsonKey(JSON.stringify(resultMsg.recommendDisplayRecommendations ?? []))
  if (nextKey === prevKey && (resultMsg.recommendDisplayRecommendations?.length ?? 0) > 0) return

  resultMsg.recommendDisplayRecommendations = mergeRecommendRecommendationsPreservingImages(
    items,
    resultMsg.recommendDisplayRecommendations,
  )
}

// ━━━ 이미지 enrichment 전체 적용 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const applyRecommendImageEnrichmentToResultMessage = async (
  resultMsg: ChatMessage,
  rContent: string,
  options?: RecommendImageEnrichmentOptions,
): Promise<void> => {
  const cacheKey = getRecommendImageEnrichmentCacheKey(resultMsg)
  if (!cacheKey) return

  const items = parseRecommendJsonArray(rContent)
  if (!items.length) return

  const enriched = await resolveRecommendImageEnrichment(cacheKey, rContent, items, options)
  if (!enriched?.length) return

  resultMsg.recommendDisplayRecommendations = normalizeRecommendResultItems(enriched)
}

// ━━━ RECOMMEND 방 등록 (설문 registerSurveyRoom과 동일 — 해당 방에서만 프롬프트 question 숨김) ━━━

const recommendRoomIds = ref<Set<string>>(new Set())

export const registerRecommendRoom = (roomId: string) => {
  const id = String(roomId ?? '').trim()
  if (!id) return
  recommendRoomIds.value = new Set([...recommendRoomIds.value, id])
}

export const isRecommendRoom = (roomId: string) => recommendRoomIds.value.has(String(roomId ?? '').trim())

// ━━━ 인덱스 오버레이 상태 (useLunchAgent 패턴과 동일) ━━━━━━━━━━━━━━━━━━━━━━━━

const isRecommendVisible = ref(false)

export const useRecommendAgent = () => {
  const openRecommendAgent = () => {
    isRecommendVisible.value = true
  }
  const closeRecommendAgent = () => {
    isRecommendVisible.value = false
  }
  return {
    isRecommendVisible,
    openRecommendAgent,
    closeRecommendAgent,
    registerRecommendRoom,
    isRecommendRoom,
  }
}

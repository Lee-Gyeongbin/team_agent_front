import type { ChatMessage, NewsCuratorItem } from '~/types/chat'

/** UI `ChatNewsCurator` 분야 `value`와 동일 — 변경 시 컴포넌트와 동기화 */
export const NEWS_CURATOR_KNOWN_CATEGORY_VALUES = ['정치', '경제', '사회', '생활/문화', '산업'] as const

const KNOWN = new Set<string>(NEWS_CURATOR_KNOWN_CATEGORY_VALUES)

const splitCsv = (commaSeparatedText: string) =>
  commaSeparatedText
    .split(/[,，、]/)
    .map((segment) => segment.trim())
    .filter(Boolean)

/** 선택 카테고리 → 전송 문자열. 예: `정치, 경제, 사회` */
export const buildNewsCuratorCategoriesPrompt = (categories: string[]): string => {
  const trimmedCategories = categories.map((category) => String(category).trim()).filter(Boolean)
  return trimmedCategories.length ? trimmedCategories.join(', ') : ''
}

/** 숨김 질문 여부 + 선택 분야 (알려진 분야만 1~3개·쉼표 구분) */
export const parseNewsCuratorPromptMeta = (questionPromptText: string) => {
  const normalizedPrompt = String(questionPromptText ?? '').trim()
  const categories = splitCsv(normalizedPrompt)
  const ok =
    categories.length > 0 &&
    categories.length <= 3 &&
    new Set(categories).size === categories.length &&
    categories.every((categoryLabel) => KNOWN.has(categoryLabel))
  return ok ? { isHiddenQuestion: true, categories } : { isHiddenQuestion: false, categories: [] as string[] }
}

/** 백엔드 `complete.content` 등 — 표준 JSON 루트에서 `news` 배열만 추출 */
const rowsFromNewsJsonRoot = (parsedJson: unknown): unknown[] | null => {
  if (Array.isArray(parsedJson)) return parsedJson
  if (parsedJson && typeof parsedJson === 'object') {
    const jsonRoot = parsedJson as Record<string, unknown>
    const newsArrayPropertyKey = Object.keys(jsonRoot).find((objectKey) => objectKey.toLowerCase() === 'news')
    if (newsArrayPropertyKey && Array.isArray(jsonRoot[newsArrayPropertyKey])) {
      return jsonRoot[newsArrayPropertyKey] as unknown[]
    }
  }
  return null
}

const trimStringField = (rawField: unknown) => String(rawField ?? '').trim()

const mapRow = (row: unknown, idx: number): NewsCuratorItem => {
  const rowFields = row as Record<string, unknown>
  return {
    rank: Number(rowFields.rank ?? idx + 1),
    source: trimStringField(rowFields.source),
    title: trimStringField(rowFields.title),
    category: trimStringField(rowFields.category),
    summary: trimStringField(rowFields.summary),
    sourceUrl: trimStringField(rowFields.sourceUrl),
    imageUrl: trimStringField(rowFields.imageUrl),
  }
}

/** 답변 `rContent` — 백엔드가 항상 표준 JSON으로 내려줄 때 사용 */
export const parseNewsCuratorItems = (raw: string): NewsCuratorItem[] => {
  const text = String(raw ?? '').trim()
  if (!text) return []
  try {
    let root: unknown = JSON.parse(text)
    if (typeof root === 'string') {
      const inner = root.trim()
      if (inner.startsWith('{') || inner.startsWith('[')) root = JSON.parse(inner)
    }
    const rows = rowsFromNewsJsonRoot(root)
    if (!rows?.length) return []
    return rows.map(mapRow).filter((it) => it.title && it.summary)
  } catch {
    return []
  }
}

export const createNewsCuratorMessage = (submitted: boolean): ChatMessage => ({
  logId: `news-curator-${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'news',
  createdAt: '',
  agentId: 'AG000012',
  newsSubmitted: submitted,
})

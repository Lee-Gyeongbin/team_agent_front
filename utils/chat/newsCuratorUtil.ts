import { ref } from 'vue'
import type { ChatMessage, NewsCuratorItem } from '~/types/chat'

/** 채팅·로그 재구성 시 에이전트 식별 — 변경 시 useChatStore AGENT_ID_NEWS 와 동기화 */
export const NEWS_CURATOR_AGENT_ID = 'AG000012'

/** UI `ChatNewsCurator` 분야 `value`와 동일 — 변경 시 컴포넌트와 동기화 */
export const NEWS_CURATOR_KNOWN_CATEGORY_VALUES = [
  '정치',
  '경제',
  '사회',
  '산업',
  '문화',
  '세계',
  '건강',
  '연예',
  '스포츠',
  '주식',
] as const

const KNOWN = new Set<string>(NEWS_CURATOR_KNOWN_CATEGORY_VALUES)

/** 뉴스픽 UI·숨김 질문 파서와 동일 — 최대 선택 개수 */
const NEWS_CURATOR_PROMPT_MAX_CATEGORIES = 3

const splitCsv = (commaSeparatedText: string) =>
  commaSeparatedText
    .split(/[,，、]/)
    .map((segment) => segment.trim())
    .filter(Boolean)

/**
 * 긴 큐레이션 프롬프트에서 `사용자 관심 카테고리: ["건강","스포츠"]` 형태만 추출
 * - 알려진 분야 문자열만 허용, 1~3개, 중복 불가
 */
const extractCategoriesFromLabeledJsonArray = (text: string): string[] | null => {
  const labelMatch = text.match(/(?:^|[\r\n])\s*[-*•]?\s*사용자\s*관심\s*카테고리\s*[:：]\s*(\[[\s\S]*?\])/u)
  if (!labelMatch?.[1]) return null
  try {
    const parsed: unknown = JSON.parse(labelMatch[1])
    if (!Array.isArray(parsed)) return null
    if (parsed.length === 0 || parsed.length > NEWS_CURATOR_PROMPT_MAX_CATEGORIES) return null
    const labels: string[] = []
    const seen = new Set<string>()
    for (const cell of parsed) {
      if (typeof cell !== 'string' && typeof cell !== 'number') return null
      const label = String(cell).trim()
      if (!label || !KNOWN.has(label) || seen.has(label)) return null
      seen.add(label)
      labels.push(label)
    }
    return labels
  } catch {
    return null
  }
}

const isValidHiddenCategoryList = (categories: string[]) =>
  categories.length > 0 &&
  categories.length <= NEWS_CURATOR_PROMPT_MAX_CATEGORIES &&
  new Set(categories).size === categories.length &&
  categories.every((categoryLabel) => KNOWN.has(categoryLabel))

/** 사용자 제출 시 API로 보내는 뉴스 큐레이션 시스템 프롬프트 — 선택 분야만 JSON 배열로 치환 */
export const buildNewsCuratorSubmissionPrompt = (categories: string[]): string => {
  const labels = categories.map((c) => String(c).trim()).filter(Boolean)
  if (!isValidHiddenCategoryList(labels)) return ''

  const categoryJson = JSON.stringify(labels)

  return `너는 뉴스 큐레이션 편집자이다.

[입력 데이터]
- 사용자 관심 카테고리: ${categoryJson}

[역할]
후보 기사 목록 중에서 사용자 관심 카테고리와 가장 관련성이 높은 기사 5개를 선정한다.

[전제 조건]
1. 반드시 후보 기사 목록 안에 존재하는 기사만 사용한다.
2. 존재하지 않는 기사나 값을 임의 생성하지 않는다.
3. source, title, sourceUrl, imageUrl 값은 입력 데이터를 그대로 사용한다.
4. imageUrl은 기사 원본 데이터의 imageUrl 값을 그대로 사용한다.
5. 받은 카테고리별로 1가지 이상의 기사를 선택해야 한다.

[작업 규칙]
1. 사용자 관심 카테고리와 일치하거나 가장 가까운 기사를 우선 선정한다.
2. 같은 주제 또는 유사한 내용의 기사는 중복 선택하지 않는다.
3. summary만 새롭게 작성하며, 기사 내용을 자연스럽게 축약한 한국어 두 문장으로 작성한다.
4. summary는 최대 150자 이내로 간결하게 작성한다.
5. summary에는 과장, 추측, 허위 표현을 사용하지 않는다.

[출력 규칙]
1. 반드시 JSON 배열만 출력한다.
2. 설명, 마크다운, 코드블록, 추가 텍스트는 절대 출력하지 않는다.
3. 배열 원소 개수는 반드시 정확히 5개이다.
4. rank 값은 반드시 1부터 5까지 순서로 출력한다.
5. 출력 필드는 아래만 사용한다.
   - rank
   - source
   - title
   - summary
   - sourceUrl
   - imageUrl

[출력 예시]
[
  {
    "rank": 1,
    "source": "전자신문",
    "title": "삼성전자 AI 반도체 투자 확대",
    "summary": "삼성전자가 AI 반도체 투자를 확대한다. 생산 역량 강화에 나선다.",
    "sourceUrl": "https://www.etnews.com/20260507000353",
    "imageUrl": "https://image.example.com/sample.jpg"
  }
]`
}

/**
 * 숨김 질문 여부 + 선택 분야
 * - 본문에 `사용자 관심 카테고리:` + JSON 배열(긴 프롬프트·현재 제출 형식)
 * - 또는 전체 문자열이 `정치, 경제` 처럼 분야만(구버전·쉼표는 , / ， / 、)
 */
export const parseNewsCuratorPromptMeta = (questionPromptText: string) => {
  const normalizedPrompt = String(questionPromptText ?? '').trim()
  if (!normalizedPrompt) {
    return { isHiddenQuestion: false, categories: [] as string[] }
  }

  const fromLabeledJson = extractCategoriesFromLabeledJsonArray(normalizedPrompt)
  if (fromLabeledJson) {
    return { isHiddenQuestion: true, categories: fromLabeledJson }
  }

  const categories = splitCsv(normalizedPrompt)
  if (isValidHiddenCategoryList(categories)) {
    return { isHiddenQuestion: true, categories }
  }
  return { isHiddenQuestion: false, categories: [] as string[] }
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
  agentId: NEWS_CURATOR_AGENT_ID,
  newsSubmitted: submitted,
})

// ============================================================
// 모듈 스코프 반응형 상태 (usePsychologySurvey / useTodayMeme 와 동일 패턴)
// ============================================================
const isNewsCuratorVisible = ref(false)

/**
 * 뉴스 큐레이터 제출을 통해 생성된 채팅방 ID
 * - 해당 방에서는 첫 번째 question 메시지(숨김 프롬프트)를 UI에서 숨김
 */
const newsCuratorRoomIds = ref<Set<string>>(new Set())

export const useNewsCurator = () => {
  const openNewsCurator = () => {
    isNewsCuratorVisible.value = true
  }

  const closeNewsCurator = () => {
    isNewsCuratorVisible.value = false
  }

  const registerNewsCuratorRoom = (roomId: string) => {
    newsCuratorRoomIds.value = new Set([...newsCuratorRoomIds.value, roomId])
  }

  const isNewsCuratorRoom = (roomId: string) => newsCuratorRoomIds.value.has(roomId)

  return {
    isNewsCuratorVisible,
    openNewsCurator,
    closeNewsCurator,
    registerNewsCuratorRoom,
    isNewsCuratorRoom,
  }
}

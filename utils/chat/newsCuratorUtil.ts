import { ref } from 'vue'
import { getCodes } from '~/utils/global/comCodesUtil'
import type { ChatMessage, NewsCuratorItem } from '~/types/chat'
import type { CodeItem } from '~/types/codes'

/** 채팅·로그 재구성 시 에이전트 식별 — 변경 시 useChatStore AGENT_ID_NEWS 와 동기화 */
export const NEWS_CURATOR_AGENT_ID = 'AG000012'

/** 뉴스 큐레이터 분야 공통코드 그룹 — `ChatNewsCurator`·프롬프트 검증과 동기화 */
export const NEWS_CURATOR_CATEGORY_CODE_GRP_ID = 'NC000001'

export type NewsCuratorCategoryOption = {
  /** 공통코드 codeId — 제출·프롬프트 JSON에 사용 */
  value: string
  /** 공통코드 codeNm — 화면 표시 */
  label: string
  description: string
}

const categoryOptions = ref<NewsCuratorCategoryOption[]>([])
const isCategoryOptionsLoading = ref(false)
const categoryLoadError = ref('')
let categoryLoadPromise: Promise<NewsCuratorCategoryOption[]> | null = null

const mapCodeToCategoryOption = (code: CodeItem): NewsCuratorCategoryOption => ({
  value: String(code.codeId ?? '').trim(),
  label: String(code.codeNm ?? '').trim(),
  description: String(code.description ?? '').trim(),
})

const normalizeCategoryToken = (raw: string) => String(raw ?? '').trim()

/** NC000001 codeId로 분야 옵션 조회 */
export const resolveNewsCuratorCategoryOption = (raw: string): NewsCuratorCategoryOption | undefined => {
  const codeId = normalizeCategoryToken(raw)
  if (!codeId) return undefined
  return categoryOptions.value.find((option) => option.value === codeId)
}

/** 등록된 codeId인지 */
export const isNewsCuratorCategoryKnown = (raw: string): boolean => !!resolveNewsCuratorCategoryOption(raw)

/** 화면 표기용 분야명 — NC000001 매칭 시 codeNm, 없으면 '-' */
export const resolveNewsCuratorCategoryLabel = (raw: string): string => {
  const codeId = normalizeCategoryToken(raw)
  if (!codeId) return '-'
  return resolveNewsCuratorCategoryOption(codeId)?.label ?? '-'
}

/** selectUserNewsInterestCategory 응답 — `codeIds` 배열만 사용 */
export const parseInterestCodeIdsFromResponse = (res: unknown): string[] => {
  if (!res || typeof res !== 'object') return []
  const raw = (res as { codeIds?: unknown }).codeIds
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id).trim()).filter(Boolean)
}

/** 캐시 초기화 — 재시도 시 사용 */
export const resetNewsCuratorCategoriesCache = () => {
  categoryOptions.value = []
  categoryLoadError.value = ''
  categoryLoadPromise = null
}

/**
 * NC000001 공통코드 목록 조회 (모듈 캐시)
 * - useYn === 'Y' 만
 */
export const handleLoadNewsCuratorCategories = async (): Promise<NewsCuratorCategoryOption[]> => {
  if (categoryOptions.value.length > 0) return categoryOptions.value
  if (categoryLoadPromise) return categoryLoadPromise

  isCategoryOptionsLoading.value = true
  categoryLoadError.value = ''

  categoryLoadPromise = (async () => {
    try {
      const codes = await getCodes(NEWS_CURATOR_CATEGORY_CODE_GRP_ID)
      categoryOptions.value = codes
        .filter((code) => code.useYn === 'Y')
        .map(mapCodeToCategoryOption)
        .filter((option) => option.value && (option.label || option.description))
      return categoryOptions.value
    } catch {
      categoryLoadError.value = '뉴스 분야 목록을 불러오지 못했습니다.'
      categoryOptions.value = []
      return []
    } finally {
      isCategoryOptionsLoading.value = false
      categoryLoadPromise = null
    }
  })()

  return categoryLoadPromise
}

/** `ChatNewsCurator` — 분야 목록 반응형 상태 */
export const useNewsCuratorCategories = () => ({
  categoryOptions,
  isCategoryOptionsLoading,
  categoryLoadError,
  handleLoadNewsCuratorCategories,
  resetNewsCuratorCategoriesCache,
  isNewsCuratorCategoryKnown,
  resolveNewsCuratorCategoryOption,
  resolveNewsCuratorCategoryLabel,
})

/** 뉴스픽 UI·숨김 질문 파서 — 최대 선택 분야 개수 */
export const NEWS_CURATOR_MAX_CATEGORY_COUNT = 3

/**
 * 긴 큐레이션 프롬프트에서 `사용자 관심 카테고리: ["codeId",...]` 형태만 추출
 * - NC000001 codeId만 허용, 1~3개, 중복 불가
 */
const extractCategoriesFromLabeledJsonArray = (text: string): string[] | null => {
  const labelMatch = text.match(/(?:^|[\r\n])\s*[-*•]?\s*사용자\s*관심\s*카테고리\s*[:：]\s*(\[[\s\S]*?\])/u)
  if (!labelMatch?.[1]) return null
  try {
    const parsed: unknown = JSON.parse(labelMatch[1])
    if (!Array.isArray(parsed)) return null
    if (parsed.length === 0 || parsed.length > NEWS_CURATOR_MAX_CATEGORY_COUNT) return null
    const codeIds: string[] = []
    const seen = new Set<string>()
    for (const cell of parsed) {
      if (typeof cell !== 'string' && typeof cell !== 'number') return null
      const codeId = String(cell).trim()
      if (!codeId || !isNewsCuratorCategoryKnown(codeId) || seen.has(codeId)) return null
      seen.add(codeId)
      codeIds.push(codeId)
    }
    return codeIds
  } catch {
    return null
  }
}

const isValidHiddenCategoryList = (categories: string[]) =>
  categories.length > 0 &&
  categories.length <= NEWS_CURATOR_MAX_CATEGORY_COUNT &&
  new Set(categories).size === categories.length &&
  categories.every((codeId) => isNewsCuratorCategoryKnown(codeId))

const parseNewsSubmitTypeIsNew = (text: string): boolean | undefined => {
  if (/카테고리\s*제출\s*유형\s*[:：]\s*SAVED/u.test(text)) return false
  if (/카테고리\s*제출\s*유형\s*[:：]\s*NEW/u.test(text)) return true
  return undefined
}

/** 사용자 제출 시 API로 보내는 뉴스 큐레이션 시스템 프롬프트 — 선택 분야만 JSON 배열로 치환 */
export const buildNewsCuratorSubmissionPrompt = (categories: string[], options?: { isNew?: boolean }): string => {
  const codeIds = categories.map((c) => String(c).trim()).filter(Boolean)
  if (!isValidHiddenCategoryList(codeIds)) return ''

  const categoryJson = JSON.stringify(codeIds)
  const submitTypeLine = options?.isNew === false ? '- 카테고리 제출 유형: SAVED' : '- 카테고리 제출 유형: NEW'

  return `너는 뉴스 큐레이션 편집자이다.

[입력 데이터]
- 사용자 관심 카테고리: ${categoryJson}
${submitTypeLine}

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
 * 숨김 질문 여부 + 선택 분야(codeId)
 * - 본문 `사용자 관심 카테고리:` + JSON 배열(현행 제출 프롬프트)만 인식
 */
export const parseNewsCuratorPromptMeta = (questionPromptText: string) => {
  const normalizedPrompt = String(questionPromptText ?? '').trim()
  if (!normalizedPrompt) {
    return { isHiddenQuestion: false, categories: [] as string[], isNew: undefined as boolean | undefined }
  }

  const submitTypeIsNew = parseNewsSubmitTypeIsNew(normalizedPrompt)
  const categories = extractCategoriesFromLabeledJsonArray(normalizedPrompt)
  if (!categories) {
    return { isHiddenQuestion: false, categories: [] as string[], isNew: undefined as boolean | undefined }
  }
  return { isHiddenQuestion: true, categories, isNew: submitTypeIsNew }
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

export const createNewsCuratorMessage = (submitted: boolean, options?: { newsReselect?: boolean }): ChatMessage => ({
  logId: `news-curator-${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'news',
  createdAt: '',
  agentId: NEWS_CURATOR_AGENT_ID,
  newsSubmitted: submitted,
  ...(options?.newsReselect ? { newsReselect: true } : {}),
})

/** NewsCurator 에이전트 answer 행 식별 */
export const isNewsCuratorAnswerMessage = (message: ChatMessage): boolean =>
  message.type === 'answer' && String(message.agentId ?? '').trim() === NEWS_CURATOR_AGENT_ID

/** news 카드 직후 ~ 다음 news 카드 전까지 메시지 구간 */
export const getMessagesSliceAfterNewsCard = (allMessages: ChatMessage[], newsCardLogId: string): ChatMessage[] => {
  const cardIndex = allMessages.findIndex((entry) => entry.logId === newsCardLogId)
  if (cardIndex < 0) return []
  const afterCard = allMessages.slice(cardIndex + 1)
  const nextNewsIndex = afterCard.findIndex((entry) => entry.type === 'news')
  return nextNewsIndex < 0 ? afterCard : afterCard.slice(0, nextNewsIndex)
}

/** news 카드에 대응하는 answer 행 (카드 UI·지식창고 logId용) */
export const findLinkedNewsCuratorAnswer = (
  allMessages: ChatMessage[],
  newsCardLogId: string,
): ChatMessage | undefined =>
  getMessagesSliceAfterNewsCard(allMessages, newsCardLogId).find((entry) => isNewsCuratorAnswerMessage(entry))

/** readonly 카드에 잠긴 codeId가 옵션과 일치하는지 */
export const isNewsCuratorLockedCategorySelected = (
  lockedCodeIds: string[],
  option: NewsCuratorCategoryOption,
): boolean => lockedCodeIds.some((codeId) => normalizeCategoryToken(codeId) === option.value)

let newsCuratorSubmitCardLogId: string | null = null

/** 제출한 news 카드 logId — `null`이면 해제 */
export const setNewsCuratorSubmitCardLogId = (logId: string | null) => {
  newsCuratorSubmitCardLogId = logId
}

/** 스트리밍 완료 시 제출한 news 카드에 newsDisplayItems 주입 */
export const applyNewsDisplayItemsToSubmitCard = (allMessages: ChatMessage[], rContent: string) => {
  if (!newsCuratorSubmitCardLogId) return
  const items = parseNewsCuratorItems(rContent)
  if (!items.length) return
  const card = allMessages.find((m) => m.logId === newsCuratorSubmitCardLogId && m.type === 'news')
  if (!card) return
  card.newsDisplayItems = items
  newsCuratorSubmitCardLogId = null
}

/** news 카드 표시용 기사 목록 — `newsDisplayItems` 우선, 없으면 연결 answer 파싱 */
export const resolveNewsCuratorItemsForCard = (
  newsCard: ChatMessage,
  allMessages: ChatMessage[],
): NewsCuratorItem[] => {
  if (newsCard.type !== 'news') return []
  const injected = newsCard.newsDisplayItems
  if (Array.isArray(injected) && injected.length > 0) return injected

  let latest: NewsCuratorItem[] = []
  for (const entry of getMessagesSliceAfterNewsCard(allMessages, newsCard.logId)) {
    if (!isNewsCuratorAnswerMessage(entry)) continue
    const parsed = parseNewsCuratorItems(String(entry.rContent ?? ''))
    if (parsed.length > 0) latest = parsed
  }
  return latest
}

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

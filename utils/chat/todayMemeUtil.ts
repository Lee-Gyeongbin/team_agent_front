import { ref } from 'vue'
import type { ChatMessage } from '~/types/chat'

export const TODAY_MEME_MODEL_ID = 'gemini-3-flash-preview'
export const TODAY_MEME_AGENT_ID = 'AG000011'
export const TODAY_MEME_PROMPT = `너는 한국 커뮤니티 트렌드 및 밈 표현 분석 AI이다.

최근 24시간 이내 한국 커뮤니티 게시글/댓글 데이터를 기반으로,
반복적으로 사용되는 유행 표현, 신조어, 드립, 반응 표현, 유행 소재를 추출한다.
주 커뮤니티는 웃긴대학, 디씨인사이드, 루리웹, 더쿠, 네이트 판, X(트위터), 인스타그램이다.

예시:
- 밤티
- 윤정아 윤정아 왜요 쌤 왜요 쌤
- 널 좋아하는 마음이 막 공룡만해
- 영크크/늙크크
- 말랑이거래
- 버터떡
- 키캡키링
- 냐냐냥!!!
- 귀엽기만 하면 안되나요?

중요:
- 5개만 추출
- 최신 표현 우선 추출
- 의미를 추측해서 단정하지 말 것
- 반복적으로 관찰되지 않은 표현은 생성하지 말 것
- 정치/혐오/성적 표현 및 과도한 욕설 제외
- 직장 환경(SFW)에 부적절한 표현 제외
- "~로 보입니다", "~경향이 있습니다" 형태로 설명
- 이미지나 썸네일을 추측하지 말 것

분석 기준:
1. 최근 24시간 이내 반복 등장 빈도
2. 여러 게시글/댓글에서 반복 사용 여부
3. 댓글 반응 표현으로 소비되는지 여부
4. 커뮤니티 전반 확산 여부

출력 항목:
- rank
- title
- source
- points
- contextLabel
- confidence

규칙:
- points는 반드시 3줄 이상
- contextLabel은 표현 분위기를 짧게 설명
- confidence는 높음 / 중간 / 낮음 사용
- 설명 없이 JSON 배열만 출력

출력 예시:

[
  {
    "rank": 1,
    "title": "영크크 / 늙크크",
    "source": "YouTube Shorts / 코르티스(CORTIS)",
    "points": [
      "'영크크'는 코르티스(CORTIS)의 미발매곡 'Young Creator Crew'에서 반복적으로 들리는 추임새성 발음에서 시작된 표현으로 보입니다",
      "특정 의미를 전달하기보다 말 끝이나 문장 중간에 붙이며 중독성과 리듬감을 즐기는 방식으로 숏폼 및 댓글 문화에서 빠르게 확산되는 경향이 있습니다",
      "'늙크크'는 이러한 '영크크' 포맷을 패러디하면서 반대로 올드한 감성이나 자조적인 분위기를 붙여 사용하는 변형 밈 형태로 함께 소비되는 중입니다"
    ],
    "contextLabel": "추임새형 패러디 밈 표현",
    "confidence": "높음"
  }
]`

export interface TodayMemeItem {
  rank: number
  title: string
  source: string
  points: string[]
  contextLabel?: string
  confidence?: '높음' | '중간' | '낮음'
}

/** 설명 영역 좌측 라벨과 포인트 문구를 행 단위로 묶음 */
export const getTodayMemePointRows = (item: TodayMemeItem) => {
  const labels = ['특정 상황', '사용 패턴', '확산 흐름'] as const
  return item.points.map((text, idx) => ({
    label: labels[idx] ?? `항목 ${idx + 1}`,
    text,
  }))
}

/** 백엔드 `complete.content` 등 — 표준 JSON 루트에서 밈 항목 배열만 추출 */
const rowsFromMemeJsonRoot = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    const k = Object.keys(o).find((x) => {
      const low = x.toLowerCase()
      return low === 'memes' || low === 'meme'
    })
    if (k && Array.isArray(o[k])) return o[k] as unknown[]
  }
  return null
}

const MEME_CONFIDENCE_SET = new Set<string>(['높음', '중간', '낮음'])

const normalizeMemeConfidence = (value: unknown): TodayMemeItem['confidence'] => {
  const s = String(value ?? '').trim()
  return MEME_CONFIDENCE_SET.has(s) ? (s as TodayMemeItem['confidence']) : undefined
}

const normalizeMemePoints = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.map((p) => String(p ?? '').trim()).filter(Boolean)
}

type TodayMemeRawRow = {
  rank?: unknown
  title?: unknown
  source?: unknown
  points?: unknown
  contextLabel?: unknown
  confidence?: unknown
}

const mapRawRowToItem = (row: unknown, idx: number): TodayMemeItem => {
  const item = row as TodayMemeRawRow
  const contextLabel = String(item.contextLabel ?? '').trim()
  return {
    rank: Number(item.rank ?? idx + 1),
    title: String(item.title ?? '').trim(),
    source: String(item.source ?? '').trim(),
    points: normalizeMemePoints(item.points),
    contextLabel: contextLabel || undefined,
    confidence: normalizeMemeConfidence(item.confidence),
  }
}

export const parseTodayMemeItems = (raw: string): TodayMemeItem[] => {
  const text = String(raw ?? '').trim()
  if (!text) return []
  try {
    let root: unknown = JSON.parse(text)
    if (typeof root === 'string') {
      const inner = root.trim()
      if (inner.startsWith('{') || inner.startsWith('[')) root = JSON.parse(inner)
    }
    const rows = rowsFromMemeJsonRoot(root)
    if (!rows?.length) return []
    return rows.map(mapRawRowToItem).filter((item) => item.title && item.source && item.points.length > 0)
  } catch {
    return []
  }
}

export const isTodayMemePrompt = (promptText: string) => String(promptText ?? '').trim() === TODAY_MEME_PROMPT

export const createTodayMemeMessage = (submitted: boolean): ChatMessage => ({
  logId: `today-meme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'meme',
  createdAt: new Date().toISOString(),
  agentId: TODAY_MEME_AGENT_ID,
  memeSubmitted: submitted,
})

const isTodayMemeVisible = ref(false)
const todayMemeRoomIdSet = ref<Set<string>>(new Set())

export const useTodayMeme = () => {
  const registerTodayMemeRoom = (roomId: string) => {
    const next = new Set(todayMemeRoomIdSet.value)
    next.add(roomId)
    todayMemeRoomIdSet.value = next
  }

  const isTodayMemeRoom = (roomId: string) => todayMemeRoomIdSet.value.has(roomId)

  return {
    isTodayMemeVisible,
    registerTodayMemeRoom,
    isTodayMemeRoom,
  }
}

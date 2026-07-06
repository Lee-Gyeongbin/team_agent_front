import { ref } from 'vue'
import type { Agent } from '~/types/agent'
import type { ChatMessage } from '~/types/chat'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'
import { DEFAULT_AUTO_RECOMMEND_CONSTRAINTS } from '~/utils/agent/autoRecommendConfigUtil'

export const AUTO_RECOMMEND_SUB_TY = 'AUTO_RECOMMEND'

export interface AutoRecommendAgentConfig {
  agentType: 'autoRecommend'
  version?: string
  language?: string
  agent?: {
    id?: string
    name?: string
    persona?: string
    mission?: string
  }
  ui?: {
    cardTitle?: string
    cardSubtitle?: string
    cardSubtitleReadonly?: string
    introSubtitle?: string
    requestCompleteTitle?: string
    requestCompleteDesc?: string
    submitButtonLabel?: string
    pendingStatusTexts?: string[]
  }
  engine?: {
    defaultModelId?: string
    apiMode?: 'searchOnly' | 'default'
    prompt?: string
    outputSchema?: {
      type: 'json_array'
      itemFields: string[]
    }
  }
  result?: {
    topN?: number
    nameField?: string
    fields?: Array<{ key: string; label: string; type?: 'link' | 'text' }>
    arrayFields?: Array<{ key: string; label: string }>
  }
  constraints?: string[]
  features?: {
    autoSubmit?: boolean
    hideQuestion?: boolean
    excludeNextQuestions?: boolean
  }
}

export interface AutoRecommendItem {
  rank: number
  title: string
  source: string
  points: string[]
  contextLabel?: string
  confidence?: '높음' | '중간' | '낮음'
}

const parseAutoRecommendConfigCore = (agent: Agent | null | undefined): AutoRecommendAgentConfig | null => {
  const raw = agent?.subCfg?.additionalConfig
  if (!raw) return null
  try {
    const config = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (config?.agentType !== 'autoRecommend') return null
    return config as AutoRecommendAgentConfig
  } catch {
    return null
  }
}

/** svcTy=C · USE_YN=Y · subTy=AUTO_RECOMMEND */
export const isAutoRecommendAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === AUTO_RECOMMEND_SUB_TY
}

/** 지식창고 — useYn 무관 */
export const isAutoRecommendAgentForLibrary = (agent: Pick<Agent, 'svcTy' | 'subCfg'> | null | undefined): boolean => {
  if (!agent || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === AUTO_RECOMMEND_SUB_TY
}

export const parseAutoRecommendConfigFromAgent = (agent: Agent | null | undefined): AutoRecommendAgentConfig | null => {
  if (!isAutoRecommendAgent(agent) && !isAutoRecommendAgentForLibrary(agent)) return null
  return parseAutoRecommendConfigCore(agent)
}

export const resolveAutoRecommendConfigByAgentId = (
  agentId: string,
  agents: Agent[],
): AutoRecommendAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseAutoRecommendConfigFromAgent(agent)
}

export const buildAutoRecommendPrompt = (config: AutoRecommendAgentConfig | null): string => {
  if (!config) return ''

  const topN = config.result?.topN ?? 5
  const itemFields = (config.engine?.outputSchema?.itemFields ?? [])
    .map((field) => String(field).trim())
    .filter(Boolean)
  const constraints = (config.constraints?.length ? config.constraints : DEFAULT_AUTO_RECOMMEND_CONSTRAINTS)
    .map((line) => line.trim())
    .filter(Boolean)

  const lines: string[] = [...constraints]
  if (itemFields.length > 0) {
    lines.push('')
    lines.push('출력 항목:')
    itemFields.forEach((field) => lines.push(`- ${field}`))
    lines.push('')
    lines.push(`반드시 JSON 배열만 출력. 최대 ${topN}개.`)
    const schemaExample = Object.fromEntries(itemFields.map((field) => [field, '']))
    lines.push(JSON.stringify([schemaExample], null, 2))
  }

  return lines.join('\n')
}

export const resolveAutoRecommendPrompt = (agent: Agent | null | undefined): string => {
  const config = parseAutoRecommendConfigFromAgent(agent)
  if (!config) return ''
  const legacyPrompt = String(config.engine?.prompt ?? '').trim()
  if (legacyPrompt && !config.constraints?.length) return legacyPrompt
  return buildAutoRecommendPrompt(config).trim()
}

export const resolveAutoRecommendModelId = (agent: Agent | null | undefined, fallbackModelId = ''): string => {
  const fromConfig = String(parseAutoRecommendConfigFromAgent(agent)?.engine?.defaultModelId ?? '').trim()
  return fromConfig || String(fallbackModelId ?? '').trim()
}

/** 에이전트 목록 기준 숨김 프롬프트(qcontent) 여부 */
export const isAutoRecommendPromptText = (promptText: string, agents: Agent[]): boolean => {
  const trimmed = String(promptText ?? '').trim()
  if (!trimmed) return false
  return agents.some((agent) => isAutoRecommendAgent(agent) && resolveAutoRecommendPrompt(agent) === trimmed)
}

/** 채팅 로그 한 건이 AUTO_RECOMMEND 에이전트 질의인지 */
export const isAutoRecommendLogRow = (row: { agentId?: string; qcontent?: string }, agents: Agent[]): boolean => {
  const agentId = String(row.agentId ?? '').trim()
  if (agentId) {
    const agent = agents.find((a) => a.agentId === agentId)
    if (isAutoRecommendAgent(agent) || isAutoRecommendAgentForLibrary(agent)) return true
  }
  return isAutoRecommendPromptText(String(row.qcontent ?? ''), agents)
}

export const isAutoRecommendLibraryCardItem = (item: { agentId?: string }, agents: Agent[]): boolean => {
  const agentId = String(item.agentId ?? '').trim()
  if (!agentId) return false
  const agent = agents.find((a) => a.agentId === agentId)
  return isAutoRecommendAgentForLibrary(agent)
}

/** 요청(qcontent) 영역 — 전달 완료 UI 노출 여부 */
export const hasAutoRecommendQcontent = (item: { qcontent?: string }) => String(item.qcontent ?? '').trim().length > 0

/** 설명 영역 좌측 라벨과 포인트 문구를 행 단위로 묶음 */
export const getAutoRecommendPointRows = (item: AutoRecommendItem) => {
  const labels = ['특정 상황', '사용 패턴', '확산 흐름'] as const
  return item.points.map((text, idx) => ({
    label: labels[idx] ?? `항목 ${idx + 1}`,
    text,
  }))
}

const rowsFromJsonRoot = (parsed: unknown): unknown[] | null => {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    const k = Object.keys(o).find((x) => {
      const low = x.toLowerCase()
      return low === 'items' || low === 'memes' || low === 'meme' || low === 'results'
    })
    if (k && Array.isArray(o[k])) return o[k] as unknown[]
  }
  return null
}

const CONFIDENCE_SET = new Set<string>(['높음', '중간', '낮음'])

const normalizeConfidence = (value: unknown): AutoRecommendItem['confidence'] => {
  const s = String(value ?? '').trim()
  return CONFIDENCE_SET.has(s) ? (s as AutoRecommendItem['confidence']) : undefined
}

const normalizePoints = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((p) => String(p ?? '').trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean)
  }
  return []
}

type AutoRecommendRawRow = {
  rank?: unknown
  title?: unknown
  source?: unknown
  points?: unknown
  contextLabel?: unknown
  confidence?: unknown
}

const mapRawRowToItem = (row: unknown, idx: number): AutoRecommendItem => {
  const item = row as AutoRecommendRawRow
  const contextLabel = String(item.contextLabel ?? '').trim()
  return {
    rank: Number(item.rank ?? idx + 1),
    title: String(item.title ?? '').trim(),
    source: String(item.source ?? '').trim(),
    points: normalizePoints(item.points),
    contextLabel: contextLabel || undefined,
    confidence: normalizeConfidence(item.confidence),
  }
}

export const parseAutoRecommendItems = (raw: string): AutoRecommendItem[] => {
  const text = String(raw ?? '').trim()
  if (!text) return []
  try {
    const parseCandidates: string[] = [text]
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (codeBlockMatch?.[1]) parseCandidates.push(codeBlockMatch[1].trim())
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch?.[0]) parseCandidates.push(arrayMatch[0].trim())

    let root: unknown = null
    for (const candidate of parseCandidates) {
      try {
        root = JSON.parse(candidate)
        break
      } catch {
        // 다음 후보 문자열로 파싱 재시도
      }
    }
    if (root == null) return []

    if (typeof root === 'string') {
      const inner = root.trim()
      if (inner.startsWith('{') || inner.startsWith('[')) root = JSON.parse(inner)
    }
    const rows = rowsFromJsonRoot(root)
    if (!rows?.length) return []
    return rows.map(mapRawRowToItem).filter((item) => item.title && item.points.length > 0)
  } catch {
    return []
  }
}

export const createAutoRecommendMessage = (submitted: boolean, agentId: string): ChatMessage => ({
  logId: `auto-recommend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'autoRecommend',
  createdAt: new Date().toISOString(),
  agentId,
  autoRecommendSubmitted: submitted,
})

/** AUTO_RECOMMEND 파이프라인 answer — 카드에서만 JSON 표시 */
export const isAutoRecommendAnswerMessage = (message: ChatMessage, agents: Agent[]): boolean => {
  if (message.type !== 'answer') return false
  const agentId = String(message.agentId ?? '').trim()
  if (!agentId) return false
  const agent = agents.find((a) => a.agentId === agentId)
  return isAutoRecommendAgent(agent) || isAutoRecommendAgentForLibrary(agent)
}

const isAutoRecommendVisible = ref(false)
const autoRecommendRoomIdSet = ref<Set<string>>(new Set())

export const useAutoRecommend = () => {
  const openAutoRecommend = () => {
    isAutoRecommendVisible.value = true
  }

  const closeAutoRecommend = () => {
    isAutoRecommendVisible.value = false
  }

  const registerAutoRecommendRoom = (roomId: string) => {
    const id = String(roomId ?? '').trim()
    if (!id) return
    autoRecommendRoomIdSet.value = new Set([...autoRecommendRoomIdSet.value, id])
  }

  const isAutoRecommendRoom = (roomId: string) => autoRecommendRoomIdSet.value.has(String(roomId ?? '').trim())

  return {
    isAutoRecommendVisible,
    openAutoRecommend,
    closeAutoRecommend,
    registerAutoRecommendRoom,
    isAutoRecommendRoom,
  }
}

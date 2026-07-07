import { ref } from 'vue'
import type { Agent } from '~/types/agent'
import type { ChatLogListRow, ChatMessage } from '~/types/chat'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'
import { DEFAULT_AUTO_RECOMMEND_CONSTRAINTS } from '~/utils/agent/autoRecommendConfigUtil'

// ━━━ 상수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━ 에이전트 판별 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const isAutoRecommendAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === AUTO_RECOMMEND_SUB_TY
}

export const isAutoRecommendAgentForLibrary = (agent: Pick<Agent, 'svcTy' | 'subCfg'> | null | undefined): boolean => {
  if (!agent || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === AUTO_RECOMMEND_SUB_TY
}

// ━━━ Config 파서 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parseAutoRecommendConfigCore = (agent: Agent): AutoRecommendAgentConfig | null => {
  const raw = agent.subCfg?.additionalConfig
  if (!raw) return null
  try {
    const config = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (config?.agentType !== 'autoRecommend') return null
    return config as AutoRecommendAgentConfig
  } catch {
    return null
  }
}

export const parseAutoRecommendConfigFromAgent = (agent: Agent | null | undefined): AutoRecommendAgentConfig | null => {
  if (!agent || !isAutoRecommendAgent(agent)) return null
  return parseAutoRecommendConfigCore(agent)
}

export const parseAutoRecommendConfigFromAgentForLibrary = (
  agent: Agent | null | undefined,
): AutoRecommendAgentConfig | null => {
  if (!agent || !isAutoRecommendAgentForLibrary(agent)) return null
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

export const resolveAutoRecommendConfigByAgentIdForLibrary = (
  agentId: string,
  agents: Agent[],
): AutoRecommendAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseAutoRecommendConfigFromAgentForLibrary(agent)
}

const resolveAutoRecommendConfig = (agent: Agent | null | undefined): AutoRecommendAgentConfig | null =>
  parseAutoRecommendConfigFromAgent(agent) ?? parseAutoRecommendConfigFromAgentForLibrary(agent)

// ━━━ 프롬프트 빌더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const buildAutoRecommendPrompt = (config: AutoRecommendAgentConfig | null): string => {
  if (!config) return ''

  const topN = config.result?.topN ?? 5
  const itemFields = (config.engine?.outputSchema?.itemFields ?? [])
    .map((field) => String(field).trim())
    .filter(Boolean)
  const constraints = (config.constraints?.length ? config.constraints : DEFAULT_AUTO_RECOMMEND_CONSTRAINTS)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((constraint) => constraint.replace(/topN/g, String(topN)))

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
  const config = resolveAutoRecommendConfig(agent)
  if (!config) return ''
  const legacyPrompt = String(config.engine?.prompt ?? '').trim()
  if (legacyPrompt && !config.constraints?.length) return legacyPrompt
  return buildAutoRecommendPrompt(config).trim()
}

export const resolveAutoRecommendModelId = (agent: Agent | null | undefined, fallbackModelId = ''): string => {
  const fromConfig = String(resolveAutoRecommendConfig(agent)?.engine?.defaultModelId ?? '').trim()
  return fromConfig || String(fallbackModelId ?? '').trim()
}

// ━━━ 프롬프트·로그 판별 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const isAutoRecommendAgentPrompt = (promptText: string, agents: Agent[]): boolean => {
  const trimmed = String(promptText ?? '').trim()
  if (!trimmed) return false
  return agents.some((agent) => isAutoRecommendAgent(agent) && resolveAutoRecommendPrompt(agent) === trimmed)
}

export const isAutoRecommendLogRow = (row: { agentId?: string; qcontent?: string }, agents: Agent[]): boolean => {
  const agentId = String(row.agentId ?? '').trim()
  if (agentId) {
    const agent = agents.find((a) => a.agentId === agentId)
    if (isAutoRecommendAgent(agent) || isAutoRecommendAgentForLibrary(agent)) return true
  }
  return isAutoRecommendAgentPrompt(String(row.qcontent ?? ''), agents)
}

export const isAutoRecommendLibraryCardItem = (item: { agentId?: string }, agents: Agent[]): boolean => {
  const agentId = String(item.agentId ?? '').trim()
  if (!agentId) return false
  const agent = agents.find((a) => a.agentId === agentId)
  return isAutoRecommendAgentForLibrary(agent)
}

export const hasAutoRecommendQcontent = (item: { qcontent?: string }) => String(item.qcontent ?? '').trim().length > 0

export const getAutoRecommendPointRows = (item: AutoRecommendItem) => {
  const labels = ['특정 상황', '사용 패턴', '확산 흐름'] as const
  return item.points.map((text, idx) => ({
    label: labels[idx] ?? `항목 ${idx + 1}`,
    text,
  }))
}

// ━━━ JSON 파싱 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

export const parseAutoRecommendJsonArray = (raw: string): AutoRecommendItem[] => {
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

// ━━━ 메시지 생성 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const genAutoRecommendLogId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createAutoRecommendCardMessage = (opts: {
  agentId: string
  createdAt: string
  svcTy?: string
  refId?: string
  submitted?: boolean
  displayItems?: AutoRecommendItem[]
}): ChatMessage => ({
  logId: genAutoRecommendLogId('auto-rec'),
  type: 'autoRecommend',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  autoRecommendSubmitted: opts.submitted ?? false,
  ...(opts.displayItems?.length ? { autoRecommendDisplayItems: opts.displayItems } : {}),
})

// ━━━ 메시지 연결 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const isAutoRecommendPipelineAnswer = (message: ChatMessage, agents: Agent[]): boolean => {
  if (message.type !== 'answer') return false
  const agentId = String(message.agentId ?? '').trim()
  if (!agentId) return false
  const agent = agents.find((a) => a.agentId === agentId)
  return isAutoRecommendAgent(agent) || isAutoRecommendAgentForLibrary(agent)
}

export const buildAutoRecommendMessagesFromLogRow = (
  row: ChatLogListRow,
  answerMessage: ChatMessage,
  agents: Agent[] = [],
): ChatMessage[] | null => {
  if (!isAutoRecommendLogRow(row, agents)) return null
  if (!String(row.qcontent ?? '').trim()) return null

  const logId = String(row.logId ?? '')
  const createdAt = row.createDt ?? ''
  const agentId = typeof row.agentId === 'string' ? row.agentId.trim() : ''
  const displayItems = parseAutoRecommendJsonArray(String(row.rcontent ?? ''))

  return [
    {
      logId: `${logId}-auto-recommend`,
      type: 'autoRecommend',
      createdAt,
      agentId,
      autoRecommendSubmitted: true,
      ...(displayItems.length > 0 ? { autoRecommendDisplayItems: displayItems } : {}),
    },
    answerMessage,
  ]
}

// ━━━ 방 등록 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const autoRecommendRoomIds = ref<Set<string>>(new Set())

export const registerAutoRecommendRoom = (roomId: string) => {
  const id = String(roomId ?? '').trim()
  if (!id) return
  autoRecommendRoomIds.value = new Set([...autoRecommendRoomIds.value, id])
}

export const isAutoRecommendRoom = (roomId: string) => autoRecommendRoomIds.value.has(String(roomId ?? '').trim())

// ━━━ 인덱스 오버레이 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isAutoRecommendVisible = ref(false)

export const useAutoRecommend = () => {
  const openAutoRecommend = () => {
    isAutoRecommendVisible.value = true
  }

  const closeAutoRecommend = () => {
    isAutoRecommendVisible.value = false
  }

  return {
    isAutoRecommendVisible,
    openAutoRecommend,
    closeAutoRecommend,
    registerAutoRecommendRoom,
    isAutoRecommendRoom,
  }
}

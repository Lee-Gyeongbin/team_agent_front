import type { Agent, TranslateAgentConfig } from '~/types/agent'
import { getAgentSubTy } from '~/utils/chat/surveyUtil'
import type { ChatMessage, ChatMessageAttachment, TranslateFormPayload } from '~/types/chat'
import { useApi } from '~/composables/com/useApi'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'

// ━━━ 상수 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TRANSLATE_SUB_TY = 'TRANSLATE'

const TRANSLATE_BASE_PROMPT = [
  '당신은 전문 비즈니스 번역가입니다.',
  '- 입력 텍스트를 목표 언어로 번역하세요.',
  '- 단순 직역이 아닌 비즈니스 문서/메일/채팅 맥락에 맞는 의미를 전달하세요.',
  '- 지정된 톤을 유지하거나 목표 언어 관습에 맞게 자연스럽게 조정하세요.',
  '- 숫자, 날짜, 고유명사, 회사명, 제품명, 약어는 원문 그대로 유지하세요.',
  '- 원문의 줄바꿈, 목록, 강조 등 서식을 그대로 유지하세요.',
  '- 번역 결과 외 다른 설명은 출력하지 마세요.',
].join('\n')

// ━━━ 에이전트 판별 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** svcTy=W · USE_YN=Y · subTy=TRANSLATE — 채팅 에이전트 선택·전송용 */
export const isTranslateAgent = (agent: Agent | null | undefined): boolean => {
  if (!agent || agent.useYn !== 'Y' || agent.svcTy !== 'W') return false
  return getAgentSubTy(agent.subCfg) === TRANSLATE_SUB_TY
}

// ━━━ Config 파서 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parseTranslateConfigCore = (agent: Agent): TranslateAgentConfig | null => {
  const raw = agent.subCfg?.additionalConfig
  if (!raw) return null
  const config = typeof raw === 'string' ? JSON.parse(raw) : raw
  if (config?.agentType !== 'translate') return null
  return config as TranslateAgentConfig
}

export const parseTranslateConfigFromAgent = (agent: Agent): TranslateAgentConfig | null => {
  if (!isTranslateAgent(agent)) return null
  return parseTranslateConfigCore(agent)
}

export const resolveTranslateConfigByAgentId = (agentId: string, agents: Agent[]): TranslateAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseTranslateConfigFromAgent(agent)
}

/** subTy=TRANSLATE — 지식창고 상세·카드 UI용 (useYn·svcTy 무관) */
export const isTranslateAgentForLibrary = (agent: Pick<Agent, 'subCfg'> | null | undefined): boolean => {
  if (!agent) return false
  return getAgentSubTy(agent.subCfg) === TRANSLATE_SUB_TY
}

/** 지식창고 — selectAgentListForLibrary 에이전트는 useYn과 무관하게 번역 카드 재현 */
export const parseTranslateConfigFromAgentForLibrary = (agent: Agent): TranslateAgentConfig | null => {
  if (!isTranslateAgentForLibrary(agent)) return null
  return parseTranslateConfigCore(agent)
}

export const resolveTranslateConfigByAgentIdForLibrary = (
  agentId: string,
  agents: Agent[],
): TranslateAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  if (!agent) return null
  return parseTranslateConfigFromAgentForLibrary(agent)
}

/** 저장된 qcontent가 번역 에이전트 합성 프롬프트인지 */
export const isTranslateAgentPromptText = (qcontent: string): boolean => {
  const raw = String(qcontent ?? '').trim()
  if (!raw) return false
  if (raw.includes('## 번역 조건')) return true
  return raw.startsWith('다음 첨부 문서를') && raw.includes('톤으로 번역해 주세요')
}

/** 라이브러리 카드 — TRANSLATE readonly UI 표시 여부 (에이전트 미로드 시 qcontent 폴백) */
export const isTranslateLibraryCardItem = (item: { agentId?: string; qcontent?: string }, agents: Agent[]): boolean => {
  const agentId = (item.agentId ?? '').trim()
  if (agentId) {
    const agent = agents.find((a) => a.agentId === agentId)
    if (agent && isTranslateAgentForLibrary(agent)) return true
  }
  return isTranslateAgentPromptText(item.qcontent ?? '')
}

// ━━━ 폼 초기값 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const createEmptyTranslateFormPayload = (config: TranslateAgentConfig): TranslateFormPayload => ({
  sourceText: '',
  targetLang: config.languages[0]?.value ?? '',
  tone: config.tones[0]?.value ?? '',
})

/** 저장된 합성 프롬프트(qcontent) → readonly 번역 카드 폼 값 복원 */
export const parseTranslatePayloadFromPrompt = (
  promptText: string,
  defaultPayload: TranslateFormPayload,
  attachments: ChatMessageAttachment[] = [],
): TranslateFormPayload => {
  const raw = String(promptText ?? '').trim()
  if (!raw) return { ...defaultPayload }

  const nextPayload: TranslateFormPayload = { ...defaultPayload }
  const targetLangLine = raw.match(/^- 목표 언어:\s*(.+)$/m)?.[1]?.trim()
  const toneLine = raw.match(/^- 톤:\s*(.+)$/m)?.[1]?.trim()
  const sourceTextMatch = raw.match(/## 원문\s*\n([\s\S]*)$/)
  const sourceText = sourceTextMatch?.[1]?.trim()
  const hasFileInstruction = raw.startsWith('다음 첨부 문서를') && raw.includes('톤으로 번역해 주세요')

  if (targetLangLine) {
    nextPayload.targetLang = targetLangLine
  }
  if (toneLine) {
    nextPayload.tone = toneLine
  }
  if (sourceText) {
    nextPayload.sourceText = sourceText
  }
  if (hasFileInstruction) {
    nextPayload.fileName = attachments[0]?.fileName || '첨부파일'
    nextPayload.sourceText = ''
  }
  return nextPayload
}

// ━━━ 프롬프트 빌더 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const buildTranslatePrompt = (formValues: TranslateFormPayload, config: TranslateAgentConfig): string => {
  const targetLangLabel =
    config.languages.find((l) => l.value === formValues.targetLang)?.label ?? formValues.targetLang
  const toneLabel = config.tones.find((t) => t.value === formValues.tone)?.label ?? formValues.tone

  const lines: string[] = []
  lines.push(TRANSLATE_BASE_PROMPT)
  lines.push('')
  lines.push('## 번역 조건')
  lines.push(`- 목표 언어: ${targetLangLabel}`)
  lines.push(`- 톤: ${toneLabel}`)
  lines.push('')
  lines.push('## 원문')
  lines.push(formValues.sourceText)

  return lines.join('\n')
}

/** 파일 업로드 모드 — 짧은 번역 지시문 (본문은 첨부파일에서 백엔드가 직접 추출) */
export const buildTranslateFileInstruction = (
  formValues: TranslateFormPayload,
  config: TranslateAgentConfig,
): string => {
  const targetLangLabel =
    config.languages.find((l) => l.value === formValues.targetLang)?.label ?? formValues.targetLang
  const toneLabel = config.tones.find((t) => t.value === formValues.tone)?.label ?? formValues.tone
  return `다음 첨부 문서를 ${targetLangLabel}로, ${toneLabel} 톤으로 번역해 주세요.`
}

/** TRANSLATE 에이전트 로그 여부 — agentId → isTranslateAgent 판별 (svcTy 무관) */
export const isTranslateAgentPrompt = (agent: Agent | null | undefined): boolean => {
  return isTranslateAgent(agent)
}

// ━━━ 메시지 생성 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const genTranslateLogId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const createTranslateCardMessage = (opts: {
  agentId: string
  createdAt: string
  svcTy?: string
  refId?: string
  config: TranslateAgentConfig
}): ChatMessage => ({
  logId: genTranslateLogId('translate-form'),
  type: 'translation',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  translateFormPayload: createEmptyTranslateFormPayload(opts.config),
  translateSubmitted: false,
})

export const createReadonlyTranslateMessage = (
  payload: TranslateFormPayload,
  opts: { agentId: string; createdAt: string; svcTy?: string; refId?: string },
): ChatMessage => ({
  logId: genTranslateLogId('translate-form-ro'),
  type: 'translation',
  agentId: opts.agentId,
  createdAt: opts.createdAt,
  svcTy: opts.svcTy ?? 'C',
  refId: opts.refId ?? '',
  translateFormPayload: { ...payload },
  translateSubmitted: true,
})

// ━━━ TRANSLATE 방 등록 (해당 방에서만 합성 프롬프트 question 숨김) ━━━

const translateRoomIds = ref<Set<string>>(new Set())

export const registerTranslateRoom = (roomId: string) => {
  const id = String(roomId ?? '').trim()
  if (!id) return
  translateRoomIds.value = new Set([...translateRoomIds.value, id])
}

export const isTranslateRoom = (roomId: string) => translateRoomIds.value.has(String(roomId ?? '').trim())

// ━━━ 인덱스 오버레이 상태 ━━━━━━━━━━━━━━━━━━━━━━━━

const isTranslateVisible = ref(false)

export const useTranslateAgent = () => {
  const openTranslateAgent = () => {
    isTranslateVisible.value = true
  }
  const closeTranslateAgent = () => {
    isTranslateVisible.value = false
  }
  return {
    isTranslateVisible,
    openTranslateAgent,
    closeTranslateAgent,
    registerTranslateRoom,
    isTranslateRoom,
  }
}

// ━━━ 즉시번역(전역 드래그 번역) 상태 ━━━━━━━━━━━━━━━━━━━━━━━━

export interface InstantTranslateOptions {
  targetLangLabel: string
  toneLabel: string
}

const isInstantTranslateActive = ref(false)
const instantTranslateOptions = ref<InstantTranslateOptions>({ targetLangLabel: '', toneLabel: '' })

export const useInstantTranslate = () => {
  const enableInstantTranslate = (options: InstantTranslateOptions) => {
    instantTranslateOptions.value = options
    isInstantTranslateActive.value = true
  }
  const updateInstantTranslateOptions = (options: InstantTranslateOptions) => {
    instantTranslateOptions.value = options
  }
  const disableInstantTranslate = () => {
    isInstantTranslateActive.value = false
  }
  return {
    isInstantTranslateActive,
    instantTranslateOptions,
    enableInstantTranslate,
    updateInstantTranslateOptions,
    disableInstantTranslate,
  }
}

// ━━━ 즉시번역 API 호출 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 드래그 선택 텍스트를 즉시 번역 — 채팅 로그를 남기지 않는 동기 호출 */
export const requestInstantTranslate = async (content: string, options: InstantTranslateOptions): Promise<string> => {
  const { post } = useApi()
  const res = await post<{ success: boolean; translatedText?: string; message?: string }>(
    '/ai/chatbot/instantTranslate.do',
    { content, targetLang: options.targetLangLabel, tone: options.toneLabel },
  )
  if (!res.success || !res.translatedText) {
    throw new Error(res.message || '번역에 실패했습니다.')
  }
  return res.translatedText
}

// ━━━ 번역 결과 파일 다운로드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 번역 에이전트 답변(텍스트/파일 업로드 모드 공통) — 형식 선택 후 파일 다운로드 컨트롤을 노출할 대상인지 판별 */
export const isTranslateTextResultAnswer = (message: ChatMessage, agents: Agent[]): boolean => {
  if (message.type !== 'answer') return false
  if (!message.agentId) return false
  const agent = agents.find((a) => a.agentId === message.agentId)
  return isTranslateAgent(agent)
}

/** 번역 결과 텍스트를 .docx/.txt 파일로 변환하여 다운로드 */
export const downloadTranslationResult = async (content: string, fileType: string, fileName: string): Promise<void> => {
  const { postBlob } = useApi()
  const blob = await postBlob('/ai/chatbot/exportTranslationFile.do', { content, fileType, fileName })
  downloadBlobAsFile(blob, `${fileName}.${fileType}`)
}

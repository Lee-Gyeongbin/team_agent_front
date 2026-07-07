import { useChatRooms } from '~/composables/chat/useChatRooms'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useDataQuestionApi } from '~/composables/chat/useDataQuestionApi'
import type { ChatMessage } from '~/types/chat'
import { EMPTY_CHAT_ROOM } from '~/types/chat'
import type { ClarificationOption, ClarificationQuestion, QuestionDiagnosis } from '~/types/dataQuestion'
import {
  buildDataQuestionThemeStyle,
  buildFormulaItems,
  countRequiredMissing,
  FORMULA_EXAMPLE_QUESTION,
  resolveDataQuestionThemeIconClass,
  scoreFromText,
} from '~/utils/chat/dataQuestionRubric'
import { EPHEMERAL_VALIDATION_ROOM_ID, isEphemeralValidationRoomId } from '~/utils/chat/chatRoomIdUtil'

/**
 * 데이터분석(SVC_TY='S') 질문 품질 게이트
 *
 * 흐름: 질문 작성 → [검증] LLM 진단 → 통과 시에만 [요청](Text-to-SQL) 활성.
 * - 평가기준/배점/임계는 백엔드 LLM 프롬프트에 위치 (프론트는 결과만 소비)
 * - 게이트는 'S' 모드에서만 적용 — 다른 에이전트 동작에 영향 없음
 * - 검증 후 질문을 수정하면 자동으로 다시 검증 필요 상태가 됨(파생 계산)
 *
 * 모듈 단일 상태 — ChatInput(버튼)과 DataQuestionGuide(보완)가 공유.
 */

type GateStatus = 'idle' | 'validating' | 'needs_fix' | 'passed'

const gateStatus = ref<GateStatus>('idle')
const diagnosis = ref<QuestionDiagnosis | null>(null)
const validatedQuestion = ref('')
const isValidating = ref(false)
const clarificationSelections = ref<Record<string, string>>({})

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

/** 검증 미리보기 채팅방 제목 — 길면 말줄임 */
export const truncateQuestionTitle = (question: string, maxLen = 40): string =>
  question.length > maxLen ? `${question.slice(0, maxLen)}…` : question

export interface ClarificationSectionView {
  /** selections 맵 키 — item 중복 시에도 항목별로 구분 */
  selectionKey: string
  item: string
  index: number
  warning: string
  options: ClarificationOption[]
}

export interface PreviewTextPart {
  text: string
  isPlaceholder: boolean
}

/** 보완 질문 배열 인덱스 → selections 키 */
export const buildClarificationSelectionKey = (index: number): string => `cq_${index}`

/** 백엔드 options 문자열 배열 → UI 선택지 */
const normalizeClarificationOptions = (options?: string[]): ClarificationOption[] =>
  (options ?? [])
    .map((option) => option.trim())
    .filter(Boolean)
    .map((option) => ({ label: option, value: option }))

const shortenWarning = (question: string) => question.replace(/\?+$/, '').trim()

const PLACEHOLDER_TOKEN_PATTERN = /\{([^}]+)\}/g

/** 백엔드 placeholder 라벨 — `{매출액}` / `매출액` 모두 허용 */
const normalizePlaceholderLabel = (raw?: string): string => {
  const text = raw?.trim() ?? ''
  if (!text) return ''
  const braced = /^\{([^}]+)\}$/.exec(text)
  return (braced?.[1] ?? text).trim()
}

/** 템플릿 내 `{토큰}` 목록 — 등장 순서 유지 */
export const extractPlaceholderTokens = (template: string): string[] => {
  const tokens: string[] = []
  let match = PLACEHOLDER_TOKEN_PATTERN.exec(template)
  while (match) {
    const token = match[1]?.trim()
    if (token) tokens.push(token)
    match = PLACEHOLDER_TOKEN_PATTERN.exec(template)
  }
  return tokens
}

const getDiagnosisSummaryLabel = (showDiag: boolean, diag: QuestionDiagnosis | null, isReadyPass: boolean): string => {
  if (!showDiag || !diag) return ''
  const sc = Math.round(diag.readinessScore ?? 0)
  return isReadyPass ? `검증 통과 · ${sc}점` : `검증 점수 ${sc}점 · 보완 필요`
}

/** clarificationQuestion.placeholder → questionPreview 내 `{토큰}` 키 */
const resolvePlaceholderToken = (cq: ClarificationQuestion, index: number, template: string): string => {
  const fromBackend = normalizePlaceholderLabel(cq.placeholder)
  if (fromBackend) return fromBackend

  const tokens = extractPlaceholderTokens(template)
  return tokens[index] ?? ''
}

/** 진단 응답 → 화면 섹션(경고 + 선택지) */
export const buildClarificationSections = (diagnosis: QuestionDiagnosis): ClarificationSectionView[] =>
  (diagnosis.clarificationQuestions ?? [])
    .map((cq, index) => ({
      selectionKey: buildClarificationSelectionKey(index),
      item: cq.item,
      index,
      warning: shortenWarning(cq.question),
      options: normalizeClarificationOptions(cq.options),
    }))
    .filter((section) => section.warning)

/** `{{토큰}}` → `{토큰}` — 과거 클라이언트 추론으로 중첩된 경우만 정리 */
const normalizePreviewTemplate = (template: string): string => template.replace(/\{\{([^}]+)\}\}/g, '{$1}')

/** questionPreview 템플릿 — 백엔드 값 우선, 없으면 원본 질문 그대로 */
const resolvePreviewTemplate = (originalQuestion: string, diagnosis: QuestionDiagnosis): string =>
  normalizePreviewTemplate(diagnosis.questionPreview?.trim() || originalQuestion.trim())

/** questionPreview / rewrittenQuestion 템플릿에 선택값 반영 — `{매출액}` 형식 */
const applyPreviewTemplate = (
  template: string,
  selections: Record<string, string>,
  diagnosis: QuestionDiagnosis,
): string => {
  let result = template

  for (const [index, cq] of (diagnosis.clarificationQuestions ?? []).entries()) {
    const selectionKey = buildClarificationSelectionKey(index)
    const value = selections[selectionKey]?.trim()
    if (!value) continue

    const token = resolvePlaceholderToken(cq, index, template)
    if (!token) continue

    result = result.replaceAll(`{${token}}`, value)
  }

  return result.replace(/\s+/g, ' ').trim()
}

/** 보완된 질문 미리보기 문장 */
export const buildClarificationPreviewText = (
  originalQuestion: string,
  diagnosis: QuestionDiagnosis,
  selections: Record<string, string>,
): string => {
  if (diagnosis.status === 'READY' && diagnosis.rewrittenQuestion?.trim()) {
    return diagnosis.rewrittenQuestion.trim()
  }

  const previewTemplate = resolvePreviewTemplate(originalQuestion, diagnosis)
  if (previewTemplate) {
    return applyPreviewTemplate(previewTemplate, selections, diagnosis)
  }

  if (diagnosis.rewrittenQuestion?.trim()) {
    return applyPreviewTemplate(normalizePreviewTemplate(diagnosis.rewrittenQuestion.trim()), selections, diagnosis)
  }

  return originalQuestion.trim()
}

const hasUnresolvedPlaceholders = (text: string) => /\{[^}]+\}/.test(text)

/** 보완 항목 전체 선택·입력 + 미리보기 치환 완료 여부 */
export const isClarificationComplete = (
  originalQuestion: string,
  diagnosis: QuestionDiagnosis,
  selections: Record<string, string>,
): boolean => {
  const items = diagnosis.clarificationQuestions ?? []
  if (!items.length) return false
  if (!items.every((_, index) => Boolean(selections[buildClarificationSelectionKey(index)]?.trim()))) return false

  const preview = buildClarificationPreviewText(originalQuestion, diagnosis, selections)
  return !hasUnresolvedPlaceholders(preview)
}

/** 선택형 보완 질문 존재 여부 */
export const hasInteractiveClarification = (diagnosis: QuestionDiagnosis): boolean =>
  (diagnosis.clarificationQuestions?.length ?? 0) > 0

const STATUS_GUIDANCE_LABELS: Record<QuestionDiagnosis['status'], string> = {
  CLARIFICATION_REQUIRED: '질문 조건을 보완해 주세요',
  TERM_AMBIGUOUS: '모호한 용어를 구체화해 주세요',
  OUT_OF_SCOPE: '현재 데이터로는 답변할 수 없는 질문이에요',
  READY: '',
}

/** 보완 질문 없을 때 안내 문구 */
const getDiagnosisStatusLabel = (status: QuestionDiagnosis['status']): string =>
  STATUS_GUIDANCE_LABELS[status] || '질문을 보완해 주세요'

/** 보완 질문 없을 때 표시할 안내 목록 */
export const buildDiagnosisGuidanceItems = (diagnosis: QuestionDiagnosis): string[] => {
  const items: string[] = []
  const statusLabel = getDiagnosisStatusLabel(diagnosis.status)
  if (statusLabel) items.push(statusLabel)

  const intent = diagnosis.interpretedIntent?.trim()
  if (intent) items.push(intent)

  for (const alternative of diagnosis.alternatives ?? []) {
    const text = alternative.trim()
    if (text) items.push(text)
  }

  return items
}

/** `{매출액}` 플레이스홀더 하이라이트용 분할 */
export const splitPreviewTextParts = (text: string): PreviewTextPart[] => {
  const parts: PreviewTextPart[] = []
  const pattern = /(\{[^}]+\})/g
  let lastIndex = 0
  let match = pattern.exec(text)
  while (match) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isPlaceholder: false })
    }
    parts.push({ text: match[1], isPlaceholder: true })
    lastIndex = match.index + match[1].length
    match = pattern.exec(text)
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isPlaceholder: false })
  }
  return parts.length ? parts : [{ text, isPlaceholder: false }]
}

/** 검증 미리보기용 로컬 메시지 쌍 (질문 + 보완 카드) */
export const buildValidationPreviewMessages = (
  question: string,
  diag: QuestionDiagnosis,
  agentId = '',
): ChatMessage[] => {
  const now = new Date().toISOString()
  const qLogId = `dq-preview-q-${Date.now()}`
  const aLogId = `dq-preview-a-${Date.now() + 1}`
  const trimmedAgentId = agentId.trim()

  return [
    {
      logId: qLogId,
      id: qLogId,
      type: 'question',
      qContent: question,
      svcTy: 'S',
      createdAt: now,
      chatLogMissing: true,
      ...(trimmedAgentId ? { agentId: trimmedAgentId } : {}),
    },
    {
      logId: aLogId,
      id: aLogId,
      type: 'dataQuestionClarification',
      qContent: '',
      rContent: '',
      svcTy: 'S',
      createdAt: now,
      chatLogMissing: true,
      dataQuestionDiagnosis: diag,
      dataQuestionOriginalQuestion: question,
      ...(trimmedAgentId ? { agentId: trimmedAgentId } : {}),
    },
  ]
}

export const useDataQuestionGate = () => {
  const { chatMessage, chatRoom } = useChatRooms()
  const { messages } = useChatMessages()
  const { activeSearchModes, riskAgentActive, subOptions, selectedSubOptions, selectedChatAgentId } = useChatStore()
  const { fetchDiagnoseQuestion } = useDataQuestionApi()

  /** 데이터분석(S) 모드에서만 게이트 적용 */
  const isGateActive = computed(() => activeSearchModes.value.includes('S') && !riskAgentActive.value)

  /** 검증·진단 대상 데이터마트 ID */
  const currentDatamartId = computed(() => {
    const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
    return selected ?? String(subOptions.value[0]?.value ?? '')
  })

  /** 보완 카드 미리보기 진행 중 */
  const isClarificationPreviewActive = computed(() =>
    messages.value.some((message) => message.type === 'dataQuestionClarification'),
  )

  /** 검증 시점 질문과 현재 질문이 동일한지 (편집하면 무효화) — 보완 진행 중엔 입력 비워도 유지 */
  const matchesValidated = computed(() => {
    if (isClarificationPreviewActive.value) {
      const input = normalize(chatMessage.value)
      return !input || input === normalize(validatedQuestion.value)
    }
    return normalize(chatMessage.value) === normalize(validatedQuestion.value)
  })

  /** 검증 통과 + 미편집 상태 */
  const isValidated = computed(() => gateStatus.value === 'passed' && matchesValidated.value)

  /** 진단 결과(보완 등) 노출 여부 — 편집으로 stale 되면 숨김 */
  const showDiagnosis = computed(() => !!diagnosis.value && matchesValidated.value)

  /** 필수항목(무엇을·기간) 충족 여부 — 미충족 시 검증 요청 자체를 막는다 */
  const requiredFilled = computed(() => {
    const sc = scoreFromText(chatMessage.value)
    return sc.criteria.filter((c) => c.required).every((c) => c.met)
  })

  /** 전송 가능 — 게이트 비활성(다른 에이전트)이면 항상 true */
  const canSend = computed(() => (isGateActive.value ? isValidated.value : true))

  const showValidationPreview = async (question: string, diag: QuestionDiagnosis) => {
    clarificationSelections.value = {}
    const agentId = selectedChatAgentId.value ?? ''
    const previewMessages = buildValidationPreviewMessages(question, diag, agentId)
    const alreadyPreview = isEphemeralValidationRoomId(chatRoom.value.roomId)
    const hasRealRoom = !!chatRoom.value.roomId && !alreadyPreview
    const previewTitle = truncateQuestionTitle(question)

    if (hasRealRoom) {
      const withoutPreview = messages.value.filter(
        (message) =>
          message.type !== 'dataQuestionClarification' &&
          !(message.chatLogMissing && message.type === 'question' && message.qContent === question),
      )
      messages.value = [
        ...withoutPreview,
        previewMessages.find((message) => message.type === 'question')!,
        previewMessages.find((message) => message.type === 'dataQuestionClarification')!,
      ]
      chatMessage.value = ''
      return
    }

    chatRoom.value = {
      roomId: EPHEMERAL_VALIDATION_ROOM_ID,
      title: previewTitle,
      qContent: question,
      createdAt: new Date().toISOString(),
      svcTy: 'S',
      roomTitle: previewTitle,
      fixYn: 'N',
    }
    messages.value = previewMessages
    chatMessage.value = ''

    if (!alreadyPreview) {
      await navigateTo(`/chat/${EPHEMERAL_VALIDATION_ROOM_ID}`)
    }
  }

  const clearValidationPreview = () => {
    if (!isEphemeralValidationRoomId(chatRoom.value.roomId)) return
    clarificationSelections.value = {}
    messages.value = []
    chatRoom.value = { ...EMPTY_CHAT_ROOM }
  }

  const removeValidationPreviewMessages = () => {
    messages.value = messages.value.filter(
      (message) =>
        !(message.chatLogMissing && (message.type === 'question' || message.type === 'dataQuestionClarification')),
    )
  }

  /** 검증 실행 — 백엔드 LLM 진단 호출 (필수항목 미충족 시 차단) */
  const validate = async () => {
    const question = chatMessage.value.trim()
    if (!question || isValidating.value || !requiredFilled.value) return
    isValidating.value = true
    gateStatus.value = 'validating'
    try {
      const result = await fetchDiagnoseQuestion({ question, datamartId: currentDatamartId.value })
      diagnosis.value = result
      validatedQuestion.value = chatMessage.value
      gateStatus.value = result.status === 'READY' && result.sqlGenerationAllowed ? 'passed' : 'needs_fix'

      if (gateStatus.value === 'passed') {
        removeValidationPreviewMessages()
        return
      }

      await showValidationPreview(question, result)
    } catch {
      diagnosis.value = null
      gateStatus.value = 'idle'
      openToast({ message: '질의 검증에 실패했습니다. 잠시 후 다시 시도해주세요.', type: 'error' })
    } finally {
      isValidating.value = false
    }
  }

  /** 게이트 초기화 (질문 보완 후 재검증 대기) */
  const resetGate = () => {
    gateStatus.value = 'idle'
    diagnosis.value = null
    validatedQuestion.value = ''
  }

  const applyClarificationSelection = (selectionKey: string, option: ClarificationOption) => {
    clarificationSelections.value = {
      ...clarificationSelections.value,
      [selectionKey]: option.value,
    }
  }

  /** 보완 완료 후 최종 질문을 입력창에만 반영 (자동 검증·전송 없음) */
  const submitClarifiedQuestion = () => {
    const clarificationMessage = messages.value.find((message) => message.type === 'dataQuestionClarification')
    const diag = clarificationMessage?.dataQuestionDiagnosis ?? diagnosis.value
    const originalQuestion = clarificationMessage?.dataQuestionOriginalQuestion ?? validatedQuestion.value

    if (!diag || !isClarificationComplete(originalQuestion, diag, clarificationSelections.value)) return

    const finalQuestion = buildClarificationPreviewText(originalQuestion, diag, clarificationSelections.value)
    if (!finalQuestion) return

    chatMessage.value = finalQuestion
    clarificationSelections.value = {}
    removeValidationPreviewMessages()
    resetGate()
  }

  /** 보완 질문 없을 때 — 원래 질문을 입력창에 복원하고 다시 작성 */
  const retryClarifiedQuestion = () => {
    const clarificationMessage = messages.value.find((message) => message.type === 'dataQuestionClarification')
    const originalQuestion = clarificationMessage?.dataQuestionOriginalQuestion ?? validatedQuestion.value

    if (!originalQuestion.trim()) return

    chatMessage.value = originalQuestion
    clarificationSelections.value = {}
    removeValidationPreviewMessages()
    resetGate()
  }

  /** 제안 질문 → 채팅 입력 반영 후 재검증 대기 */
  const applySuggestedQuestion = (question: string) => {
    chatMessage.value = question
    resetGate()
  }

  return {
    isGateActive,
    isValidating,
    isValidated,
    requiredFilled,
    canSend,
    diagnosis,
    showDiagnosis,
    isClarificationPreviewActive,
    validatedQuestion,
    clarificationSelections,
    validate,
    applySuggestedQuestion,
    applyClarificationSelection,
    submitClarifiedQuestion,
    retryClarifiedQuestion,
    clearValidationPreview,
    resetGate,
  }
}

interface DataQuestionGuideProps {
  themeIconClassNm?: string
  themeColorHex?: string
}

/** DataQuestionGuide 컴포넌트 전용 — 게이트 상태와 가이드 UI 상태를 함께 제공 */
export const useDataQuestionGuide = (props: DataQuestionGuideProps) => {
  const { chatMessage } = useChatRooms()
  const {
    isGateActive,
    showDiagnosis,
    diagnosis,
    isClarificationPreviewActive,
    validatedQuestion,
    applySuggestedQuestion,
  } = useDataQuestionGate()

  const isOpen = ref(false)

  const isReadyPass = computed(() => showDiagnosis.value && diagnosis.value?.status === 'READY')
  const summaryLabel = computed(() => getDiagnosisSummaryLabel(showDiagnosis.value, diagnosis.value, isReadyPass.value))

  const justPassed = ref(false)
  watch(isReadyPass, (next, prev) => {
    if (next && prev === false) {
      justPassed.value = true
      window.setTimeout(() => (justPassed.value = false), 900)
    }
  })

  const isDataQuestionActive = isGateActive

  const onToggleGuide = () => {
    isOpen.value = !isOpen.value
  }

  watch(isDataQuestionActive, (active) => {
    if (!active) return
    isOpen.value = false
  })

  const resolvedThemeIconClass = computed(() => resolveDataQuestionThemeIconClass(props.themeIconClassNm))
  const guideThemeStyle = computed(() => buildDataQuestionThemeStyle(props.themeColorHex))

  const formulaTextSource = computed(() => {
    const input = chatMessage.value.trim()
    if (input) return input
    if (isClarificationPreviewActive.value) return validatedQuestion.value.trim()
    return ''
  })
  const formulaScore = computed(() => scoreFromText(formulaTextSource.value))
  const formulaItems = computed(() => buildFormulaItems(formulaScore.value))
  const requiredMissingCount = computed(() => countRequiredMissing(formulaScore.value))

  const onApplyFormulaExample = () => {
    applySuggestedQuestion(FORMULA_EXAMPLE_QUESTION)
  }

  return {
    isDataQuestionActive,
    isOpen,
    requiredMissingCount,
    justPassed,
    resolvedThemeIconClass,
    guideThemeStyle,
    showDiagnosis,
    diagnosis,
    isReadyPass,
    summaryLabel,
    formulaItems,
    formulaExampleQuestion: FORMULA_EXAMPLE_QUESTION,
    onToggleGuide,
    onApplyFormulaExample,
  }
}

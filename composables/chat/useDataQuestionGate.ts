import { useChatRooms } from '~/composables/chat/useChatRooms'
import { useDataQuestionApi } from '~/composables/chat/useDataQuestionApi'
import { useDatamartVocabulary } from '~/composables/chat/useDatamartVocabulary'
import type { SubOption } from '~/types/chat'
import type {
  ClarificationQuestion,
  DatamartTab,
  MandatorySlotCard,
  MandatorySlotKey,
  QuestionDiagnosis,
  QuestionDiagnosisStatus,
  QuestionDraft,
} from '~/types/dataQuestion'
import { FORMULA_DISPLAY_LABELS } from '~/types/dataQuestion'
import {
  buildFormulaItems,
  countRequiredMissing,
  FORMULA_EXAMPLE_QUESTION,
  isFormulaItemClickable,
  scoreFromText,
} from '~/utils/chat/dataQuestionRubric'

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
type FormulaValidationSource = 'chat' | 'draft'
type FormulaControlKey = 'groupBy' | 'calculation' | 'analysis' | 'comparison'
type FormulaOption = {
  label: string
  value: string
  phrase?: string
}

const gateStatus = ref<GateStatus>('idle')
const diagnosis = ref<QuestionDiagnosis | null>(null)
const validatedQuestion = ref('')
const isValidating = ref(false)
const formulaValidationSource = ref<FormulaValidationSource>('chat')

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')

// ===== 모호 용어 치환 =====

/** 진단 응답 clarificationQuestions에서 모호 용어(따옴표 구간) 추출 */
const extractAmbiguousTerms = (questions: string[]): string[] => {
  const terms: string[] = []
  const pattern = /['「『"]([^'」』"]+)['」』"]/g

  for (const question of questions) {
    let match = pattern.exec(question)
    while (match) {
      const term = match[1]?.trim()
      if (term) terms.push(term)
      match = pattern.exec(question)
    }
  }

  return [...new Set(terms)]
}

/** 채팅 질문에서 교체 대상 용어 탐색 — 긴 일치 우선 */
const findAmbiguousTermInMessage = (message: string, ambiguousTerms: string[]): string | null => {
  if (!message.trim() || !ambiguousTerms.length) return null

  const sorted = [...ambiguousTerms].sort((a, b) => b.length - a.length)
  for (const term of sorted) {
    if (message.includes(term)) return term
  }

  for (const term of sorted) {
    const words = term.split(/\s+/).filter((w) => w.length >= 2)
    const sortedWords = [...words].sort((a, b) => b.length - a.length)
    for (const word of sortedWords) {
      if (message.includes(word)) return word
    }
  }

  return sorted[0] ?? null
}

/** 모호 용어를 대체 용어(alternative)로 치환 */
const replaceAmbiguousTerm = (message: string, alternative: string, ambiguousTerms: string[]): string => {
  const target = findAmbiguousTermInMessage(message, ambiguousTerms)
  if (!target) return message
  return message.replace(target, alternative)
}

// ===== 가이드 UI 순수 헬퍼 =====

interface MandatorySlotDef {
  key: MandatorySlotKey
  label: string
  icon: string
  matchItems: string[]
}

const MANDATORY_SLOT_DEFS: MandatorySlotDef[] = [
  { key: 'period', label: '기간', icon: 'icon-calendar', matchItems: ['period', '기간'] },
  { key: 'target', label: '대상', icon: 'icon-user', matchItems: ['target', '대상'] },
]

/** 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 */
const DEFAULT_QUESTION_DRAFT: QuestionDraft = {
  period: '2025년 3월',
  metric: '광고 매출액',
  groupBy: '',
  calculationLabel: '',
  calculationPhrase: '',
  analysisLabel: '',
  analysisPhrase: '',
  comparisonLabel: '비교',
  comparisonPhrase: '비교해줘',
}

const PERIOD_OPTIONS = ['2025년 3월', '최근 1개월', '최근 3개월', '올해', '작년'] as const
const CALCULATION_OPTIONS: FormulaOption[] = [
  { label: '선택 안 함', value: '', phrase: '' },
  { label: '합계', value: '합계', phrase: '합계로' },
  { label: '평균', value: '평균', phrase: '평균으로' },
  { label: '구성비', value: '구성비', phrase: '구성비로' },
]
const ANALYSIS_OPTIONS: FormulaOption[] = [
  { label: '선택 안 함', value: '', phrase: '' },
  { label: '추이', value: '추이', phrase: '추이로 보여줘' },
  { label: '순위', value: '순위', phrase: '순위로 분석해줘' },
  { label: '증감', value: '증감', phrase: '증감을 분석해줘' },
]
const COMPARISON_OPTIONS: FormulaOption[] = [
  { label: '선택 안 함', value: '', phrase: '' },
  { label: '비교', value: '비교', phrase: '비교해줘' },
  { label: '전월 대비', value: '전월 대비', phrase: '전월 대비로 비교해줘' },
  { label: '전년 동월 대비', value: '전년 동월 대비', phrase: '전년 동월 대비로 비교해줘' },
  { label: '목표 대비', value: '목표 대비', phrase: '목표 대비로 비교해줘' },
]

const normalizeClarificationItem = (item: string) => item.trim().toLowerCase()

const matchesMandatorySlot = (cq: ClarificationQuestion, def: MandatorySlotDef) =>
  def.matchItems.some((key) => normalizeClarificationItem(cq.item) === normalizeClarificationItem(key))

const isSlotMissing = (cq: ClarificationQuestion) => cq.intent !== 'refine'

const buildMissingMandatoryCards = (diag: QuestionDiagnosis | null): MandatorySlotCard[] => {
  const cqs = diag?.clarificationQuestions ?? []
  return MANDATORY_SLOT_DEFS.flatMap((def) => {
    const cq = cqs.find((c) => matchesMandatorySlot(c, def) && isSlotMissing(c))
    if (!cq) return []
    return [{ key: def.key, label: def.label, icon: def.icon, question: cq.question, item: cq.item }]
  })
}

const buildClarificationTips = (
  diag: QuestionDiagnosis | null,
  mandatoryCards: MandatorySlotCard[],
): ClarificationQuestion[] => {
  const cqs = diag?.clarificationQuestions ?? []
  const cardItems = new Set(mandatoryCards.map((card) => card.item))
  return cqs.filter((cq) => !cardItems.has(cq.item))
}

const getSupplementCopy = (status?: QuestionDiagnosisStatus) => {
  if (status === 'TERM_AMBIGUOUS') {
    return {
      title: '용어 확인이 필요해요',
      desc: '아래 안내를 확인하고, 질문에 사용할 용어를 선택해 주세요.',
    }
  }
  if (status === 'OUT_OF_SCOPE') {
    return {
      title: '조회 범위를 확인해 주세요',
      desc: '현재 데이터로는 답하기 어려운 질문이에요. 안내를 참고해 질문을 수정해 주세요.',
    }
  }
  return {
    title: '질문 보완이 필요해요',
    desc: '빠진 항목을 채우거나 아래 안내에 따라 질문을 더 구체적으로 작성해 주세요.',
  }
}

const getDiagnosisSummaryLabel = (showDiag: boolean, diag: QuestionDiagnosis | null, isReadyPass: boolean): string => {
  if (!showDiag || !diag) return ''
  const sc = Math.round(diag.readinessScore ?? 0)
  return isReadyPass ? `검증 통과 · ${sc}점` : `검증 점수 ${sc}점 · 보완 필요`
}

const hasFinalConsonant = (text: string): boolean => {
  const last = text.trim().at(-1)
  if (!last) return false
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 > 0
}

const getObjectParticle = (text: string) => (hasFinalConsonant(text) ? '을' : '를')

const composeQuestion = (draft: QuestionDraft): string => {
  const period = draft.period.trim()
  const metric = draft.metric.trim()
  const groupBy = draft.groupBy.trim()
  const calculation = draft.calculationPhrase.trim()
  const intent = (draft.analysisPhrase || draft.comparisonPhrase || '조회해줘').trim()
  const calculationPhrase = calculation ? ` ${calculation}` : ''
  const groupByPhrase = groupBy ? ` ${groupBy}로` : ''
  return `${period} 동안 ${metric}${getObjectParticle(metric)}${calculationPhrase}${groupByPhrase} ${intent}`
}

const formatDimensionLabel = (term: string) => (term.endsWith('별') ? term : `${term}별`)

const buildDatamartTabs = (subOptions: SubOption[], selectedSubOptions: string[]): DatamartTab[] => {
  const selectedIds = selectedSubOptions.filter((id) => id && id !== 'all')
  if (!subOptions.length || !selectedIds.length) return []
  return subOptions
    .filter((o) => selectedIds.includes(String(o.value)))
    .map((o) => ({ id: String(o.value), label: o.label }))
}

const hexToRgb = (hex: string): string => {
  const normalized = hex.replace('#', '').trim()
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '46, 163, 242'
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export const useDataQuestionGate = () => {
  const { chatMessage } = useChatRooms()
  const { activeSearchModes, riskAgentActive, subOptions, selectedSubOptions } = useChatStore()
  const { fetchDiagnoseQuestion } = useDataQuestionApi()

  /** 데이터분석(S) 모드에서만 게이트 적용 */
  const isGateActive = computed(() => activeSearchModes.value.includes('S') && !riskAgentActive.value)

  /** 검증·진단 대상 데이터마트 ID */
  const currentDatamartId = computed(() => {
    const selected = selectedSubOptions.value.find((id) => id && id !== 'all')
    return selected ?? String(subOptions.value[0]?.value ?? '')
  })

  /** 검증 시점 질문과 현재 질문이 동일한지 (편집하면 무효화) */
  const matchesValidated = computed(() => normalize(chatMessage.value) === normalize(validatedQuestion.value))

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

  /** 대체 용어 칩 클릭 — 모호 용어를 alternatives 항목으로 치환 */
  const applyTermAlternative = (alternative: string) => {
    const questions = diagnosis.value?.clarificationQuestions?.map((cq) => cq.question) ?? []
    const ambiguousTerms = extractAmbiguousTerms(questions)
    chatMessage.value = replaceAmbiguousTerm(chatMessage.value, alternative, ambiguousTerms)
    resetGate()
  }

  /** 제안 질문 → 채팅 입력 반영 후 재검증 대기 */
  const applySuggestedQuestion = (question: string) => {
    chatMessage.value = question
    resetGate()
  }

  const setFormulaValidationSource = (source: FormulaValidationSource) => {
    formulaValidationSource.value = source
  }

  return {
    isGateActive,
    isValidating,
    isValidated,
    requiredFilled,
    canSend,
    diagnosis,
    showDiagnosis,
    validate,
    resetGate,
    applyTermAlternative,
    applySuggestedQuestion,
    formulaValidationSource,
    setFormulaValidationSource,
  }
}

interface DataQuestionGuideProps {
  themeIconClassNm?: string
  themeColorHex?: string
}

/** DataQuestionGuide 컴포넌트 전용 — 게이트 상태와 가이드 UI 상태를 함께 제공 */
export const useDataQuestionGuide = (props: DataQuestionGuideProps) => {
  const { chatMessage } = useChatRooms()
  const { subOptions, selectedSubOptions } = useChatStore()
  const {
    isGateActive,
    showDiagnosis,
    diagnosis,
    applyTermAlternative,
    applySuggestedQuestion,
    formulaValidationSource,
    setFormulaValidationSource,
  } = useDataQuestionGate()

  const isOpen = ref(false)

  const hasSupplement = computed(() => showDiagnosis.value && !!diagnosis.value && diagnosis.value.status !== 'READY')
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

  watch(hasSupplement, (next) => {
    if (next) isOpen.value = true
  })

  watch(isDataQuestionActive, (active) => {
    if (!active) return
    isOpen.value = false
  })

  const missingMandatoryCards = computed(() => buildMissingMandatoryCards(diagnosis.value))
  const clarificationTips = computed(() => buildClarificationTips(diagnosis.value, missingMandatoryCards.value))
  const termAlternatives = computed(() => diagnosis.value?.alternatives ?? [])
  const supplementCopy = computed(() => getSupplementCopy(diagnosis.value?.status))
  const supplementTitle = computed(() => supplementCopy.value.title)
  const supplementDesc = computed(() => supplementCopy.value.desc)
  const showValidationSummary = computed(
    () =>
      missingMandatoryCards.value.length > 0 || clarificationTips.value.length > 0 || termAlternatives.value.length > 0,
  )

  const onApplyTermAlternative = (alternative: string) => {
    applyTermAlternative(alternative)
  }

  const resolvedThemeIconClass = computed(() => props.themeIconClassNm || 'icon-chart-ai')
  const guideThemeStyle = computed(() => {
    const color = props.themeColorHex?.trim()
    if (!color) return undefined
    return {
      '--dq-theme-color': color,
      '--dq-theme-rgb': hexToRgb(color),
    }
  })

  const datamartTabs = computed(() => buildDatamartTabs(subOptions.value, selectedSubOptions.value))
  const hasDatamartConfigured = computed(() => datamartTabs.value.length > 0)
  const showTabs = computed(() => datamartTabs.value.length > 1)
  const activeTabId = ref('')

  watch(
    datamartTabs,
    (tabs) => {
      if (!tabs.length) {
        activeTabId.value = ''
        return
      }
      if (!tabs.some((t) => t.id === activeTabId.value)) activeTabId.value = tabs[0].id
    },
    { immediate: true },
  )

  const onSelectTab = (id: string) => {
    setFormulaValidationSource('draft')
    activeTabId.value = id
  }

  const activeDatamartId = computed(() => activeTabId.value || datamartTabs.value[0]?.id || '')
  const { suggestMetric, suggestDimension, isLoadingVocabulary } = useDatamartVocabulary(activeDatamartId)
  const metricTerms = computed(() => suggestMetric(''))
  const dimensionTerms = computed(() => suggestDimension(''))

  const selectedMetric = ref('')
  const selectedPeriod = ref(DEFAULT_QUESTION_DRAFT.period)
  const selectedDimension = ref('')
  const selectedCalculation = ref(DEFAULT_QUESTION_DRAFT.calculationLabel)
  const selectedAnalysis = ref(DEFAULT_QUESTION_DRAFT.analysisLabel)
  const selectedComparison = ref(DEFAULT_QUESTION_DRAFT.comparisonLabel)
  const activeFormulaControl = ref<FormulaControlKey>('groupBy')
  const questionDraft = ref({ ...DEFAULT_QUESTION_DRAFT })
  const composedQuestion = computed(() => composeQuestion(questionDraft.value))
  const formulaScore = computed(() =>
    scoreFromText(formulaValidationSource.value === 'draft' ? composedQuestion.value : chatMessage.value),
  )
  const formulaItems = computed(() => buildFormulaItems(formulaScore.value))
  const requiredMissingCount = computed(() => countRequiredMissing(formulaScore.value))
  const previewTags = computed(() =>
    [
      questionDraft.value.period,
      questionDraft.value.groupBy,
      questionDraft.value.calculationLabel,
      questionDraft.value.analysisLabel,
      questionDraft.value.comparisonLabel,
      questionDraft.value.metric,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const resetQuestionDraft = () => {
    questionDraft.value = { ...DEFAULT_QUESTION_DRAFT }
    selectedMetric.value = ''
    selectedPeriod.value = DEFAULT_QUESTION_DRAFT.period
    selectedDimension.value = ''
    selectedCalculation.value = DEFAULT_QUESTION_DRAFT.calculationLabel
    selectedAnalysis.value = DEFAULT_QUESTION_DRAFT.analysisLabel
    selectedComparison.value = DEFAULT_QUESTION_DRAFT.comparisonLabel
  }

  watch(activeDatamartId, () => {
    resetQuestionDraft()
  })

  const isMetricSelected = (term: string) =>
    selectedMetric.value === term || (!selectedMetric.value && questionDraft.value.metric === term)

  const isPeriodSelected = (period: string) => selectedPeriod.value === period

  const isDimensionSelected = (term: string) =>
    selectedDimension.value === term ||
    (!selectedDimension.value && formatDimensionLabel(term) === questionDraft.value.groupBy)

  const activeFormulaTitle = computed(() => FORMULA_DISPLAY_LABELS[activeFormulaControl.value])
  const activeFormulaDesc = computed(() => {
    if (activeFormulaControl.value === 'groupBy') return '선택한 지표를 어떤 기준으로 나눠 볼지 선택해 주세요.'
    if (activeFormulaControl.value === 'calculation') return '합계, 평균처럼 계산 방식을 선택해 주세요.'
    if (activeFormulaControl.value === 'analysis') return '추이, 순위처럼 최종 분석 의도를 선택해 주세요.'
    return '비교 기준을 선택해 주세요. 분석과 비교는 동시에 사용할 수 없어요.'
  })

  const activeFormulaOptions = computed<FormulaOption[]>(() => {
    if (activeFormulaControl.value === 'groupBy') {
      return [
        { label: '선택 안 함', value: '' },
        ...dimensionTerms.value.map((term) => ({
          label: formatDimensionLabel(term),
          value: formatDimensionLabel(term),
        })),
      ]
    }
    if (activeFormulaControl.value === 'calculation') return CALCULATION_OPTIONS
    if (activeFormulaControl.value === 'analysis') return ANALYSIS_OPTIONS
    return COMPARISON_OPTIONS
  })

  const onSelectFormulaItem = (key: string) => {
    if (!['groupBy', 'calculation', 'analysis', 'comparison'].includes(key)) return
    setFormulaValidationSource('draft')
    activeFormulaControl.value = key as FormulaControlKey
  }

  const isFormulaOptionSelected = (option: FormulaOption) => {
    if (activeFormulaControl.value === 'groupBy') return questionDraft.value.groupBy === option.value
    if (activeFormulaControl.value === 'calculation') {
      return option.value ? selectedCalculation.value === option.label : !selectedCalculation.value
    }
    if (activeFormulaControl.value === 'analysis') {
      return option.value ? selectedAnalysis.value === option.label : !selectedAnalysis.value
    }
    return option.value ? selectedComparison.value === option.label : !selectedComparison.value
  }

  const onSelectFormulaOption = (option: FormulaOption) => {
    setFormulaValidationSource('draft')
    if (activeFormulaControl.value === 'groupBy') {
      selectedDimension.value = option.value
      questionDraft.value = { ...questionDraft.value, groupBy: option.value }
      return
    }
    if (activeFormulaControl.value === 'calculation') {
      selectedCalculation.value = option.value ? option.label : ''
      questionDraft.value = {
        ...questionDraft.value,
        calculationLabel: option.value ? option.label : '',
        calculationPhrase: option.phrase ?? '',
      }
      return
    }
    if (activeFormulaControl.value === 'analysis') {
      selectedAnalysis.value = option.value ? option.label : ''
      selectedComparison.value = ''
      questionDraft.value = {
        ...questionDraft.value,
        analysisLabel: option.value ? option.label : '',
        analysisPhrase: option.phrase ?? '',
        comparisonLabel: '',
        comparisonPhrase: '',
      }
      return
    }
    selectedComparison.value = option.value ? option.label : ''
    selectedAnalysis.value = ''
    questionDraft.value = {
      ...questionDraft.value,
      analysisLabel: '',
      analysisPhrase: '',
      comparisonLabel: option.value ? option.label : '',
      comparisonPhrase: option.phrase ?? '',
    }
  }

  const onSelectPeriod = (period: string) => {
    setFormulaValidationSource('draft')
    selectedPeriod.value = period
    questionDraft.value = { ...questionDraft.value, period }
  }

  const onSelectMetric = (term: string) => {
    setFormulaValidationSource('draft')
    selectedMetric.value = term
    questionDraft.value = { ...questionDraft.value, metric: term }
  }

  const onSelectDimension = (term: string) => {
    setFormulaValidationSource('draft')
    activeFormulaControl.value = 'groupBy'
    selectedDimension.value = term
    questionDraft.value = { ...questionDraft.value, groupBy: formatDimensionLabel(term) }
  }

  const onApplyComposedQuestion = () => {
    setFormulaValidationSource('chat')
    applySuggestedQuestion(composedQuestion.value)
  }

  const onApplyFormulaExample = () => {
    setFormulaValidationSource('chat')
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
    isFormulaItemClickable,
    hasSupplement,
    showValidationSummary,
    supplementTitle,
    supplementDesc,
    missingMandatoryCards,
    clarificationTips,
    termAlternatives,
    hasDatamartConfigured,
    showTabs,
    datamartTabs,
    activeTabId,
    periodOptions: PERIOD_OPTIONS,
    activeFormulaControl,
    activeFormulaTitle,
    activeFormulaDesc,
    activeFormulaOptions,
    isLoadingVocabulary,
    metricTerms,
    composedQuestion,
    previewTags,
    formatDimensionLabel,
    onToggleGuide,
    onApplyTermAlternative,
    onSelectTab,
    onSelectPeriod,
    onSelectMetric,
    onSelectDimension,
    onSelectFormulaItem,
    onSelectFormulaOption,
    isMetricSelected,
    isPeriodSelected,
    isDimensionSelected,
    isFormulaOptionSelected,
    onApplyComposedQuestion,
    onApplyFormulaExample,
  }
}

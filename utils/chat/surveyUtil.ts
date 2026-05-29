// 설문(SURVEY) 에이전트 공통 유틸 — subCfg.additionalConfig JSON 기반

import { nextTick } from 'vue'
import { useApi } from '~/composables/com/useApi'
import type { Agent, AgtSubCfg } from '~/types/agent'
import type { SurveyOutputSectionBlock, SurveyResultTierForm, SurveyUiConfig } from '~/types/agentSurveyConfig'
import type { ChatMessage } from '~/types/chat'
import type { StressLevel, StressScoreItem } from '~/types/stress'
import type { SurveyCategory, SurveyRiskThreshold, SurveyScoreOption } from '~/types/survey'

export type { SurveyCategory, SurveyScoreOption }
export type { PsychologySurveyQuestion, PsychologySurveyCategory, PsychologySurveyScoreOption } from '~/types/survey'
export type { SurveyOutputSectionBlock, SurveyResultTierForm as SurveyResultTierConfig }

/** 설문 참고치 판정용 성별 */
export type SurveyGender = 'male' | 'female'

export const SURVEY_SUB_TY = 'SURVEY'

const KOSS_DISCLAIMER_TEXT =
  '본 AI 에이전트는 한국인 직무스트레스 요인 평가도구 단축형 1, KOSS-SF1를 기반으로 직장인의 직무스트레스 요인을 분석합니다. 사용자의 응답 결과를 7개 영역별로 환산하여 정상, 경계, 고위험 수준을 제시하고, 주요 스트레스 원인에 따른 맞춤형 관리 가이드를 제공합니다. 본 결과는 의학적 진단이 아니며, 건강 이상이나 심리적 어려움이 지속될 경우 전문가 상담을 권장합니다.'

/** parseSurveyConfigFromAgent 파싱 결과 — 설문 UI·프롬프트·차트 공통 설정 */
export interface SurveyAgentConfig {
  agentId: string
  surveyType: string
  categories: SurveyCategory[]
  scoreOptions: SurveyScoreOption[]
  totalQuestions: number
  requireGender: boolean
  reverseQuestionNos: number[]
  areaRiskByGender: Record<SurveyGender, Record<string, SurveyRiskThreshold>>
  totalRiskByGender: Record<SurveyGender, SurveyRiskThreshold>
  /** 에이전트 페르소나 (agent.persona 또는 prompt.role) */
  promptRole: string
  /** 에이전트 임무 설명 (agent.mission, 신규) */
  agentMission: string
  /** 출력 언어 레이블 (예: "한국어", agent.languageLabel, 신규) */
  agentLanguageLabel: string
  /** 언어 예외 (예: "곡명·아티스트명은 영어 허용", agent.languageExceptions, 신규) */
  agentLanguageExceptions: string
  /** 핵심 원인 상위 N개 (topN, 신규) */
  topN: number
  /** 출력 제약 목록 (constraints 배열, 신규) */
  constraints: string[]
  /** 결과 등급 목록 (resultTiers 배열, 신규) */
  resultTiers: SurveyResultTierForm[]
  /** 출력 섹션 블록 배열 (outputSections 블록 형식, 신규) */
  outputSectionBlocks: SurveyOutputSectionBlock[]
  /** 마무리 응원 메시지 블록 (closingMessage 최상위 필드, 신규) */
  closingMessageBlock?: SurveyOutputSectionBlock
  /** 카테고리 key → 기준 초과 표시 라벨 (elevatedLabel, 신규) */
  elevatedLabelByArea: Record<string, string>
  features: {
    showRadarChart: boolean
    showAiRecoveryImage: boolean
    showPexelsRecoveryImages: boolean
  }
  surveyTitle: string
  genderStepTitle: string
  genderStepDesc: string
  disclaimerSource?: string
  disclaimerText?: string
  introTitle: string
  introSubtitle: string
  submitLabel: string
}

/** subCfg에서 subTy 추출 (subTyCd fallback) */
export const getAgentSubTy = (subCfg: unknown): string => {
  if (!subCfg || typeof subCfg !== 'object') return ''
  const raw = subCfg as Record<string, unknown>
  return String(raw.subTy ?? raw.subTyCd ?? '').trim()
}

/** svcTy=C 이고 subTy=SURVEY 인 에이전트 여부 */
export const isSurveyAgent = (agent: Pick<Agent, 'svcTy' | 'subCfg'> | null | undefined): boolean => {
  if (!agent || agent.svcTy !== 'C') return false
  return getAgentSubTy(agent.subCfg) === SURVEY_SUB_TY
}

/** API/스토어 subCfg raw 값을 AgtSubCfg 형태로 정규화 */
export const normalizeAgentSubCfg = (subCfg: unknown): AgtSubCfg | null => {
  if (!subCfg || subCfg === '' || typeof subCfg !== 'object') return null
  const raw = subCfg as Record<string, unknown>
  return {
    subCfgId: String(raw.subCfgId ?? ''),
    agentId: String(raw.agentId ?? ''),
    subTy: getAgentSubTy(raw),
    additionalConfig: (raw.additionalConfig as AgtSubCfg['additionalConfig']) ?? null,
    useYn: raw.useYn === 'N' ? 'N' : 'Y',
    createDt: String(raw.createDt ?? ''),
    modifyDt: String(raw.modifyDt ?? ''),
  }
}

/** riskRules JSON → { normalMax, cautionMax } (한글 키 호환) */
const parseRiskThreshold = (raw: unknown): SurveyRiskThreshold | null => {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  const normalMax = Number(row.normalMax ?? row.정상Max)
  const cautionMax = Number(row.cautionMax ?? row.경계Max)
  if (!Number.isFinite(normalMax) || !Number.isFinite(cautionMax)) return null
  return { normalMax, cautionMax }
}

/** riskRules.areaScore → 성별별 영역 참고치 맵 */
const parseAreaRiskByGender = (
  riskRules: Record<string, unknown>,
): Record<SurveyGender, Record<string, SurveyRiskThreshold>> => {
  const areaScore = (riskRules.areaScore ?? {}) as Record<string, unknown>
  const parseGender = (gender: SurveyGender) => {
    const raw = (areaScore[gender] ?? {}) as Record<string, unknown>
    const result: Record<string, SurveyRiskThreshold> = {}
    for (const [key, value] of Object.entries(raw)) {
      const threshold = parseRiskThreshold(value)
      if (threshold) result[key] = threshold
    }
    return result
  }
  return { male: parseGender('male'), female: parseGender('female') }
}

/** upperBounds 배열 또는 normalMax/cautionMax → SurveyRiskThreshold */
const parseProfileToRiskThreshold = (raw: unknown): SurveyRiskThreshold | null => {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (Array.isArray(row.upperBounds) && row.upperBounds.length > 0) {
    const bounds = row.upperBounds.map((n) => Number(n)).filter((n) => Number.isFinite(n))
    if (bounds.length >= 2) return { normalMax: bounds[0], cautionMax: bounds[1] }
    if (bounds.length === 1) return { normalMax: bounds[0], cautionMax: bounds[0] }
  }
  return parseRiskThreshold(raw)
}

/** riskRules.totalScore → 성별별 총점 참고치 (미설정 시 KOSS-SF1 기본값) */
const parseTotalRiskByGender = (riskRules: Record<string, unknown>): Record<SurveyGender, SurveyRiskThreshold> => {
  const totalScore = (riskRules.totalScore ?? {}) as Record<string, unknown>
  const fallback = (raw: unknown, gender: SurveyGender) =>
    parseProfileToRiskThreshold(raw) ??
    (gender === 'male' ? { normalMax: 48.4, cautionMax: 54.7 } : { normalMax: 50.0, cautionMax: 55.6 })
  return {
    male: fallback(totalScore.male, 'male'),
    female: fallback(totalScore.female, 'female'),
  }
}

/** additionalConfig.categories 항목 → SurveyCategory */
const parseSurveyCategory = (cat: Record<string, unknown>, index: number): SurveyCategory => {
  const no = Number(cat.no ?? index + 1)
  const key = String(cat.key ?? `category${no}`)
  const questionsRaw = Array.isArray(cat.questions) ? cat.questions : []
  const questions = questionsRaw.map((q) => {
    const row = q as Record<string, unknown>
    return { no: Number(row.no), text: String(row.text ?? ''), categoryNo: no }
  })
  const questionNos = Array.isArray(cat.questionNos)
    ? cat.questionNos.map((n) => Number(n))
    : questions.map((q) => q.no)
  return { no, key, title: String(cat.title ?? ''), titleEn: String(cat.titleEn ?? ''), questions, questionNos }
}

type SurveyUiTextKey = keyof Required<
  Pick<
    SurveyAgentConfig,
    'surveyTitle' | 'genderStepTitle' | 'genderStepDesc' | 'introTitle' | 'introSubtitle' | 'submitLabel'
  >
>

type SurveyUiOptionalKey = 'disclaimerSource' | 'disclaimerText'

/** KOSS_SF1 설문 UI 기본 문구 */
const buildKossUiDefaults = (agentNm: string): Required<SurveyUiConfig> & { agentNm: string } => ({
  surveyTitle: '한국인 직무스트레스 요인 평가',
  genderStepTitle: '진단 전 성별을 선택해 주세요',
  genderStepDesc: 'KOSS-SF1 직무스트레스 척도는 성별에 따라 위험군 판정 기준이 다릅니다.',
  disclaimerSource: '출처 : 한국형 직무스트레스 평가도구 (KOSS-SF1) : 한국산업안전보건공단',
  disclaimerText: KOSS_DISCLAIMER_TEXT,
  introTitle: '심리 스트레스 진단',
  introSubtitle: '상담 세션을 준비하고 있습니다...',
  submitLabel: '진단 완료 후 상담 시작',
  agentNm,
})

/** cfg.ui 또는 최상위 키 → 설문 UI 문구 (미설정 시 KOSS_SF1·일반 설문 기본값) */
const parseSurveyUiConfig = (
  cfg: Record<string, unknown>,
  agentNm: string,
  isKoss: boolean,
): Pick<
  SurveyAgentConfig,
  | 'surveyTitle'
  | 'genderStepTitle'
  | 'genderStepDesc'
  | 'disclaimerSource'
  | 'disclaimerText'
  | 'introTitle'
  | 'introSubtitle'
  | 'submitLabel'
> => {
  const uiRaw = (cfg.ui ?? {}) as Record<string, unknown>
  const kossDefaults = buildKossUiDefaults(agentNm)

  const pickText = (key: SurveyUiTextKey, nonKossFallback: string): string => {
    const fromUi = uiRaw[key]
    if (fromUi != null && String(fromUi).trim()) return String(fromUi).trim()
    const fromTop = cfg[key]
    if (fromTop != null && String(fromTop).trim()) return String(fromTop).trim()
    if (isKoss) return String(kossDefaults[key])
    return nonKossFallback
  }

  const pickOptional = (key: SurveyUiOptionalKey): string | undefined => {
    const fromUi = uiRaw[key]
    if (fromUi != null && String(fromUi).trim()) return String(fromUi).trim()
    const fromTop = cfg[key]
    if (fromTop != null && String(fromTop).trim()) return String(fromTop).trim()
    if (isKoss) return kossDefaults[key]
    return undefined
  }

  return {
    surveyTitle: pickText('surveyTitle', agentNm || '설문'),
    genderStepTitle: pickText('genderStepTitle', '설문 전 성별을 선택해 주세요'),
    genderStepDesc: pickText('genderStepDesc', '설문 결과 해석을 위해 성별을 선택해 주세요.'),
    disclaimerSource: pickOptional('disclaimerSource'),
    disclaimerText: pickOptional('disclaimerText'),
    introTitle: pickText('introTitle', agentNm || '설문'),
    introSubtitle: pickText('introSubtitle', '설문을 준비하고 있습니다...'),
    submitLabel: pickText('submitLabel', '설문 완료'),
  }
}

/** resultTiers 배열 파싱 */
const parseResultTiers = (raw: unknown): SurveyResultTierForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) return []
  return raw.map((t) => {
    const row = t as Record<string, unknown>
    return {
      key: String(row.key ?? ''),
      label: String(row.label ?? ''),
      badgeClass: String(row.badgeClass ?? ''),
      statusClass: String(row.statusClass ?? ''),
      tone: String(row.tone ?? ''),
    }
  })
}

/** outputSections 배열 → 블록 인스턴스 배열 파싱 (문자열 배열이면 빈 배열 반환) */
const parseOutputSectionBlocks = (raw: unknown): SurveyOutputSectionBlock[] => {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  if (typeof first === 'string') return []
  return raw.map((s) => {
    const row = s as Record<string, unknown>
    return {
      id: String(row.id ?? ''),
      title: row.title != null ? String(row.title) : undefined,
      blockType: String(row.blockType ?? ''),
      instruction: row.instruction != null ? String(row.instruction) : undefined,
      params: (row.params as Record<string, unknown>) ?? undefined,
    }
  })
}

/** categories raw 배열 → { key → elevatedLabel } 맵 */
const parseElevatedLabelByArea = (categoriesRaw: unknown[]): Record<string, string> => {
  const map: Record<string, string> = {}
  for (const c of categoriesRaw) {
    const row = c as Record<string, unknown>
    const key = String(row.key ?? '')
    const el = String(row.elevatedLabel ?? '')
    if (key && el) map[key] = el
  }
  return map
}

/** Agent.subCfg.additionalConfig → SurveyAgentConfig (SURVEY 전용) */
export const parseSurveyConfigFromAgent = (agent: Agent): SurveyAgentConfig | null => {
  if (!isSurveyAgent(agent)) return null
  const additional = agent.subCfg?.additionalConfig
  if (!additional || typeof additional !== 'object') return null
  const cfg = additional as Record<string, unknown>

  const surveyType = String(cfg.surveyType ?? '')
  const isKoss = surveyType === 'KOSS_SF1'
  const ui = parseSurveyUiConfig(cfg, agent.agentNm, isKoss)

  const categoriesRaw = Array.isArray(cfg.categories) ? cfg.categories : []
  if (!categoriesRaw.length) return null
  const categories = categoriesRaw.map((c, i) => parseSurveyCategory(c as Record<string, unknown>, i))

  const scoreOptionsRaw = Array.isArray(cfg.scoreOptions) ? cfg.scoreOptions : []
  const scoreOptions =
    scoreOptionsRaw.length > 0
      ? scoreOptionsRaw.map((o) => {
          const row = o as Record<string, unknown>
          return { value: Number(row.value), label: String(row.label ?? '') }
        })
      : [
          { value: 1, label: '전혀 그렇지 않다' },
          { value: 2, label: '그렇지 않다' },
          { value: 3, label: '그렇다' },
          { value: 4, label: '매우 그렇다' },
        ]

  const totalQuestions =
    Number(cfg.totalQuestions) > 0
      ? Number(cfg.totalQuestions)
      : categories.reduce((sum, c) => sum + c.questions.length, 0)

  // engine.riskRules 우선, 없으면 top-level riskRules fallback (기존 데이터 호환)
  const engine = (cfg.engine ?? {}) as Record<string, unknown>
  const riskRules = (engine.riskRules ?? cfg.riskRules ?? {}) as Record<string, unknown>
  const reverseQuestionNos = Array.isArray(engine.reverseQuestionNos)
    ? engine.reverseQuestionNos.map((n) => Number(n))
    : Array.isArray(cfg.reverseQuestionNos)
      ? cfg.reverseQuestionNos.map((n) => Number(n))
      : []

  const agentInfo = (cfg.agent ?? {}) as Record<string, unknown>
  const features = (cfg.features ?? {}) as Record<string, unknown>

  // persona: cfg.agent.persona → cfg.prompt.role(기존 데이터) → agent.description 순으로 fallback
  const legacyPromptRole = ((cfg.prompt ?? {}) as Record<string, unknown>).role
  const agentPersona = String(agentInfo.persona ?? legacyPromptRole ?? agent.description ?? '설문 분석 전문가')
  const agentMission = String(agentInfo.mission ?? '')
  const agentLanguageLabel = String(agentInfo.languageLabel ?? cfg.language ?? '')
  const agentLanguageExceptions = String(agentInfo.languageExceptions ?? '')

  const resultTiers = parseResultTiers(cfg.resultTiers)
  const outputSectionBlocks = parseOutputSectionBlocks(cfg.outputSections)
  const constraints = Array.isArray(cfg.constraints) ? cfg.constraints.map(String) : []
  const topN = Number(cfg.topN ?? 2)

  // closingMessage — 최상위 단독 필드 (outputSections 밖에 있어 번호·헤딩 없이 렌더링)
  const closingMessageBlock = (() => {
    const raw = cfg.closingMessage
    if (!raw || typeof raw !== 'object') return undefined
    const row = raw as Record<string, unknown>
    if (typeof row.blockType !== 'string') return undefined
    return {
      id: String(row.id ?? 'closing'),
      title: row.title != null ? String(row.title) : undefined,
      blockType: String(row.blockType),
      instruction: row.instruction != null ? String(row.instruction) : undefined,
      params: (row.params as Record<string, unknown>) ?? undefined,
    } satisfies SurveyOutputSectionBlock
  })()

  return {
    agentId: agent.agentId,
    surveyType,
    categories,
    scoreOptions,
    totalQuestions,
    requireGender: features.requireGender === true,
    reverseQuestionNos,
    areaRiskByGender: parseAreaRiskByGender(riskRules),
    totalRiskByGender: parseTotalRiskByGender(riskRules),
    promptRole: agentPersona,
    agentMission,
    agentLanguageLabel,
    agentLanguageExceptions,
    topN,
    constraints,
    resultTiers,
    outputSectionBlocks,
    closingMessageBlock,
    elevatedLabelByArea: parseElevatedLabelByArea(categoriesRaw),
    features: {
      showRadarChart: features.showRadarChart === true,
      showAiRecoveryImage: features.showAiRecoveryImage === true,
      showPexelsRecoveryImages: features.showPexelsRecoveryImages === true,
    },
    ...ui,
  }
}

/** agentId로 agents 목록에서 설문 설정 조회 */
export const resolveSurveyConfigByAgentId = (agentId: string, agents: Agent[]): SurveyAgentConfig | null => {
  const agent = agents.find((a) => a.agentId === agentId)
  return agent ? parseSurveyConfigFromAgent(agent) : null
}

/** 해당 에이전트가 방사형 차트(showRadarChart) 기능을 켰는지 */
export const isSurveyRadarAgentById = (agentId: string, agents: Agent[]): boolean =>
  resolveSurveyConfigByAgentId(agentId, agents)?.features.showRadarChart === true

/** 해당 에이전트가 Pexels 회복 이미지(showPexelsRecoveryImages·showAiRecoveryImage) 기능을 켰는지 */
export const isSurveyPexelsAgentById = (agentId: string, agents: Agent[]): boolean => {
  const config = resolveSurveyConfigByAgentId(agentId, agents)
  if (!config) return false
  return config.features.showPexelsRecoveryImages === true || config.features.showAiRecoveryImage === true
}

const activeSurveyConfig = ref<SurveyAgentConfig | null>(null)

/** 현재 채팅/설문 세션에서 사용할 설문 설정 등록 */
export const setActiveSurveyConfig = (config: SurveyAgentConfig | null) => {
  activeSurveyConfig.value = config
}

/** 등록된 활성 설문 설정 반환 */
export const getActiveSurveyConfig = () => activeSurveyConfig.value

/** KOSS 역코딩: 1↔4, 2↔3 */
const applyReverse = (score: number): number => 5 - score

/** KOSS-SF1 PDF 공식으로 영역별 0~100 환산 점수·합계 산출 */
const calcCategoryStats = (qNos: number[], answers: Record<number, number>, reverseSet: Set<number>) => {
  const itemCount = qNos.length
  const sumActual = qNos.reduce((acc, no) => {
    const raw = answers[no] ?? 2
    return acc + (reverseSet.has(no) ? applyReverse(raw) : raw)
  }, 0)
  const sumMax = 4 * itemCount
  const denom = sumMax - itemCount
  const score100 = denom === 0 ? 0 : ((sumActual - itemCount) / denom) * 100
  const avg = itemCount === 0 ? 0 : sumActual / itemCount
  return { itemCount, sumActual, sumMax, avg: avg.toFixed(2), score100: score100.toFixed(2) }
}

/** SurveyAgentConfig → 프롬프트용 영역별 { 정상Max, 경계Max } 테이블 */
const toLegacyAreaRisk = (config: SurveyAgentConfig, gender: SurveyGender) => {
  const table: Record<string, { 정상Max: number; 경계Max: number }> = {}
  for (const cat of config.categories) {
    const t = config.areaRiskByGender[gender][cat.key]
    if (t) table[cat.key] = { 정상Max: t.normalMax, 경계Max: t.cautionMax }
  }
  return table
}

/** SurveyAgentConfig → 프롬프트용 총점 { 정상Max, 경계Max } */
const toLegacyTotalRisk = (config: SurveyAgentConfig, gender: SurveyGender) => {
  const t = config.totalRiskByGender[gender]
  return { 정상Max: t.normalMax, 경계Max: t.cautionMax }
}

/** 블록 렌더링 규약 (고정 골격, 실제 클래스값 주입) */
const buildBlockRenderingRules = (
  blockTypes: Set<string>,
  tier: SurveyResultTierForm,
  outputSectionBlocks: SurveyOutputSectionBlock[],
): string => {
  const lines: string[] = ['# 블록 렌더링 규약 (고정)']
  if (blockTypes.has('risk_badge_summary')) {
    lines.push(
      `- risk_badge_summary: 아래 두 줄을 연속 출력. 두 span 사이에 빈 줄·공백·들여쓰기 금지.\n` +
        `  <span class="risk-badge ${tier.badgeClass}">${tier.label}</span>\n` +
        `  <span class="risk-status ${tier.statusClass}">{지침에 따른 1~2문장}</span>\n` +
        `  클래스명·라벨을 임의로 바꾸지 말 것.`,
    )
  }
  if (blockTypes.has('state_breakdown')) {
    lines.push(
      `- state_breakdown: 각 항목을 \`- 라벨: 내용\`(한 줄 이상)으로. 본문 끝에 trailingMarker가 있으면\n` +
        `  들여쓰기·공백 없이 단독 한 줄로 출력(생략·다른 텍스트 혼입 금지).`,
    )
  }
  if (blockTypes.has('grouped_actions')) {
    lines.push(`- grouped_actions: 각 그룹을 \`#### {title}\` 헤딩 + 목록으로. count/note 준수.`)
  }
  if (blockTypes.has('recommendation_list') || blockTypes.has('keyword_list')) {
    lines.push(`- recommendation_list / keyword_list: params.format을 그대로 따르고 count개 빠짐없이 출력.`)
  }
  if (blockTypes.has('closing_message')) {
    const block = outputSectionBlocks.find((b) => b.blockType === 'closing_message')
    const tag = (block?.params?.tag as string) ?? 'h3'
    lines.push(`- closing_message: 헤딩·라벨 없이 <${tag}> 태그 한 줄만.`)
  }
  return lines.join('\n')
}

/** closingMessage 블록 → 번호·헤딩 없는 마무리 섹션 텍스트 */
const buildClosingSection = (block: SurveyOutputSectionBlock): string => {
  const tag = (block.params?.tag as string) ?? 'h3'
  const instrText = block.instruction ?? '현재 심리 상태에 맞는 한 줄 응원 메시지.'
  return `[blockType=${block.blockType}] 헤딩·번호 없이 <${tag}> 태그 한 줄만 출력합니다.\n` + `지침: ${instrText}`
}

/** 신규 JSON 구조(outputSectionBlocks 보유) 기반 프롬프트 빌더 */
const buildSurveyPromptV2 = (
  config: SurveyAgentConfig,
  answers: Record<number, number>,
  gender: SurveyGender | null,
): string => {
  const reverseSet = new Set(config.reverseQuestionNos)
  const resolvedGender: SurveyGender = gender ?? 'male'
  const genderLabel = gender === 'female' ? '여성' : '남성'

  const areaList = config.categories.map((cat) => ({
    title: cat.title,
    titleNospace: cat.title.replace(/\s+/g, ''),
    key: cat.key,
    elevatedLabel: config.elevatedLabelByArea[cat.key] ?? cat.title,
    stats: calcCategoryStats(cat.questionNos, answers, reverseSet),
  }))

  const totalScoreNum = areaList.reduce((acc, a) => acc + Number(a.stats.score100), 0) / areaList.length
  const totalScore = totalScoreNum.toFixed(2)

  const totalRisk = toLegacyTotalRisk(config, resolvedGender)
  const tierIdx = totalScoreNum <= totalRisk.정상Max ? 0 : totalScoreNum <= totalRisk.경계Max ? 1 : 2
  const fallbackTiers: SurveyResultTierForm[] = [
    { key: 'safe', label: '정상군', badgeClass: 'risk-safe', statusClass: 'risk-status--safe', tone: '' },
    { key: 'caution', label: '경계군', badgeClass: 'risk-caution', statusClass: 'risk-status--caution', tone: '' },
    { key: 'highrisk', label: '고위험군', badgeClass: 'risk-danger', statusClass: 'risk-status--danger', tone: '' },
  ]
  const matchingTier = config.resultTiers[tierIdx] ?? fallbackTiers[tierIdx]

  // 기준 초과 영역 (경계 이상)
  const elevatedAreas = areaList.filter((a) => {
    const t = config.areaRiskByGender[resolvedGender][a.key]
    return t ? Number(a.stats.score100) > t.normalMax : false
  })

  // 상위 topN 영역 (동률 모두 포함)
  const sortedByScore = [...areaList].sort((a, b) => Number(b.stats.score100) - Number(a.stats.score100))
  const cutoffScore = Number(sortedByScore[config.topN - 1]?.stats.score100 ?? 0)
  const topAreas = sortedByScore.filter((a, i) => i < config.topN || Number(a.stats.score100) === cutoffScore)

  const langLabel = config.agentLanguageLabel || '한국어'
  const langExceptions = config.agentLanguageExceptions

  const scaleStr = config.scoreOptions.map((o) => `${o.value}=${o.label}`).join(' / ')
  const areaScoresBlock = areaList.map((a) => `- ${a.titleNospace}: ${a.stats.score100}`).join('\n')
  const elevatedAreasStr = elevatedAreas.length
    ? elevatedAreas.map((a) => a.elevatedLabel).join(' / ')
    : '없음 (모든 영역 정상)'
  const topAreasStr = topAreas.map((a) => a.titleNospace).join(' / ')

  const blockTypes = new Set(config.outputSectionBlocks.map((b) => b.blockType))
  if (config.closingMessageBlock) blockTypes.add(config.closingMessageBlock.blockType)

  const outputSectionsText = config.outputSectionBlocks
    .map((block, idx) => {
      const sectionNo = idx + 1
      const title = block.title ?? `섹션 ${sectionNo}`
      const instrText = block.instruction ?? ''
      const paramsStr = block.params ? `\n파라미터: ${JSON.stringify(block.params)}` : ''
      return (
        `### ${sectionNo}. ${title}\n` +
        `[blockType=${block.blockType} 의 렌더링 규약을 따른다]\n` +
        `지침: ${instrText}${paramsStr}`
      )
    })
    .join('\n\n---\n\n')

  // closingMessage — 섹션 번호·헤딩 없이 마지막에 단독 렌더링
  const closingText = config.closingMessageBlock ? `\n\n---\n\n${buildClosingSection(config.closingMessageBlock)}` : ''

  const allOutputSections = outputSectionsText + closingText

  const renderingRules = buildBlockRenderingRules(blockTypes, matchingTier, [
    ...config.outputSectionBlocks,
    ...(config.closingMessageBlock ? [config.closingMessageBlock] : []),
  ])

  const constraintsText = config.constraints.length
    ? config.constraints.map((c) => `- ${c}`).join('\n')
    : '- 의료 진단 금지. 약물처방 금지. 과도한 긍정 금지. 비난 금지.'

  const inputDataJson = buildSurveyInputDataJson(answers, gender)

  return `# Role
당신은 ${config.promptRole}입니다.
${config.agentMission ? config.agentMission + '\n' : ''}모든 답변은 **${langLabel}**로 작성하세요.${langExceptions ? ` (예외: ${langExceptions})` : ''}
그 외 언어는 절대 포함하지 마세요.

# 설문 정보
설문: ${config.surveyType} (총 ${config.totalQuestions}문항)
척도: ${scaleStr}

# Input Data
${inputDataJson}

# 사전 계산 결과 (그대로 사용 — 재계산·검증 금지)
아래 값은 시스템이 공식으로 확정한 결과입니다. 다시 계산하거나 바꾸지 마세요.
[영역별 점수]
${areaScoresBlock}
[총점] ${totalScore}
[종합 판정] ${matchingTier.label}
[섹션1 뱃지 클래스] ${matchingTier.badgeClass}  [상태 클래스] ${matchingTier.statusClass}
[기준 초과(경계 이상) 영역] ${elevatedAreasStr}
[핵심 영역(상위 ${config.topN})] ${topAreasStr}

⚠️ 위 「종합 판정」과 「뱃지·상태 클래스」는 시스템이 확정한 값입니다. 섹션 1의 span 클래스·라벨은 반드시 이 값을 그대로 사용하세요.
본문 전체 톤(섹션 2 이후)은 「${matchingTier.label}」 기준에 맞춰 작성합니다.

# 작성 지침
- 본문 전체 톤은 종합 판정(${matchingTier.label}) 기준에 맞춥니다: ${matchingTier.tone}
- 영역별 점수가 아무리 높아도 종합 판정·뱃지/상태 클래스는 위 확정 값을 그대로 사용하세요.
- 문항 번호·점수 수치는 절대 노출하지 말고, 각 영역이 나타내는 경험을 자연어로 서술하세요.
- 채점 방법(점수체계·역코딩·환산공식)은 설명하지 마세요.

# 출력 섹션 (순서대로, 각 섹션 사이에 반드시 --- 구분선)
${allOutputSections}

${renderingRules}

# 제약
${constraintsText}

# 마크다운 규칙 (예외 없음)
- 섹션 제목: 위 ### 헤딩 구조 그대로. 소제목: #### 사용. 강조: **볼드**.
- 숫자를 헤딩 대용으로 쓰지 말 것. 각 섹션 사이 --- 구분선 유지.

# Tone (사전 확정된 종합 위험군: ${matchingTier.label} — 이 기준에 맞춰 본문 전체 작성)
${matchingTier.tone || `- 공감 중심, 따듯하고 친근한 말투, 현실적, 행동 유도 (${genderLabel} ${config.surveyType})`}`
}

/** 설문 응답·성별 → LLM 진단 분석 프롬프트 문자열 */
export const buildDiagnosticPrompt = (answers: Record<number, number>, gender: SurveyGender | null): string => {
  const config = activeSurveyConfig.value
  if (!config) return ''
  return buildSurveyPromptV2(config, answers, gender)
}

/** 설문 제출 qcontent·검색기록 복원용 — 문항별 raw 응답 JSON */
export const buildSurveyInputDataJson = (answers: Record<number, number>, gender: SurveyGender | null): string => {
  const payload: Record<string, number | string> = {}
  for (const [no, score] of Object.entries(answers)) {
    const qNo = Number(no)
    if (!Number.isFinite(qNo) || qNo < 1) continue
    if (typeof score === 'number' && score >= 1 && score <= 4) payload[`Q${qNo}`] = score
  }
  if (gender) payload.gender = gender
  return JSON.stringify(payload)
}

/** V2 진단 프롬프트 형식 여부 (Input Data 유무와 무관) */
export const isSurveyDiagnosticPrompt = (promptText: string): boolean => {
  const text = promptText.trim()
  if (!text) return false
  return text.includes('# Role') && text.includes('# 설문 정보') && text.includes('[영역별 점수]')
}

/** # Input Data 블록에서 JSON 객체 추출 */
const extractSurveyInputDataJson = (promptText: string): string | null => {
  const marker = '# Input Data'
  const idx = promptText.indexOf(marker)
  if (idx < 0) return null
  const after = promptText.slice(idx + marker.length).trimStart()
  if (!after.startsWith('{')) return null

  let depth = 0
  for (let i = 0; i < after.length; i++) {
    const ch = after[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return after.slice(0, i + 1)
    }
  }
  return null
}

/** 진단 프롬프트 # Input Data JSON에서 Qn→점수 파싱 */
export const parseSurveyAnswersFromPrompt = (promptText: string, totalQuestions?: number): Record<number, number> => {
  try {
    const jsonText = extractSurveyInputDataJson(promptText)
    if (!jsonText) return {}
    const json = JSON.parse(jsonText) as Record<string, unknown>
    const answers: Record<number, number> = {}
    for (const [key, val] of Object.entries(json)) {
      const qMatch = key.match(/^Q(\d+)$/)
      if (!qMatch || typeof val !== 'number' || val < 1 || val > 4) continue
      answers[Number(qMatch[1])] = val
    }
    if (totalQuestions != null && totalQuestions > 0) {
      const filtered: Record<number, number> = {}
      for (let i = 1; i <= totalQuestions; i++) {
        if (answers[i] != null) filtered[i] = answers[i]
      }
      return filtered
    }
    return answers
  } catch {
    return {}
  }
}

/** 에이전트 목록 미동기화 시 qcontent만으로 SURVEY 응답 여부 추정 (라이브러리 카드용) */
export const isLikelySurveyResponseByQcontent = (qcontent: string): boolean =>
  Object.keys(parseSurveyAnswersFromPrompt(qcontent)).length > 0 || isSurveyDiagnosticPrompt(qcontent)

/** 라이브러리 카드 질의 — 설문 readonly UI 표시 여부 (에이전트 목록 미로드 시 qcontent 폴백) */
export const isSurveyLibraryCardItem = (item: { agentId?: string; qcontent?: string }, agents: Agent[]): boolean => {
  const agentId = (item.agentId ?? '').trim()
  const qcontent = item.qcontent ?? ''
  if (agentId) {
    const agent = agents.find((a) => a.agentId === agentId)
    if (agent) return isSurveyAgent(agent)
  }
  return isLikelySurveyResponseByQcontent(qcontent)
}

/** 라이브러리 응답 — 방사형 차트·마커 분리 렌더 대상 (에이전트 미동기화 시 qcontent 폴백) */
export const isSurveyRadarLibraryCard = (agentId: string, qcontent: string, agents: Agent[]): boolean =>
  isSurveyRadarAgentById(agentId, agents) || isLikelySurveyResponseByQcontent(qcontent)

/** 라이브러리 응답 — Pexels 이미지 주입 대상 (에이전트 설정 또는 설문 qcontent + 이미지 키워드) */
export const shouldLibrarySurveyPexelsInject = (
  agentId: string,
  qcontent: string,
  rcontent: string,
  agents: Agent[],
): boolean =>
  isSurveyPexelsAgentById(agentId, agents) ||
  (isLikelySurveyResponseByQcontent(qcontent) && hasImageKeywordLines(rcontent))

/** 채팅 메시지 목록에 삽입할 type=survey 메시지 객체 생성 */
export const createSurveyMessage = (
  answers: Record<number, number>,
  submitted: boolean,
  agentId = '',
): ChatMessage => ({
  logId: `survey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: 'survey',
  createdAt: new Date().toISOString(),
  agentId,
  surveyAnswers: { ...answers },
  surveySubmitted: submitted,
})

/** ← 여기에 Pexels API 키 입력 (https://www.pexels.com/api/) */
const PEXELS_API_KEY = 'ZfMCftGUUwMVyRLpkijpkbMfC0AXC22TUNzTv5USRoeXItGM8S2m22Dx'

/** 2개 이상일 때 floor(n/2) | ceil(n/2) 2열 그리드 (예: 3→1/2, 5→2/3). Pexels attribution 포함 */
const buildPexelsGrid = (
  images: { keyword: string; url: string; fullUrl: string; photographer: string; photographerUrl: string }[],
): string => {
  const imgWrap = (img: {
    keyword: string
    url: string
    fullUrl: string
    photographer: string
    photographerUrl: string
  }) =>
    `<div class="pexels-img-wrap">` +
    `<img class="pexels-img" src="${img.url}" data-full="${img.fullUrl}" alt="${img.keyword}">` +
    `<a class="pexels-attribution" href="${img.photographerUrl}" target="_blank" rel="noopener noreferrer">Photo by ${img.photographer} on Pexels</a>` +
    `</div>`

  if (images.length === 1) {
    return `<div class="pexels-grid pexels-grid--single">${imgWrap(images[0])}</div>`
  }

  const leftCount = Math.floor(images.length / 2)
  const leftCol = images.slice(0, leftCount).map(imgWrap).join('')
  const rightCol = images.slice(leftCount).map(imgWrap).join('')
  return `<div class="pexels-grid"><div class="pexels-grid__col">${leftCol}</div><div class="pexels-grid__col">${rightCol}</div></div>`
}

const KEYWORD_REGEX =
  /^[\s\-•*]*(?:\d+[.)]\s*)?\*{0,2}이미지키워드\*{0,2}\s*:?\s*\*{0,2}\s*([a-zA-Z][a-zA-Z0-9-]*)\s*\*{0,2}\s*$/gmu

/** 스트리밍 중 미완성 키워드 라인도 제거 (높이 번쩍임 방지) */
export const removeKeywordLines = (answer: string): string =>
  answer.replace(/^[\s\-•*]*(?:\d+[.)]\s*)?\*{0,2}이미지키워드\*{0,2}[^\n\r]*/gmu, '')

/** LLM 응답에 이미지키워드 라인이 포함됐는지 */
export const hasImageKeywordLines = (answer: string): boolean =>
  [...answer.matchAll(new RegExp(KEYWORD_REGEX.source, KEYWORD_REGEX.flags))].length > 0

/** LLM 응답에서 이미지키워드 블록 앞/뒤 텍스트 분리 */
export const extractKeywordSection = (answer: string): { beforeText: string; afterText: string } => {
  const matches = [...answer.matchAll(new RegExp(KEYWORD_REGEX.source, KEYWORD_REGEX.flags))]
  if (!matches.length) return { beforeText: answer, afterText: '' }

  const firstStart = matches[0].index ?? 0
  const lastEnd = (matches[matches.length - 1].index ?? 0) + matches[matches.length - 1][0].length

  return { beforeText: answer.substring(0, firstStart), afterText: answer.substring(lastEnd) }
}

/** Pexels 이미지 로딩 중 표시할 스피너 HTML */
export const PEXELS_LOADING_HTML = '<div class="pexels-loading"><div class="pexels-loading__spinner"></div></div>'

/** LLM 응답의 이미지키워드 라인을 Pexels API로 조회해 그리드 HTML 생성 */
export const fetchAndInjectPexelsImages = async (
  answer: string,
  logId?: string,
): Promise<{ beforeText: string; afterText: string; gridHtml: string }> => {
  if (logId) {
    const cached = getPexelsImageCache(logId)
    if (cached) return cached
  }

  const matches = [...answer.matchAll(new RegExp(KEYWORD_REGEX.source, KEYWORD_REGEX.flags))]
  if (!matches.length) return { beforeText: answer, afterText: '', gridHtml: '' }

  const firstMatchStart = matches[0].index ?? 0
  const lastMatch = matches[matches.length - 1]
  const lastMatchEnd = (lastMatch.index ?? 0) + lastMatch[0].length

  const beforeText = answer.substring(0, firstMatchStart)
  const afterText = answer.substring(lastMatchEnd)

  const imageResults = await Promise.all(
    matches.map(async (m) => {
      const [, keyword] = m
      try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1`, {
          headers: { Authorization: PEXELS_API_KEY },
        })
        const data = (await res.json()) as {
          photos?: {
            src?: { large?: string; large2x?: string }
            photographer?: string
            photographer_url?: string
          }[]
        }
        const photo = data.photos?.[0]
        return {
          keyword,
          url: photo?.src?.large ?? null,
          fullUrl: photo?.src?.large2x ?? photo?.src?.large ?? null,
          photographer: photo?.photographer ?? null,
          photographerUrl: photo?.photographer_url ?? null,
        }
      } catch {
        return { keyword, url: null, fullUrl: null, photographer: null, photographerUrl: null }
      }
    }),
  )

  const validImages = imageResults.filter(
    (img): img is { keyword: string; url: string; fullUrl: string; photographer: string; photographerUrl: string } =>
      img.url !== null && img.photographer !== null && img.photographerUrl !== null,
  )

  if (!validImages.length) {
    const emptyResult = { beforeText, afterText, gridHtml: '' }
    if (logId) setPexelsImageCache(logId, emptyResult)
    return emptyResult
  }

  // DOM 교체 전 브라우저 캐시에 미리 적재 → 레이아웃 재계산 없이 한 번에 렌더링
  await Promise.all(
    validImages.map(
      ({ url }) =>
        new Promise<void>((resolve) => {
          const el = new window.Image()
          el.onload = () => resolve()
          el.onerror = () => resolve()
          el.src = url
        }),
    ),
  )

  const result = { beforeText, afterText, gridHtml: buildPexelsGrid(validImages) }
  if (logId) setPexelsImageCache(logId, result)
  return result
}

/** 방사형 차트 8개 영역 점수 (LLM·API 응답 키: camelCase) */
export type RadarChartScore = {
  physicalEnvironment: number
  jobDemand: number
  jobAutonomy: number
  interpersonalConflict: number
  jobInsecurity: number
  organizationalSystem: number
  inadequateCompensation: number
  workplaceCulture: number
}

/** 방사형 차트 종합 위험군 레벨 (StressLevel 별칭) */
export type RadarChartRiskLevel = StressLevel

/**
 * KOSS-SF1 별표 4 — 성별별 영역 참고치 (0~100 환산 점수 기준)
 * 정상Max: A등급 상한, 경계Max: B등급 상한 (초과 시 C 고위험)
 */
export const KOSS_SF1_RISK_TABLE: Record<
  SurveyGender,
  Record<keyof RadarChartScore, { 정상Max: number; 경계Max: number }>
> = {
  male: {
    physicalEnvironment: { 정상Max: 44.4, 경계Max: 66.6 },
    jobDemand: { 정상Max: 50.0, 경계Max: 58.3 },
    jobAutonomy: { 정상Max: 50.0, 경계Max: 66.6 },
    interpersonalConflict: { 정상Max: 33.3, 경계Max: 44.4 },
    jobInsecurity: { 정상Max: 50.0, 경계Max: 66.6 },
    organizationalSystem: { 정상Max: 50.0, 경계Max: 66.6 },
    inadequateCompensation: { 정상Max: 55.5, 경계Max: 66.6 },
    workplaceCulture: { 정상Max: 41.6, 경계Max: 50.0 },
  },
  female: {
    physicalEnvironment: { 정상Max: 44.4, 경계Max: 55.5 },
    jobDemand: { 정상Max: 58.3, 경계Max: 66.6 },
    jobAutonomy: { 정상Max: 58.3, 경계Max: 66.6 },
    interpersonalConflict: { 정상Max: 33.3, 경계Max: 44.4 },
    jobInsecurity: { 정상Max: 33.3, 경계Max: 50.0 },
    organizationalSystem: { 정상Max: 50.0, 경계Max: 66.6 },
    inadequateCompensation: { 정상Max: 55.5, 경계Max: 66.6 },
    workplaceCulture: { 정상Max: 41.6, 경계Max: 50.0 },
  },
}

/** KOSS-SF1 별표 4 — 성별별 총점 참고치 */
export const KOSS_SF1_TOTAL_RISK: Record<SurveyGender, { 정상Max: number; 경계Max: number }> = {
  male: { 정상Max: 48.4, 경계Max: 54.7 },
  female: { 정상Max: 50.0, 경계Max: 55.6 },
}

/** LLM/백엔드 JSON → 방사형 차트 컴포넌트 주입 DTO */
export type RadarChartData = {
  scores: RadarChartScore
  riskLevel: RadarChartRiskLevel
  riskColor: string
  riskBgColor: string
  riskSummary: string
  coreAreasSummary: string
}

/** RadarChartScore 키 표시 순서 (차트·그리드 공통) */
export const PSYCHOLOGY_RADAR_SCORE_KEYS: readonly (keyof RadarChartScore)[] = [
  'physicalEnvironment',
  'jobDemand',
  'jobAutonomy',
  'interpersonalConflict',
  'jobInsecurity',
  'organizationalSystem',
  'inadequateCompensation',
  'workplaceCulture',
] as const

/** RadarChartScore 영어 키 → UI 한글 라벨 */
export const PSYCHOLOGY_RADAR_LABEL_KO: Record<keyof RadarChartScore, string> = {
  physicalEnvironment: '물리적환경',
  jobDemand: '직무요구',
  jobAutonomy: '직무자율',
  interpersonalConflict: '관계갈등',
  jobInsecurity: '직무불안정',
  organizationalSystem: '조직체계',
  inadequateCompensation: '보상부적절',
  workplaceCulture: '직장문화',
}

/** 구 LLM 응답 한글 scores 키 호환 */
const LEGACY_RADAR_SCORE_KO_TO_EN: Record<string, keyof RadarChartScore> = {
  물리적환경: 'physicalEnvironment',
  직무요구: 'jobDemand',
  직무자율: 'jobAutonomy',
  관계갈등: 'interpersonalConflict',
  직무불안정: 'jobInsecurity',
  조직체계: 'organizationalSystem',
  보상부적절: 'inadequateCompensation',
  직장문화: 'workplaceCulture',
}

/** LLM JSON scores 값 → number (문자열 허용) */
const coerceRadarScoreNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

/**
 * 0~100 환산 점수 → KOSS-SF1 별표 4 영역별 참고치 기반 등급
 * area 미지정 시 0~100 균등 3분할 fallback (영역별 판정에는 area 필수)
 */
export const stressLevelFromPsychologyRadarScore100 = (
  score: number,
  gender?: SurveyGender | null,
  area?: keyof RadarChartScore,
): StressLevel => {
  if (area) {
    const config = activeSurveyConfig.value
    const g = gender ?? 'male'
    const fromConfig = config?.areaRiskByGender[g]?.[area]
    if (fromConfig) {
      if (score <= fromConfig.normalMax) return '정상'
      if (score <= fromConfig.cautionMax) return '경계'
      return '고위험'
    }
    const thresholds = KOSS_SF1_RISK_TABLE[g][area]
    if (score <= thresholds.정상Max) return '정상'
    if (score <= thresholds.경계Max) return '경계'
    return '고위험'
  }
  if (score <= 33.3) return '정상'
  if (score <= 66.6) return '경계'
  return '고위험'
}

/** SCSS $color-success·warning·error 와 동일 hex */
export const STRESS_LEVEL_LABEL_HEX: Record<StressLevel, string> = {
  정상: '#22c55e',
  경계: '#f59e0b',
  고위험: '#ef4444',
}

/** StressLevel → hex (없으면 slate fallback) */
export const hexForStressLevel = (level: StressLevel): string => STRESS_LEVEL_LABEL_HEX[level] ?? '#64748b'

/** RadarChartData → StressScoreGrid props.items */
export const buildStressItemsFromRadarChartData = (
  data: RadarChartData,
  gender?: SurveyGender | null,
): StressScoreItem[] => {
  return PSYCHOLOGY_RADAR_SCORE_KEYS.map((key) => {
    const raw = data.scores[key]
    const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
    return {
      name: PSYCHOLOGY_RADAR_LABEL_KO[key],
      value,
      level: stressLevelFromPsychologyRadarScore100(value, gender, key),
    }
  })
}

/** RadarChartData → UiChart radarStressConfig 형태 객체 */
export const buildPsychologyRadarUiChartConfig = (
  data: RadarChartData,
  gender?: SurveyGender | null,
): Record<string, unknown> => {
  const items = buildStressItemsFromRadarChartData(data, gender)
  const levelColors = items.map((i) => hexForStressLevel(i.level))
  return {
    categories: items.map((i) => i.name),
    data: items.map((i) => i.value),
    color: data.riskColor || '#ef4444',
    maxValue: 100,
    stepSize: 20,
    fillOpacity: 0.25,
    pointLabelFormat: (name: string, value: number) =>
      `${name} (${typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : String(value)})`,
    pointLabelColors: levelColors, // 축 라벨 — 영역별 등급 색
    pointBackgroundColors: levelColors, // 꼭짓점 — 라인·면(color)은 종합 riskColor 유지
  }
}

/** LLM/백엔드 raw JSON → RadarChartData (한글 scores 키 fallback) */
function normalizeRadarChartData(raw: Record<string, unknown>): RadarChartData | null {
  const scoresRaw = raw.scores
  if (!scoresRaw || typeof scoresRaw !== 'object') return null
  const obj = scoresRaw as Record<string, unknown>
  const scores: Partial<RadarChartScore> = {}

  for (const key of PSYCHOLOGY_RADAR_SCORE_KEYS) {
    const n = coerceRadarScoreNumber(obj[key])
    if (n != null) scores[key] = n
  }
  for (const [ko, en] of Object.entries(LEGACY_RADAR_SCORE_KO_TO_EN)) {
    if (scores[en] != null) continue
    const n = coerceRadarScoreNumber(obj[ko])
    if (n != null) scores[en] = n
  }
  if (PSYCHOLOGY_RADAR_SCORE_KEYS.some((k) => scores[k] == null)) return null

  const rl = raw.riskLevel
  const riskLevel: RadarChartRiskLevel = rl === '정상' || rl === '경계' || rl === '고위험' ? rl : '경계'

  return {
    scores: scores as RadarChartScore,
    riskLevel,
    riskColor: typeof raw.riskColor === 'string' ? raw.riskColor : '#3b82f6',
    riskBgColor: typeof raw.riskBgColor === 'string' ? raw.riskBgColor : '#eff6ff',
    riskSummary: typeof raw.riskSummary === 'string' ? raw.riskSummary : '',
    coreAreasSummary: typeof raw.coreAreasSummary === 'string' ? raw.coreAreasSummary : '',
  }
}

type PexelsCacheEntry = { beforeText: string; afterText: string; gridHtml: string }
const pexelsImageCache = new Map<string, PexelsCacheEntry>()

/** logId별 Pexels 그리드 결과 캐시 조회 */
export const getPexelsImageCache = (logId: string): PexelsCacheEntry | null => pexelsImageCache.get(logId) ?? null

/** logId별 Pexels 그리드 결과 캐시 저장 */
export const setPexelsImageCache = (logId: string, entry: PexelsCacheEntry): void => {
  pexelsImageCache.set(logId, entry)
}

const radarChartCache = new Map<string, RadarChartData>()

/** logId별 방사형 차트 데이터 캐시 조회 */
export const getRadarChartCache = (logId: string): RadarChartData | null => radarChartCache.get(logId) ?? null

/** logId별 방사형 차트 데이터 캐시 저장 */
export const setRadarChartCache = (logId: string, data: RadarChartData): void => {
  radarChartCache.set(logId, data)
}

/** 캐시 히트 후 canvas 초기화 레이스 완화 */
export function schedulePsychologyRadarUiInjection(fn: () => void): () => void {
  if (typeof window === 'undefined') {
    queueMicrotask(fn)
    return () => {}
  }
  const id = window.setTimeout(() => nextTick(fn), 160)
  return () => clearTimeout(id)
}

const AI_IMAGE_MARKER_REGEX = /^\[방사형그래프\]\s*$/mu

/** 방사형 차트 로딩 스피너 HTML ([방사형그래프] 마커 위치) */
export const AI_IMAGE_LOADING_HTML = '<div class="pexels-loading"><div class="pexels-loading__spinner"></div></div>'

/** LLM 응답에서 [방사형그래프] 마커 기준 앞/뒤 텍스트 분리 */
export const extractAiImageMarkerSection = (answer: string): { before: string; after: string; found: boolean } => {
  const match = answer.match(AI_IMAGE_MARKER_REGEX)
  if (!match || match.index == null) return { before: answer, after: '', found: false }
  return {
    before: answer.substring(0, match.index),
    after: answer.substring(match.index + match[0].length),
    found: true,
  }
}

/** LLM 응답에서 섹션 1~4 텍스트만 추출 (### 5. 이전) */
export const extractSections1to4 = (answer: string): string => {
  const section5Match = answer.match(/^###\s*5\./m)
  if (!section5Match?.index) return answer.slice(0, 2000)
  return answer.substring(0, section5Match.index).trim()
}

/** 영역별 0~100 점수 → 등급 (buildRadarChartPrompt 예시문용) */
const stressTierFromScore100ByArea = (
  score100: number,
  area: keyof RadarChartScore | string,
  gender: SurveyGender | null,
): RadarChartRiskLevel => stressLevelFromPsychologyRadarScore100(score100, gender, area as keyof RadarChartScore)

/** LLM 응답에서 risk-badge class → hex 색상 */
const resolveRiskColorsFromResponse = (sectionsText: string): { riskBg: string; riskColor: string } => {
  const match = sectionsText.match(/class="risk-badge\s+(risk-\w+)"/)
  const cls = match?.[1] ?? ''
  if (cls === 'risk-safe') return { riskBg: '#ecfdf5', riskColor: '#22c55e' }
  if (cls === 'risk-caution') return { riskBg: '#fffbeb', riskColor: '#f59e0b' }
  if (cls === 'risk-danger') return { riskBg: '#fef2f2', riskColor: '#ef4444' }
  return { riskBg: '#ffffff', riskColor: '#ef4444' }
}

const RISK_BADGE_CLASS_TO_LEVEL: Record<string, RadarChartRiskLevel> = {
  'risk-safe': '정상',
  'risk-caution': '경계',
  'risk-danger': '고위험',
}

/** 섹션 1 HTML에서 risk-badge·risk-status 파싱 → 차트 riskLevel 고정용 */
const parseSection1ForRadarChart = (
  sectionsText: string,
): { riskLevel: RadarChartRiskLevel; riskColor: string; riskBgColor: string; riskSummary: string } | null => {
  const badgeMatch = sectionsText.match(
    /<span class="risk-badge\s+(risk-(?:safe|caution|warning|danger))">([^<]*)<\/span>/,
  )
  if (!badgeMatch?.[1]) return null
  const badgeClass = badgeMatch[1]
  const riskLevel = RISK_BADGE_CLASS_TO_LEVEL[badgeClass]
  if (!riskLevel) return null
  const { riskColor, riskBg: riskBgColor } = resolveRiskColorsFromResponse(`class="risk-badge ${badgeClass}"`)
  const statusMatch = sectionsText.match(/<span class="risk-status\s+[^"]+">([\s\S]*?)<\/span>/)
  const riskSummary = (statusMatch?.[1] ?? '').replace(/<[^>]+>/g, '').trim()
  return { riskLevel, riskColor, riskBgColor, riskSummary }
}

/** 섹션 1~4 + 설문 답변 → 방사형 차트 JSON 요청 프롬프트 조립 */
const buildRadarChartPrompt = (
  answers: Record<number, number>,
  sectionsText: string,
  gender: SurveyGender | null,
  config: SurveyAgentConfig,
): string => {
  const reverseSet = new Set(config.reverseQuestionNos)
  const allStats = config.categories.map((cat) => ({
    ko: cat.title.replace(/\s+/g, ''),
    en: cat.key,
    stats: calcCategoryStats(cat.questionNos, answers, reverseSet),
  }))
  const totalScore = (allStats.reduce((acc, a) => acc + Number(a.stats.score100), 0) / allStats.length).toFixed(2)

  const areas100Sorted = [...allStats]
    .map((a) => ({ ko: a.ko, en: a.en as keyof RadarChartScore, s100: a.stats.score100 }))
    .sort((a, b) => Number(b.s100) - Number(a.s100))
  const topA = areas100Sorted[0]
  const topB = areas100Sorted[1]
  const coreAreasSummaryExample =
    topA && topB
      ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100ByArea(Number(topA.s100), topA.en, gender)})·${topB.ko}(${topB.s100}, ${stressTierFromScore100ByArea(Number(topB.s100), topB.en, gender)}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
      : topA
        ? `"${topA.ko}(${topA.s100}, ${stressTierFromScore100ByArea(Number(topA.s100), topA.en, gender)}) 영역이 핵심 스트레스 요인으로 나타났습니다."`
        : '"(영역명)(0~100값, 정상|경계|고위험) 형식으로 기재"'

  const section1Anchors = parseSection1ForRadarChart(sectionsText)
  const { riskColor } = resolveRiskColorsFromResponse(sectionsText)

  const section1LockBlock = section1Anchors
    ? `
위 진단 분석 본문 중 "### 1. 현재 상태 요약"에 이미 출력된 HTML을 기준으로, 아래 네 값은 **이미 확정된 결과**입니다.
8개 영역의 환산 점수·총점·구간표로 riskLevel을 **다시 계산하거나 바꾸지 마세요.** JSON 필드에 **글자 단위로 동일하게** 넣으세요.

- riskLevel: ${JSON.stringify(section1Anchors.riskLevel)}
- riskColor: ${JSON.stringify(section1Anchors.riskColor)}
- riskBgColor: ${JSON.stringify(section1Anchors.riskBgColor)}
- riskSummary: ${JSON.stringify(section1Anchors.riskSummary)}
`
    : ''

  const genderLabel = gender === 'female' ? '여성' : '남성'
  const resolvedGender: SurveyGender = gender ?? 'male'
  const totalRisk = toLegacyTotalRisk(config, resolvedGender)
  const riskJudgementBlock = section1Anchors
    ? `
위험 수준 (riskLevel·riskColor·riskBgColor·riskSummary): 위 「이미 확정된 결과」블록과 **완전히 동일**하게만 출력합니다. 임의 수정·요약 재작성 금지.
`
    : `
위험 수준 판정 (${genderLabel} 기준 KOSS-SF1 참고치 적용):
PDF 규정에 따라 산출한 총점 = (8개 영역의 환산 점수의 총합) ÷ 8 을 계산한 뒤 아래 구간표로 riskLevel을 결정하세요.

총점 구간표 (${genderLabel} 기준):
- ≤${totalRisk.정상Max}: 정상  → riskLevel: "정상", riskColor: "#22c55e", riskBgColor: "#ecfdf5"
- ${totalRisk.정상Max + 0.1}~${totalRisk.경계Max}: 경계  → riskLevel: "경계", riskColor: "#f59e0b", riskBgColor: "#fffbeb"
- ≥${totalRisk.경계Max + 0.1}: 고위험 → riskLevel: "고위험", riskColor: "#ef4444", riskBgColor: "#fef2f2"
`

  const riskSummaryRule = section1Anchors
    ? '- riskSummary: 위 「이미 확정된 결과」의 riskSummary 문자열과 동일 (공백·줄바꿈 포함 그대로)'
    : '- riskSummary: 현재 위험군을 한 문장으로 설명 (예: "전반적으로 직무요구와 조직체계 영역에서 경계 수준의 스트레스가 감지됩니다.")'

  const riskLevelColorRule = section1Anchors
    ? '- riskLevel / riskColor / riskBgColor: 위 「이미 확정된 결과」블록과 동일 (PDF 공식·구간표로 재판정 금지)'
    : '- riskLevel / riskColor / riskBgColor: 「(8개 영역 환산 점수의 총합) ÷ 8」로 계산한 총점이 속한 「KOSS-SF1 총점 구간표」에서 선택'

  const coreAreasSummaryRule = `- coreAreasSummary: **scores의 0~100 값**으로 영역 간 상대 크기를 비교해 가장 큰 영역 1~2개를 고릅니다. 각 영역의 단계(정상/경계/고위험)는 반드시 아래 「영역별 단계 판정 기준」표(KOSS-SF1 PDF 23p 참고치)에 해당 영역의 0~100 점수를 대입해 판정합니다. **균등한 33.33/66.67 분할 표를 절대 사용하지 마세요.** 영역마다 임계값이 다릅니다. 문장·괄호 안에 **1~4 척도 원점수는 쓰지 마세요.** 괄호 안 형식: 한글 영역명(0~100값, 구간표 단계) (예: ${coreAreasSummaryExample})`

  const areaCalcTable = allStats
    .map(
      ({ ko, en, stats }) =>
        `- ${ko}(${en}): 실제 점수의 합 ${stats.sumActual}, 문항 개수 ${stats.itemCount}, 예상 가능한 최고 점수의 합 ${stats.sumMax}` +
        ` → (${stats.sumActual} − ${stats.itemCount}) ÷ (${stats.sumMax} − ${stats.itemCount}) × 100 = ${stats.score100}`,
    )
    .join('\n')

  const areaScoreList = allStats.map(({ ko, en, stats }) => `- ${ko}(${en}): ${stats.score100}`).join('\n')

  const riskTableForGender = toLegacyAreaRisk(config, resolvedGender)
  const areaThresholdTable = allStats
    .map(({ ko, en }) => {
      const t = riskTableForGender[en as keyof RadarChartScore]
      return `| ${ko} | ≤${t.정상Max} | ${t.정상Max} 초과 ~ ${t.경계Max} | ${t.경계Max} 초과 |`
    })
    .join('\n')

  return `[방사형 차트 데이터 요청]
아래 진단 결과를 바탕으로 방사형 차트 컴포넌트에 주입할 데이터를 JSON 형식으로 응답하세요.
마크다운 코드블록(\`\`\`) 없이 순수 JSON 문자열만 출력하세요. 다른 텍스트는 절대 추가하지 마세요.
${section1LockBlock}
[KOSS-SF1 평가점수 산출 공식 — 산업안전보건연구원 PDF 규정]
각 영역별 환산 점수 = (해당 영역에서 평가한 실제 점수의 합 − 문항 개수) ÷ (해당 영역에서 예상 가능한 최고 점수의 합 − 문항 개수) × 100
- 평가 척도: 1점(전혀 그렇지 않다) ~ 4점(매우 그렇다)
- 한 문항의 최고 점수 = 4점 → 영역별 「예상 가능한 최고 점수의 합」 = 4 × 문항 개수
- [역] 표시 문항은 역코딩(1↔4, 2↔3) 후 합산
- 결과 범위: 0~100점

총점(KOSS-SF1) = (8개 영역의 환산 점수의 총합) ÷ 8

[영역별 PDF 공식 산출 과정 — 역코딩 적용 후]
${areaCalcTable}

[영역별 0~100 환산 점수 (JSON scores에 넣을 숫자와 **반드시 일치**, 소수 둘째 자리)]
${areaScoreList}

[총점] (8개 영역의 환산 점수의 총합) ÷ 8 = ${totalScore}

scores 키 매핑 (JSON scores에는 반드시 오른쪽 영어만 사용):
- 물리적환경 → physicalEnvironment
- 직무요구 → jobDemand
- 직무자율 → jobAutonomy
- 관계갈등 → interpersonalConflict
- 직무불안정 → jobInsecurity
- 조직체계 → organizationalSystem
- 보상부적절 → inadequateCompensation
- 직장문화 → workplaceCulture

${section1Anchors ? '' : `현재 판정된 위험군 색상 참고 (진단 분석에서 추출):\n- riskColor: ${riskColor}\n`}

${riskJudgementBlock}
[scores 필드 환산 규칙]
각 영역의 0~100 환산 점수는 위 「KOSS-SF1 평가점수 산출 공식」을 그대로 적용합니다.
즉, scores[영역] = (실제 점수의 합 − 문항 개수) ÷ (예상 가능한 최고 점수의 합 − 문항 개수) × 100, 소수 둘째 자리까지 반올림하여 number로 기재.
(예: 실제합=문항수×1 → 0, 실제합=문항수×2.5 → 50, 실제합=문항수×4 → 100)

영역별 단계 판정 기준 (KOSS-SF1 PDF 23p — ${genderLabel} 기준 참고치 / coreAreasSummary 단계 표기 시 **반드시 이 표 사용**${section1Anchors ? '' : ' / 단, 종합 위험 판정은 위 총점 구간표를 따를 것'}):

| 영역 | 정상 | 경계 | 고위험 |
|------|------|------|--------|
${areaThresholdTable}

⚠️ 영역마다 임계값이 다릅니다. 모든 영역에 균등하게 0~33.33/33.34~66.67/66.68~100을 적용하면 잘못된 단계가 됩니다. 반드시 위 표의 해당 영역 행을 읽어 단계를 결정하세요.

응답 JSON 스키마 (키 이름·타입 정확히 준수):
{
  "scores": {
    "physicalEnvironment": number,
    "jobDemand": number,
    "jobAutonomy": number,
    "interpersonalConflict": number,
    "jobInsecurity": number,
    "organizationalSystem": number,
    "inadequateCompensation": number,
    "workplaceCulture": number
  },
  "riskLevel": "정상" | "경계" | "고위험",
  "riskColor": string,
  "riskBgColor": string,
  "riskSummary": string,
  "coreAreasSummary": string
}

필드 작성 규칙:
- scores: 위 「영역별 0~100 환산 점수」목록과 **동일한 숫자**만 기재 (문자열 금지), 키는 반드시 영어 스키마대로. PDF 공식 외 다른 방식으로 재계산하거나 반올림 방식을 바꾸지 마세요.
${riskLevelColorRule}
${riskSummaryRule}
${coreAreasSummaryRule}
`
}

/** 섹션 1~4 + Q응답 → 백엔드 API로 RadarChartData 요청 */
export const fetchPsychologyRadarChartData = async (
  sectionsText: string,
  answers: Record<number, number>,
  gender: SurveyGender | null = null,
): Promise<RadarChartData | null> => {
  const config = activeSurveyConfig.value
  if (!config) return null
  try {
    const { post } = useApi()
    const prompt = `${sectionsText}\n\n${buildRadarChartPrompt(answers, sectionsText, gender, config)}`
    const data = await post<{ chartData?: string; result?: string }>('/ai/chatbot/getPsychologyChartData.do', {
      prompt,
    })

    const raw = data.chartData ?? data.result ?? null
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    return normalizeRadarChartData(parsed)
  } catch {
    return null
  }
}

const isSurveyVisible = ref(false)
const surveyAnswers = ref<Record<number, number>>({})
const isGenderStepVisible = ref(false)
const surveyGender = ref<SurveyGender | null>(null)

/** 설문 제출 채팅방 — 첫 question 메시지(진단 프롬프트) UI 숨김용 */
const surveyRoomIds = ref<Set<string>>(new Set())

/** 설문 UI 상태·플로우 (성별 선택 → 문항 응답 → 제출) */
export const usePsychologySurvey = () => {
  /** 성별 선택 Step 0 표시 */
  const openGenderStep = () => {
    surveyAnswers.value = {}
    surveyGender.value = null
    isGenderStepVisible.value = true
    isSurveyVisible.value = false
  }

  /** 성별 확정 후 설문 문항 UI 표시 */
  const confirmGender = (gender: SurveyGender) => {
    surveyGender.value = gender
    isGenderStepVisible.value = false
    isSurveyVisible.value = true
  }

  /** 설문·성별 단계 모두 닫기 */
  const closePsychologySurvey = () => {
    isSurveyVisible.value = false
    isGenderStepVisible.value = false
  }

  /** 성별 없이 설문 바로 시작 (requireGender=false) */
  const openPsychologySurvey = () => {
    surveyAnswers.value = {}
    isSurveyVisible.value = true
  }

  /** 문항별 응답 저장 */
  const setSurveyAnswer = (questionNo: number, score: number) => {
    surveyAnswers.value = { ...surveyAnswers.value, [questionNo]: score }
  }

  const answeredCount = computed(() => Object.keys(surveyAnswers.value).length)

  const isSurveyComplete = computed(
    () => Object.keys(surveyAnswers.value).length === (activeSurveyConfig.value?.totalQuestions ?? 0),
  )

  /** 설문 제출 채팅방 등록 (진단 프롬프트 메시지 숨김) */
  const registerSurveyRoom = (roomId: string) => {
    surveyRoomIds.value = new Set([...surveyRoomIds.value, roomId])
  }

  /** 해당 roomId가 설문 제출 방인지 */
  const isSurveyRoom = (roomId: string) => surveyRoomIds.value.has(roomId)

  return {
    isSurveyVisible,
    isGenderStepVisible,
    surveyGender,
    surveyAnswers,
    answeredCount,
    isSurveyComplete,
    openGenderStep,
    confirmGender,
    openPsychologySurvey,
    closePsychologySurvey,
    setSurveyAnswer,
    registerSurveyRoom,
    isSurveyRoom,
  }
}

/** usePsychologySurvey 별칭 */
export const useSurvey = usePsychologySurvey

/** /chat 인덱스·채팅방에서 SURVEY 에이전트 선택 시 설문 플로우 시작 */
export const handleSelectSurveyChatIndexAgent = (
  agent: Agent,
  ctx: { roomId: string; messages: ChatMessage[] },
): { appendMessage?: ChatMessage } => {
  const surveyConfig = parseSurveyConfigFromAgent(agent)
  if (!surveyConfig) return {}

  setActiveSurveyConfig(surveyConfig)
  const { openGenderStep, openPsychologySurvey } = usePsychologySurvey()

  const startSurveyFlow = () => {
    if (surveyConfig.requireGender) openGenderStep()
    else openPsychologySurvey()
  }

  if (ctx.roomId) {
    const alreadyHasSurvey = ctx.messages.some((m) => m.type === 'survey' && !m.surveySubmitted)
    if (alreadyHasSurvey) return {}
    startSurveyFlow()
    return { appendMessage: createSurveyMessage({}, false, agent.agentId) }
  }

  startSurveyFlow()
  return {}
}

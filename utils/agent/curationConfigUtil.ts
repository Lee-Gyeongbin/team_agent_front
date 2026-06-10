import type { AgtSubAdditionalConfig, CurationCandidateSource, CurationResultFieldDef } from '~/types/agent'

/** Agent 설정 UI — CURATION ADDITIONAL_CONFIG 편집 필드 */
export interface CurationCandidateSourceForm {
  codeId: string
  rssCategory: string
  feedUrl: string
}

export interface CurationResultFieldForm {
  key: string
  label: string
  type: 'link' | 'text' | ''
}

export interface CurationConfigForm {
  agentId: string
  agentName: string
  agentPersona: string
  agentMission: string
  introTitle: string
  introSubtitle: string
  cardTitle: string
  cardSubtitleResult: string
  cardSubtitleReadonly: string
  selectionHint: string
  footerTip: string
  emptyMessage: string
  categoryEmptyMessage: string
  summaryNotice: string
  pendingStatusTexts: string[]
  codeGrpId: string
  maxCategoryCount: number
  candidateSources: CurationCandidateSourceForm[]
  pressLabel: string
  snippetMaxLength: number
  outputSchemaItemFields: string[]
  resultTopN: number
  nameField: string
  imageField: string
  resultFields: CurationResultFieldForm[]
  constraints: string[]
  language: string
  version: string
}

const DEFAULT_CANDIDATE_SOURCES: CurationCandidateSourceForm[] = [
  { codeId: '001', rssCategory: '정치', feedUrl: 'https://www.yna.co.kr/rss/politics.xml' },
  { codeId: '002', rssCategory: '경제', feedUrl: 'https://www.yna.co.kr/rss/economy.xml' },
  { codeId: '003', rssCategory: '사회', feedUrl: 'https://www.yna.co.kr/rss/society.xml' },
  { codeId: '004', rssCategory: '산업', feedUrl: 'https://www.yna.co.kr/rss/industry.xml' },
  { codeId: '005', rssCategory: '문화', feedUrl: 'https://www.yna.co.kr/rss/culture.xml' },
  { codeId: '006', rssCategory: '세계', feedUrl: 'https://www.yna.co.kr/rss/international.xml' },
  { codeId: '007', rssCategory: '건강', feedUrl: 'https://www.yna.co.kr/rss/health.xml' },
  { codeId: '008', rssCategory: '연예', feedUrl: 'https://www.yna.co.kr/rss/entertainment.xml' },
  { codeId: '009', rssCategory: '스포츠', feedUrl: 'https://www.yna.co.kr/rss/sports.xml' },
  { codeId: '010', rssCategory: '주식', feedUrl: 'https://www.yna.co.kr/rss/market.xml' },
]

const DEFAULT_RESULT_FIELDS: CurationResultFieldForm[] = [
  { key: 'source', label: '언론사', type: '' },
  { key: 'category', label: '카테고리', type: '' },
  { key: 'summary', label: '요약', type: '' },
  { key: 'sourceUrl', label: '기사보기', type: 'link' },
]

const DEFAULT_CONSTRAINTS = [
  '반드시 후보 기사 목록(JSON 배열)에 있는 기사 중에서만 선택할 것. 새로운 기사를 생성하거나 변형하지 말 것.',
  '각 카테고리당 topN개의 기사를 선정할 것.',
  'summary는 기사 snippet을 바탕으로 1~2문장으로 요약할 것.',
  'category 필드에는 후보 기사의 rssCategory 값을 그대로 사용할 것.',
  'sourceUrl·imageUrl은 후보 기사의 값을 그대로 사용할 것 (생성 금지).',
  '반드시 JSON 배열만 출력. 코드블록·마크다운·설명 텍스트 금지.',
  '위 필드만 출력. 모든 문자열 값은 반드시 닫는 따옴표(")까지 포함할 것. JSON.parse()로 파싱 가능한 완전한 배열만 최종 출력할 것.',
]

const DEFAULT_PENDING_STATUS_TEXTS = [
  '어울리는 뉴스를 찾고 있는 중입니다...',
  '관심 카테고리별 기사를 분석하고 있습니다...',
  '최적의 기사를 선별하는 중입니다...',
]

const DEFAULT_OUTPUT_SCHEMA_FIELDS = ['title', 'source', 'category', 'summary', 'sourceUrl', 'imageUrl']

const cloneCandidateSources = (sources: CurationCandidateSourceForm[]): CurationCandidateSourceForm[] =>
  sources.map((s) => ({ ...s }))

const cloneResultFields = (fields: CurationResultFieldForm[]): CurationResultFieldForm[] =>
  fields.map((f) => ({ ...f }))

/** 신규 CURATION 에이전트 기본값 (뉴스픽 템플릿) */
export const emptyCurationConfigForm = (): CurationConfigForm => ({
  agentId: 'news-curation',
  agentName: '뉴스픽',
  agentPersona: '최신 뉴스 트렌드를 파악하고 사용자 관심사에 맞는 기사를 선별하는 뉴스 큐레이터',
  agentMission: '사용자가 선택한 관심 카테고리의 후보 기사 중 가장 가치 있는 기사를 선별하여 추천하는 것이 임무입니다.',
  introTitle: '오늘의 뉴스픽',
  introSubtitle: '오늘의 뉴스픽을 준비 중입니다...',
  cardTitle: '오늘의 뉴스픽',
  cardSubtitleResult: '골라주신 {categories} 카테고리를 통해 선정한 뉴스픽입니다!',
  cardSubtitleReadonly: '추천 요청이 완료되었습니다.',
  selectionHint: '선택하신 뉴스 분야입니다.',
  footerTip: 'TIP. 최대 {max}개까지 선택할 수 있으며, 선택한 분야를 기반으로 맞춤 뉴스를 추천해드립니다.',
  emptyMessage: '아직 표시할 뉴스가 없습니다. 잠시 후 다시 확인해 주세요.',
  categoryEmptyMessage: '{category} 분야에 표시할 뉴스가 없습니다.',
  summaryNotice: '※ 기사에 대한 설명은 AI가 제작한 참고용으로 정확하지 않을 수 있습니다.',
  pendingStatusTexts: [...DEFAULT_PENDING_STATUS_TEXTS],
  codeGrpId: 'NC000001',
  maxCategoryCount: 5,
  candidateSources: cloneCandidateSources(DEFAULT_CANDIDATE_SOURCES),
  pressLabel: '연합뉴스',
  snippetMaxLength: 400,
  outputSchemaItemFields: [...DEFAULT_OUTPUT_SCHEMA_FIELDS],
  resultTopN: 5,
  nameField: 'title',
  imageField: 'imageUrl',
  resultFields: cloneResultFields(DEFAULT_RESULT_FIELDS),
  constraints: [...DEFAULT_CONSTRAINTS],
  language: 'ko',
  version: '1.0',
})

const parseCandidateSources = (raw: unknown): CurationCandidateSourceForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneCandidateSources(DEFAULT_CANDIDATE_SOURCES)
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      codeId: String(row.codeId ?? ''),
      rssCategory: String(row.rssCategory ?? ''),
      feedUrl: String(row.feedUrl ?? ''),
    }
  })
}

const parseResultFields = (raw: unknown): CurationResultFieldForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneResultFields(DEFAULT_RESULT_FIELDS)
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    const typeRaw = String(row.type ?? '')
    const type: CurationResultFieldForm['type'] = typeRaw === 'link' || typeRaw === 'text' ? typeRaw : ''
    return {
      key: String(row.key ?? ''),
      label: String(row.label ?? ''),
      type,
    }
  })
}

const parseStringArray = (raw: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map(String).filter(Boolean)
}

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseCurationAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): CurationConfigForm => {
  if (!config || typeof config !== 'object') return emptyCurationConfigForm()

  const agent = (config.agent ?? {}) as Record<string, unknown>
  const ui = (config.ui ?? {}) as Record<string, unknown>
  const form = (config.form ?? {}) as Record<string, unknown>
  const categorySource = (form.categorySource ?? {}) as Record<string, unknown>
  const result = (config.result ?? {}) as Record<string, unknown>
  const engine = (config.engine ?? {}) as Record<string, unknown>
  const candidateFetch = (engine.candidateFetch ?? {}) as Record<string, unknown>
  const outputSchema = (engine.outputSchema ?? {}) as Record<string, unknown>

  const empty = emptyCurationConfigForm()

  return {
    agentId: String(agent.id ?? empty.agentId),
    agentName: String(agent.name ?? empty.agentName),
    agentPersona: String(agent.persona ?? empty.agentPersona),
    agentMission: String(agent.mission ?? empty.agentMission),
    introTitle: String(ui.introTitle ?? empty.introTitle),
    introSubtitle: String(ui.introSubtitle ?? empty.introSubtitle),
    cardTitle: String(ui.cardTitle ?? empty.cardTitle),
    cardSubtitleResult: String(ui.cardSubtitleResult ?? empty.cardSubtitleResult),
    cardSubtitleReadonly: String(ui.cardSubtitleReadonly ?? empty.cardSubtitleReadonly),
    selectionHint: String(ui.selectionHint ?? empty.selectionHint),
    footerTip: String(ui.footerTip ?? empty.footerTip),
    emptyMessage: String(ui.emptyMessage ?? empty.emptyMessage),
    categoryEmptyMessage: String(ui.categoryEmptyMessage ?? empty.categoryEmptyMessage),
    summaryNotice: String(ui.summaryNotice ?? empty.summaryNotice),
    pendingStatusTexts: parseStringArray(ui.pendingStatusTexts, empty.pendingStatusTexts),
    codeGrpId: String(categorySource.codeGrpId ?? empty.codeGrpId),
    maxCategoryCount: Number(form.maxCategoryCount ?? empty.maxCategoryCount) || empty.maxCategoryCount,
    candidateSources: parseCandidateSources(config.candidateSources),
    pressLabel: String(candidateFetch.pressLabel ?? empty.pressLabel),
    snippetMaxLength: Number(candidateFetch.snippetMaxLength ?? empty.snippetMaxLength) || empty.snippetMaxLength,
    outputSchemaItemFields: parseStringArray(outputSchema.itemFields, empty.outputSchemaItemFields),
    resultTopN: Number(result.topN ?? empty.resultTopN) || empty.resultTopN,
    nameField: String(result.nameField ?? empty.nameField),
    imageField: String(result.imageField ?? empty.imageField),
    resultFields: parseResultFields(result.fields),
    constraints: parseStringArray(config.constraints, empty.constraints),
    language: String(config.language ?? empty.language),
    version: String(config.version ?? empty.version),
  }
}

const buildCandidateSourcesPayload = (sources: CurationCandidateSourceForm[]): CurationCandidateSource[] =>
  sources
    .filter((s) => s.codeId.trim() && s.feedUrl.trim())
    .map((s) => ({
      codeId: s.codeId.trim(),
      rssCategory: s.rssCategory.trim(),
      feedUrl: s.feedUrl.trim(),
    }))

const buildResultFieldsPayload = (fields: CurationResultFieldForm[]): CurationResultFieldDef[] =>
  fields
    .filter((f) => f.key.trim() && f.label.trim())
    .map((f) => {
      const payload: CurationResultFieldDef = {
        key: f.key.trim(),
        label: f.label.trim(),
      }
      if (f.type === 'link' || f.type === 'text') payload.type = f.type
      return payload
    })

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildCurationAdditionalConfig = (
  form: CurationConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const uiPayload = {
    introTitle: form.introTitle.trim(),
    introSubtitle: form.introSubtitle.trim(),
    cardTitle: form.cardTitle.trim(),
    cardSubtitleResult: form.cardSubtitleResult.trim(),
    cardSubtitleReadonly: form.cardSubtitleReadonly.trim(),
    selectionHint: form.selectionHint.trim(),
    footerTip: form.footerTip.trim(),
    emptyMessage: form.emptyMessage.trim(),
    categoryEmptyMessage: form.categoryEmptyMessage.trim(),
    summaryNotice: form.summaryNotice.trim(),
    pendingStatusTexts: form.pendingStatusTexts.map((t) => t.trim()).filter(Boolean),
  }

  const base = {
    agentType: 'curation',
    version: form.version.trim() || '1.0',
    language: form.language.trim() || 'ko',
    agent: {
      id: form.agentId.trim(),
      name: form.agentName.trim(),
      persona: form.agentPersona.trim(),
      mission: form.agentMission.trim(),
    },
    ui: uiPayload,
    form: {
      categorySource: {
        type: 'code_group' as const,
        codeGrpId: form.codeGrpId.trim() || 'NC000001',
      },
      maxCategoryCount: form.maxCategoryCount > 0 ? form.maxCategoryCount : 5,
    },
    candidateSources: buildCandidateSourcesPayload(form.candidateSources),
    engine: {
      candidateFetch: {
        type: 'rss' as const,
        pressLabel: form.pressLabel.trim() || '연합뉴스',
        snippetMaxLength: form.snippetMaxLength > 0 ? form.snippetMaxLength : 400,
      },
      outputSchema: {
        type: 'json_array' as const,
        itemFields: form.outputSchemaItemFields.map((f) => f.trim()).filter(Boolean),
      },
    },
    result: {
      topN: form.resultTopN > 0 ? form.resultTopN : 5,
      nameField: form.nameField.trim(),
      ...(form.imageField.trim() ? { imageField: form.imageField.trim() } : {}),
      fields: buildResultFieldsPayload(form.resultFields),
    },
    constraints: form.constraints.map((c) => c.trim()).filter(Boolean),
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

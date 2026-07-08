import type {
  AgtSubAdditionalConfig,
  RecommendFormField,
  RecommendRegionSelectDepth,
  RecommendResultFieldDef,
} from '~/types/agent'

/** 추천·자동추천 에이전트 result.topN 상한 */
export const AGENT_RECOMMEND_TOP_N_MAX = 10

export const clampAgentRecommendTopN = (raw: string | number, fallback = 5): number => {
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0) return fallback
  return Math.min(AGENT_RECOMMEND_TOP_N_MAX, Math.floor(num))
}

export const isAgentRecommendTopNValid = (value: number): boolean =>
  Number.isFinite(value) && value > 0 && value <= AGENT_RECOMMEND_TOP_N_MAX

/** Agent 설정 UI — RECOMMEND ADDITIONAL_CONFIG 편집 필드 */
export interface RecommendFormFieldForm {
  key: string
  label: string
  type: 'chip_select'
  required: boolean
  options: string[]
}

export interface RecommendResultFieldForm {
  key: string
  label: string
  type: 'link' | 'text' | ''
}

export interface RecommendConfigForm {
  agentId: string
  agentName: string
  agentPersona: string
  agentMission: string
  introTitle: string
  introSubtitle: string
  cardTitle: string
  cardTitleResult: string
  cardSubtitle: string
  cardSubtitleReadonly: string
  cardSubtitleResult: string
  imageNotice: string
  pendingStatusTexts: string[]
  useRegionSelect: boolean
  regionSelectLabel: string
  regionSelectDepth: RecommendRegionSelectDepth
  formFields: RecommendFormFieldForm[]
  resultTopN: number
  rankLabel: string
  nameField: string
  imageField: string
  resultFields: RecommendResultFieldForm[]
  outputSchemaItemFields: string[]
  useGeolocation: boolean
  showThumbnailImages: boolean
  showImageNotice: boolean
  addressEnrichment: 'kakao' | ''
  imageEnrichment: 'aiGenerate' | 'kakaoImage' | ''
  language: string
  version: string
  constraints: string[]
}

const DEFAULT_FORM_FIELDS: RecommendFormFieldForm[] = [
  {
    key: 'mood',
    type: 'chip_select',
    label: '지금 기분이 어떠신가요?',
    options: ['신나는', '차분한', '슬픈', '설레는', '집중하고 싶은', '힐링하고 싶은'],
    required: true,
  },
  {
    key: 'situation',
    type: 'chip_select',
    label: '어떤 상황에서 들으실 건가요?',
    options: ['출퇴근', '운동', '공부·집중', '드라이브', '휴식', '수면 전'],
    required: true,
  },
  {
    key: 'genre',
    type: 'chip_select',
    label: '선호하는 장르가 있나요?',
    options: ['상관없음', '팝', '케이팝', '인디', '클래식', '재즈', 'R&B', '록'],
    required: false,
  },
  {
    key: 'era',
    type: 'chip_select',
    label: '선호하는 시대는?',
    options: ['상관없음', '최신곡', '2010년대', '2000년대', '90년대 이전'],
    required: false,
  },
]

const DEFAULT_RESULT_FIELDS: RecommendResultFieldForm[] = [
  { key: 'artist', label: '아티스트', type: '' },
  { key: 'genre', label: '장르', type: '' },
  { key: 'reason', label: '추천 이유', type: '' },
  { key: 'url', label: '링크', type: 'link' },
]

const DEFAULT_CONSTRAINTS = [
  '실제로 존재하는 곡만 추천할 것. 없는 곡 생성 금지.',
  'url·imageUrl 필드는 출력하지 말 것 (클라이언트에서 YouTube 링크·앨범 이미지 자동 처리).',
  '반드시 JSON 배열만 출력. 코드블록·마크다운·설명 텍스트 금지.',
  'reason은 현재 사용자의 상황·기분을 언급하며 1~2문장으로 작성.',
  '위 필드만 출력. 모든 문자열 값은 반드시 닫는 따옴표(")까지 포함할 것. JSON.parse()로 파싱 가능한 완전한 배열만 최종 출력할 것.',
]

const DEFAULT_PENDING_STATUS_TEXTS = [
  '어울리는 음악을 찾고 있는 중입니다...',
  '기분에 맞는 플레이리스트를 분석하고 있습니다...',
  '최적의 음악을 선별하는 중입니다...',
  '음악 취향을 분석하고 있습니다...',
  '맞춤 음악을 추천하는 중입니다...',
]

const DEFAULT_OUTPUT_SCHEMA_FIELDS = ['title', 'artist', 'genre', 'reason']

const cloneFormFields = (fields: RecommendFormFieldForm[]): RecommendFormFieldForm[] =>
  fields.map((f) => ({ ...f, options: [...f.options] }))

const cloneResultFields = (fields: RecommendResultFieldForm[]): RecommendResultFieldForm[] =>
  fields.map((f) => ({ ...f }))

/** 신규 RECOMMEND 에이전트 기본값 (음악 추천 템플릿) */
export const emptyRecommendConfigForm = (): RecommendConfigForm => ({
  agentId: 'music-recommend',
  agentName: '음악추천',
  agentPersona: '음악 취향 분석과 감성적 큐레이션에 특화된 음악 전문 DJ',
  agentMission:
    '사용자의 현재 기분·상황·장르 취향을 파악하여 지금 이 순간 가장 잘 어울리는 음악을 추천하는 것이 임무입니다.',
  introTitle: '음악 추천 에이전트',
  introSubtitle: '음악 추천 에이전트를 생성 중입니다...',
  cardTitle: '음악 추천 에이전트',
  cardTitleResult: '음악 추천 결과',
  cardSubtitle: '아래 항목을 모두 선택해 주세요.',
  cardSubtitleReadonly: '추천 요청이 완료되었습니다.',
  cardSubtitleResult: '현재 기분에 어울리는 음악을 추천해드립니다.',
  imageNotice: '※ 본 이미지는 참고용 앨범 이미지입니다',
  pendingStatusTexts: [...DEFAULT_PENDING_STATUS_TEXTS],
  useRegionSelect: false,
  regionSelectLabel: '',
  regionSelectDepth: 'dong',
  formFields: cloneFormFields(DEFAULT_FORM_FIELDS),
  resultTopN: 5,
  rankLabel: '추천',
  nameField: 'title',
  imageField: 'imageUrl',
  resultFields: cloneResultFields(DEFAULT_RESULT_FIELDS),
  outputSchemaItemFields: [...DEFAULT_OUTPUT_SCHEMA_FIELDS],
  useGeolocation: false,
  showThumbnailImages: true,
  showImageNotice: true,
  addressEnrichment: '',
  imageEnrichment: '',
  language: 'ko',
  version: '1.0',
  constraints: [...DEFAULT_CONSTRAINTS],
})

const parseFormFields = (raw: unknown): RecommendFormFieldForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneFormFields(DEFAULT_FORM_FIELDS)
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    const options = Array.isArray(row.options) ? row.options.map(String) : []
    return {
      key: String(row.key ?? ''),
      label: String(row.label ?? ''),
      type: 'chip_select' as const,
      required: row.required === true,
      options,
    }
  })
}

const parseResultFields = (raw: unknown): RecommendResultFieldForm[] => {
  if (!Array.isArray(raw) || raw.length === 0) return cloneResultFields(DEFAULT_RESULT_FIELDS)
  return raw.map((item) => {
    const row = item as Record<string, unknown>
    const typeRaw = String(row.type ?? '')
    const type: RecommendResultFieldForm['type'] = typeRaw === 'link' || typeRaw === 'text' ? typeRaw : ''
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

const parseRegionSelectDepth = (raw: unknown): RecommendRegionSelectDepth => {
  const value = String(raw ?? '').trim()
  if (value === 'sido' || value === 'sigungu') return value
  return 'dong'
}

/** ADDITIONAL_CONFIG → 설정 폼 */
export const parseRecommendAdditionalConfigToForm = (
  config: Record<string, unknown> | null | undefined,
): RecommendConfigForm => {
  if (!config || typeof config !== 'object') return emptyRecommendConfigForm()

  const agent = (config.agent ?? {}) as Record<string, unknown>
  const ui = (config.ui ?? {}) as Record<string, unknown>
  const form = (config.form ?? {}) as Record<string, unknown>
  const result = (config.result ?? {}) as Record<string, unknown>
  const features = (config.features ?? {}) as Record<string, unknown>
  const engine = (config.engine ?? {}) as Record<string, unknown>
  const outputSchema = (engine.outputSchema ?? {}) as Record<string, unknown>

  const empty = emptyRecommendConfigForm()

  return {
    agentId: String(agent.id ?? empty.agentId),
    agentName: String(agent.name ?? empty.agentName),
    agentPersona: String(agent.persona ?? empty.agentPersona),
    agentMission: String(agent.mission ?? empty.agentMission),
    introTitle: String(ui.introTitle ?? empty.introTitle),
    introSubtitle: String(ui.introSubtitle ?? empty.introSubtitle),
    cardTitle: String(ui.cardTitle ?? empty.cardTitle),
    cardTitleResult: String(ui.cardTitleResult ?? empty.cardTitleResult),
    cardSubtitle: String(ui.cardSubtitle ?? empty.cardSubtitle),
    cardSubtitleReadonly: String(ui.cardSubtitleReadonly ?? empty.cardSubtitleReadonly),
    cardSubtitleResult: String(ui.cardSubtitleResult ?? empty.cardSubtitleResult),
    imageNotice: String(ui.imageNotice ?? empty.imageNotice),
    pendingStatusTexts: parseStringArray(ui.pendingStatusTexts, empty.pendingStatusTexts),
    useRegionSelect: form.useRegionSelect === true,
    regionSelectLabel: String(form.regionSelectLabel ?? ''),
    regionSelectDepth: parseRegionSelectDepth(form.regionSelectDepth),
    formFields: parseFormFields(form.fields),
    resultTopN: Number(result.topN ?? empty.resultTopN) || empty.resultTopN,
    rankLabel: String(result.rankLabel ?? empty.rankLabel),
    nameField: String(result.nameField ?? empty.nameField),
    imageField: String(result.imageField ?? empty.imageField),
    resultFields: parseResultFields(result.fields),
    outputSchemaItemFields: parseStringArray(outputSchema.itemFields, empty.outputSchemaItemFields),
    useGeolocation: features.useGeolocation === true,
    showThumbnailImages: features.showThumbnailImages !== false,
    showImageNotice: features.showImageNotice !== false,
    addressEnrichment: features.addressEnrichment === 'kakao' ? 'kakao' : '',
    imageEnrichment:
      features.imageEnrichment === 'aiGenerate'
        ? 'aiGenerate'
        : features.imageEnrichment === 'kakaoImage'
          ? 'kakaoImage'
          : '',
    language: String(config.language ?? empty.language),
    version: String(config.version ?? empty.version),
    constraints: parseStringArray(config.constraints, empty.constraints),
  }
}

const buildFormFieldsPayload = (fields: RecommendFormFieldForm[]): RecommendFormField[] =>
  fields
    .filter((f) => f.key.trim() && f.label.trim())
    .map((f) => ({
      key: f.key.trim(),
      label: f.label.trim(),
      type: 'chip_select' as const,
      required: f.required,
      options: f.options.map((o) => o.trim()).filter(Boolean),
    }))

const buildResultFieldsPayload = (fields: RecommendResultFieldForm[]): RecommendResultFieldDef[] =>
  fields
    .filter((f) => f.key.trim() && f.label.trim())
    .map((f) => {
      const payload: RecommendResultFieldDef = {
        key: f.key.trim(),
        label: f.label.trim(),
      }
      if (f.type === 'link' || f.type === 'text') payload.type = f.type
      return payload
    })

/** 설정 폼 + 기존 JSON → 저장용 ADDITIONAL_CONFIG */
export const buildRecommendAdditionalConfig = (
  form: RecommendConfigForm,
  preserved?: AgtSubAdditionalConfig | null,
): AgtSubAdditionalConfig => {
  const formPayload = {
    useRegionSelect: form.useRegionSelect,
    ...(form.regionSelectLabel.trim() ? { regionSelectLabel: form.regionSelectLabel.trim() } : {}),
    ...(form.useRegionSelect ? { regionSelectDepth: form.regionSelectDepth } : {}),
    fields: buildFormFieldsPayload(form.formFields),
  }

  const uiPayload = {
    introTitle: form.introTitle.trim(),
    introSubtitle: form.introSubtitle.trim(),
    cardTitle: form.cardTitle.trim(),
    cardTitleResult: form.cardTitleResult.trim(),
    cardSubtitle: form.cardSubtitle.trim(),
    cardSubtitleReadonly: form.cardSubtitleReadonly.trim(),
    cardSubtitleResult: form.cardSubtitleResult.trim(),
    pendingStatusTexts: form.pendingStatusTexts.map((t) => t.trim()).filter(Boolean),
    ...(form.imageNotice.trim() ? { imageNotice: form.imageNotice.trim() } : {}),
  }

  const base = {
    agentType: 'recommend',
    version: form.version.trim() || '1.0',
    language: form.language.trim() || 'ko',
    ui: uiPayload,
    form: formPayload,
    agent: {
      id: form.agentId.trim(),
      name: form.agentName.trim(),
      persona: form.agentPersona.trim(),
      mission: form.agentMission.trim(),
    },
    engine: {
      ...((preserved?.engine as Record<string, unknown>) ?? {}),
      outputSchema: {
        type: 'json_array' as const,
        itemFields: form.outputSchemaItemFields.map((f) => f.trim()).filter(Boolean),
      },
    },
    result: {
      topN: form.resultTopN > 0 ? form.resultTopN : 5,
      rankLabel: form.rankLabel.trim(),
      nameField: form.nameField.trim(),
      ...(form.imageField.trim() ? { imageField: form.imageField.trim() } : {}),
      fields: buildResultFieldsPayload(form.resultFields),
    },
    features: {
      useGeolocation: form.useGeolocation,
      showThumbnailImages: form.showThumbnailImages,
      showImageNotice: form.showImageNotice,
      ...(form.addressEnrichment === 'kakao' ? { addressEnrichment: 'kakao' as const } : {}),
      ...(form.imageEnrichment === 'aiGenerate'
        ? { imageEnrichment: 'aiGenerate' as const }
        : form.imageEnrichment === 'kakaoImage'
          ? { imageEnrichment: 'kakaoImage' as const }
          : {}),
    },
    constraints: form.constraints.map((c) => c.trim()).filter(Boolean),
  }

  if (preserved && typeof preserved === 'object') {
    return { ...preserved, ...base } as AgtSubAdditionalConfig
  }

  return base
}

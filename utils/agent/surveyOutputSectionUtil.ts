import type { SurveyOutputSectionBlock } from '~/types/agentSurveyConfig'

/** 출력 섹션 params 필드 정의 */
export type SurveyBlockParamFieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'tags' | 'json'

export interface SurveyBlockParamField {
  key: string
  label: string
  type: SurveyBlockParamFieldType
  hint?: string
  placeholder?: string
}

/** blockType별 메타 정보 */
export interface SurveyBlockTypeMeta {
  value: string
  label: string
  description: string
  defaultId: string
  defaultTitle: string
  defaultInstruction: string
  defaultParams?: Record<string, unknown>
  paramFields: SurveyBlockParamField[]
}

export const SURVEY_BLOCK_TYPE_CATALOG: SurveyBlockTypeMeta[] = [
  {
    value: 'risk_badge_summary',
    label: '위험군 요약',
    description:
      '종합 판정 뱃지(정상군·경계군·고위험군)와 상태 설명 1~2문장을 출력합니다. 평가 등급의 CSS 클래스·라벨을 그대로 사용합니다.',
    defaultId: 'summary',
    defaultTitle: '현재 상태 요약',
    defaultInstruction:
      '사전 확정된 종합 위험군의 뱃지 클래스·상태 클래스·라벨을 그대로 사용한다. 상태 span 안에는 종합 상태를 1~2문장으로 설명한다.',
    paramFields: [],
  },
  {
    value: 'cause_analysis',
    label: '핵심 원인',
    description: '영역별 환산 점수가 가장 높은 N개 영역을 핵심 스트레스 원인으로 분석합니다.',
    defaultId: 'cause',
    defaultTitle: '핵심 원인',
    defaultInstruction:
      '영역별 환산 점수가 가장 높은 영역을 핵심 원인으로 본다(동률이면 모두 언급). 해당 영역이 나타내는 경험을 증상 중심으로 서술한다. 문항 번호·점수는 언급하지 않는다.',
    defaultParams: { topN: 2, tieIncludeAll: true },
    paramFields: [
      { key: 'topN', label: '상위 N개', type: 'number', hint: '핵심 원인으로 짚을 영역 개수' },
      { key: 'tieIncludeAll', label: '동률 모두 포함', type: 'boolean', hint: '동점인 영역을 모두 언급합니다.' },
    ],
  },
  {
    value: 'state_breakdown',
    label: '심리 상태',
    description:
      '정서·인지·행동 등 항목별로 현재 심리 상태를 서술합니다. 방사형 차트 연동 시 trailingMarker를 사용합니다.',
    defaultId: 'state',
    defaultTitle: '심리 상태',
    defaultInstruction:
      '각 항목 앞에 말머리 기호 "- "를 붙여 한 줄 이상으로 서술한다. 본문 작성 후 trailingMarker를 단독 한 줄로 출력한다.',
    defaultParams: { items: ['정서', '인지', '행동'], trailingMarker: '[방사형그래프]' },
    paramFields: [
      {
        key: 'items',
        label: '분석 항목',
        type: 'tags',
        hint: '쉼표(,)로 구분 (예: 정서, 인지, 행동)',
        placeholder: '정서, 인지, 행동',
      },
      {
        key: 'trailingMarker',
        label: '후행 마커',
        type: 'text',
        hint: '본문 마지막에 단독 출력할 마커 (차트 연동 등)',
        placeholder: '[방사형그래프]',
      },
    ],
  },
  {
    value: 'elevated_area_list',
    label: '스트레스 유형',
    description: '기준을 초과한 영역의 elevatedLabel을 나열합니다. 초과 영역이 없으면 안정적 상태임을 안내합니다.',
    defaultId: 'stresstype',
    defaultTitle: '스트레스 유형',
    defaultInstruction:
      '영역별 환산 점수가 해당 영역의 정상 임계값을 초과(경계 이상)한 영역의 elevatedLabel을 나열한다. 초과 영역이 없으면 안정적이라는 점을 한 문장으로 안내한다.',
    paramFields: [],
  },
  {
    value: 'grouped_actions',
    label: '맞춤 처방',
    description: '그룹별 행동 가이드를 출력합니다. groups 배열로 그룹 제목·개수·안내를 정의합니다.',
    defaultId: 'prescription',
    defaultTitle: '맞춤 처방',
    defaultInstruction:
      "회복을 위한 작은 가이드를 그룹별로 출력한다. 각 그룹은 '#### {title}' 헤딩 + 목록으로 작성하고 count와 note를 준수한다.",
    defaultParams: {
      groups: [
        { title: '① 지금 가장 먼저 해보면 좋은 것', count: '1~2', note: '가장 효과적인 행동 1개는 반드시 포함' },
        { title: '② 생각을 조금 가볍게 바꾸는 방법', count: '2~3', note: '해석/관점 전환 중심' },
        { title: '③ 일상에서 바로 실천해볼 수 있는 것들', count: '2~3', note: '업무/생활 행동' },
        { title: '④ 몸과 마음을 편안하게 만드는 방법', count: '2~3', note: '신체 + 감정 안정' },
      ],
    },
    paramFields: [
      {
        key: 'groups',
        label: '그룹 설정 (JSON)',
        type: 'json',
        hint: 'title, count, note 필드를 가진 groups 배열',
        placeholder: '[{"title":"① ...","count":"1~2","note":"..."}]',
      },
    ],
  },
  {
    value: 'recommendation_list',
    label: '추천 목록',
    description: '음악·콘텐츠 등 추천 항목을 format 규칙에 맞춰 출력합니다.',
    defaultId: 'music',
    defaultTitle: '심리 안정 음악',
    defaultInstruction: '현재 심리 상태에 맞는 항목을 format에 따라 빠짐없이 출력한다.',
    defaultParams: {
      count: 3,
      domain: 'music',
      format: '[번호]. 곡명 - 아티스트\n   이유: {추천 이유 1~2문장}',
      selectionCriteria: '심리 상태에 어울리는 곡을 우선 선택하고, 장르·분위기를 다양하게 섞는다.',
    },
    paramFields: [
      { key: 'count', label: '추천 개수', type: 'number', hint: '출력할 항목 수' },
      { key: 'domain', label: '도메인', type: 'text', placeholder: 'music', hint: '추천 유형 식별자' },
      {
        key: 'format',
        label: '출력 형식',
        type: 'textarea',
        hint: 'LLM이 따를 출력 포맷 템플릿',
      },
      {
        key: 'selectionCriteria',
        label: '선정 기준',
        type: 'textarea',
        hint: '어떤 기준으로 항목을 고를지 안내',
      },
    ],
  },
  {
    value: 'keyword_list',
    label: '키워드 목록',
    description: '이미지 검색 등에 사용할 영어 키워드를 format 규칙에 맞춰 출력합니다.',
    defaultId: 'images',
    defaultTitle: '회복에 도움이 되는 이미지',
    defaultInstruction: '현재 사용자의 심리 상태에 맞는 이미지 키워드를 format에 따라 출력한다.',
    defaultParams: {
      count: 4,
      format: '[번호]. 이미지키워드: {영어-키워드-하이픈연결}',
      example: '1. 이미지키워드: peaceful-forest-path',
    },
    paramFields: [
      { key: 'count', label: '키워드 개수', type: 'number' },
      { key: 'format', label: '출력 형식', type: 'text', placeholder: '[번호]. 이미지키워드: {영어-키워드}' },
      { key: 'example', label: '출력 예시', type: 'text', placeholder: '1. 이미지키워드: peaceful-forest-path' },
    ],
  },
  {
    value: 'freeform',
    label: '자유 형식',
    description: 'instruction만으로 LLM 출력 형식을 자유롭게 지정합니다.',
    defaultId: 'custom',
    defaultTitle: '추가 섹션',
    defaultInstruction: '이 섹션에서 출력할 내용과 형식을 자유롭게 지정한다.',
    paramFields: [],
  },
  {
    value: 'closing_message',
    label: '마무리 메시지',
    description: '결과 본문 맨 아래에 번호·헤딩 없이 단독 출력됩니다. (JSON 최상위 closingMessage 필드)',
    defaultId: 'closing',
    defaultTitle: '',
    defaultInstruction: '현재 심리 상태에 맞는 한 줄 응원 메시지. 헤딩·레이블 없이 <h3> 태그 한 줄만 출력.',
    defaultParams: { tag: 'h3' },
    paramFields: [
      {
        key: 'tag',
        label: 'HTML 태그',
        type: 'text',
        hint: '출력에 사용할 태그 (기본: h3)',
        placeholder: 'h3',
      },
    ],
  },
]

export const CLOSING_MESSAGE_BLOCK_TYPE = 'closing_message'

export const DEFAULT_CLOSING_MESSAGE_BLOCK = (): SurveyOutputSectionBlock => ({
  id: 'closing',
  blockType: CLOSING_MESSAGE_BLOCK_TYPE,
  instruction: '현재 심리 상태에 맞는 한 줄 응원 메시지. 헤딩·레이블 없이 <h3> 태그 한 줄만 출력.',
  params: { tag: 'h3' },
})

/** blockType 메타 조회 */
export const getSurveyBlockTypeMeta = (blockType: string): SurveyBlockTypeMeta | undefined =>
  SURVEY_BLOCK_TYPE_CATALOG.find((m) => m.value === blockType)

/** UiSelect 옵션 */
export const getSurveyBlockTypeOptions = () =>
  SURVEY_BLOCK_TYPE_CATALOG.map((m) => ({
    value: m.value,
    label: `${m.label} (${m.value})`,
  }))

/** outputSections 추가용 — 마무리 유형 제외 */
export const getSurveyOutputBlockTypeOptions = () =>
  SURVEY_BLOCK_TYPE_CATALOG.filter((m) => m.value !== CLOSING_MESSAGE_BLOCK_TYPE).map((m) => ({
    value: m.value,
    label: `${m.label} (${m.value})`,
  }))

/** 신규 출력 섹션 블록 생성 */
export const createSurveyOutputSectionBlock = (blockType: string, topN = 2): SurveyOutputSectionBlock => {
  const meta = getSurveyBlockTypeMeta(blockType)
  if (!meta) {
    return { id: 'section', blockType, title: '', instruction: '' }
  }

  const params = meta.defaultParams ? { ...meta.defaultParams } : undefined
  if (blockType === 'cause_analysis' && params) {
    params.topN = topN
  }

  return {
    id: meta.defaultId,
    title: meta.defaultTitle,
    blockType: meta.value,
    instruction: meta.defaultInstruction,
    ...(params ? { params } : {}),
  }
}

/** API/저장 JSON → 블록 배열 */
export const parseSurveyOutputSectionBlocks = (raw: unknown): SurveyOutputSectionBlock[] => {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const first = raw[0]
  if (typeof first === 'string') return []

  return raw.map((item) => {
    const row = item as Record<string, unknown>
    return {
      id: String(row.id ?? ''),
      title: row.title != null ? String(row.title) : undefined,
      blockType: String(row.blockType ?? ''),
      instruction: row.instruction != null ? String(row.instruction) : undefined,
      params: (row.params as Record<string, unknown>) ?? undefined,
    }
  })
}

/** closingMessage JSON → 블록 */
export const parseSurveyClosingMessageBlock = (raw: unknown): SurveyOutputSectionBlock | null => {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.blockType !== 'string') return null
  return {
    id: String(row.id ?? 'closing'),
    title: row.title != null ? String(row.title) : undefined,
    blockType: String(row.blockType),
    instruction: row.instruction != null ? String(row.instruction) : undefined,
    params: (row.params as Record<string, unknown>) ?? undefined,
  }
}

/** tags 필드 — 배열 ↔ 쉼표 문자열 */
export const joinTagsParam = (value: unknown): string => {
  if (!Array.isArray(value)) return ''
  return value.map(String).filter(Boolean).join(', ')
}

export const splitTagsParam = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

/** JSON params 필드 직렬화 */
export const stringifyJsonParam = (value: unknown): string => {
  if (value == null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

export const parseJsonParam = (value: string): Record<string, unknown> | unknown[] | null => {
  if (!value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed
  } catch {
    return null
  }
}

/** 블록 params에서 필드 값 읽기 */
export const getBlockParamValue = (block: SurveyOutputSectionBlock, key: string): unknown => block.params?.[key]

/** 블록 params 필드 값 설정 */
export const setBlockParamValue = (
  block: SurveyOutputSectionBlock,
  key: string,
  value: unknown,
): SurveyOutputSectionBlock => {
  const nextParams = { ...(block.params ?? {}), [key]: value }
  if (value === '' || value == null) delete nextParams[key]
  const hasParams = Object.keys(nextParams).length > 0
  return { ...block, params: hasParams ? nextParams : undefined }
}

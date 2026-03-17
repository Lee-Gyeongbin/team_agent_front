// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockSystemPrompt {
  id: string
  name: string
  content: string
  temperature: number
  topP: number
  targets: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const today = () => new Date().toISOString().slice(0, 10)

// 초기 데이터
const systemPromptList: MockSystemPrompt[] = [
  {
    id: 'sp-1',
    name: '기본 프롬프트 (전체 공통)',
    content: '당신은 전문적이고 친절한 B2B 업무 지원 AI 어시스턴트입니다.\n\n다음 지침을 따라주세요:\n- 사용자의 질문에 정확하고 간결하게 답변하세요\n- 업무 관련 정보는 공식 매뉴얼과 데이터베이스를 우선 참고하세요\n- 불확실한 정보는 추측하지 말고 확인이 필요함을 알려주세요\n- 개인정보와 민감한 업무 정보는 보안 규정에 따라 처리하세요\n- 항상 예의바르고 전문적인 톤을 유지하세요',
    temperature: 0.7,
    topP: 0.9,
    targets: ['LLM', 'RAG', 'TextToSQL'],
    isActive: true,
    createdAt: '2026-02-09 14:32',
    updatedAt: '2026-02-09 14:32',
  },
  {
    id: 'sp-2',
    name: '기본 프롬프트 (전체 공통)',
    content: '당신은 데이터 분석 전문 AI입니다.',
    temperature: 0.5,
    topP: 0.8,
    targets: ['LLM'],
    isActive: false,
    createdAt: '2026-02-09 14:32',
    updatedAt: '2026-02-09 14:32',
  },
  {
    id: 'sp-3',
    name: '기본 프롬프트 (전체 공통)',
    content: 'RAG 검색 최적화 프롬프트입니다.',
    temperature: 0.3,
    topP: 0.7,
    targets: ['RAG'],
    isActive: true,
    createdAt: '2026-02-09 14:32',
    updatedAt: '2026-02-09 14:32',
  },
  {
    id: 'sp-4',
    name: '기본 프롬프트 (전체 공통)',
    content: 'SQL 변환 전용 프롬프트입니다.',
    temperature: 0.2,
    topP: 0.9,
    targets: ['TextToSQL'],
    isActive: false,
    createdAt: '2026-02-09 14:32',
    updatedAt: '2026-02-09 14:32',
  },
]

// 시스템 프롬프트 CRUD
export const mockSystemPromptDb = {
  // 목록 조회
  getList: () => [...systemPromptList],

  // 단건 조회
  getById: (id: string) => systemPromptList.find((p) => p.id === id) ?? null,

  // 추가/수정
  save: (prompt: Partial<MockSystemPrompt>) => {
    const index = systemPromptList.findIndex((p) => p.id === prompt.id)
    if (index > -1) {
      systemPromptList[index] = { ...systemPromptList[index], ...prompt, updatedAt: today() }
      return systemPromptList[index]
    } else {
      const newPrompt: MockSystemPrompt = {
        id: `sp-${Date.now()}`,
        name: '',
        content: '',
        temperature: 0.7,
        topP: 0.9,
        targets: [],
        isActive: false,
        createdAt: today(),
        updatedAt: today(),
        ...prompt,
      }
      systemPromptList.push(newPrompt)
      return newPrompt
    }
  },

  // 삭제
  delete: (id: string) => {
    const index = systemPromptList.findIndex((p) => p.id === id)
    if (index > -1) systemPromptList.splice(index, 1)
    return { id }
  },
}

// ===== 프롬프트 템플릿 =====
interface MockPromptTemplate {
  id: string
  name: string
  category: string
  description: string
  content: string
  usageCount: number
  createdAt: string
  updatedAt: string
}

const templateList: MockPromptTemplate[] = [
  {
    id: 'tpl-1',
    name: '제품 소개 요청',
    category: '영업/마케팅',
    description: '고객이 제품 정보를 요청 할 때 사용하는 템플릿입니다.',
    content: '"{{제품명}}"에 대해 간단히 소개해드리겠습니다. {{제품명}}은 {{핵심가치}}를 제공하는 솔루션으로...',
    usageCount: 156,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'tpl-2',
    name: '장애 대응 안내',
    category: '고객지원',
    description: '시스템 장애 발생 시 고객에게 안내하는 템플릿입니다.',
    content: '현재 {{서비스명}}에서 {{장애유형}} 이슈가 확인되었습니다. 복구 예상 시간은 {{예상시간}}입니다.',
    usageCount: 89,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'tpl-3',
    name: 'API 연동 가이드',
    category: '개발/기술',
    description: 'API 연동 방법을 안내하는 템플릿입니다.',
    content: '{{API명}} 연동을 위해 다음 단계를 따라주세요. 1. {{엔드포인트}}로 요청 2. {{인증방식}} 인증 적용',
    usageCount: 234,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'tpl-4',
    name: '견적 요청 응대',
    category: '영업/마케팅',
    description: '견적 요청에 대한 응대 템플릿입니다.',
    content: '{{고객사명}} 담당자님, {{제품명}} 견적을 안내드립니다. 기본 플랜은 {{가격}}부터 시작합니다.',
    usageCount: 67,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'tpl-5',
    name: 'FAQ 응답',
    category: '고객지원',
    description: '자주 묻는 질문에 대한 응답 템플릿입니다.',
    content: '{{질문주제}}에 대해 안내드립니다. {{답변내용}} 추가 문의사항이 있으시면 말씀해주세요.',
    usageCount: 312,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
  {
    id: 'tpl-6',
    name: '배포 절차 안내',
    category: '개발/기술',
    description: '배포 절차를 안내하는 템플릿입니다.',
    content: '{{서비스명}} {{버전}} 배포를 진행합니다. 배포 시간: {{배포시간}}, 영향 범위: {{영향범위}}',
    usageCount: 45,
    createdAt: '2026-02-05',
    updatedAt: '2026-02-05',
  },
]

export const mockTemplateDb = {
  getList: () => [...templateList],

  save: (template: Partial<MockPromptTemplate>) => {
    const index = templateList.findIndex((t) => t.id === template.id)
    if (index > -1) {
      templateList[index] = { ...templateList[index], ...template, updatedAt: today() }
      return templateList[index]
    } else {
      const newTemplate: MockPromptTemplate = {
        id: `tpl-${Date.now()}`,
        name: '',
        category: '',
        description: '',
        content: '',
        usageCount: 0,
        createdAt: today(),
        updatedAt: today(),
        ...template,
      }
      templateList.push(newTemplate)
      return newTemplate
    }
  },

  delete: (id: string) => {
    const index = templateList.findIndex((t) => t.id === id)
    if (index > -1) templateList.splice(index, 1)
    return { id }
  },
}

// ===== 금지어/필터링 =====
interface MockFilterPolicy {
  id: string
  label: string
  description: string
  isEnabled: boolean
}

const filterData = {
  inputKeywords: ['비속어', '부적절한단어', '금지키워드'],
  outputKeywords: ['경쟁사명', '민감정보', '언급금지그회사'],
  policies: [
    { id: 'p-1', label: '개인정보 감지', description: '주민등록번호, 전화번호, 이메일 등을 자동 감지하여 필터링', isEnabled: true },
    { id: 'p-2', label: '비즈니스 정보 보호', description: '계약서, 재무정보 등 민감한 비즈니스 정보 필터링', isEnabled: true },
    { id: 'p-3', label: '욕설/비속어 차단', description: '부적절한 언어 사용 감지 및 차단', isEnabled: true },
    { id: 'p-4', label: '악의적 프롬프트 탐지', description: '프롬프트 인젝션, 탈옥 시도 등을 감지', isEnabled: true },
  ] as MockFilterPolicy[],
}

export const mockFilterDb = {
  // 조회
  getData: () => ({
    inputKeywords: [...filterData.inputKeywords],
    outputKeywords: [...filterData.outputKeywords],
    policies: filterData.policies.map((p) => ({ ...p })),
  }),

  // 저장 (전체 덮어쓰기)
  save: (data: { inputKeywords?: string[]; outputKeywords?: string[]; policies?: MockFilterPolicy[] }) => {
    if (data.inputKeywords) filterData.inputKeywords = [...data.inputKeywords]
    if (data.outputKeywords) filterData.outputKeywords = [...data.outputKeywords]
    if (data.policies) filterData.policies = data.policies.map((p) => ({ ...p }))
    return mockFilterDb.getData()
  },
}

// ===== 토큰/응답 제한 =====
const limitData = {
  maxInputTokens: 4000,
  maxOutputTokens: 2000,
  contextWindow: 8000,
  dailyRequestLimit: 100,
  monthlyOrgLimit: 50000,
  rateLimit: 20,
  todayUsage: 1234,
  monthUsage: 28450,
  monthLimit: 50000,
  minResponseLength: 50,
  responseTimeout: 30,
  retryCount: 3,
  streamingEnabled: true,
}

export const mockLimitDb = {
  getData: () => ({ ...limitData }),

  save: (data: Partial<typeof limitData>) => {
    Object.assign(limitData, data)
    return { ...limitData }
  },
}

// ===== 버전 관리 =====
interface MockPromptVersion {
  id: string
  version: string
  promptName: string
  description: string
  changes: string[]
  status: 'active' | 'inactive'
  author: string
  createdAt: string
}

const versionList: MockPromptVersion[] = [
  {
    id: 'v-1',
    version: '3.2.0',
    promptName: '기본 프롬프트 (전체 공통)',
    description: 'Temperature 값 조정 및 응답 톤 개선',
    changes: ['Temperature: 0.7 → 0.8', '친근한 톤 추가'],
    status: 'active',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
  {
    id: 'v-2',
    version: '3.1.5',
    promptName: '기본 프롬프트 (전체 공통)',
    description: '보안 정책 관련 지침 추가',
    changes: [],
    status: 'inactive',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
  {
    id: 'v-3',
    version: '3.1.0',
    promptName: '기본 프롬프트 (전체 공통)',
    description: '영업부 전용 프롬프트 분리',
    changes: [],
    status: 'inactive',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
  {
    id: 'v-4',
    version: '3.0.0',
    promptName: '기본 프롬프트 (전체 공통)',
    description: '전체 프롬프트 구조 개편',
    changes: [],
    status: 'inactive',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
  {
    id: 'v-5',
    version: '3.0.0',
    promptName: '기본 프롬프트 (전체 공통)',
    description: '전체 프롬프트 구조 개편',
    changes: [],
    status: 'inactive',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
  {
    id: 'v-6',
    version: '3.0.0',
    promptName: '기본 프롬프트 (전체 공통)',
    description: '전체 프롬프트 구조 개편',
    changes: [],
    status: 'inactive',
    author: '관리자',
    createdAt: '2026.03.02 14:32',
  },
]

// ===== 오류 메시지 =====
interface MockErrorMessageItem {
  key: string
  label: string
  message: string
  isEnabled: boolean
  color: string
  maxLength?: number
}

const errorMessageData = {
  responseErrors: [
    {
      key: 'generate-fail',
      label: '답변 생성 실패',
      message: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다.\n\n• 질문을 다시 작성해보시거나\n• 더 구체적으로 질문해주시면 도움이 됩니다.',
      isEnabled: true,
      color: '#ef4444',
    },
    {
      key: 'no-search-result',
      label: '검색 결과 없음',
      message: '요청하신 정보를 찾을 수 없습니다. 🔍\n\n• 다른 키워드로 다시 검색해보세요\n• 관리자에게 문의하시면 도움을 받으실 수 있습니다.',
      isEnabled: true,
      color: '#ef4444',
    },
  ] as MockErrorMessageItem[],
  inputErrors: [
    {
      key: 'empty-message',
      label: '빈 메시지 입력',
      message: '메시지를 입력해주세요.\n무엇을 도와드릴까요?',
      isEnabled: true,
      color: '#3b82f6',
    },
    {
      key: 'message-length',
      label: '메시지 길이 초과',
      message: '입력하신 메시지가 너무 깁니다. (최대 2,000자)\n내용을 나누어서 질문해주세요.',
      isEnabled: true,
      color: '#3b82f6',
      maxLength: 2000,
    },
    {
      key: 'file-upload-fail',
      label: '파일 업로드 실패',
      message: '파일 업로드에 실패했습니다. 🗂\n파일 형식과 크기를 확인해주세요. (지원: PDF, DOCX, TXT / 최대 10MB)',
      isEnabled: true,
      color: '#3b82f6',
    },
  ] as MockErrorMessageItem[],
  apiErrors: [
    {
      key: '500',
      label: '500 Internal Server Error',
      message: '죄송합니다. 일시적인 서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.',
      isEnabled: true,
      color: '#ef4444',
    },
    {
      key: '429',
      label: '429 Too Many Requests',
      message: '요청이 너무 많습니다. ⏳\n잠시 후 다시 시도해주세요. (대기 시간: 약 1분)',
      isEnabled: true,
      color: '#f97316',
    },
    {
      key: '408',
      label: '408 Request Timeout',
      message: '요청 시간이 초과되었습니다.\n네트워크 상태를 확인하시고 다시 시도해주세요.',
      isEnabled: true,
      color: '#eab308',
    },
    {
      key: '401',
      label: '401/403 Unauthorized',
      message: '접근 권한이 없습니다. 🔒\n로그인 상태를 확인하거나 관리자에게 권한을 요청해주세요.',
      isEnabled: true,
      color: '#f97316',
    },
  ] as MockErrorMessageItem[],
}

export const mockErrorMessageDb = {
  getData: () => ({
    responseErrors: errorMessageData.responseErrors.map((e) => ({ ...e })),
    inputErrors: errorMessageData.inputErrors.map((e) => ({ ...e })),
    apiErrors: errorMessageData.apiErrors.map((e) => ({ ...e })),
  }),

  save: (data: {
    responseErrors?: MockErrorMessageItem[]
    inputErrors?: MockErrorMessageItem[]
    apiErrors?: MockErrorMessageItem[]
  }) => {
    if (data.responseErrors) errorMessageData.responseErrors = data.responseErrors.map((e) => ({ ...e }))
    if (data.inputErrors) errorMessageData.inputErrors = data.inputErrors.map((e) => ({ ...e }))
    if (data.apiErrors) errorMessageData.apiErrors = data.apiErrors.map((e) => ({ ...e }))
    return mockErrorMessageDb.getData()
  },
}

export const mockVersionDb = {
  getList: () => [...versionList].map((v) => ({ ...v })),

  getStats: () => ({
    totalVersions: versionList.length,
    monthlyUpdates: 3,
    lastChangeDays: 5,
  }),

  restore: (id: string) => {
    // 모든 버전 비활성 후 대상만 활성화
    versionList.forEach((v) => (v.status = 'inactive'))
    const target = versionList.find((v) => v.id === id)
    if (target) target.status = 'active'
    return target ?? null
  },
}

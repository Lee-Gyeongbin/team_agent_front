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

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

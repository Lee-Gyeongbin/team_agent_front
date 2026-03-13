// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockLlmModel {
  id: string
  name: string
  provider: string
  version: string
  inputCost: string
  outputCost: string
  dailyLimit: number
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

// 초기 LLM 모델 데이터
const llmList: MockLlmModel[] = [
  {
    id: '1',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    version: '2024-07-18',
    inputCost: '$0.15/1M',
    outputCost: '$0.60/1M',
    dailyLimit: 5000000,
    isActive: true,
    priority: 1,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '2',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: '2024-07-18',
    inputCost: '$0.15/1M',
    outputCost: '$10.00/1M',
    dailyLimit: 1000000,
    isActive: true,
    priority: 2,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '3',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    version: '2024-07-18',
    inputCost: '$0.15/1M',
    outputCost: '$5.00/1M',
    dailyLimit: 2000000,
    isActive: false,
    priority: 3,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '4',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    version: '2024-07-18',
    inputCost: '$0.15/1M',
    outputCost: '$15.00/1M',
    dailyLimit: 800000,
    isActive: false,
    priority: 4,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
]

const today = () => new Date().toISOString().slice(0, 10)

// LLM Model CRUD
export const mockLlmDb = {
  // 목록 조회
  getList: () => [...llmList],

  // 추가/수정
  save: (model: Partial<MockLlmModel>) => {
    const index = llmList.findIndex((m) => m.id === model.id)
    if (index > -1) {
      llmList[index] = { ...llmList[index], ...model, updatedAt: today() }
      return llmList[index]
    } else {
      const newModel: MockLlmModel = {
        id: `llm-${Date.now()}`,
        name: '',
        provider: '',
        version: today(),
        inputCost: '$0.00/1M',
        outputCost: '$0.00/1M',
        dailyLimit: 1000000,
        isActive: false,
        priority: llmList.length + 1,
        createdAt: today(),
        updatedAt: today(),
        ...model,
      }
      llmList.push(newModel)
      return newModel
    }
  },

  // 삭제
  delete: (id: string) => {
    const index = llmList.findIndex((m) => m.id === id)
    if (index > -1) llmList.splice(index, 1)
    return { id }
  },

  // 순서 변경
  updateOrder: (orderList: { id: string; order: number }[]) => {
    orderList.forEach(({ id, order }) => {
      const model = llmList.find((m) => m.id === id)
      if (model) model.priority = order
    })
    llmList.sort((a, b) => a.priority - b.priority)
  },
}

// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockLlmModel {
  id: string
  name: string
  modelId: string
  provider: string
  version: string
  status: string
  description: string
  apiEndpoint: string
  apiKey: string
  timeout: number
  retryCount: number
  extraHeaders: string
  temperature: number
  topP: number
  maxTokens: number
  contextWindow: number
  frequencyPenalty: number
  presencePenalty: number
  supportStreaming: boolean
  supportFunctionCall: boolean
  supportVision: boolean
  inputCost: number
  outputCost: number
  dayReqLmt: number
  rpmLimit: number
  tpmLimit: number
  dayCostLmt: number
  accessAdmin: boolean
  accessPremium: boolean
  accessGeneral: boolean
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

const llmList: MockLlmModel[] = [
  {
    id: '1',
    name: 'GPT-4o mini',
    modelId: 'gpt-4o-mini',
    provider: 'OpenAI',
    version: '2024-07-18',
    status: '활성',
    description: 'GPT-4o의 경량 버전으로 빠른 응답 속도와 낮은 비용이 특징',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'sk-***',
    timeout: 30,
    retryCount: 3,
    extraHeaders: '',
    temperature: 0.7,
    topP: 1,
    maxTokens: 4096,
    contextWindow: 128000,
    frequencyPenalty: 0,
    presencePenalty: 0,
    supportStreaming: true,
    supportFunctionCall: true,
    supportVision: true,
    inputCost: 0.15,
    outputCost: 0.6,
    dayReqLmt: 4096,
    rpmLimit: 128000,
    tpmLimit: 0,
    dayCostLmt: 0,
    accessAdmin: true,
    accessPremium: true,
    accessGeneral: true,
    isActive: true,
    priority: 1,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '2',
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    provider: 'OpenAI',
    version: '2024-07-18',
    status: '활성',
    description: 'OpenAI의 최신 플래그십 모델',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'sk-***',
    timeout: 30,
    retryCount: 3,
    extraHeaders: '',
    temperature: 0.7,
    topP: 1,
    maxTokens: 4096,
    contextWindow: 128000,
    frequencyPenalty: 0,
    presencePenalty: 0,
    supportStreaming: true,
    supportFunctionCall: true,
    supportVision: true,
    inputCost: 0.15,
    outputCost: 10,
    dayReqLmt: 4096,
    rpmLimit: 128000,
    tpmLimit: 0,
    dayCostLmt: 0,
    accessAdmin: true,
    accessPremium: true,
    accessGeneral: false,
    isActive: true,
    priority: 2,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '3',
    name: 'Gemini 1.5 Pro',
    modelId: 'gemini-1.5-pro',
    provider: 'Google',
    version: '2024-07-18',
    status: '비활성',
    description: 'Google의 멀티모달 AI 모델',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    apiKey: '',
    timeout: 30,
    retryCount: 3,
    extraHeaders: '',
    temperature: 0.7,
    topP: 1,
    maxTokens: 8192,
    contextWindow: 128000,
    frequencyPenalty: 0,
    presencePenalty: 0,
    supportStreaming: true,
    supportFunctionCall: true,
    supportVision: true,
    inputCost: 0.15,
    outputCost: 5,
    dayReqLmt: 4096,
    rpmLimit: 128000,
    tpmLimit: 0,
    dayCostLmt: 0,
    accessAdmin: true,
    accessPremium: true,
    accessGeneral: true,
    isActive: false,
    priority: 3,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '4',
    name: 'Claude 3.5 Sonnet',
    modelId: 'claude-3-5-sonnet',
    provider: 'Anthropic',
    version: '2024-07-18',
    status: '비활성',
    description: 'Anthropic의 고성능 AI 모델',
    apiEndpoint: 'https://api.anthropic.com/v1',
    apiKey: '',
    timeout: 30,
    retryCount: 3,
    extraHeaders: '',
    temperature: 0.7,
    topP: 1,
    maxTokens: 4096,
    contextWindow: 200000,
    frequencyPenalty: 0,
    presencePenalty: 0,
    supportStreaming: true,
    supportFunctionCall: true,
    supportVision: true,
    inputCost: 0.15,
    outputCost: 15,
    dayReqLmt: 4096,
    rpmLimit: 128000,
    tpmLimit: 0,
    dayCostLmt: 0,
    accessAdmin: true,
    accessPremium: false,
    accessGeneral: false,
    isActive: false,
    priority: 4,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
]

const today = () => new Date().toISOString().slice(0, 10)

export const mockLlmDb = {
  getList: () => [...llmList],

  save: (model: Partial<MockLlmModel>) => {
    const index = llmList.findIndex((m) => m.id === model.id)
    if (index > -1) {
      llmList[index] = { ...llmList[index], ...model, updatedAt: today() }
      return llmList[index]
    } else {
      const newModel: MockLlmModel = {
        id: `llm-${Date.now()}`,
        name: '',
        modelId: '',
        provider: '',
        version: today(),
        status: '활성',
        description: '',
        apiEndpoint: '',
        apiKey: '',
        timeout: 30,
        retryCount: 3,
        extraHeaders: '',
        temperature: 0.7,
        topP: 1,
        maxTokens: 4096,
        contextWindow: 128000,
        frequencyPenalty: 0,
        presencePenalty: 0,
        supportStreaming: true,
        supportFunctionCall: true,
        supportVision: true,
        inputCost: 0,
        outputCost: 0,
        dayReqLmt: 4096,
        rpmLimit: 128000,
        tpmLimit: 0,
        dayCostLmt: 0,
        accessAdmin: true,
        accessPremium: true,
        accessGeneral: true,
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

  delete: (id: string) => {
    const index = llmList.findIndex((m) => m.id === id)
    if (index > -1) llmList.splice(index, 1)
    return { id }
  },

  updateOrder: (orderList: { id: string; order: number }[]) => {
    orderList.forEach(({ id, order }) => {
      const model = llmList.find((m) => m.id === id)
      if (model) model.priority = order
    })
    llmList.sort((a, b) => a.priority - b.priority)
  },
}

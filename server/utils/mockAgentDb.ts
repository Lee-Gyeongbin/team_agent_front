// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockAgent {
  id: string
  name: string
  description: string
  model: string
  systemPrompt: string
  temperature: number
  status: string
  isActive: boolean
  priority: number
  type: string
  connectionCount: number
  datasetCount: number
  similarityThreshold: number
  maxSearchResults: number
  createdAt: string
  updatedAt: string
}

interface MockDataset {
  id: string
  name: string
  description: string
  documentCount: number
  chunkCount: number
  isConnected: boolean
  updatedAt: string
}

// 초기 Agent 데이터
const agentList: MockAgent[] = [
  {
    id: '1',
    name: '지식검색 (매뉴얼AI)22',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'active',
    isActive: true,
    priority: 1,
    type: 'RAG',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '2',
    name: '데이터분석(SQL)',
    description: '사용자의 자연어 질문을 SQL 쿼리로 변환하여 데이터베이스에서 정보를 조회하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'active',
    isActive: true,
    priority: 2,
    type: 'TextToSQL',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '3',
    name: '번역 Agent',
    description: '다국어 번역 및 언어 감지 Agent',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'draft',
    isActive: false,
    priority: 3,
    type: 'TextToSQL',
    connectionCount: 15,
    datasetCount: 0,
    similarityThreshold: 0.5,
    maxSearchResults: 10,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
  {
    id: '4',
    name: '지식검색 (매뉴얼AI)',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    model: 'gpt-4',
    systemPrompt: '',
    temperature: 0.7,
    status: 'draft',
    isActive: false,
    priority: 4,
    type: 'RAG',
    connectionCount: 2,
    datasetCount: 2,
    similarityThreshold: 0.7,
    maxSearchResults: 5,
    createdAt: '2026-02-29',
    updatedAt: '2026-02-29',
  },
]

// 초기 Dataset 데이터
const datasetList: MockDataset[] = [
  {
    id: 'ds-1',
    name: '제품 매뉴얼 DB22',
    description: '전체 제품 매뉴얼과 사용자 가이드 문서',
    documentCount: 248,
    chunkCount: 12543,
    isConnected: true,
    updatedAt: '2026-02-29',
  },
  {
    id: 'ds-2',
    name: 'FAQ 데이터셋',
    description: '자주 묻는 질문과 답변 모음',
    documentCount: 89,
    chunkCount: 4521,
    isConnected: false,
    updatedAt: '2026-02-29',
  },
  {
    id: 'ds-3',
    name: '기술 문서 DB',
    description: '기술 사양서 및 개발 가이드 문서',
    documentCount: 156,
    chunkCount: 8743,
    isConnected: false,
    updatedAt: '2026-02-29',
  },
]

const today = () => new Date().toISOString().slice(0, 10)

// Agent CRUD
export const mockAgentDb = {
  // 목록 조회
  getList: () => [...agentList],

  // 추가/수정
  save: (agent: Partial<MockAgent>) => {
    const index = agentList.findIndex((a) => a.id === agent.id)
    if (index > -1) {
      // 수정
      agentList[index] = { ...agentList[index], ...agent, updatedAt: today() }
      return agentList[index]
    } else {
      // 추가
      const newAgent: MockAgent = {
        id: `agent-${Date.now()}`,
        name: '',
        description: '',
        model: 'gpt-4',
        systemPrompt: '',
        temperature: 0.7,
        status: 'draft',
        isActive: false,
        priority: agentList.length + 1,
        type: '',
        connectionCount: 0,
        datasetCount: 0,
        similarityThreshold: 0.7,
        maxSearchResults: 5,
        createdAt: today(),
        updatedAt: today(),
        ...agent,
      }
      agentList.push(newAgent)
      return newAgent
    }
  },

  // 삭제
  delete: (id: string) => {
    const index = agentList.findIndex((a) => a.id === id)
    if (index > -1) agentList.splice(index, 1)
    return { id }
  },

  // 순서 변경
  updateOrder: (orderList: { id: string; order: number }[]) => {
    orderList.forEach(({ id, order }) => {
      const agent = agentList.find((a) => a.id === id)
      if (agent) agent.priority = order
    })
    agentList.sort((a, b) => a.priority - b.priority)
  },
}

// Dataset CRUD
export const mockDatasetDb = {
  // 목록 조회
  getList: () => [...datasetList],

  // 추가/수정
  save: (dataset: Partial<MockDataset>) => {
    const index = datasetList.findIndex((d) => d.id === dataset.id)
    if (index > -1) {
      datasetList[index] = { ...datasetList[index], ...dataset, updatedAt: today() }
      return datasetList[index]
    } else {
      const newDataset: MockDataset = {
        id: `ds-${Date.now()}`,
        name: '',
        description: '',
        documentCount: 0,
        chunkCount: 0,
        isConnected: false,
        updatedAt: today(),
        ...dataset,
      }
      datasetList.push(newDataset)
      return newDataset
    }
  },

  // 동기화
  sync: (id: string) => {
    const dataset = datasetList.find((d) => d.id === id)
    if (dataset) dataset.updatedAt = today()
    return { id }
  },

  // 순서 변경
  updateOrder: (orderList: { id: string; order: number }[]) => {
    orderList.forEach(({ id, order }) => {
      const dataset = datasetList.find((d) => d.id === id)
      if (dataset) (dataset as any).priority = order
    })
    datasetList.sort((a, b) => ((a as any).priority ?? 0) - ((b as any).priority ?? 0))
  },
}

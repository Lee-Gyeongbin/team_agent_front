// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockAgent {
  agentId: string
  agentNm: string
  agentTypeCd: string
  description: string
  sortOrd: number
  useYn: 'Y' | 'N'
  lastMdfDt: string
  createDt: string
  modifyDt: string
  connCount: number
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

const today = () => new Date().toISOString().slice(0, 10)

// 초기 Agent 데이터
const agentList: MockAgent[] = [
  {
    agentId: '1',
    agentNm: '지식검색 (매뉴얼AI)22',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    agentTypeCd: 'RAG',
    sortOrd: 1,
    useYn: 'Y',
    lastMdfDt: '2026-02-29',
    createDt: '2026-02-29',
    modifyDt: '2026-02-29',
    connCount: 2,
  },
  {
    agentId: '2',
    agentNm: '데이터분석(SQL)',
    description: '사용자의 자연어 질문을 SQL 쿼리로 변환하여 데이터베이스에서 정보를 조회하는 Agent입니다.',
    agentTypeCd: 'TextToSQL',
    sortOrd: 2,
    useYn: 'Y',
    lastMdfDt: '2026-02-29',
    createDt: '2026-02-29',
    modifyDt: '2026-02-29',
    connCount: 2,
  },
  {
    agentId: '3',
    agentNm: '번역 Agent',
    description: '다국어 번역 및 언어 감지 Agent',
    agentTypeCd: 'TextToSQL',
    sortOrd: 3,
    useYn: 'N',
    lastMdfDt: '2026-02-29',
    createDt: '2026-02-29',
    modifyDt: '2026-02-29',
    connCount: 15,
  },
  {
    agentId: '4',
    agentNm: '지식검색 (매뉴얼AI)',
    description: '등록된 매뉴얼과 문서를 기반으로 사용자 질문에 답변하는 Agent입니다.',
    agentTypeCd: 'RAG',
    sortOrd: 4,
    useYn: 'N',
    lastMdfDt: '2026-02-29',
    createDt: '2026-02-29',
    modifyDt: '2026-02-29',
    connCount: 2,
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

// Agent CRUD
export const mockAgentDb = {
  // 목록 조회
  getList: () => [...agentList],

  // 추가/수정
  save: (agent: Partial<MockAgent>) => {
    const index = agent.agentId ? agentList.findIndex((a) => a.agentId === agent.agentId) : -1
    if (index > -1) {
      // 수정
      const now = today()
      agentList[index] = {
        ...agentList[index],
        ...agent,
        lastMdfDt: now,
        modifyDt: now,
      }
      return agentList[index]
    } else {
      // 추가
      const now = today()
      const newAgent: MockAgent = {
        agentId: `agent-${Date.now()}`,
        agentNm: '',
        description: '',
        agentTypeCd: '',
        sortOrd: agentList.length + 1,
        useYn: 'N',
        lastMdfDt: now,
        createDt: now,
        modifyDt: now,
        connCount: 0,
        ...agent,
      }
      agentList.push(newAgent)
      return newAgent
    }
  },

  // 삭제
  delete: (agentId: string) => {
    const index = agentList.findIndex((a) => a.agentId === agentId)
    if (index > -1) agentList.splice(index, 1)
    return { agentId }
  },

  // 순서 변경
  updateOrder: (orderList: { agentId: string; sortOrd: number }[]) => {
    orderList.forEach(({ agentId, sortOrd }) => {
      const ag = agentList.find((a) => a.agentId === agentId)
      if (ag) ag.sortOrd = sortOrd
    })
    agentList.sort((a, b) => a.sortOrd - b.sortOrd)
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

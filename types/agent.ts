export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  model: string
  systemPrompt: string
  temperature: number
  status: 'active' | 'draft' | 'archived'
  isActive: boolean
  priority: number
  type: string // 유형 (RAG, TextToSQL 등)
  connectionCount: number // 연결 수
  datasetCount: number // 데이터셋 수
  similarityThreshold: number // 유사도 임계값 (0.0~1.0)
  maxSearchResults: number // 최대 검색 결과 수
  createdAt: string
  updatedAt: string
}

// 데이터셋
export interface AgentDataset {
  id: string
  name: string
  description: string
  documentCount: number // 문서 수
  chunkCount: number // 청크 수
  isConnected: boolean // 연결 여부
  updatedAt: string
}

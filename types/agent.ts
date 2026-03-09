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
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  isStreaming?: boolean
  isLiked?: boolean
  isDisliked?: boolean
  hasSource?: boolean
  hasVisualization?: boolean
  sourceUrl?: string
  visualizationData?: {
    sql?: string
    chartTitle?: string
  }
}

export type PanelType = 'none' | 'pdf' | 'visualization'

export interface ModelOption {
  label: string
  value: string
}

export interface ChatRoom {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

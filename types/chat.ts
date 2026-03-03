export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  isStreaming?: boolean
  isLiked?: boolean
  isDisliked?: boolean
}

export interface ChatRoom {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

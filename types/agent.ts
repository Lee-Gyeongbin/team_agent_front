export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
  model: string
  systemPrompt: string
  temperature: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

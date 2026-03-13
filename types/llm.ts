export interface LlmModel {
  id: string
  name: string
  provider: string // OpenAI, Google, Anthropic 등
  version: string // 버전 날짜
  inputCost: string // 입력 비용 (예: "$0.15/1M")
  outputCost: string // 출력 비용 (예: "$0.60/1M")
  dailyLimit: number // 일일 제한
  isActive: boolean
  priority: number // 순서
  createdAt: string
  updatedAt: string
}

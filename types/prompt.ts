// 시스템 프롬프트
export interface SystemPrompt {
  id: string
  name: string // 프롬프트 유형 이름
  content: string // 시스템 프롬프트 내용
  temperature: number
  topP: number
  targets: string[] // 적용 대상 (LLM, RAG, TextToSQL)
  isActive: boolean // 활성 여부
  createdAt: string
  updatedAt: string
}

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

// 프롬프트 템플릿
export interface PromptTemplate {
  id: string
  name: string // 템플릿 이름
  category: string // 카테고리 (영업/마케팅, 고객지원, 개발/기술)
  description: string // 설명
  content: string // 템플릿 내용 ({{변수}} 포함)
  usageCount: number // 사용 횟수
  createdAt: string
  updatedAt: string
}

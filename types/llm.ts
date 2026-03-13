export interface LlmModel {
  id: string
  name: string
  modelId: string
  provider: string
  version: string
  status: string
  description: string
  // API 설정
  apiEndpoint: string
  apiKey: string
  timeout: number // 타임아웃 (초)
  retryCount: number // 재시도 횟수
  extraHeaders: string // 추가 헤더 (JSON)
  // 모델 파라미터
  temperature: number
  topP: number
  maxTokens: number
  contextWindow: number // 컨텍스트 윈도우
  frequencyPenalty: number
  presencePenalty: number
  supportStreaming: boolean // 스트리밍 지원
  supportFunctionCall: boolean // 함수 호출 (Tool) 지원
  supportVision: boolean // 비전(이미지) 지원
  // 사용량 제한
  inputCost: number // 입력 비용 ($/1M 토큰)
  outputCost: number // 출력 비용 ($/1M 토큰)
  dailyRequestLimit: number // 일일 요청 제한
  rpmLimit: number // 분당 요청 제한 (RPM)
  tpmLimit: number // 분당 토큰 제한 (TPM)
  dailyCostLimit: number // 일일 비용 제한 ($)
  accessAdmin: boolean // 관리자 접근
  accessPremium: boolean // 프리미엄 사용자 접근
  accessGeneral: boolean // 일반 사용자 접근
  // 공통
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

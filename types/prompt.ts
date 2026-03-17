// 시스템 프롬프트
export interface SystemPrompt {
  promptId: string // PROMPT_ID
  promptName: string // PROMPT_NAME
  promptTypeCd: string // PROMPT_TYPE_CD
  content: string // CONTENT
  temperature: number // TEMPERATURE
  topP: number // TOP_P
  applyLlmYn: 'Y' | 'N' // APPLY_LLM_YN
  applyRagYn: 'Y' | 'N' // APPLY_RAG_YN
  applySqlYn: 'Y' | 'N' // APPLY_SQL_YN
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
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

// 금지어/필터링
export interface PromptFilterData {
  inputKeywords: string[] // 입력 금지어
  outputKeywords: string[] // 출력 금지어
  policies: PromptFilterPolicy[] // 컨텐츠 필터링 정책
}

export interface PromptFilterPolicy {
  id: string
  label: string // 정책 이름
  description: string // 정책 설명
  isEnabled: boolean // 활성 여부
}

// 토큰/응답 제한
export interface PromptLimitData {
  // 토큰 제한
  maxInputTokens: number // 최대 입력 토큰
  maxOutputTokens: number // 최대 출력 토큰
  contextWindow: number // 컨텍스트 윈도우
  // 사용량 제한
  dailyRequestLimit: number // 사용자당 일일 요청 한도
  monthlyOrgLimit: number // 조직 전체 월간 한도
  rateLimit: number // Rate Limit (분당 요청)
  // 현재 사용량
  todayUsage: number // 오늘 사용량
  monthUsage: number // 이번 달 사용량
  monthLimit: number // 이번 달 한도
  // 응답 품질 제어
  minResponseLength: number // 최소 응답 길이 (토큰 수)
  responseTimeout: number // 응답 타임아웃 (초)
  retryCount: number // 재시도 횟수
  streamingEnabled: boolean // 스트리밍 응답
}

// 버전 관리
export interface PromptVersion {
  id: string
  version: string // 버전명 (3.2.0)
  promptName: string // 프롬프트 이름
  description: string // 변경 설명
  changes: string[] // 변경 내용 목록
  status: 'active' | 'inactive' // 활성/비활성
  author: string // 작성자
  createdAt: string // 생성일
}

export interface PromptVersionStats {
  totalVersions: number // 총 버전 수
  monthlyUpdates: number // 이번달 업데이트
  lastChangeDays: number // 마지막 변경 (일)
}

// 오류 메시지 설정
export interface ErrorMessageItem {
  key: string // 고유 키
  label: string // 표시 라벨
  message: string // 오류 메시지 내용
  isEnabled: boolean // 활성 여부
  color: string // 왼쪽 보더 색상
  maxLength?: number // 최대 글자 수 (메시지 길이 초과 전용)
}

export interface ErrorMessageData {
  responseErrors: ErrorMessageItem[] // 응답 생성 오류
  inputErrors: ErrorMessageItem[] // 입력 오류 메시지
  apiErrors: ErrorMessageItem[] // API 오류 메시지
}

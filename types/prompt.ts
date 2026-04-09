// 시스템 프롬프트
export interface SystemPrompt {
  promptId: string // PROMPT_ID
  promptName: string // PROMPT_NAME
  promptTypeCd: string // PROMPT_TYPE_CD
  content: string // CONTENT
  applyLlmYn: 'Y' | 'N' // APPLY_LLM_YN
  sysPtYn: 'Y' | 'N' // SYS_PT_YN
  priority: number // PRIORITY
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
  inputBanWords: banWordItem[] // 입력 금지어
  outputBanWords: banWordItem[] // 출력 금지어
  policies: PromptFilterPolicy[] // 컨텐츠 필터링 정책
}

// 금지어
export interface banWordItem {
  wordId: string // WORD_ID
  word: string // WORD
  wordType: string // WORD_TYPE (input / output)
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
}

// 컨텐츠 필터링 정책
export interface PromptFilterPolicy {
  filterCd: string // FILTER_CD
  filterName: string // FILTER_NAME (CODE_NM)
  filterDesc: string // FILTER_DESC (DESCRIPTION)
  applyYn: 'Y' | 'N' // APPLY_YN
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
}

// 토큰/응답 제한
export interface PromptLimitData {
  limitId: string // LIMIT_ID
  // 토큰 제한
  maxInTokens: number // MAX_IN_TOKENS
  maxOutTokens: number // MAX_OUT_TOKENS
  ctxtWin: number // CTXT_WIN
  // 사용량 제한
  dayUserLmt: number // DAY_USER_LMT
  monOrgLmt: number // MON_ORG_LMT
  rateLmtRpm: number // RATE_LMT_RPM
  // 응답 품질 제어
  minRespLen: number // MIN_RESP_LEN
  respTmo: number // RESP_TMO
  retryCnt: number // RETRY_CNT
  streamYn: 'Y' | 'N' // STREAM_YN
  modifyDt: string // MODIFY_DT
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

export interface PromptAgent {
  agentId: string // AGENT_ID
  agentNm: string // AGENT_NM
}

export interface PromptAppAgt {
  promptId: string // PROMPT_ID
  agentId: string // AGENT_ID
  applyYn: 'Y' | 'N' // APPLY_YN
}

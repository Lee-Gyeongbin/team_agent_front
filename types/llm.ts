/** API 설정 */
export interface LlmApiConfig {
  modelId: string // 모델 ID
  apiUrl: string // API URL
  apiKey: string // API 키
  tmoSec: number // 타임아웃 (초)
  retryCnt: number // 재시도 횟수
  custHeaders: string // 추가 헤더 (JSON)
}

/** 모델 파라미터 */
export interface LlmModelParams {
  modelId: string // 모델 ID
  temperature: number
  topP: number
  maxTokens: number
  ctxtWin: number // 컨텍스트 윈도우
  freqPenalty: number
  presPenalty: number
  streamYn: string // 스트리밍 지원
  fnCallYn: string // 함수 호출 (Tool) 지원
  visionYn: string // 비전(이미지) 지원
}

/** 사용량 제한 */
export interface LlmUsageLimit {
  dayReqLmt: number // 일일 요청 제한 (DAY_REQ_LMT)
  rpmLimit: number // 분당 요청 제한 (RPM_LIMIT)
  tpmLimit: number // 분당 토큰 제한 (TPM_LIMIT)
  dayCostLmt: number // 일일 비용 제한 (DAY_COST_LMT)
}

/** 접근 제어 (역할별) */
export interface LlmAccessControl {
  modelId: string // 모델 ID
  roleId: string // 역할 ID (admin, premium, general 등)
  allowedYn: boolean // 허용 여부
}

/** 프로바이더 */
export interface LlmProvider {
  providerId: string // 프로바이더 ID
  providerName: string // 프로바이더명
  baseUrl: string // 기본 URL
  authType: string // 인증 타입
  providerUseYn: 'Y' | 'N' // 사용여부
  providerDescription: string // 설명
  providerCreateDt: string // 생성일시
  providerModifyDt: string // 수정일시
}

/** 기본 정보 (DB 필드 매핑) */
export interface LlmBaseInfo {
  modelId: string // 모델ID (예: gpt-4o)
  modelName: string // 모델명
  providerId: string // Provider ID (FK)
  version: string // 버전 (예: 2024-11-20)
  inputCost: number // 입력 비용($/1M토큰)
  outputCost: number // 출력 비용($/1M토큰)
  useYn: 'Y' | 'N' // 사용여부 (Y/N)
  description: string // 설명
  sortOrder: number // 표시순서 (드래그 정렬)
  modelCreateDt: string // 생성일시
  modelModifyDt: string // 수정일시
}

/** 마스터 모델 인터페이스 */
export interface LlmModel extends LlmBaseInfo, LlmApiConfig, LlmModelParams, LlmUsageLimit, LlmProvider {
  accessControlList?: LlmAccessControl[] // 역할별 접근 제어 목록 (레거시)
  roleIdArr?: string // 역할 ID 배열 (쉼표 구분, 예: ROLE_ADMIN,ROLE_PREMIUM,ROLE_USER)
}

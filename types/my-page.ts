import type { TableColumn } from '~/types/table'

/** 내 페이지 행 데이터 */
export interface MyPageItem {
  userId: string
  userNm: string
  email: string
  phone: string
  orgId: string
  acctStatusCd: string
  acctStatusDesc: string
  lastLoginDt: string
  pwdChgDt: string
}

export interface ChangePasswordResponse {
  successYn?: boolean
  returnMsg?: string
}

export interface MyPageProfileUploadPrepareResponse {
  successYn?: boolean
  uploadUrl?: string
  filePath?: string
  returnMsg?: string
}

export interface MyPageProfileImageUpdateResponse {
  successYn?: boolean
  returnMsg?: string
}

export interface MyPageProfileImageViewResponse {
  viewType?: string
  url?: string
  fileName?: string
  reason?: string
}

/** 로그인 이력 행 */
export interface MyPageLoginHistoryItem {
  userId: string
  ipAddr: string
  userAgent: string
  result: string
  failRson: string
  createDt: string
}

/** 마이페이지 로그인 이력 조회 조건 (POST JSON 본문) */
export interface MyPageHistoryParams {
  fromDt: string
  toDt: string
  ipAddr: string
  result: string
}

/** 마이페이지 로그인 이력 조회 API 응답 */
export interface MyPageHistoryResponse {
  dataList: MyPageLoginHistoryItem[]
}

/** 로그인 이력 테이블 컬럼 */
export const historyColumns: TableColumn[] = [
  { key: 'ipAddr', label: 'IP 주소', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'userAgent', label: '브라우저', width: '200px', align: 'left', headerAlign: 'center' },
  { key: 'result', label: '결과', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'failRson', label: '실패 사유', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '일시', width: '160px', align: 'center', headerAlign: 'center' },
]

import type { TableColumn } from '~/types/table'

/** 로그인 이력 행 데이터 (이력 테이블 스키마 기준) */
export interface LoginHistoryItem {
  logId: string
  userId: string
  loginTp: string
  accessTp: string
  ipAddr: string
  userAgent: string
  result: '성공' | '실패'
  failRson: string | null
  failCnt: number
  token: string | null
  otpStatus: string | null
  ipStatus: string | null
  createDt: string
}

/** 기간 선택 옵션 */
export interface LoginHistoryDateRangeOption {
  label: string
  value: string
}

/** 로그인 이력 테이블 컬럼 정의 */
export const loginHistoryColumns: TableColumn[] = [
  { key: 'userId', label: '사용자 ID', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'ipAddr', label: 'IP 주소', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'userAgent', label: '브라우저', width: '200px', align: 'left', headerAlign: 'center' },
  { key: 'result', label: '결과', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'failRson', label: '실패 사유', width: '140px', align: 'left', headerAlign: 'center' },
  { key: 'createDt', label: '일시', width: '160px', align: 'center', headerAlign: 'center' },
]

/** 기간 선택 옵션 목록 */
export const loginHistoryDateRangeOptions: LoginHistoryDateRangeOption[] = [
  { label: '최근 7일', value: '7d' },
  { label: '최근 30일', value: '30d' },
  { label: '최근 90일', value: '90d' },
]

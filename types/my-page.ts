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

/** 로그인 이력 테이블 컬럼 정의 */
export const myPageLoginHistoryColumns: TableColumn[] = [
  { key: 'ipAddr', label: 'IP 주소', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'userAgent', label: '브라우저', width: '200px', align: 'left', headerAlign: 'center' },
  { key: 'result', label: '결과', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'failRson', label: '실패 사유', width: '140px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '일시', width: '160px', align: 'center', headerAlign: 'center' },
]

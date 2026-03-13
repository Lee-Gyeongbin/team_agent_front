import type { TableColumn } from '~/types/table'

/** 사용자 행 데이터 (이력 테이블 스키마 기준) */
export interface UserItem {
  userId: string
  userNm: string
  email: string
  password: string
  phone: string
  orgId: string
  useYn: string
  lastLoginDt: string
  pwdChgDt: string
  loginFailCnt: number
  twoFaYn: string
  accTp: string
  acctStatusCd: string
  lockDt: string
  createDt: string
  modifyDt: string
  crtrId: string
  mdfrId: string
}

/** 사용자 테이블 컬럼 정의 */
export const userColumns: TableColumn[] = [
  { key: 'userId', label: 'ID', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'userNm', label: '성명', width: '130px', align: 'center', headerAlign: 'center' },
  { key: 'email', label: '이메일', width: '200px', align: 'center', headerAlign: 'center' },
  { key: 'phone', label: '전화번호', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'orgId', label: '조직', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'lastLoginDt', label: '마지막 로그인 일시', width: '160px', align: 'center', headerAlign: 'center' },
  { key: 'pwdChgDt', label: '비밀번호 변경 일시', width: '160px', align: 'center', headerAlign: 'center' },
  { key: 'acctStatusCd', label: '계정 상태', width: '90px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '관리', width: '120px', align: 'center', headerAlign: 'center' },
]

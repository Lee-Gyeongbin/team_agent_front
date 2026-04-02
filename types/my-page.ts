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

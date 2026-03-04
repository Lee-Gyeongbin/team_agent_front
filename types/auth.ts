export interface UserInfo {
  userId: string
  userNm: string
  compId: string
  deptId: string
  deptNm: string
  email: string
  jikgubNm: string
  posNm: string
}

export interface LoginResponse {
  success: boolean
  errorType?: string
  message?: string
  user?: UserInfo
}


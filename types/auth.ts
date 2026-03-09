export interface UserInfo {
  userId: string
  userNm: string
  email: string
  orgId: string
  orgNm: string
}

export interface LoginResponse {
  success: boolean
  errorType?: string
  message?: string
  user?: UserInfo
}

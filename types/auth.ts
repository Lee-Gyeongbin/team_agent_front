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

/** 회원가입 폼 데이터 */
export interface SignupForm {
  userId: string
  userNm: string
  password: string
  passwordConfirm: string
  email: string
  phone: string
}

export const createEmptySignupForm = (): SignupForm => ({
  userId: '',
  userNm: '',
  password: '',
  passwordConfirm: '',
  email: '',
  phone: '',
})

export interface SignupResponse {
  success: boolean
  errorType?: string
  message?: string
}

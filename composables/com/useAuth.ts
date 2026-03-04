import type { LoginResponse, UserInfo } from '~/types/auth'

const COOKIE_NAME = 'ta_user'

export const useAuth = () => {
  const { post, get } = useApi()
  const userCookie = useCookie<UserInfo | null>(COOKIE_NAME, {
    path: '/',
    default: () => null,
  })

  const user = computed(() => userCookie.value)
  const isLoggedIn = computed(() => !!userCookie.value)

  const login = async (userId: string, password: string): Promise<LoginResponse> => {
    const res = await post<LoginResponse>('/api/login.do', { userId, password })

    if (res.success && res.user) {
      userCookie.value = res.user
    }

    return res
  }

  const logout = async () => {
    try {
      await post<LoginResponse>('/api/logout.do', {})
    } catch {
      // 세션 만료 등으로 실패해도 로컬 쿠키는 정리
    }
    userCookie.value = null
    navigateTo('/login')
  }

  const checkSession = async (): Promise<boolean> => {
    try {
      const res = await get<LoginResponse>('/api/session/user.do')
      if (res.success && res.user) {
        userCookie.value = res.user
        return true
      }
      userCookie.value = null
      return false
    } catch {
      userCookie.value = null
      return false
    }
  }

  return { user, isLoggedIn, login, logout, checkSession }
}

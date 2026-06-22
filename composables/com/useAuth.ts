import type { LoginResponse, SignupForm, SignupResponse, UserInfo } from '~/types/auth'
import { useMailStore } from '~/composables/mail/useMailStore'

const COOKIE_NAME = 'ta_user'

export const useAuth = () => {
  const { post, get } = useApi()
  const { fetchMenuList, clearMenuList } = useMenu()
  const { fetchChatGuideList, clearChatGuideList } = useChatGuide()
  const userCookie = useCookie<UserInfo | null>(COOKIE_NAME, {
    path: '/',
    default: () => null,
  })

  const user = computed(() => userCookie.value)
  const isLoggedIn = computed(() => !!userCookie.value)

  const login = async (userId: string, password: string): Promise<LoginResponse> => {
    const res = await post<LoginResponse>('/login.do', { userId, password })

    if (res.success && res.user) {
      userCookie.value = res.user
      await Promise.all([fetchMenuList(), fetchChatGuideList()])
    }

    return res
  }

  const logout = async () => {
    try {
      await post<LoginResponse>('/logout.do', {})
    } catch {
      // 세션 만료 등으로 실패해도 로컬 쿠키는 정리
    }
    userCookie.value = null
    clearMenuList()
    clearChatGuideList()
    useMailStore().clearMailAuth()
    navigateTo('/login')
  }

  const checkSession = async (): Promise<boolean> => {
    try {
      const res = await get<LoginResponse>('/session/user.do')
      if (res.success && res.user) {
        userCookie.value = res.user
        await Promise.all([fetchMenuList(), fetchChatGuideList()])
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

export const useSignup = () => {
  const { post } = useApi()
  const signup = async (form: SignupForm): Promise<SignupResponse> => {
    const res = await post<SignupResponse>('/signup.do', form)
    return res
  }
  return { signup }
}

export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/signup') return

  /** 미구현 메뉴 TODO : 삭제 */
  if (to.path === '/planned') {
    if (import.meta.client) {
      openToast({ message: '준비중입니다.', type: 'warning' })
      return abortNavigation()
    }
    return navigateTo('/')
  }

  const user = useCookie('ta_user')
  if (!user.value) {
    const redirect = to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirect}`)
  }

  // 로그인 상태일 때 모든 라우트에서 알림 목록 갱신 (비동기 — 네비게이션 차단 없음)
  if (import.meta.client) {
    const { handleFetchNotifyList } = useNotifyStore()
    handleFetchNotifyList()
  }
})

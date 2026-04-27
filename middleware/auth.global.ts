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
})

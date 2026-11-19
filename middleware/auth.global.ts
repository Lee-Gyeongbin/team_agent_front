import type { UserInfo } from '~/types/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/signup') return

  const user = useCookie<UserInfo | null>('ta_user')
  if (user.value?.pwdChgReqYn === 'Y') {
    return navigateTo('/login')
  }

  /** 미구현 메뉴 TODO : 삭제 */
  if (to.path === '/planned') {
    if (import.meta.client) {
      openToast({ message: '준비중입니다.', type: 'warning' })
      return abortNavigation()
    }
    return navigateTo('/')
  }

  if (!user.value) {
    const redirect = to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirect}`)
  }

  // 페이지가 permission: 'read'를 선언하면 조회 권한이 없는 주소 접근을 막는다
  if (to.meta.permission === 'read' && import.meta.client) {
    const { menuList, fetchMenuList } = useMenu()
    const { canRead } = usePermission()
    // 새로고침 직후에는 메뉴 목록이 비어 있을 수 있어 먼저 불러온다
    if (menuList.value.length === 0) {
      try {
        await fetchMenuList()
      } catch {
        return
      }
    }
    if (!canRead(to.path)) {
      openToast({ message: '접근 권한이 없습니다.', type: 'warning' })
      return navigateTo('/')
    }
  }

  // 로그인 상태일 때 모든 라우트에서 알림 목록 갱신 (비동기 — 네비게이션 차단 없음)
  if (import.meta.client) {
    const { handleFetchNotifyList } = useNotifyStore()
    handleFetchNotifyList()
  }
})

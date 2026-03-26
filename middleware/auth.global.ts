export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/signup') return
  const user = useCookie('ta_user')
  if (!user.value) {
    const redirect = to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirect}`)
  }
})

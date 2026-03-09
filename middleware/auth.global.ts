export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path === '/signup') return
  const user = useCookie('ta_user')
  if (!user.value) {
    return navigateTo('/login')
  }
})

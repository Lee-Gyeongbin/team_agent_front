export default defineNuxtPlugin(() => {
  const { checkSession } = useAuth()
  const route = useRoute()

  const verifySession = async () => {
    if (route.path === '/login') return

    const user = useCookie('ta_user')
    if (!user.value) return

    const valid = await checkSession()
    if (!valid) {
      navigateTo('/login?expired=true')
    }
  }

  verifySession()

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        verifySession()
      }
    })
  }
})

export const useApi = () => {
  const baseURL = '/api'

  const clearSessionAndRedirect = () => {
    if (typeof window === 'undefined') return
    const cookie = useCookie('ta_user')
    cookie.value = null
    navigateTo('/login?expired=true')
  }

  const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : `${baseURL}/${endpoint}`
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })

    if (response.status === 401) {
      clearSessionAndRedirect()
      throw new Error('인증이 만료되었습니다')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      const errorData = error as { errorType?: string; message?: string }
      if (errorData.errorType === 'sessionExpired') {
        clearSessionAndRedirect()
        throw new Error('로그인 세션이 만료되었습니다')
      }
      throw new Error(errorData.message || '요청에 실패했습니다')
    }

    return response.json()
  }

  const get = <T>(endpoint: string) => request<T>(endpoint)
  const post = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
  const put = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
  const del = <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })

  return { get, post, put, del }
}

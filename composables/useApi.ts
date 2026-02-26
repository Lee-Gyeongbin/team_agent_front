export const useApi = () => {
  const baseURL = '/api'

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const url = endpoint.startsWith('/')
      ? `${baseURL}${endpoint}`
      : `${baseURL}/${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    })

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        navigateTo('/login')
      }
      throw new Error('인증이 만료되었습니다')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        (error as { message?: string }).message || '요청에 실패했습니다',
      )
    }

    return response.json()
  }

  const get = <T>(endpoint: string) => request<T>(endpoint)
  const post = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
  const put = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
  const del = <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' })

  return { get, post, put, del }
}

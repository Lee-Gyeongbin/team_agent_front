import { isNetworkError, notifyNetworkError } from '~/composables/com/useNetworkErrorNotice'

export const useApi = () => {
  const baseURL = '/api'

  const clearSessionAndRedirect = () => {
    if (typeof window === 'undefined') return
    const cookie = useCookie('ta_user')
    cookie.value = null
    navigateTo('/login?expired=true')
  }

  const handleResponse = async (response: Response): Promise<Response> => {
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

    return response
  }

  const withNetworkNotice = async <T>(execute: () => Promise<T>): Promise<T> => {
    try {
      return await execute()
    } catch (err) {
      if (isNetworkError(err)) notifyNetworkError()
      throw err
    }
  }

  const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : `${baseURL}/${endpoint}`

    return withNetworkNotice(async () => {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      })
      await handleResponse(response)
      return response.json() as Promise<T>
    })
  }

  /** GET — 응답 본문을 JSON이 아닌 Blob으로 받을 때(파일 다운로드 등) */
  const getBlob = async (endpoint: string, options: RequestInit = {}): Promise<Blob> => {
    const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : `${baseURL}/${endpoint}`

    return withNetworkNotice(async () => {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      })

      await handleResponse(response)
      return response.blob()
    })
  }

  /** POST — 응답 본문을 JSON이 아닌 Blob으로 받을 때(파일 다운로드 등) */
  const postBlob = async (endpoint: string, body: unknown): Promise<Blob> => {
    const url = endpoint.startsWith('/') ? `${baseURL}${endpoint}` : `${baseURL}/${endpoint}`

    return withNetworkNotice(async () => {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      await handleResponse(response)
      return response.blob()
    })
  }

  const get = <T>(endpoint: string) => request<T>(endpoint)
  const post = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) })
  const put = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) })
  const del = <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' })

  return { get, getBlob, postBlob, post, put, del }
}

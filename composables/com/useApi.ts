import { notifyApiError } from '~/composables/com/useApiErrorNotice'
import {
  isNetworkError,
  notifyIncidentError,
  notifyIncidentFromApiBody,
  resolveFatalServerError,
} from '~/composables/com/useIncidentErrorNotice'

export const useApi = () => {
  const baseURL = '/api'

  const clearSessionAndRedirect = () => {
    if (typeof window === 'undefined') return
    const cookie = useCookie('ta_user')
    cookie.value = null
    navigateTo('/login?expired=true')
  }

  const handleResponse = async (response: Response): Promise<Response> => {
    const isHtmlResponse = response.headers.get('content-type')?.includes('text/html') === true
    if (response.ok && !isHtmlResponse) return response

    const error = isHtmlResponse ? {} : await response.json().catch(() => ({}))
    const errorData = error as { errorType?: string; message?: string }
    const fatalServerError = resolveFatalServerError(response)

    if (fatalServerError) {
      const fatalError = createError({
        ...fatalServerError,
        message: errorData.message || '서버 오류가 발생했습니다.',
        fatal: true,
      })
      showError(fatalError)
      throw fatalError
    }

    const guideMessage = notifyApiError(response.status)

    if (response.status === 401 || errorData.errorType === 'sessionExpired') {
      clearSessionAndRedirect()
      throw new Error(guideMessage || '인증이 만료되었습니다')
    }

    throw new Error(guideMessage || errorData.message || '요청에 실패했습니다')
  }

  const withNetworkNotice = async <T>(execute: () => Promise<T>): Promise<T> => {
    try {
      return await execute()
    } catch (err) {
      if (isNetworkError(err)) notifyIncidentError()
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
      const data = (await response.json()) as T
      // HTTP 200 + result FAIL + RESP_SYS_ERROR / RESP_DB_ERROR → 장애 모달
      notifyIncidentFromApiBody(data)
      return data
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

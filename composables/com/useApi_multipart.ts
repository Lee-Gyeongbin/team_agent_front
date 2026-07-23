import type { FetchOptions } from 'ofetch'
import { notifyApiError } from '~/composables/com/useApiErrorNotice'
import {
  isNetworkError,
  notifyIncidentError,
  notifyIncidentFromApiBody,
  resolveFatalServerError,
} from '~/composables/com/useIncidentErrorNotice'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface ApiOptions extends Omit<FetchOptions, 'body' | 'query'> {
  method?: Method
  data?: Record<string, unknown>
  body?: BodyInit | null
  query?: Record<string, string | number | boolean | undefined>
  skipLoading?: boolean
}

/**
 * Nuxt 3용 multipart/form-data API 요청 컴포저블
 *
 * @param url 요청할 API 엔드포인트
 * @param options ofetch의 FetchOptions
 */
export const useApi_multipart = <T = unknown>(url: string, options: ApiOptions = {}) => {
  const config = useRuntimeConfig()
  const loadingCount = useState('loadingCount', () => 0)

  // 환경별 URL 처리: 빌드환경에서는 /api 제거
  const processedUrl = import.meta.dev
    ? url // 개발환경: 그대로 사용 (devProxy가 처리)
    : url.replace(/^\/api\//, '/') // 빌드환경: /api/ 제거

  const baseURL = (config.public?.apiBase as string | undefined) ?? '/api'

  const showFatalServerError = (fatalServerError: { statusCode: number; statusMessage: string }, message?: string) => {
    showError(
      createError({
        ...fatalServerError,
        message: message || '서버 오류가 발생했습니다.',
        fatal: true,
      }),
    )
  }

  const defaults: FetchOptions = {
    baseURL,
    credentials: 'include', // 🔥 JSESSIONID 쿠키를 보내야 세션 인식됨
    headers: {
      Accept: 'application/json',
      // 'Content-Type': 'multipart/form-data',
      'X-Requested-From': 'nuxt',
    },
    // 요청 전처리
    onRequest({ options }) {
      // CSRF 토큰이나 인증 토큰이 필요하다면 여기서 헤더에 추가할 수 있습니다.
      // 예: const token = useCookie('token');
      // if (token.value) {
      //   options.headers = { ...options.headers, Authorization: `Bearer ${token.value}` };
      // }

      const opts = options as ApiOptions
      if (opts.skipLoading !== true) {
        loadingCount.value++
      }
    },

    // 응답 후처리
    onResponse({ response, options }) {
      const opts = options as ApiOptions
      if (opts.skipLoading !== true && loadingCount.value > 0) {
        loadingCount.value--
      }

      const fatalServerError = resolveFatalServerError(response)
      if (fatalServerError) {
        showFatalServerError(fatalServerError, response._data?.message)
        return
      }

      // HTTP 200 + result FAIL + RESP_SYS_ERROR / RESP_DB_ERROR → 장애 모달
      if (response.ok) notifyIncidentFromApiBody(response._data)
    },

    // 요청 자체 실패 (네트워크 단절 등)
    onRequestError({ error, options }) {
      const opts = options as ApiOptions
      if (opts.skipLoading !== true && loadingCount.value > 0) {
        loadingCount.value--
      }

      if (isNetworkError(error)) notifyIncidentError()
    },

    // 에러 발생 시 후처리
    onResponseError({ response }) {
      if (resolveFatalServerError(response)) return

      const errorData = response._data

      if (errorData?.errorType === 'secure') {
        return
      }

      // chatGuide API 오류 문구 toast (500/429/408/401·403)
      notifyApiError(response.status)

      if (errorData?.errorType === 'sessionExpired' || response.status === 401) {
        navigateTo('/login')
      }
    },
  }

  const mergedOptions = {
    ...defaults,
    ...options,
    headers: {
      ...defaults.headers,
      ...options.headers,
    },
    body: options.body ?? options.data, // FormData/Blob 등 multipart 바디
    query: options.query,
  }

  // NitroFetchOptions의 method 리터럴 타입 호환을 위한 단언
  return $fetch<T>(processedUrl, mergedOptions as Parameters<typeof $fetch>[1])
}

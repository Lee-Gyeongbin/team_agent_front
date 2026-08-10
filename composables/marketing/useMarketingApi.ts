import { useApi } from '~/composables/com/useApi'
import type {
  MarketingAgentSummary,
  MarketingContentDetail,
  MarketingContentListParams,
  MarketingContentListResponse,
  MarketingCreateRequest,
  MarketingCreateResponse,
  MarketingRefineRequest,
  MarketingStreamDoneEvent,
  MarketingStreamErrorEvent,
  MarketingStreamProgressEvent,
} from '~/types/marketing'

const toQueryString = (params: MarketingContentListParams) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

type MarketingStreamHandlers = {
  onProgress?: (data: MarketingStreamProgressEvent) => void
  onDone?: (data: MarketingStreamDoneEvent) => void
  onError?: (data?: MarketingStreamErrorEvent) => void
}

/** 마케팅 생성 SSE — Meeting 패턴 named EventSource */
const openMarketingEvents = (contentId: string): EventSource => {
  const id = String(contentId).trim()
  return new EventSource(`/api/marketing/contents/${encodeURIComponent(id)}/events`)
}

/** 마케팅 생성 이벤트 구독 — close 함수 반환 */
const subscribeMarketingEvents = (contentId: string, handlers: MarketingStreamHandlers): (() => void) => {
  const id = String(contentId).trim()
  if (!id) {
    handlers.onError?.({ message: 'contentId is required' })
    return () => undefined
  }

  const es = openMarketingEvents(id)
  let settled = false

  const finish = () => {
    if (settled) return
    settled = true
    es.close()
  }

  es.addEventListener('progress', (event: MessageEvent) => {
    try {
      const data = JSON.parse(String(event.data ?? '')) as MarketingStreamProgressEvent
      handlers.onProgress?.(data)
    } catch {
      // 파싱 실패 무시
    }
  })

  es.addEventListener('done', (event: MessageEvent) => {
    try {
      const data = JSON.parse(String(event.data ?? '')) as MarketingStreamDoneEvent
      handlers.onDone?.(data)
    } catch {
      handlers.onError?.({ message: 'Stream parse failed' })
    }
    finish()
  })

  es.addEventListener('error', (event: MessageEvent) => {
    try {
      const data = event.data ? (JSON.parse(String(event.data)) as MarketingStreamErrorEvent) : undefined
      handlers.onError?.(data ?? { message: '콘텐츠 생성 중 오류가 발생했습니다.' })
    } catch {
      handlers.onError?.({ message: '콘텐츠 생성 중 오류가 발생했습니다.' })
    }
    finish()
  })

  es.onerror = () => {
    if (settled) return
    handlers.onError?.({ message: '마케팅 생성 이벤트 수신에 실패했습니다.' })
    finish()
  }

  return finish
}

export const useMarketingApi = () => {
  const { get, post, put, del } = useApi()

  const fetchMarketingAgents = () => get<{ list: MarketingAgentSummary[] }>('/marketing/agents')

  const fetchMarketingContents = (params: MarketingContentListParams = {}) =>
    get<MarketingContentListResponse>(`/marketing/contents${toQueryString(params)}`)

  const fetchMarketingContent = (contentId: string) =>
    get<MarketingContentDetail>(`/marketing/contents/${encodeURIComponent(contentId)}`)

  const fetchCreateMarketingContent = (payload: MarketingCreateRequest) => {
    /** File[]는 JSON 직렬화 불가 — referenceFiles 제외 후 전송 */
    const body = { ...payload } as MarketingCreateRequest & { referenceFiles?: File[] }
    delete body.referenceFiles
    return post<MarketingCreateResponse>('/marketing/contents', body)
  }

  const fetchUpdateMarketingContentTitle = (contentId: string, title: string) =>
    put<{ successYn: boolean }>(`/marketing/contents/${encodeURIComponent(contentId)}`, { title })

  const fetchDeleteMarketingContent = (contentId: string) =>
    del<{ successYn: boolean }>(`/marketing/contents/${encodeURIComponent(contentId)}`)

  const fetchRefineMarketingVariant = (contentId: string, variantId: number, payload: MarketingRefineRequest) =>
    post<MarketingCreateResponse>(
      `/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}/refine`,
      payload,
    )

  return {
    fetchMarketingAgents,
    fetchMarketingContents,
    fetchMarketingContent,
    fetchCreateMarketingContent,
    fetchUpdateMarketingContentTitle,
    fetchDeleteMarketingContent,
    fetchRefineMarketingVariant,
    subscribeMarketingEvents,
  }
}

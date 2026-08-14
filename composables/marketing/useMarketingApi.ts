import { useApi } from '~/composables/com/useApi'
import type { FileUploadResponse } from '~/types/file'
import type { ChatFileViewResponse } from '~/types/chat'
import type {
  MarketingActionResponse,
  MarketingAgentSummary,
  MarketingContentDetail,
  MarketingContentListParams,
  MarketingContentListResponse,
  MarketingCreateRequest,
  MarketingCreateResponse,
  MarketingRefineRequest,
  MarketingVariantUpdateRequest,
  MarketingStreamDoneEvent,
  MarketingStreamErrorEvent,
  MarketingStreamProgressEvent,
  MarketingFile,
  MarketingFileSavePayload,
  MarketingFileSaveResponse,
  MarketingFileUpdatePayload,
  MarketingFileUploadUrlRequest,
  MarketingProject,
  MarketingProjectListFilter,
} from '~/types/marketing'

const toQueryString = (params: MarketingContentListParams) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export const useMarketingApi = () => {
  const { get, post, put, del } = useApi()

  const fetchMarketingAgents = () => get<{ list: MarketingAgentSummary[] }>('/marketing/agents')

  // ── 마케팅 프로젝트 / 파일 ────────────────────────────────────────────────

  /** 마케팅 파일 업로드 presigned URL 발급 (NCP PUT 전) */
  const fetchCreateMarketingFileUploadUrl = async (
    meta: MarketingFileUploadUrlRequest,
  ): Promise<FileUploadResponse> => {
    return post<FileUploadResponse>('/ai/marketing/saveMarketingFileUploadUrl.do', meta)
  }

  /** 마케팅 파일 메타 저장 (NCP 업로드 완료 후) */
  const fetchSaveMarketingFile = async (payload: MarketingFileSavePayload): Promise<MarketingFileSaveResponse> => {
    return post<MarketingFileSaveResponse>('/ai/marketing/saveMarketingFile.do', payload)
  }

  /** 마케팅 프로젝트 단건 조회 (상세 페이지 진입 시) */
  const fetchSelectMarketingProject = async (
    marketingProjectId: string,
  ): Promise<{ result: string; data: MarketingProject }> => {
    return get<{ result: string; data: MarketingProject }>(
      `/ai/marketing/selectMarketingProject.do?marketingProjectId=${encodeURIComponent(marketingProjectId)}`,
    )
  }

  /** 마케팅 프로젝트 목록 조회 */
  const fetchMarketingProjectList = async (
    filter?: MarketingProjectListFilter,
  ): Promise<{ list: MarketingProject[] }> => {
    let url = '/ai/marketing/selectMarketingProjectList.do'
    if (filter) {
      const nonEmpty = Object.fromEntries(Object.entries(filter).filter(([, v]) => v !== '' && v != null))
      const qs = new URLSearchParams(nonEmpty as Record<string, string>).toString()
      if (qs) url += '?' + qs
    }
    return get<{ list: MarketingProject[] }>(url)
  }

  /** 마케팅 프로젝트 저장 (신규/수정) */
  const fetchSaveMarketingProject = async (
    data: Partial<MarketingProject>,
  ): Promise<{ result: string; marketingProjectId: string }> => {
    return post<{ result: string; marketingProjectId: string }>('/ai/marketing/saveMarketingProject.do', data)
  }

  /** 마케팅 프로젝트 삭제 */
  const fetchDeleteMarketingProject = async (marketingProjectId: string): Promise<{ result: string }> => {
    const params = new URLSearchParams({ marketingProjectId })
    return post<{ result: string }>(`/ai/marketing/deleteMarketingProject.do?${params.toString()}`, {})
  }

  /** 프로젝트 첨부파일 목록 */
  const fetchSelectMarketingFileList = async (marketingProjectId: string): Promise<{ list: MarketingFile[] }> => {
    return get<{ list: MarketingFile[] }>(
      `/ai/marketing/selectMarketingFileList.do?marketingProjectId=${encodeURIComponent(marketingProjectId)}`,
    )
  }

  /** 프로젝트 첨부파일 삭제 */
  const fetchDeleteMarketingFile = async (marketingFileId: string): Promise<{ result: string }> => {
    const params = new URLSearchParams({ marketingFileId })
    return post<{ result: string }>(`/ai/marketing/deleteMarketingFile.do?${params.toString()}`, {})
  }

  /** 프로젝트 첨부파일명 수정 */
  const fetchUpdateMarketingFile = async (payload: MarketingFileUpdatePayload): Promise<{ result: string }> => {
    return post<{ result: string }>('/ai/marketing/updateMarketingFile.do', payload)
  }

  /** 프로젝트 첨부파일 미리보기/다운로드 URL (viewChatFile 과 동일 응답) */
  const fetchViewMarketingFile = async (marketingFileId: string): Promise<ChatFileViewResponse> => {
    return post<ChatFileViewResponse>('/ai/marketing/viewMarketingFile.do', { marketingFileId })
  }

  const fetchMarketingContents = (params: MarketingContentListParams = {}) =>
    get<MarketingContentListResponse>(`/marketing/contents${toQueryString(params)}`)

  const fetchMarketingContent = (contentId: string) =>
    get<MarketingContentDetail>(`/marketing/contents/${encodeURIComponent(contentId)}`)

  const fetchCreateMarketingContent = (payload: MarketingCreateRequest) =>
    post<MarketingCreateResponse>('/marketing/contents', payload)

  const fetchUpdateMarketingContentTitle = (contentId: string, title: string) =>
    put<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}`, { title })

  const fetchDeleteMarketingContent = (contentId: string) =>
    del<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}`)

  const fetchRefineMarketingVariant = (contentId: string, variantId: number, payload: MarketingRefineRequest) =>
    post<MarketingActionResponse>(
      `/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}/refine`,
      payload,
    )

  const fetchUpdateMarketingVariant = (contentId: string, variantId: number, payload: MarketingVariantUpdateRequest) =>
    put<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}`, payload)

  /**
   * 마케팅 생성 SSE — progress → done/error
   * @returns EventSource (필요 시 직접 close 호출)
   */
  const streamMarketingEvents = (
    contentId: string,
    callbacks: {
      onProgress?: (data: MarketingStreamProgressEvent) => void
      onDone?: (data: MarketingStreamDoneEvent) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const params = new URLSearchParams({ contentId })
    const es = new EventSource(`/api/ai/marketing/streamMarketingEvents.do?${params.toString()}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse(e.data) as MarketingStreamProgressEvent)
      } catch {
        /* ignore */
      }
    })

    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse(e.data) as MarketingStreamDoneEvent)
      } catch {
        callbacks.onError?.('Stream parse failed')
      } finally {
        es.close()
      }
    })

    es.addEventListener('error', (e) => {
      try {
        const me = e as MessageEvent
        if (me.data) {
          const data = JSON.parse(me.data) as MarketingStreamErrorEvent
          callbacks.onError?.(data.message || '콘텐츠 생성 중 오류가 발생했습니다.')
        } else {
          callbacks.onError?.('마케팅 생성 이벤트 수신에 실패했습니다.')
        }
      } catch {
        callbacks.onError?.('마케팅 생성 이벤트 수신에 실패했습니다.')
      } finally {
        es.close()
      }
    })

    return es
  }

  return {
    fetchMarketingAgents,
    fetchMarketingProjectList,
    fetchSelectMarketingProject,
    fetchSaveMarketingProject,
    fetchDeleteMarketingProject,
    fetchCreateMarketingFileUploadUrl,
    fetchSaveMarketingFile,
    fetchSelectMarketingFileList,
    fetchDeleteMarketingFile,
    fetchUpdateMarketingFile,
    fetchViewMarketingFile,
    fetchMarketingContents,
    fetchMarketingContent,
    fetchCreateMarketingContent,
    fetchUpdateMarketingContentTitle,
    fetchDeleteMarketingContent,
    fetchRefineMarketingVariant,
    fetchUpdateMarketingVariant,
    streamMarketingEvents,
  }
}

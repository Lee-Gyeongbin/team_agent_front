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
  MarketingExportHtmlResponse,
  MarketingRefineRequest,
  MarketingVariantUpdateRequest,
  MarketingScheduleUpdateRequest,
  MarketingPublishedUpdateRequest,
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

/** GET 쿼리 문자열 */
const toQueryString = (params: object) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    query.set(key, String(value))
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
  ): Promise<MarketingActionResponse & { data: MarketingProject }> => {
    return get<MarketingActionResponse & { data: MarketingProject }>(
      `/ai/marketing/selectMarketingProject.do${toQueryString({ marketingProjectId })}`,
    )
  }

  /** 마케팅 프로젝트 목록 조회 */
  const fetchMarketingProjectList = async (
    filter?: MarketingProjectListFilter,
  ): Promise<{ list: MarketingProject[] }> => {
    return get<{ list: MarketingProject[] }>(
      `/ai/marketing/selectMarketingProjectList.do${toQueryString(filter ?? {})}`,
    )
  }

  /** 마케팅 프로젝트 저장 (신규/수정) */
  const fetchSaveMarketingProject = async (
    data: Partial<MarketingProject>,
  ): Promise<MarketingActionResponse & { marketingProjectId: string }> => {
    return post<MarketingActionResponse & { marketingProjectId: string }>('/ai/marketing/saveMarketingProject.do', data)
  }

  /** 마케팅 프로젝트 삭제 */
  const fetchDeleteMarketingProject = async (marketingProjectId: string): Promise<MarketingActionResponse> => {
    return post<MarketingActionResponse>(
      `/ai/marketing/deleteMarketingProject.do${toQueryString({ marketingProjectId })}`,
      {},
    )
  }

  /** 프로젝트 첨부파일 목록 */
  const fetchSelectMarketingFileList = async (marketingProjectId: string): Promise<{ list: MarketingFile[] }> => {
    return get<{ list: MarketingFile[] }>(
      `/ai/marketing/selectMarketingFileList.do${toQueryString({ marketingProjectId })}`,
    )
  }

  /** 프로젝트 첨부파일 삭제 */
  const fetchDeleteMarketingFile = async (marketingFileId: string): Promise<MarketingActionResponse> => {
    return post<MarketingActionResponse>(
      `/ai/marketing/deleteMarketingFile.do${toQueryString({ marketingFileId })}`,
      {},
    )
  }

  /** 프로젝트 첨부파일명 수정 */
  const fetchUpdateMarketingFile = async (payload: MarketingFileUpdatePayload): Promise<MarketingActionResponse> => {
    return post<MarketingActionResponse>('/ai/marketing/updateMarketingFile.do', payload)
  }

  /** 프로젝트 첨부파일 미리보기/다운로드 URL (viewChatFile 과 동일 응답) */
  const fetchViewMarketingFile = async (marketingFileId: string): Promise<ChatFileViewResponse> => {
    return post<ChatFileViewResponse>('/ai/marketing/viewMarketingFile.do', { marketingFileId })
  }

  /**
   * 내보내기 문서 HTML 조회 — word/pdf는 이 HTML을 받아 프론트에서 직접 변환한다(회의록과 동일 패턴).
   * 서버는 LLM+템플릿(TM000009) 렌더링까지만 하고 파일 변환은 하지 않는다.
   */
  const fetchExportMarketingContentHtml = async (contentId: string): Promise<MarketingExportHtmlResponse> => {
    return get<MarketingExportHtmlResponse>(
      `/ai/marketing/exportMarketingContentHtml.do${toQueryString({ contentId })}`,
    )
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

  /** 발행 예정일 지정/변경 — 해제하려면 publishScheduledDt: null */
  const fetchUpdateMarketingSchedule = (contentId: string, payload: MarketingScheduleUpdateRequest) =>
    put<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}/schedule`, payload)

  /** 발행 완료 표시/해제 */
  const fetchUpdateMarketingPublished = (contentId: string, payload: MarketingPublishedUpdateRequest) =>
    put<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}/publish-status`, payload)

  const fetchRefineMarketingVariant = (contentId: string, variantId: number, payload: MarketingRefineRequest) =>
    post<MarketingActionResponse>(
      `/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}/refine`,
      payload,
    )

  const fetchUpdateMarketingVariant = (contentId: string, variantId: number, payload: MarketingVariantUpdateRequest) =>
    put<MarketingActionResponse>(`/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}`, payload)

  /** 시안을 직전 버전으로 되돌리기 (1회 롤백) */
  const fetchRestoreMarketingVariant = (contentId: string, variantId: number) =>
    post<MarketingActionResponse>(
      `/marketing/contents/${encodeURIComponent(contentId)}/variants/${variantId}/restore`,
      {},
    )

  /** 마케팅 생성 SSE — progress 후 done/error. 필요 시 EventSource.close 호출 */
  const streamMarketingEvents = (
    contentId: string,
    callbacks: {
      onProgress?: (data: MarketingStreamProgressEvent) => void
      onDone?: (data: MarketingStreamDoneEvent) => void
      onError?: (message: string) => void
    },
  ): EventSource => {
    const es = new EventSource(`/api/ai/marketing/streamMarketingEvents.do${toQueryString({ contentId })}`)

    es.addEventListener('progress', (e) => {
      try {
        callbacks.onProgress?.(JSON.parse(e.data) as MarketingStreamProgressEvent)
      } catch {
        // 진행 이벤트 JSON 파싱 실패는 무시
      }
    })

    es.addEventListener('done', (e) => {
      try {
        callbacks.onDone?.(JSON.parse(e.data) as MarketingStreamDoneEvent)
      } catch {
        callbacks.onError?.('마케팅 생성 결과를 해석하지 못했습니다.')
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
    fetchExportMarketingContentHtml,
    fetchMarketingContents,
    fetchMarketingContent,
    fetchCreateMarketingContent,
    fetchUpdateMarketingContentTitle,
    fetchDeleteMarketingContent,
    fetchUpdateMarketingSchedule,
    fetchUpdateMarketingPublished,
    fetchRefineMarketingVariant,
    fetchUpdateMarketingVariant,
    fetchRestoreMarketingVariant,
    streamMarketingEvents,
  }
}

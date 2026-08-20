import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingFileStore } from '~/composables/marketing/useMarketingFileStore'
import { useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import { projectFiles, toUploadedMarketingFile } from '~/composables/marketing/useMarketingProjectFilesStore'
import { useMarketingHistoryStore } from '~/composables/marketing/useMarketingHistoryStore'
import { useAuth } from '~/composables/com/useAuth'
import type {
  MarketingResult,
  MarketingFormPayload,
  MarketingContentDetail,
  MarketingStoredRequest,
  MarketingStreamProgressEvent,
} from '~/types/marketing'
import {
  preloadMarketingImages,
  resolveMarketingSubmitMode,
  type MarketingGeneratingStep,
} from '~/utils/marketing/marketingUtil'

const {
  fetchMarketingContent,
  fetchCreateMarketingContent,
  fetchRefineMarketingVariant,
  fetchUpdateMarketingVariant,
  fetchRestoreMarketingVariant,
  streamMarketingEvents,
} = useMarketingApi()

const { handleUploadMarketingFile } = useMarketingFileStore()

// ===== 상태 (콘텐츠 생성 / SSE 세션) =====
export const currentContent = ref<MarketingContentDetail | null>(null)
const pendingResult = ref<MarketingResult | null>(null)
const pendingRequest = ref<MarketingStoredRequest | null>(null)
export const isSubmitting = ref(false)
export const isLoadingContent = ref(false)
const refiningType = ref<'TEXT' | 'IMAGE' | null>(null)
const refiningVariantId = ref<number | null>(null)
const refineCompletedAt = ref(0)
const generatingStep = ref<MarketingGeneratingStep>('')

let activeStream: EventSource | null = null
let activeStreamRequestId = 0
let activeStreamIdleTimer: ReturnType<typeof setTimeout> | null = null
let activeStreamTotalTimer: ReturnType<typeof setTimeout> | null = null

const MARKETING_STREAM_TOTAL_MS = 15 * 60 * 1000
const MARKETING_STREAM_IDLE_MS = 3 * 60 * 1000

export const closeMarketingStream = () => {
  activeStream?.close()
  activeStream = null
  if (activeStreamIdleTimer) {
    clearTimeout(activeStreamIdleTimer)
    activeStreamIdleTimer = null
  }
  if (activeStreamTotalTimer) {
    clearTimeout(activeStreamTotalTimer)
    activeStreamTotalTimer = null
  }
}

/** 대기 중이던 생성 결과/요청을 모두 비운다 (신규 진입, 취소, 실패 시 공통 호출) */
export const clearPending = () => {
  closeMarketingStream()
  pendingResult.value = null
  pendingRequest.value = null
  generatingStep.value = ''
}

export const useMarketingGenerationStore = () => {
  const { pagePhase, marketingProjectId, navigateMarketing, selectedAgent } = useMarketingPageState()
  const { handleSelectHistoryList } = useMarketingHistoryStore()
  const { user } = useAuth()

  const displayResult = computed(() => currentContent.value?.result ?? pendingResult.value)
  const displayRequest = computed(() => currentContent.value?.request ?? pendingRequest.value)
  const displayTitle = computed(() => String(currentContent.value?.title ?? displayResult.value?.title ?? '').trim())

  const upsertById = <T extends { id: number }>(list: T[], item: T) => {
    const next = [...list]
    const index = next.findIndex((entry) => entry.id === item.id)
    if (index >= 0) next[index] = item
    else next.push(item)
    next.sort((a, b) => a.id - b.id)
    return next
  }

  /** SSE progress(variant) → 생성 중 화면에 시안을 즉시 반영 */
  const mergeVariantProgress = (data: MarketingStreamProgressEvent) => {
    if (!pendingResult.value || !data.contentNo) return
    const id = data.contentNo
    const label = String(data.label ?? '').trim()
    const recommended = data.recommended === true
    const prev = pendingResult.value

    if (data.part === 'TEXT') {
      const existing = prev.variants.find((item) => item.id === id)
      pendingResult.value = {
        ...prev,
        variants: upsertById(prev.variants, {
          id,
          label,
          recommended,
          content: data.text ?? '',
          canRestore: existing?.canRestore ?? false,
        }),
      }
      return
    }

    const url = String(data.imageUrl ?? '').trim()
    if (!url) return
    const existing = prev.images.find((item) => item.id === id)
    pendingResult.value = {
      ...prev,
      images: upsertById(prev.images, {
        id,
        url,
        label,
        recommended,
        canRestore: existing?.canRestore ?? false,
      }),
    }
    void preloadMarketingImages([url])
  }

  /** TEXT 모드는 이미지 preload 생략 */
  const preloadResultImages = (result: Pick<MarketingResult, 'mode' | 'images'>) => {
    if (result.mode === 'TEXT') return Promise.resolve()
    return preloadMarketingImages((result.images ?? []).map((item) => item.url))
  }

  const handleSelectContentDetail = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    clearPending()
    currentContent.value = null
    pagePhase.value = 'result'
    isLoadingContent.value = true
    try {
      const detail = await fetchMarketingContent(id)
      currentContent.value = detail
      await navigateMarketing({ contentId: id })
      // 상세는 이미 있으므로 스피너를 내리고, 생성 중이면 아래에서 스트림을 이어받는다
      isLoadingContent.value = false
      // 생성 중(001/002) 콘텐츠를 다시 열면 진행 중인 생성 스트림에 재구독한다.
      if (detail.statusCd === '001' || detail.statusCd === '002') {
        await resumeMarketingGeneration(detail)
      }
    } finally {
      isLoadingContent.value = false
    }
  }

  /** 이탈 후 재진입한 생성 중 콘텐츠를 이어본다 — 결과는 항상 서버 재조회로 확정한다 */
  const resumeMarketingGeneration = async (detail: MarketingContentDetail) => {
    pendingRequest.value = detail.request
    pendingResult.value = detail.result
    generatingStep.value = ''
    isSubmitting.value = true
    try {
      await awaitMarketingResult(detail.contentId)
      const refreshed = await fetchMarketingContent(detail.contentId)
      await preloadResultImages(refreshed.result)
      currentContent.value = refreshed
      await handleSelectHistoryList()
    } catch {
      openToast({ message: '콘텐츠 생성 결과를 불러오지 못했습니다. 다시 시도해 주세요.', type: 'error' })
      try {
        currentContent.value = await fetchMarketingContent(detail.contentId)
      } catch {
        // 재조회도 실패하면 직전에 가져온 detail을 그대로 둔다
      }
    } finally {
      clearPending()
      isSubmitting.value = false
    }
  }

  const handleOpenHistory = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    try {
      await handleSelectContentDetail(id)
    } catch {
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
      pagePhase.value = 'list'
    }
  }

  /** 생성 SSE 구독 — done이면 결과, error·타임아웃이면 reject */
  const awaitMarketingResult = (contentId: string) => {
    closeMarketingStream()
    const requestId = ++activeStreamRequestId
    return new Promise<MarketingResult>((resolve, reject) => {
      const settle = (fn: () => void) => {
        if (requestId !== activeStreamRequestId) return
        closeMarketingStream()
        fn()
      }
      const resetIdleTimer = () => {
        if (activeStreamIdleTimer) clearTimeout(activeStreamIdleTimer)
        activeStreamIdleTimer = setTimeout(() => {
          settle(() => reject(new Error('마케팅 생성 응답 시간이 초과되었습니다.')))
        }, MARKETING_STREAM_IDLE_MS)
      }
      resetIdleTimer()
      activeStreamTotalTimer = setTimeout(() => {
        settle(() => reject(new Error('마케팅 생성 제한 시간이 초과되었습니다.')))
      }, MARKETING_STREAM_TOTAL_MS)

      activeStream = streamMarketingEvents(contentId, {
        onProgress: (data) => {
          if (requestId !== activeStreamRequestId) return
          resetIdleTimer()
          generatingStep.value = data.step
          if (data.step === 'title' && data.title && pendingResult.value) {
            pendingResult.value = { ...pendingResult.value, title: data.title }
          }
          if (data.step === 'variant') mergeVariantProgress(data)
        },
        onDone: (event) => {
          settle(() => {
            if (event.result) resolve(event.result)
            else reject(new Error('마케팅 생성 결과가 비어 있습니다.'))
          })
        },
        onError: (message) => {
          settle(() => reject(new Error(message || '마케팅 생성 이벤트 수신에 실패했습니다.')))
        },
      })
    })
  }

  const handleSubmit = async (payload: MarketingFormPayload) => {
    const agent = selectedAgent.value
    if (!agent || isSubmitting.value) return

    const { referenceFiles, selectedExistingFileIds, ...requestWithoutFiles } = payload
    const mode = resolveMarketingSubmitMode(payload.outputs)
    pendingResult.value = { title: '', mode, variants: [], images: [] }
    pendingRequest.value = { ...requestWithoutFiles, referenceMarketingFileIds: [] }
    generatingStep.value = ''
    currentContent.value = null
    isSubmitting.value = true
    pagePhase.value = 'result'

    try {
      const projectId = marketingProjectId.value
      if (!projectId) throw new Error('마케팅 프로젝트가 없습니다.')

      const uploadedIds: string[] = []
      for (const file of referenceFiles) {
        const res = await handleUploadMarketingFile(file, projectId)
        if (!res || !res.successYn) throw new Error('참고 파일 업로드에 실패했습니다.')
        uploadedIds.push(res.marketingFileId)
        projectFiles.value = [...projectFiles.value, toUploadedMarketingFile(res, file, projectId)]
      }

      // 자료실 저장은 프로젝트 단위, 실제 사용은 이번 콘텐츠에서 고른 파일로 한정한다
      // (기존 파일 중 선택한 것 + 이번에 새로 첨부해 업로드한 것)
      const referenceMarketingFileIds = [...new Set([...selectedExistingFileIds, ...uploadedIds])]
      const storedRequest: MarketingStoredRequest = {
        ...requestWithoutFiles,
        marketingProjectId: projectId,
        referenceMarketingFileIds,
      }
      pendingRequest.value = storedRequest

      const created = await fetchCreateMarketingContent({
        ...storedRequest,
        agentId: agent.agentId,
        marketingProjectId: projectId,
      })
      if (!created?.contentId) {
        throw new Error(created?.returnMsg || '콘텐츠 생성 요청에 실패했습니다.')
      }
      await navigateMarketing({ contentId: created.contentId })

      const result = await awaitMarketingResult(created.contentId)
      await preloadResultImages(result)
      currentContent.value = {
        contentId: created.contentId,
        agentId: agent.agentId,
        marketingProjectId: projectId,
        title: result.title,
        outputMode: result.mode,
        publishScheduledDt: '',
        publishedYn: 'N',
        summaryLabels: [],
        createUserNm: String(user.value?.userNm ?? '').trim() || '-',
        createDt: '',
        request: storedRequest,
        result,
      }
      clearPending()
      await handleSelectHistoryList()
    } catch {
      clearPending()
      currentContent.value = null
      pagePhase.value = 'form'
      openToast({ message: '콘텐츠 생성에 실패했습니다. 다시 시도해 주세요.', type: 'error' })
    } finally {
      isSubmitting.value = false
    }
  }

  const handleEditWithAgent = async (payload: { variantId: number; request: string; type: 'TEXT' | 'IMAGE' }) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return
    const contentId = currentContent.value.contentId
    isSubmitting.value = true
    refiningType.value = payload.type
    refiningVariantId.value = payload.variantId
    try {
      const response = await fetchRefineMarketingVariant(contentId, payload.variantId, {
        request: payload.request,
        type: payload.type,
      })
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '보완 요청에 실패했습니다.', type: 'error' })
        return
      }
      currentContent.value = await fetchMarketingContent(contentId)
      await handleSelectHistoryList()
      refineCompletedAt.value = Date.now()
    } catch {
      openToast({ message: '보완 요청에 실패했습니다.', type: 'error' })
    } finally {
      refiningType.value = null
      refiningVariantId.value = null
      isSubmitting.value = false
    }
  }

  const handleSaveVariantText = async (payload: { variantId: number; textContent: string }) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return false
    const contentId = currentContent.value.contentId
    try {
      const response = await fetchUpdateMarketingVariant(contentId, payload.variantId, {
        textContent: payload.textContent,
      })
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '시안 저장에 실패했습니다.', type: 'error' })
        return false
      }
      currentContent.value = await fetchMarketingContent(contentId)
      openToast({ message: '시안을 저장했습니다.' })
      return true
    } catch {
      openToast({ message: '시안 저장에 실패했습니다.', type: 'error' })
      return false
    }
  }

  const handleRestoreVariant = async (variantId: number) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return false
    const contentId = currentContent.value.contentId
    try {
      const response = await fetchRestoreMarketingVariant(contentId, variantId)
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '되돌리기에 실패했습니다.', type: 'error' })
        return false
      }
      currentContent.value = await fetchMarketingContent(contentId)
      openToast({ message: '직전 버전으로 되돌렸습니다.' })
      return true
    } catch {
      openToast({ message: '되돌리기에 실패했습니다.', type: 'error' })
      return false
    }
  }

  return {
    currentContent,
    isSubmitting,
    isLoadingContent,
    refiningType,
    refiningVariantId,
    refineCompletedAt,
    generatingStep,
    displayResult,
    displayRequest,
    displayTitle,
    handleSelectContentDetail,
    handleOpenHistory,
    handleSubmit,
    handleEditWithAgent,
    handleSaveVariantText,
    handleRestoreVariant,
  }
}

import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import type {
  MarketingAuthoringResult,
  MarketingAuthoringSubmitPayload,
  MarketingAuthoringVariant,
  MarketingAuthoringImageVariant,
  MarketingAgentSummary,
  MarketingContentDetail,
  MarketingContentSummary,
  MarketingOutputMode,
  MarketingStoredRequest,
  MarketingStreamProgressEvent,
} from '~/types/marketing'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import {
  buildMarketingPendingResultFromPayload,
  MARKETING_AGENT_THEME_FALLBACK_HEX,
  preloadMarketingImages,
  resolveMarketingSubmitMode,
  resolveMarketingSummaryLabels,
  type MarketingGeneratingStep,
} from '~/utils/marketing/marketingUtil'
import {
  getDefaultMarketingAuthoringConfig,
  MARKETING_AUTHORING_CONTENT_TYPES,
  parseMarketingAuthoringAgentConfig,
} from '~/utils/agent/marketingAuthoringConfigUtil'

type PagePhase = 'list' | 'form' | 'result'
type MarketingHistoryPeriodValue = '' | '30' | '7' | '3'

export const CONTENT_TYPE_FILTER_CHIPS: { value: string; label: string }[] = [
  { value: '', label: '전체' },
  ...MARKETING_AUTHORING_CONTENT_TYPES.map((item) => ({ value: item.value, label: item.label })),
]

export const MODE_FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'TEXT', label: '문구' },
  { value: 'IMAGE', label: '이미지' },
  { value: 'BOTH', label: '통합' },
] as const

export const resolveMarketingOutputModeLabel = (mode: MarketingOutputMode) =>
  MODE_FILTER_CHIPS.find((chip) => chip.value === mode)?.label ?? '문구'

export const HISTORY_PERIOD_OPTIONS: { value: MarketingHistoryPeriodValue; label: string }[] = [
  { value: '', label: '전체 기간' },
  { value: '3', label: '최근 3일' },
  { value: '7', label: '최근 7일' },
  { value: '30', label: '최근 30일' },
]

const {
  fetchMarketingAgents,
  fetchMarketingContents,
  fetchMarketingContent,
  fetchCreateMarketingContent,
  fetchUpdateMarketingContentTitle,
  fetchDeleteMarketingContent,
  fetchRefineMarketingVariant,
  fetchUpdateMarketingVariant,
  subscribeMarketingEvents,
} = useMarketingApi()

// ===== 상태 =====
const pagePhase = ref<PagePhase>('list')
const agents = ref<MarketingAgentSummary[]>([])
const selectedAgentId = ref('')
const historyList = ref<MarketingContentSummary[]>([])
const currentContent = ref<MarketingContentDetail | null>(null)
const pendingResult = ref<MarketingAuthoringResult | null>(null)
const pendingRequest = ref<MarketingStoredRequest | null>(null)
const isSubmitting = ref(false)
const refiningType = ref<'TEXT' | 'IMAGE' | null>(null)
const refiningVariantId = ref<number | null>(null)
const refineCompletedAt = ref(0)
const generatingStep = ref<MarketingGeneratingStep>('')
const editingContentId = ref('')
const editingTitle = ref('')
const historyTitleInputRef = ref<{ $el?: HTMLElement } | null>(null)
const historySearchKeyword = ref('')
const historyContentTypeFilter = ref('')
const historyModeFilter = ref<'' | MarketingOutputMode>('')
const historyPeriodFilter = ref<MarketingHistoryPeriodValue>('')

let filterTimer: ReturnType<typeof setTimeout> | null = null
let activeStreamClose: (() => void) | null = null
let activeStreamRequestId = 0
let activeStreamIdleTimer: ReturnType<typeof setTimeout> | null = null
let activeStreamTotalTimer: ReturnType<typeof setTimeout> | null = null
let historyListRequestSeq = 0

const MARKETING_STREAM_TOTAL_MS = 15 * 60 * 1000
const MARKETING_STREAM_IDLE_MS = 3 * 60 * 1000

const closeMarketingStream = () => {
  activeStreamClose?.()
  activeStreamClose = null
  if (activeStreamIdleTimer) {
    clearTimeout(activeStreamIdleTimer)
    activeStreamIdleTimer = null
  }
  if (activeStreamTotalTimer) {
    clearTimeout(activeStreamTotalTimer)
    activeStreamTotalTimer = null
  }
}

export const useMarketingStore = () => {
  const route = useRoute()

  const selectedAgent = computed(() => {
    const requestedId = String(route.query.agentId ?? selectedAgentId.value).trim()
    return agents.value.find((agent) => agent.agentId === requestedId) ?? agents.value[0] ?? null
  })
  const config = computed(() => selectedAgent.value?.config ?? null)
  const themeColorHex = computed(() => selectedAgent.value?.colorHex ?? MARKETING_AGENT_THEME_FALLBACK_HEX)
  const displayResult = computed(() => currentContent.value?.result ?? pendingResult.value)
  const displayTitle = computed(() => String(currentContent.value?.title ?? '').trim())
  const displayRequest = computed(() => {
    const request = currentContent.value?.request ?? pendingRequest.value
    if (!request) return null
    return {
      customPurpose: request.customPurpose,
      customAudience: request.customAudience,
      customTone: request.customTone,
      customChannel: request.customChannel,
      customLength: request.customLength,
    }
  })
  const generatingMode = computed<MarketingOutputMode>(
    () =>
      currentContent.value?.outputMode ??
      pendingResult.value?.mode ??
      resolveMarketingSubmitMode(pendingRequest.value?.outputs ?? ['TEXT']),
  )

  const allHistoryItems = computed(() =>
    historyList.value.map((item) => {
      const agentConfig = agents.value.find((agent) => agent.agentId === item.agentId)?.config ?? config.value ?? null
      return {
        contentId: item.contentId,
        mode: item.outputMode,
        displayTitle: item.title,
        metaBadges: resolveMarketingSummaryLabels(item.summaryLabels, agentConfig),
        createDt: formatDateTimeDisplay(item.createDt) || item.createDt || '-',
      }
    }),
  )
  const hasActiveHistoryFilter = computed(
    () =>
      !!historySearchKeyword.value.trim() ||
      !!historyContentTypeFilter.value ||
      !!historyModeFilter.value ||
      !!historyPeriodFilter.value,
  )

  const navigateMarketing = (query: Record<string, string> = {}) => {
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    return navigateTo({ path: '/marketing', query: agentId ? { ...query, agentId } : query }, { replace: true })
  }

  const clearPending = () => {
    closeMarketingStream()
    pendingResult.value = null
    pendingRequest.value = null
    generatingStep.value = ''
  }

  const mergeVariantProgress = (data: MarketingStreamProgressEvent) => {
    if (!pendingResult.value || data.step !== 'variant' || !data.contentNo) return
    const id = data.contentNo
    const label = String(data.label ?? '').trim()
    const recommended = !!data.recommended

    if (data.part === 'TEXT' || data.text !== undefined) {
      const variant: MarketingAuthoringVariant = {
        id,
        label,
        recommended,
        content: data.text ?? '',
      }
      const variants = [...(pendingResult.value.variants ?? [])]
      const index = variants.findIndex((item) => item.id === id)
      if (index >= 0) variants[index] = variant
      else variants.push(variant)
      variants.sort((a, b) => a.id - b.id)
      pendingResult.value = { ...pendingResult.value, variants }
    }

    if (data.part === 'IMAGE' || data.imageUrl) {
      const url = String(data.imageUrl ?? '').trim()
      if (!url) return
      const prev = (pendingResult.value.images ?? []).find((item) => item.id === id)
      const image: MarketingAuthoringImageVariant = {
        id,
        url,
        label: label || String(prev?.label ?? '').trim(),
        recommended: label ? recommended : (prev?.recommended ?? recommended),
      }
      const images = [...(pendingResult.value.images ?? [])]
      const index = images.findIndex((item) => item.id === id)
      if (index >= 0) images[index] = image
      else images.push(image)
      images.sort((a, b) => a.id - b.id)
      pendingResult.value = { ...pendingResult.value, images }
      void preloadMarketingImages([url])
    }
  }

  const handleSelectAgents = async () => {
    const response = await fetchMarketingAgents()
    agents.value = (response.list ?? []).map((agent) => {
      const raw = agent.config as unknown as Record<string, unknown> | null | undefined
      const parsed = parseMarketingAuthoringAgentConfig(raw)
      return {
        ...agent,
        config: parsed ?? getDefaultMarketingAuthoringConfig(),
      }
    })
    if (selectedAgent.value) selectedAgentId.value = selectedAgent.value.agentId
  }

  const handleSelectHistoryList = async () => {
    const seq = ++historyListRequestSeq
    try {
      const response = await fetchMarketingContents({
        keyword: historySearchKeyword.value.trim() || undefined,
        contentType: historyContentTypeFilter.value || undefined,
        outputMode: historyModeFilter.value || undefined,
        periodDays: historyPeriodFilter.value ? Number(historyPeriodFilter.value) : undefined,
        sort: 'MODIFY_DT_DESC',
      })
      if (seq !== historyListRequestSeq) return
      historyList.value = response.list ?? []
    } catch {
      if (seq !== historyListRequestSeq) return
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
    }
  }

  const handleSelectContentDetail = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    clearPending()
    currentContent.value = null
    pagePhase.value = 'result'
    currentContent.value = await fetchMarketingContent(id)
    await navigateMarketing({ contentId: id })
  }

  const handleOpenHistory = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    openLoading({ text: '제작 내역을 불러오는 중...' })
    try {
      await handleSelectContentDetail(id)
    } catch {
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
      pagePhase.value = 'list'
    } finally {
      closeLoading()
    }
  }

  const handleBackToList = async () => {
    clearPending()
    currentContent.value = null
    pagePhase.value = 'list'
    await handleSelectHistoryList()
    await navigateMarketing()
  }

  const handleStartNew = async () => {
    clearPending()
    currentContent.value = null
    pagePhase.value = 'form'
    await navigateMarketing({ new: '1' })
  }

  const handleSubmit = async (payload: MarketingAuthoringSubmitPayload) => {
    const agent = selectedAgent.value
    if (!agent || isSubmitting.value) return

    const { referenceFiles: _referenceFiles, ...requestWithoutFiles } = payload
    const storedRequest: MarketingStoredRequest = { ...requestWithoutFiles, referenceFiles: [] }
    pendingResult.value = buildMarketingPendingResultFromPayload(payload)
    pendingRequest.value = storedRequest
    generatingStep.value = ''
    currentContent.value = null
    isSubmitting.value = true
    pagePhase.value = 'result'

    try {
      const created = await fetchCreateMarketingContent({ ...storedRequest, agentId: agent.agentId })
      await navigateMarketing({ contentId: created.contentId })

      closeMarketingStream()
      const requestId = ++activeStreamRequestId
      const result = await new Promise<MarketingAuthoringResult>((resolve, reject) => {
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

        activeStreamClose = subscribeMarketingEvents(created.contentId, {
          onProgress: (data) => {
            if (requestId !== activeStreamRequestId) return
            resetIdleTimer()
            generatingStep.value = data.step
            if (data.step === 'variant') mergeVariantProgress(data)
          },
          onDone: (event) => {
            settle(() => {
              if (event.result) resolve(event.result)
              else reject(new Error('Empty marketing stream result'))
            })
          },
          onError: (data) => {
            settle(() => reject(new Error(data?.message || '마케팅 생성 이벤트 수신에 실패했습니다.')))
          },
        })
      })

      const mode = result.mode ?? resolveMarketingSubmitMode(payload.outputs)
      if (mode !== 'TEXT') {
        const urls = (result.images ?? []).map((item) => String(item.url ?? '').trim()).filter(Boolean)
        await preloadMarketingImages(urls)
      }
      currentContent.value = {
        contentId: created.contentId,
        agentId: agent.agentId,
        title: result.summary || payload.keyMessage.trim() || '마케팅 콘텐츠',
        outputMode: mode,
        contentType: payload.contentType,
        summaryLabels: [],
        createDt: '',
        modifyDt: '',
        request: storedRequest,
        result: { ...result, mode },
      }
      clearPending()
      await handleSelectHistoryList()
    } catch {
      closeMarketingStream()
      clearPending()
      currentContent.value = null
      pagePhase.value = 'form'
      openToast({ message: '콘텐츠 생성에 실패했습니다. 다시 시도해 주세요.', type: 'error' })
    } finally {
      isSubmitting.value = false
    }
  }

  const handleDeleteHistory = async (contentId: string) => {
    const confirmed = await openConfirm({
      title: '제작 내역 삭제',
      message: '선택한 제작 내역을 삭제할까요?\n삭제 후 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!confirmed) return
    try {
      await fetchDeleteMarketingContent(contentId)
      openToast({ message: '제작 내역이 삭제되었습니다.' })
      await handleSelectHistoryList()
    } catch {
      openToast({ message: '제작 내역 삭제에 실패했습니다.', type: 'error' })
    }
  }

  const handleEditWithAgent = async (payload: {
    variantId: number
    content: string
    request: string
    type: 'TEXT' | 'IMAGE'
  }) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return
    const contentId = currentContent.value.contentId
    isSubmitting.value = true
    refiningType.value = payload.type
    refiningVariantId.value = payload.variantId
    try {
      const response = await fetchRefineMarketingVariant(contentId, payload.variantId, {
        content: payload.content,
        request: payload.request,
        type: payload.type,
      })
      if (response?.successYn === false) {
        openToast({
          message: response.message || '보완 요청에 실패했습니다.',
          type: 'error',
        })
        return
      }
      currentContent.value = await fetchMarketingContent(contentId)
      await handleSelectHistoryList()
      refineCompletedAt.value = Date.now()
    } catch {
      openToast({
        message: '보완 요청에 실패했습니다.',
        type: 'error',
      })
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
        openToast({ message: response.message || '시안 저장에 실패했습니다.', type: 'error' })
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

  const handleCancelHistoryTitle = () => {
    editingContentId.value = ''
    editingTitle.value = ''
  }

  const isEditingHistory = (contentId: string) => editingContentId.value === String(contentId)

  const handleHistoryRowClick = (contentId: string) => {
    if (!editingContentId.value) void handleOpenHistory(contentId)
  }

  const focusHistoryTitleInput = async () => {
    await nextTick()
    const root = historyTitleInputRef.value?.$el ?? historyTitleInputRef.value
    const input = root instanceof HTMLElement ? root.querySelector('input') : null
    input?.focus()
    input?.select()
  }

  const handleSaveHistoryTitle = async (contentId: string) => {
    const title = editingTitle.value.trim()
    if (!title) {
      openToast({ message: '제작 내역 이름을 입력해 주세요.', type: 'warning' })
      await focusHistoryTitleInput()
      return
    }
    try {
      await fetchUpdateMarketingContentTitle(contentId, title)
      const item = historyList.value.find((history) => history.contentId === contentId)
      if (item) item.title = title
      handleCancelHistoryTitle()
      openToast({ message: '제작 내역 이름을 저장했습니다.' })
    } catch {
      openToast({ message: '제작 내역 이름 저장에 실패했습니다.', type: 'error' })
      await focusHistoryTitleInput()
    }
  }

  const handleToggleHistoryTitleEdit = async (item: { contentId: string; displayTitle: string }) => {
    if (isEditingHistory(item.contentId)) {
      await handleSaveHistoryTitle(item.contentId)
      return
    }
    editingContentId.value = item.contentId
    editingTitle.value = item.displayTitle
    await focusHistoryTitleInput()
  }

  const handleBootstrap = async () => {
    openLoading({ text: '마케팅 콘텐츠를 불러오는 중...' })
    try {
      await handleSelectAgents()
      const contentId = String(route.query.contentId ?? '').trim()
      if (contentId) await handleSelectContentDetail(contentId)
      else if (String(route.query.new ?? '') === '1') pagePhase.value = 'form'
      else {
        pagePhase.value = 'list'
        await handleSelectHistoryList()
      }
    } finally {
      closeLoading()
    }
  }

  const clearHistoryFilterTimer = () => {
    if (filterTimer) {
      clearTimeout(filterTimer)
      filterTimer = null
    }
  }

  const cleanupMarketingSession = () => {
    clearHistoryFilterTimer()
    closeMarketingStream()
    historyListRequestSeq += 1
  }

  watch([historySearchKeyword, historyContentTypeFilter, historyModeFilter, historyPeriodFilter], () => {
    if (pagePhase.value !== 'list') return
    clearHistoryFilterTimer()
    filterTimer = setTimeout(() => void handleSelectHistoryList(), 250)
  })

  return {
    CONTENT_TYPE_FILTER_CHIPS,
    MODE_FILTER_CHIPS,
    resolveMarketingOutputModeLabel,
    HISTORY_PERIOD_OPTIONS,
    pagePhase,
    selectedAgent,
    config,
    themeColorHex,
    historySearchKeyword,
    historyContentTypeFilter,
    historyModeFilter,
    historyPeriodFilter,
    allHistoryItems,
    hasActiveHistoryFilter,
    editingContentId,
    editingTitle,
    historyTitleInputRef,
    displayResult,
    displayTitle,
    displayRequest,
    isSubmitting,
    refiningType,
    refiningVariantId,
    refineCompletedAt,
    generatingMode,
    generatingStep,
    handleBootstrap,
    cleanupMarketingSession,
    handleBackToList,
    handleStartNew,
    handleDeleteHistory,
    handleSubmit,
    handleEditWithAgent,
    handleSaveVariantText,
    handleHistoryRowClick,
    isEditingHistory,
    handleToggleHistoryTitleEdit,
    handleSaveHistoryTitle,
    handleCancelHistoryTitle,
  }
}

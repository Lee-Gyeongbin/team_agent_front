import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingFileStore } from '~/composables/marketing/useMarketingFileStore'
import {
  marketingProjectStatuses,
  type MarketingAgentSummary,
  type MarketingCalendarEventItem,
  type MarketingCampaignPlanDraft,
  type MarketingChannelBatchItem,
  type MarketingChannelOption,
  type MarketingContentDetail,
  type MarketingContentSummary,
  type MarketingFile,
  type MarketingFilePurposeCd,
  type MarketingFormPayload,
  type MarketingGeneratingStep,
  type MarketingPagePhase,
  type MarketingProject,
  type MarketingProjectListFilter,
  type MarketingProjectMember,
  type MarketingProjectSaveForm,
  type MarketingProjectStatusCd,
  type MarketingPublishType,
  type MarketingResult,
  type MarketingStoredRequest,
  type MarketingStreamProgressEvent,
} from '~/types/marketing'
import {
  MARKETING_AUTHORING_CHANNELS_BY_TYPE,
  getDefaultMarketingAuthoringConfig,
  parseMarketingAuthoringAgentConfig,
} from '~/utils/agent/marketingAuthoringConfigUtil'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import {
  MARKETING_AGENT_THEME_FALLBACK_HEX,
  buildMarketingChannelOptions,
  buildMarketingFormPayloadFromChannelPick,
  preloadMarketingImages,
  resolveMarketingScheduleStatus,
  resolveMarketingSubmitMode,
  resolveMarketingSummaryLabels,
} from '~/utils/marketing/marketingUtil'

const {
  fetchMarketingAgents,
  fetchMarketingProjectList,
  fetchSaveMarketingProject,
  fetchDeleteMarketingProject,
  fetchSelectMarketingProject,
  fetchGenerateMarketingPlan,
  fetchRefineMarketingPlan,
  fetchUpdateMarketingContentTitle,
  fetchSelectMarketingFileList,
  fetchDeleteMarketingFile,
  fetchMarketingContents,
  fetchDeleteMarketingContent,
  fetchUpdateMarketingSchedule,
  fetchUpdateMarketingPublished,
  fetchMarketingContent,
  fetchCreateMarketingContent,
  fetchRefineMarketingVariant,
  fetchUpdateMarketingVariant,
  fetchRestoreMarketingVariant,
  fetchSelectMarketingVariant,
  streamMarketingEvents,
  fetchRunMarketingReview,
  fetchApplyMarketingReviewFix,
  fetchSaveMarketingApproval,
  fetchMarketingCalendarEvents,
} = useMarketingApi()

const { handleUploadMarketingFile } = useMarketingFileStore()

const CHANNEL_CODES = new Set(
  Object.values(MARKETING_AUTHORING_CHANNELS_BY_TYPE).flatMap((options) => options.map((option) => option.value)),
)

const MARKETING_STREAM_TOTAL_MS = 15 * 60 * 1000
const MARKETING_STREAM_IDLE_MS = 3 * 60 * 1000
/** 콘텐츠 생성 참고파일 최대 개수 — 서버 REFERENCE_FILE_MAX와 같다 */
const MARKETING_REFERENCE_FILE_MAX = 5

// ===== 상태 — named export 하지 않는다 (auto-import 충돌 방지, 컨벤션: composable 반환만) =====
const pagePhase = ref<MarketingPagePhase>('list')
const agents = ref<MarketingAgentSummary[]>([])
const selectedAgentId = ref('')
const phaseStack = ref<MarketingPagePhase[]>(['list'])

const marketingProjectList = ref<MarketingProject[]>([])
const isLoadingList = ref(false)
const isListError = ref(false)
const currentProject = ref<MarketingProject | null>(null)
const currentProjectMembers = ref<MarketingProjectMember[]>([])
const projectFiles = ref<MarketingFile[]>([])

const historyList = ref<MarketingContentSummary[]>([])
let historyListRequestSeq = 0

const currentContent = ref<MarketingContentDetail | null>(null)
const pendingResult = ref<MarketingResult | null>(null)
const pendingRequest = ref<MarketingStoredRequest | null>(null)
const isSubmitting = ref(false)
const isLoadingContent = ref(false)
const refiningType = ref<'TEXT' | 'IMAGE' | null>(null)
const refiningVariantId = ref<number | null>(null)
const refineCompletedAt = ref(0)
const generatingStep = ref<MarketingGeneratingStep>('')
const selectedVariantId = computed(() => currentContent.value?.selectedVariantId ?? null)
const isSelectingVariant = ref(false)
const isApplyingFix = ref(false)
const publishingContentIds = new Set<string>()

const channelPicks = ref<MarketingChannelOption[]>([])
const channelBatch = ref<MarketingChannelBatchItem[]>([])
const isGeneratingChannelBatch = ref(false)
const activeBatchContentId = ref('')
const campaignDraft = ref<MarketingCampaignPlanDraft | null>(null)

const reviewResult = computed(() => currentContent.value?.review ?? null)
const isReviewing = ref(false)
const approval = computed(() => currentContent.value?.approval ?? null)
const isApproving = ref(false)
const scheduleSetting = computed(() => currentContent.value?.schedule ?? null)
const isSavingSchedule = ref(false)
const calendarEvents = ref<MarketingCalendarEventItem[]>([])
const isLoadingCalendarEvents = ref(false)

let activeStream: EventSource | null = null
let activeStreamRequestId = 0
let activeStreamIdleTimer: ReturnType<typeof setTimeout> | null = null
let activeStreamTotalTimer: ReturnType<typeof setTimeout> | null = null

const toUploadedMarketingFile = (
  res: { marketingFileId: string; filePath: string; fileName: string },
  file: File,
  projectId: string,
  filePurposeCd: MarketingFilePurposeCd = '001',
): MarketingFile => ({
  marketingFileId: res.marketingFileId,
  marketingProjectId: projectId,
  filePath: res.filePath,
  fileName: res.fileName,
  fileSize: file.size,
  fileType: getChatAttachmentExtension(file.name),
  createDt: '',
  filePurposeCd,
})

const resolveHistoryChannelNm = (
  labels: string[],
  agentConfig: Parameters<typeof resolveMarketingSummaryLabels>[1],
) => {
  const code = labels.find((label) => CHANNEL_CODES.has(label))
  if (!code) return ''
  return resolveMarketingSummaryLabels([code], agentConfig)[0] ?? ''
}

const resolveProjectStatus = (statusCd: MarketingProjectStatusCd) =>
  marketingProjectStatuses.find((item) => item.statusCd === statusCd) as (typeof marketingProjectStatuses)[number]

/** 서버 업무 상태를 표시한다. AI 생성 실패와 발행 실패는 별개다. */
const resolveContentProgress = (item: MarketingContentSummary) => resolveProjectStatus(item.statusCd)

const pushMarketingPhase = (next: MarketingPagePhase) => {
  phaseStack.value.push(next)
  pagePhase.value = next
}

const popMarketingPhase = () => {
  if (phaseStack.value.length > 1) phaseStack.value.pop()
  pagePhase.value = phaseStack.value[phaseStack.value.length - 1] ?? 'list'
}

const resetMarketingPhaseStack = (initial: MarketingPagePhase = 'list') => {
  phaseStack.value = [initial]
  pagePhase.value = initial
}

const closeMarketingStream = () => {
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

const clearPending = () => {
  closeMarketingStream()
  pendingResult.value = null
  pendingRequest.value = null
  generatingStep.value = ''
}

export const useMarketingStore = () => {
  const route = useRoute()

  const marketingProjectId = computed(() => String(route.params.id ?? '').trim())

  const selectedAgent = computed(() => {
    const requestedId = String(route.query.agentId ?? selectedAgentId.value).trim()
    return agents.value.find((agent) => agent.agentId === requestedId) ?? agents.value[0] ?? null
  })
  const config = computed(() => selectedAgent.value?.config ?? null)
  const themeColorHex = computed(() => selectedAgent.value?.colorHex ?? MARKETING_AGENT_THEME_FALLBACK_HEX)

  const navigateMarketing = (query: Record<string, string> = {}) => {
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    const path = marketingProjectId.value ? `/marketing/${marketingProjectId.value}` : '/marketing'
    return navigateTo({ path, query: agentId ? { ...query, agentId } : query }, { replace: true })
  }

  const handleSelectAgents = async () => {
    const response = await fetchMarketingAgents()
    agents.value = (response.list ?? []).map((agent) => ({
      ...agent,
      config:
        parseMarketingAuthoringAgentConfig(agent.config as unknown as Record<string, unknown> | null) ??
        getDefaultMarketingAuthoringConfig(),
    }))
    if (selectedAgent.value) selectedAgentId.value = selectedAgent.value.agentId
  }

  const handleSelectMarketingProjectList = async (filter?: MarketingProjectListFilter) => {
    isLoadingList.value = true
    isListError.value = false
    marketingProjectList.value = []
    try {
      const res = await fetchMarketingProjectList(filter)
      marketingProjectList.value = res?.list ?? []
    } catch {
      isListError.value = true
      openToast({ message: '마케팅 프로젝트 목록을 불러오지 못했습니다.', type: 'error' })
    } finally {
      isLoadingList.value = false
    }
  }

  const handleSaveMarketingProject = async (form: MarketingProjectSaveForm): Promise<string> => {
    const payload: Partial<MarketingProject> = {
      ...(form.marketingProjectId ? { marketingProjectId: form.marketingProjectId } : {}),
      projectNm: form.projectNm,
      orgNm: form.orgNm,
      projectOverview: form.summary,
      dueDt: form.dueDt || undefined,
      ...(form.statusCd ? { statusCd: form.statusCd as MarketingProject['statusCd'] } : {}),
      memberUserIds: form.memberUserIds ?? [],
      approverUserId: form.approverUserId,
    }
    const res = await fetchSaveMarketingProject(payload)
    if (!res.successYn) {
      throw new Error(
        res.returnMsg ||
          (form.marketingProjectId ? '마케팅 프로젝트 수정에 실패했습니다.' : '마케팅 프로젝트 생성에 실패했습니다.'),
      )
    }
    return res.marketingProjectId
  }

  const handleDeleteMarketingProject = async (marketingProjectId: string) => {
    const res = await fetchDeleteMarketingProject(marketingProjectId)
    if (!res.successYn) {
      throw new Error(res.returnMsg || '마케팅 프로젝트 삭제에 실패했습니다.')
    }
    marketingProjectList.value = marketingProjectList.value.filter(
      (project) => project.marketingProjectId !== marketingProjectId,
    )
  }

  const allHistoryItems = computed(() =>
    historyList.value.map((item) => {
      const agentConfig = agents.value.find((agent) => agent.agentId === item.agentId)?.config ?? config.value ?? null
      const scheduleStatus = resolveMarketingScheduleStatus(item.publishScheduledDt, item.publishedYn)
      const progress = resolveContentProgress(item)
      return {
        contentId: item.contentId,
        displayTitle: item.title,
        channelNm: resolveHistoryChannelNm(item.summaryLabels, agentConfig),
        progressKey: progress.statusCd,
        progressLabel: progress.statusNm,
        createUserNm: item.createUserNm || '-',
        createDt: formatDateTimeDisplay(item.createDt) || item.createDt || '-',
        publishScheduledDt: item.publishScheduledDt || '',
        scheduleStatus,
        scheduleLabel: formatDateTimeDisplay(item.publishScheduledDt),
      }
    }),
  )

  const dueSoonHistoryItems = computed(() =>
    allHistoryItems.value.filter((item) => item.scheduleStatus === 'today' || item.scheduleStatus === 'overdue'),
  )

  const handleSelectHistoryList = async () => {
    if (!marketingProjectId.value) {
      historyList.value = []
      return
    }
    const seq = ++historyListRequestSeq
    try {
      const response = await fetchMarketingContents({
        marketingProjectId: marketingProjectId.value,
      })
      if (seq !== historyListRequestSeq) return
      historyList.value = response.list ?? []
    } catch {
      if (seq !== historyListRequestSeq) return
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
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
      const response = await fetchDeleteMarketingContent(contentId)
      if (!response.successYn) throw new Error(response.returnMsg)
      openToast({ message: '제작 내역이 삭제되었습니다.' })
      await handleSelectHistoryList()
    } catch {
      openToast({ message: '제작 내역 삭제에 실패했습니다.', type: 'error' })
    }
  }

  const refreshMarketingContent = async (contentId: string) => {
    const detail = await fetchMarketingContent(contentId)
    if (currentContent.value?.contentId === contentId) currentContent.value = detail
    await handleSelectHistoryList()
    return detail
  }

  const handleTogglePublished = async (contentId: string, publishedYn: 'Y' | 'N') => {
    if (publishingContentIds.has(contentId)) return false
    publishingContentIds.add(contentId)
    try {
      const response = await fetchUpdateMarketingPublished(contentId, { publishedYn })
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(contentId)
      return true
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '발행 상태 변경에 실패했습니다.',
        type: 'error',
      })
      return false
    } finally {
      publishingContentIds.delete(contentId)
    }
  }

  const handleSelectProjectFiles = async (projectId = marketingProjectId.value) => {
    const id = String(projectId).trim()
    if (!id) {
      projectFiles.value = []
      return
    }
    try {
      const response = await fetchSelectMarketingFileList(id)
      projectFiles.value = response.list ?? []
    } catch {
      projectFiles.value = []
      openToast({ message: '참고 파일 목록을 불러오지 못했습니다.', type: 'error' })
    }
  }

  /** 참고 파일 삭제 — 프로젝트 기획서 생성 화면 등에서 이미 올린 파일을 지운다 */
  const handleRemoveProjectFile = async (marketingFileId: string) => {
    const target = projectFiles.value.find((file) => file.marketingFileId === marketingFileId)
    const confirmed = await openConfirm({
      title: '참고 파일 삭제',
      message: `'${target?.fileName ?? '선택한 파일'}'을(를) 삭제할까요?\n삭제 후 복구할 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!confirmed) return

    try {
      const res = await fetchDeleteMarketingFile(marketingFileId)
      if (!res.successYn) throw new Error(res.returnMsg || '마케팅 참고 파일 삭제 실패')
      projectFiles.value = projectFiles.value.filter((file) => file.marketingFileId !== marketingFileId)
      // 참조 콘텐츠의 승인이 해제되므로 상태를 다시 조회한다
      await handleSelectHistoryList()
      openToast({ message: '참고 파일을 삭제했습니다.' })
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '참고 파일 삭제에 실패했습니다.',
        type: 'error',
      })
    }
  }

  /** 기획 참고자료 업로드 — 칸 코드를 저장하고, 성공한 파일만 반환한다 */
  const handleUploadProjectFiles = async (
    files: File[],
    filePurposeCd: MarketingFilePurposeCd,
  ): Promise<{ file: File; saved: MarketingFile }[]> => {
    const id = marketingProjectId.value
    if (!id || files.length === 0) return []
    const uploaded: { file: File; saved: MarketingFile }[] = []
    for (const file of files) {
      try {
        const res = await handleUploadMarketingFile(file, id, filePurposeCd)
        if (!res || !res.successYn) {
          openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
          continue
        }
        const saved = toUploadedMarketingFile(res, file, id, filePurposeCd)
        projectFiles.value = [...projectFiles.value, saved]
        uploaded.push({ file, saved })
      } catch {
        openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
      }
    }
    return uploaded
  }

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

  const mergeVariantProgress = (data: MarketingStreamProgressEvent) => {
    if (!pendingResult.value || !data.variantNo) return
    const id = data.variantNo
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

  const preloadResultImages = (result: Pick<MarketingResult, 'mode' | 'images'>) => {
    if (result.mode === 'TEXT') return Promise.resolve()
    return preloadMarketingImages((result.images ?? []).map((item) => item.url))
  }

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

  const handleRetryGeneration = async () => {
    if (!currentContent.value || currentContent.value.aiStatusCd !== '004' || isSubmitting.value) return
    const contentId = currentContent.value.contentId
    await resumeMarketingGeneration(currentContent.value)
    const aiStatusCd = currentContent.value?.contentId === contentId ? currentContent.value.aiStatusCd : undefined
    if (aiStatusCd) {
      channelBatch.value = channelBatch.value.map((item) =>
        item.contentId === contentId ? { ...item, aiStatusCd } : item,
      )
    }
  }

  const handleSelectContentDetail = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    clearPending()
    currentContent.value = null
    channelBatch.value = []
    activeBatchContentId.value = ''
    resetMarketingPhaseStack('list')
    pushMarketingPhase('channelContent')
    isLoadingContent.value = true
    try {
      const detail = await fetchMarketingContent(id)
      currentContent.value = detail
      await navigateMarketing({ contentId: id })
      isLoadingContent.value = false
      if (detail.aiStatusCd === '001' || detail.aiStatusCd === '002') {
        await resumeMarketingGeneration(detail)
      }
    } finally {
      isLoadingContent.value = false
    }
  }

  const handleOpenHistory = async (contentId: string) => {
    const id = String(contentId).trim()
    if (!id) return
    try {
      await handleSelectContentDetail(id)
    } catch {
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
      resetMarketingPhaseStack('list')
    }
  }

  const handleSubmit = async (payload: MarketingFormPayload) => {
    const agent = selectedAgent.value
    if (!agent || isSubmitting.value) return undefined

    const { referenceFiles, selectedExistingFileIds, ...requestWithoutFiles } = payload
    let createdContentId = ''
    const mode = resolveMarketingSubmitMode(payload.outputs)
    pendingResult.value = { title: '', mode, variants: [], images: [] }
    pendingRequest.value = { ...requestWithoutFiles, referenceMarketingFileIds: [] }
    generatingStep.value = ''
    currentContent.value = null
    isSubmitting.value = true

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
      createdContentId = created.contentId
      const result = await awaitMarketingResult(created.contentId)
      await preloadResultImages(result)
      currentContent.value = await fetchMarketingContent(created.contentId)
      clearPending()
      await handleSelectHistoryList()
      return created.contentId
    } catch {
      clearPending()
      currentContent.value = null
      if (createdContentId) {
        try {
          currentContent.value = await fetchMarketingContent(createdContentId)
        } catch {
          /* 목록에서 다시 조회 */
        }
        await handleSelectHistoryList()
      }
      openToast({
        message: '콘텐츠 생성에 실패했습니다. 제작 내역에서 실패한 부분을 다시 생성할 수 있습니다.',
        type: 'error',
      })
      return createdContentId || undefined
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
      await refreshMarketingContent(contentId)
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

  const handleUseVariant = async (variantId: number) => {
    const contentId = currentContent.value?.contentId
    if (!contentId || selectedVariantId.value === variantId || isSelectingVariant.value || isSubmitting.value) return
    isSelectingVariant.value = true
    try {
      const response = await fetchSelectMarketingVariant(contentId, variantId)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(contentId)
      openToast({ message: '선택 시안을 저장했습니다. 변경된 시안은 다시 검수해 주세요.' })
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '시안 선택에 실패했습니다.',
        type: 'error',
      })
    } finally {
      isSelectingVariant.value = false
    }
  }

  const handleSaveCampaignDraft = (draft: MarketingCampaignPlanDraft) => {
    campaignDraft.value = { ...draft }
  }

  const handleGenerateMarketingPlan = async (input: {
    goal: string
    productNm: string
    requestTxt: string
    targetNm: string
    contentFileIds: string[]
    brandFileIds: string[]
    imageFileIds: string[]
  }) => {
    const marketingProjectIdValue = marketingProjectId.value
    if (!marketingProjectIdValue) return null
    try {
      const response = await fetchGenerateMarketingPlan({
        marketingProjectId: marketingProjectIdValue,
        ...input,
      })
      if (!response.successYn || !response.plan) throw new Error(response.returnMsg)
      campaignDraft.value = response.plan
      return response.plan
    } catch {
      openToast({ message: '기획서 생성에 실패했습니다.', type: 'error' })
      return null
    }
  }

  const handleRefineMarketingPlan = async (message: string) => {
    const marketingProjectIdValue = marketingProjectId.value
    const text = message.trim()
    if (!marketingProjectIdValue || !text) return null
    try {
      const response = await fetchRefineMarketingPlan({
        marketingProjectId: marketingProjectIdValue,
        message: text,
      })
      if (!response.successYn || !response.plan) throw new Error(response.returnMsg)
      campaignDraft.value = response.plan
      return response.plan
    } catch {
      openToast({ message: '기획서 수정에 실패했습니다.', type: 'error' })
      return null
    }
  }

  const handleInitChannelPicks = (draft: MarketingCampaignPlanDraft) => {
    handleSaveCampaignDraft(draft)
    channelPicks.value = buildMarketingChannelOptions(draft.recommendChannels, config.value)
    channelBatch.value = []
    activeBatchContentId.value = ''
  }

  const handleTogglePick = (channelCd: string) => {
    channelPicks.value = channelPicks.value.map((pick) =>
      pick.channelCd === channelCd ? { ...pick, selected: !pick.selected } : pick,
    )
  }

  const handleToggleWithImage = (channelCd: string, isOn: boolean) => {
    channelPicks.value = channelPicks.value.map((pick) =>
      pick.channelCd === channelCd ? { ...pick, withImageYn: isOn ? 'Y' : 'N' } : pick,
    )
  }

  const handleGenerateChannelBatch = async () => {
    const picks = channelPicks.value.filter((pick) => pick.selected)
    const draft = campaignDraft.value
    if (!picks.length || !draft || isGeneratingChannelBatch.value) return
    isGeneratingChannelBatch.value = true
    channelBatch.value = picks.map((pick) => ({
      channelCd: pick.channelCd,
      channelNm: pick.channelNm,
      contentId: '',
      aiStatusCd: '002',
    }))
    pushMarketingPhase('channelResults')

    try {
      for (const [index, pick] of picks.entries()) {
        const payload = buildMarketingFormPayloadFromChannelPick(pick, draft)
        payload.selectedExistingFileIds = projectFiles.value
          .filter((file) => file.filePurposeCd === '001')
          .slice(0, MARKETING_REFERENCE_FILE_MAX)
          .map((file) => file.marketingFileId)
        const contentId = await handleSubmit(payload)
        channelBatch.value = channelBatch.value.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                contentId: contentId ?? '',
                aiStatusCd: contentId ? (currentContent.value?.aiStatusCd ?? '004') : '004',
              }
            : item,
        )
      }
      await handleSelectHistoryList()
    } finally {
      isGeneratingChannelBatch.value = false
    }
  }

  const handleOpenChannelContent = async (contentId: string) => {
    const id = String(contentId ?? '').trim()
    if (!id) return
    currentContent.value = await fetchMarketingContent(id)
    activeBatchContentId.value = id
    pushMarketingPhase('channelContent')
  }

  const handleSwitchChannelTab = async (contentId: string) => {
    const id = String(contentId ?? '').trim()
    if (!id || id === activeBatchContentId.value) return
    currentContent.value = await fetchMarketingContent(id)
    activeBatchContentId.value = id
  }

  const handleRunReview = async (contentId: string) => {
    const id = String(contentId ?? '').trim()
    if (!id || isReviewing.value || isApplyingFix.value) return
    isReviewing.value = true
    try {
      const response = await fetchRunMarketingReview(id)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(id)
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : 'AI 검수에 실패했습니다.',
        type: 'error',
      })
    } finally {
      isReviewing.value = false
    }
  }

  const handleApplyFix = async (issueId: string) => {
    const contentId = reviewResult.value?.contentId
    if (!contentId || isApplyingFix.value || isReviewing.value) return
    isApplyingFix.value = true
    try {
      const response = await fetchApplyMarketingReviewFix(contentId, issueId)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(contentId)
      openToast({ message: 'AI 수정안을 적용했습니다. 다시 검수해 주세요.' })
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '수정안 적용에 실패했습니다.',
        type: 'error',
      })
    } finally {
      isApplyingFix.value = false
    }
  }

  const saveApproval = async (contentId: string, approvedYn: 'Y' | 'N', memo: string) => {
    const id = String(contentId ?? '').trim()
    if (!id || isApproving.value) return false
    isApproving.value = true
    try {
      const response = await fetchSaveMarketingApproval(id, { memo, approvedYn })
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(id)
      return true
    } catch (error) {
      openToast({
        message:
          error instanceof Error && error.message
            ? error.message
            : approvedYn === 'Y'
              ? '승인 처리에 실패했습니다.'
              : '반려 처리에 실패했습니다.',
        type: 'error',
      })
      return false
    } finally {
      isApproving.value = false
    }
  }

  const handleApprove = async (contentId: string, memo: string) => {
    const ok = await saveApproval(contentId, 'Y', memo)
    if (ok) openToast({ message: '콘텐츠를 승인했습니다.' })
    return ok
  }

  const handleReject = async (contentId: string, memo: string) => {
    const ok = await saveApproval(contentId, 'N', memo)
    if (ok) openToast({ message: '콘텐츠를 반려했습니다.' })
    return ok
  }

  const handleSaveSchedule = async (
    contentId: string,
    payload: { publishType: MarketingPublishType; publishScheduledDt: string; alertHour: number },
  ) => {
    const id = String(contentId ?? '').trim()
    if (!id || isSavingSchedule.value) return false
    isSavingSchedule.value = true
    try {
      const response = await fetchUpdateMarketingSchedule(id, payload)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(id)
      return true
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '발행 설정 저장에 실패했습니다.',
        type: 'error',
      })
      return false
    } finally {
      isSavingSchedule.value = false
    }
  }

  const handleSelectCalendarEvents = async () => {
    isLoadingCalendarEvents.value = true
    try {
      const { list } = await fetchMarketingCalendarEvents()
      calendarEvents.value = list ?? []
    } catch {
      openToast({ message: '캘린더 일정을 불러오지 못했습니다.', type: 'error' })
    } finally {
      isLoadingCalendarEvents.value = false
    }
  }

  const handleBackToList = async () => {
    clearPending()
    currentContent.value = null
    channelBatch.value = []
    activeBatchContentId.value = ''
    isLoadingContent.value = false
    resetMarketingPhaseStack('list')
    await handleSelectHistoryList()
    await navigateMarketing()
  }

  const handleBackToProjects = async () => {
    clearPending()
    currentContent.value = null
    isLoadingContent.value = false
    currentProject.value = null
    currentProjectMembers.value = []
    projectFiles.value = []
    campaignDraft.value = null
    resetMarketingPhaseStack('list')
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    await navigateTo({ path: '/marketing', query: agentId ? { agentId } : {} })
  }

  const handleHistoryRowClick = (contentId: string) => {
    void handleOpenHistory(contentId)
  }

  const handleSaveHistoryEdit = async (
    contentId: string,
    payload: {
      title: string
      originalTitle: string
    },
  ) => {
    const title = payload.title.trim()
    if (!title) return false
    if (title === payload.originalTitle.trim()) return true

    try {
      const response = await fetchUpdateMarketingContentTitle(contentId, title)
      if (!response.successYn) throw new Error(response.returnMsg)
      // 이름 변경도 승인을 해제하므로 상태를 다시 조회한다
      if (currentContent.value?.contentId === contentId) await refreshMarketingContent(contentId)
      else await handleSelectHistoryList()
      openToast({ message: '이름을 변경했습니다.' })
      return true
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '이름 변경에 실패했습니다.',
        type: 'error',
      })
      return false
    }
  }

  const handleBootstrap = async () => {
    currentProject.value = null
    currentProjectMembers.value = []
    campaignDraft.value = null
    currentContent.value = null
    historyList.value = []
    projectFiles.value = []
    openLoading({ text: '마케팅 프로젝트를 불러오는 중...' })
    try {
      await handleSelectAgents()
      const projectId = marketingProjectId.value
      if (!projectId) {
        resetMarketingPhaseStack('list')
        return
      }
      const projectRes = await fetchSelectMarketingProject(projectId)
      if (projectRes.successYn) {
        currentProject.value = projectRes.data
        currentProjectMembers.value = projectRes.members ?? []
        campaignDraft.value = projectRes.plan
      }
      if (!currentProject.value) {
        openToast({ message: '마케팅 프로젝트를 찾을 수 없습니다.', type: 'error' })
        await handleBackToProjects()
        return
      }
      await handleSelectProjectFiles(projectId)
      const contentId = String(route.query.contentId ?? '').trim()
      if (contentId) {
        await handleSelectContentDetail(contentId)
      } else {
        resetMarketingPhaseStack('list')
        await handleSelectHistoryList()
      }
    } catch {
      openToast({ message: '마케팅 프로젝트를 불러오지 못했습니다.', type: 'error' })
      await handleBackToProjects()
    } finally {
      closeLoading()
    }
  }

  const cleanupMarketingSession = () => {
    historyListRequestSeq += 1
    closeMarketingStream()
    currentContent.value = null
    currentProject.value = null
    currentProjectMembers.value = []
    projectFiles.value = []
    channelBatch.value = []
    historyList.value = []
    campaignDraft.value = null
  }

  return {
    pagePhase,
    selectedAgent,
    config,
    themeColorHex,
    pushMarketingPhase,
    popMarketingPhase,
    currentProject,
    currentProjectMembers,
    projectFiles,
    allHistoryItems,
    dueSoonHistoryItems,
    handleTogglePublished,
    handleSaveHistoryEdit,
    currentContent,
    displayResult,
    displayTitle,
    displayRequest,
    selectedVariantId,
    isSubmitting,
    isLoadingContent,
    refiningType,
    refiningVariantId,
    refineCompletedAt,
    generatingStep,
    handleSelectAgents,
    marketingProjectList,
    isLoadingList,
    isListError,
    handleSelectMarketingProjectList,
    handleSaveMarketingProject,
    handleDeleteMarketingProject,
    handleBootstrap,
    cleanupMarketingSession,
    handleBackToList,
    handleBackToProjects,
    handleUploadProjectFiles,
    handleRemoveProjectFile,
    handleDeleteHistory,
    handleEditWithAgent,
    handleSaveVariantText,
    handleRestoreVariant,
    handleUseVariant,
    isSelectingVariant,
    isApplyingFix,
    handleRetryGeneration,
    handleHistoryRowClick,
    channelPicks,
    channelBatch,
    isGeneratingChannelBatch,
    activeBatchContentId,
    campaignDraft,
    handleSaveCampaignDraft,
    handleGenerateMarketingPlan,
    handleRefineMarketingPlan,
    handleInitChannelPicks,
    handleTogglePick,
    handleToggleWithImage,
    handleGenerateChannelBatch,
    handleOpenChannelContent,
    handleSwitchChannelTab,
    reviewResult,
    isReviewing,
    handleRunReview,
    handleApplyFix,
    approval,
    isApproving,
    handleApprove,
    handleReject,
    scheduleSetting,
    isSavingSchedule,
    handleSaveSchedule,
    calendarEvents,
    isLoadingCalendarEvents,
    handleSelectCalendarEvents,
  }
}

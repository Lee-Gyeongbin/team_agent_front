import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingFileStore } from '~/composables/marketing/useMarketingFileStore'
import {
  marketingAiStatuses,
  marketingProjectStatuses,
  type MarketingAgentSummary,
  type MarketingCalendarEventItem,
  type MarketingCampaignPlanDraft,
  type MarketingCampaignPlanSection,
  type MarketingChannelBatchItem,
  type MarketingChannelConflict,
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
  buildMarketingChannelOptions,
  buildMarketingFormPayloadFromChannelPick,
  preloadMarketingImages,
  resolveMarketingScheduleStatus,
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
  fetchUpdateMarketingPlan,
  fetchUpdateMarketingContentTitle,
  fetchSelectMarketingFileList,
  fetchDeleteMarketingFile,
  fetchMarketingContents,
  fetchDeleteMarketingContent,
  fetchUpdateMarketingSchedule,
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
  fetchCancelMarketingApproval,
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

const channelPicks = ref<MarketingChannelOption[]>([])
const channelBatch = ref<MarketingChannelBatchItem[]>([])
const isGeneratingChannelBatch = ref(false)
const activeBatchContentId = ref('')
const campaignDraft = ref<MarketingCampaignPlanDraft | null>(null)

const reviewResult = computed(() => currentContent.value?.review ?? null)
const isReviewing = ref(false)
const approval = computed(() => currentContent.value?.approval ?? null)
/**
 * 현재 콘텐츠 수정 잠금 — 서버 MarketingServiceImpl.isEditLocked와 같은 기준.
 * APPROVED: 승인 완료·예약·발행완료 / APPROVAL: 승인 진행 중(검수 판정이 '검토 필요'면 잠그지 않음) / null: 수정 가능
 */
const contentEditLock = computed<'APPROVAL' | 'APPROVED' | null>(() => {
  const statusCd = currentContent.value?.statusCd
  if (statusCd === '004' || statusCd === '005' || statusCd === '006') return 'APPROVED'
  if (statusCd === '003' && reviewResult.value?.verdict !== 'REVIEW') return 'APPROVAL'
  return null
})
const isApproving = ref(false)
const scheduleSetting = computed(() => currentContent.value?.schedule ?? null)
const isSavingSchedule = ref(false)
const calendarEvents = ref<MarketingCalendarEventItem[]>([])
const isLoadingCalendarEvents = ref(false)

let activeStream: EventSource | null = null
let activeStreamRequestId = 0
let activeStreamIdleTimer: ReturnType<typeof setTimeout> | null = null
let activeStreamTotalTimer: ReturnType<typeof setTimeout> | null = null
/** 화면을 나가며 스트림을 닫을 때 기다리던 생성 대기를 '중단'으로 끝낸다 (생성 중 표시가 남지 않게) */
let cancelActiveStreamWait: (() => void) | null = null
const MARKETING_STREAM_CANCELLED = 'MARKETING_STREAM_CANCELLED'
/** 생성 중 콘텐츠가 있는 동안 목록 상태를 주기적으로 다시 읽는다 — 제안서 내보내기 상태 조회(ProposalStepExport.pollStatus)와 같은 방식 */
const MARKETING_HISTORY_POLL_MS = 5000
let historyPollTimer: ReturnType<typeof setInterval> | null = null

const stopHistoryPoll = () => {
  if (historyPollTimer) {
    clearInterval(historyPollTimer)
    historyPollTimer = null
  }
}

const toUploadedMarketingFile = (
  res: { mktFileId: string; filePath: string; fileName: string },
  file: File,
  projectId: string,
  filePurposeCd: MarketingFilePurposeCd = '001',
): MarketingFile => ({
  mktFileId: res.mktFileId,
  mktId: projectId,
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

const resolveAiStatus = (aiStatusCd?: string) => marketingAiStatuses.find((item) => item.aiStatusCd === aiStatusCd)

/** 목록 진행 상태 — AI가 끝나기 전(대기·생성중·실패)은 MK000002, 끝나면 MK000001 */
const resolveContentProgress = (item: MarketingContentSummary) => {
  const aiStatus = resolveAiStatus(item.aiStatusCd)
  if (aiStatus && aiStatus.aiStatusCd !== '003') {
    return { key: item.statusCd, label: aiStatus.aiStatusNm, badgeClass: `ai-status-${aiStatus.aiStatusCd}` }
  }
  const progress = resolveProjectStatus(item.statusCd)
  return { key: progress.statusCd, label: progress.statusNm, badgeClass: `status-${progress.statusCd}` }
}

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

/** 콘텐츠 작성 단계 순서 — 단계 표시에서 이동할 때 뒤로가기가 앞 단계로 가도록 쌓는다 */
const MARKETING_CONTENT_STEPS: MarketingPagePhase[] = ['channelContent', 'review', 'approval', 'schedule']

const moveMarketingContentStep = (target: MarketingPagePhase) => {
  const index = MARKETING_CONTENT_STEPS.indexOf(target)
  if (index < 0) return
  phaseStack.value = ['list', ...MARKETING_CONTENT_STEPS.slice(0, index + 1)]
  pagePhase.value = target
}

const closeMarketingStream = () => {
  const cancelWait = cancelActiveStreamWait
  cancelActiveStreamWait = null
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
  cancelWait?.()
}

const clearPending = () => {
  closeMarketingStream()
  pendingResult.value = null
  pendingRequest.value = null
  generatingStep.value = ''
}

export const useMarketingStore = () => {
  const route = useRoute()
  const { user } = useAuth()

  const mktId = computed(() => String(route.params.id ?? '').trim())

  const selectedAgent = computed(() => {
    const requestedId = String(route.query.agentId ?? selectedAgentId.value).trim()
    return agents.value.find((agent) => agent.agentId === requestedId) ?? agents.value[0] ?? null
  })
  const config = computed(() => selectedAgent.value?.config ?? null)
  /** 현재 콘텐츠 채널명 — 단계 화면 상단 바에 표시. 제작 내역 목록과 같은 규칙 */
  const currentChannelNm = computed(() =>
    currentContent.value ? resolveHistoryChannelNm(currentContent.value.summaryLabels, config.value) : '',
  )
  /** 로그인 사용자가 현재 콘텐츠 프로젝트의 지정 승인자인지 (서버 saveApproval 권한과 같은 기준) */
  const isCurrentApprover = computed(
    () => !!currentContent.value?.approverUserId && currentContent.value.approverUserId === user.value?.userId,
  )

  const navigateMarketing = (query: Record<string, string> = {}) => {
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    const path = mktId.value ? `/marketing/${mktId.value}` : '/marketing'
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
      ...(form.mktId ? { mktId: form.mktId } : {}),
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
        res.returnMsg || (form.mktId ? '마케팅 프로젝트 수정에 실패했습니다.' : '마케팅 프로젝트 생성에 실패했습니다.'),
      )
    }
    return res.mktId
  }

  const handleDeleteMarketingProject = async (mktId: string) => {
    const res = await fetchDeleteMarketingProject(mktId)
    if (!res.successYn) {
      throw new Error(res.returnMsg || '마케팅 프로젝트 삭제에 실패했습니다.')
    }
    marketingProjectList.value = marketingProjectList.value.filter((project) => project.mktId !== mktId)
  }

  const allHistoryItems = computed(() =>
    historyList.value.map((item) => {
      const agentConfig = agents.value.find((agent) => agent.agentId === item.agentId)?.config ?? config.value ?? null
      const scheduleStatus =
        item.statusCd === '005' || item.statusCd === '006'
          ? resolveMarketingScheduleStatus(item.publishScheduledDt, item.publishedYn)
          : 'none'
      const progress = resolveContentProgress(item)
      return {
        mktContentId: item.mktContentId,
        displayTitle: item.title,
        channelNm: resolveHistoryChannelNm(item.summaryLabels, agentConfig),
        progressKey: progress.key,
        progressLabel: progress.label,
        progressBadgeClass: progress.badgeClass,
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

  /** 생성 중(002)인 콘텐츠가 있으면 목록 상태 조회를 켜고, 없으면 끈다 */
  const syncHistoryPoll = () => {
    if (!mktId.value || !historyList.value.some((item) => item.aiStatusCd === '002')) {
      stopHistoryPoll()
      return
    }
    if (historyPollTimer) return
    historyPollTimer = setInterval(() => {
      void handleSelectHistoryList({ silent: true })
    }, MARKETING_HISTORY_POLL_MS)
  }

  /** silent: 주기 조회 — 실패해도 조용히 다음 주기에 다시 읽는다 */
  const handleSelectHistoryList = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!mktId.value) {
      historyList.value = []
      stopHistoryPoll()
      return
    }
    const seq = ++historyListRequestSeq
    try {
      const response = await fetchMarketingContents({
        mktId: mktId.value,
      })
      if (seq !== historyListRequestSeq) return
      const prevGenerating = historyList.value.filter((item) => item.aiStatusCd === '002')
      historyList.value = response.list ?? []
      // 화면을 나가 있어도 생성이 끝나면 알린다
      prevGenerating.forEach((prev) => {
        const next = historyList.value.find((item) => item.mktContentId === prev.mktContentId)
        if (!next || next.aiStatusCd === '002') return
        const channelNm = resolveHistoryChannelNm(next.summaryLabels, config.value)
        const target = channelNm ? `${channelNm} 채널 콘텐츠` : `'${next.title}' 콘텐츠`
        if (next.aiStatusCd === '003') openToast({ message: `${target} 생성이 완료되었습니다.`, type: 'success' })
        if (next.aiStatusCd === '004') openToast({ message: `${target} 생성에 실패했습니다.`, type: 'error' })
      })
      syncHistoryPoll()
    } catch {
      if (seq !== historyListRequestSeq || silent) return
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
    }
  }

  const handleDeleteHistory = async (mktContentId: string) => {
    const confirmed = await openConfirm({
      title: '제작 내역 삭제',
      message: '선택한 제작 내역을 삭제할까요?\n삭제 후 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!confirmed) return
    try {
      const response = await fetchDeleteMarketingContent(mktContentId)
      if (!response.successYn) throw new Error(response.returnMsg)
      openToast({ message: '제작 내역이 삭제되었습니다.' })
      await handleSelectHistoryList()
    } catch {
      openToast({ message: '제작 내역 삭제에 실패했습니다.', type: 'error' })
    }
  }

  const refreshMarketingContent = async (mktContentId: string) => {
    const detail = await fetchMarketingContent(mktContentId)
    if (currentContent.value?.mktContentId === mktContentId) currentContent.value = detail
    await handleSelectHistoryList()
    return detail
  }

  const handleSelectProjectFiles = async (projectId = mktId.value) => {
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
  const handleRemoveProjectFile = async (mktFileId: string) => {
    const target = projectFiles.value.find((file) => file.mktFileId === mktFileId)
    const confirmed = await openConfirm({
      title: '참고 파일 삭제',
      message: `'${target?.fileName ?? '선택한 파일'}'을(를) 삭제할까요?\n삭제 후 복구할 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!confirmed) return

    try {
      const res = await fetchDeleteMarketingFile(mktFileId)
      if (!res.successYn) throw new Error(res.returnMsg || '마케팅 참고 파일 삭제 실패')
      projectFiles.value = projectFiles.value.filter((file) => file.mktFileId !== mktFileId)
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
    const id = mktId.value
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

  const awaitMarketingResult = (mktContentId: string) => {
    closeMarketingStream()
    const requestId = ++activeStreamRequestId
    return new Promise<MarketingResult>((resolve, reject) => {
      const settle = (fn: () => void) => {
        if (requestId !== activeStreamRequestId) return
        cancelActiveStreamWait = null
        closeMarketingStream()
        fn()
      }
      cancelActiveStreamWait = () => reject(new Error(MARKETING_STREAM_CANCELLED))
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

      activeStream = streamMarketingEvents(mktContentId, {
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
      await awaitMarketingResult(detail.mktContentId)
      const refreshed = await fetchMarketingContent(detail.mktContentId)
      await preloadResultImages(refreshed.result)
      currentContent.value = refreshed
      await handleSelectHistoryList()
    } catch (error) {
      // 화면을 나가 대기를 중단한 경우 — 서버 생성은 계속되고 목록 상태 조회가 완료를 반영한다
      if (error instanceof Error && error.message === MARKETING_STREAM_CANCELLED) return
      openToast({ message: '콘텐츠 생성 결과를 불러오지 못했습니다. 다시 시도해 주세요.', type: 'error' })
      try {
        currentContent.value = await fetchMarketingContent(detail.mktContentId)
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
    const mktContentId = currentContent.value.mktContentId
    await resumeMarketingGeneration(currentContent.value)
    const aiStatusCd = currentContent.value?.mktContentId === mktContentId ? currentContent.value.aiStatusCd : undefined
    if (aiStatusCd) {
      channelBatch.value = channelBatch.value.map((item) =>
        item.mktContentId === mktContentId ? { ...item, aiStatusCd } : item,
      )
    }
  }

  const handleSelectContentDetail = async (mktContentId: string) => {
    const id = String(mktContentId).trim()
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
      await navigateMarketing({ mktContentId: id })
      isLoadingContent.value = false
      // 검수 중 콘텐츠는 검수 화면으로 바로 연다. 뒤로가기는 콘텐츠 화면으로 돌아간다
      if (detail.statusCd === '002' && detail.aiStatusCd === '003') {
        pushMarketingPhase('review')
        return
      }
      // 승인 필요 콘텐츠는 지정 승인자에게만 승인 화면으로 연다. 다른 팀원은 콘텐츠 확인 화면에 머문다
      if (detail.statusCd === '003' && isCurrentApprover.value) {
        moveMarketingContentStep('approval')
        return
      }
      if (detail.aiStatusCd === '001' || detail.aiStatusCd === '002') {
        await resumeMarketingGeneration(detail)
      }
    } finally {
      isLoadingContent.value = false
    }
  }

  const handleOpenHistory = async (mktContentId: string) => {
    const id = String(mktContentId).trim()
    if (!id) return
    try {
      await handleSelectContentDetail(id)
    } catch {
      openToast({ message: '제작 내역을 불러오지 못했습니다.', type: 'error' })
      resetMarketingPhaseStack('list')
    }
  }

  const handleEditWithAgent = async (payload: { variantId: number; request: string; type: 'TEXT' | 'IMAGE' }) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return
    const mktContentId = currentContent.value.mktContentId
    isSubmitting.value = true
    refiningType.value = payload.type
    refiningVariantId.value = payload.variantId
    try {
      const response = await fetchRefineMarketingVariant(mktContentId, payload.variantId, {
        request: payload.request,
        type: payload.type,
      })
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '보완 요청에 실패했습니다.', type: 'error' })
        return
      }
      await refreshMarketingContent(mktContentId)
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
    const mktContentId = currentContent.value.mktContentId
    try {
      const response = await fetchUpdateMarketingVariant(mktContentId, payload.variantId, {
        textContent: payload.textContent,
      })
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '시안 저장에 실패했습니다.', type: 'error' })
        return false
      }
      currentContent.value = await fetchMarketingContent(mktContentId)
      openToast({ message: '시안을 저장했습니다.' })
      return true
    } catch {
      openToast({ message: '시안 저장에 실패했습니다.', type: 'error' })
      return false
    }
  }

  const handleRestoreVariant = async (variantId: number) => {
    if (!currentContent.value || isSubmitting.value || refiningType.value) return false
    const mktContentId = currentContent.value.mktContentId
    try {
      const response = await fetchRestoreMarketingVariant(mktContentId, variantId)
      if (!response.successYn) {
        openToast({ message: response.returnMsg || '되돌리기에 실패했습니다.', type: 'error' })
        return false
      }
      currentContent.value = await fetchMarketingContent(mktContentId)
      openToast({ message: '직전 버전으로 되돌렸습니다.' })
      return true
    } catch {
      openToast({ message: '되돌리기에 실패했습니다.', type: 'error' })
      return false
    }
  }

  const handleUseVariant = async (variantId: number) => {
    const mktContentId = currentContent.value?.mktContentId
    if (!mktContentId || selectedVariantId.value === variantId || isSelectingVariant.value || isSubmitting.value) return
    isSelectingVariant.value = true
    try {
      const response = await fetchSelectMarketingVariant(mktContentId, variantId)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(mktContentId)
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
    const marketingProjectIdValue = mktId.value
    if (!marketingProjectIdValue) return null
    try {
      const response = await fetchGenerateMarketingPlan({
        mktId: marketingProjectIdValue,
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
    const marketingProjectIdValue = mktId.value
    const text = message.trim()
    if (!marketingProjectIdValue || !text) return null
    try {
      const response = await fetchRefineMarketingPlan({
        mktId: marketingProjectIdValue,
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

  const handleUpdateMarketingPlan = async (sections: MarketingCampaignPlanSection[]) => {
    const projectId = mktId.value
    if (!projectId) return null
    try {
      const response = await fetchUpdateMarketingPlan({ mktId: projectId, sections })
      if (!response.successYn || !response.plan) throw new Error(response.returnMsg)
      campaignDraft.value = response.plan
      openToast({ message: '기획서를 저장했습니다.' })
      return response.plan
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '기획서 저장에 실패했습니다.',
        type: 'error',
      })
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

  /** 선택 채널 중 이 프로젝트에 이미 콘텐츠가 있는 채널. 예약·발행완료는 덮어쓸 수 없다 */
  const handleSelectChannelConflicts = async (): Promise<MarketingChannelConflict[]> => {
    await handleSelectHistoryList()
    return channelPicks.value.flatMap((pick) => {
      if (!pick.selected) return []
      const existing = historyList.value.find((item) => item.channelCd === pick.channelCd)
      if (!existing) return []
      return {
        channelCd: pick.channelCd,
        channelNm: pick.channelNm,
        isLocked: ['003', '004', '005', '006'].includes(existing.statusCd),
      }
    })
  }

  /** 채널 생성 요청에는 업로드 파일·선택 목록 대신 referenceMarketingFileIds만 보낸다 */
  const toChannelRequest = ({
    referenceFiles: _files,
    selectedExistingFileIds: _ids,
    ...request
  }: MarketingFormPayload) => request

  /** 기존 콘텐츠가 있는 채널은 overwriteChannelCds에 든 채널만 덮어쓰고 나머지는 생성하지 않는다 */
  const handleGenerateChannelBatch = async (
    conflicts: MarketingChannelConflict[] = [],
    overwriteChannelCds: string[] = [],
  ) => {
    const draft = campaignDraft.value
    const agentId = selectedAgent.value?.agentId ?? ''
    const projectId = mktId.value
    const conflictCds = new Set(conflicts.map((item) => item.channelCd))
    const picks = channelPicks.value.filter(
      (pick) => pick.selected && (!conflictCds.has(pick.channelCd) || overwriteChannelCds.includes(pick.channelCd)),
    )
    if (!draft || !agentId || !projectId || isGeneratingChannelBatch.value) return
    if (!picks.length) {
      openToast({ message: '생성할 채널이 없습니다.', type: 'warning' })
      return
    }
    const referenceMarketingFileIds = projectFiles.value
      .filter((file) => file.filePurposeCd === '001')
      .slice(0, MARKETING_REFERENCE_FILE_MAX)
      .map((file) => file.mktFileId)
    isGeneratingChannelBatch.value = true
    channelBatch.value = picks.map((pick) => ({
      channelCd: pick.channelCd,
      channelNm: pick.channelNm,
      mktContentId: '',
      aiStatusCd: '001',
    }))
    pushMarketingPhase('channelResults')

    const updateBatchItem = (channelCd: string, patch: Partial<MarketingChannelBatchItem>) => {
      channelBatch.value = channelBatch.value.map((item) =>
        item.channelCd === channelCd ? { ...item, ...patch } : item,
      )
    }

    try {
      for (const pick of picks) {
        const request = toChannelRequest(buildMarketingFormPayloadFromChannelPick(pick, draft))
        updateBatchItem(pick.channelCd, { aiStatusCd: '002' })
        try {
          const created = await fetchCreateMarketingContent({
            ...request,
            referenceMarketingFileIds,
            agentId,
            mktId: projectId,
            overwriteYn: conflictCds.has(pick.channelCd) ? 'Y' : 'N',
          })
          const createdId = created?.mktContentId
          if (!createdId) throw new Error(created?.returnMsg || '콘텐츠 생성 요청에 실패했습니다.')
          updateBatchItem(pick.channelCd, { mktContentId: createdId })
          // 화면을 나가도 끝까지 진행하도록 전역 스트림·현재 콘텐츠와 분리된 스트림으로 기다린다
          const isDone = await new Promise<boolean>((resolve) => {
            streamMarketingEvents(createdId, {
              onDone: () => resolve(true),
              onError: () => resolve(false),
            })
          })
          updateBatchItem(pick.channelCd, { aiStatusCd: isDone ? '003' : '004' })
        } catch (error) {
          updateBatchItem(pick.channelCd, { aiStatusCd: '004' })
          openToast({
            message: error instanceof Error && error.message ? error.message : '콘텐츠 생성에 실패했습니다.',
            type: 'error',
          })
        }
        // 다른 프로젝트로 이동했으면 목록을 갱신하지 않는다
        if (mktId.value === projectId) await handleSelectHistoryList()
      }
    } finally {
      isGeneratingChannelBatch.value = false
    }
  }

  const handleOpenChannelContent = async (mktContentId: string) => {
    const id = String(mktContentId ?? '').trim()
    if (!id) return
    currentContent.value = await fetchMarketingContent(id)
    activeBatchContentId.value = id
    pushMarketingPhase('channelContent')
  }

  const handleSwitchChannelTab = async (mktContentId: string) => {
    const id = String(mktContentId ?? '').trim()
    if (!id || id === activeBatchContentId.value) return
    currentContent.value = await fetchMarketingContent(id)
    activeBatchContentId.value = id
  }

  const handleRunReview = async (mktContentId: string) => {
    const id = String(mktContentId ?? '').trim()
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
    const mktContentId = reviewResult.value?.mktContentId
    if (!mktContentId || isApplyingFix.value || isReviewing.value) return
    isApplyingFix.value = true
    try {
      const response = await fetchApplyMarketingReviewFix(mktContentId, issueId)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(mktContentId)
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

  const saveApproval = async (mktContentId: string, approvedYn: 'Y' | 'N', memo: string) => {
    const id = String(mktContentId ?? '').trim()
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

  const handleApprove = async (mktContentId: string, memo: string) => {
    const ok = await saveApproval(mktContentId, 'Y', memo)
    if (ok) openToast({ message: '콘텐츠를 승인했습니다.' })
    return ok
  }

  const handleCancelApproval = async (mktContentId: string) => {
    const id = String(mktContentId ?? '').trim()
    if (!id || isApproving.value) return false
    isApproving.value = true
    try {
      const response = await fetchCancelMarketingApproval(id)
      if (!response.successYn) throw new Error(response.returnMsg)
      await refreshMarketingContent(id)
      openToast({ message: '승인을 취소했습니다. 콘텐츠가 검수 중으로 돌아갔습니다.' })
      return true
    } catch (error) {
      openToast({
        message: error instanceof Error && error.message ? error.message : '승인 취소에 실패했습니다.',
        type: 'error',
      })
      return false
    } finally {
      isApproving.value = false
    }
  }

  const handleReject = async (mktContentId: string, memo: string) => {
    const ok = await saveApproval(mktContentId, 'N', memo)
    if (ok) openToast({ message: '콘텐츠를 반려했습니다.' })
    return ok
  }

  const handleSaveSchedule = async (
    mktContentId: string,
    payload: { publishType: MarketingPublishType; publishScheduledDt: string | null; alertHour: number },
  ) => {
    const id = String(mktContentId ?? '').trim()
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
    stopHistoryPoll()
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

  const handleHistoryRowClick = (mktContentId: string) => {
    void handleOpenHistory(mktContentId)
  }

  const handleSaveHistoryEdit = async (
    mktContentId: string,
    payload: {
      title: string
      originalTitle: string
    },
  ) => {
    const title = payload.title.trim()
    if (!title) return false
    if (title === payload.originalTitle.trim()) return true

    try {
      const response = await fetchUpdateMarketingContentTitle(mktContentId, title)
      if (!response.successYn) throw new Error(response.returnMsg)
      // 변경된 이름을 목록·현재 콘텐츠에 반영한다
      if (currentContent.value?.mktContentId === mktContentId) await refreshMarketingContent(mktContentId)
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
      const projectId = mktId.value
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
      const mktContentId = String(route.query.mktContentId ?? '').trim()
      if (mktContentId) {
        await handleSelectContentDetail(mktContentId)
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
    stopHistoryPoll()
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
    currentChannelNm,
    isCurrentApprover,
    pushMarketingPhase,
    moveMarketingContentStep,
    popMarketingPhase,
    currentProject,
    currentProjectMembers,
    projectFiles,
    allHistoryItems,
    dueSoonHistoryItems,
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
    handleUpdateMarketingPlan,
    handleInitChannelPicks,
    handleTogglePick,
    handleToggleWithImage,
    handleSelectChannelConflicts,
    handleGenerateChannelBatch,
    handleOpenChannelContent,
    handleSwitchChannelTab,
    reviewResult,
    isReviewing,
    handleRunReview,
    handleApplyFix,
    approval,
    contentEditLock,
    isApproving,
    handleApprove,
    handleReject,
    handleCancelApproval,
    scheduleSetting,
    isSavingSchedule,
    handleSaveSchedule,
    calendarEvents,
    isLoadingCalendarEvents,
    handleSelectCalendarEvents,
  }
}

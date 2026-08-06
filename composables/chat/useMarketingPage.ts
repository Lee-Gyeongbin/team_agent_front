import type { Agent } from '~/types/agent'
import type { MarketingAuthoringResult, MarketingAuthoringSubmitPayload } from '~/types/chat'
import {
  registerMarketingRoomSummary,
  resolveMarketingHistoryContentTypeFilterKey,
  resolveMarketingHistoryDisplayTitle,
  resolveMarketingHistoryMetaBadges,
  resolveMarketingHistoryMode,
  resolveMarketingHistoryTitle,
  syncMarketingRoomModeFromMessages,
  syncMarketingRoomModesFromChatRooms,
  syncMarketingRoomSummariesFromChatRooms,
  syncMarketingRoomSummaryFromMessages,
} from '~/composables/chat/useMarketingAuthoring'
import { openToast } from '~/composables/useToast'
import { normalizeChatRoomId } from '~/utils/chat/chatRoomIdUtil'
import {
  buildMarketingPendingResultFromPayload,
  extractMarketingHistoryMetaBadgesFromPrompt,
  isMarketingAuthoringAgent,
  isMarketingAuthoringChatRoom,
  isMarketingImageAnswer,
  MARKETING_AGENT_THEME_FALLBACK_HEX,
  mergeMarketingBothResult,
  parseMarketingAuthoringConfigFromAgent,
  resolveMarketingAuthoringResult,
  resolveMarketingCombinedResultFromMessages,
  resolveMarketingHistoryCreateDt,
  resolveMarketingHistoryModifyDt,
  resolveMarketingImagePendingResult,
  resolveMarketingTextAndImageResultsFromMessages,
} from '~/utils/chat/marketingAuthoringUtil'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import { useMarketingAuthoringAgentActions } from '~/composables/chat/agents/useMarketingAuthoringAgentActions'

type PagePhase = 'list' | 'form' | 'result'
type MarketingHistorySortValue = 'MODIFY_DT_DESC' | 'CREATE_DT_DESC' | 'TITLE_ASC'
type MarketingHistoryPeriodValue = '' | '30' | '7' | '3'

export const CONTENT_TYPE_FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'SNS', label: 'SNS 게시글' },
  { value: 'BLOG', label: '블로그' },
  { value: 'AD_COPY', label: '광고 문구' },
  { value: 'EMAIL', label: '이메일·뉴스레터' },
  { value: 'LANDING_PAGE', label: '랜딩페이지' },
] as const

export const MODE_FILTER_CHIPS = [
  { value: '', label: '전체' },
  { value: 'TEXT', label: '문구' },
  { value: 'IMAGE', label: '이미지' },
  { value: 'BOTH', label: '통합' },
] as const

export const HISTORY_SORT_OPTIONS: { value: MarketingHistorySortValue; label: string }[] = [
  { value: 'MODIFY_DT_DESC', label: '최근 수정순' },
  { value: 'CREATE_DT_DESC', label: '최근 생성순' },
  { value: 'TITLE_ASC', label: '이름순' },
]

export const HISTORY_PERIOD_OPTIONS: { value: MarketingHistoryPeriodValue; label: string }[] = [
  { value: '', label: '전체 기간' },
  { value: '30', label: '최근 30일' },
  { value: '7', label: '최근 7일' },
  { value: '3', label: '최근 3일' },
]

/** 생성일 기준 최근 N일 이내 여부 */
const isHistoryWithinPeriodDays = (dateKey: string, days: number) => {
  if (!dateKey) return false
  const normalized = dateKey.includes('T') ? dateKey : dateKey.replace(' ', 'T')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000
}

export const useMarketingPage = () => {
  const route = useRoute()
  const {
    selectedChatAgentId: selectedAgentId,
    chatIndexAgents: agents,
    isLoadingChatIndexAgents: isLoadingAgents,
    handleSelectChatIndexAgents: loadAgents,
    handleMarketingPageSubmit: submit,
    handleSelectChatLogList: loadHistoryMessages,
  } = useChatStore()
  const { messages, startChatSocket: startGenerationStream, stopChatSocket: stopGenerationStream } = useChatSocket()
  const {
    chatRoom: currentHistory,
    chatRoomList: historyList,
    selectChatRoomList: loadHistoryList,
    selectModelOptions: loadModelOptions,
    resetChatRoom: resetHistory,
    handleSetChatRoom: selectHistory,
    handleDeleteChatRoom: deleteHistory,
    handleRenameChatRoom: renameHistory,
  } = useChatRooms()
  const { fetchSelectChatLogList: fetchHistoryLogs } = useChatApi()
  const { getMarketingRoomMode: getHistoryMode } = useMarketingAuthoring()

  const historySummaryTick = ref(0)
  const pagePhase = ref<PagePhase>('list')
  const isSubmitting = ref(false)
  const isMountedMarketing = ref(true)
  const pendingResult = ref<MarketingAuthoringResult | null>(null)
  const editingRoomId = ref('')
  const editingTitle = ref('')
  const historyTitleInputRef = ref<{ $el?: HTMLElement } | null>(null)
  const historySearchKeyword = ref('')
  const historyContentTypeFilter = ref('')
  const historyModeFilter = ref('')
  const historySort = ref<MarketingHistorySortValue>('MODIFY_DT_DESC')
  const historyPeriodFilter = ref<MarketingHistoryPeriodValue>('')

  const resolveMarketingAgent = (): Agent | null => {
    const queryAgentId = String(route.query.agentId ?? '').trim()
    const preferredId = queryAgentId || String(selectedAgentId.value ?? '').trim()

    if (preferredId) {
      const matched = agents.value.find((item) => item.agentId === preferredId)
      if (matched && isMarketingAuthoringAgent(matched)) return matched
    }

    return agents.value.find((item) => isMarketingAuthoringAgent(item)) ?? null
  }

  const selectedAgent = computed(() => resolveMarketingAgent())
  const config = computed(() =>
    selectedAgent.value ? parseMarketingAuthoringConfigFromAgent(selectedAgent.value) : null,
  )
  const themeColorHex = computed(() => selectedAgent.value?.colorHex ?? MARKETING_AGENT_THEME_FALLBACK_HEX)
  const isPageLoading = computed(() => isLoadingAgents.value)

  const marketingAgentIdSet = computed(
    () => new Set(agents.value.filter((item) => isMarketingAuthoringAgent(item)).map((item) => item.agentId)),
  )

  const allHistoryItems = computed(() => {
    void historySummaryTick.value

    return historyList.value
      .filter((room) => isMarketingAuthoringChatRoom(room, marketingAgentIdSet.value))
      .map((room) => {
        const mode = resolveMarketingHistoryMode(room)
        const rawCreateDt = resolveMarketingHistoryCreateDt(room)
        const rawModifyDt = resolveMarketingHistoryModifyDt(room)
        const createDt = rawCreateDt === '-' ? '-' : formatDateTimeDisplay(rawCreateDt) || rawCreateDt
        const metaBadges = resolveMarketingHistoryMetaBadges(room)
        const summary = metaBadges.join(' · ')
        return {
          roomId: normalizeChatRoomId(room.roomId),
          mode,
          displayTitle: resolveMarketingHistoryDisplayTitle(room),
          metaBadges,
          summary,
          contentTypeKey: resolveMarketingHistoryContentTypeFilterKey(room),
          createDt,
          createSortKey: rawCreateDt === '-' ? '' : rawCreateDt,
          modifySortKey: rawModifyDt === '-' ? '' : rawModifyDt,
          searchText: [resolveMarketingHistoryDisplayTitle(room), summary, createDt].join(' ').toLowerCase(),
        }
      })
  })

  const filteredHistoryItems = computed(() => {
    const keyword = historySearchKeyword.value.trim().toLowerCase()
    let items = allHistoryItems.value

    if (keyword) {
      items = items.filter((item) => item.searchText.includes(keyword))
    }

    if (historyContentTypeFilter.value) {
      items = items.filter((item) => item.contentTypeKey === historyContentTypeFilter.value)
    }

    if (historyModeFilter.value) {
      items = items.filter((item) => item.mode === historyModeFilter.value)
    }

    if (historyPeriodFilter.value) {
      const days = Number(historyPeriodFilter.value)
      items = items.filter((item) => isHistoryWithinPeriodDays(item.createSortKey || item.modifySortKey, days))
    }

    const sorted = [...items]
    if (historySort.value === 'TITLE_ASC') {
      sorted.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle, 'ko'))
    } else if (historySort.value === 'CREATE_DT_DESC') {
      sorted.sort((a, b) => b.createSortKey.localeCompare(a.createSortKey))
    } else {
      sorted.sort((a, b) => b.modifySortKey.localeCompare(a.modifySortKey))
    }

    return sorted
  })

  watch(
    historyList,
    (rooms) => {
      syncMarketingRoomModesFromChatRooms(rooms)
      syncMarketingRoomSummariesFromChatRooms(rooms)
      historySummaryTick.value++
    },
    { immediate: true },
  )

  const prefetchMissingHistoryMetaBadges = async () => {
    const targets = historyList.value
      .filter((room) => isMarketingAuthoringChatRoom(room, marketingAgentIdSet.value))
      .filter((room) => !resolveMarketingHistoryMetaBadges(room).length)
      .slice(0, 30)

    if (!targets.length) return

    await Promise.all(
      targets.map(async (room) => {
        const id = normalizeChatRoomId(room.roomId)
        if (!id) return
        try {
          const res = await fetchHistoryLogs(id)
          const row = (res.list ?? []).find(
            (item) => extractMarketingHistoryMetaBadgesFromPrompt(String(item.qcontent ?? '')).length,
          )
          const badges = extractMarketingHistoryMetaBadgesFromPrompt(String(row?.qcontent ?? ''))
          if (badges.length) registerMarketingRoomSummary(id, badges)
        } catch {
          // 개별 내역 조회 실패는 목록 전체를 막지 않음
        }
      }),
    )

    historySummaryTick.value++
  }

  const onCancelHistoryTitle = () => {
    editingRoomId.value = ''
    editingTitle.value = ''
  }

  watch(pagePhase, (phase) => {
    if (phase !== 'list') onCancelHistoryTitle()
    if (phase === 'list') {
      void prefetchMissingHistoryMetaBadges()
    }
  })

  const answerMessage = computed(() => {
    const answers = messages.value.filter((item) => item.type === 'answer')
    return answers[answers.length - 1] ?? null
  })

  const isImageStreaming = computed(() => {
    const answer = answerMessage.value
    if (!answer || answer.isStreaming !== true) return false
    return isMarketingImageAnswer(answer, messages.value)
  })

  const streamedResult = computed(() => {
    const { textResult, imageResult } = resolveMarketingTextAndImageResultsFromMessages(messages.value)
    const combined = resolveMarketingCombinedResultFromMessages(messages.value)
    const answer = answerMessage.value
    const roomId = normalizeChatRoomId(currentHistory.value.roomId ?? '')
    // 제출 pending 또는 방 모드 캐시가 BOTH면 통합 표시
    const preferBoth = pendingResult.value?.mode === 'BOTH' || getHistoryMode(roomId) === 'BOTH'

    if (!answer) {
      if (preferBoth)
        return (
          mergeMarketingBothResult(
            textResult,
            imageResult,
            pendingResult.value?.conditions,
            pendingResult.value?.imageConditions,
          ) ?? combined
        )
      return combined
    }

    if (answer.isStreaming === true) {
      if (isImageStreaming.value) {
        const imagePending = resolveMarketingImagePendingResult(answer, messages.value) ?? imageResult
        // BOTH: 이미지 생성 중에도 문구 시안 유지 (IMAGE 전용 셸로 덮지 않음)
        if (preferBoth || textResult) {
          return (
            mergeMarketingBothResult(
              textResult,
              imagePending,
              pendingResult.value?.conditions,
              pendingResult.value?.imageConditions,
            ) ??
            pendingResult.value ??
            combined
          )
        }
        return imagePending ?? pendingResult.value ?? combined
      }
      // BOTH 문구 단계
      if (preferBoth) return pendingResult.value
      return combined
    }

    // 완료 — 문구 answer + 이미지 answer 병합
    if (preferBoth || (textResult && imageResult)) {
      return (
        mergeMarketingBothResult(
          textResult,
          imageResult,
          pendingResult.value?.conditions,
          pendingResult.value?.imageConditions,
        ) ?? combined
      )
    }
    return combined ?? resolveMarketingAuthoringResult(answer, messages.value)
  })

  const displayResult = computed(() => streamedResult.value ?? pendingResult.value)

  const isResultLoading = computed(() => {
    if (isSubmitting.value) return true
    const answer = answerMessage.value
    if (!answer) return !!pendingResult.value
    return answer.isStreaming === true
  })

  const isGenerating = computed(() => isResultLoading.value && !displayResult.value)

  const generatingMode = computed<'TEXT' | 'IMAGE' | 'BOTH'>(() => {
    if (pendingResult.value?.mode) return pendingResult.value.mode
    const roomId = normalizeChatRoomId(currentHistory.value.roomId ?? '')
    const roomMode = roomId ? getHistoryMode(roomId) : undefined
    if (roomMode === 'BOTH') return 'BOTH'
    if (isImageStreaming.value) return 'IMAGE'
    return roomMode || 'TEXT'
  })

  const { marketingPreparingPhase } = useMarketingAuthoringAgentActions()
  const generatingPhase = computed(() => marketingPreparingPhase.value)

  const syncSelectedAgent = () => {
    const agent = resolveMarketingAgent()
    if (agent) selectedAgentId.value = agent.agentId
  }

  const navigateMarketing = (query: Record<string, string> = {}) => {
    const agentId = String(route.query.agentId ?? '').trim()
    return navigateTo({ path: '/marketing', query: agentId ? { ...query, agentId } : query }, { replace: true })
  }

  const onBackToList = async () => {
    pendingResult.value = null
    messages.value = []
    resetHistory()
    pagePhase.value = 'list'
    await loadHistoryList({ skipLoading: true })
    await navigateMarketing()
  }

  const onStartNew = async () => {
    pendingResult.value = null
    messages.value = []
    resetHistory()
    pagePhase.value = 'form'
    await navigateMarketing({ new: '1' })
  }

  const onOpenHistory = async (roomId: string) => {
    const id = normalizeChatRoomId(roomId)
    if (!id) return
    pendingResult.value = null
    messages.value = []
    selectHistory(id)
    const roomMeta = historyList.value.find((item) => normalizeChatRoomId(item.roomId) === id)
    if (roomMeta) currentHistory.value = { ...currentHistory.value, ...roomMeta, roomId: id }
    pagePhase.value = 'result'
    await loadHistoryMessages(id, { preserveLocalWhenEmpty: false })
    syncMarketingRoomModeFromMessages(id, messages.value)
    syncMarketingRoomSummaryFromMessages(id, messages.value)
    historySummaryTick.value++
    await navigateMarketing({ roomId: id })
  }

  const onDeleteHistory = (roomId: string) => {
    const room = historyList.value.find((item) => normalizeChatRoomId(item.roomId) === normalizeChatRoomId(roomId))
    if (!room) return
    deleteHistory(room)
  }

  const onSubmit = async (payload: MarketingAuthoringSubmitPayload) => {
    if (!selectedAgent.value) return
    selectedAgentId.value = selectedAgent.value.agentId
    pendingResult.value = buildMarketingPendingResultFromPayload(payload, config.value)
    isSubmitting.value = true
    pagePhase.value = 'result'
    try {
      const sent = await submit(payload)
      if (!sent) {
        pendingResult.value = null
        pagePhase.value = 'form'
        return
      }
      await loadHistoryList({ skipLoading: true })
      const roomId = normalizeChatRoomId(currentHistory.value.roomId)
      if (roomId) {
        await navigateMarketing({ roomId })
      }
    } finally {
      isSubmitting.value = false
    }
  }

  const onReopen = () => {
    void onStartNew()
  }

  const onEditWithAgent = (_payload: { variantId: number; content: string; request: string }) => {
    // TODO: 현재 시안 + 수정 요청으로 Agent 대화 수정 파이프라인 연결
  }

  const isEditingHistory = (roomId: string) => editingRoomId.value === normalizeChatRoomId(roomId)

  const onHistoryRowClick = (roomId: string) => {
    if (editingRoomId.value || isEditingHistory(roomId)) return
    void onOpenHistory(roomId)
  }

  const focusHistoryTitleInput = async () => {
    await nextTick()
    const root = historyTitleInputRef.value?.$el ?? historyTitleInputRef.value
    const input = root instanceof HTMLElement ? root.querySelector('input') : null
    input?.focus()
    input?.select()
  }

  const onSaveHistoryTitle = async (roomId: string) => {
    const id = normalizeChatRoomId(roomId)
    if (!id || editingRoomId.value !== id) return

    const trimmed = editingTitle.value.trim()
    if (!trimmed) {
      openToast({ message: '제작 내역 이름을 입력해주세요.', type: 'warning' })
      await focusHistoryTitleInput()
      return
    }

    const roomMeta = historyList.value.find((item) => normalizeChatRoomId(item.roomId) === id)
    if (!roomMeta) {
      openToast({ message: '이름을 변경할 내역을 찾을 수 없습니다.', type: 'warning' })
      onCancelHistoryTitle()
      return
    }

    const currentTitle = String(roomMeta.roomTitle || roomMeta.title || resolveMarketingHistoryTitle(roomMeta)).trim()
    if (trimmed !== currentTitle) {
      await renameHistory(roomMeta, trimmed)
      if (normalizeChatRoomId(currentHistory.value.roomId) === id) {
        currentHistory.value = {
          ...currentHistory.value,
          title: trimmed,
          roomTitle: trimmed,
        }
      }
      await loadHistoryList({ skipLoading: true })
      openToast({ message: '제작 내역 이름을 변경했습니다.' })
    }

    onCancelHistoryTitle()
  }

  const onToggleHistoryTitleEdit = async (item: { roomId: string; displayTitle: string }) => {
    const id = normalizeChatRoomId(item.roomId)
    if (!id) return

    if (isEditingHistory(id)) {
      await onSaveHistoryTitle(id)
      return
    }

    if (editingRoomId.value) {
      await onSaveHistoryTitle(editingRoomId.value)
    }

    editingRoomId.value = id
    editingTitle.value = item.displayTitle
    await focusHistoryTitleInput()
  }

  const bootstrapPage = async () => {
    syncSelectedAgent()
    const roomId = normalizeChatRoomId(String(route.query.roomId ?? ''))
    const wantNew = String(route.query.new ?? '') === '1'
    if (roomId) {
      await onOpenHistory(roomId)
      return
    }
    if (wantNew) {
      pagePhase.value = 'form'
      return
    }
    pagePhase.value = 'list'
  }

  const bootstrap = async () => {
    pendingResult.value = null
    messages.value = []
    resetHistory()
    await Promise.all([loadAgents(), loadModelOptions(), loadHistoryList({ skipLoading: true })])
    if (!isMountedMarketing.value) return
    startGenerationStream()
    await bootstrapPage()
    if (pagePhase.value === 'list') {
      void prefetchMissingHistoryMetaBadges()
    }
  }

  watch(
    () => [route.query.agentId, agents.value] as const,
    () => {
      syncSelectedAgent()
    },
  )

  watch(streamedResult, (result) => {
    if (result && answerMessage.value && answerMessage.value.isStreaming !== true) {
      pendingResult.value = null
    }
  })

  onMounted(() => {
    void bootstrap()
  })

  onUnmounted(() => {
    isMountedMarketing.value = false
  })

  onBeforeRouteLeave(() => {
    stopGenerationStream()
  })

  return {
    CONTENT_TYPE_FILTER_CHIPS,
    MODE_FILTER_CHIPS,
    HISTORY_SORT_OPTIONS,
    HISTORY_PERIOD_OPTIONS,
    pagePhase,
    isPageLoading,
    selectedAgent,
    config,
    themeColorHex,
    historySearchKeyword,
    historyContentTypeFilter,
    historyModeFilter,
    historySort,
    historyPeriodFilter,
    filteredHistoryItems,
    allHistoryItems,
    editingRoomId,
    editingTitle,
    historyTitleInputRef,
    displayResult,
    isResultLoading,
    isGenerating,
    generatingMode,
    generatingPhase,
    onBackToList,
    onStartNew,
    onDeleteHistory,
    onSubmit,
    onReopen,
    onEditWithAgent,
    onHistoryRowClick,
    isEditingHistory,
    onToggleHistoryTitleEdit,
    onSaveHistoryTitle,
    onCancelHistoryTitle,
  }
}

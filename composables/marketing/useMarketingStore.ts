import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import { useMarketingProjectFilesStore } from '~/composables/marketing/useMarketingProjectFilesStore'
import {
  useMarketingHistoryStore,
  resetHistorySession,
  CONTENT_TYPE_FILTER_CHIPS,
  MODE_FILTER_CHIPS,
  HISTORY_PERIOD_OPTIONS,
  resolveMarketingOutputModeLabel,
} from '~/composables/marketing/useMarketingHistoryStore'
import {
  useMarketingGenerationStore,
  closeMarketingStream,
  clearPending,
} from '~/composables/marketing/useMarketingGenerationStore'
import type { MarketingProject } from '~/types/marketing'

export { CONTENT_TYPE_FILTER_CHIPS, MODE_FILTER_CHIPS, HISTORY_PERIOD_OPTIONS, resolveMarketingOutputModeLabel }

const { fetchSelectMarketingProject, fetchUpdateMarketingContentTitle } = useMarketingApi()

// ===== 상태 (프로젝트 메타) =====
const currentProject = ref<MarketingProject | null>(null)

export const useMarketingStore = () => {
  const route = useRoute()

  const { pagePhase, selectedAgent, config, themeColorHex, marketingProjectId, navigateMarketing, handleSelectAgents } =
    useMarketingPageState()
  const {
    projectFiles,
    handleSelectProjectFiles,
    handleRemoveProjectFile,
    handleRenameProjectFile,
    handleUploadProjectFiles,
  } = useMarketingProjectFilesStore()
  const {
    historyList,
    historySearchKeyword,
    historyContentTypeFilter,
    historyModeFilter,
    historyPeriodFilter,
    allHistoryItems,
    dueSoonHistoryItems,
    hasActiveHistoryFilter,
    handleSelectHistoryList,
    handleDeleteHistory,
    handleUpdateSchedule,
    handleTogglePublished,
  } = useMarketingHistoryStore()
  const {
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
  } = useMarketingGenerationStore()

  const handleBackToList = async () => {
    clearPending()
    currentContent.value = null
    isLoadingContent.value = false
    pagePhase.value = 'list'
    await handleSelectHistoryList()
    await navigateMarketing()
  }

  const handleBackToProjects = async () => {
    clearPending()
    currentContent.value = null
    isLoadingContent.value = false
    currentProject.value = null
    projectFiles.value = []
    pagePhase.value = 'list'
    const agentId = String(route.query.agentId ?? selectedAgent.value?.agentId ?? '').trim()
    await navigateTo({ path: '/marketing', query: agentId ? { agentId } : {} })
  }

  const handleStartNew = async () => {
    clearPending()
    currentContent.value = null
    isLoadingContent.value = false
    pagePhase.value = 'form'
    await navigateMarketing({ new: '1' })
  }

  const handleHistoryRowClick = (contentId: string) => {
    void handleOpenHistory(contentId)
  }

  /** 제작 내역 이름·발행 예정일 일괄 저장 — 변경된 항목만 API 호출 */
  const handleSaveHistoryEdit = async (
    contentId: string,
    payload: {
      title: string
      publishScheduledDt: string | null
      originalTitle: string
      originalPublishScheduledDt: string
    },
  ) => {
    const title = payload.title.trim()
    if (!title) return false

    const titleChanged = title !== payload.originalTitle.trim()
    const nextSchedule = payload.publishScheduledDt?.trim() || null
    const originalSchedule = payload.originalPublishScheduledDt.trim() || null
    const scheduleChanged = nextSchedule !== originalSchedule
    if (!titleChanged && !scheduleChanged) return true

    try {
      if (titleChanged) {
        const response = await fetchUpdateMarketingContentTitle(contentId, title)
        if (!response.successYn) throw new Error(response.returnMsg)
        const item = historyList.value.find((history) => history.contentId === contentId)
        if (item) item.title = title
        if (currentContent.value?.contentId === contentId) currentContent.value.title = title
      }
      if (scheduleChanged) {
        const saved = await handleUpdateSchedule(contentId, nextSchedule)
        if (!saved) {
          openToast({ message: '발행 예정일 저장에 실패했습니다.', type: 'error' })
          return false
        }
      }
      openToast({ message: '제작 내역을 저장했습니다.' })
      return true
    } catch {
      openToast({ message: '제작 내역 저장에 실패했습니다.', type: 'error' })
      return false
    }
  }

  const handleBootstrap = async () => {
    openLoading({ text: '마케팅 프로젝트를 불러오는 중...' })
    try {
      await handleSelectAgents()
      const projectId = marketingProjectId.value
      if (!projectId) {
        pagePhase.value = 'list'
        return
      }
      const projectRes = await fetchSelectMarketingProject(projectId)
      if (projectRes.successYn) {
        currentProject.value = projectRes.data
      }
      if (!currentProject.value) {
        openToast({ message: '마케팅 프로젝트를 찾을 수 없습니다.', type: 'error' })
        await handleBackToProjects()
        return
      }
      await handleSelectProjectFiles(projectId)
      const contentId = String(route.query.contentId ?? '').trim()
      if (contentId) await handleSelectContentDetail(contentId)
      else if (String(route.query.new ?? '') === '1') pagePhase.value = 'form'
      else {
        pagePhase.value = 'list'
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
    resetHistorySession()
    closeMarketingStream()
  }

  return {
    CONTENT_TYPE_FILTER_CHIPS,
    MODE_FILTER_CHIPS,
    resolveMarketingOutputModeLabel,
    HISTORY_PERIOD_OPTIONS,
    pagePhase,
    selectedAgent,
    config,
    themeColorHex,
    currentProject,
    projectFiles,
    historySearchKeyword,
    historyContentTypeFilter,
    historyModeFilter,
    historyPeriodFilter,
    allHistoryItems,
    dueSoonHistoryItems,
    hasActiveHistoryFilter,
    handleTogglePublished,
    handleSaveHistoryEdit,
    currentContent,
    displayResult,
    displayTitle,
    displayRequest,
    isSubmitting,
    isLoadingContent,
    refiningType,
    refiningVariantId,
    refineCompletedAt,
    generatingStep,
    handleSelectAgents,
    handleBootstrap,
    cleanupMarketingSession,
    handleBackToList,
    handleBackToProjects,
    handleUploadProjectFiles,
    handleRemoveProjectFile,
    handleRenameProjectFile,
    handleStartNew,
    handleDeleteHistory,
    handleSubmit,
    handleEditWithAgent,
    handleSaveVariantText,
    handleRestoreVariant,
    handleHistoryRowClick,
  }
}

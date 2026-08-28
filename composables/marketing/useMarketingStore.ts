import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import { useMarketingProjectFilesStore } from '~/composables/marketing/useMarketingProjectFilesStore'
import { useMarketingHistoryStore, resetHistorySession } from '~/composables/marketing/useMarketingHistoryStore'
import {
  useMarketingGenerationStore,
  closeMarketingStream,
  clearPending,
} from '~/composables/marketing/useMarketingGenerationStore'
import type { MarketingProject, MarketingProjectMember } from '~/types/marketing'

const { fetchSelectMarketingProject, fetchUpdateMarketingContentTitle } = useMarketingApi()

// ===== 상태 (프로젝트 메타) =====
const currentProject = ref<MarketingProject | null>(null)
const currentProjectMembers = ref<MarketingProjectMember[]>([])

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
    allHistoryItems,
    dueSoonHistoryItems,
    handleSelectHistoryList,
    handleDeleteHistory,
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
    currentProjectMembers.value = []
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

  /** 콘텐츠 이름 저장 — 변경이 없으면 API를 호출하지 않는다 */
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
      const item = historyList.value.find((history) => history.contentId === contentId)
      if (item) item.title = title
      if (currentContent.value?.contentId === contentId) currentContent.value.title = title
      openToast({ message: '이름을 변경했습니다.' })
      return true
    } catch {
      openToast({ message: '이름 변경에 실패했습니다.', type: 'error' })
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
        currentProjectMembers.value = projectRes.members ?? []
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
    pagePhase,
    selectedAgent,
    config,
    themeColorHex,
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

import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { agents, useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import type { MarketingContentSummary, MarketingOutputMode } from '~/types/marketing'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import { resolveMarketingSummaryLabels } from '~/utils/marketing/marketingUtil'
import { MARKETING_AUTHORING_CONTENT_TYPES } from '~/utils/agent/marketingAuthoringConfigUtil'

type MarketingHistoryPeriodValue = '' | '30' | '7' | '3'

export const CONTENT_TYPE_FILTER_CHIPS: { value: string; label: string }[] = [
  { value: '', label: '콘텐츠 유형' },
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

const { fetchMarketingContents, fetchDeleteMarketingContent } = useMarketingApi()

// ===== 상태 (제작 내역 목록 / 필터) =====
export const historyList = ref<MarketingContentSummary[]>([])
const historySearchKeyword = ref('')
const historyContentTypeFilter = ref('')
const historyModeFilter = ref<'' | MarketingOutputMode>('')
const historyPeriodFilter = ref<MarketingHistoryPeriodValue>('')

let filterTimer: ReturnType<typeof setTimeout> | null = null
let historyListRequestSeq = 0

const clearHistoryFilterTimer = () => {
  if (filterTimer) {
    clearTimeout(filterTimer)
    filterTimer = null
  }
}

/** 페이지 이탈 시 호출 — 진행 중인 디바운스/요청을 무효화한다 */
export const resetHistorySession = () => {
  clearHistoryFilterTimer()
  historyListRequestSeq += 1
}

export const useMarketingHistoryStore = () => {
  const { config, marketingProjectId, pagePhase } = useMarketingPageState()

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

  const handleSelectHistoryList = async () => {
    if (!marketingProjectId.value) {
      historyList.value = []
      return
    }
    const seq = ++historyListRequestSeq
    try {
      const response = await fetchMarketingContents({
        marketingProjectId: marketingProjectId.value || undefined,
        keyword: historySearchKeyword.value.trim() || undefined,
        contentType: historyContentTypeFilter.value || undefined,
        outputMode: historyModeFilter.value || undefined,
        periodDays: historyPeriodFilter.value ? Number(historyPeriodFilter.value) : undefined,
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
      if (response?.successYn === false) throw new Error(response.returnMsg)
      openToast({ message: '제작 내역이 삭제되었습니다.' })
      await handleSelectHistoryList()
    } catch {
      openToast({ message: '제작 내역 삭제에 실패했습니다.', type: 'error' })
    }
  }

  watch([historySearchKeyword, historyContentTypeFilter, historyModeFilter, historyPeriodFilter], () => {
    if (pagePhase.value !== 'list') return
    clearHistoryFilterTimer()
    filterTimer = setTimeout(() => void handleSelectHistoryList(), 250)
  })

  return {
    historyList,
    historySearchKeyword,
    historyContentTypeFilter,
    historyModeFilter,
    historyPeriodFilter,
    allHistoryItems,
    hasActiveHistoryFilter,
    handleSelectHistoryList,
    handleDeleteHistory,
  }
}

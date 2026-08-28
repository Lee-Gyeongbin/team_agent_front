import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { agents, useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import type { MarketingContentSummary } from '~/types/marketing'
import { formatDateTimeDisplay } from '~/utils/global/dateUtil'
import { resolveMarketingSummaryLabels, resolveMarketingScheduleStatus } from '~/utils/marketing/marketingUtil'
import { MARKETING_AUTHORING_CHANNELS_BY_TYPE } from '~/utils/agent/marketingAuthoringConfigUtil'

const CHANNEL_CODES = new Set(
  Object.values(MARKETING_AUTHORING_CHANNELS_BY_TYPE).flatMap((options) => options.map((option) => option.value)),
)

/** summaryLabels 중 채널 코드만 골라 표시 라벨로 바꾼다 */
const resolveHistoryChannelNm = (labels: string[], agentConfig: Parameters<typeof resolveMarketingSummaryLabels>[1]) => {
  const code = labels.find((label) => CHANNEL_CODES.has(label))
  if (!code) return ''
  return resolveMarketingSummaryLabels([code], agentConfig)[0] ?? ''
}

/** 목록에 있는 발행·생성 상태만으로 진행 상태를 만든다. 검수 중은 필드가 없다 */
const resolveContentProgress = (item: MarketingContentSummary, scheduleStatus: string) => {
  if (item.publishedYn === 'Y') return { key: 'done', label: '발행 완료' }
  if (scheduleStatus !== 'none') return { key: 'scheduled', label: '예약됨' }
  if (item.statusCd === '002') return { key: 'generating', label: '생성중' }
  if (item.statusCd === '004') return { key: 'failed', label: '실패' }
  if (item.statusCd === '001') return { key: 'waiting', label: '대기' }
  return { key: 'ready', label: '완료' }
}

const {
  fetchMarketingContents,
  fetchDeleteMarketingContent,
  fetchUpdateMarketingSchedule,
  fetchUpdateMarketingPublished,
} = useMarketingApi()

// ===== 상태 (제작 내역 목록) =====
export const historyList = ref<MarketingContentSummary[]>([])

let historyListRequestSeq = 0

/** 페이지 이탈 시 호출 — 진행 중인 요청을 무효화한다 */
export const resetHistorySession = () => {
  historyListRequestSeq += 1
}

export const useMarketingHistoryStore = () => {
  const { config, marketingProjectId } = useMarketingPageState()

  const allHistoryItems = computed(() =>
    historyList.value.map((item) => {
      const agentConfig = agents.value.find((agent) => agent.agentId === item.agentId)?.config ?? config.value ?? null
      const scheduleStatus = resolveMarketingScheduleStatus(item.publishScheduledDt, item.publishedYn)
      const progress = resolveContentProgress(item, scheduleStatus)
      return {
        contentId: item.contentId,
        mode: item.outputMode,
        displayTitle: item.title,
        metaBadges: resolveMarketingSummaryLabels(item.summaryLabels, agentConfig),
        channelNm: resolveHistoryChannelNm(item.summaryLabels, agentConfig),
        progressKey: progress.key,
        progressLabel: progress.label,
        createUserNm: item.createUserNm || '-',
        createDt: formatDateTimeDisplay(item.createDt) || item.createDt || '-',
        publishScheduledDt: item.publishScheduledDt || '',
        publishedYn: item.publishedYn,
        scheduleStatus,
        scheduleLabel: formatDateTimeDisplay(item.publishScheduledDt),
      }
    }),
  )

  /** 오늘이거나 이미 지난 발행 예정 콘텐츠 — 상단 리마인더 배너용 */
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

  /** 발행 예정일 지정/변경 — 해제하려면 publishScheduledDt에 null */
  const handleUpdateSchedule = async (contentId: string, publishScheduledDt: string | null) => {
    try {
      const response = await fetchUpdateMarketingSchedule(contentId, { publishScheduledDt })
      if (!response.successYn) throw new Error(response.returnMsg)
      await handleSelectHistoryList()
      return true
    } catch {
      return false
    }
  }

  /** 발행 완료 표시/해제 — 리마인더 배지·배너를 끄고 켜는 용도 */
  const handleTogglePublished = async (contentId: string, publishedYn: 'Y' | 'N') => {
    const item = historyList.value.find((history) => history.contentId === contentId)
    const previous = item?.publishedYn ?? 'N'
    if (item) item.publishedYn = publishedYn
    try {
      const response = await fetchUpdateMarketingPublished(contentId, { publishedYn })
      if (!response.successYn) throw new Error(response.returnMsg)
      await handleSelectHistoryList()
      const refreshed = historyList.value.find((history) => history.contentId === contentId)
      // 재조회 결과가 방금 저장한 값과 다르면(읽기 지연 등) 방금 저장한 값으로 맞춘다
      if (refreshed && refreshed.publishedYn !== publishedYn) refreshed.publishedYn = publishedYn
      return true
    } catch {
      if (item) item.publishedYn = previous
      openToast({ message: '발행 상태 변경에 실패했습니다.', type: 'error' })
      return false
    }
  }

  return {
    historyList,
    allHistoryItems,
    dueSoonHistoryItems,
    handleSelectHistoryList,
    handleDeleteHistory,
    handleUpdateSchedule,
    handleTogglePublished,
  }
}

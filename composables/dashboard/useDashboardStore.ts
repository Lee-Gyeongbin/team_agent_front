import { useDashboardApi } from '~/composables/dashboard/useDashboardApi'
import type {
  DashboardNoticeItem,
  DashboardQueryRatio,
  DashboardStatSummary,
  DashboardTokenUsage,
  DashboardVisitorTrend,
} from '~/types/dashboard'

const {
  fetchDashboardStatSummary,
  fetchDashboardQueryRatio,
  fetchDashboardNoticeList,
  fetchDashboardTokenUsage,
  fetchDashboardVisitorTrend,
} = useDashboardApi()

const statSummary = ref<DashboardStatSummary | null>(null)
const queryRatio = ref<DashboardQueryRatio | null>(null)
const noticeList = ref<DashboardNoticeItem[]>([])
const tokenUsage = ref<DashboardTokenUsage | null>(null)
const visitorTrend = ref<DashboardVisitorTrend | null>(null)

/** 상단 통계 카드 */
const handleSelectDashboardStatSummary = async () => {
  try {
    const res = await fetchDashboardStatSummary()
    statSummary.value = res.data ?? null
  } catch {
    openToast({ message: '대시보드 통계 조회에 실패했습니다.', type: 'error' })
  }
}

/** 질의 비율 */
const handleSelectDashboardQueryRatio = async () => {
  try {
    const res = await fetchDashboardQueryRatio()
    queryRatio.value = res.data ?? null
  } catch {
    openToast({ message: '질의 비율 조회에 실패했습니다.', type: 'error' })
  }
}

/** 공지 목록 */
const handleSelectDashboardNoticeList = async () => {
  try {
    const res = await fetchDashboardNoticeList()
    noticeList.value = res.dataList ?? []
  } catch {
    openToast({ message: '공지 목록 조회에 실패했습니다.', type: 'error' })
  }
}

/** 토큰 사용량 */
const handleSelectDashboardTokenUsage = async () => {
  try {
    const res = await fetchDashboardTokenUsage()
    tokenUsage.value = res.data ?? null
  } catch {
    openToast({ message: '토큰 사용량 조회에 실패했습니다.', type: 'error' })
  }
}

/** 사용자 추이 */
const handleSelectDashboardVisitorTrend = async () => {
  try {
    const res = await fetchDashboardVisitorTrend()
    visitorTrend.value = res.data ?? null
  } catch {
    openToast({ message: '사용자 추이 조회에 실패했습니다.', type: 'error' })
  }
}

/** 대시보드 위젯 데이터 일괄 조회 (페이지 진입 시 등) */
const handleSelectDashboardAll = async () => {
  await Promise.all([
    handleSelectDashboardStatSummary(),
    handleSelectDashboardQueryRatio(),
    handleSelectDashboardNoticeList(),
    handleSelectDashboardTokenUsage(),
    handleSelectDashboardVisitorTrend(),
  ])
}

export const useDashboardStore = () => {
  return {
    statSummary,
    queryRatio,
    noticeList,
    tokenUsage,
    visitorTrend,
    handleSelectDashboardStatSummary,
    handleSelectDashboardQueryRatio,
    handleSelectDashboardNoticeList,
    handleSelectDashboardTokenUsage,
    handleSelectDashboardVisitorTrend,
    handleSelectDashboardAll,
  }
}

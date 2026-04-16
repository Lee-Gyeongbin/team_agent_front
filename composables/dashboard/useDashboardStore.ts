import { useDashboardApi } from '~/composables/dashboard/useDashboardApi'
import type {
  DashboardCategoryTrend,
  DashboardNoticeItem,
  DashboardQueryRatio,
  DashboardStatSummary,
  DashboardTokenUsage,
  DashboardVisitorTrend,
} from '~/types/dashboard'
import { calculateChartScale } from '~/utils/chat/visualizationChartUtil'

const {
  fetchDashboardStatSummary,
  fetchDashboardQueryRatio,
  fetchDashboardNoticeList,
  fetchDashboardTokenUsage,
  fetchDashboardVisitorTrend,
  fetchDashboardCategoryTrend,
} = useDashboardApi()

export const CATEGORY_TREND_DEFAULT_DAY_CNT = 1

const statSummary = ref<DashboardStatSummary | null>(null)
const queryRatio = ref<DashboardQueryRatio | null>(null)
const queryRatioChartConfig = computed(() => ({
  items: [
    { name: 'LLM', value: queryRatio.value?.llm },
    { name: 'RAG', value: queryRatio.value?.rag },
    { name: 'TextToSQL', value: queryRatio.value?.textToSql },
  ],
  useSvgDonut: true,
  labelColor: ['#FF9037', '#73BDE7', '#3C69DB'],
  svgConfig: {
    width: 510,
    height: 220,
    centerX: 280,
    centerY: 110,
    radius: 68,
    strokeWidth: 30,
    diagonalLength: 12,
    horizontalLineLength: 80,
    showCenterText: false,
    nameFontSize: 12,
    valueFontSize: 20,
  },
}))
const noticeList = ref<DashboardNoticeItem[]>([])
const mainNotice = ref<DashboardNoticeItem | null>(null)
const subNotices = ref<DashboardNoticeItem[]>([])

const tokenUsage = ref<DashboardTokenUsage[] | null>(null)
const monthlyUsage = ref<number>(0)
const tokenUsageChartConfig = computed(() => {
  const list = tokenUsage.value ?? []
  const barValues = list.map((item) => item.tokenUsage)
  const rateValues = list.map((item) => item.usageRate)
  const scaleY = calculateChartScale(barValues, 0.1, false)
  const scaleY1 = calculateChartScale(rateValues, 0.1, false)

  return {
    categories: list.map((item) => item.ym),
    datasets: [
      {
        label: '토큰 사용량',
        type: 'bar',
        data: barValues,
        colorKey: 'bar.set1',
        colorIndex: 0,
        yAxisID: 'y',
        tooltipValueSuffix: '토큰',
      },
      {
        label: '월한도 대비 사용량(%)',
        type: 'line',
        data: rateValues,
        borderColor: '#22c55e',
        yAxisID: 'y1',
        tooltipValueSuffix: '%',
      },
    ],
    maxValue: scaleY.max,
    maxValue2: scaleY1.max,
    yAxisStepSize: scaleY.stepSize,
    y1AxisStepSize: scaleY1.stepSize,
    showDataLabels: true,
  }
})
const visitorTrend = ref<DashboardVisitorTrend[]>([])
const categoryTrend = ref<DashboardCategoryTrend[]>([])
const categoryTrendLoading = ref<boolean>(false)

const visitorTrendChartConfig = computed(() => {
  const list = visitorTrend.value ?? []
  const values = list.map((item) => item.successCnt)
  const scale = calculateChartScale(values, 0.1, false)

  return {
    categories: list.map((item) => item.statDate),
    datasets: [
      {
        label: '로그인 사용자',
        data: values,
        colorKey: 'line.primary',
        tooltipValueSuffix: '명',
      },
    ],
    minValue: scale.min,
    maxValue: scale.max,
    yAxisStepSize: scale.stepSize,
    scales: {
      y: {
        ticks: {
          callback: (value: number) => `${value.toLocaleString()}`,
        },
      },
    },
  }
})

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
const handleSelectDashboardQueryRatio = async (ym: string) => {
  try {
    const res = await fetchDashboardQueryRatio({ ym })
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
    mainNotice.value = noticeList.value.filter((item) => item.featuredYn === 'Y')[0] ?? null
    subNotices.value = noticeList.value.filter((item) => item.featuredYn === 'N').slice(0, 3) ?? []
  } catch {
    openToast({ message: '공지 목록 조회에 실패했습니다.', type: 'error' })
  }
}

/** 토큰 사용량 */
const handleSelectDashboardTokenUsage = async (ym: string) => {
  try {
    const res = await fetchDashboardTokenUsage({ ym })
    tokenUsage.value = res.dataList ?? null
    monthlyUsage.value = res.dataList?.[res.dataList.length - 1].tokenUsage ?? 0
  } catch {
    openToast({ message: '토큰 사용량 조회에 실패했습니다.', type: 'error' })
  }
}

/** 사용자 추이 */
const handleSelectDashboardVisitorTrend = async () => {
  try {
    const res = await fetchDashboardVisitorTrend()
    visitorTrend.value = res.dataList ?? []
  } catch {
    openToast({ message: '사용자 추이 조회에 실패했습니다.', type: 'error' })
  }
}

/** 사용자 관심 카테고리 */
const handleSelectDashboardCategoryTrend = async (dayCnt: number) => {
  categoryTrendLoading.value = true
  try {
    const res = await fetchDashboardCategoryTrend(dayCnt)
    categoryTrend.value = res.dataList ?? []
  } catch {
    categoryTrend.value = []
    openToast({ message: '카테고리 추이 조회에 실패했습니다.', type: 'error' })
  } finally {
    categoryTrendLoading.value = false
  }
}

/** 대시보드 위젯 데이터 일괄 조회 (페이지 진입 시 등) */
const handleSelectDashboardAll = async () => {
  const now = new Date()
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  await Promise.all([
    handleSelectDashboardStatSummary(),
    handleSelectDashboardQueryRatio(currentYm),
    handleSelectDashboardNoticeList(),
    handleSelectDashboardTokenUsage(currentYm),
    handleSelectDashboardVisitorTrend(),
    handleSelectDashboardCategoryTrend(CATEGORY_TREND_DEFAULT_DAY_CNT),
  ])
}

export const useDashboardStore = () => {
  return {
    statSummary,
    queryRatio,
    queryRatioChartConfig,
    noticeList,
    mainNotice,
    subNotices,
    tokenUsage,
    monthlyUsage,
    tokenUsageChartConfig,
    visitorTrend,
    visitorTrendChartConfig,
    categoryTrend,
    categoryTrendLoading,
    handleSelectDashboardStatSummary,
    handleSelectDashboardQueryRatio,
    handleSelectDashboardNoticeList,
    handleSelectDashboardTokenUsage,
    handleSelectDashboardVisitorTrend,
    handleSelectDashboardCategoryTrend,
    handleSelectDashboardAll,
  }
}

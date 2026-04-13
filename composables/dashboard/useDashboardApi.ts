import { useApi } from '~/composables/com/useApi'
import type {
  DashboardNoticeItem,
  DashboardQueryRatio,
  DashboardStatSummary,
  DashboardTokenUsage,
  DashboardVisitorTrend,
  DashboardKeywordTrend,
} from '~/types/dashboard'

/**
 * 대시보드 API — 엔드포인트는 백엔드 스펙에 맞게 조정
 */
export const useDashboardApi = () => {
  const { get, post } = useApi()

  /** 상단 통계 카드 */
  const fetchDashboardStatSummary = async (): Promise<{ data: DashboardStatSummary }> => {
    return get<{ data: DashboardStatSummary }>('/dashboard/stat-summary.do')
  }

  /** 질의 비율 */
  const fetchDashboardQueryRatio = async (params: { ym: string }): Promise<{ data: DashboardQueryRatio }> => {
    return post<{ data: DashboardQueryRatio }>('/dashboard/query-ratio.do', { ym: params.ym })
  }

  /** 공지 요약 목록 */
  const fetchDashboardNoticeList = async (): Promise<{ dataList: DashboardNoticeItem[] }> => {
    return get<{ dataList: DashboardNoticeItem[] }>('/dashboard/notice-list.do')
  }

  /** 토큰 사용량 (월별 목록) */
  const fetchDashboardTokenUsage = async (params: { ym: string }): Promise<{ dataList: DashboardTokenUsage[] }> => {
    return post<{ dataList: DashboardTokenUsage[] }>('/dashboard/token-usage.do', { ym: params.ym })
  }

  /** 사용자 추이 (기간 조건 필요 시 POST body 객체로 별도 메서드 추가) */
  const fetchDashboardVisitorTrend = async (): Promise<{ dataList: DashboardVisitorTrend[] }> => {
    return get<{ dataList: DashboardVisitorTrend[] }>('/dashboard/visitor-trend.do')
  }

  /** 사용자 관심 키워드 */
  const fetchDashboardKeywordTrend = async (params: {
    dayCnt: number
  }): Promise<{ dataList: DashboardKeywordTrend[] }> => {
    return post<{ dataList: DashboardKeywordTrend[] }>('/dashboard/keyword-trend.do', { dayCnt: params.dayCnt })
  }

  return {
    fetchDashboardStatSummary,
    fetchDashboardQueryRatio,
    fetchDashboardNoticeList,
    fetchDashboardTokenUsage,
    fetchDashboardVisitorTrend,
    fetchDashboardKeywordTrend,
  }
}

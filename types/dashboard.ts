/** 대시보드 상단 통계 카드 (피드백·질의·만족도) */
export interface DashboardStatSummary {
  feedbackCount: string
  todayQueryCount: string
  satisfactionRate: number
  dissatisfactionRate: number
}

/** 질의 비율 차트용 */
export interface DashboardQueryRatio {
  llm: number
  rag: number
  textToSql: number
}

/** 대시보드 공지 미리보기 */
export interface DashboardNoticeItem {
  noticeId: string
  title: string
  featuredYn: 'Y' | 'N'
  crtrId: string
  createDt: string
  modifyDt: string
}

/** 토큰 사용량 차트용 */
export interface DashboardTokenUsage {
  ym: string
  tokenUsage: number
  monOrgLmt: number
  usageRate: number
}

/** 사용자(방문자) 추이 차트용 */
export interface DashboardVisitorTrend {
  statDate: string
  successCnt: number
}

/** 사용자 관심 키워드 */
export interface DashboardKeywordTrend {
  keyword: string
  cnt: number
  dayCnt: number
}

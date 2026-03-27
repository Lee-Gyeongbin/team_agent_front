/** 대시보드 상단 통계 카드 (피드백·질의·만족도) */
export interface DashboardStatSummary {
  feedbackCount: string
  todayQueryCount: string
  satisfactionRate: number
  dissatisfactionRate: number
}

/** 질의 비율 차트용 */
export interface DashboardQueryRatio {
  /** 백엔드 스펙 확정 시 필드명 조정 */
  labels: string[]
  values: number[]
}

/** 대시보드 공지 미리보기(또는 요약 리스트) */
export interface DashboardNoticeItem {
  noticeId: string
  title: string
  writer?: string
  regDt?: string
}

/** 토큰 사용량 차트용 */
export interface DashboardTokenUsage {
  labels: string[]
  values: number[]
}

/** 사용자(방문자) 추이 차트용 */
export interface DashboardVisitorTrend {
  categories: string[]
  series: { label: string; data: number[]; colorKey?: string }[]
  minValue?: number
  maxValue?: number
  yAxisStepSize?: number
}

// ============================================
// 마이 대시보드 타입 정의
// ============================================

/**
 * TextToSQL이 저장한 SQL 쿼리 (TB_CHAT_LOG 기반)
 * - logId: LOG_ID (BIGINT → string으로 직렬화)
 * - sqlTitle: Q_CONTENT (질문 텍스트)
 * - sqlContent: TTSQ (생성된 SQL)
 * - ttsqParam: TTSQ_PARAM (LLM이 추출한 파라미터 스키마 JSON)
 */
export interface DataDashboardSqlItem {
  logId: string
  sqlTitle: string
  sqlContent: string
  ttsqParam: string | null
  agentId?: string
  agentNm?: string
  datamartId?: string
  datamartNm?: string
  createdAt?: string
  /** ttsqParam을 파싱한 검색 조건 변수 (프론트 런타임에서 생성) */
  variables: DataDashboardSqlVariable[]
}

/** LLM이 SQL에서 추출한 검색 조건 변수 */
export interface DataDashboardSqlVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'month' | 'number' | 'select'
  defaultValue?: string
  options?: { label: string; value: string }[]
}

/** 사용자가 배치한 위젯 인스턴스 (TB_USER_DASHBOARD_WIDGET 기반) */
export interface DataDashboardWidget {
  widgetId: string
  logId: string
  sqlTitle: string
  title: string
  vizType: DataDashboardVizType
  vizConfig: DataDashboardVizConfig
  colSpan: 1 | 2
  sortOrd: number
  /** ttsqParam을 파싱한 검색 조건 변수 (프론트 런타임에서 생성) */
  variables: DataDashboardSqlVariable[]
  /** 원본 ttsqParam JSON (백엔드에서 직접 수신) */
  ttsqParam?: string | null
  agentNm?: string
  datamartId?: string
  datamartNm?: string
}

export type DataDashboardVizType = 'bar' | 'line' | 'pie' | 'horizontalBar' | 'table'

/** 시각화 컬럼 매핑 설정 */
export interface DataDashboardVizConfig {
  xAxisKey?: string
  yAxisKeys?: string[]
  labelKey?: string
  valueKey?: string
}

/** SQL 실행 결과 (런타임, 저장 안 함) */
export interface DataDashboardQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
}

/** 위젯별 런타임 상태 (저장 안 함) */
export interface DataDashboardWidgetState {
  filterValues: Record<string, string>
  result: DataDashboardQueryResult | null
  loading: boolean
  error: string | null
}

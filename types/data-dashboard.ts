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
  /** LLM이 추천한 시각화 옵션 JSON 문자열 (TB_CHAT_LOG.CHART_OPTION) — { chart, x, y } */
  chartOption?: string | null
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
  /** 코드 다중 선택 여부 (codeMap 기반으로 enrichedVariables에서 주입) */
  multiple?: boolean
}

/** 위젯 그리드 열 너비 (3열 그리드 기준: 1=1/3, 2=2/3, 3=전체) */
export type DataDashboardColSpan = 1 | 2 | 3

/** 대시보드 그리드 열 수 */
export const DATA_DASHBOARD_GRID_COLUMNS = 3

/** 사용자가 배치한 위젯 인스턴스 (TB_USER_DASHBOARD_WIDGET 기반) */
export interface DataDashboardWidget {
  widgetId: string
  logId: string
  sqlTitle: string
  title: string
  vizType: DataDashboardVizType
  vizConfig: DataDashboardVizConfig
  colSpan: DataDashboardColSpan
  sortOrd: number
  variables: DataDashboardSqlVariable[]
  ttsqParam?: string | null
  /** widgetList 응답 시 TB_CHAT_LOG JOIN으로 함께 내려오는 SQL 본문 (필터 초기값 추출에 사용) */
  sqlContent?: string | null
  agentNm?: string
  datamartId?: string
  datamartNm?: string
}

export type DataDashboardVizType = 'bar' | 'line' | 'pie' | 'horizontalBar' | 'table'

/** 시각화 컬럼 매핑 설정 (파이·막대·라인 공통 — xAxisKey / yAxisKeys) */
export interface DataDashboardVizConfig {
  xAxisKey?: string
  yAxisKeys?: string[]
}

/**
 * datamartId별 컬럼 코드 매핑
 * 구조: COL_ID(대문자) → CODE_VAL → CODE_KOR_NM
 * 예: { REGN_CD: { '01': '본부', '02': '대전' } }
 */
export type ColCodeMap = Record<string, Record<string, string>>

/** SQL 실행 결과 (런타임, 저장 안 함) */
export interface DataDashboardQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
}

/** 레이아웃 저장 데이터 (TB_USER_DASHBOARD_LAYOUT) */
export interface DataDashboardLayout {
  layoutId?: string
  widgetId: string
  sortOrd?: number
  rowPos?: number
  colPos?: number
  colSpan?: DataDashboardColSpan
  rowSpan?: number
  widthPx?: number | null
  heightPx?: number | null
}

/** 위젯별 런타임 상태 (저장 안 함) */
export interface DataDashboardWidgetState {
  filterValues: Record<string, string>
  result: DataDashboardQueryResult | null
  /** SQL 실행 시 datamartId 기준으로 조회한 코드맵 (실행마다 갱신) */
  codeMap?: ColCodeMap
  loading: boolean
  error: string | null
}

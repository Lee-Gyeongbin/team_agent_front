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
  ttsqPeriodParam: string | null
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
  /** ttsqPeriodParam에 포함된 기간 관련 변수 여부 */
  isPeriod?: boolean
}

/** 사용자가 배치한 위젯 인스턴스 (TB_USER_DASHBOARD_WIDGET 기반) */
export interface DataDashboardWidget {
  widgetId: string
  logId: string
  sqlTitle: string
  title: string
  vizType: DataDashboardVizType
  vizConfig: DataDashboardVizConfig
  sortOrd: number
  variables: DataDashboardSqlVariable[]
  ttsqParam?: string | null
  ttsqPeriodParam?: string | null
  /** widgetList 응답 시 TB_CHAT_LOG JOIN으로 함께 내려오는 SQL 본문 (필터 초기값 추출에 사용) */
  sqlContent?: string | null
  /** 마지막 SQL 실행 시 사용한 WHERE 변수값 (TB_USER_DASHBOARD_WIDGET.LAST_TTSQ_PARAMS) */
  lastTtsqParams?: Record<string, string> | null
  /** 마지막 SQL 실행 일시 (TB_USER_DASHBOARD_WIDGET.LAST_EXEC_DT) */
  lastExecDt?: string | null
  agentNm?: string
  datamartId?: string
  datamartNm?: string
}

export type DataDashboardVizType = 'bar' | 'line' | 'pie' | 'horizontalBar' | 'table' | 'combination'

/** 시각화 컬럼 매핑 설정 (파이·막대·라인 공통 — xAxisKey / yAxisKeys) */
export interface DataDashboardVizConfig {
  xAxisKey?: string
  yAxisKeys?: string[]
  /** 콤비네이션(막대+라인 혼합) 전용: 왼쪽 Y축 컬럼 키 */
  leftAxisKey?: string
  /** 콤비네이션 전용: 오른쪽 Y축 컬럼 키 */
  rightAxisKey?: string
  /** 콤비네이션 전용: 왼쪽 Y축 차트 타입 */
  leftChartType?: 'bar' | 'line'
  /** 콤비네이션 전용: 오른쪽 Y축 차트 타입 */
  rightChartType?: 'bar' | 'line'
}

/**
 * datamartId별 컬럼 코드 매핑
 * 구조: COL_ID(대문자) → CODE_VAL → CODE_KOR_NM
 * 예: { REGN_CD: { '01': '본부', '02': '대전' } }
 */
export type ColCodeMap = Record<string, Record<string, string>>

/**
 * datamartId별 컬럼명 한국어 매핑 (TB_DM_COL 기반)
 * 구조: COL_ID(대문자) → COL_KOR_NM
 * 예: { ORD_NO: '주문번호', CUST_NM: '고객명' }
 * 테이블 헤더 한글화에 사용
 */
export type ColNmMap = Record<string, string>

/** SQL 실행 결과 (런타임, 저장 안 함) */
export interface DataDashboardQueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
}

/**
 * GridStack 기반 레이아웃 설정 (TB_USER_DASHBOARD_LAYOUT)
 * - 6열 그리드 기준 x/y/w/h로 위치·크기 관리
 * - isVisible: 위젯 표시 여부 (설정 패널 체크박스로 제어)
 */
export interface DataDashboardLayout {
  layoutId?: string
  widgetId: string
  /** 위젯 이름 (설정 패널 표시용, 백엔드 JOIN으로 함께 내려옴) */
  widgetName?: string
  sortOrd?: number
  /** 열 시작 위치 (0-based, 6열 그리드) */
  x: number
  /** 행 시작 위치 (0-based) */
  y: number
  /** 열 너비 (1~6) */
  w: number
  /** 행 높이 (셀 단위, 1셀 = cellHeight px) */
  h: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  /** 위젯 표시 여부 */
  isVisible: boolean
}

/** 위젯별 런타임 상태 (저장 안 함) */
export interface DataDashboardWidgetState {
  filterValues: Record<string, string>
  result: DataDashboardQueryResult | null
  /** SQL 실행 시 datamartId 기준으로 조회한 코드맵 (TB_DM_COL_CODE, 실행마다 갱신) */
  codeMap?: ColCodeMap
  /** SQL 실행 시 datamartId 기준으로 조회한 컬럼명 한국어 매핑 (TB_DM_COL, 실행마다 갱신) */
  colNmMap?: ColNmMap
  loading: boolean
  error: string | null
}

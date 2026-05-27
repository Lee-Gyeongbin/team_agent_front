import { useApi } from '~/composables/com/useApi'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardLayout,
  DataDashboardQueryResult,
  DataDashboardColSpan,
  ColCodeMap,
} from '~/types/data-dashboard'

export const useDataDashboardApi = () => {
  const { post } = useApi()

  /** 나의 TextToSQL 쿼리 목록 조회 */
  const fetchSqlList = async (): Promise<{ list: DataDashboardSqlItem[] }> => {
    return post<{ list: DataDashboardSqlItem[] }>('/datadashboard/sqlList.do', {})
  }

  /** 나의 위젯 목록 조회 */
  const fetchWidgetList = async (): Promise<{ list: DataDashboardWidget[] }> => {
    return post<{ list: DataDashboardWidget[] }>('/datadashboard/widgetList.do', {})
  }

  /** 위젯 저장/수정 */
  const fetchSaveWidget = async (widget: Partial<DataDashboardWidget>): Promise<{ data: DataDashboardWidget }> => {
    return post<{ data: DataDashboardWidget }>('/datadashboard/widgetSave.do', widget)
  }

  /** 위젯 삭제 */
  const fetchDeleteWidget = async (widgetId: string): Promise<void> => {
    await post('/datadashboard/widgetDelete.do', { widgetId })
  }

  /** 위젯 너비(colSpan)만 저장 — vizType 등 다른 필드 불변 */
  const fetchSaveWidgetColSpan = async (widgetId: string, colSpan: DataDashboardColSpan): Promise<void> => {
    await post('/datadashboard/widgetColSpan.do', { widgetId, colSpan })
  }

  /** 위젯 순서 저장 */
  const fetchSaveWidgetOrder = async (orderList: { widgetId: string; sortOrd: number }[]): Promise<void> => {
    await post('/datadashboard/widgetOrder.do', { orderList })
  }

  /** 레이아웃 목록 조회 */
  const fetchLayoutList = async (): Promise<{ list: DataDashboardLayout[] }> => {
    return post<{ list: DataDashboardLayout[] }>('/datadashboard/layoutList.do', {})
  }

  /** 레이아웃 단건 저장 (heightPx · widthPx 등 개별 속성 업데이트) */
  const fetchSaveLayout = async (layout: DataDashboardLayout): Promise<void> => {
    await post('/datadashboard/layoutSave.do', layout)
  }

  /** 위젯 높이 초기화 (HEIGHT_PX = NULL) */
  const fetchResetLayoutHeight = async (widgetId: string): Promise<void> => {
    await post('/datadashboard/layoutResetHeight.do', { widgetId })
  }

  /** 위젯 가로 너비 초기화 (WIDTH_PX = NULL) */
  const fetchResetLayoutWidth = async (widgetId: string): Promise<void> => {
    await fetchSaveLayout({ widgetId, widthPx: null })
  }

  /** 레이아웃 순서/위치 일괄 저장 (드래그 종료 후 호출) */
  const fetchSaveLayoutOrder = async (
    layoutOrderList: { widgetId: string; sortOrd: number; rowPos: number; colPos: number; colSpan: number }[],
  ): Promise<void> => {
    await post('/datadashboard/layoutOrder.do', { layoutOrderList })
  }

  /**
   * 데이터마트 컬럼 코드 매핑 조회 (tb_dm_col_code)
   * USE_YN = 'Y'인 항목만 반환
   */
  const fetchColCodeMap = async (datamartId: string): Promise<ColCodeMap> => {
    type RawItem = { colId: string; codeVal: string; codeKorNm: string }
    const res = await post<{ list: RawItem[] }>('/datadashboard/colCodeMap.do', { datamartId })
    const map: ColCodeMap = {}
    for (const { colId, codeVal, codeKorNm } of res.list ?? []) {
      const key = colId.toUpperCase()
      if (!map[key]) map[key] = {}
      map[key][codeVal] = codeKorNm
    }
    return map
  }

  /** SQL 실행 */
  const fetchExecuteSql = async (
    logId: string | number,
    params: Record<string, string>,
  ): Promise<{ data: DataDashboardQueryResult; result: string; msg?: string }> => {
    // 쉼표 구분 값은 배열로 변환 → 백엔드가 IN ('v1','v2',...) 으로 바인딩
    const processedParams: Record<string, string | string[]> = {}
    for (const [k, v] of Object.entries(params)) {
      processedParams[k] = v.includes(',')
        ? v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : v
    }
    return post<{ data: DataDashboardQueryResult; result: string; msg?: string }>('/datadashboard/sqlExecute.do', {
      logId,
      sqlParams: JSON.stringify(processedParams),
    })
  }

  return {
    fetchSqlList,
    fetchWidgetList,
    fetchSaveWidget,
    fetchDeleteWidget,
    fetchSaveWidgetColSpan,
    fetchSaveWidgetOrder,
    fetchLayoutList,
    fetchSaveLayout,
    fetchResetLayoutHeight,
    fetchResetLayoutWidth,
    fetchSaveLayoutOrder,
    fetchExecuteSql,
    fetchColCodeMap,
  }
}

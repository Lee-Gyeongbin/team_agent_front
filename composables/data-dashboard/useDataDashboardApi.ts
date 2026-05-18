import { useApi } from '~/composables/com/useApi'
import type { DataDashboardSqlItem, DataDashboardWidget, DataDashboardQueryResult } from '~/types/data-dashboard'

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

  /** 위젯 순서 저장 */
  const fetchSaveWidgetOrder = async (orderList: { widgetId: string; sortOrd: number }[]): Promise<void> => {
    await post('/datadashboard/widgetOrder.do', { orderList })
  }

  /** SQL 실행 */
  const fetchExecuteSql = async (
    logId: string | number,
    params: Record<string, string>,
  ): Promise<{ data: DataDashboardQueryResult; result: string; msg?: string }> => {
    return post<{ data: DataDashboardQueryResult; result: string; msg?: string }>(
      '/datadashboard/sqlExecute.do',
      { logId, sqlParams: JSON.stringify(params) },
    )
  }

  return {
    fetchSqlList,
    fetchWidgetList,
    fetchSaveWidget,
    fetchDeleteWidget,
    fetchSaveWidgetOrder,
    fetchExecuteSql,
  }
}

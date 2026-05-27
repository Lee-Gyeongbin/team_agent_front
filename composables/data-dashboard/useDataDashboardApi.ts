import { useApi } from '~/composables/com/useApi'
import { buildColCodeMapFromList } from '~/utils/dataDashboard/colCodeMapUtil'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardLayout,
  DataDashboardQueryResult,
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

  /**
   * 레이아웃 목록 조회
   * - 응답: widgetId별 x, y, w, h, minW, maxW, minH, maxH, isVisible
   */
  const fetchLayoutList = async (): Promise<{ list: DataDashboardLayout[] }> => {
    return post<{ list: DataDashboardLayout[] }>('/datadashboard/layoutList.do', {})
  }

  /**
   * 레이아웃 일괄 저장 (드래그/리사이즈 완료 시 자동 저장)
   * - x, y, w, h, isVisible 포함
   */
  const fetchSaveLayoutBatch = async (layoutBatchList: DataDashboardLayout[]): Promise<void> => {
    await post('/datadashboard/layoutSaveBatch.do', { layoutBatchList })
  }

  /**
   * 데이터마트 컬럼 코드 매핑 조회 (tb_dm_col_code)
   * USE_YN = 'Y'인 항목만 반환
   */
  const fetchColCodeMap = async (datamartId: string): Promise<ColCodeMap> => {
    type RawItem = { colId: string; codeVal: string; codeKorNm: string }
    const res = await post<{ list?: RawItem[]; dataList?: RawItem[] }>('/datadashboard/colCodeMap.do', {
      datamartId,
    })
    return buildColCodeMapFromList(res.list ?? res.dataList)
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
    fetchLayoutList,
    fetchSaveLayoutBatch,
    fetchExecuteSql,
    fetchColCodeMap,
  }
}

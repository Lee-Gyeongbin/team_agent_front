import { useDataDashboardApi } from '~/composables/data-dashboard/useDataDashboardApi'
import { parseTtsqParam, extractSqlWhereValues } from '~/utils/dataDashboard/ttsqParamParser'
import { parseVizConfig } from '~/utils/dataDashboard/vizConfigUtil'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardWidgetState,
  ColCodeMap,
} from '~/types/data-dashboard'

const {
  fetchSqlList,
  fetchWidgetList,
  fetchSaveWidget,
  fetchDeleteWidget,
  fetchSaveWidgetOrder,
  fetchExecuteSql,
  fetchColCodeMap,
} = useDataDashboardApi()

// ===== 전역 상태 =====
const widgetList = ref<DataDashboardWidget[]>([])
const sqlList = ref<DataDashboardSqlItem[]>([])
const sqlListLoading = ref(false)
// 위젯별 런타임 상태 (실행 결과, 필터 값, 로딩)
const widgetStates = ref<Record<string, DataDashboardWidgetState>>({})
// datamartId별 코드 매핑 캐시 (같은 datamartId 위젯은 한 번만 조회)
const codeMapCache = ref<Record<string, ColCodeMap>>({})
// 모달
const isAddModalOpen = ref(false)

/**
 * 백엔드 응답 VO → 프론트 위젯 타입으로 변환
 * - ttsqParam: JSON → variables 파싱
 * - vizConfig: JSON string → object 파싱
 */
const hydrateVariables = <
  T extends {
    ttsqParam?: string | null
    vizConfig?: unknown
    variables?: DataDashboardWidget['variables']
    sqlContent?: string | null
  },
>(
  item: T,
): T => {
  const vars = parseTtsqParam(item.ttsqParam ?? null)

  // sqlContent가 있으면 WHERE 절에서 실제 조회값을 추출해 defaultValue에 반영
  if (item.sqlContent) {
    const whereValues = extractSqlWhereValues(
      item.sqlContent,
      vars.map((v) => v.key),
    )
    item.variables = vars.map((v) => ({
      ...v,
      defaultValue: whereValues[v.key] ?? v.defaultValue ?? '',
    }))
  } else {
    item.variables = vars
  }

  item.vizConfig = parseVizConfig(item.vizConfig)
  return item
}

/** 위젯 상태 초기화 */
const initWidgetState = (widget: DataDashboardWidget) => {
  const defaults: Record<string, string> = {}
  for (const v of widget.variables ?? []) {
    defaults[v.key] = v.defaultValue ?? ''
  }
  widgetStates.value[widget.widgetId] = {
    filterValues: defaults,
    result: null,
    loading: false,
    error: null,
  }
}

const ensureWidgetState = (widgetId: string) => {
  if (!widgetStates.value[widgetId]) {
    const w = widgetList.value.find((item) => item.widgetId === widgetId)
    if (w) initWidgetState(w)
  }
}

// ===== 위젯 목록 =====

/** 위젯 목록의 고유 datamartId별 코드맵을 일괄 선반입 (캐시 미스만 조회) */
const prefetchCodeMaps = async () => {
  const ids = Array.from(
    new Set(widgetList.value.map((w) => w.datamartId).filter((id): id is string => !!id && !codeMapCache.value[id])),
  )
  await Promise.all(ids.map((id) => fetchColCodeMap(id).then((map) => (codeMapCache.value[id] = map))))
}

const handleSelectWidgetList = async () => {
  try {
    const res = await fetchWidgetList()
    widgetList.value = (res.list ?? []).map(hydrateVariables)
    widgetList.value.forEach(initWidgetState)
    await prefetchCodeMaps()
  } catch {
    openToast({ message: '위젯 목록 조회에 실패했습니다.', type: 'error' })
  }
}

// ===== SQL 목록 =====

const handleSelectSqlList = async () => {
  sqlListLoading.value = true
  try {
    const res = await fetchSqlList()
    sqlList.value = (res.list ?? []).map((item) => hydrateVariables(item as DataDashboardSqlItem))
  } catch {
    openToast({ message: 'SQL 목록 조회에 실패했습니다.', type: 'error' })
  } finally {
    sqlListLoading.value = false
  }
}

// ===== SQL 실행 =====

const handleExecuteSql = async (widgetId: string) => {
  ensureWidgetState(widgetId)
  const state = widgetStates.value[widgetId]
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!state || !widget) return

  state.loading = true
  state.error = null
  try {
    // SQL 실행 + 코드맵 조회 병렬 처리 (코드맵은 캐시 미스일 때만 API 호출)
    const sqlPromise = fetchExecuteSql(widget.logId, state.filterValues)
    const codeMapPromise =
      widget.datamartId && !codeMapCache.value[widget.datamartId]
        ? fetchColCodeMap(widget.datamartId).then((map) => {
            if (widget.datamartId) codeMapCache.value[widget.datamartId] = map
          })
        : Promise.resolve()

    const [res] = await Promise.all([sqlPromise, codeMapPromise])

    if (res.result === 'SUCCESS') {
      state.result = res.data ?? null
    } else {
      state.error = res.msg ?? 'SQL 실행에 실패했습니다.'
    }
  } catch {
    state.error = 'SQL 실행 중 오류가 발생했습니다.'
    openToast({ message: 'SQL 실행에 실패했습니다.', type: 'error' })
  } finally {
    state.loading = false
  }
}

/** widgetId로 해당 위젯의 datamartId에 맞는 코드맵 반환 */
const getWidgetCodeMap = (widgetId: string): ColCodeMap | undefined => {
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!widget?.datamartId) return undefined
  return codeMapCache.value[widget.datamartId]
}

const handleUpdateFilterValues = (widgetId: string, values: Record<string, string>) => {
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = { ...values }
}

// ===== 위젯 저장 =====

/**
 * 백엔드 mapper가 받아야 할 필드만 추출.
 * variables, sqlContent, agentNm 등 프론트 전용 필드는 제외한다.
 */
const toWidgetPayload = (widget: Partial<DataDashboardWidget>): Record<string, unknown> => ({
  widgetId: widget.widgetId,
  logId: widget.logId,
  title: widget.title,
  vizType: widget.vizType,
  vizConfig:
    widget.vizConfig && typeof widget.vizConfig === 'object'
      ? JSON.stringify(widget.vizConfig)
      : (widget.vizConfig ?? null),
  ttsqParam: widget.ttsqParam ?? null,
  colSpan: widget.colSpan,
  sortOrd: widget.sortOrd,
})

const handleSaveWidget = async (widget: Partial<DataDashboardWidget>): Promise<DataDashboardWidget | null> => {
  try {
    const res = await fetchSaveWidget(toWidgetPayload(widget) as Partial<DataDashboardWidget>)
    await handleSelectWidgetList()
    openToast({ message: '위젯이 저장되었습니다.', type: 'success' })
    return hydrateVariables(res.data)
  } catch {
    openToast({ message: '위젯 저장에 실패했습니다.', type: 'error' })
    return null
  }
}

// ===== 위젯 삭제 =====

const handleDeleteWidget = async (widgetId: string) => {
  const confirmed = await openConfirm({
    title: '위젯 삭제',
    message: '위젯을 삭제하시겠습니까?',
  })
  if (!confirmed) return

  try {
    await fetchDeleteWidget(widgetId)
    widgetList.value = widgetList.value.filter((w) => w.widgetId !== widgetId)
    widgetStates.value = Object.fromEntries(Object.entries(widgetStates.value).filter(([id]) => id !== widgetId))
    openToast({ message: '위젯이 삭제되었습니다.' })
  } catch {
    openToast({ message: '위젯 삭제에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 너비 변경 =====

const handleResizeWidget = async (widgetId: string, colSpan: 1 | 2) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1) return
  const updated = { ...widgetList.value[idx], colSpan }
  widgetList.value[idx] = updated
  try {
    await fetchSaveWidget(toWidgetPayload(updated) as Partial<DataDashboardWidget>)
  } catch {
    openToast({ message: '위젯 너비 변경에 실패했습니다.', type: 'error' })
  }
}

// ===== 드래그 순서 저장 =====

const handleSaveWidgetOrder = async () => {
  const orderList = widgetList.value.map((w, i) => ({ widgetId: w.widgetId, sortOrd: i + 1 }))
  try {
    await fetchSaveWidgetOrder(orderList)
  } catch {
    openToast({ message: '순서 저장에 실패했습니다.', type: 'error' })
  }
}

// ===== 모달 =====

const openAddModal = () => {
  if (!sqlList.value.length) handleSelectSqlList()
  isAddModalOpen.value = true
}
const closeAddModal = () => {
  isAddModalOpen.value = false
}

export const useDataDashboardStore = () => {
  return {
    widgetList,
    sqlList,
    sqlListLoading,
    widgetStates,
    isAddModalOpen,
    handleSelectWidgetList,
    handleSelectSqlList,
    handleExecuteSql,
    handleUpdateFilterValues,
    handleSaveWidget,
    handleDeleteWidget,
    handleResizeWidget,
    handleSaveWidgetOrder,
    getWidgetCodeMap,
    openAddModal,
    closeAddModal,
  }
}

import { useDataDashboardApi } from '~/composables/data-dashboard/useDataDashboardApi'
import { parseTtsqParam, extractSqlWhereValues } from '~/utils/dataDashboard/ttsqParamParser'
import { parseVizConfig } from '~/utils/dataDashboard/vizConfigUtil'
import { buildLayoutRows, findRowWidgetIds } from '~/utils/dataDashboard/layoutUtil'
import {
  DATA_DASHBOARD_GRID_COLUMNS,
  type DataDashboardSqlItem,
  type DataDashboardWidget,
  type DataDashboardLayout,
  type DataDashboardWidgetState,
  type DataDashboardColSpan,
  type ColCodeMap,
} from '~/types/data-dashboard'

const {
  fetchSqlList,
  fetchWidgetList,
  fetchSaveWidget,
  fetchDeleteWidget,
  fetchSaveWidgetColSpan,
  fetchSaveWidgetOrder,
  fetchLayoutList,
  fetchSaveLayout,
  fetchSaveLayoutOrder,
  fetchResetLayoutWidth,
  fetchExecuteSql,
  fetchColCodeMap,
} = useDataDashboardApi()

// ===== 전역 상태 =====
const widgetList = ref<DataDashboardWidget[]>([])
const sqlList = ref<DataDashboardSqlItem[]>([])
const sqlListLoading = ref(false)
// 위젯별 런타임 상태 (실행 결과, 필터 값, 로딩)
const widgetStates = ref<Record<string, DataDashboardWidgetState>>({})
// 위젯별 레이아웃 (widgetId → layout: widthPx, heightPx 등)
const layoutMap = ref<Record<string, DataDashboardLayout>>({})
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

/** TTSQ_PARAM + SQL WHERE 추출값 기준 필터 초기값 */
const buildDefaultFilterValues = (variables: DataDashboardWidget['variables']): Record<string, string> => {
  const defaults: Record<string, string> = {}
  for (const v of variables ?? []) {
    defaults[v.key] = v.defaultValue ?? ''
  }
  return defaults
}

/** 위젯 상태 초기화 */
const initWidgetState = (widget: DataDashboardWidget) => {
  widgetStates.value[widget.widgetId] = {
    filterValues: buildDefaultFilterValues(widget.variables),
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

/** sortOrd 기준 오름차순 정렬 (동일 시 widgetId로 안정 정렬) */
const sortWidgetsByOrd = (widgets: DataDashboardWidget[]): DataDashboardWidget[] => {
  return [...widgets].sort((a, b) => {
    const diff = (Number(a.sortOrd) || 0) - (Number(b.sortOrd) || 0)
    if (diff !== 0) return diff
    return String(a.widgetId).localeCompare(String(b.widgetId))
  })
}

/** 배열 맨 끝으로 옮긴 뒤 순서·레이아웃 저장 */
const moveWidgetToEnd = async (widgetId: string) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1 || idx === widgetList.value.length - 1) return
  const next = [...widgetList.value]
  const [item] = next.splice(idx, 1)
  next.push(item)
  widgetList.value = next
  await handleSaveWidgetOrder()
}

// ===== 위젯 목록 =====

/** 위젯 목록의 모든 SQL을 병렬 실행해 차트를 일괄 갱신 */
const handleExecuteAllWidgets = async () => {
  await Promise.all(widgetList.value.map((w) => handleExecuteSql(w.widgetId)))
}

const handleSelectWidgetList = async () => {
  try {
    const [widgetRes, layoutRes] = await Promise.all([fetchWidgetList(), fetchLayoutList()])
    widgetList.value = sortWidgetsByOrd((widgetRes.list ?? []).map(hydrateVariables))
    widgetList.value.forEach(initWidgetState)
    layoutMap.value = Object.fromEntries((layoutRes.list ?? []).map((l) => [l.widgetId, l]))
    await handleExecuteAllWidgets()
  } catch {
    openToast({ message: '위젯 목록 조회에 실패했습니다.', type: 'error' })
  }
}

/** widgetId로 저장된 heightPx 반환 (null = 기본값 사용) */
const getWidgetHeightPx = (widgetId: string): number | null => {
  return layoutMap.value[widgetId]?.heightPx ?? null
}

/** widgetId로 저장된 widthPx 반환 (null = colSpan 비율 기본값) */
const getWidgetWidthPx = (widgetId: string): number | null => {
  return layoutMap.value[widgetId]?.widthPx ?? null
}

/** 행 단위 커스텀 widthPx 초기화 */
const clearRowCustomWidths = async (widgetId: string) => {
  const rows = buildLayoutRows(widgetList.value)
  const rowWidgetIds = findRowWidgetIds(rows, widgetId)
  if (!rowWidgetIds.length) return

  await Promise.all(
    rowWidgetIds.map(async (id) => {
      layoutMap.value[id] = { ...(layoutMap.value[id] ?? { widgetId: id }), widgetId: id, widthPx: null }
      await fetchResetLayoutWidth(id)
    }),
  )
}

/** 드래그 등 레이아웃 재배치 시 모든 커스텀 widthPx 초기화 */
const clearAllCustomWidths = async () => {
  const widgetIds = Object.entries(layoutMap.value)
    .filter(([, layout]) => layout.widthPx != null)
    .map(([id]) => id)
  if (!widgetIds.length) return

  await Promise.all(
    widgetIds.map(async (id) => {
      layoutMap.value[id] = { ...layoutMap.value[id], widthPx: null }
      await fetchResetLayoutWidth(id)
    }),
  )
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
    // SQL 실행 + 코드맵 조회 병렬 처리 (실행마다 코드맵 API 호출)
    const sqlPromise = fetchExecuteSql(widget.logId, state.filterValues)
    const codeMapPromise = widget.datamartId
      ? fetchColCodeMap(widget.datamartId).then((map) => {
          state.codeMap = map
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

/** widgetId로 해당 위젯의 최근 실행 시 조회한 코드맵 반환 */
const getWidgetCodeMap = (widgetId: string): ColCodeMap | undefined => {
  return widgetStates.value[widgetId]?.codeMap
}

const handleUpdateFilterValues = (widgetId: string, values: Record<string, string>) => {
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = { ...values }
}

/** 필터값을 TTSQ가 만든 초기값(defaultValue)으로 복원 */
const handleResetFilterValues = (widgetId: string) => {
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!widget) return
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = buildDefaultFilterValues(widget.variables)
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
  // 저장 전 기존 widgetId 집합 — 신규 추가된 위젯 식별용
  const prevIds = new Set(widgetList.value.map((w) => w.widgetId))
  const isNew = !widget.widgetId
  const payload: Partial<DataDashboardWidget> = { ...widget }
  if (isNew) {
    const maxSort = widgetList.value.reduce((max, w) => Math.max(max, Number(w.sortOrd) || 0), 0)
    payload.sortOrd = maxSort + 1
  }
  try {
    await fetchSaveWidget(toWidgetPayload(payload) as Partial<DataDashboardWidget>)
    await handleSelectWidgetList()
    if (isNew) {
      const newWidget = widgetList.value.find((w) => !prevIds.has(w.widgetId))
      if (newWidget) await moveWidgetToEnd(newWidget.widgetId)
    }
    closeAddModal()
    openToast({ message: '위젯이 저장되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '위젯 저장에 실패했습니다.', type: 'error' })
    return null
  }
  // 수정: 기존 widgetId로 조회 / 신규: prevIds에 없는 위젯 반환
  const saved = widget.widgetId
    ? widgetList.value.find((w) => w.widgetId === widget.widgetId)
    : widgetList.value.find((w) => !prevIds.has(w.widgetId))
  return saved ?? null
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
    openToast({ message: '위젯이 삭제되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '위젯 삭제에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 높이 저장 =====

const handleSaveWidgetHeight = async (widgetId: string, heightPx: number) => {
  layoutMap.value[widgetId] = { ...(layoutMap.value[widgetId] ?? {}), widgetId, heightPx }
  try {
    await fetchSaveLayout({ widgetId, heightPx: Math.round(heightPx) })
  } catch {
    openToast({ message: '높이 저장에 실패했습니다.', type: 'error' })
  }
}

/** 위젯 콘텐츠 기본 높이(px) */
export const DATA_DASHBOARD_DEFAULT_HEIGHT_PX = 320

const handleResetWidgetHeight = async (widgetId: string) => {
  await handleSaveWidgetHeight(widgetId, DATA_DASHBOARD_DEFAULT_HEIGHT_PX)
}

// ===== 위젯 가로 너비 저장 =====

const handleSaveWidgetWidth = async (widgetId: string, widthPx: number) => {
  const width = Math.round(widthPx)
  layoutMap.value[widgetId] = {
    ...(layoutMap.value[widgetId] ?? { widgetId }),
    widgetId,
    widthPx: width,
  }
  try {
    await fetchSaveLayout({ widgetId, widthPx: width })
  } catch {
    openToast({ message: '너비 저장에 실패했습니다.', type: 'error' })
  }
}

const handleSaveWidgetWidthPair = async (
  leftWidgetId: string,
  leftWidthPx: number,
  rightWidgetId: string,
  rightWidthPx: number,
) => {
  const leftWidth = Math.round(leftWidthPx)
  const rightWidth = Math.round(rightWidthPx)

  layoutMap.value[leftWidgetId] = {
    ...(layoutMap.value[leftWidgetId] ?? { widgetId: leftWidgetId }),
    widgetId: leftWidgetId,
    widthPx: leftWidth,
  }
  layoutMap.value[rightWidgetId] = {
    ...(layoutMap.value[rightWidgetId] ?? { widgetId: rightWidgetId }),
    widgetId: rightWidgetId,
    widthPx: rightWidth,
  }

  try {
    await Promise.all([
      fetchSaveLayout({ widgetId: leftWidgetId, widthPx: leftWidth }),
      fetchSaveLayout({ widgetId: rightWidgetId, widthPx: rightWidth }),
    ])
  } catch {
    openToast({ message: '너비 저장에 실패했습니다.', type: 'error' })
  }
}

const handleResetWidgetWidth = async (widgetId: string) => {
  try {
    await clearRowCustomWidths(widgetId)
  } catch {
    openToast({ message: '너비 초기화에 실패했습니다.', type: 'error' })
  }
}

/** 너비(colSpan 1·widthPx 초기화) + 높이(320px) 기본값으로 일괄 복원 */
const handleResetWidgetLayout = async (widgetId: string) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx !== -1) {
    widgetList.value[idx] = { ...widgetList.value[idx], colSpan: 1 }
  }

  const rows = buildLayoutRows(widgetList.value)
  const rowWidgetIds = findRowWidgetIds(rows, widgetId)

  for (const id of rowWidgetIds) {
    layoutMap.value[id] = {
      ...(layoutMap.value[id] ?? { widgetId: id }),
      widgetId: id,
      widthPx: null,
    }
  }
  layoutMap.value[widgetId] = {
    ...(layoutMap.value[widgetId] ?? { widgetId }),
    widgetId,
    heightPx: DATA_DASHBOARD_DEFAULT_HEIGHT_PX,
  }

  try {
    const layoutOrderList = computeLayoutOrder(widgetList.value)

    await Promise.all([
      fetchSaveWidgetColSpan(widgetId, 1),
      fetchSaveLayoutOrder(layoutOrderList),
      fetchSaveLayout({ widgetId, heightPx: DATA_DASHBOARD_DEFAULT_HEIGHT_PX }),
      ...rowWidgetIds.map((id) => fetchResetLayoutWidth(id)),
    ])
  } catch {
    openToast({ message: '크기 초기화에 실패했습니다.', type: 'error' })
  }
}

// ===== 드래그 / 레이아웃 순서 저장 =====

/**
 * 위젯 배열을 3-컬럼 그리드 기준으로 순회하며 rowPos, colPos를 계산.
 * colSpan=3 은 전체 행, 1+2 / 2+1 / 1+1+1 등 혼합 배치 가능.
 */
const computeLayoutOrder = (widgets: DataDashboardWidget[]) => {
  let row = 0
  let colFilled = 0

  return widgets.map((w, i) => {
    const colSpan = Math.min(w.colSpan ?? 1, DATA_DASHBOARD_GRID_COLUMNS) as DataDashboardColSpan

    if (colFilled + colSpan > DATA_DASHBOARD_GRID_COLUMNS) {
      row++
      colFilled = 0
    }

    const colPos = colFilled
    colFilled += colSpan

    if (colFilled >= DATA_DASHBOARD_GRID_COLUMNS) {
      row++
      colFilled = 0
    }

    return { widgetId: w.widgetId, sortOrd: i + 1, rowPos: row, colPos, colSpan }
  })
}

const handleSaveWidgetOrder = async () => {
  const orderList = widgetList.value.map((w, i) => ({ widgetId: w.widgetId, sortOrd: i + 1 }))
  const layoutOrderList = computeLayoutOrder(widgetList.value)
  try {
    await Promise.all([fetchSaveWidgetOrder(orderList), fetchSaveLayoutOrder(layoutOrderList), clearAllCustomWidths()])
  } catch {
    openToast({ message: '순서 저장에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 너비 변경 =====

const handleResizeWidget = async (widgetId: string, colSpan: DataDashboardColSpan) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1) return
  widgetList.value[idx] = { ...widgetList.value[idx], colSpan }
  try {
    const layoutOrderList = computeLayoutOrder(widgetList.value)
    await Promise.all([
      fetchSaveWidgetColSpan(widgetId, colSpan),
      fetchSaveLayoutOrder(layoutOrderList),
      clearRowCustomWidths(widgetId),
    ])
  } catch {
    openToast({ message: '위젯 너비 변경에 실패했습니다.', type: 'error' })
  }
}

// ===== 모달 =====

const openAddModal = async () => {
  await handleSelectSqlList()
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
    layoutMap,
    isAddModalOpen,
    handleSelectWidgetList,
    handleSelectSqlList,
    handleExecuteSql,
    handleUpdateFilterValues,
    handleResetFilterValues,
    handleSaveWidget,
    handleDeleteWidget,
    handleResizeWidget,
    handleSaveWidgetOrder,
    handleSaveWidgetHeight,
    handleResetWidgetHeight,
    handleSaveWidgetWidth,
    handleSaveWidgetWidthPair,
    handleResetWidgetWidth,
    handleResetWidgetLayout,
    getWidgetCodeMap,
    getWidgetHeightPx,
    getWidgetWidthPx,
    openAddModal,
    closeAddModal,
  }
}

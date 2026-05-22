import { useDataDashboardApi } from '~/composables/data-dashboard/useDataDashboardApi'
import { parseTtsqParam, extractSqlWhereValues } from '~/utils/dataDashboard/ttsqParamParser'
import { parseVizConfig } from '~/utils/dataDashboard/vizConfigUtil'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardLayout,
  DataDashboardWidgetState,
  ColCodeMap,
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
  fetchResetLayoutHeight,
  fetchSaveLayoutOrder,
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

/** 위젯 목록의 모든 SQL을 병렬 실행해 차트를 일괄 갱신 */
const handleExecuteAllWidgets = async () => {
  await Promise.all(widgetList.value.map((w) => handleExecuteSql(w.widgetId)))
}

const handleSelectWidgetList = async () => {
  try {
    const [widgetRes, layoutRes] = await Promise.all([fetchWidgetList(), fetchLayoutList()])
    widgetList.value = (widgetRes.list ?? []).map(hydrateVariables)
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
  try {
    await fetchSaveWidget(toWidgetPayload(widget) as Partial<DataDashboardWidget>)
    await handleSelectWidgetList()
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

const handleResetWidgetHeight = async (widgetId: string) => {
  await handleSaveWidgetHeight(widgetId, 400)
}

// ===== 드래그 / 레이아웃 순서 저장 =====

/**
 * 위젯 배열을 2-컬럼 그리드 기준으로 순회하며 rowPos, colPos를 계산.
 * colSpan=2 는 전체 행을 차지, colSpan=1 은 좌/우 절반.
 */
const computeLayoutOrder = (widgets: DataDashboardWidget[]) => {
  let row = 0
  let colFilled = 0

  return widgets.map((w, i) => {
    const colSpan = w.colSpan ?? 1

    if (colFilled + colSpan > 2) {
      row++
      colFilled = 0
    }

    const colPos = colFilled
    colFilled += colSpan

    if (colFilled >= 2) {
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
    await Promise.all([fetchSaveWidgetOrder(orderList), fetchSaveLayoutOrder(layoutOrderList)])
  } catch {
    openToast({ message: '순서 저장에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 너비 변경 =====

const handleResizeWidget = async (widgetId: string, colSpan: 1 | 2) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1) return
  widgetList.value[idx] = { ...widgetList.value[idx], colSpan }
  try {
    const layoutOrderList = computeLayoutOrder(widgetList.value)
    await Promise.all([
      fetchSaveWidgetColSpan(widgetId, colSpan), // colSpan만 저장 — vizType 불변
      fetchSaveLayoutOrder(layoutOrderList),
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
    isAddModalOpen,
    handleSelectWidgetList,
    handleSelectSqlList,
    handleExecuteSql,
    handleUpdateFilterValues,
    handleSaveWidget,
    handleDeleteWidget,
    handleResizeWidget,
    handleSaveWidgetOrder,
    handleSaveWidgetHeight,
    handleResetWidgetHeight,
    getWidgetCodeMap,
    getWidgetHeightPx,
    openAddModal,
    closeAddModal,
  }
}

import { useDataDashboardApi } from '~/composables/data-dashboard/useDataDashboardApi'
import { parseTtsqParam } from '~/utils/dataDashboard/ttsqParamParser'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardWidgetState,
} from '~/types/data-dashboard'

const {
  fetchSqlList,
  fetchWidgetList,
  fetchSaveWidget,
  fetchDeleteWidget,
  fetchSaveWidgetOrder,
  fetchExecuteSql,
} = useDataDashboardApi()

// ===== 전역 상태 =====
const widgetList = ref<DataDashboardWidget[]>([])
const sqlList = ref<DataDashboardSqlItem[]>([])
const sqlListLoading = ref(false)

// 위젯별 런타임 상태 (실행 결과, 필터 값, 로딩)
const widgetStates = ref<Record<string, DataDashboardWidgetState>>({})

// 모달
const isAddModalOpen = ref(false)

// ===== 헬퍼 =====

/**
 * 백엔드 응답 VO → 프론트 위젯 타입으로 변환
 * - ttsqParam: JSON → variables 파싱
 * - vizConfig: JSON string → object 파싱
 */
const hydrateVariables = <T extends { ttsqParam?: string | null; vizConfig?: any; variables?: DataDashboardWidget['variables'] }>(
  item: T,
): T => {
  item.variables = parseTtsqParam(item.ttsqParam ?? null)
  // vizConfig가 JSON 문자열로 내려올 경우 파싱
  if (typeof item.vizConfig === 'string') {
    try { item.vizConfig = JSON.parse(item.vizConfig) } catch { item.vizConfig = {} }
  }
  return item
}

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

const handleSelectWidgetList = async () => {
  try {
    const res = await fetchWidgetList()
    widgetList.value = (res.list ?? []).map(hydrateVariables)
    widgetList.value.forEach(initWidgetState)
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
    const res = await fetchExecuteSql(widget.logId, state.filterValues)
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

const handleUpdateFilterValues = (widgetId: string, values: Record<string, string>) => {
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = { ...values }
}

// ===== 위젯 저장 =====

const handleSaveWidget = async (widget: Partial<DataDashboardWidget>) => {
  try {
    // vizConfig 객체 → JSON 문자열 직렬화 (백엔드 VO의 String 필드와 매핑)
    const payload: Record<string, unknown> = { ...widget }
    if (widget.vizConfig && typeof widget.vizConfig === 'object') {
      payload.vizConfig = JSON.stringify(widget.vizConfig)
    }
    const res = await fetchSaveWidget(payload as Partial<DataDashboardWidget>)
    const saved = hydrateVariables(res.data)
    const idx = widgetList.value.findIndex((w) => w.widgetId === saved.widgetId)
    if (idx > -1) {
      widgetList.value[idx] = saved
    } else {
      widgetList.value.push(saved)
      initWidgetState(saved)
    }
    openToast({ message: '위젯이 저장되었습니다.' })
    return saved
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
    delete widgetStates.value[widgetId]
    openToast({ message: '위젯이 삭제되었습니다.' })
  } catch {
    openToast({ message: '위젯 삭제에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 너비 변경 =====

const handleResizeWidget = async (widgetId: string, colSpan: 1 | 2) => {
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!widget) return
  widget.colSpan = colSpan
  try {
    await fetchSaveWidget({ widgetId, colSpan })
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
    openAddModal,
    closeAddModal,
  }
}

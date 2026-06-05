import { useDataDashboardApi } from '~/composables/data-dashboard/useDataDashboardApi'
import { GS_DEFAULT_LAYOUT } from '~/composables/data-dashboard/useDataDashboardGridStack'
import {
  parseTtsqParam,
  parseTtsqPeriodParam,
  markPeriodVariables,
  parseLastTtsqParams,
  extractSqlWhereValues,
} from '~/utils/dataDashboard/ttsqParamParser'
import { parseVizConfig } from '~/utils/dataDashboard/vizConfigUtil'
import type {
  DataDashboardSqlItem,
  DataDashboardWidget,
  DataDashboardLayout,
  DataDashboardWidgetState,
  DataDashboardVizType,
  ColCodeMap,
  ColNmMap,
} from '~/types/data-dashboard'

const {
  fetchSqlList,
  fetchWidgetList,
  fetchSaveWidget,
  fetchDeleteWidget,
  fetchLayoutList,
  fetchSaveLayoutBatch,
  fetchExecuteSql,
  fetchSaveLastTtsqParams,
  fetchColCodeMap,
  fetchColNmMap,
} = useDataDashboardApi()

// ===== 전역 상태 =====
const widgetList = ref<DataDashboardWidget[]>([])
const sqlList = ref<DataDashboardSqlItem[]>([])
const sqlListLoading = ref(false)

/** 위젯별 런타임 상태 (실행 결과, 필터 값, 로딩) */
const widgetStates = ref<Record<string, DataDashboardWidgetState>>({})

/** 위젯별 GridStack 레이아웃 (widgetId → DataDashboardLayout) */
const layoutMap = ref<Record<string, DataDashboardLayout>>({})

/** 위젯 추가 모달 오픈 여부 */
const isAddModalOpen = ref(false)

// ===== 유틸 =====

/**
 * 백엔드 응답 VO → 프론트 위젯 타입으로 변환
 * - ttsqParam: JSON → variables 파싱
 * - vizConfig: JSON string → object 파싱
 */
const hydrateVariables = <
  T extends {
    ttsqParam?: string | null
    ttsqPeriodParam?: string | null
    vizConfig?: unknown
    variables?: DataDashboardWidget['variables']
    sqlContent?: string | null
    lastTtsqParams?: unknown
  },
>(
  item: T,
): T => {
  const periodKeys = parseTtsqPeriodParam(item.ttsqPeriodParam ?? null)
  const vars = markPeriodVariables(parseTtsqParam(item.ttsqParam ?? null), periodKeys)

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
  if ('lastTtsqParams' in item) {
    item.lastTtsqParams = parseLastTtsqParams(item.lastTtsqParams)
  }
  return item
}

/** chat_log TTSQ 기준 필터 초기값 (초기화/리셋용) */
const buildDefaultFilterValues = (variables: DataDashboardWidget['variables']): Record<string, string> => {
  const defaults: Record<string, string> = {}
  for (const v of variables ?? []) {
    defaults[v.key] = v.defaultValue ?? ''
  }
  return defaults
}

/** 위젯 진입 시 필터값 — LAST_TTSQ_PARAMS 우선, 없으면 chat_log TTSQ 기본값 */
const buildInitialFilterValues = (widget: DataDashboardWidget): Record<string, string> => {
  const defaults = buildDefaultFilterValues(widget.variables)
  const saved = widget.lastTtsqParams
  if (!saved || Object.keys(saved).length === 0) return defaults
  return { ...defaults, ...saved }
}

/** 위젯 상태 초기화 */
const initWidgetState = (widget: DataDashboardWidget) => {
  widgetStates.value[widget.widgetId] = {
    filterValues: buildInitialFilterValues(widget),
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

/** sortOrd 기준 오름차순 정렬 */
const sortWidgetsByOrd = (widgets: DataDashboardWidget[]): DataDashboardWidget[] => {
  return [...widgets].sort((a, b) => {
    const diff = (Number(a.sortOrd) || 0) - (Number(b.sortOrd) || 0)
    if (diff !== 0) return diff
    return String(a.widgetId).localeCompare(String(b.widgetId))
  })
}

/**
 * widgetId에 대한 레이아웃 설정 반환
 * - layoutMap에 없으면 기본 배치(auto) 반환
 */
const getWidgetLayout = (widgetId: string): DataDashboardLayout => {
  const layout = layoutMap.value[widgetId]
  if (layout) return layout
  return {
    widgetId,
    ...GS_DEFAULT_LAYOUT,
    x: 0,
    y: 0,
    isVisible: true,
  }
}

/** widgetList에 datamartId가 없을 때 sqlList(logId)에서 보강 */
const resolveWidgetDatamartId = (widget: DataDashboardWidget): string | undefined => {
  const fromWidget = widget.datamartId?.trim()
  if (fromWidget) return fromWidget
  return sqlList.value.find((s) => s.logId === widget.logId)?.datamartId?.trim() || undefined
}

const enrichWidgetDatamartId = (widget: DataDashboardWidget): DataDashboardWidget => {
  const datamartId = resolveWidgetDatamartId(widget)
  if (!datamartId || widget.datamartId?.trim() === datamartId) return widget
  return { ...widget, datamartId }
}

/** widgetList에 ttsqPeriodParam이 없을 때 sqlList(logId)에서 보강 */
const enrichWidgetPeriodParam = (widget: DataDashboardWidget): DataDashboardWidget => {
  if (widget.ttsqPeriodParam?.trim()) return widget
  const fromSql = sqlList.value.find((s) => s.logId === widget.logId)?.ttsqPeriodParam
  if (!fromSql?.trim()) return widget
  return { ...widget, ttsqPeriodParam: fromSql }
}

/** SQL 실행 성공 시 LAST_TTSQ_PARAMS · LAST_EXEC_DT 저장 (자동 저장 — 토스트 없음) */
const persistLastTtsqParams = async (widgetId: string, params: Record<string, string>) => {
  try {
    const res = await fetchSaveLastTtsqParams(widgetId, params)
    const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
    if (idx === -1) return
    widgetList.value[idx] = {
      ...widgetList.value[idx],
      lastTtsqParams: { ...params },
      lastExecDt: res.lastExecDt ?? new Date().toISOString(),
    }
  } catch {
    openToast({ message: '필터 조건 저장에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 목록 조회 =====

const handleExecuteAllWidgets = async () => {
  await Promise.all(widgetList.value.map((w) => handleExecuteSql(w.widgetId)))
}

const handleSelectWidgetList = async () => {
  try {
    const [widgetRes, layoutRes, sqlRes] = await Promise.all([fetchWidgetList(), fetchLayoutList(), fetchSqlList()])
    sqlList.value = (sqlRes.list ?? []).map((item) => hydrateVariables(item as DataDashboardSqlItem))
    widgetList.value = sortWidgetsByOrd(
      (widgetRes.list ?? []).map(enrichWidgetDatamartId).map(enrichWidgetPeriodParam).map(hydrateVariables),
    )
    widgetList.value.forEach(initWidgetState)
    layoutMap.value = Object.fromEntries(
      (layoutRes.list ?? []).map((l) => [l.widgetId, { ...l, isVisible: l.isVisible !== false }]),
    )
    await handleExecuteAllWidgets()
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
    const datamartId = resolveWidgetDatamartId(widget)
    const [res, codeMap, colNmMap] = await Promise.all([
      fetchExecuteSql(widget.logId, state.filterValues),
      datamartId ? fetchColCodeMap(datamartId) : Promise.resolve(undefined),
      datamartId ? fetchColNmMap(datamartId) : Promise.resolve(undefined),
    ])
    if (codeMap) state.codeMap = codeMap
    if (colNmMap) state.colNmMap = colNmMap

    if (res.result === 'SUCCESS') {
      state.result = res.data ?? null
      await persistLastTtsqParams(widgetId, state.filterValues)
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

const getWidgetCodeMap = (widgetId: string): ColCodeMap | undefined => {
  return widgetStates.value[widgetId]?.codeMap
}

const getWidgetColNmMap = (widgetId: string): ColNmMap | undefined => {
  return widgetStates.value[widgetId]?.colNmMap
}

const handleUpdateFilterValues = (widgetId: string, values: Record<string, string>) => {
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = { ...values }
}

const handleResetFilterValues = (widgetId: string) => {
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!widget) return
  ensureWidgetState(widgetId)
  widgetStates.value[widgetId].filterValues = buildDefaultFilterValues(widget.variables)
}

// ===== 위젯 저장 =====

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
  ttsqPeriodParam: widget.ttsqPeriodParam ?? null,
  sortOrd: widget.sortOrd,
})

const handleSaveWidget = async (widget: Partial<DataDashboardWidget>): Promise<DataDashboardWidget | null> => {
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
    closeAddModal()
    openToast({ message: '위젯이 저장되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '위젯 저장에 실패했습니다.', type: 'error' })
    return null
  }
  const saved = widget.widgetId
    ? widgetList.value.find((w) => w.widgetId === widget.widgetId)
    : widgetList.value.find((w) => !prevIds.has(w.widgetId))
  return saved ?? null
}

// ===== 위젯 삭제 =====

const handleDeleteWidget = async (
  widgetId: string,
  options?: { onBeforeListUpdate?: () => void },
): Promise<boolean> => {
  const confirmed = await openConfirm({
    title: '위젯 삭제',
    message: '위젯을 삭제하시겠습니까?',
  })
  if (!confirmed) return false

  try {
    await fetchDeleteWidget(widgetId)
    options?.onBeforeListUpdate?.()
    widgetList.value = widgetList.value.filter((w) => w.widgetId !== widgetId)
    widgetStates.value = Object.fromEntries(Object.entries(widgetStates.value).filter(([id]) => id !== widgetId))
    layoutMap.value = Object.fromEntries(Object.entries(layoutMap.value).filter(([id]) => id !== widgetId))
    openToast({ message: '위젯이 삭제되었습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '위젯 삭제에 실패했습니다.', type: 'error' })
    return false
  }
}

// ===== 시각화 유형 변경 (로컬) =====

const handleChangeVizType = (widgetId: string, vizType: DataDashboardVizType) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1) return
  widgetList.value[idx] = { ...widgetList.value[idx], vizType }
}

// ===== 레이아웃 저장 (드래그/리사이즈 완료 시 자동 저장) =====

/**
 * GridStack 현재 위치·크기를 일괄 저장 (자동 저장 — 토스트 없음)
 * @param layouts - GridStack에서 읽어온 위치 데이터 목록
 */
const handleSaveLayout = async (layouts: DataDashboardLayout[]) => {
  try {
    await fetchSaveLayoutBatch(layouts)
    for (const l of layouts) {
      layoutMap.value[l.widgetId] = { ...layoutMap.value[l.widgetId], ...l }
    }
  } catch {
    openToast({ message: '레이아웃 저장에 실패했습니다.', type: 'error' })
  }
}

// ===== 위젯 추가 모달 =====

const openAddModal = async () => {
  await handleSelectSqlList()
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

// ===== 위젯 상태 조회 =====

const defaultState: DataDashboardWidgetState = {
  filterValues: {},
  result: null,
  loading: false,
  error: null,
}

const getWidgetState = (widgetId: string): DataDashboardWidgetState => {
  return widgetStates.value[widgetId] ?? defaultState
}

export const useDataDashboardStore = () => {
  return {
    // 상태
    widgetList,
    sqlList,
    sqlListLoading,
    layoutMap,
    isAddModalOpen,

    // 데이터 조회
    handleSelectWidgetList,
    handleExecuteSql,
    getWidgetState,
    getWidgetLayout,
    getWidgetCodeMap,
    getWidgetColNmMap,

    // 필터
    handleUpdateFilterValues,
    handleResetFilterValues,

    // 위젯 CRUD
    handleSaveWidget,
    handleDeleteWidget,
    handleChangeVizType,

    // 레이아웃
    handleSaveLayout,

    // 위젯 추가 모달
    openAddModal,
    closeAddModal,
  }
}

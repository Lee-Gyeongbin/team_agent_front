import {
  DATA_DASHBOARD_GRID_COLUMNS,
  type DataDashboardColSpan,
  type DataDashboardLayout,
  type DataDashboardWidget,
} from '~/types/data-dashboard'

/** 그리드 gap — SCSS $spacing-md 와 동기 */
export const DATA_DASHBOARD_GRID_GAP_PX = 16

/** 위젯 최소 가로 너비(px) */
export const DATA_DASHBOARD_MIN_WIDTH_PX = 280

export interface LayoutRowItem {
  widget: DataDashboardWidget
  colPos: number
  colSpan: DataDashboardColSpan
}

export interface LayoutRow {
  rowIndex: number
  items: LayoutRowItem[]
}

/** sortOrd 순서 기준으로 행 그룹 생성 (colSpan·3열 그리드 반영) */
export const buildLayoutRows = (widgets: DataDashboardWidget[]): LayoutRow[] => {
  const rows: LayoutRow[] = []
  let currentRow: LayoutRowItem[] = []
  let colFilled = 0
  let rowIndex = 0

  for (const widget of widgets) {
    const colSpan = Math.min(widget.colSpan ?? 1, DATA_DASHBOARD_GRID_COLUMNS) as DataDashboardColSpan

    if (colFilled + colSpan > DATA_DASHBOARD_GRID_COLUMNS) {
      if (currentRow.length) rows.push({ rowIndex: rowIndex++, items: currentRow })
      currentRow = []
      colFilled = 0
    }

    currentRow.push({ widget, colPos: colFilled, colSpan })
    colFilled += colSpan

    if (colFilled >= DATA_DASHBOARD_GRID_COLUMNS) {
      rows.push({ rowIndex: rowIndex++, items: currentRow })
      currentRow = []
      colFilled = 0
    }
  }

  if (currentRow.length) rows.push({ rowIndex: rowIndex++, items: currentRow })
  return rows
}

/** widgetId → 같은 행에서 바로 오른쪽 이웃 widgetId */
export const buildRightNeighborMap = (rows: LayoutRow[]): Map<string, string> => {
  const map = new Map<string, string>()
  for (const row of rows) {
    for (let i = 0; i < row.items.length - 1; i++) {
      map.set(row.items[i].widget.widgetId, row.items[i + 1].widget.widgetId)
    }
  }
  return map
}

/** widgetId가 속한 행의 widgetId 목록 */
export const findRowWidgetIds = (rows: LayoutRow[], widgetId: string): string[] => {
  const row = rows.find((r) => r.items.some((item) => item.widget.widgetId === widgetId))
  return row?.items.map((item) => item.widget.widgetId) ?? []
}

/**
 * 행 내 위젯별 실제 너비(px) 계산.
 * widthPx가 NULL이면 colSpan 비율로 분배, 저장값이 있으면 우선 적용.
 */
export const resolveRowWidths = (
  row: LayoutRow,
  containerWidth: number,
  layoutMap: Record<string, DataDashboardLayout>,
): Record<string, number> => {
  const items = row.items
  const count = items.length
  if (count === 0 || containerWidth <= 0) return {}

  const gaps = Math.max(0, count - 1) * DATA_DASHBOARD_GRID_GAP_PX
  const available = Math.max(0, containerWidth - gaps)
  const stored = items.map((item) => layoutMap[item.widget.widgetId]?.widthPx ?? null)
  const hasStored = stored.some((value) => value != null && value > 0)

  if (!hasStored) {
    const totalColSpan = items.reduce((sum, item) => sum + item.colSpan, 0)
    const result: Record<string, number> = {}
    for (const item of items) {
      result[item.widget.widgetId] = Math.round((available * item.colSpan) / totalColSpan)
    }
    return result
  }

  const fixedWidths = stored.map((value) => value ?? 0)
  const flexIndices = stored.map((value, index) => (value == null ? index : -1)).filter((index) => index >= 0)

  if (flexIndices.length === 0) {
    const fixedSum = fixedWidths.reduce((sum, value) => sum + value, 0)
    if (fixedSum <= 0) return {}
    // 단독 행: 저장 너비 유지 (전체 폭으로 강제 확대하지 않음)
    if (count === 1) {
      return { [items[0].widget.widgetId]: Math.min(Math.round(fixedWidths[0]), available) }
    }
    const scale = available / fixedSum
    return Object.fromEntries(
      items.map((item, index) => [item.widget.widgetId, Math.round(fixedWidths[index] * scale)]),
    )
  }

  const fixedSum = fixedWidths.reduce((sum, value) => sum + value, 0)
  const flexColSpanSum = flexIndices.reduce((sum, index) => sum + items[index].colSpan, 0)
  const remaining = Math.max(0, available - fixedSum)

  const result: Record<string, number> = {}
  for (let i = 0; i < items.length; i++) {
    if (stored[i] != null) {
      result[items[i].widget.widgetId] = stored[i]!
    } else {
      result[items[i].widget.widgetId] = Math.round((remaining * items[i].colSpan) / flexColSpanSum)
    }
  }
  return result
}

/** 쌍 리사이즈 시 delta 적용 후 양쪽 너비(clamp) */
export const applyPairWidthResize = (
  leftWidth: number,
  rightWidth: number,
  delta: number,
): { leftWidth: number; rightWidth: number } | null => {
  const rowWidth = leftWidth + rightWidth
  const maxLeft = rowWidth - DATA_DASHBOARD_MIN_WIDTH_PX
  const minLeft = DATA_DASHBOARD_MIN_WIDTH_PX

  if (maxLeft < minLeft) return null

  const nextLeft = Math.max(minLeft, Math.min(maxLeft, leftWidth + delta))
  return {
    leftWidth: Math.round(nextLeft),
    rightWidth: Math.round(rowWidth - nextLeft),
  }
}

/** 단독 행 위젯 가로 리사이즈 (colSpan 3 등 — 컨테이너 너비 이내) */
export const applySingleWidthResize = (startWidth: number, delta: number, maxWidth: number): number | null => {
  if (maxWidth < DATA_DASHBOARD_MIN_WIDTH_PX) return null
  return Math.round(Math.max(DATA_DASHBOARD_MIN_WIDTH_PX, Math.min(maxWidth, startWidth + delta)))
}

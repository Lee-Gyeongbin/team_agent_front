import {
  buildLayoutRows,
  buildRightNeighborMap,
  resolveRowWidths,
  type LayoutRow,
} from '~/utils/dataDashboard/layoutUtil'
import type { DataDashboardLayout, DataDashboardWidget } from '~/types/data-dashboard'

/** 그리드 컨테이너 너비 관측 + 행별 위젯 너비·이웃 정보 제공 */
export const useDataDashboardGridLayout = (
  widgetList: Ref<DataDashboardWidget[]>,
  layoutMap: Ref<Record<string, DataDashboardLayout>>,
) => {
  const gridRef = ref<HTMLElement | null>(null)
  const containerWidth = ref(0)

  const layoutRows = computed<LayoutRow[]>(() => buildLayoutRows(widgetList.value))

  const rightNeighborMap = computed(() => buildRightNeighborMap(layoutRows.value))

  const resolvedWidthMap = computed<Record<string, number>>(() => {
    if (containerWidth.value <= 0) return {}
    const map: Record<string, number> = {}
    for (const row of layoutRows.value) {
      Object.assign(map, resolveRowWidths(row, containerWidth.value, layoutMap.value))
    }
    return map
  })

  const getGridItemStyle = (widgetId: string): Record<string, string> => {
    const width = resolvedWidthMap.value[widgetId]
    if (!width) return {}
    return {
      width: `${width}px`,
      flex: '0 0 auto',
      maxWidth: '100%',
    }
  }

  const soloWidgetIds = computed(() => {
    const ids = new Set<string>()
    for (const row of layoutRows.value) {
      if (row.items.length === 1) ids.add(row.items[0].widget.widgetId)
    }
    return ids
  })

  const hasRightNeighbor = (widgetId: string): boolean => rightNeighborMap.value.has(widgetId)

  const getRightNeighborId = (widgetId: string): string | null => rightNeighborMap.value.get(widgetId) ?? null

  /** 같은 행에 위젯이 혼자일 때 (colSpan 3 등) */
  const isSoloInRow = (widgetId: string): boolean => soloWidgetIds.value.has(widgetId)

  /** 가로 리사이즈 가능 — 이웃 있음 또는 단독 행 */
  const canResizeWidth = (widgetId: string): boolean => hasRightNeighbor(widgetId) || isSoloInRow(widgetId)

  let resizeObserver: ResizeObserver | null = null

  const observeGridWidth = () => {
    if (!import.meta.client || !gridRef.value) return

    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(([entry]) => {
      containerWidth.value = Math.round(entry.contentRect.width)
    })
    resizeObserver.observe(gridRef.value)
    containerWidth.value = Math.round(gridRef.value.clientWidth)
  }

  onMounted(() => {
    nextTick(observeGridWidth)
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  watch(gridRef, () => {
    nextTick(observeGridWidth)
  })

  return {
    gridRef,
    containerWidth,
    layoutRows,
    resolvedWidthMap,
    getGridItemStyle,
    hasRightNeighbor,
    getRightNeighborId,
    isSoloInRow,
    canResizeWidth,
  }
}

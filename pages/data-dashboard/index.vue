<template>
  <div class="data-dashboard-page l-center">
    <!-- ===== 툴바 ===== -->
    <div class="data-dashboard-toolbar">
      <h1 class="page-title">My Dashboard</h1>

      <div class="toolbar-btn-group">
        <UiButton @click="openAddModal">
          <template #icon-left>
            <i class="icon-plus size-16" />
          </template>
          위젯 추가
        </UiButton>
      </div>
    </div>

    <!-- ===== GridStack 위젯 영역 ===== -->
    <div class="data-dashboard-grid-wrap">
      <div
        ref="gridEl"
        class="grid-stack"
      >
        <div
          v-for="widget in widgetList"
          :key="widget.widgetId"
          class="grid-stack-item"
          :gs-id="widget.widgetId"
          :gs-x="getWidgetLayout(widget.widgetId).x"
          :gs-y="getWidgetLayout(widget.widgetId).y"
          :gs-w="getWidgetLayout(widget.widgetId).w"
          :gs-h="getWidgetLayout(widget.widgetId).h"
          :gs-min-w="getWidgetLayout(widget.widgetId).minW ?? 2"
          :gs-max-w="getWidgetLayout(widget.widgetId).maxW ?? 6"
          :gs-min-h="getWidgetLayout(widget.widgetId).minH ?? 2"
          :gs-max-h="getWidgetLayout(widget.widgetId).maxH ?? 12"
        >
          <div class="grid-stack-item-content">
            <DataDashboardWidget
              :widget="widget"
              :state="getWidgetState(widget.widgetId)"
              :code-map="getWidgetCodeMap(widget.widgetId)"
              :col-nm-map="getWidgetColNmMap(widget.widgetId)"
              :is-edit-mode="true"
              @execute="onExecute"
              @reset-filters="onResetFilters"
              @delete="onDeleteWidget"
              @change-viz-type="onChangeVizType"
              @filter-toggle="onFilterToggle"
              @filter-height-px="onFilterHeightPx"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 위젯 없을 때 ===== -->
    <div
      v-if="widgetList.length === 0"
      class="data-dashboard-empty"
    >
      <UiEmpty
        icon="icon-chart"
        title="위젯이 없습니다."
        description="TextToSQL로 생성한 SQL을 위젯으로 추가해 대시보드를 구성하세요."
      />
    </div>

    <!-- ===== 위젯 추가 모달 ===== -->
    <DataDashboardWidgetAddModal
      :is-open="isAddModalOpen"
      @close="closeAddModal"
      @save="onSaveWidget"
    />
  </div>
</template>

<script setup lang="ts">
import { useDataDashboardStore } from '~/composables/data-dashboard/useDataDashboardStore'
import {
  useDataDashboardGridStack,
  GS_DEFAULT_LAYOUT,
  GS_CELL_HEIGHT,
} from '~/composables/data-dashboard/useDataDashboardGridStack'
import type { DataDashboardLayout, DataDashboardVizType, DataDashboardWidget } from '~/types/data-dashboard'

definePageMeta({ layout: 'default' })

const {
  widgetList,
  layoutMap,
  isAddModalOpen,
  handleSelectWidgetList,
  handleExecuteSql,
  handleUpdateFilterValues,
  handleResetFilterValues,
  handleSaveWidget,
  handleDeleteWidget,
  handleChangeVizType,
  handleSaveLayout,
  getWidgetState,
  getWidgetLayout,
  getWidgetCodeMap,
  getWidgetColNmMap,
  openAddModal,
  closeAddModal,
} = useDataDashboardStore()

const {
  gridEl,
  initGrid,
  destroyGrid,
  addWidget,
  removeWidget,
  getNextWidgetPosition,
  getGridNodes,
  onGridChange,
  onDragStop,
  onResizeStop,
  updateWidgetH,
} = useDataDashboardGridStack()

// ===== 필터 확장 상태 추적 =====
// widgetId → 필터 열기 전 원래 GridStack h 값
// 드래그·리사이즈 저장(autoSaveLayout) 시 이 값으로 복원하여 확장 높이가 DB에 저장되지 않도록 보호
const filterOriginalH = new Map<string, number>()

/** 필터 확장 중 GridStack change 이벤트로 layoutMap이 오염되지 않도록 억제 플래그 */
let filterAdjusting = false

// 디바운스 타이머 (ResizeObserver 다중 호출 방지)
let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ===== GridStack 초기화 =====

/**
 * 드래그/리사이즈 완료 시 현재 GridStack 상태를 DB에 자동 저장 (토스트 없음)
 * 필터가 열린 위젯은 filterOriginalH의 원래 높이로 저장하여 확장 높이가 유지되지 않도록 보호.
 */
const autoSaveLayout = async () => {
  const nodes = getGridNodes()
  const layouts: DataDashboardLayout[] = nodes
    .filter((node) => node.id)
    .map((node, idx) => ({
      ...(layoutMap.value[node.id as string] ?? {}),
      widgetId: node.id as string,
      sortOrd: idx + 1,
      x: node.x ?? 0,
      y: node.y ?? 0,
      w: node.w ?? GS_DEFAULT_LAYOUT.w,
      // 필터 열린 위젯 → 원래 h로 저장 (필터 확장 높이 저장 방지)
      h: filterOriginalH.get(node.id as string) ?? node.h ?? GS_DEFAULT_LAYOUT.h,
      isVisible: true,
    }))
  await handleSaveLayout(layouts)
}

// ===== 필터 토글 핸들러 =====

/**
 * 필터 열기: 원래 h 저장, GridStack 높이는 filter-height-px 이벤트에서 동적 조정
 * 필터 닫기: 원래 h로 복원
 */
const onFilterToggle = (widgetId: string, isOpen: boolean) => {
  const el = gridEl.value?.querySelector(`.grid-stack-item[gs-id="${widgetId}"]`) as HTMLElement | null
  if (!el) return

  if (isOpen) {
    const origH = layoutMap.value[widgetId]?.h ?? GS_DEFAULT_LAYOUT.h
    filterOriginalH.set(widgetId, origH)
  } else {
    const origH = filterOriginalH.get(widgetId)
    if (origH !== undefined) {
      filterAdjusting = true
      updateWidgetH(el, origH)
      filterAdjusting = false
      filterOriginalH.delete(widgetId)
    }
  }
}

/**
 * 필터 DOM 높이(px) 변경 시 GridStack 높이를 동적으로 조정
 * 원래 높이 + 필터 높이에 해당하는 셀 수만큼 확장 (소수점 올림 + 1버퍼)
 */
const onFilterHeightPx = (widgetId: string, filterHeightPx: number) => {
  if (!filterOriginalH.has(widgetId)) return
  if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
  filterDebounceTimer = setTimeout(() => {
    const el = gridEl.value?.querySelector(`.grid-stack-item[gs-id="${widgetId}"]`) as HTMLElement | null
    if (!el) return
    const origH = filterOriginalH.get(widgetId)
    if (origH === undefined) return
    const extraUnits = Math.ceil(filterHeightPx / GS_CELL_HEIGHT) + 1
    filterAdjusting = true
    updateWidgetH(el, origH + extraUnits)
    filterAdjusting = false
  }, 80)
}

onMounted(async () => {
  await handleSelectWidgetList()
  await nextTick()

  // layoutMap 기반 gs-* 속성이 Vue에 의해 이미 DOM에 반영된 후 init 호출 →
  // GridStack이 gs-x/y/w/h 속성을 직접 읽어 위치를 복원하므로 별도의 applyLayout 불필요.
  initGrid()

  // GridStack change 이벤트 — layoutMap 로컬 동기화
  // filterAdjusting 중 (필터 확장/복원 시)에는 layoutMap을 덮어쓰지 않음
  onGridChange((nodes) => {
    if (filterAdjusting) return
    for (const node of nodes) {
      const id = node.id as string
      if (!id) continue
      layoutMap.value[id] = {
        ...(layoutMap.value[id] ?? {}),
        widgetId: id,
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? GS_DEFAULT_LAYOUT.w,
        h: node.h ?? GS_DEFAULT_LAYOUT.h,
        isVisible: true,
      }
    }
  })

  // 드래그 완료·리사이즈 완료 시 자동 저장
  onDragStop(() => autoSaveLayout())
  onResizeStop(() => autoSaveLayout())
})

onBeforeUnmount(() => {
  destroyGrid()
})

// ===== 이벤트 핸들러 =====

// SQL 실행
const onExecute = async (widgetId: string, filterValues: Record<string, string>) => {
  handleUpdateFilterValues(widgetId, filterValues)
  await handleExecuteSql(widgetId)
}

// 필터 초기값 복원
const onResetFilters = (widgetId: string) => {
  handleResetFilterValues(widgetId)
}

// 시각화 유형 변경 (로컬)
const onChangeVizType = (widgetId: string, vizType: DataDashboardVizType) => {
  handleChangeVizType(widgetId, vizType)
}

/**
 * 위젯 삭제
 *
 * Vue v-for로 DOM이 제거되기 전에 GridStack 엔진에서 먼저 제거·압축해야
 * 삭제 직후 빈 공간이 남지 않는다. (새로고침 시 initGrid가 재계산하므로 그때는 정상)
 */
const onDeleteWidget = async (widgetId: string) => {
  const el = gridEl.value?.querySelector(`.grid-stack-item[gs-id="${widgetId}"]`) as HTMLElement | null

  const deleted = await handleDeleteWidget(widgetId, {
    onBeforeListUpdate: () => {
      if (el) removeWidget(el)
      filterOriginalH.delete(widgetId)
    },
  })

  if (!deleted) return

  await nextTick()
  await autoSaveLayout()
}

/**
 * 위젯 추가 모달 저장
 *
 * [버그 수정] GridStack.init() 이후 Vue v-for로 새로 추가된 DOM 요소는
 * GridStack이 자동으로 인식하지 않는다. 저장 후 새 요소를 찾아
 * addWidget(el) → grid.makeWidget(el) 으로 명시적으로 등록해야
 * 올바른 크기·위치로 그리드에 배치된다.
 */
const onSaveWidget = async (data: Partial<DataDashboardWidget>) => {
  // 추가 전 기존 widgetId 목록 기록
  const prevIds = new Set(widgetList.value.map((w) => w.widgetId))

  await handleSaveWidget(data)
  await nextTick()

  // 새로 추가된 위젯 요소를 GridStack에 등록
  const newWidget = widgetList.value.find((w) => !prevIds.has(w.widgetId))
  if (newWidget && gridEl.value) {
    const el = gridEl.value.querySelector(`.grid-stack-item[gs-id="${newWidget.widgetId}"]`) as HTMLElement | null
    if (el) {
      const layout = getWidgetLayout(newWidget.widgetId)
      const { x, y } = getNextWidgetPosition(layout.w)
      addWidget(el, { x, y, w: layout.w, h: layout.h })
      await autoSaveLayout()
    }
  }
}
</script>

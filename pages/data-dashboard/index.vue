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
              :is-edit-mode="true"
              @execute="onExecute"
              @reset-filters="onResetFilters"
              @delete="handleDeleteWidget"
              @change-viz-type="onChangeVizType"
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
import { useDataDashboardGridStack, GS_DEFAULT_LAYOUT } from '~/composables/data-dashboard/useDataDashboardGridStack'
import type { DataDashboardLayout, DataDashboardVizType } from '~/types/data-dashboard'

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
  openAddModal,
  closeAddModal,
} = useDataDashboardStore()


const { gridEl, initGrid, destroyGrid, addWidget, getGridNodes, onGridChange, onDragStop, onResizeStop } =
  useDataDashboardGridStack()

// ===== GridStack 초기화 =====

/**
 * 드래그/리사이즈 완료 시 현재 GridStack 상태를 DB에 자동 저장 (토스트 없음)
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
      h: node.h ?? GS_DEFAULT_LAYOUT.h,
      isVisible: true,
    }))
  await handleSaveLayout(layouts)
}

onMounted(async () => {
  await handleSelectWidgetList()
  await nextTick()

  // layoutMap 기반 gs-* 속성이 Vue에 의해 이미 DOM에 반영된 후 init 호출 →
  // GridStack이 gs-x/y/w/h 속성을 직접 읽어 위치를 복원하므로 별도의 applyLayout 불필요.
  initGrid()

  // GridStack change 이벤트 — layoutMap 로컬 동기화
  onGridChange((nodes) => {
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
    const el = gridEl.value.querySelector(
      `.grid-stack-item[gs-id="${newWidget.widgetId}"]`,
    ) as HTMLElement | null
    if (el) {
      const layout = getWidgetLayout(newWidget.widgetId)
      // x/y 미지정 → float:false 이므로 GridStack이 빈 공간을 찾아 자동 배치
      addWidget(el, { w: layout.w, h: layout.h })
    }
  }
}
</script>

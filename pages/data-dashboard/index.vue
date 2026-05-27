<template>
  <div class="data-dashboard-page l-center">
    <!-- 툴바 -->
    <div class="data-dashboard-toolbar">
      <h1 class="page-title">My Dashboard</h1>
      <UiButton @click="openAddModal">
        <template #icon-left>
          <i class="icon-plus size-16" />
        </template>
        위젯 추가
      </UiButton>
    </div>

    <!-- 위젯 그리드 -->
    <div
      ref="gridRef"
      class="data-dashboard-grid-wrap"
    >
      <draggable
        v-model="widgetList"
        class="data-dashboard-grid"
        item-key="widgetId"
        handle=".widget-drag-handle"
        animation="200"
        :scroll="false"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div
            class="data-dashboard-grid-item"
            :class="[`col-span-${element.colSpan}`, { 'has-custom-width': getWidgetWidthPx(element.widgetId) != null }]"
            :style="getItemStyle(element.widgetId)"
            :data-widget-id="element.widgetId"
          >
            <DataDashboardWidget
              :widget="element"
              :state="getWidgetState(element.widgetId)"
              :code-map="getWidgetCodeMap(element.widgetId)"
              :height-px="getWidgetHeightPx(element.widgetId)"
              :width-px="getWidgetWidthPx(element.widgetId)"
              :has-right-neighbor="hasRightNeighbor(element.widgetId)"
              :right-neighbor-id="getRightNeighborId(element.widgetId)"
              :is-solo-in-row="isSoloInRow(element.widgetId)"
              :can-resize-width="canResizeWidth(element.widgetId)"
              :container-width="containerWidth"
              @execute="onExecute"
              @reset-filters="onResetFilters"
              @delete="handleDeleteWidget"
              @change-viz-type="onChangeVizType"
              @update-height="onUpdateHeight"
              @reset-height="onResetHeight"
              @update-width-pair="onUpdateWidthPair"
              @update-width="onUpdateWidth"
              @reset-layout="onResetLayout"
              @width-resize-active="onWidthResizeActive"
              @width-resize-done="onWidthResizeDone"
            />
          </div>
        </template>
      </draggable>
    </div>

    <!-- 위젯 없을 때 -->
    <div
      v-if="widgetList.length === 0"
      class="data-dashboard-empty"
    >
      <UiEmpty
        icon="icon-chart"
        title="위젯이 없습니다."
        description="TextToSQL로 생성한 SQL을 위젯으로 추가해 대시보드를 구성하세요."
      >
      </UiEmpty>
    </div>

    <!-- 위젯 추가 모달 -->
    <DataDashboardWidgetAddModal
      :is-open="isAddModalOpen"
      @close="closeAddModal"
      @save="onSaveWidget"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { DataDashboardWidget, DataDashboardWidgetState, DataDashboardVizType } from '~/types/data-dashboard'
import { useDataDashboardStore } from '~/composables/data-dashboard/useDataDashboardStore'
import { useDataDashboardGridLayout } from '~/composables/data-dashboard/useDataDashboardGridLayout'
import { useDashboardDragAutoScroll } from '~/composables/data-dashboard/useDashboardDragAutoScroll'

definePageMeta({ layout: 'default' })

const {
  widgetList,
  widgetStates,
  layoutMap,
  isAddModalOpen,
  handleSelectWidgetList,
  handleExecuteSql,
  handleUpdateFilterValues,
  handleResetFilterValues,
  handleSaveWidget,
  handleDeleteWidget,
  handleSaveWidgetOrder,
  handleSaveWidgetHeight,
  handleResetWidgetHeight,
  handleSaveWidgetWidth,
  handleSaveWidgetWidthPair,
  handleResetWidgetLayout,
  getWidgetCodeMap,
  getWidgetHeightPx,
  getWidgetWidthPx,
  openAddModal,
  closeAddModal,
} = useDataDashboardStore()

const { gridRef, containerWidth, getGridItemStyle, hasRightNeighbor, getRightNeighborId, isSoloInRow, canResizeWidth } =
  useDataDashboardGridLayout(widgetList, layoutMap)

/** 가로 리사이즈 중인 위젯 — :style 재적용으로 드래그 너비가 덮이지 않도록 제외 */
const widthResizingWidgetIds = ref<Set<string>>(new Set())

const getItemStyle = (widgetId: string) => {
  if (widthResizingWidgetIds.value.has(widgetId)) return {}
  return getGridItemStyle(widgetId)
}

const onWidthResizeActive = (leftWidgetId: string, rightWidgetId: string | null) => {
  const ids = rightWidgetId ? [leftWidgetId, rightWidgetId] : [leftWidgetId]
  widthResizingWidgetIds.value = new Set(ids)
}

const onWidthResizeDone = () => {
  widthResizingWidgetIds.value = new Set()
}

const { startDragAutoScroll, stopDragAutoScroll } = useDashboardDragAutoScroll()

// 위젯 상태 조회 (없으면 기본값 반환)
const defaultState: DataDashboardWidgetState = {
  filterValues: {},
  result: null,
  loading: false,
  error: null,
}
const getWidgetState = (widgetId: string): DataDashboardWidgetState => {
  return widgetStates.value[widgetId] ?? defaultState
}

// SQL 실행
const onExecute = async (widgetId: string, filterValues: Record<string, string>) => {
  handleUpdateFilterValues(widgetId, filterValues)
  await handleExecuteSql(widgetId)
}

// 필터값 TTSQ 초기값 복원 (실행 없음)
const onResetFilters = (widgetId: string) => {
  handleResetFilterValues(widgetId)
}

// 시각화 유형 변경 (저장 없이 로컬 상태만 변경 — 다른 유형으로 재렌더링)
const onChangeVizType = (widgetId: string, vizType: DataDashboardVizType) => {
  const idx = widgetList.value.findIndex((w) => w.widgetId === widgetId)
  if (idx === -1) return
  widgetList.value[idx] = { ...widgetList.value[idx], vizType }
}

// 위젯 추가 저장 (목록 갱신 + 전체 차트 재조회는 store에서 처리)
const onSaveWidget = async (data: Partial<DataDashboardWidget>) => {
  await handleSaveWidget(data)
}

/** 드래그 시작 시 현재 너비 고정 — Sortable transform 중 콘텐츠가 그리드를 밀어내는 것 방지 */
const onDragStart = (evt: { item: HTMLElement }) => {
  const el = evt.item
  const { width } = el.getBoundingClientRect()
  el.style.width = `${width}px`
  el.style.maxWidth = `${width}px`
  el.style.flex = '0 0 auto'
  startDragAutoScroll(el)
}

/** 드래그 종료 시 인라인 너비 제거 후 순서 저장 */
const onDragEnd = (evt: { item: HTMLElement }) => {
  stopDragAutoScroll()
  const el = evt.item
  el.style.width = ''
  el.style.maxWidth = ''
  el.style.flex = ''
  handleSaveWidgetOrder()
}

// 높이 변경 저장
const onUpdateHeight = (widgetId: string, heightPx: number) => {
  handleSaveWidgetHeight(widgetId, heightPx)
}

// 높이 초기화
const onResetHeight = (widgetId: string) => {
  handleResetWidgetHeight(widgetId)
}

// 가로 너비 쌍 저장 (인접 위젯)
const onUpdateWidthPair = (leftWidgetId: string, leftWidthPx: number, rightWidgetId: string, rightWidthPx: number) => {
  handleSaveWidgetWidthPair(leftWidgetId, leftWidthPx, rightWidgetId, rightWidthPx)
}

// 가로 너비 단독 저장 (colSpan 3 등)
const onUpdateWidth = (widgetId: string, widthPx: number) => {
  handleSaveWidgetWidth(widgetId, widthPx)
}

// 크기 초기화 (colSpan 1 · 높이 320px · widthPx null)
const onResetLayout = (widgetId: string) => {
  handleResetWidgetLayout(widgetId)
}

onMounted(() => {
  handleSelectWidgetList()
})
</script>

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
    <draggable
      v-model="widgetList"
      class="data-dashboard-grid"
      item-key="widgetId"
      handle=".widget-drag-handle"
      animation="200"
      @end="onDragEnd"
    >
      <template #item="{ element }">
        <DataDashboardWidget
          :widget="element"
          :state="getWidgetState(element.widgetId)"
          :code-map="getWidgetCodeMap(element.widgetId)"
          @execute="onExecute"
          @delete="handleDeleteWidget"
          @resize="handleResizeWidget"
          @change-viz-type="onChangeVizType"
        />
      </template>
    </draggable>

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

definePageMeta({ layout: 'default' })

const {
  widgetList,
  widgetStates,
  isAddModalOpen,
  handleSelectWidgetList,
  handleExecuteSql,
  handleUpdateFilterValues,
  handleSaveWidget,
  handleDeleteWidget,
  handleResizeWidget,
  handleSaveWidgetOrder,
  getWidgetCodeMap,
  openAddModal,
  closeAddModal,
} = useDataDashboardStore()

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

// 드래그 순서 저장
const onDragEnd = () => {
  handleSaveWidgetOrder()
}

onMounted(() => {
  handleSelectWidgetList()
})
</script>

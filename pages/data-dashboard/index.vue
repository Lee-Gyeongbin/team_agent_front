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
        <UiButton
          variant="primary-line"
          @click="openAddModal"
        >
          위젯 추가하기
        </UiButton>
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

// 시각화 유형 변경
const onChangeVizType = async (widgetId: string, vizType: DataDashboardVizType) => {
  const widget = widgetList.value.find((w) => w.widgetId === widgetId)
  if (!widget) return
  widget.vizType = vizType
  await handleSaveWidget({ widgetId, vizType })
}

// 위젯 추가 저장
const onSaveWidget = async (data: Partial<DataDashboardWidget>) => {
  const saved = await handleSaveWidget(data)
  if (saved) {
    closeAddModal()
    await handleExecuteSql(saved.widgetId)
  }
}

// 드래그 순서 저장
const onDragEnd = () => {
  handleSaveWidgetOrder()
}

onMounted(async () => {
  await handleSelectWidgetList()
  // 초기 로드 시 모든 위젯 일괄 조회
  for (const widget of widgetList.value) {
    handleExecuteSql(widget.widgetId)
  }
})
</script>

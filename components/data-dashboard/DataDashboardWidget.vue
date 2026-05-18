<template>
  <div
    class="dashboard-widget"
    :class="[`col-span-${widget.colSpan}`, { 'is-filter-open': isFilterOpen }]"
  >
    <!-- 헤더 -->
    <div class="widget-header">
      <div class="widget-header-left">
        <i class="icon-move-handle size-18 widget-drag-handle" />
        <span class="widget-title">{{ widget.title }}</span>
        <span class="widget-sql-badge">{{ widget.sqlTitle }}</span>
      </div>
      <div class="widget-header-actions">
        <!-- 필터 토글 (변수 있을 때만) -->
        <button
          v-if="widget.variables.length"
          class="btn btn-widget-action"
          :class="{ 'is-active': isFilterOpen }"
          title="필터"
          @click="isFilterOpen = !isFilterOpen"
        >
          <i class="icon-sliders size-16" />
        </button>
        <!-- 너비 전환 -->
        <button
          class="btn btn-widget-action"
          :title="widget.colSpan === 2 ? '절반 너비' : '전체 너비'"
          @click="$emit('resize', widget.widgetId, widget.colSpan === 2 ? 1 : 2)"
        >
          <i
            :class="widget.colSpan === 2 ? 'icon-collapse' : 'icon-expand'"
            class="size-16"
          />
        </button>
        <!-- 새로고침 -->
        <button
          class="btn btn-widget-action"
          title="새로고침"
          @click="onExecute"
        >
          <i class="icon-refresh size-16" />
        </button>
        <!-- 시각화 유형 변경 -->
        <UiDropdownMenu
          :items="vizTypeMenuItems"
          @select="onChangeVizType"
        >
          <template #trigger>
            <button
              class="btn btn-widget-action"
              title="시각화 변경"
            >
              <i class="icon-chart size-16" />
            </button>
          </template>
        </UiDropdownMenu>
        <!-- 삭제 -->
        <button
          class="btn btn-widget-action type-danger"
          title="위젯 삭제"
          @click="$emit('delete', widget.widgetId)"
        >
          <i class="icon-trashcan size-16" />
        </button>
      </div>
    </div>

    <!-- 필터 영역 -->
    <transition name="widget-filter-slide">
      <div
        v-if="isFilterOpen && widget.variables.length"
        class="widget-filter"
      >
        <div class="widget-filter-fields">
          <template
            v-for="variable in widget.variables"
            :key="variable.key"
          >
            <div class="filter-field">
              <label class="filter-label">{{ variable.label }}</label>
              <!-- 셀렉트 -->
              <UiSelect
                v-if="variable.type === 'select'"
                :model-value="localFilterValues[variable.key]"
                :options="variable.options ?? []"
                size="sm"
                @update:model-value="localFilterValues[variable.key] = String($event)"
              />
              <!-- 숫자 -->
              <UiInput
                v-else-if="variable.type === 'number'"
                v-model="localFilterValues[variable.key]"
                number-only
                size="sm"
              />
              <!-- 날짜 (date/month — native input) -->
              <input
                v-else-if="variable.type === 'date' || variable.type === 'month'"
                v-model="localFilterValues[variable.key]"
                class="inp filter-date-input"
                :type="variable.type"
              />
              <!-- 텍스트 -->
              <UiInput
                v-else
                v-model="localFilterValues[variable.key]"
                size="sm"
              />
            </div>
          </template>
        </div>
        <UiButton
          size="sm"
          @click="onExecute"
        >
          조회
        </UiButton>
      </div>
    </transition>

    <!-- 콘텐츠 -->
    <div class="widget-content">
      <!-- 로딩 -->
      <UiLoading
        v-if="state.loading"
        text="조회 중..."
      />

      <!-- 에러 -->
      <UiEmpty
        v-else-if="state.error"
        icon="icon-error"
        title="조회 중 오류가 발생했습니다."
        :description="state.error"
      />

      <!-- 결과 없음 -->
      <UiEmpty
        v-else-if="state.result && state.result.rows.length === 0"
        icon="icon-search"
        title="조회 결과가 없습니다."
      />

      <!-- 차트 -->
      <div
        v-else-if="state.result && widget.vizType !== 'table'"
        class="widget-chart-wrap"
      >
        <UiChart
          :type="widget.vizType as 'bar' | 'line' | 'pie' | 'horizontalBar'"
          :config="chartConfig"
          show-legend
        />
      </div>

      <!-- 테이블 -->
      <template v-else-if="state.result && widget.vizType === 'table'">
        <UiTable
          :columns="tableColumns"
          :data="state.result.rows as Record<string, any>[]"
          max-height="280px"
          sticky-header
          size="sm"
        />
      </template>

      <!-- 초기 상태 -->
      <UiEmpty
        v-else
        icon="icon-chart"
        title="조회 버튼을 눌러 데이터를 확인하세요."
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateChartScale } from '~/utils/chat/visualizationChartUtil'
import type { DataDashboardWidget, DataDashboardWidgetState, DataDashboardVizType } from '~/types/data-dashboard'
import type { TableColumn } from '~/types/table'

interface Props {
  widget: DataDashboardWidget
  state: DataDashboardWidgetState
}

const props = defineProps<Props>()

const emit = defineEmits<{
  execute: [widgetId: string, filterValues: Record<string, string>]
  delete: [widgetId: string]
  resize: [widgetId: string, colSpan: 1 | 2]
  'change-viz-type': [widgetId: string, vizType: DataDashboardVizType]
}>()

const isFilterOpen = ref(false)

// 로컬 필터 값 (prop에서 초기화)
const localFilterValues = ref<Record<string, string>>({ ...props.state.filterValues })

watch(
  () => props.state.filterValues,
  (vals) => {
    localFilterValues.value = { ...vals }
  },
  { deep: true },
)

const onExecute = () => {
  emit('execute', props.widget.widgetId, { ...localFilterValues.value })
}

const onChangeVizType = (value: string) => {
  emit('change-viz-type', props.widget.widgetId, value as DataDashboardVizType)
}

// 시각화 유형 변경 메뉴
const vizTypeMenuItems = [
  { label: '막대 차트', value: 'bar', icon: 'icon-bar-chart' },
  { label: '라인 차트', value: 'line', icon: 'icon-line-chart' },
  { label: '파이 차트', value: 'pie', icon: 'icon-pie-chart' },
  { label: '가로 막대', value: 'horizontalBar', icon: 'icon-bar-chart' },
  { label: '테이블', value: 'table', icon: 'icon-sql' },
]

// ===== 테이블 컬럼 자동 생성 =====
const tableColumns = computed<TableColumn[]>(() => {
  if (!props.state.result) return []
  return props.state.result.columns.map((col) => ({
    key: col,
    label: col,
    sortable: true,
    sortType: 'auto' as const,
    align: 'center' as const,
  }))
})

// ===== 차트 config 자동 빌드 =====
const chartConfig = computed(() => {
  const result = props.state.result
  const { vizConfig, vizType } = props.widget

  if (!result || !result.rows.length) return {}

  const { columns, rows } = result

  // 파이 차트
  if (vizType === 'pie') {
    const labelKey = vizConfig.labelKey || columns[0]
    const valueKey = vizConfig.valueKey || columns[1] || columns[0]
    return {
      items: rows.map((r) => ({
        name: String(r[labelKey] ?? ''),
        value: Number(r[valueKey]) || 0,
      })),
      style: 'regionRatio',
      type: 'outerLabel',
    }
  }

  const xKey = vizConfig.xAxisKey || columns[0]
  const yKeys = vizConfig.yAxisKeys?.length ? vizConfig.yAxisKeys : columns.filter((c) => c !== xKey)

  const categories = rows.map((r) => String(r[xKey] ?? ''))

  // 가로 막대
  if (vizType === 'horizontalBar') {
    const yKey = yKeys[0]
    const values = rows.map((r) => Number(r[yKey]) || 0)
    const scale = calculateChartScale(values, 0.1, false)
    return {
      categories,
      data: values,
      colorKey: 'bar.set1',
      colorIndex: 0,
      maxValue: scale.max,
    }
  }

  // 라인 차트
  if (vizType === 'line') {
    const values = yKeys.flatMap((k) => rows.map((r) => Number(r[k]) || 0))
    const scale = calculateChartScale(values, 0.1, false)
    return {
      categories,
      datasets: yKeys.map((key, idx) => ({
        label: key,
        data: rows.map((r) => Number(r[key]) || 0),
        colorKey: idx === 0 ? 'line.primary' : 'line.success',
      })),
      maxValue: scale.max,
      minValue: scale.min,
      yAxisStepSize: scale.stepSize,
    }
  }

  // 막대 차트 (기본)
  const values = yKeys.flatMap((k) => rows.map((r) => Number(r[k]) || 0))
  const scale = calculateChartScale(values, 0.1, false)

  if (yKeys.length === 1) {
    return {
      categories,
      data: rows.map((r) => Number(r[yKeys[0]]) || 0),
      colorKey: 'bar.set1',
      colorIndex: 0,
      maxValue: scale.max,
      showDataLabels: false,
    }
  }

  return {
    categories,
    datasets: yKeys.map((key, idx) => ({
      label: key,
      data: rows.map((r) => Number(r[key]) || 0),
      colorKey: 'bar.set1',
      colorIndex: idx,
    })),
    maxValue: scale.max,
  }
})
</script>

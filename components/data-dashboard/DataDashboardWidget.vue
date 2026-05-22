<template>
  <div
    ref="widgetEl"
    class="dashboard-widget"
    :class="[`col-span-${widget.colSpan}`, { 'is-filter-open': isFilterOpen, 'is-resizing': isResizing }]"
  >
    <!-- 헤더 -->
    <div class="widget-header">
      <div class="widget-header-left">
        <i class="icon-move-handle size-20 widget-drag-handle" />
        <UiTooltip
          v-if="widget.sqlTitle"
          side="bottom"
          align="start"
          :delay-duration="150"
          content-class="widget-sql-query-tooltip"
        >
          <button
            type="button"
            class="btn btn-widget-action widget-sql-query-btn"
            :aria-label="`사용자 질의: ${widget.sqlTitle}`"
          >
            <i class="icon-comment-other size-16" />
          </button>
          <template #content>
            {{ widget.sqlTitle }}
          </template>
        </UiTooltip>
        <span class="widget-title">{{ widget.title }}</span>
      </div>
      <div class="widget-header-actions">
        <!-- 필터 토글 (변수 있을 때만) -->
        <button
          v-if="enrichedVariables.length"
          class="btn btn-widget-action"
          :class="{ 'is-active': isFilterOpen }"
          title="필터"
          @click="isFilterOpen = !isFilterOpen"
        >
          <i class="icon-sliders size-16" />
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
        <!-- 너비 전환 (절반 ↔ 전체) -->
        <button
          class="btn btn-widget-action"
          :title="widget.colSpan === 2 ? '절반 너비로' : '전체 너비로'"
          @click="$emit('resize', widget.widgetId, widget.colSpan === 2 ? 1 : 2)"
        >
          <i
            :class="widget.colSpan === 2 ? 'icon-collapse' : 'icon-expand'"
            class="size-16"
          />
        </button>
        <!-- 높이 기본값으로 초기화 -->
        <button
          v-if="localHeightPx !== DEFAULT_HEIGHT"
          class="btn btn-widget-action"
          title="높이 초기화 (320px)"
          @click="onResetHeight"
        >
          <i class="icon-resize-height size-16" />
        </button>
        <!-- 새로고침 -->
        <button
          class="btn btn-widget-action"
          title="새로고침"
          @click="onExecute"
        >
          <i class="icon-refresh size-16" />
        </button>

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
        v-if="isFilterOpen && enrichedVariables.length"
        class="widget-filter"
      >
        <div class="widget-filter-main">
          <div class="widget-filter-fields">
            <template
              v-for="variable in enrichedVariables"
              :key="variable.key"
            >
              <div
                class="filter-field"
                :class="variable.type === 'select' ? 'filter-field--select' : 'filter-field--compact'"
              >
                <label class="filter-label">{{ variable.label }}</label>
                <!-- 멀티셀렉트 (코드맵 기반 변수) -->
                <UiMultiSelect
                  v-if="variable.type === 'select' && variable.multiple"
                  :model-value="(localFilterValues[variable.key] || '').split(',').filter(Boolean)"
                  :options="variable.options ?? []"
                  size="sm"
                  @update:model-value="localFilterValues[variable.key] = $event.join(',')"
                />
                <!-- 단일 셀렉트 -->
                <UiSelect
                  v-else-if="variable.type === 'select'"
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
          <div class="widget-filter-actions">
            <UiButton
              variant="outline"
              size="sm"
              icon-only
              class="widget-filter-reset"
              title="초기값 복원"
              aria-label="초기값 복원"
              @click="onResetFilters"
            >
              <template #icon-left>
                <i class="icon-refresh size-16" />
              </template>
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              icon-only
              class="widget-filter-execute"
              title="실행"
              aria-label="조회 실행"
              @click="onExecute"
            >
              <template #icon-left>
                <i class="icon-play size-16" />
              </template>
            </UiButton>
          </div>
        </div>

        <!-- 실행 SQL 미리보기 -->
        <div
          v-if="previewSql"
          class="widget-filter-sql-preview"
        >
          <div class="widget-filter-sql-header">
            <span class="filter-label">실행 SQL</span>
            <button
              type="button"
              class="btn btn-widget-action widget-filter-sql-copy"
              title="SQL 복사"
              @click="onCopyPreviewSql"
            >
              <i class="icon-copy size-16" />
            </button>
          </div>
          <pre class="widget-filter-sql-code">{{ previewSql }}</pre>
        </div>
      </div>
    </transition>

    <!-- 콘텐츠 — 필터는 이 밖에 있어서 필터 열릴 때 위젯 전체가 늘어남 -->
    <!-- height로 콘텐츠 영역 고정 — 차트·테이블은 내부 flex로 동일 높이에 맞춤 -->
    <div
      ref="contentEl"
      class="widget-content"
      :style="{ height: `${localHeightPx}px` }"
    >
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

      <!-- 차트 — padding 제외 높이 명시 (chart.js는 마운트 시 부모 height 필요) -->
      <div
        v-else-if="state.result && widget.vizType !== 'table'"
        class="widget-chart-wrap"
        :style="{ height: `${chartBodyHeightPx}px` }"
      >
        <UiChart
          :key="`${widget.widgetId}-${chartBodyHeightPx}-${chartVizType}`"
          :type="chartVizType"
          :config="chartConfig"
          show-legend
        />
      </div>

      <!-- 테이블 -->
      <div
        v-else-if="state.result && widget.vizType === 'table'"
        class="widget-table-wrap"
        :style="{ height: `${chartBodyHeightPx}px` }"
      >
        <UiTable
          :columns="tableColumns"
          :data="displayRows"
          :max-height="`${chartBodyHeightPx}px`"
          sticky-header
          size="sm"
        />
      </div>

      <!-- 초기 상태 -->
      <UiEmpty
        v-else
        icon="icon-chart"
        title="조회 버튼을 눌러 데이터를 확인하세요."
      />
    </div>

    <!-- 우측 하단 리사이즈 핸들 -->
    <div
      class="widget-resize-handle"
      @mousedown.prevent.stop="onResizeStart"
    />
  </div>
</template>

<script setup lang="ts">
import { substituteWhereValues } from '~/utils/dataDashboard/ttsqParamParser'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import { formatSql } from '~/utils/global/codeUtil'
import {
  parseVizConfig,
  resolveColumnKey,
  getRowValue,
  buildPositiveYScale,
  buildDualAxisScales,
  buildRawCategories,
  buildCategoryLabels,
  buildAggregatedValueMap,
  resolveChartAxisMapping,
} from '~/utils/dataDashboard/vizConfigUtil'
import { DATA_DASHBOARD_DEFAULT_HEIGHT_PX } from '~/composables/data-dashboard/useDataDashboardStore'
import type {
  DataDashboardWidget,
  DataDashboardWidgetState,
  DataDashboardVizType,
  ColCodeMap,
} from '~/types/data-dashboard'
import type { TableColumn } from '~/types/table'

interface Props {
  widget: DataDashboardWidget
  state: DataDashboardWidgetState
  codeMap?: ColCodeMap
  heightPx?: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  execute: [widgetId: string, filterValues: Record<string, string>]
  'reset-filters': [widgetId: string]
  delete: [widgetId: string]
  resize: [widgetId: string, colSpan: 1 | 2]
  'change-viz-type': [widgetId: string, vizType: DataDashboardVizType]
  'update-height': [widgetId: string, heightPx: number]
  'reset-height': [widgetId: string]
}>()

const isFilterOpen = ref(false)

/**
 * codeMap에 해당 변수 키가 있으면 select 타입 + "코드명 (코드)" 옵션으로 보강.
 * 없으면 원본 그대로 반환.
 */
const enrichedVariables = computed<typeof props.widget.variables>(() => {
  const map = props.codeMap
  return props.widget.variables.map((v) => {
    const codes = map?.[v.key.toUpperCase()]
    if (!codes || Object.keys(codes).length === 0) return v
    // 코드맵 있는 변수 → 멀티셀렉트 (전체 옵션 제외, 체크박스로 전체 선택 처리)
    const options = Object.entries(codes).map(([code, name]) => ({ label: `${name} (${code})`, value: code }))
    return { ...v, type: 'select' as const, multiple: true, options }
  })
})

// 로컬 필터 값 (prop에서 초기화)
const localFilterValues = ref<Record<string, string>>({ ...props.state.filterValues })

watch(
  () => props.state.filterValues,
  (vals) => {
    localFilterValues.value = { ...vals }
  },
  { deep: true },
)

/** COL_ID + 코드값을 코드명으로 치환. 매핑 없으면 원본 반환 */
const resolveCode = (colKey: string, val: unknown): string => {
  const text = String(val ?? '')
  if (!props.codeMap) return text
  return props.codeMap[colKey.toUpperCase()]?.[text] ?? text
}

/** 테이블/차트에 사용할 코드명 치환된 rows */
const displayRows = computed<Record<string, unknown>[]>(() => {
  const rows = props.state.result?.rows ?? []
  if (!props.codeMap) return rows as Record<string, unknown>[]
  return rows.map((row) => {
    const mapped: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(row as Record<string, unknown>)) {
      mapped[key] = resolveCode(key, val)
    }
    return mapped
  })
})

/**
 * 실제 API 전송용 필터값.
 * 멀티셀렉트(코드변수)는 쉼표 구분 문자열로 직렬화.
 * 아무것도 선택 안 했거나 전체 선택이면 → 모든 코드값 전송 (원본 IN 절 유지).
 */
const resolvedFilterValues = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {}
  for (const v of enrichedVariables.value) {
    const raw = localFilterValues.value[v.key] ?? ''
    if (v.multiple && v.options) {
      const allCodes = v.options.map((o) => o.value)
      const selected = raw ? raw.split(',').filter(Boolean) : []
      result[v.key] = selected.length === 0 ? allCodes.join(',') : raw
    } else {
      result[v.key] = raw
    }
  }
  return result
})

/** 현재 필터값으로 WHERE 조건을 치환한 포맷팅된 SQL 미리보기 */
const previewSql = computed<string>(() => {
  const sql = props.widget.sqlContent
  if (!sql) return ''
  const substituted = substituteWhereValues(sql, resolvedFilterValues.value)
  return formatSql(substituted)
})

const onCopyPreviewSql = async () => {
  if (!previewSql.value) return
  try {
    await copyToClipboard(previewSql.value)
    openToast({ message: 'SQL이 복사되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
  }
}

const onResetFilters = () => {
  emit('reset-filters', props.widget.widgetId)
}

const onExecute = () => {
  emit('execute', props.widget.widgetId, { ...resolvedFilterValues.value })
}

const onChangeVizType = (value: string) => {
  emit('change-viz-type', props.widget.widgetId, value as DataDashboardVizType)
}

// ===== 높이 드래그 리사이즈 =====
// localHeightPx = widget-content 영역 높이 (필터·헤더 제외, padding 포함)
const DEFAULT_HEIGHT = DATA_DASHBOARD_DEFAULT_HEIGHT_PX
const MIN_HEIGHT = DATA_DASHBOARD_DEFAULT_HEIGHT_PX
/** widget-content 좌우 padding($spacing-md) 합 — SCSS와 동기 */
const WIDGET_CONTENT_PADDING_Y = 32

const localHeightPx = ref<number>(props.heightPx ?? DEFAULT_HEIGHT)

/** chart.js·테이블이 사용하는 내부 높이 (content height − padding) */
const chartBodyHeightPx = computed(() => Math.max(120, localHeightPx.value - WIDGET_CONTENT_PADDING_Y))
const isResizing = ref(false)

watch(
  () => props.heightPx,
  (v) => {
    localHeightPx.value = v ?? DEFAULT_HEIGHT
  },
)

const onResetHeight = () => {
  localHeightPx.value = DEFAULT_HEIGHT
  emit('reset-height', props.widget.widgetId)
}

const onResizeStart = (e: MouseEvent) => {
  isResizing.value = true
  const startY = e.clientY
  const startHeight = localHeightPx.value

  const onMouseMove = (ev: MouseEvent) => {
    localHeightPx.value = Math.max(MIN_HEIGHT, startHeight + (ev.clientY - startY))
  }

  const onMouseUp = () => {
    if (localHeightPx.value === DEFAULT_HEIGHT) {
      emit('reset-height', props.widget.widgetId)
    } else {
      emit('update-height', props.widget.widgetId, localHeightPx.value)
    }
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 시각화 유형 변경 메뉴
const vizTypeMenuItems = [
  { label: '막대 차트', value: 'bar', icon: 'icon-bar-chart' },
  { label: '라인 차트', value: 'line', icon: 'icon-line-chart' },
  { label: '파이 차트', value: 'pie', icon: 'icon-pie-chart' },
  { label: '가로 막대', value: 'horizontalBar', icon: 'icon-bar-chart' },
  { label: '테이블', value: 'table', icon: 'icon-sql' },
]

/** UiChart type prop — DataDashboardVizType 중 table 제외 */
const chartVizType = computed((): Exclude<DataDashboardVizType, 'table'> => {
  const { vizType } = props.widget
  return vizType === 'table' ? 'bar' : vizType
})

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
  const { vizType } = props.widget
  const vizCfg = parseVizConfig(props.widget.vizConfig)

  if (!result || !result.rows.length) return {}

  const { columns } = result
  // 수치 계산은 raw rows, 범주 레이블은 displayRows(코드명 치환)로 분리
  const rows = result.rows as Record<string, unknown>[]
  const dRows = displayRows.value

  const readNum = (row: Record<string, unknown>, colKey: string) => Number(getRowValue(row, colKey)) || 0
  const readLabel = (row: Record<string, unknown>, colKey: string) => String(getRowValue(row, colKey) ?? '')

  const { xKey, yKeys } = resolveChartAxisMapping(columns, vizCfg)

  // x축 고유값 + Y합산 (REGN_CD 등 부차 차원이 있어도 xAxisKey 기준으로 묶음)
  const buildGroupedSeries = (groupKey: string) => {
    const rawCategories = buildRawCategories(rows, groupKey)
    const categories = buildCategoryLabels(rawCategories, rows, dRows, groupKey, readLabel)
    const valueMap = buildAggregatedValueMap(rows, groupKey, yKeys[0], readNum)
    const values = rawCategories.map((raw) => valueMap.get(raw) ?? 0)
    return { rawCategories, categories, values }
  }

  // 파이 차트
  // vizConfig에 labelKey/valueKey가 없으면 xAxisKey/yAxisKeys[0] 을 폴백으로 사용
  if (vizType === 'pie') {
    const labelKey = resolveColumnKey(columns, vizCfg.labelKey ?? vizCfg.xAxisKey) ?? columns[0]
    const valueKey = resolveColumnKey(columns, vizCfg.valueKey ?? vizCfg.yAxisKeys?.[0]) ?? columns[1] ?? columns[0]
    const rawCategories = buildRawCategories(rows, labelKey)
    const valueMap = buildAggregatedValueMap(rows, labelKey, valueKey, readNum)
    const aggregatedValues = rawCategories.map((raw) => valueMap.get(raw) ?? 0)
    const total = aggregatedValues.reduce((sum, v) => sum + v, 0)
    // 음수 포함 또는 합계 0이면 비율 계산 불가
    if (aggregatedValues.some((v) => v < 0) || total <= 0) return {}
    const labels = buildCategoryLabels(rawCategories, rows, dRows, labelKey, readLabel)
    return {
      items: rawCategories.map((raw, i) => ({
        name: labels[i],
        value: Math.round((aggregatedValues[i] / total) * 1000) / 10,
      })),
      style: 'analystatSet',
      type: 'outerLabel',
    }
  }

  const { rawCategories, categories, values: groupedValues } = buildGroupedSeries(xKey)

  const chartColorKey = vizType === 'line' ? 'line.analystatSet' : 'bar.analystatSet'

  // 가로 막대
  if (vizType === 'horizontalBar') {
    const scale = buildPositiveYScale(groupedValues)
    return {
      categories,
      data: groupedValues,
      colorKey: chartColorKey,
      maxValue: scale.max,
      yAxisStepSize: scale.stepSize,
    }
  }

  // Y축 2개 — 채팅 시각화와 동일하게 좌/우 이축 (스케일이 다른 지표 대비)
  if (yKeys.length >= 2 && (vizType === 'bar' || vizType === 'line')) {
    const dualKeys = yKeys.slice(0, 2)
    const datasets = dualKeys.map((key, idx) => {
      const valueMap = buildAggregatedValueMap(rows, xKey, key, readNum)
      return {
        label: key,
        data: rawCategories.map((raw) => valueMap.get(raw) ?? 0),
        colorKey: chartColorKey,
        colorIndex: idx,
        yAxisID: idx === 0 ? 'y' : 'y1',
      }
    })
    return {
      categories,
      datasets,
      scales: buildDualAxisScales(datasets, vizType),
    }
  }

  // 라인 차트 (단일 Y)
  if (vizType === 'line') {
    const scale = buildPositiveYScale(groupedValues)
    return {
      categories,
      datasets: [
        {
          label: yKeys[0],
          data: groupedValues,
          colorKey: chartColorKey,
          colorIndex: 0,
        },
      ],
      maxValue: scale.max,
      minValue: scale.min,
      yAxisStepSize: scale.stepSize,
    }
  }

  // 막대 차트 (단일 Y)
  const scale = buildPositiveYScale(groupedValues)
  return {
    categories,
    data: groupedValues,
    colorKey: chartColorKey,
    maxValue: scale.max,
    minValue: scale.min,
    yAxisStepSize: scale.stepSize,
    showDataLabels: false,
  }
})
</script>

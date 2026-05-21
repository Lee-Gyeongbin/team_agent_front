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
          v-if="enrichedVariables.length"
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
        v-if="isFilterOpen && enrichedVariables.length"
        class="widget-filter"
      >
        <div class="widget-filter-fields">
          <template
            v-for="variable in enrichedVariables"
            :key="variable.key"
          >
            <div class="filter-field">
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
        <UiButton
          size="sm"
          @click="onExecute"
        >
          조회
        </UiButton>

        <!-- 실행 SQL 미리보기 -->
        <div
          v-if="previewSql"
          class="widget-filter-sql-preview"
        >
          <span class="filter-label">실행 SQL</span>
          <pre class="widget-filter-sql-code">{{ previewSql }}</pre>
        </div>
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
          :type="chartVizType"
          :config="chartConfig"
          show-legend
        />
      </div>

      <!-- 테이블 -->
      <template v-else-if="state.result && widget.vizType === 'table'">
        <UiTable
          :columns="tableColumns"
          :data="displayRows"
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
import { substituteWhereValues } from '~/utils/dataDashboard/ttsqParamParser'
import { formatSql } from '~/utils/global/codeUtil'
import { parseVizConfig, resolveColumnKey, getRowValue, buildPositiveYScale } from '~/utils/dataDashboard/vizConfigUtil'
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
}

const props = defineProps<Props>()

const emit = defineEmits<{
  execute: [widgetId: string, filterValues: Record<string, string>]
  delete: [widgetId: string]
  resize: [widgetId: string, colSpan: 1 | 2]
  'change-viz-type': [widgetId: string, vizType: DataDashboardVizType]
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

const onExecute = () => {
  emit('execute', props.widget.widgetId, { ...resolvedFilterValues.value })
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

  // 파이 차트
  // vizConfig에 labelKey/valueKey가 없으면 xAxisKey/yAxisKeys[0] 을 폴백으로 사용
  if (vizType === 'pie') {
    const labelKey = resolveColumnKey(columns, vizCfg.labelKey ?? vizCfg.xAxisKey) ?? columns[0]
    const valueKey = resolveColumnKey(columns, vizCfg.valueKey ?? vizCfg.yAxisKeys?.[0]) ?? columns[1] ?? columns[0]
    const rawValues = rows.map((r) => readNum(r, valueKey))
    const total = rawValues.reduce((sum, v) => sum + v, 0)
    // 음수 포함 또는 합계 0이면 비율 계산 불가
    if (rawValues.some((v) => v < 0) || total <= 0) return {}
    return {
      items: rows.map((r, i) => ({
        name: readLabel((dRows[i] ?? r) as Record<string, unknown>, labelKey),
        value: Math.round((readNum(r, valueKey) / total) * 1000) / 10,
      })),
      style: 'analystatSet',
      type: 'outerLabel',
    }
  }

  const xKey = resolveColumnKey(columns, vizCfg.xAxisKey) ?? columns[0]
  const configuredYKeys = (vizCfg.yAxisKeys ?? [])
    .map((k) => resolveColumnKey(columns, k))
    .filter((k): k is string => !!k)
  const yKeys = configuredYKeys.length ? configuredYKeys : columns.filter((c) => c !== xKey)

  // x축 categories는 코드명 치환 적용
  const categories = dRows.map((r) => readLabel(r, xKey))

  const chartColorKey = vizType === 'line' ? 'line.analystatSet' : 'bar.analystatSet'

  // 가로 막대
  if (vizType === 'horizontalBar') {
    const yKey = yKeys[0]
    const values = rows.map((r) => readNum(r, yKey))
    const scale = buildPositiveYScale(values)
    return {
      categories,
      data: values,
      colorKey: chartColorKey,
      maxValue: scale.max,
      yAxisStepSize: scale.stepSize,
    }
  }

  // 라인 차트
  if (vizType === 'line') {
    const values = yKeys.flatMap((k) => rows.map((r) => readNum(r, k)))
    const scale = buildPositiveYScale(values)
    return {
      categories,
      datasets: yKeys.map((key, idx) => ({
        label: key,
        data: rows.map((r) => readNum(r, key)),
        colorKey: chartColorKey,
        colorIndex: idx,
      })),
      maxValue: scale.max,
      minValue: scale.min,
      yAxisStepSize: scale.stepSize,
    }
  }

  // 막대 차트 (기본)
  const values = yKeys.flatMap((k) => rows.map((r) => readNum(r, k)))
  const scale = buildPositiveYScale(values)

  if (yKeys.length === 1) {
    return {
      categories,
      data: rows.map((r) => readNum(r, yKeys[0])),
      colorKey: chartColorKey,
      maxValue: scale.max,
      minValue: scale.min,
      yAxisStepSize: scale.stepSize,
      showDataLabels: false,
    }
  }

  return {
    categories,
    datasets: yKeys.map((key, idx) => ({
      label: key,
      data: rows.map((r) => readNum(r, key)),
      colorKey: chartColorKey,
      colorIndex: idx,
    })),
    maxValue: scale.max,
    minValue: scale.min,
    yAxisStepSize: scale.stepSize,
  }
})
</script>

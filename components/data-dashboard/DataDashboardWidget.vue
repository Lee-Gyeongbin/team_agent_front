<template>
  <div
    class="dashboard-widget"
    :class="{ 'is-filter-open': isFilterOpen }"
  >
    <!-- ===== 헤더 ===== -->
    <div class="widget-header">
      <div class="widget-header-left">
        <!-- 드래그 핸들 (편집 모드일 때만 활성화) -->
        <button
          type="button"
          class="widget-drag-handle icon-move-handle size-20"
          :class="{ 'is-disabled': !isEditMode }"
          :tabindex="isEditMode ? 0 : -1"
          :aria-disabled="!isEditMode"
          aria-label="위젯 이동"
        />
        <!-- SQL 질의 툴팁 -->
        <UiTooltip
          v-if="widget.sqlTitle"
          side="bottom"
          align="start"
          :delay-duration="150"
          content-class="widget-sql-query-tooltip"
        >
          <span
            class="btn btn-widget-action widget-sql-query-btn"
            :aria-label="`사용자 질의: ${widget.sqlTitle}`"
            tabindex="0"
          >
            <i class="icon-comment-other size-16" />
          </span>
          <template #content>
            {{ widget.sqlTitle }}
          </template>
        </UiTooltip>
        <button
          type="button"
          class="widget-title-btn"
          :title="`'${widget.title}' 이름 변경`"
          @click="openRenameModal"
        >
          <span class="widget-title">{{ widget.title }}</span>
        </button>
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
          :active-value="widget.vizType"
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

    <!-- ===== 필터 영역 ===== -->
    <transition name="widget-filter-slide">
      <div
        v-if="isFilterOpen && enrichedVariables.length"
        ref="filterEl"
        class="widget-filter"
      >
        <div class="widget-filter-main">
          <div class="widget-filter-actions">
            <div class="widget-filter-action-group">
              <UiButton
                v-if="periodVariables.length"
                variant="outline"
                size="sm"
                icon-only
                class="widget-filter-today"
                title="오늘 날짜 기준으로 기간 값 설정"
                aria-label="오늘 날짜 기준으로 기간 값 설정"
                @click="onApplyTodayPeriod"
              >
                <template #icon-left>
                  <i class="icon-calendar size-16" />
                </template>
              </UiButton>
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
          <div class="widget-filter-fields">
            <template
              v-for="variable in enrichedVariables"
              :key="variable.key"
            >
              <div
                class="filter-field"
                :class="variable.type === 'select' ? 'filter-field--select' : 'filter-field--compact'"
              >
                <span
                  v-if="variable.isPeriod"
                  class="period-badge"
                >
                  기간
                </span>
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

    <!-- ===== 콘텐츠 영역 (GridStack이 높이 관리 — flex:1로 채움) ===== -->
    <div
      ref="contentEl"
      class="widget-content"
    >
      <!-- 현재 시점 위젯 — 큰 아이콘 + 클릭 시 정보 팝오버 -->
      <PopoverRoot
        v-if="isTodayPeriodFilter"
        v-model:open="isPeriodInfoOpen"
      >
        <PopoverTrigger as-child>
          <button
            type="button"
            class="widget-period-today-icon"
            :class="{ 'is-active': isPeriodInfoOpen }"
            aria-label="현재 시점 기준 위젯 정보"
            title="현재 시점 기준 위젯"
          >
            <i class="icon-calendar size-24" />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            class="widget-period-today-popover"
            side="left"
            align="start"
            :side-offset="10"
          >
            <p class="widget-period-today-popover-title">현재 시점 기준 위젯</p>
            <p class="widget-period-today-popover-desc">오늘 날짜를 기준으로 조회되는 데이터입니다.</p>
            <p
              v-if="todayPeriodSummary"
              class="widget-period-today-popover-summary"
            >
              {{ todayPeriodSummary }}
            </p>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>

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
        :style="{ height: `${chartBodyHeightPx}px` }"
      >
        <UiChart
          :key="`${widget.widgetId}-${chartBodyHeightPx}-${uiChartType}`"
          :type="uiChartType"
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

    <!-- ===== 위젯 이름 변경 모달 ===== -->
    <UiModal
      :is-open="isRenameModalOpen"
      title="위젯 이름 변경"
      max-width="400px"
      @close="closeRenameModal"
    >
      <div class="widget-rename-body">
        <label class="widget-rename-label">위젯 이름</label>
        <UiInput
          ref="renameTitleInputRef"
          v-model="renameTitle"
          placeholder="위젯 이름을 입력하세요"
          @keydown.enter="onRenameConfirm"
        />
      </div>
      <template #footer>
        <div class="widget-rename-footer">
          <UiButton
            variant="outline"
            @click="closeRenameModal"
          >
            취소
          </UiButton>
          <UiButton
            variant="primary"
            :loading="isRenameSaving"
            @click="onRenameConfirm"
          >
            저장
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import {
  substituteWhereValues,
  buildTodayPeriodValues,
  isTodayPeriodFilterValues,
  formatPeriodFilterSummary,
} from '~/utils/dataDashboard/ttsqParamParser'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'radix-vue'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import { formatSql } from '~/utils/global/codeUtil'
import {
  parseVizConfig,
  getRowValue,
  buildPositiveYScale,
  buildDualAxisScales,
  buildCombinationScales,
  buildRawCategories,
  buildCategoryLabels,
  buildAggregatedValueMap,
  resolveChartAxisMapping,
  resolveColumnKey,
} from '~/utils/dataDashboard/vizConfigUtil'
import {
  normalizeColIdForCodeMap,
  resolveColCodeLabel,
  formatChartCategoryLabel,
  resolveColNmLabel,
} from '~/utils/dataDashboard/colCodeMapUtil'
import type {
  DataDashboardWidget,
  DataDashboardWidgetState,
  DataDashboardVizType,
  ColCodeMap,
  ColNmMap,
} from '~/types/data-dashboard'
import type { TableColumn } from '~/types/table'

interface Props {
  widget: DataDashboardWidget
  state: DataDashboardWidgetState
  codeMap?: ColCodeMap
  /** 컬럼명 한국어 매핑 (TB_DM_COL 기반 — 테이블 헤더 한글화) */
  colNmMap?: ColNmMap
  /** 편집 모드 여부 (드래그 핸들 활성화/비활성화) */
  isEditMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEditMode: false,
})

const emit = defineEmits<{
  execute: [widgetId: string, filterValues: Record<string, string>]
  'reset-filters': [widgetId: string]
  delete: [widgetId: string]
  'change-viz-type': [widgetId: string, vizType: DataDashboardVizType]
  /** 필터 열기/닫기 (GridStack 높이 조정용) */
  'filter-toggle': [widgetId: string, isOpen: boolean]
  /** 필터 DOM 높이 변경 시 실제 픽셀값 전달 (ResizeObserver 기반) */
  'filter-height-px': [widgetId: string, heightPx: number]
  /** Vue 마운트 완료 — GridStack 드래그 핸들 재바인딩용 */
  'widget-mounted': [widgetId: string]
  /** 위젯 이름 변경 요청 */
  'rename-title': [widgetId: string, title: string]
}>()

const isFilterOpen = ref(false)
const isPeriodInfoOpen = ref(false)
const contentEl = ref<HTMLElement | null>(null)
const filterEl = ref<HTMLElement | null>(null)

// ===== 위젯 이름 변경 =====
const isRenameModalOpen = ref(false)
const isRenameSaving = ref(false)
const renameTitle = ref('')

const openRenameModal = () => {
  renameTitle.value = props.widget.title
  isRenameModalOpen.value = true
}

const closeRenameModal = () => {
  isRenameModalOpen.value = false
}

const onRenameConfirm = async () => {
  const trimmed = renameTitle.value.trim()
  if (!trimmed) {
    openToast({ message: '위젯 이름을 입력해 주세요.', type: 'warning' })
    return
  }
  if (trimmed === props.widget.title) {
    closeRenameModal()
    return
  }
  isRenameSaving.value = true
  emit('rename-title', props.widget.widgetId, trimmed)
  // 저장 완료는 부모가 처리하므로 모달만 닫음
  closeRenameModal()
  isRenameSaving.value = false
}

// ===== 필터 ResizeObserver — 열릴 때 높이 변화를 부모에 전달 =====
let filterResizeObserver: ResizeObserver | null = null

const startFilterObserver = () => {
  if (!filterEl.value) return
  filterResizeObserver = new ResizeObserver(() => {
    if (filterEl.value) {
      emit('filter-height-px', props.widget.widgetId, filterEl.value.offsetHeight)
    }
  })
  filterResizeObserver.observe(filterEl.value)
}

const stopFilterObserver = () => {
  filterResizeObserver?.disconnect()
  filterResizeObserver = null
}

watch(isFilterOpen, async (open) => {
  if (open) {
    emit('filter-toggle', props.widget.widgetId, true)
    await nextTick()
    startFilterObserver()
  } else {
    stopFilterObserver()
    emit('filter-toggle', props.widget.widgetId, false)
  }
})

// ===== ResizeObserver로 차트 높이 동적 계산 =====
const WIDGET_CONTENT_PADDING_Y = 32 // widget-content padding top+bottom (16px×2)
const chartBodyHeightPx = ref(240)

let resizeObserver: ResizeObserver | null = null

const updateChartHeight = () => {
  if (!contentEl.value) return
  chartBodyHeightPx.value = Math.max(120, contentEl.value.clientHeight - WIDGET_CONTENT_PADDING_Y)
}

onMounted(() => {
  emit('widget-mounted', props.widget.widgetId)

  if (!contentEl.value) return
  resizeObserver = new ResizeObserver(() => {
    updateChartHeight()
  })
  resizeObserver.observe(contentEl.value)
  updateChartHeight()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  stopFilterObserver()
})

// ===== 코드맵 기반 변수 보강 =====

const enrichedVariables = computed<typeof props.widget.variables>(() => {
  const map = props.codeMap
  return props.widget.variables.map((v) => {
    const codes = map?.[normalizeColIdForCodeMap(v.key)]
    if (!codes || Object.keys(codes).length === 0) return v
    const options = Object.entries(codes).map(([code, name]) => ({ label: `${name} (${code})`, value: code }))
    return { ...v, type: 'select' as const, multiple: true, options }
  })
})

const periodVariables = computed(() => enrichedVariables.value.filter((v) => v.isPeriod))

// ===== 로컬 필터 값 =====

const localFilterValues = ref<Record<string, string>>({ ...props.state.filterValues })

watch(
  () => props.state.filterValues,
  (vals) => {
    localFilterValues.value = { ...vals }
  },
  { deep: true },
)

/** 기간 필터가 오늘 날짜 기준값과 일치할 때 헤더에 표시 */
const isTodayPeriodFilter = computed(() => {
  if (!periodVariables.value.length) return false
  return isTodayPeriodFilterValues(enrichedVariables.value, localFilterValues.value)
})

const todayPeriodSummary = computed(() => formatPeriodFilterSummary(enrichedVariables.value, localFilterValues.value))

const resolveCode = (colKey: string, val: unknown): string => {
  return resolveColCodeLabel(props.codeMap, colKey, val)
}

const displayRows = computed<Record<string, unknown>[]>(() => {
  const result = props.state.result
  if (!result?.rows.length) return []
  return result.rows.map((row) => {
    const source = row as Record<string, unknown>
    const mapped: Record<string, unknown> = { ...source }
    for (const col of result.columns) {
      mapped[col] = resolveCode(col, getRowValue(source, col))
    }
    return mapped
  })
})

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

// ===== 이벤트 =====

const onResetFilters = () => {
  emit('reset-filters', props.widget.widgetId)
}

/** 기간 변수를 오늘 날짜 기준값으로 설정 */
const onApplyTodayPeriod = () => {
  if (!periodVariables.value.length) return
  const todayValues = buildTodayPeriodValues(periodVariables.value)
  localFilterValues.value = {
    ...localFilterValues.value,
    ...todayValues,
  }
}

const onExecute = () => {
  emit('execute', props.widget.widgetId, { ...resolvedFilterValues.value })
}

const onChangeVizType = (value: string) => {
  emit('change-viz-type', props.widget.widgetId, value as DataDashboardVizType)
}

// ===== 시각화 유형 메뉴 =====

const vizTypeMenuItems = [
  { label: '막대 차트', value: 'bar', icon: 'icon-bar-chart' },
  { label: '라인 차트', value: 'line', icon: 'icon-line-chart' },
  { label: '막대/라인 콤비네이션', value: 'combination', icon: 'icon-chart' },
  { label: '파이 차트', value: 'pie', icon: 'icon-pie-chart' },
  { label: '가로 막대', value: 'horizontalBar', icon: 'icon-bar-chart' },
  { label: '테이블', value: 'table', icon: 'icon-sql' },
]

const chartVizType = computed((): Exclude<DataDashboardVizType, 'table'> => {
  const { vizType } = props.widget
  if (vizType === 'table') return 'bar'
  return vizType
})

/** UiChart :type 용 — combination은 UiChart가 모르므로 mixed로 변환 */
const uiChartType = computed(() => {
  return chartVizType.value === 'combination' ? 'mixed' : chartVizType.value
})

// ===== 테이블 컬럼 =====

const tableColumns = computed<TableColumn[]>(() => {
  if (!props.state.result) return []
  return props.state.result.columns.map((col) => ({
    key: col,
    // colNmMap에 한국어명이 있으면 헤더에 표시, 없으면 물리 컬럼명 그대로 사용
    label: resolveColNmLabel(props.colNmMap, col),
    sortable: true,
    sortType: 'auto' as const,
    align: 'center' as const,
  }))
})

// ===== 차트 config =====

const chartConfig = computed(() => {
  const result = props.state.result
  const { vizType } = props.widget
  const vizCfg = parseVizConfig(props.widget.vizConfig)
  // codeMap 변경 시 범례·축 레이블 재계산
  const codeMap = props.codeMap

  if (!result || !result.rows.length) return {}

  const { columns } = result
  const rows = result.rows as Record<string, unknown>[]

  const readNum = (row: Record<string, unknown>, colKey: string) => Number(getRowValue(row, colKey)) || 0
  const resolveCategoryLabel = (colKey: string, raw: string) => formatChartCategoryLabel(codeMap, colKey, raw)

  const { xKey, yKeys } = resolveChartAxisMapping(columns, vizCfg)

  const buildGroupedSeries = (groupKey: string) => {
    const rawCategories = buildRawCategories(rows, groupKey)
    const categories = buildCategoryLabels(rawCategories, groupKey, resolveCategoryLabel)
    const valueMap = buildAggregatedValueMap(rows, groupKey, yKeys[0], readNum)
    const values = rawCategories.map((raw) => valueMap.get(raw) ?? 0)
    return { rawCategories, categories, values }
  }

  const chartColorKey = vizType === 'line' ? 'line.analystatSet' : 'bar.analystatSet'

  // 파이 차트
  if (vizType === 'pie') {
    const rawCategories = buildRawCategories(rows, xKey)
    const valueMap = buildAggregatedValueMap(rows, xKey, yKeys[0] ?? columns[1] ?? columns[0], readNum)
    const aggregatedValues = rawCategories.map((raw) => valueMap.get(raw) ?? 0)
    const total = aggregatedValues.reduce((sum, v) => sum + v, 0)
    if (aggregatedValues.some((v) => v < 0) || total <= 0) return {}
    const labels = buildCategoryLabels(rawCategories, xKey, resolveCategoryLabel)
    return {
      items: rawCategories.map((raw, i) => ({
        name: labels[i],
        value: Math.round((aggregatedValues[i] / total) * 1000) / 10,
      })),
      style: 'analystatSet',
      type: 'outerLabel',
      outerLabelConfig: { labelOffset: 4 },
    }
  }

  const { rawCategories, categories, values: groupedValues } = buildGroupedSeries(xKey)

  // 콤비네이션 차트 (막대 + 라인 혼합)
  if (vizType === 'combination') {
    const leftKey =
      (vizCfg.leftAxisKey ? resolveColumnKey(columns, vizCfg.leftAxisKey) : undefined) ?? yKeys[0] ?? columns[1]
    const rightKey =
      (vizCfg.rightAxisKey ? resolveColumnKey(columns, vizCfg.rightAxisKey) : undefined) ??
      yKeys[1] ??
      columns[2] ??
      columns[1]
    const leftType = vizCfg.leftChartType ?? 'bar'
    const rightType = vizCfg.rightChartType ?? 'line'

    const leftMap = buildAggregatedValueMap(rows, xKey, leftKey, readNum)
    const rightMap = buildAggregatedValueMap(rows, xKey, rightKey, readNum)
    const leftData = rawCategories.map((raw) => leftMap.get(raw) ?? 0)
    const rightData = rawCategories.map((raw) => rightMap.get(raw) ?? 0)

    const datasets = [
      {
        label: leftKey,
        data: leftData,
        type: leftType,
        colorKey: leftType === 'line' ? 'line.analystatSet' : 'bar.analystatSet',
        colorIndex: 0,
        yAxisID: 'y',
      },
      {
        label: rightKey,
        data: rightData,
        type: rightType,
        colorKey: rightType === 'line' ? 'line.analystatSet' : 'bar.analystatSet',
        colorIndex: 1,
        yAxisID: 'y1',
      },
    ]

    const scales = buildCombinationScales(leftData, rightData, leftType, rightType)
    return {
      categories,
      datasets,
      ...scales,
    }
  }

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

  // 이축 차트 (Y 2개)
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
      datasets: [{ label: yKeys[0], data: groupedValues, colorKey: chartColorKey, colorIndex: 0 }],
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

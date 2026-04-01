<template>
  <div class="chat-vis-body">
    <!-- 전체 로딩 오버레이 -->
    <UiLoading
      v-if="isLoading"
      overlay
      text="시각화 데이터를 불러오는 중..."
    />

    <!-- ===== 섹션 1: 조회결과 ===== -->
    <div class="chat-vis-section">
      <div
        class="chat-vis-section-header"
        :class="{ 'is-open': sectionOpen.result }"
        @click="toggleSection('result')"
      >
        <div class="chat-vis-section-header-left">
          <span class="chat-vis-section-title">조회결과</span>
          <span class="chat-vis-section-subtitle">조회결과 데이터를 표로 보기</span>
        </div>
        <div class="chat-vis-section-header-right">
          <UiButton
            v-if="sqlQuery"
            size="xxs"
            variant="secondary"
            class="chat-vis-sql-btn"
            @click.stop="toggleSql"
          >
            SQL
          </UiButton>
          <i
            class="icon-chevron-down size-24 chat-vis-section-arrow"
            :class="{ 'is-flipped': sectionOpen.result }"
          ></i>
        </div>
      </div>
      <div
        v-if="sectionOpen.result"
        class="chat-vis-section-body"
      >
        <!-- 에러/빈 상태 -->
        <UiEmpty
          v-if="isError"
          :title="errorMessage"
        >
          <UiButton
            v-if="canRefresh"
            size="sm"
            variant="secondary"
            @click="handleRefresh"
          >
            다시 시도
          </UiButton>
        </UiEmpty>
        <UiEmpty
          v-else-if="isEmpty"
          title="표시할 데이터가 없습니다."
        />
        <template v-else-if="!isLoading">
          <div class="chat-vis-table-body">
            <UiTable
              :columns="tableColumns"
              :data="tableData"
              :max-height="'300px'"
              size="sm"
              sticky-header
            >
              <template
                v-for="col in tableColumns"
                :key="`header-${col.key}`"
                #[`header-${col.key}`]="{ onSort, isSortable }"
              >
                <button
                  v-if="isSortable"
                  type="button"
                  class="chat-vis-table-sort-btn"
                  @click="onSort()"
                >
                  {{ col.label }}
                  <i class="icon icon-sync size-16" />
                </button>
                <span
                  v-else
                  class="chat-vis-table-header-label"
                >
                  {{ col.label }}
                </span>
              </template>
            </UiTable>
          </div>
          <!-- SQL 코드블록 -->
          <div
            v-if="sqlQuery"
            class="chat-vis-sql-area"
            :class="{ 'is-open': isSqlOpen }"
          >
            <UiCodeBlock :code="sqlQuery" />
            <button
              class="chat-vis-sql-toggle"
              type="button"
              @click="toggleSql"
            >
              <i
                class="icon-chevron-down size-12"
                :class="{ 'is-flipped': isSqlOpen }"
              ></i>
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ===== 섹션 2: 차트 추가 ===== -->
    <div class="chat-vis-section">
      <div
        class="chat-vis-section-header"
        :class="{ 'is-open': sectionOpen.addChart && hasSchema }"
        @click="toggleSection('addChart')"
      >
        <div class="chat-vis-section-header-left">
          <span class="chat-vis-section-title">차트 추가</span>
          <span class="chat-vis-section-subtitle">조회결과 컬럼을 축으로 지정해 새 차트 만들기</span>
        </div>
        <i
          class="icon-chevron-down size-24 chat-vis-section-arrow"
          :class="{ 'is-flipped': sectionOpen.addChart }"
        ></i>
      </div>
      <div
        v-if="sectionOpen.addChart && hasSchema"
        class="chat-vis-section-body"
      >
        <div class="chat-vis-add-chart">
          <div class="chat-vis-add-chart-header">
            <span class="chat-vis-add-chart-label">표 컬럼 선택으로 차트 구성</span>
            <UiButton
              variant="primary"
              size="sm"
              :disabled="!canCreateChart"
              @click="onCreateChart"
            >
              <template #icon-left>
                <i class="icon-plus size-12"></i>
              </template>
              차트 생성
            </UiButton>
          </div>
          <!-- 통계 ID 먼저 지정 (복수 통계 조회 시) -->
          <div
            v-if="hasStatIdColumn && uniqueStatIdsForChart.length"
            class="chat-vis-stat-row"
          >
            <div class="chat-vis-stat-label">
              <span>차트 생성 통계 지정</span>
            </div>
            <div class="chat-vis-stat-chips">
              <button
                v-for="sid in uniqueStatIdsForChart"
                :key="`add-${sid}`"
                type="button"
                class="chat-vis-stat-chip"
                :class="{ 'is-active': selectedStatIdForAdd === sid }"
                @click="selectedStatIdForAdd = sid"
              >
                {{ resolveStatIdLabel(sid) }}
              </button>
            </div>
          </div>
          <!-- 축 설정 행 -->
          <div class="chat-vis-axis-row">
            <div class="chat-vis-axis-icon">
              <i class="icon-axis-arrow size-16"></i>
              <span>축 설정</span>
              <UiTooltip
                side="bottom"
                align="start"
                :show-arrow="false"
                content-class="chat-vis-axis-tooltip"
              >
                <div class="chat-vis-axis-tooltip-trigger">
                  <i class="icon icon-info size-16" />
                </div>
                <template #content>
                  <span>※ 결과값이 모두 동일한 컬럼은 축 후보에서 제외됩니다.</span>
                </template>
              </UiTooltip>
            </div>
            <div class="chat-vis-axis-columns">
              <div
                v-for="col in addAxisSettings"
                :key="col.key"
                class="chat-vis-axis-col"
              >
                <div class="chat-vis-axis-col-label">
                  <span class="chat-vis-axis-col-name">{{ col.label }}</span>
                  <span
                    v-if="col.key === getInferredSeriesKeyForAdd()"
                    class="chat-vis-axis-series-badge"
                    title="그룹 막대의 시리즈(범례)로 자동 사용됩니다"
                    >시리즈</span
                  >
                </div>
                <div class="chat-vis-axis-buttons">
                  <button
                    type="button"
                    class="chat-vis-axis-btn"
                    :class="{ 'is-active': col.role === 'X' }"
                    @click="onToggleAxisRole(addAxisSettings, col.key, 'X')"
                  >
                    X
                  </button>
                  <button
                    type="button"
                    class="chat-vis-axis-btn"
                    :class="{ 'is-active': col.role === 'YL' }"
                    :disabled="!col.canMetric"
                    @click="onToggleAxisRole(addAxisSettings, col.key, 'YL')"
                  >
                    YL
                  </button>
                  <button
                    v-if="showAxisYRButton"
                    type="button"
                    class="chat-vis-axis-btn"
                    :class="{ 'is-active': col.role === 'YR' }"
                    :disabled="!col.canMetric"
                    @click="onToggleAxisRole(addAxisSettings, col.key, 'YR')"
                  >
                    YR
                  </button>
                </div>
                <button
                  type="button"
                  class="chat-vis-axis-reset"
                  title="축 해제"
                  @click="onResetAxisRole(addAxisSettings, col.key)"
                >
                  <i class="icon-subtract size-12"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- 유효성 에러 -->
          <div
            v-if="addChartError"
            class="chat-vis-add-chart-error"
          >
            {{ addChartError }}
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 섹션 3: 차트 ===== -->
    <div class="chat-vis-section">
      <div
        class="chat-vis-section-header"
        :class="{ 'is-open': sectionOpen.charts }"
        @click="toggleSection('charts')"
      >
        <div class="chat-vis-section-header-left">
          <span class="chat-vis-section-title">차트</span>
          <span class="chat-vis-section-subtitle">생성된 차트 축을 바꾸거나 차트 유형을 변경하여 볼 수 있습니다</span>
        </div>
        <i
          class="icon-chevron-down size-24 chat-vis-section-arrow"
          :class="{ 'is-flipped': sectionOpen.charts }"
        ></i>
      </div>
      <div
        v-if="sectionOpen.charts"
        class="chat-vis-section-body"
      >
        <UiEmpty
          v-if="chartCards.length === 0"
          icon="icon-chart-ai"
          :title="emptyChartMessage"
        />
        <div
          v-for="(card, index) in chartCards"
          v-else
          :key="card.id"
          class="chat-vis-card"
        >
          <!-- 카드 헤더: ⭐ 차트 N + 뱃지 + 삭제 -->
          <div class="chat-vis-card-header">
            <div class="chat-vis-card-header-left">
              <i class="icon-star-fill size-16 chat-vis-card-star"></i>
              <strong>차트 {{ index + 1 }}</strong>
              <span
                v-for="badge in getChartBadges(card)"
                :key="badge"
                class="chat-vis-card-badge"
                >{{ badge }}</span
              >
            </div>
            <button
              type="button"
              class="chat-vis-card-close"
              title="삭제"
              @click="onRemoveChart(card.id)"
            >
              <i class="icon-close size-14"></i>
            </button>
          </div>
          <!-- 통계 지정 (카드별) -->
          <div
            v-if="hasStatIdColumn && uniqueStatIdsForChart.length"
            class="chat-vis-stat-row chat-vis-stat-row--card"
          >
            <div class="chat-vis-stat-label">
              <span>차트 통계 지정</span>
            </div>
            <div class="chat-vis-stat-chips">
              <button
                v-for="sid in uniqueStatIdsForChart"
                :key="`${card.id}-${sid}`"
                type="button"
                class="chat-vis-stat-chip"
                :class="{ 'is-active': card.statIdFilter === sid }"
                @click="onSelectCardStatId(card, sid)"
              >
                {{ resolveStatIdLabel(sid) }}
              </button>
            </div>
          </div>
          <!-- 축 설정 + 차트 타입 -->
          <div class="chat-vis-card-toolbar">
            <div class="chat-vis-axis-row">
              <div class="chat-vis-axis-icon">
                <i class="icon-axis-arrow size-14"></i>
                <span>축 설정</span>
              </div>
              <div class="chat-vis-axis-columns">
                <div
                  v-for="col in card.axisSettings"
                  :key="col.key"
                  class="chat-vis-axis-col"
                >
                  <div class="chat-vis-axis-col-label">
                    <span class="chat-vis-axis-col-name">{{ col.label }}</span>
                    <span
                      v-if="col.key === getInferredSeriesKeyForCard(card)"
                      class="chat-vis-axis-series-badge"
                      title="그룹 막대의 시리즈(범례)로 자동 사용됩니다"
                      >시리즈</span
                    >
                  </div>
                  <div class="chat-vis-axis-buttons">
                    <button
                      type="button"
                      class="chat-vis-axis-btn"
                      :class="{ 'is-active': col.role === 'X' }"
                      @click="onToggleCardAxisRole(card, col.key, 'X')"
                    >
                      X
                    </button>
                    <button
                      type="button"
                      class="chat-vis-axis-btn"
                      :class="{ 'is-active': col.role === 'YL' }"
                      :disabled="!col.canMetric"
                      @click="onToggleCardAxisRole(card, col.key, 'YL')"
                    >
                      YL
                    </button>
                    <button
                      v-if="showAxisYRButton"
                      type="button"
                      class="chat-vis-axis-btn"
                      :class="{ 'is-active': col.role === 'YR' }"
                      :disabled="!col.canMetric"
                      @click="onToggleCardAxisRole(card, col.key, 'YR')"
                    >
                      YR
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <!-- 차트 타입 아이콘 -->
            <div class="chat-vis-chart-type-buttons">
              <button
                type="button"
                class="chat-vis-type-btn"
                :class="{ 'is-active': card.chartType === 'bar' }"
                title="막대 차트"
                @click="onChangeCardChartType(card, 'bar')"
              >
                <i class="icon-bar-chart size-20"></i>
              </button>
              <button
                type="button"
                class="chat-vis-type-btn"
                :class="{ 'is-active': card.chartType === 'line' }"
                title="라인 차트"
                @click="onChangeCardChartType(card, 'line')"
              >
                <i class="icon-line-chart size-20"></i>
              </button>
              <button
                type="button"
                class="chat-vis-type-btn"
                :class="{ 'is-active': card.chartType === 'pie' }"
                title="파이 차트"
                @click="onChangeCardChartType(card, 'pie')"
              >
                <i class="icon-pie-chart size-20"></i>
              </button>
            </div>
          </div>
          <!-- 차트 영역 -->
          <div
            v-if="chartConfigMap[card.id]"
            class="chat-vis-chart-area"
            :class="{ 'is-pie': card.chartType === 'pie' }"
          >
            <UiChart
              :key="`${card.id}-${card.chartType}-${card.configVersion}`"
              :type="card.chartType"
              :config="chartConfigMap[card.id] ?? {}"
              show-legend
            />
          </div>
          <div
            v-else-if="isPieChartUnavailableForCard(card)"
            class="chat-vis-chart-area chat-vis-empty-pie"
          >
            <UiEmpty
              title="해당 통계데이터는 파이그래프로 표시할 수 없습니다."
              :description="pieChartUnavailableDescription"
            />
          </div>
          <UiEmpty
            v-else
            title="선택한 조건으로 생성 가능한 차트 데이터가 없습니다."
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VisualizationChartSelection, VisualizationChartType, VisualizationViewModel } from '~/types/chat'
import type { TableColumn } from '~/types/table'
import {
  buildChartModel,
  buildTableModel,
  getUniqueStatIdsFromRows,
  inferSeriesKeyFromChartTargets,
  isPieChartUnavailable,
} from '~/utils/chat/visualizationUtil'
import { resolveColumnLabel, resolveDisplayValue } from '~/utils/chat/visualizationLabelMap'

interface Props {
  open: boolean
  viewModel: VisualizationViewModel | null
  onRefresh?: () => void | Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  onRefresh: undefined,
})

const isSqlOpen = ref(false)
const sectionOpen = reactive({ result: true, addChart: true, charts: true })

type AxisRole = 'X' | 'YL' | 'YR' | ''

interface ColumnAxisSetting {
  key: string
  label: string
  role: AxisRole
  canMetric: boolean
}

interface ChartCardState {
  id: string
  chartType: VisualizationChartType
  axisSettings: ColumnAxisSetting[]
  configVersion: number
  statIdFilter: string
}

const addAxisSettings = ref<ColumnAxisSetting[]>([])
const addChartError = ref('')
const chartCards = ref<ChartCardState[]>([])
const selectedStatIdForAdd = ref('')

const canRefresh = computed(() => typeof props.onRefresh === 'function')
const currentVisualizationView = computed(() => props.viewModel)

const isLoading = computed(() => currentVisualizationView.value?.status === 'loading')
const isError = computed(() => currentVisualizationView.value?.status === 'error')
const isEmpty = computed(() => currentVisualizationView.value?.status === 'empty')
const hasSchema = computed(() => !!currentVisualizationView.value?.schema)

const showAxisYRButton = computed(() => currentVisualizationView.value?.schema?.selectableOptions?.canDualAxis === true)
const chartTargetKeysFromSchema = computed(
  () => currentVisualizationView.value?.schema?.selectableOptions.chartTargetKeys ?? [],
)
const hasStatIdColumn = computed(() => !!currentVisualizationView.value?.schema?.statIdColumnKey)

const uniqueStatIdsForChart = computed(() => {
  const vm = currentVisualizationView.value
  const key = vm?.schema?.statIdColumnKey
  if (!vm?.rows?.length || !key) return []
  return getUniqueStatIdsFromRows(vm.rows, key)
})

const resolveStatIdLabel = (statId: string) => {
  const key = currentVisualizationView.value?.schema?.statIdColumnKey
  if (!key) return statId
  return resolveDisplayValue(key, statId)
}

watch(
  uniqueStatIdsForChart,
  (ids) => {
    if (ids.length === 1) selectedStatIdForAdd.value = ids[0]
    else if (ids.length === 0) selectedStatIdForAdd.value = ''
    else if (ids.length > 1 && !ids.includes(selectedStatIdForAdd.value)) selectedStatIdForAdd.value = ''
  },
  { immediate: true },
)

const clearYRRoles = (settings: ColumnAxisSetting[]) => {
  settings.forEach((s) => {
    if (s.role === 'YR') s.role = ''
  })
}

watch(showAxisYRButton, (show) => {
  if (show) return
  clearYRRoles(addAxisSettings.value)
  chartCards.value.forEach((card) => {
    clearYRRoles(card.axisSettings)
    card.configVersion++
  })
})

const errorMessage = computed(
  () => currentVisualizationView.value?.errorMessage ?? '시각화 데이터를 불러오지 못했습니다.',
)
const sqlQuery = computed(() => currentVisualizationView.value?.sql ?? '')

const tableModel = computed(() => {
  if (!currentVisualizationView.value) {
    return { columns: [] as TableColumn[], data: [] as Array<Record<string, unknown>> }
  }
  return buildTableModel(currentVisualizationView.value)
})
const tableColumns = computed(() => {
  const profiles = currentVisualizationView.value?.schema?.profiles ?? []
  const uniqueCountByKey = new Map(profiles.map((profile) => [profile.key, profile.uniqueCount]))

  return tableModel.value.columns.map((column) => {
    const uniqueCount = uniqueCountByKey.get(column.key)
    const isSortable = typeof uniqueCount === 'number' ? uniqueCount > 1 : true

    return {
      ...column,
      sortable: isSortable,
      sortType: 'auto' as const,
    }
  })
})
const tableData = computed(() => tableModel.value.data)

const buildAxisSettingsFromSchema = (): ColumnAxisSetting[] => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return []

  const metricKeySet = new Set(schema.metricKeys)
  const defaultSel = schema.defaultSelection
  const displayKeys: string[] = []
  const added = new Set<string>()

  schema.selectableOptions.chartTargetKeys.forEach((key) => {
    if (!added.has(key)) {
      displayKeys.push(key)
      added.add(key)
    }
  })

  schema.selectableOptions.yAxisKeys.forEach((key) => {
    if (!added.has(key)) {
      displayKeys.push(key)
      added.add(key)
    }
  })

  return displayKeys.map((key) => {
    let role: AxisRole = ''
    if (key === defaultSel.chartTargetKey) role = 'X'
    else if (defaultSel.yAxisKeys.includes(key)) role = 'YL'
    return {
      key,
      label: resolveColumnLabel(key),
      role,
      canMetric: metricKeySet.has(key),
    }
  })
}

const onToggleAxisRole = (settings: ColumnAxisSetting[], key: string, role: AxisRole) => {
  if (role === 'YR' && !showAxisYRButton.value) return

  const setting = settings.find((s) => s.key === key)
  if (!setting) return

  if (setting.role === role) {
    setting.role = ''
    return
  }

  if (role === 'X') {
    settings.forEach((s) => {
      if (s.role === 'X') s.role = ''
    })
  }

  setting.role = role
}

const onResetAxisRole = (settings: ColumnAxisSetting[], key: string) => {
  const setting = settings.find((s) => s.key === key)
  if (setting) setting.role = ''
}

const onToggleCardAxisRole = (card: ChartCardState, key: string, role: AxisRole) => {
  onToggleAxisRole(card.axisSettings, key, role)
  card.configVersion++
}

const onChangeCardChartType = (card: ChartCardState, chartType: VisualizationChartType) => {
  card.chartType = chartType
  card.configVersion++
}

const axisSettingsToSelection = (
  settings: ColumnAxisSetting[],
  chartType: VisualizationChartType,
  canDualAxis: boolean,
  chartTargetKeys: string[],
  statIdFilter: string,
): VisualizationChartSelection => {
  const xCol = settings.find((s) => s.role === 'X')
  const xKey = xCol?.key ?? ''
  const ylCols = settings.filter((s) => s.role === 'YL')
  const yrCols = settings.filter((s) => s.role === 'YR')

  const seriesKey = inferSeriesKeyFromChartTargets(chartTargetKeys, xKey)

  return {
    chartType,
    chartTargetKey: xKey,
    yAxisKeys: [...ylCols.map((c) => c.key), ...yrCols.map((c) => c.key)],
    seriesKey,
    stack: false,
    dualAxis: canDualAxis && yrCols.length > 0 && !seriesKey,
    statIdFilter: statIdFilter || undefined,
  }
}

const getInferredSeriesKeyForCard = (card: ChartCardState) => {
  const xKey = card.axisSettings.find((s) => s.role === 'X')?.key ?? ''
  if (!xKey) return ''
  return inferSeriesKeyFromChartTargets(chartTargetKeysFromSchema.value, xKey)
}

const getInferredSeriesKeyForAdd = () => {
  const xKey = addAxisSettings.value.find((s) => s.role === 'X')?.key ?? ''
  if (!xKey) return ''
  return inferSeriesKeyFromChartTargets(chartTargetKeysFromSchema.value, xKey)
}

const pieChartUnavailableDescription = `1. 데이터값에 음수(-)가 들어가는 경우
2. 전체 합산값이 0 이하인 경우`

const isPieChartUnavailableForCard = (card: ChartCardState) => {
  const vm = currentVisualizationView.value
  const schema = vm?.schema
  if (!vm || !schema || card.chartType !== 'pie') return false
  const selection = axisSettingsToSelection(
    card.axisSettings,
    card.chartType,
    schema.selectableOptions.canDualAxis,
    schema.selectableOptions.chartTargetKeys,
    card.statIdFilter ?? '',
  )
  return isPieChartUnavailable(vm, selection)
}

const canCreateChart = computed(() => {
  const hasX = addAxisSettings.value.some((s) => s.role === 'X')
  const hasY = addAxisSettings.value.some((s) => s.role === 'YL' || s.role === 'YR')
  if (!hasX || !hasY) return false
  if (hasStatIdColumn.value && uniqueStatIdsForChart.value.length === 0) return false
  if (hasStatIdColumn.value && uniqueStatIdsForChart.value.length > 1 && !selectedStatIdForAdd.value) {
    return false
  }
  return true
})

const createCardId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const onCreateChart = () => {
  if (!canCreateChart.value) {
    addChartError.value = 'X축과 Y축을 각각 1개 이상 선택해주세요.'
    if (hasStatIdColumn.value && uniqueStatIdsForChart.value.length > 1 && !selectedStatIdForAdd.value) {
      addChartError.value = '차트를 만들 통계를 먼저 선택해주세요.'
    }
    return
  }
  addChartError.value = ''

  const statId =
    hasStatIdColumn.value && selectedStatIdForAdd.value
      ? selectedStatIdForAdd.value
      : uniqueStatIdsForChart.value.length === 1
        ? uniqueStatIdsForChart.value[0]
        : ''

  const newCard: ChartCardState = {
    id: createCardId(),
    chartType: 'bar',
    axisSettings: JSON.parse(JSON.stringify(addAxisSettings.value)) as ColumnAxisSetting[],
    configVersion: 0,
    statIdFilter: statId,
  }
  chartCards.value.push(newCard)
}

const onSelectCardStatId = (card: ChartCardState, statId: string) => {
  card.statIdFilter = statId
  card.configVersion++
}

const onRemoveChart = (id: string) => {
  chartCards.value = chartCards.value.filter((card) => card.id !== id)
}

const getChartBadges = (card: ChartCardState): string[] => {
  const xCol = card.axisSettings.find((s) => s.role === 'X')
  const yCols = card.axisSettings.filter((s) => s.role === 'YL' || s.role === 'YR')

  if (yCols.length === 0) return ['사용자 정의 차트']

  return yCols.map((col, i) => {
    if (i === 0 && xCol) return `${xCol.label}별 ${col.label}`
    return col.label
  })
}

const configCache = new Map<string, { version: number; config: Record<string, unknown> }>()

const chartConfigMap = computed<Record<string, Record<string, unknown>>>(() => {
  const vm = currentVisualizationView.value
  const schema = vm?.schema
  if (!vm || !schema) return {}
  const mapped: Record<string, Record<string, unknown>> = {}
  const canDualAxis = schema.selectableOptions.canDualAxis
  chartCards.value.forEach((card) => {
    const cached = configCache.get(card.id)
    if (cached && cached.version === card.configVersion) {
      mapped[card.id] = cached.config
      return
    }
    const selection = axisSettingsToSelection(
      card.axisSettings,
      card.chartType,
      canDualAxis,
      schema.selectableOptions.chartTargetKeys,
      card.statIdFilter ?? '',
    )
    const config = buildChartModel(vm, selection)
    if (config) {
      configCache.set(card.id, { version: card.configVersion, config })
      mapped[card.id] = config
    }
  })

  const cardIds = new Set(chartCards.value.map((c) => c.id))
  configCache.forEach((_, key) => {
    if (!cardIds.has(key)) configCache.delete(key)
  })
  return mapped
})

const emptyChartMessage = computed(() => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return '차트로 표시할 수 있는 데이터가 없습니다.'
  if (schema.selectableOptions.yAxisKeys.length === 0) {
    return '통계값으로 판단되는 Y축 컬럼이 없습니다.'
  }
  if (schema.selectableOptions.chartTargetKeys.length === 0) {
    return 'X축으로 사용할 수 있는 컬럼이 없습니다.'
  }
  return '위 "차트 추가" 영역에서 축을 설정한 뒤 차트를 생성하세요.'
})

const toggleSection = (section: 'result' | 'addChart' | 'charts') => {
  sectionOpen[section] = !sectionOpen[section]
}

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const handleRefresh = async () => {
  if (!props.onRefresh) return
  await props.onRefresh()
}

const initAxisSettings = () => {
  addAxisSettings.value = buildAxisSettingsFromSchema()
  addChartError.value = ''
}

watch(
  () => [props.open, props.viewModel?.messageId] as const,
  ([open]) => {
    chartCards.value = []
    configCache.clear()
    if (!open) {
      selectedStatIdForAdd.value = ''
      addChartError.value = ''
      isSqlOpen.value = false
    }
  },
  { immediate: true },
)

const axisInitialized = ref(false)
watch(
  () => [props.viewModel?.messageId, props.open, currentVisualizationView.value?.status] as const,
  () => {
    if (!props.open || !currentVisualizationView.value || currentVisualizationView.value.status !== 'success') {
      axisInitialized.value = false
      return
    }
    if (!axisInitialized.value) {
      initAxisSettings()
      axisInitialized.value = true
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.chat-vis-axis-icon {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-vis-axis-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-vis-table-sort-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.chat-vis-table-header-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>

<template>
  <div
    class="chat-vis-panel"
    :class="{ 'is-open': open, 'is-fullscreen': isFullscreen }"
  >
    <!-- 헤더 -->
    <div class="chat-vis-header">
      <span class="chat-vis-title">데이터 시각화 뷰</span>
      <div class="chat-vis-header-actions">
        <button
          class="btn btn-icon"
          type="button"
          :title="isFullscreen ? '축소' : '전체화면'"
          @click="toggleFullscreen"
        >
          <i
            :class="isFullscreen ? 'icon-collapse' : 'icon-expand'"
            class="size-20"
          ></i>
        </button>
        <button
          class="btn btn-icon"
          type="button"
          title="닫기"
          @click="onClose"
        >
          <i class="icon-close size-16"></i>
        </button>
      </div>
    </div>

    <!-- 본문 -->
    <div class="chat-vis-body">
      <!-- 데이터 표 섹션 -->
      <div class="chat-vis-table">
        <div class="chat-vis-table-header">
          <div class="chat-vis-table-header-left">
            <i class="icon-file-ai size-16"></i>
            <span class="chat-vis-table-title">데이터 표</span>
          </div>
          <span class="chat-vis-table-subtitle">{{ tableSubtitle }}</span>
        </div>
        <div class="chat-vis-table-body">
          <div
            v-if="isLoading"
            class="chat-vis-status"
          >
            시각화 데이터를 불러오는 중입니다.
          </div>
          <div
            v-else-if="isError"
            class="chat-vis-status is-error"
          >
            <p>{{ errorMessage }}</p>
            <UiButton
              size="sm"
              variant="secondary"
              @click="onRefresh"
            >
              다시 시도
            </UiButton>
          </div>
          <div
            v-else-if="isEmpty"
            class="chat-vis-status"
          >
            표시할 데이터가 없습니다.
          </div>
          <UiTable
            v-else
            :columns="tableColumns"
            :data="tableData"
            :max-height="'300px'"
            sticky-header
          />
        </div>
      </div>

      <!-- 데이터 차트 섹션 -->
      <div class="chat-vis-chart">
        <!-- 차트 타이틀 -->
        <div class="chat-vis-chart-header">
          <div class="chat-vis-chart-header-left">
            <i class="icon-chart-ai size-16"></i>
            <span class="chat-vis-chart-title">데이터 차트</span>
          </div>
        </div>
        <!-- 차트 툴바: 범례/기준값 셀렉트 + 차트 타입 아이콘 -->
        <div class="chat-vis-chart-toolbar">
          <div class="chat-vis-chart-actions">
            <UiButton
              variant="ghost"
              icon-only
              title="새로고침"
              @click="onRefresh"
            >
              <template #icon-left>
                <i class="icon-refresh size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              :disabled="!canAddChart"
              title="차트 추가"
              @click="onAddChart"
            >
              차트 추가
            </UiButton>
          </div>
        </div>
        <!-- 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 -->
        <div
          v-if="isLoading"
          class="chat-vis-status"
        >
          차트를 생성하는 중입니다.
        </div>
        <div
          v-else-if="isError"
          class="chat-vis-status is-error"
        >
          차트 데이터 로딩 중 오류가 발생했습니다.
        </div>
        <div
          v-else-if="!hasChartData"
          class="chat-vis-status"
        >
          {{ emptyChartMessage }}
        </div>
        <div v-else>
          <div
            v-for="(card, index) in chartCards"
            :key="card.id"
            class="chat-vis-card"
          >
            <div class="chat-vis-card-header">
              <strong>차트 {{ index + 1 }}</strong>
              <div class="chat-vis-card-actions">
                <UiButton
                  variant="ghost"
                  size="sm"
                  @click="(event) => onCaptureChart(event, card)"
                >
                  캡처
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :disabled="chartCards.length === 1"
                  @click="onRemoveChart(card.id)"
                >
                  삭제
                </UiButton>
              </div>
            </div>
            <div class="chat-vis-card-controls">
              <div class="chat-vis-card-filters">
                <div class="chat-vis-chart-filter">
                  <span class="chat-vis-chart-filter-label">X축</span>
                  <UiSelect
                    :id="`chart-target-${card.id}`"
                    v-model="card.selection.chartTargetKey"
                    :name="`chart-target-${card.id}`"
                    :options="chartTargetOptions"
                    class="w-130"
                    size="sm"
                    @update:model-value="() => syncChartCard(card)"
                  />
                </div>
                <div class="chat-vis-chart-filter">
                  <span class="chat-vis-chart-filter-label">차트 타입</span>
                  <div class="chat-vis-chart-actions">
                    <UiButton
                      variant="ghost"
                      icon-only
                      :class="{ 'is-active': card.selection.chartType === 'bar' }"
                      title="막대 차트"
                      @click="onChangeChartType(card, 'bar')"
                    >
                      <template #icon-left>
                        <i class="icon-bar-chart size-16"></i>
                      </template>
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      icon-only
                      :class="{ 'is-active': card.selection.chartType === 'line' }"
                      title="라인 차트"
                      @click="onChangeChartType(card, 'line')"
                    >
                      <template #icon-left>
                        <i class="icon-line-chart size-16"></i>
                      </template>
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      icon-only
                      :class="{ 'is-active': card.selection.chartType === 'pie' }"
                      title="파이 차트"
                      @click="onChangeChartType(card, 'pie')"
                    >
                      <template #icon-left>
                        <i class="icon-pie-chart size-16"></i>
                      </template>
                    </UiButton>
                  </div>
                </div>
                <div class="chat-vis-chart-filter">
                  <span class="chat-vis-chart-filter-label">Y축(좌)</span>
                  <UiSelect
                    :id="`chart-y-left-${card.id}`"
                    :model-value="card.selection.yAxisKeys[0] ?? ''"
                    :name="`chart-y-left-${card.id}`"
                    :options="yAxisOptions"
                    class="w-130"
                    size="sm"
                    @update:model-value="(value) => onChangePrimaryYAxis(card, String(value))"
                  />
                </div>
                <div class="chat-vis-chart-filter">
                  <span class="chat-vis-chart-filter-label">Y축(우)</span>
                  <UiSelect
                    :id="`chart-y-right-${card.id}`"
                    :model-value="card.selection.yAxisKeys[1] ?? ''"
                    :name="`chart-y-right-${card.id}`"
                    :options="yAxisRightOptions"
                    class="w-130"
                    size="sm"
                    :disabled="card.selection.chartType === 'pie' || !!card.selection.seriesKey"
                    @update:model-value="(value) => onChangeSecondaryYAxis(card, String(value))"
                  />
                </div>
                <div class="chat-vis-chart-filter">
                  <span class="chat-vis-chart-filter-label">시리즈</span>
                  <UiSelect
                    :id="`chart-series-${card.id}`"
                    v-model="card.selection.seriesKey"
                    :name="`chart-series-${card.id}`"
                    :options="seriesKeyOptionsMap[card.id] ?? []"
                    class="w-130"
                    size="sm"
                    :disabled="card.selection.chartType === 'pie' || (seriesKeyOptionsMap[card.id]?.length ?? 0) < 1"
                    @update:model-value="() => syncChartCard(card)"
                  />
                </div>
                <div class="chat-vis-chart-flags">
                  <UiCheckbox
                    v-model="card.selection.stack"
                    label="누적(stack)"
                    :disabled="card.selection.chartType !== 'bar' || card.selection.dualAxis"
                    @update:model-value="() => syncChartCard(card)"
                  />
                  <UiCheckbox
                    v-model="card.selection.dualAxis"
                    label="양축(dualAxis)"
                    :disabled="
                      !canUseDualAxis(card) || card.selection.chartType === 'pie' || !!card.selection.seriesKey
                    "
                    @update:model-value="() => syncChartCard(card)"
                  />
                </div>
              </div>
              <div class="chat-vis-card-submit">
                <UiButton
                  variant="primary-dark"
                  @click="onGenerateChart(card)"
                >
                  차트 생성
                </UiButton>
              </div>
            </div>
            <div
              v-if="chartConfigMap[card.id]"
              class="chat-vis-chart-area"
              :class="{ 'is-pie': card.selection.chartType === 'pie' }"
            >
              <UiChart
                :key="`${card.id}-${card.selection.chartType}`"
                :type="card.selection.chartType"
                :config="chartConfigMap[card.id] ?? {}"
                show-legend
              />
            </div>
            <div
              v-else
              class="chat-vis-status"
            >
              선택한 조건으로 생성 가능한 차트 데이터가 없습니다.
            </div>
          </div>
        </div>
        <!-- SQL 섹션 -->
        <div class="chat-vis-sql">
          <div class="chat-vis-sql-bar">
            <div class="chat-vis-sql-bar-left">
              <i class="icon-copy size-16"></i>
              <span class="chat-vis-sql-label">SQL</span>
            </div>
            <UiButton
              size="xlg"
              variant="primary"
              @click="toggleSql"
            >
              SQL
              <template #icon-right>
                <i
                  class="icon-chevron-down size-12"
                  :class="{ 'is-flipped': isSqlOpen }"
                ></i>
              </template>
            </UiButton>
          </div>
          <div
            class="chat-vis-sql-content"
            :class="{ 'is-open': isSqlOpen }"
          >
            <UiCodeBlock :code="sqlQuery" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VisualizationChartSelection, VisualizationChartType } from '~/types/chat'
import type { TableColumn } from '~/types/table'
import {
  buildChartTargetOptions,
  buildChartModel,
  buildDefaultChartSelection,
  buildMetricOptions,
  buildSeriesKeyOptions,
  buildTableModel,
} from '~/utils/chat/visualizationUtil'
import {
  captureChartCanvasAsPng,
  clearBodyChartFullscreen,
  toggleBodyChartFullscreen,
} from '~/utils/chat/visualizationChartUtil'

interface Props {
  open: boolean
  messageId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  messageId: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:fullscreen': [value: boolean]
}>()

const { visualizationViewMap, handleSelectVisualizationData } = useChatStore()

const isFullscreen = ref(false)
const isSqlOpen = ref(true)

interface ChartCardState {
  id: string
  selection: VisualizationChartSelection
}

const chartCards = ref<ChartCardState[]>([])

const currentVisualizationView = computed(() => {
  if (!props.messageId) return null
  return visualizationViewMap.value[props.messageId] ?? null
})

const isLoading = computed(() => currentVisualizationView.value?.status === 'loading')
const isError = computed(() => currentVisualizationView.value?.status === 'error')
const isEmpty = computed(() => currentVisualizationView.value?.status === 'empty')

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

const tableSubtitle = computed(() => {
  const rowCount = currentVisualizationView.value?.rows.length ?? 0
  return `총 ${rowCount.toLocaleString('ko-KR')}건`
})
const tableColumns = computed(() => tableModel.value.columns)
const tableData = computed(() => tableModel.value.data)

const yAxisOptions = computed(() => buildMetricOptions(currentVisualizationView.value?.schema ?? null))
const yAxisRightOptions = computed(() => [{ label: '미사용', value: '' }, ...yAxisOptions.value])
const chartTargetOptions = computed(() => buildChartTargetOptions(currentVisualizationView.value?.schema ?? null))
const seriesKeyOptionsMap = computed(() => {
  const schema = currentVisualizationView.value?.schema ?? null
  const mapped: Record<string, Array<{ label: string; value: string }>> = {}
  chartCards.value.forEach((card) => {
    mapped[card.id] = [...buildSeriesKeyOptions(schema, card.selection.chartTargetKey)]
  })
  return mapped
})

const chartConfigMap = computed<Record<string, Record<string, unknown>>>(() => {
  if (!currentVisualizationView.value) return {}
  const mapped: Record<string, Record<string, unknown>> = {}
  chartCards.value.forEach((card) => {
    const config = buildChartModel(currentVisualizationView.value!, card.selection)
    if (config) {
      mapped[card.id] = config
    }
  })
  return mapped
})
const hasChartData = computed(() => {
  if (isLoading.value || isError.value || isEmpty.value) return false
  return chartCards.value.length > 0
})
const canAddChart = computed(() => {
  const schema = currentVisualizationView.value?.schema
  return Boolean(
    schema && schema.selectableOptions.yAxisKeys.length > 0 && schema.selectableOptions.chartTargetKeys.length > 0,
  )
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
  return '차트로 표시할 수 있는 수치 데이터가 없습니다.'
})

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  toggleBodyChartFullscreen(isFullscreen.value)
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  clearBodyChartFullscreen()
  chartCards.value = []
  emit('update:fullscreen', false)
  emit('update:open', false)
}

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const createCardId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createDefaultChartCard = (): ChartCardState => {
  const schema = currentVisualizationView.value?.schema
  return {
    id: createCardId(),
    selection: buildDefaultChartSelection(schema ?? null),
  }
}
const syncChartCard = (card: ChartCardState) => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return

  const validYKeys = new Set(schema.selectableOptions.yAxisKeys)
  const validTargetKeys = new Set(schema.selectableOptions.chartTargetKeys)

  if (!validTargetKeys.has(card.selection.chartTargetKey)) {
    card.selection.chartTargetKey = schema.defaultSelection.chartTargetKey
  }

  const seriesOptions = buildSeriesKeyOptions(schema, card.selection.chartTargetKey)
  const availableSeriesKeys = seriesOptions.map((option) => String(option.value))
  const validSeriesKeys = new Set(availableSeriesKeys)

  if (
    card.selection.seriesKey &&
    (card.selection.chartType === 'pie' || !validSeriesKeys.has(card.selection.seriesKey))
  ) {
    card.selection.seriesKey = ''
  }

  if (card.selection.chartType === 'pie') {
    card.selection.seriesKey = ''
  } else {
    // 후보가 1개일 때 자동 선택
    if (!card.selection.seriesKey && availableSeriesKeys.length === 1) {
      card.selection.seriesKey = availableSeriesKeys[0]
    }
  }

  const maxYKeys = card.selection.seriesKey ? 1 : 2
  card.selection.yAxisKeys = card.selection.yAxisKeys.filter((key) => validYKeys.has(key)).slice(0, maxYKeys)

  if (card.selection.yAxisKeys.length === 0 && schema.defaultSelection.yAxisKeys.length > 0) {
    card.selection.yAxisKeys = [schema.defaultSelection.yAxisKeys[0]]
  }

  if (card.selection.chartType === 'pie') {
    card.selection.stack = false
    card.selection.dualAxis = false
    if (card.selection.yAxisKeys.length > 1) {
      card.selection.yAxisKeys = [card.selection.yAxisKeys[0]]
    }
  }

  if (card.selection.seriesKey) {
    card.selection.dualAxis = false
  }

  if (card.selection.dualAxis && card.selection.yAxisKeys.length < 2) {
    card.selection.dualAxis = false
  }

  if (card.selection.dualAxis) {
    card.selection.stack = false
  }

  if (card.selection.chartType !== 'bar') {
    card.selection.stack = false
  }
}

const syncChartCards = () => {
  const schema = currentVisualizationView.value?.schema
  if (
    !schema ||
    schema.selectableOptions.yAxisKeys.length === 0 ||
    schema.selectableOptions.chartTargetKeys.length === 0
  ) {
    chartCards.value = []
    return
  }
  if (chartCards.value.length === 0) {
    chartCards.value = [createDefaultChartCard()]
    return
  }
  chartCards.value.forEach((card) => syncChartCard(card))
}

const onAddChart = () => {
  if (!canAddChart.value) return
  chartCards.value.push(createDefaultChartCard())
}

const onRemoveChart = (id: string) => {
  if (chartCards.value.length <= 1) return
  chartCards.value = chartCards.value.filter((card) => card.id !== id)
}

const onGenerateChart = (card: ChartCardState) => {
  syncChartCard(card)
}

const onCaptureChart = (event: MouseEvent, card: ChartCardState) => {
  const trigger = event.currentTarget as HTMLElement | null
  const chartCard = trigger?.closest('.chat-vis-card')
  const canvas = chartCard?.querySelector('canvas') as HTMLCanvasElement | null
  if (!canvas) {
    console.warn('[chat] 캡처할 차트 캔버스를 찾지 못했습니다.')
    return
  }
  captureChartCanvasAsPng(canvas, card.selection.chartType)
}

const onChangeChartType = (card: ChartCardState, chartType: VisualizationChartType) => {
  card.selection.chartType = chartType
  syncChartCard(card)
}

const onChangePrimaryYAxis = (card: ChartCardState, value: string) => {
  const secondary = card.selection.yAxisKeys[1] ?? ''
  card.selection.yAxisKeys = [value]
  if (secondary && secondary !== value) {
    card.selection.yAxisKeys.push(secondary)
  }
  syncChartCard(card)
}

const onChangeSecondaryYAxis = (card: ChartCardState, value: string) => {
  const primary = card.selection.yAxisKeys[0] ?? ''
  if (!value || value === primary) {
    card.selection.yAxisKeys = primary ? [primary] : []
    card.selection.dualAxis = false
    syncChartCard(card)
    return
  }
  card.selection.yAxisKeys = primary ? [primary, value] : [value]
  syncChartCard(card)
}

const canUseDualAxis = (card: ChartCardState) => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return false
  if (card.selection.seriesKey) return false
  return schema.selectableOptions.canDualAxis && card.selection.yAxisKeys.length >= 2
}

const onRefresh = async () => {
  if (!props.messageId) return
  await handleSelectVisualizationData(props.messageId)
}

watch(
  () => [props.open, props.messageId] as const,
  ([open]) => {
    chartCards.value = []
    if (!open) {
      isFullscreen.value = false
      clearBodyChartFullscreen()
    }
    if (!open) return
  },
)

watch(currentVisualizationView, () => {
  syncChartCards()
})

onUnmounted(() => {
  clearBodyChartFullscreen()
})
</script>

<style lang="scss" scoped>
.chat-vis-card {
  border: 1px solid #e4e9ee;
  border-radius: $border-radius-base;
  padding: $spacing-md;
  margin-top: $spacing-md;
  background-color: #fff;
}

.chat-vis-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.chat-vis-card-actions {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.chat-vis-card-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: $spacing-md;
  align-items: start;
  margin-bottom: $spacing-md;
}

.chat-vis-card-filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $spacing-sm;
}

.chat-vis-chart-filter-label {
  min-width: 64px;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.chat-vis-card-submit {
  display: flex;
  align-items: flex-end;
}

@media (max-width: 1024px) {
  .chat-vis-card-controls {
    grid-template-columns: 1fr;
  }

  .chat-vis-card-submit {
    justify-content: flex-end;
  }
}

.chat-vis-type-buttons {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.chat-vis-chart-flags {
  display: flex;
  align-items: center;
  gap: $spacing-md;
}
</style>

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
          <div class="chat-vis-chart-toolbar-left">
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">범례</span>
              <UiSelect
                id="chart-legend"
                v-model="legendOption"
                name="chart-legend"
                :options="legendOptions"
                class="w-96"
                size="sm"
              />
            </div>
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">기준값(좌)</span>
              <UiSelect
                id="chart-left-axis"
                v-model="leftAxisOption"
                name="chart-left-axis"
                :options="axisOptions"
                class="w-96"
                size="sm"
              />
            </div>
            <div class="chat-vis-chart-filter">
              <span class="chat-vis-chart-filter-label">기준값(우)</span>
              <UiSelect
                id="chart-right-axis"
                v-model="rightAxisOption"
                name="chart-right-axis"
                :options="axisOptions"
                class="w-96"
                size="sm"
              />
            </div>
          </div>
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
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'bar' }"
              title="막대 차트"
              @click="chartType = 'bar'"
            >
              <template #icon-left>
                <i class="icon-bar-chart size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'line' }"
              title="라인 차트"
              @click="chartType = 'line'"
            >
              <template #icon-left>
                <i class="icon-line-chart size-16"></i>
              </template>
            </UiButton>
            <UiButton
              variant="ghost"
              icon-only
              :class="{ 'is-active': chartType === 'pie' }"
              title="파이 차트"
              @click="chartType = 'pie'"
            >
              <template #icon-left>
                <i class="icon-pie-chart size-16"></i>
              </template>
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
          차트로 표시할 수 있는 수치 데이터가 없습니다.
        </div>
        <div
          v-else
          class="chat-vis-chart-area"
          :class="{ 'is-pie': chartType === 'pie' }"
        >
          <UiChart
            :key="chartType"
            :type="chartType"
            :config="chartConfig"
            show-legend
          />
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
import type { TableColumn } from '~/types/table'
import {
  buildChartModel,
  buildLegendOptions,
  buildMetricOptions,
  buildTableModel,
  getDefaultChartType,
} from '~/utils/chat/visualizationUtil'

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
const chartType = ref<'bar' | 'line' | 'pie'>('bar')
const legendOption = ref('')
const leftAxisOption = ref('')
const rightAxisOption = ref('')

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

const axisOptions = computed(() => buildMetricOptions(currentVisualizationView.value?.schema ?? null))
const legendOptions = computed(() => buildLegendOptions(currentVisualizationView.value?.schema ?? null))

const chartConfig = computed<Record<string, unknown>>(() => {
  if (!currentVisualizationView.value) return {}
  return (
    buildChartModel(currentVisualizationView.value, {
      chartType: chartType.value,
      metricKey: leftAxisOption.value,
      legendKey: legendOption.value,
    }) ?? {}
  )
})
const hasChartData = computed(() => Object.keys(chartConfig.value).length > 0)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  emit('update:fullscreen', false)
  emit('update:open', false)
}

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const syncChartOptions = () => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) {
    legendOption.value = ''
    leftAxisOption.value = ''
    rightAxisOption.value = ''
    chartType.value = 'bar'
    return
  }

  const metricFallback = axisOptions.value[0]?.value ?? ''
  const legendFallback = legendOptions.value[0]?.value ?? ''
  const defaultType = getDefaultChartType(schema)

  if (!axisOptions.value.some((option) => option.value === leftAxisOption.value)) {
    leftAxisOption.value = schema.defaultMetricKey || metricFallback
  }
  if (!axisOptions.value.some((option) => option.value === rightAxisOption.value)) {
    rightAxisOption.value = schema.defaultMetricKey || metricFallback
  }
  if (!legendOptions.value.some((option) => option.value === legendOption.value)) {
    legendOption.value = schema.defaultLegendKey || legendFallback
  }
  chartType.value = defaultType
}

const onRefresh = async () => {
  if (!props.messageId) return
  await handleSelectVisualizationData(props.messageId)
}

watch(
  () => [props.open, props.messageId] as const,
  async ([open, messageId]) => {
    if (!open || !messageId) return
    if (!visualizationViewMap.value[messageId]) {
      await handleSelectVisualizationData(messageId)
    }
  },
  { immediate: true },
)

watch(currentVisualizationView, () => {
  syncChartOptions()
})
</script>

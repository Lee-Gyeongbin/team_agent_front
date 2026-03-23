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
          title="새로고침"
          @click="onRefresh"
        >
          <i class="icon-refresh size-16"></i>
        </button>
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
          <!-- 로딩/에러/빈 상태 -->
          <UiEmpty
            v-if="isLoading"
            title="시각화 데이터를 불러오는 중입니다."
          />
          <UiEmpty
            v-else-if="isError"
            :title="errorMessage"
          >
            <UiButton
              size="sm"
              variant="secondary"
              @click="onRefresh"
            >
              다시 시도
            </UiButton>
          </UiEmpty>
          <UiEmpty
            v-else-if="isEmpty"
            title="표시할 데이터가 없습니다."
          />
          <template v-else>
            <div class="chat-vis-table-body">
              <UiTable
                :columns="tableColumns"
                :data="tableData"
                :max-height="'300px'"
                size="sm"
                sticky-header
              />
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
            <!-- 축 설정 행 -->
            <div class="chat-vis-axis-row">
              <div class="chat-vis-axis-icon">
                <i class="icon-axis-arrow size-16"></i>
                <span>축 설정</span>
              </div>
              <div class="chat-vis-axis-columns">
                <div
                  v-for="col in addAxisSettings"
                  :key="col.key"
                  class="chat-vis-axis-col"
                >
                  <span class="chat-vis-axis-col-name">{{ col.label }}</span>
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
                    <span class="chat-vis-axis-col-name">{{ col.label }}</span>
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
            <UiEmpty
              v-else
              title="선택한 조건으로 생성 가능한 차트 데이터가 없습니다."
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VisualizationChartSelection, VisualizationChartType, VisualizationViewModel } from '~/types/chat'
import type { TableColumn } from '~/types/table'
import { buildChartModel, buildTableModel, buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { clearBodyChartFullscreen, toggleBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { resolveColumnLabel } from '~/utils/chat/visualizationLabelMap'

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

// 🔽 더미 키 — 백엔드 연결 시 제거
const DUMMY_MESSAGE_ID = '__dummy_vis__'

// ===== 상태 변수 =====
const isFullscreen = ref(false)
const isSqlOpen = ref(false)
const sectionOpen = reactive({ result: true, addChart: true, charts: true })

type AxisRole = 'X' | 'YL' | 'YR' | ''

interface ColumnAxisSetting {
  key: string
  label: string
  role: AxisRole
  canMetric: boolean // Y축 후보 여부
}

interface ChartCardState {
  id: string
  chartType: VisualizationChartType
  axisSettings: ColumnAxisSetting[]
  configVersion: number // 변경 추적용
}

const addAxisSettings = ref<ColumnAxisSetting[]>([])
const addChartError = ref('')
const chartCards = ref<ChartCardState[]>([])

// ===== 뷰 모델 =====
const currentVisualizationView = computed(() => {
  const id = props.messageId ?? DUMMY_MESSAGE_ID
  return visualizationViewMap.value[id] ?? null
})

const isLoading = computed(() => currentVisualizationView.value?.status === 'loading')
const isError = computed(() => currentVisualizationView.value?.status === 'error')
const isEmpty = computed(() => currentVisualizationView.value?.status === 'empty')
const hasSchema = computed(() => !!currentVisualizationView.value?.schema)

const errorMessage = computed(
  () => currentVisualizationView.value?.errorMessage ?? '시각화 데이터를 불러오지 못했습니다.',
)
const sqlQuery = computed(() => currentVisualizationView.value?.sql ?? '')

// ===== 테이블 =====
const tableModel = computed(() => {
  if (!currentVisualizationView.value) {
    return { columns: [] as TableColumn[], data: [] as Array<Record<string, unknown>> }
  }
  return buildTableModel(currentVisualizationView.value)
})
const tableColumns = computed(() => tableModel.value.columns)
const tableData = computed(() => tableModel.value.data)

// ===== 축 설정 헬퍼 =====
const buildAxisSettingsFromSchema = (): ColumnAxisSetting[] => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return []

  const metricKeySet = new Set(schema.metricKeys)
  const defaultSel = schema.defaultSelection

  // 표시할 컬럼: X축 후보 + Y축 후보 (중복 제거, 순서 유지)
  const displayKeys: string[] = []
  const added = new Set<string>()
  // X축 후보 먼저
  schema.selectableOptions.chartTargetKeys.forEach((key) => {
    if (!added.has(key)) {
      displayKeys.push(key)
      added.add(key)
    }
  })
  // Y축 후보
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

// ===== 축 토글 =====
const onToggleAxisRole = (settings: ColumnAxisSetting[], key: string, role: AxisRole) => {
  const setting = settings.find((s) => s.key === key)
  if (!setting) return

  // 같은 역할 클릭 → 해제
  if (setting.role === role) {
    setting.role = ''
    return
  }

  // X 선택 → 기존 X 해제 (하나만 가능)
  if (role === 'X') {
    settings.forEach((s) => {
      if (s.role === 'X') s.role = ''
    })
  }

  setting.role = role
}

// ===== 축 해제 =====
const onResetAxisRole = (settings: ColumnAxisSetting[], key: string) => {
  const setting = settings.find((s) => s.key === key)
  if (setting) setting.role = ''
}

// ===== 차트 카드 축 토글 =====
const onToggleCardAxisRole = (card: ChartCardState, key: string, role: AxisRole) => {
  onToggleAxisRole(card.axisSettings, key, role)
  card.configVersion++
}

// ===== 차트 카드 타입 변경 =====
const onChangeCardChartType = (card: ChartCardState, chartType: VisualizationChartType) => {
  card.chartType = chartType
  card.configVersion++
}

// ===== axisSettings → VisualizationChartSelection 변환 =====
const axisSettingsToSelection = (
  settings: ColumnAxisSetting[],
  chartType: VisualizationChartType,
): VisualizationChartSelection => {
  const xCol = settings.find((s) => s.role === 'X')
  const ylCols = settings.filter((s) => s.role === 'YL')
  const yrCols = settings.filter((s) => s.role === 'YR')

  return {
    chartType,
    chartTargetKey: xCol?.key ?? '',
    yAxisKeys: [...ylCols.map((c) => c.key), ...yrCols.map((c) => c.key)],
    seriesKey: '',
    stack: false,
    dualAxis: yrCols.length > 0,
  }
}

// ===== 차트 생성 가능 여부 =====
const canCreateChart = computed(() => {
  const hasX = addAxisSettings.value.some((s) => s.role === 'X')
  const hasY = addAxisSettings.value.some((s) => s.role === 'YL' || s.role === 'YR')
  return hasX && hasY
})

// ===== 차트 생성 =====
const createCardId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const onCreateChart = () => {
  if (!canCreateChart.value) {
    addChartError.value = 'X축과 Y축을 각각 1개 이상 선택해주세요.'
    return
  }
  addChartError.value = ''

  const newCard: ChartCardState = {
    id: createCardId(),
    chartType: 'bar',
    axisSettings: JSON.parse(JSON.stringify(addAxisSettings.value)) as ColumnAxisSetting[],
    configVersion: 0,
  }
  chartCards.value.push(newCard)
}

// ===== 차트 삭제 =====
const onRemoveChart = (id: string) => {
  chartCards.value = chartCards.value.filter((card) => card.id !== id)
}

// ===== 차트 뱃지 텍스트 =====
const getChartBadges = (card: ChartCardState): string[] => {
  const xCol = card.axisSettings.find((s) => s.role === 'X')
  const yCols = card.axisSettings.filter((s) => s.role === 'YL' || s.role === 'YR')

  if (yCols.length === 0) return ['사용자 정의 차트']

  return yCols.map((col, i) => {
    if (i === 0 && xCol) return `${xCol.label}별 ${col.label}`
    return col.label
  })
}

// ===== 차트 config 생성 (카드별 캐싱) =====
const configCache = new Map<string, { version: number; config: Record<string, unknown> }>()

const chartConfigMap = computed<Record<string, Record<string, unknown>>>(() => {
  if (!currentVisualizationView.value) return {}
  const mapped: Record<string, Record<string, unknown>> = {}
  chartCards.value.forEach((card) => {
    const cached = configCache.get(card.id)
    // configVersion이 변경되지 않았으면 캐시된 config 재사용
    if (cached && cached.version === card.configVersion) {
      mapped[card.id] = cached.config
      return
    }
    const selection = axisSettingsToSelection(card.axisSettings, card.chartType)
    const config = buildChartModel(currentVisualizationView.value!, selection)
    if (config) {
      configCache.set(card.id, { version: card.configVersion, config })
      mapped[card.id] = config
    }
  })
  // 삭제된 카드 캐시 정리
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

// ===== 헤더 액션 =====
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  toggleBodyChartFullscreen(isFullscreen.value)
  emit('update:fullscreen', isFullscreen.value)
}

const onClose = () => {
  isFullscreen.value = false
  clearBodyChartFullscreen()
  chartCards.value = []
  configCache.clear()
  emit('update:fullscreen', false)
  emit('update:open', false)
}

const toggleSection = (section: 'result' | 'addChart' | 'charts') => {
  sectionOpen[section] = !sectionOpen[section]
}

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const onRefresh = async () => {
  if (!props.messageId) return
  await handleSelectVisualizationData(props.messageId)
}

// ===== 초기화 =====
const initAxisSettings = () => {
  addAxisSettings.value = buildAxisSettingsFromSchema()
  addChartError.value = ''
}

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 제거
// ============================================
const buildDummyVisualizationView = (): VisualizationViewModel => {
  const rows = [
    { 통계명: '1월', '매출액(억)': 125, '매출이익(억)': 87, '영업이익(억)': 25 },
    { 통계명: '2월', '매출액(억)': 132, '매출이익(억)': 92, '영업이익(억)': 26 },
    { 통계명: '3월', '매출액(억)': 148, '매출이익(억)': 103, '영업이익(억)': 30 },
    { 통계명: '4월', '매출액(억)': 155, '매출이익(억)': 108, '영업이익(억)': 31 },
    { 통계명: '5월', '매출액(억)': 162, '매출이익(억)': 113, '영업이익(억)': 32 },
    { 통계명: '6월', '매출액(억)': 170, '매출이익(억)': 119, '영업이익(억)': 34 },
    { 통계명: '7월', '매출액(억)': 178, '매출이익(억)': 124, '영업이익(억)': 36 },
    { 통계명: '8월', '매출액(억)': 185, '매출이익(억)': 129, '영업이익(억)': 38 },
    { 통계명: '9월', '매출액(억)': 192, '매출이익(억)': 134, '영업이익(억)': 40 },
    { 통계명: '10월', '매출액(억)': 201, '매출이익(억)': 140, '영업이익(억)': 42 },
    { 통계명: '11월', '매출액(억)': 215, '매출이익(억)': 150, '영업이익(억)': 45 },
    { 통계명: '12월', '매출액(억)': 237, '매출이익(억)': 166, '영업이익(억)': 50 },
  ]
  const tableData = JSON.stringify(rows)
  const sql = `SELECT\n  TO_CHAR(sale_date, 'YYYY-MM') AS month,\n  ROUND(SUM(amount) / 100000000, 1) AS sales_억\nFROM sales\nWHERE EXTRACT(YEAR FROM sale_date) = 2025\nGROUP BY TO_CHAR(sale_date, 'YYYY-MM')\nORDER BY month;`
  return buildVisualizationViewModel({ messageId: DUMMY_MESSAGE_ID, sql, tableData })
}

const loadDummyData = () => {
  const messageId = props.messageId ?? DUMMY_MESSAGE_ID
  if (!visualizationViewMap.value[messageId]) {
    visualizationViewMap.value[messageId] = buildDummyVisualizationView()
    visualizationViewMap.value[messageId].messageId = messageId
  }
}

watch(
  () => [props.open, props.messageId] as const,
  ([open]) => {
    chartCards.value = []
    if (!open) {
      isFullscreen.value = false
      clearBodyChartFullscreen()
    }
    // 🔽 더미 — 패널 열릴 때 데이터 없으면 더미 로드
    if (open) {
      const id = props.messageId
      if (!id || !visualizationViewMap.value[id]) {
        loadDummyData()
      }
    }
  },
  { immediate: true },
)

// messageId 또는 패널 열림 시에만 축 설정 초기화 (카드 조작 시 재초기화 방지)
const axisInitialized = ref(false)
watch(
  () => [props.messageId, props.open, currentVisualizationView.value?.status] as const,
  () => {
    if (!currentVisualizationView.value || currentVisualizationView.value.status !== 'success') {
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

onUnmounted(() => {
  clearBodyChartFullscreen()
})
</script>

<template>
  <div
    ref="rootEl"
    class="chat-vis-body"
  >
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
            size="xs"
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
        <UiEmpty
          v-if="isError"
          :title="errorMessage"
        />
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
          <div
            v-if="sqlQuery"
            class="chat-vis-sql-area"
            :class="{ 'is-open': isSqlOpen }"
          >
            <UiCodeBlock
              :code="sqlQuery"
              format-sql
            />
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
          <span class="chat-vis-section-subtitle">범례·축을 선택해 새 차트를 생성합니다</span>
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
          <Transition name="chat-vis-fade">
            <div
              v-if="showAddSuccessMsg"
              class="chat-vis-add-success"
            >
              <i class="icon-check-circle size-14"></i>
              차트가 추가되었습니다. 아래에서 축을 수정할 수 있습니다.
            </div>
          </Transition>

          <div class="chat-vis-add-chart-header">
            <span class="chat-vis-add-chart-label">범례·축 선택으로 차트 구성</span>
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

          <div class="chat-vis-add-form">
            <div class="chat-vis-add-form-selectors">
              <div class="chat-vis-add-form-field">
                <span class="chat-vis-add-form-label"> <i class="icon-axis-arrow size-14"></i>범례 </span>
                <UiSelect
                  v-model="addLegend"
                  :options="legendOptions"
                  placeholder="범례 선택"
                  size="sm"
                />
              </div>
              <div class="chat-vis-add-form-field">
                <span class="chat-vis-add-form-label"> <i class="icon-axis-arrow size-14"></i>X축 </span>
                <UiSelect
                  v-model="addXAxis"
                  :options="xAxisOptions"
                  placeholder="X축 선택"
                  size="sm"
                  :disabled="!addLegend"
                />
              </div>
              <div class="chat-vis-add-form-field">
                <span class="chat-vis-add-form-label">Y축</span>
                <template v-if="!isMultiYMode">
                  <UiSelect
                    v-model="addYAxis"
                    :options="yAxisOptions"
                    placeholder="Y축 선택"
                    size="sm"
                  />
                </template>
                <template v-else>
                  <div class="chat-vis-add-y-wrap">
                    <div class="chat-vis-add-y-select">
                      <UiSelect
                        model-value=""
                        :options="[]"
                        :placeholder="isYModalApplied ? yModalAppliedLabel : '복수 후보: 톱니바퀴로 설정'"
                        size="sm"
                        disabled
                      />
                    </div>
                    <button
                      type="button"
                      class="chat-vis-add-y-gear"
                      :class="{ 'is-applied': isYModalApplied }"
                      title="Y축 설정"
                      @click="isYAxisModalOpen = true"
                    >
                      <i class="icon-settings size-16"></i>
                    </button>
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="showModeHint"
              class="chat-vis-mode-hint"
              :class="isGroupMode ? 'is-group' : 'is-aggregate'"
            >
              <i class="icon-info size-14"></i>
              <div class="chat-vis-mode-hint-text">
                <template v-if="isGroupMode">
                  <strong>그룹 모드</strong> — X축 항목 안에서 범례 기준으로 그룹핑됩니다.<br />
                  <span class="chat-vis-mode-hint-example">
                    예: {{ resolveColumnLabel(addXAxis) }} × {{ resolveColumnLabel(addLegend) }} →
                    {{ resolveColumnLabel(addXAxis) }} 항목당 {{ resolveColumnLabel(addLegend) }} 수만큼 막대 생성
                  </span>
                </template>
                <template v-else>
                  <strong>집계 모드</strong> — X축 항목별 합산 값을 단일 막대/선으로 표시합니다.<br />
                  <span class="chat-vis-mode-hint-example">
                    예: {{ resolveColumnLabel(addXAxis) }} = {{ resolveColumnLabel(addLegend) }} →
                    {{ resolveColumnLabel(addXAxis) }} 항목당 막대 1개
                  </span>
                </template>
              </div>
            </div>

            <div
              v-if="isMultiYMode && !isYModalApplied"
              class="chat-vis-y-hint"
            >
              <i class="icon-info size-14"></i>
              <span
                >Y축 후보가 여러 개입니다.
                <button
                  type="button"
                  class="chat-vis-y-hint-btn"
                  @click="isYAxisModalOpen = true"
                >
                  톱니바퀴</button
                >를 눌러 YL·YR 축을 설정해 주세요.</span
              >
            </div>

            <div
              v-if="showModeHint && !isMultiYMode"
              class="chat-vis-add-form-row"
            >
              <span class="chat-vis-add-form-label">차트</span>
              <div class="chat-vis-chart-type-buttons">
                <button
                  type="button"
                  class="chat-vis-type-btn"
                  :class="{ 'is-active': addChartType === 'bar' }"
                  title="막대 차트"
                  @click="addChartType = 'bar'"
                >
                  <i class="icon-bar-chart size-20"></i>
                </button>
                <button
                  type="button"
                  class="chat-vis-type-btn"
                  :class="{ 'is-active': addChartType === 'line' }"
                  title="라인 차트"
                  @click="addChartType = 'line'"
                >
                  <i class="icon-line-chart size-20"></i>
                </button>
                <button
                  type="button"
                  class="chat-vis-type-btn"
                  :class="{ 'is-active': addChartType === 'pie' }"
                  title="파이 차트"
                  @click="addChartType = 'pie'"
                >
                  <i class="icon-pie-chart size-20"></i>
                </button>
              </div>
            </div>
          </div>

          <div
            v-if="addChartError"
            class="chat-vis-add-chart-error"
          >
            {{ addChartError }}
          </div>
        </div>

        <ChartYAxisModal
          :is-open="isYAxisModalOpen"
          :options="yAxisOptions"
          :initial-y-l="addYL"
          :initial-y-r="addYR"
          :initial-y-l-type="addYLType"
          :initial-y-r-type="addYRType"
          @close="isYAxisModalOpen = false"
          @apply="onApplyYAxisModal"
        />
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
          <span class="chat-vis-section-title">생성된 차트</span>
          <span class="chat-vis-section-subtitle">축 또는 차트 유형을 변경할 수 있습니다</span>
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
              <span
                v-if="!card.dbChartId"
                class="chat-vis-card-unsaved-badge"
                >미저장</span
              >
              <span class="chat-vis-card-edit-label">
                <i class="icon-adjustments-horizontal size-11"></i>
                축 수정
              </span>
            </div>
            <div class="chat-vis-card-header-right">
              <UiButton
                v-if="onSaveChart"
                size="xs"
                :variant="card.dbChartId ? 'secondary' : 'primary'"
                :disabled="card.isSavingCard"
                @click="onSaveCardToDb(card)"
              >
                저장
              </UiButton>
              <button
                type="button"
                class="chat-vis-card-close"
                title="삭제"
                @click="onRemoveChart(card.id)"
              >
                <i class="icon-close size-14"></i>
              </button>
            </div>
          </div>
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
          <div
            v-if="cardEditState[card.id]"
            class="chat-vis-card-toolbar"
          >
            <div class="chat-vis-add-form">
              <div class="chat-vis-add-form-selectors">
                <div class="chat-vis-add-form-field">
                  <span class="chat-vis-add-form-label"> <i class="icon-axis-arrow size-14"></i>범례 </span>
                  <UiSelect
                    v-model="cardEditState[card.id].legend"
                    :options="legendOptions"
                    placeholder="범례 선택"
                    size="sm"
                    @update:model-value="onCardFormChange(card)"
                  />
                </div>
                <div class="chat-vis-add-form-field">
                  <span class="chat-vis-add-form-label"> <i class="icon-axis-arrow size-14"></i>X축 </span>
                  <UiSelect
                    v-model="cardEditState[card.id].xAxis"
                    :options="xAxisOptions"
                    placeholder="X축 선택"
                    size="sm"
                    @update:model-value="onCardFormChange(card)"
                  />
                </div>
                <div class="chat-vis-add-form-field">
                  <span class="chat-vis-add-form-label">Y축</span>
                  <template v-if="!isMultiYMode">
                    <UiSelect
                      v-model="cardEditState[card.id].yAxis"
                      :options="yAxisOptions"
                      placeholder="Y축 선택"
                      size="sm"
                      @update:model-value="onCardFormChange(card)"
                    />
                  </template>
                  <template v-else>
                    <div class="chat-vis-add-y-wrap">
                      <div class="chat-vis-add-y-select">
                        <UiSelect
                          model-value=""
                          :options="[]"
                          :placeholder="
                            cardEditState[card.id].isYModalApplied ? cardYModalLabel(card.id) : '톱니바퀴로 설정'
                          "
                          size="sm"
                          disabled
                        />
                      </div>
                      <button
                        type="button"
                        class="chat-vis-add-y-gear"
                        :class="{ 'is-applied': cardEditState[card.id].isYModalApplied }"
                        title="Y축 설정"
                        @click="cardEditState[card.id].isYModalOpen = true"
                      >
                        <i class="icon-settings size-16"></i>
                      </button>
                    </div>
                  </template>
                </div>
              </div>
              <div
                v-if="!isMultiYMode"
                class="chat-vis-chart-type-buttons"
              >
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
            <ChartYAxisModal
              :is-open="cardEditState[card.id].isYModalOpen"
              :options="yAxisOptions"
              :initial-y-l="cardEditState[card.id].yL"
              :initial-y-r="cardEditState[card.id].yR"
              :initial-y-l-type="cardEditState[card.id].yLType"
              :initial-y-r-type="cardEditState[card.id].yRType"
              @close="cardEditState[card.id].isYModalOpen = false"
              @apply="onCardYModalApply(card, $event)"
            />
          </div>
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
import { UiLoading, UiEmpty, UiTable, UiButton, UiSelect } from '@leechanyong/ispark-ui'
import type {
  VisualizationChartSelection,
  VisualizationChartType,
  VisualizationSelectOption,
  VisualizationViewModel,
} from '~/types/chat'
import type { TableColumn } from '~/types/table'
import type { KnowChartItem } from '~/types/library'
import {
  buildChartModel,
  buildChartTargetOptions,
  buildMetricOptions,
  buildTableModel,
  getUniqueStatIdsFromRows,
  inferSeriesKeyFromChartTargets,
  isPieChartUnavailable,
} from '~/utils/chat/visualizationUtil'
import { resolveColumnLabel, resolveDisplayValue } from '~/utils/chat/visualizationLabelMap'

interface Props {
  open?: boolean
  viewModel: VisualizationViewModel | null
  /** 지식카드에 저장된 차트 목록 — 모달 오픈 시 복원 */
  initialCharts?: KnowChartItem[]
  /** 차트 신규 저장 콜백 → 새 chartId 반환 */
  onSaveChart?: (selection: VisualizationChartSelection, sortOrd: number) => Promise<string>
  /** 차트 수정 콜백 (기존 chartId 유지) */
  onUpdateChart?: (chartId: string, selection: VisualizationChartSelection, sortOrd: number) => Promise<void>
  /** 차트 삭제 시 DB 삭제 콜백 */
  onDeleteChart?: (chartId: string) => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  initialCharts: () => [],
  onSaveChart: undefined,
  onUpdateChart: undefined,
  onDeleteChart: undefined,
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
  initialSelection?: VisualizationChartSelection
  dbChartId: string | null // null = 미저장, string = DB에 저장된 chartId
  isSavingCard: boolean
}

interface CardEditState {
  legend: string
  xAxis: string
  yAxis: string
  yL: string
  yR: string
  yLType: 'bar' | 'line'
  yRType: 'bar' | 'line'
  isYModalOpen: boolean
  isYModalApplied: boolean
}

const cardEditState = ref<Record<string, CardEditState>>({})

const initCardEditState = (cardId: string, sel?: VisualizationChartSelection) => {
  const yOpts = yAxisOptions.value
  cardEditState.value[cardId] = {
    legend: sel?.seriesKey ?? legendOptions.value[0]?.value ?? '',
    xAxis: sel?.chartTargetKey ?? xAxisOptions.value[0]?.value ?? '',
    yAxis: (!sel?.dualAxis ? sel?.yAxisKeys[0] : undefined) ?? yOpts[0]?.value ?? '',
    yL: (sel?.dualAxis ? sel?.yAxisKeys[0] : undefined) ?? yOpts[0]?.value ?? '',
    yR: (sel?.dualAxis ? sel?.yAxisKeys[1] : undefined) ?? yOpts[1]?.value ?? yOpts[0]?.value ?? '',
    yLType: sel?.ylChartType ?? 'bar',
    yRType: sel?.yrChartType ?? 'line',
    isYModalOpen: false,
    isYModalApplied: !!sel?.dualAxis,
  }
}

const cardYModalLabel = (cardId: string) => {
  const s = cardEditState.value[cardId]
  if (!s) return ''
  const ylLabel = yAxisOptions.value.find((o) => o.value === s.yL)?.label ?? s.yL
  const yrLabel = yAxisOptions.value.find((o) => o.value === s.yR)?.label ?? s.yR
  const ylT = s.yLType === 'bar' ? '막대' : '라인'
  const yrT = s.yRType === 'bar' ? '막대' : '라인'
  return `YL: ${ylLabel}(${ylT}) / YR: ${yrLabel}(${yrT})`
}

const onCardFormChange = (card: ChartCardState) => {
  const edit = cardEditState.value[card.id]
  if (!edit) return
  const isGroup = edit.legend !== edit.xAxis
  const isDualAxis = isMultiYMode.value && !isGroup
  const yKeys = isDualAxis ? [edit.yL, edit.yR].filter(Boolean) : [edit.yAxis]
  const effectiveType: VisualizationChartType = isDualAxis
    ? edit.yLType === edit.yRType
      ? edit.yLType
      : 'mixed'
    : card.chartType
  card.initialSelection = {
    chartType: effectiveType,
    chartTargetKey: edit.xAxis,
    yAxisKeys: yKeys,
    seriesKey: edit.legend,
    stack: false,
    dualAxis: isDualAxis,
    statIdFilter: card.statIdFilter || undefined,
    ylChartType: isDualAxis ? edit.yLType : undefined,
    yrChartType: isDualAxis ? edit.yRType : undefined,
  }
  card.chartType = effectiveType
  card.axisSettings = buildAxisSettingsFromNewState(edit.xAxis, edit.yAxis, edit.yL, edit.yR)
  card.configVersion++
}

const onCardYModalApply = (
  card: ChartCardState,
  value: { yl: string; yr: string; ylChartType: 'bar' | 'line'; yrChartType: 'bar' | 'line' },
) => {
  const edit = cardEditState.value[card.id]
  if (!edit) return
  edit.yL = value.yl
  edit.yR = value.yr
  edit.yLType = value.ylChartType
  edit.yRType = value.yrChartType
  edit.isYModalApplied = true
  edit.isYModalOpen = false
  onCardFormChange(card)
}

const addLegend = ref('')
const addXAxis = ref('')
const addYAxis = ref('')
const showAddSuccessMsg = ref(false)
const addYL = ref('')
const addYR = ref('')
const addYLType = ref<'bar' | 'line'>('bar')
const addYRType = ref<'bar' | 'line'>('line')
const addChartType = ref<VisualizationChartType>('bar')
const addChartError = ref('')
const isYAxisModalOpen = ref(false)
const isYModalApplied = ref(false)

const chartCards = ref<ChartCardState[]>([])
const selectedStatIdForAdd = ref('')
const addFormInitialized = ref(false)
const chartsInitialized = ref(false)

const currentVisualizationView = computed(() => props.viewModel)

const isLoading = computed(() => currentVisualizationView.value?.status === 'loading')
const isError = computed(() => currentVisualizationView.value?.status === 'error')
const isEmpty = computed(() => currentVisualizationView.value?.status === 'empty')
const hasSchema = computed(() => !!currentVisualizationView.value?.schema)
const hasStatIdColumn = computed(() => !!currentVisualizationView.value?.schema?.statIdColumnKey)

const legendOptions = computed<VisualizationSelectOption[]>(() =>
  buildChartTargetOptions(currentVisualizationView.value?.schema ?? null),
)
const xAxisOptions = computed<VisualizationSelectOption[]>(() =>
  buildChartTargetOptions(currentVisualizationView.value?.schema ?? null),
)
const yAxisOptions = computed<VisualizationSelectOption[]>(() =>
  buildMetricOptions(currentVisualizationView.value?.schema ?? null),
)

const isMultiYMode = computed(() => currentVisualizationView.value?.schema?.selectableOptions.canDualAxis === true)
const showModeHint = computed(() => !!addLegend.value && !!addXAxis.value)
const isGroupMode = computed(() => showModeHint.value && addLegend.value !== addXAxis.value)

const yModalAppliedLabel = computed(() => {
  if (!isYModalApplied.value) return ''
  const ylLabel = yAxisOptions.value.find((o) => o.value === addYL.value)?.label ?? addYL.value
  const yrLabel = yAxisOptions.value.find((o) => o.value === addYR.value)?.label ?? addYR.value
  const ylTypeLabel = addYLType.value === 'bar' ? '막대' : '라인'
  const yrTypeLabel = addYRType.value === 'bar' ? '막대' : '라인'
  return `YL: ${ylLabel}(${ylTypeLabel}) / YR: ${yrLabel}(${yrTypeLabel})`
})

const canCreateChart = computed(() => {
  if (!addLegend.value || !addXAxis.value) return false
  if (isMultiYMode.value && !isYModalApplied.value) return false
  if (!isMultiYMode.value && !addYAxis.value) return false
  return true
})

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
    if (ids.length === 0) {
      selectedStatIdForAdd.value = ''
    } else if (!ids.includes(selectedStatIdForAdd.value)) {
      selectedStatIdForAdd.value = ids[0]
    }
  },
  { immediate: true },
)

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
    return { ...column, sortable: isSortable, sortType: 'auto' as const }
  })
})
const tableData = computed(() => tableModel.value.data)

const onChangeCardChartType = (card: ChartCardState, chartType: VisualizationChartType) => {
  card.chartType = chartType
  if (card.initialSelection) card.initialSelection = { ...card.initialSelection, chartType }
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

const pieChartUnavailableDescription = `1. 데이터값에 음수(-)가 들어가는 경우\n2. 전체 합산값이 0 이하인 경우`

const isPieChartUnavailableForCard = (card: ChartCardState) => {
  const vm = currentVisualizationView.value
  const schema = vm?.schema
  if (!vm || !schema || card.chartType !== 'pie') return false
  const selection = card.initialSelection
    ? card.initialSelection
    : axisSettingsToSelection(
        card.axisSettings,
        card.chartType,
        schema.selectableOptions.canDualAxis,
        schema.selectableOptions.chartTargetKeys,
        card.statIdFilter ?? '',
      )
  return isPieChartUnavailable(vm, selection)
}

const createCardId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const buildAxisSettingsFromNewState = (
  xKey: string,
  yKey: string,
  ylKey: string,
  yrKey: string,
): ColumnAxisSetting[] => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return []
  const isMulti = isMultiYMode.value
  const metricKeySet = new Set(schema.metricKeys)
  const displayKeys: string[] = []
  const added = new Set<string>()
  schema.selectableOptions.chartTargetKeys.forEach((k) => {
    if (!added.has(k)) {
      displayKeys.push(k)
      added.add(k)
    }
  })
  schema.selectableOptions.yAxisKeys.forEach((k) => {
    if (!added.has(k)) {
      displayKeys.push(k)
      added.add(k)
    }
  })
  return displayKeys.map((key) => {
    let role: AxisRole = ''
    if (key === xKey) role = 'X'
    else if (!isMulti && key === yKey) role = 'YL'
    else if (isMulti && key === ylKey) role = 'YL'
    else if (isMulti && key === yrKey) role = 'YR'
    return { key, label: resolveColumnLabel(key), role, canMetric: metricKeySet.has(key) }
  })
}

/** KnowChartItem → VisualizationChartSelection 변환 */
const knowChartToSelection = (item: KnowChartItem): VisualizationChartSelection => {
  // Y_AXIS_KEYS는 DB JSON 컬럼 — 백엔드 설정에 따라 문자열로 내려올 수 있음
  const yAxisKeys: string[] = Array.isArray(item.yAxisKeys)
    ? item.yAxisKeys
    : (() => {
        try {
          return JSON.parse(item.yAxisKeys as unknown as string)
        } catch {
          return []
        }
      })()

  return {
    chartType: item.chartType as VisualizationChartType,
    chartTargetKey: item.chartTargetKey,
    yAxisKeys,
    seriesKey: item.seriesKey,
    stack: item.stackYn === 'Y',
    dualAxis: item.dualAxisYn === 'Y',
    statIdFilter: item.statIdFilter || undefined,
    ylChartType: (item.ylChartType as 'bar' | 'line') || undefined,
    yrChartType: (item.yrChartType as 'bar' | 'line') || undefined,
  }
}

/** DB에 저장된 차트 목록을 chartCards로 복원 */
const restoreInitialCharts = () => {
  if (!props.initialCharts?.length) return
  const sorted = [...props.initialCharts].sort((a, b) => a.sortOrd - b.sortOrd)
  for (const item of sorted) {
    const selection = knowChartToSelection(item)
    const card: ChartCardState = {
      id: item.chartId,
      chartType: selection.chartType,
      axisSettings: buildAxisSettingsFromNewState(
        selection.chartTargetKey,
        !selection.dualAxis ? (selection.yAxisKeys[0] ?? '') : '',
        selection.dualAxis ? (selection.yAxisKeys[0] ?? '') : '',
        selection.dualAxis ? (selection.yAxisKeys[1] ?? '') : '',
      ),
      configVersion: 0,
      statIdFilter: selection.statIdFilter ?? '',
      initialSelection: selection,
      dbChartId: item.chartId,
      isSavingCard: false,
    }
    chartCards.value.push(card)
    initCardEditState(item.chartId, selection)
  }
}

const onCreateChart = () => {
  if (!canCreateChart.value) {
    if (!addLegend.value || !addXAxis.value) {
      addChartError.value = '범례와 X축을 선택해주세요.'
    } else if (isMultiYMode.value && !isYModalApplied.value) {
      addChartError.value = '톱니바퀴를 눌러 Y축 설정을 완료해주세요.'
    } else if (!isMultiYMode.value && !addYAxis.value) {
      addChartError.value = 'Y축을 선택해주세요.'
    }
    return
  }
  addChartError.value = ''

  const statId = hasStatIdColumn.value ? selectedStatIdForAdd.value : ''

  const yKeys = isMultiYMode.value ? [addYL.value, addYR.value].filter(Boolean) : [addYAxis.value]
  const isGroup = addLegend.value !== addXAxis.value
  const isDualAxis = isMultiYMode.value && !isGroup
  const effectiveChartType: VisualizationChartType = isDualAxis
    ? addYLType.value === addYRType.value
      ? addYLType.value
      : 'mixed'
    : addChartType.value

  const initialSelection: VisualizationChartSelection = {
    chartType: effectiveChartType,
    chartTargetKey: addXAxis.value,
    yAxisKeys: yKeys,
    seriesKey: addLegend.value,
    stack: false,
    dualAxis: isDualAxis,
    statIdFilter: statId || undefined,
    ylChartType: isDualAxis ? addYLType.value : undefined,
    yrChartType: isDualAxis ? addYRType.value : undefined,
  }

  const tempId = createCardId()
  chartCards.value.push({
    id: tempId,
    chartType: effectiveChartType,
    axisSettings: buildAxisSettingsFromNewState(addXAxis.value, addYAxis.value, addYL.value, addYR.value),
    configVersion: 0,
    statIdFilter: statId,
    initialSelection,
    dbChartId: null,
    isSavingCard: false,
  })
  initCardEditState(tempId, initialSelection)

  showAddSuccessMsg.value = true
  setTimeout(() => {
    showAddSuccessMsg.value = false
  }, 2000)
}

const onSelectCardStatId = (card: ChartCardState, statId: string) => {
  card.statIdFilter = statId
  if (card.initialSelection) card.initialSelection = { ...card.initialSelection, statIdFilter: statId || undefined }
  card.configVersion++
}

const onRemoveChart = async (id: string) => {
  const card = chartCards.value.find((c) => c.id === id)
  if (!card) return

  if (card.dbChartId && props.onDeleteChart) {
    try {
      await props.onDeleteChart(card.dbChartId)
    } catch {
      return
    }
  }

  chartCards.value = chartCards.value.filter((c) => c.id !== id)
  cardEditState.value = Object.fromEntries(Object.entries(cardEditState.value).filter(([key]) => key !== id))
  configCache.delete(id)
}

const onSaveCardToDb = async (card: ChartCardState) => {
  if (!props.onSaveChart || card.isSavingCard) return
  card.isSavingCard = true
  try {
    const vm = currentVisualizationView.value
    const schema = vm?.schema
    const selection =
      card.initialSelection ??
      (schema
        ? axisSettingsToSelection(
            card.axisSettings,
            card.chartType,
            schema.selectableOptions.canDualAxis,
            schema.selectableOptions.chartTargetKeys,
            card.statIdFilter ?? '',
          )
        : null)
    if (!selection) return

    const sortOrd = chartCards.value.findIndex((c) => c.id === card.id)
    if (card.dbChartId) {
      await props.onUpdateChart?.(card.dbChartId, selection, sortOrd)
    } else {
      const newChartId = await props.onSaveChart(selection, sortOrd)
      card.dbChartId = newChartId
    }
    openToast({ message: '차트가 저장되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '차트 저장에 실패했습니다. 다시 시도해주세요.', type: 'error' })
  } finally {
    card.isSavingCard = false
  }
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
    const selection = card.initialSelection
      ? card.initialSelection
      : axisSettingsToSelection(
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
  if (schema.selectableOptions.yAxisKeys.length === 0) return '통계값으로 판단되는 Y축 컬럼이 없습니다.'
  if (schema.selectableOptions.chartTargetKeys.length === 0) return 'X축으로 사용할 수 있는 컬럼이 없습니다.'
  return '위 "차트 추가" 영역에서 축을 설정한 뒤 차트를 생성하세요.'
})

const onApplyYAxisModal = (value: {
  yl: string
  yr: string
  ylChartType: 'bar' | 'line'
  yrChartType: 'bar' | 'line'
}) => {
  addYL.value = value.yl
  addYR.value = value.yr
  addYLType.value = value.ylChartType
  addYRType.value = value.yrChartType
  isYModalApplied.value = true
  isYAxisModalOpen.value = false
}

const initAddForm = () => {
  const schema = currentVisualizationView.value?.schema
  if (!schema) return
  addChartType.value = schema.defaultSelection.chartType
  addLegend.value = legendOptions.value[0]?.value ?? ''
  addXAxis.value = xAxisOptions.value[0]?.value ?? ''
  addChartError.value = ''
  if (isMultiYMode.value) {
    addYL.value = yAxisOptions.value[0]?.value ?? ''
    addYR.value = yAxisOptions.value[1]?.value ?? yAxisOptions.value[0]?.value ?? ''
    addYLType.value = 'bar'
    addYRType.value = 'line'
    isYModalApplied.value = false
    isYAxisModalOpen.value = false
  } else {
    addYAxis.value = yAxisOptions.value[0]?.value ?? ''
  }
}

const toggleSection = (section: 'result' | 'addChart' | 'charts') => {
  sectionOpen[section] = !sectionOpen[section]
}

const rootEl = ref<HTMLElement | null>(null)

/**
 * 현재 렌더된 모든 차트를 base64 PNG로 캡처.
 * 차트 섹션이 접혀 있으면 잠시 펼쳤다가 복원한다.
 */
const captureChartImages = async (): Promise<string[]> => {
  if (chartCards.value.length === 0) return []
  const wasOpen = sectionOpen.charts
  if (!wasOpen) {
    sectionOpen.charts = true
    await nextTick()
    await new Promise<void>((r) => setTimeout(r, 300))
  }
  const images: string[] = []
  if (rootEl.value) {
    rootEl.value.querySelectorAll<HTMLCanvasElement>('.chat-vis-chart-area canvas').forEach((canvas) => {
      if (canvas.width > 0) {
        try {
          images.push(canvas.toDataURL('image/png'))
        } catch {
          // cross-origin 등 캡처 불가 시 무시
        }
      }
    })
  }
  if (!wasOpen) sectionOpen.charts = false
  return images
}

defineExpose({ captureChartImages })

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

// 패널 열기 / messageId 변경 시 초기화
watch(
  () => [props.open, props.viewModel?.messageId] as const,
  ([open]) => {
    chartCards.value = []
    cardEditState.value = {}
    configCache.clear()
    addFormInitialized.value = false
    chartsInitialized.value = false
    if (!open) {
      selectedStatIdForAdd.value = ''
      addChartError.value = ''
      isSqlOpen.value = false
      isYAxisModalOpen.value = false
      isYModalApplied.value = false
    }
  },
  { immediate: true },
)

// viewModel success 시 폼 초기화 + 저장된 차트 복원 (최초 1회)
watch(
  () => [props.viewModel?.messageId, props.open, currentVisualizationView.value?.status] as const,
  () => {
    if (!props.open || !currentVisualizationView.value || currentVisualizationView.value.status !== 'success') {
      addFormInitialized.value = false
      chartsInitialized.value = false
      return
    }
    if (!addFormInitialized.value) {
      initAddForm()
      addFormInitialized.value = true
    }
    if (!chartsInitialized.value) {
      restoreInitialCharts()
      chartsInitialized.value = true
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
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

.chat-vis-card-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.chat-vis-card-unsaved-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: $border-radius-sm;
  background: var(--color-warning-bg, #fff8e1);
  color: var(--color-warning, #f59e0b);
  @include typo($body-caption-bold);
}
</style>

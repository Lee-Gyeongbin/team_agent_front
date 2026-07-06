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
          <!-- 차트 생성 성공 메시지 -->
          <Transition name="chat-vis-fade">
            <div
              v-if="showAddSuccessMsg"
              class="chat-vis-add-success"
            >
              <i class="icon-check-circle size-14"></i>
              차트가 추가되었습니다. 아래에서 축을 수정할 수 있습니다.
            </div>
          </Transition>

          <!-- 헤더: 레이블 + 차트 생성 버튼 -->
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

          <!-- 셀렉박스 기반 축 설정 폼 -->
          <div class="chat-vis-add-form">
            <!-- 1+2+4. 범례 / X축 / Y축 한 줄 -->
            <div class="chat-vis-add-form-selectors">
              <!-- 범례 -->
              <div class="chat-vis-add-form-field">
                <span class="chat-vis-add-form-label"> <i class="icon-axis-arrow size-14"></i>범례 </span>
                <UiSelect
                  v-model="addLegend"
                  :options="legendOptions"
                  placeholder="범례 선택"
                  size="sm"
                />
              </div>
              <!-- X축 -->
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
              <!-- Y축 -->
              <div class="chat-vis-add-form-field">
                <span class="chat-vis-add-form-label">Y축</span>
                <!-- 단일 Y축 모드 -->
                <template v-if="!isMultiYMode">
                  <UiSelect
                    v-model="addYAxis"
                    :options="yAxisOptions"
                    placeholder="Y축 선택"
                    size="sm"
                  />
                </template>
                <!-- 복수 Y축 모드 -->
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

            <!-- 3. 케이스 안내 박스 -->
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

            <!-- Y축 복수 모드 안내 -->
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

            <!-- 5. 차트 종류 버튼 그룹 (단일 Y축 모드이고 범례 + X축 선택 후) -->
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

          <!-- 유효성 에러 -->
          <div
            v-if="addChartError"
            class="chat-vis-add-chart-error"
          >
            {{ addChartError }}
          </div>
        </div>

        <!-- Y축 설정 모달 -->
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
              <span class="chat-vis-card-edit-label">
                <i class="icon-adjustments-horizontal size-11"></i>
                축 수정
              </span>
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
          <!-- 축 수정 (셀렉박스 기반) -->
          <div
            v-if="cardEditState[card.id]"
            class="chat-vis-card-toolbar"
          >
            <div class="chat-vis-add-form">
              <!-- 범례 / X축 / Y축 한 줄 -->
              <div class="chat-vis-add-form-selectors">
                <!-- 범례 -->
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
                <!-- X축 -->
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
                <!-- Y축 -->
                <div class="chat-vis-add-form-field">
                  <span class="chat-vis-add-form-label">Y축</span>
                  <!-- 단일 Y축 -->
                  <template v-if="!isMultiYMode">
                    <UiSelect
                      v-model="cardEditState[card.id].yAxis"
                      :options="yAxisOptions"
                      placeholder="Y축 선택"
                      size="sm"
                      @update:model-value="onCardFormChange(card)"
                    />
                  </template>
                  <!-- 복수 Y축 -->
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
              <!-- 차트 타입 버튼 (단일 Y축 모드만) -->
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
            <!-- 카드별 Y축 설정 모달 -->
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
import { UiLoading } from '@leechanyong/ispark-ui'
import type {
  VisualizationChartSelection,
  VisualizationChartType,
  VisualizationSelectOption,
  VisualizationViewModel,
} from '~/types/chat'
import type { TableColumn } from '~/types/table'
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
  /** 새 UI에서 생성 시 저장되는 selection (카드 축 수동 편집 전까지 사용) */
  initialSelection?: VisualizationChartSelection
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

// ===== 카드 편집 폼 상태 (카드 id → 폼 상태) =====
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

// ===== 차트 추가 폼 상태 (셀렉박스 기반) =====
const addLegend = ref('')
const addXAxis = ref('')
const addYAxis = ref('') // 단일 Y축 모드
const showAddSuccessMsg = ref(false)
const addYL = ref('') // 복수 Y축 모드 — YL 컬럼
const addYR = ref('') // 복수 Y축 모드 — YR 컬럼
const addYLType = ref<'bar' | 'line'>('bar') // 복수 Y축 모드 — YL 차트 타입
const addYRType = ref<'bar' | 'line'>('line') // 복수 Y축 모드 — YR 차트 타입
const addChartType = ref<VisualizationChartType>('bar')
const addChartError = ref('')
const isYAxisModalOpen = ref(false)
const isYModalApplied = ref(false)

const chartCards = ref<ChartCardState[]>([])
const selectedStatIdForAdd = ref('')
const addFormInitialized = ref(false)

const canRefresh = computed(() => typeof props.onRefresh === 'function')
const currentVisualizationView = computed(() => props.viewModel)

const isLoading = computed(() => currentVisualizationView.value?.status === 'loading')
const isError = computed(() => currentVisualizationView.value?.status === 'error')
const isEmpty = computed(() => currentVisualizationView.value?.status === 'empty')
const hasSchema = computed(() => !!currentVisualizationView.value?.schema)

const hasStatIdColumn = computed(() => !!currentVisualizationView.value?.schema?.statIdColumnKey)

// ===== 셀렉박스 옵션 =====
const legendOptions = computed<VisualizationSelectOption[]>(() =>
  buildChartTargetOptions(currentVisualizationView.value?.schema ?? null),
)
const xAxisOptions = computed<VisualizationSelectOption[]>(() =>
  buildChartTargetOptions(currentVisualizationView.value?.schema ?? null),
)
const yAxisOptions = computed<VisualizationSelectOption[]>(() =>
  buildMetricOptions(currentVisualizationView.value?.schema ?? null),
)

// 복수 Y축 모드 여부 (y 후보가 2개 이상)
const isMultiYMode = computed(() => currentVisualizationView.value?.schema?.selectableOptions.canDualAxis === true)

// 케이스 안내 표시 조건
const showModeHint = computed(() => !!addLegend.value && !!addXAxis.value)
const isGroupMode = computed(() => showModeHint.value && addLegend.value !== addXAxis.value)

// 복수 Y축 적용 후 플레이스홀더 레이블
const yModalAppliedLabel = computed(() => {
  if (!isYModalApplied.value) return ''
  const ylLabel = yAxisOptions.value.find((o) => o.value === addYL.value)?.label ?? addYL.value
  const yrLabel = yAxisOptions.value.find((o) => o.value === addYR.value)?.label ?? addYR.value
  const ylTypeLabel = addYLType.value === 'bar' ? '막대' : '라인'
  const yrTypeLabel = addYRType.value === 'bar' ? '막대' : '라인'
  return `YL: ${ylLabel}(${ylTypeLabel}) / YR: ${yrLabel}(${yrTypeLabel})`
})

// 차트 생성 버튼 활성화 조건
const canCreateChart = computed(() => {
  if (!addLegend.value || !addXAxis.value) return false
  if (isMultiYMode.value && !isYModalApplied.value) return false
  if (!isMultiYMode.value && !addYAxis.value) return false
  if (hasStatIdColumn.value && uniqueStatIdsForChart.value.length > 1 && !selectedStatIdForAdd.value) return false
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
    if (ids.length === 1) selectedStatIdForAdd.value = ids[0]
    else if (ids.length === 0) selectedStatIdForAdd.value = ''
    else if (ids.length > 1 && !ids.includes(selectedStatIdForAdd.value)) selectedStatIdForAdd.value = ''
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

    return {
      ...column,
      sortable: isSortable,
      sortType: 'auto' as const,
    }
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

const pieChartUnavailableDescription = `1. 데이터값에 음수(-)가 들어가는 경우
2. 전체 합산값이 0 이하인 경우`

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

/**
 * 새 UI 상태 → axisSettings 변환.
 * 카드 툴바(섹션 3) 표시용으로만 사용하며 렌더링은 initialSelection을 따른다.
 */
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

// ===== 차트 생성 =====
const onCreateChart = () => {
  if (!canCreateChart.value) {
    if (!addLegend.value || !addXAxis.value) {
      addChartError.value = '범례와 X축을 선택해주세요.'
    } else if (isMultiYMode.value && !isYModalApplied.value) {
      addChartError.value = '톱니바퀴를 눌러 Y축 설정을 완료해주세요.'
    } else if (!isMultiYMode.value && !addYAxis.value) {
      addChartError.value = 'Y축을 선택해주세요.'
    } else if (hasStatIdColumn.value && uniqueStatIdsForChart.value.length > 1 && !selectedStatIdForAdd.value) {
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

  const yKeys = isMultiYMode.value ? [addYL.value, addYR.value].filter(Boolean) : [addYAxis.value]
  const isGroup = addLegend.value !== addXAxis.value
  const isDualAxis = isMultiYMode.value && !isGroup

  // 이축 모드 차트 타입: YL·YR이 같으면 단일 타입, 다르면 'mixed'
  const effectiveChartType: VisualizationChartType = isDualAxis
    ? addYLType.value === addYRType.value
      ? addYLType.value
      : 'mixed'
    : addChartType.value

  // initialSelection: 새 UI 선택 → VisualizationChartSelection 직접 구성
  // seriesKey = addLegend (집계 모드 시 sanitizeSelection이 '' 처리)
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

  chartCards.value.push({
    id: createCardId(),
    chartType: effectiveChartType,
    axisSettings: buildAxisSettingsFromNewState(addXAxis.value, addYAxis.value, addYL.value, addYR.value),
    configVersion: 0,
    statIdFilter: statId,
    initialSelection,
  })

  const newCard = chartCards.value[chartCards.value.length - 1]
  initCardEditState(newCard.id, initialSelection)

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

const onRemoveChart = (id: string) => {
  chartCards.value = chartCards.value.filter((card) => card.id !== id)
  cardEditState.value = Object.fromEntries(Object.entries(cardEditState.value).filter(([key]) => key !== id))
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
    // initialSelection이 있으면 직접 사용 (새 UI 생성 카드)
    // 없으면 axisSettings에서 파생 (수동 편집된 카드)
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
  if (schema.selectableOptions.yAxisKeys.length === 0) {
    return '통계값으로 판단되는 Y축 컬럼이 없습니다.'
  }
  if (schema.selectableOptions.chartTargetKeys.length === 0) {
    return 'X축으로 사용할 수 있는 컬럼이 없습니다.'
  }
  return '위 "차트 추가" 영역에서 축을 설정한 뒤 차트를 생성하세요.'
})

// ===== Y축 설정 모달 =====
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

// ===== 폼 초기화 =====
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

const toggleSql = () => {
  isSqlOpen.value = !isSqlOpen.value
}

const handleRefresh = async () => {
  if (!props.onRefresh) return
  await props.onRefresh()
}

// 패널 열기/messageId 변경 시 차트 카드 + 폼 초기화
watch(
  () => [props.open, props.viewModel?.messageId] as const,
  ([open]) => {
    chartCards.value = []
    cardEditState.value = {}
    configCache.clear()
    addFormInitialized.value = false // messageId 변경 시 폼 재초기화 트리거
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

// viewModel status가 success가 되면 폼 초기화 (최초 1회)
watch(
  () => [props.viewModel?.messageId, props.open, currentVisualizationView.value?.status] as const,
  () => {
    if (!props.open || !currentVisualizationView.value || currentVisualizationView.value.status !== 'success') {
      addFormInitialized.value = false
      return
    }
    if (!addFormInitialized.value) {
      initAddForm()
      addFormInitialized.value = true
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

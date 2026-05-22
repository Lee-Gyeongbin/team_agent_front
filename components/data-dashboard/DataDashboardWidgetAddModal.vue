<template>
  <UiModal
    :is-open="isOpen"
    title="위젯 추가"
    :max-width="'min(1200px, calc(100vw - 32px))'"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="widget-add-layout">
      <!-- 좌측: SQL 목록 -->
      <div class="widget-add-left">
        <div class="widget-add-panel-header">
          <span class="widget-add-panel-title">데이터분석 질의 목록</span>
        </div>
        <div class="widget-add-left-search">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="Text To SQL 검색"
          />
        </div>
        <div class="widget-add-left-list">
          <UiLoading
            v-if="sqlListLoading"
            text="불러오는 중..."
          />
          <template v-else-if="filteredSqlList.length">
            <div class="sql-list">
              <button
                v-for="sql in filteredSqlList"
                :key="sql.logId"
                class="sql-row"
                :class="{ 'is-selected': selectedLogId === sql.logId }"
                type="button"
                @click="onSelectSql(sql)"
              >
                <span class="sql-row-title">{{ sql.sqlTitle }}</span>
                <UiTooltip
                  v-if="sql.datamartNm"
                  side="bottom"
                  align="end"
                  :content="sql.datamartNm"
                  content-class="widget-add-datamart-tooltip"
                >
                  <span
                    class="sql-row-datamart-icon"
                    @click.stop
                  >
                    <i class="icon-database size-16" />
                  </span>
                </UiTooltip>
              </button>
            </div>
          </template>
          <UiEmpty
            v-else
            title="저장된 Text To SQL이 없습니다."
          />
        </div>
      </div>

      <!-- 우측: 위젯 설정 폼 -->
      <div class="widget-add-right">
        <div class="widget-add-panel-header widget-add-panel-header--config">
          <span class="widget-add-panel-title">위젯 설정</span>
          <span
            v-if="selectedSql?.datamartNm"
            class="widget-add-datamart-badge"
            :title="selectedSql.datamartNm"
          >
            <i class="icon-database size-14" />
            <span class="widget-add-datamart-badge-text">{{ selectedSql.datamartNm }}</span>
          </span>
        </div>
        <div class="widget-add-right-body">
          <template v-if="selectedSql">
            <section class="config-section config-section--sql">
              <div class="widget-filter-sql-preview">
                <div class="widget-filter-sql-header">
                  <span class="filter-label">SQL</span>
                  <button
                    type="button"
                    class="btn btn-widget-action widget-filter-sql-copy"
                    title="SQL 복사"
                    :disabled="!formattedSql"
                    @click="onCopySql"
                  >
                    <i class="icon-copy size-16" />
                  </button>
                </div>
                <pre class="widget-filter-sql-code">{{ formattedSql }}</pre>
              </div>
            </section>

            <section class="config-section">
              <div class="config-field">
                <label class="config-label">위젯 제목</label>
                <UiInput
                  v-model="form.title"
                  placeholder="위젯 제목을 입력하세요"
                />
              </div>
            </section>

            <section class="config-section">
              <div class="config-field">
                <div class="config-label-row">
                  <label class="config-label">시각화 유형</label>
                  <span
                    v-if="isLlmAutoFilled"
                    class="config-ai-badge"
                  >
                    <i class="icon-ai-stars size-12" />
                    AI 추천
                  </span>
                </div>
                <div class="viz-type-group">
                  <button
                    v-for="opt in vizTypeOptions"
                    :key="opt.value"
                    class="viz-type-btn"
                    :class="{ 'is-selected': form.vizType === opt.value }"
                    type="button"
                    @click="onSelectVizType(opt.value)"
                  >
                    <i
                      :class="opt.icon"
                      class="size-18"
                    />
                    <span>{{ opt.label }}</span>
                  </button>
                </div>
              </div>
            </section>

            <section
              v-if="isAxisChartViz"
              class="config-section config-section--column-mapping"
            >
              <div class="config-field config-field--column-mapping">
                <div class="config-label-row">
                  <label class="config-label">컬럼 매핑</label>
                  <span class="config-ai-badge config-ai-badge--setting">
                    <i class="icon-ai-stars size-12" />
                    AI 설정
                  </span>
                </div>
                <p class="config-hint config-hint--locked">AI가 설정한 컬럼 매핑이며 수정할 수 없습니다.</p>
              </div>
              <div class="config-field-row config-field-row--locked">
                <div class="config-field is-half">
                  <label class="config-label-sm">X축 컬럼</label>
                  <UiInput
                    v-model="form.vizConfig.xAxisKey"
                    placeholder="예: 월"
                    size="sm"
                    disabled
                  />
                </div>
                <div class="config-field is-half">
                  <label class="config-label-sm">Y축 컬럼 (쉼표 구분)</label>
                  <UiInput
                    v-model="yAxisKeysInput"
                    placeholder="예: 쿼리수, 성공수"
                    size="sm"
                    disabled
                  />
                </div>
              </div>
            </section>

            <section class="config-section">
              <div class="config-field">
                <div class="config-label-row">
                  <label class="config-label">SQL 파라미터</label>
                  <span class="config-ai-badge config-ai-badge--setting">
                    <i class="icon-ai-stars size-12" />
                    AI 설정
                  </span>
                </div>
                <p class="config-hint">
                  SQL 재활용 시 값을 변경할 수 있는 변수 컬럼입니다. 대시보드 화면에서 값을 수정해 조회할 수 있습니다.
                </p>
                <div class="param-tags param-tags--readonly">
                  <span
                    v-for="param in parsedParams"
                    :key="param.key"
                    class="param-tag"
                  >
                    {{ param.key.toUpperCase() }}
                  </span>
                  <span
                    v-if="!parsedParams.length"
                    class="param-empty"
                  >
                    파라미터 없음
                  </span>
                </div>
              </div>
            </section>

            <section class="config-section">
              <div class="config-field">
                <label class="config-label">위젯 너비</label>
                <div class="col-span-group">
                  <button
                    class="col-span-btn"
                    :class="{ 'is-selected': form.colSpan === 1 }"
                    type="button"
                    @click="form.colSpan = 1"
                  >
                    <span class="col-span-preview is-half" />
                    <span>1칸 (절반)</span>
                  </button>
                  <button
                    class="col-span-btn"
                    :class="{ 'is-selected': form.colSpan === 2 }"
                    type="button"
                    @click="form.colSpan = 2"
                  >
                    <span class="col-span-preview is-full" />
                    <span>2칸 (전체)</span>
                  </button>
                </div>
              </div>
            </section>
          </template>

          <!-- SQL 미선택 안내 -->
          <div
            v-else
            class="sql-select-guide"
          >
            <div class="sql-select-guide-icon">
              <i class="icon-sql size-24" />
            </div>
            <p class="sql-select-guide-title">Text To SQL을 선택하세요</p>
            <p class="sql-select-guide-desc">Text To SQL을 선택하면 위젯 설정이 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="widget-add-footer">
        <UiButton
          variant="line-secondary"
          @click="$emit('close')"
        >
          취소
        </UiButton>
        <UiButton
          :disabled="!canSave"
          @click="onSave"
        >
          위젯 추가
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { parseTtsqParam } from '~/utils/dataDashboard/ttsqParamParser'
import { copyToClipboard } from '~/utils/global/clipboardUtil'
import { formatSql } from '~/utils/global/codeUtil'
import type {
  DataDashboardSqlItem,
  DataDashboardSqlVariable,
  DataDashboardVizType,
  DataDashboardVizConfig,
} from '~/types/data-dashboard'
import type { VisualizationChartOptionPayload } from '~/types/chat'
import { useDataDashboardStore } from '~/composables/data-dashboard/useDataDashboardStore'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [
    widget: {
      logId: string
      sqlTitle: string
      title: string
      vizType: DataDashboardVizType
      vizConfig: DataDashboardVizConfig
      colSpan: 1 | 2
      variables: DataDashboardSqlItem['variables']
      ttsqParam?: string | null
    },
  ]
}>()

const { sqlList, sqlListLoading } = useDataDashboardStore()

const formattedSql = computed(() => formatSql(selectedSql.value?.sqlContent ?? ''))

const onCopySql = async () => {
  if (!formattedSql.value) return
  try {
    await copyToClipboard(formattedSql.value)
    openToast({ message: 'SQL이 복사되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
  }
}

const searchKeyword = ref('')
const selectedLogId = ref<string | null>(null)
const selectedSql = ref<DataDashboardSqlItem | null>(null)

const yAxisKeysInput = ref('')

/** LLM chartOption 자동 세팅 여부 (시각화 유형 뱃지) */
const isLlmAutoFilled = ref(false)

/** LLM이 추출한 SQL 파라미터 컬럼 목록 (읽기 전용) */
const parsedParams = ref<DataDashboardSqlVariable[]>([])

const form = reactive<{
  title: string
  vizType: DataDashboardVizType
  vizConfig: { xAxisKey: string }
  colSpan: 1 | 2
}>({
  title: '',
  vizType: 'bar',
  vizConfig: { xAxisKey: '' },
  colSpan: 1,
})

/** 컬럼 매핑 필수 시각화 (막대·라인·가로막대) */
const AXIS_CHART_VIZ_TYPES: DataDashboardVizType[] = ['bar', 'line', 'horizontalBar']

const isAxisChartViz = computed(() => AXIS_CHART_VIZ_TYPES.includes(form.vizType))

/** ttsqParam 파싱 + LLM 추천 뱃지 상태 반영 */
const applyTtsqParam = (ttsqParam: string | null | undefined) => {
  parsedParams.value = parseTtsqParam(ttsqParam)
}

const isColumnMappingValid = computed(() => {
  if (!isAxisChartViz.value) return true
  const x = form.vizConfig.xAxisKey.trim()
  const yKeys = yAxisKeysInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return !!x && yKeys.length > 0
})

const canSave = computed(() => !!selectedSql.value && isColumnMappingValid.value)

/** chartOption JSON 문자열을 파싱해 객체로 반환 */
const parseChartOption = (raw: string | null | undefined): VisualizationChartOptionPayload | null => {
  if (!raw) return null
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return null
    const chart = ['bar', 'line', 'pie'].includes(parsed.chart) ? parsed.chart : undefined
    const x = Array.isArray(parsed.x) ? parsed.x.filter((v: unknown): v is string => typeof v === 'string') : []
    const y = Array.isArray(parsed.y) ? parsed.y.filter((v: unknown): v is string => typeof v === 'string') : []
    return {
      ...(chart ? { chart } : {}),
      ...(x.length > 0 ? { x } : {}),
      ...(y.length > 0 ? { y } : {}),
    }
  } catch {
    return null
  }
}

/** chartOption으로 form을 자동 세팅 */
const applyChartOption = (chartOption: VisualizationChartOptionPayload | null) => {
  if (!chartOption) {
    isLlmAutoFilled.value = false
    return
  }

  const { chart, x = [], y = [] } = chartOption
  if (!chart && x.length === 0 && y.length === 0) {
    isLlmAutoFilled.value = false
    return
  }

  if (chart) form.vizType = chart as DataDashboardVizType

  form.vizConfig.xAxisKey = x[0] ?? ''
  yAxisKeysInput.value = y.join(', ')

  isLlmAutoFilled.value = true
}

const filteredSqlList = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return sqlList.value
  return sqlList.value.filter(
    (s) => s.sqlTitle.toLowerCase().includes(kw) || (s.agentNm ?? '').toLowerCase().includes(kw),
  )
})

const vizTypeOptions: { label: string; value: DataDashboardVizType; icon: string }[] = [
  { label: '막대 차트', value: 'bar', icon: 'icon-bar-chart' },
  { label: '라인 차트', value: 'line', icon: 'icon-line-chart' },
  { label: '파이 차트', value: 'pie', icon: 'icon-pie-chart' },
  { label: '가로 막대', value: 'horizontalBar', icon: 'icon-bar-chart' },
  { label: '테이블', value: 'table', icon: 'icon-sql' },
]

const onSelectVizType = (vizType: DataDashboardVizType) => {
  form.vizType = vizType
}

/** 저장용 vizConfig — 파이·축 차트 공통 xAxisKey/yAxisKeys, 테이블은 빈 객체 */
const buildSaveVizConfig = (): DataDashboardVizConfig => {
  if (form.vizType === 'table') return {}

  const xAxisKey = form.vizConfig.xAxisKey.trim()
  const yAxisKeys = yAxisKeysInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const cfg: DataDashboardVizConfig = {}
  if (xAxisKey) cfg.xAxisKey = xAxisKey
  if (yAxisKeys.length) cfg.yAxisKeys = yAxisKeys
  return cfg
}

const onSelectSql = (sql: DataDashboardSqlItem) => {
  selectedLogId.value = sql.logId
  selectedSql.value = sql
  form.title = sql.sqlTitle
  form.vizType = 'bar'
  // 객체 참조 유지하여 reactivity 보장
  form.vizConfig.xAxisKey = ''
  yAxisKeysInput.value = ''

  // LLM 추천 chartOption 자동 세팅
  applyChartOption(parseChartOption(sql.chartOption))

  // LLM이 추출한 SQL 파라미터 자동 세팅
  applyTtsqParam(sql.ttsqParam)
}

const onSave = () => {
  if (!canSave.value || !selectedSql.value) return

  emit('save', {
    logId: selectedSql.value.logId,
    sqlTitle: selectedSql.value.sqlTitle,
    title: form.title || selectedSql.value.sqlTitle,
    vizType: form.vizType,
    vizConfig: buildSaveVizConfig(),
    colSpan: form.colSpan,
    variables: parsedParams.value.length ? parsedParams.value : selectedSql.value.variables,
    ttsqParam: selectedSql.value.ttsqParam,
  })
}

// 모달 닫힐 때 폼 초기화
watch(
  () => props.isOpen,
  (open) => {
    if (open) return
    searchKeyword.value = ''
    selectedLogId.value = null
    selectedSql.value = null
    yAxisKeysInput.value = ''
    isLlmAutoFilled.value = false
    parsedParams.value = []
    form.title = ''
    form.vizType = 'bar'
    form.colSpan = 1
    form.vizConfig.xAxisKey = ''
  },
)
</script>

<style lang="scss" scoped>
// ===== SQL 목록 =====
.sql-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sql-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 6px;
  background: var(--color-bg-white, #fff);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;

  &:hover {
    background: var(--color-bg-hover, #f5f6fa);
    border-color: var(--color-border-hover, #c9cdd4);
  }

  &.is-selected {
    background: var(--color-primary-light, #eff3ff);
    border-color: var(--color-primary, #5b73e8);
  }
}

.sql-row-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--color-text-primary, #222);
}

.sql-row-datamart-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #8b95a5);
  cursor: default;

  &:hover {
    color: var(--color-primary);
  }
}

// ===== 라벨 + AI 뱃지 =====
.config-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

  .config-label {
    margin-bottom: 0;
  }
}

.config-ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  background-color: var(--color-primary-light, #eff3ff);
  color: var(--color-primary, #5b73e8);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;

  &--setting {
    font-weight: 600;
  }
}

.config-hint--locked {
  margin-top: 0;
  color: var(--color-text-secondary, #5c6677);
}

.config-field-row--locked {
  :deep(.ui-input-wrap.is-disabled) {
    background: #f0f4f8;
    border-color: #dce4e9;
    cursor: not-allowed;
  }
}

// ===== SQL 파라미터 =====
.param-tags {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--color-border, #dce4e9);
  border-radius: 8px;
  background: var(--color-bg-subtle, #f8fafc);
  min-height: 46px;
}

.param-tags--readonly .param-tag {
  padding: 4px 10px;
}

.param-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 5px 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-primary-border, #c7d6f7);
  background: var(--color-primary-light, #eff3ff);
  color: var(--color-primary, #3c69db);
  font-size: 11px;
  font-weight: 600;
  font-family: $font-family-mono;
  letter-spacing: 0.04em;
}

.param-empty {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  align-self: center;
}
</style>

<template>
  <UiModal
    :is-open="isOpen"
    title="위젯 추가"
    :max-width="'min(960px, calc(100vw - 32px))'"
    show-fullscreen
    @close="$emit('close')"
  >
    <div class="widget-add-layout">
      <!-- 좌측: SQL 목록 -->
      <div class="widget-add-left">
        <div class="widget-add-panel-header">
          <span class="widget-add-panel-title">SQL 목록</span>
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
                <span
                  v-if="sql.datamartNm"
                  class="sql-row-badge"
                >
                  {{ sql.datamartNm }}
                </span>
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
        <div class="widget-add-panel-header">
          <span class="widget-add-panel-title">위젯 설정</span>
        </div>
        <div class="widget-add-right-body">
          <template v-if="selectedSql">
            <!-- SQL 미리보기 -->
            <div class="config-sql-preview">
              <label class="config-label">SQL</label>
              <pre class="config-sql-code">{{ formattedSql }}</pre>
            </div>

            <!-- 위젯 제목 -->
            <div class="config-field">
              <label class="config-label">위젯 제목</label>
              <UiInput
                v-model="form.title"
                placeholder="위젯 제목을 입력하세요"
              />
            </div>

            <!-- 시각화 유형 -->
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
                  @click="form.vizType = opt.value"
                >
                  <i
                    :class="opt.icon"
                    class="size-18"
                  />
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- 컬럼 매핑 (테이블 제외) -->
            <template v-if="form.vizType !== 'table'">
              <div class="config-field">
                <label class="config-label">컬럼 매핑</label>
                <p class="config-hint">조회 결과의 컬럼명을 입력하세요. (비워두면 자동 매핑)</p>
              </div>

              <template v-if="form.vizType === 'pie'">
                <div class="config-field-row">
                  <div class="config-field is-half">
                    <label class="config-label-sm">라벨 컬럼</label>
                    <UiInput
                      v-model="form.vizConfig.labelKey"
                      placeholder="예: 카테고리"
                      size="sm"
                    />
                  </div>
                  <div class="config-field is-half">
                    <label class="config-label-sm">값 컬럼</label>
                    <UiInput
                      v-model="form.vizConfig.valueKey"
                      placeholder="예: 건수"
                      size="sm"
                    />
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="config-field-row">
                  <div class="config-field is-half">
                    <label class="config-label-sm">X축 컬럼</label>
                    <UiInput
                      v-model="form.vizConfig.xAxisKey"
                      placeholder="예: 월"
                      size="sm"
                    />
                  </div>
                  <div class="config-field is-half">
                    <label class="config-label-sm">Y축 컬럼 (쉼표 구분)</label>
                    <UiInput
                      v-model="yAxisKeysInput"
                      placeholder="예: 쿼리수, 성공수"
                      size="sm"
                    />
                  </div>
                </div>
              </template>
            </template>

            <!-- SQL 파라미터 -->
            <div class="config-field">
              <label class="config-label">SQL 파라미터</label>
              <p class="config-hint">
                SQL 재활용 시 값을 변경할 수 있는 변수 컬럼입니다. 대시보드 화면에서 값을 수정해 조회할 수 있습니다.
              </p>
              <div class="param-tag-area">
                <div class="param-tags">
                  <span
                    v-for="param in parsedParams"
                    :key="param.key"
                    class="param-tag"
                  >
                    {{ param.key.toUpperCase() }}
                    <button
                      type="button"
                      class="param-tag-del"
                      @click="onRemoveParam(param.key)"
                    >
                      <i class="icon-close size-10" />
                    </button>
                  </span>
                  <span
                    v-if="!parsedParams.length"
                    class="param-empty"
                  >
                    파라미터 없음
                  </span>
                </div>
                <div class="param-add-row">
                  <UiInput
                    v-model="newParamInput"
                    placeholder="파라미터 추가 (예: YEAR)"
                    size="sm"
                    class="param-add-input"
                    @keydown.enter.prevent="onAddParam"
                  />
                  <UiButton
                    variant="line-secondary"
                    size="sm"
                    @click="onAddParam"
                  >
                    추가
                  </UiButton>
                </div>
              </div>
            </div>

            <!-- 너비 설정 -->
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
          :disabled="!selectedSql"
          @click="onSave"
        >
          위젯 추가
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
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

const formattedSql = computed(() => formatSql(selectedSql.value?.sqlContent))

const searchKeyword = ref('')
const selectedLogId = ref<string | null>(null)
const selectedSql = ref<DataDashboardSqlItem | null>(null)

const yAxisKeysInput = ref('')

/** LLM이 자동 세팅한 항목 여부 (뱃지 표시용) */
const isLlmAutoFilled = ref(false)

/** LLM이 추출한 SQL 파라미터 컬럼 목록 */
const parsedParams = ref<DataDashboardSqlVariable[]>([])

/** 파라미터 추가 입력값 */
const newParamInput = ref('')

/** ttsqParam JSON 문자열을 파싱해 DataDashboardSqlVariable 배열로 변환 */
const parseTtsqParam = (raw: string | null | undefined): DataDashboardSqlVariable[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((v: unknown): v is string => typeof v === 'string')
      .map((key) => ({ key, label: key.toUpperCase(), type: 'text' as const }))
  } catch {
    return []
  }
}

/** 파라미터 제거 */
const onRemoveParam = (key: string) => {
  parsedParams.value = parsedParams.value.filter((p) => p.key !== key)
}

/** 파라미터 추가 */
const onAddParam = () => {
  const key = newParamInput.value.trim().toLowerCase()
  if (!key) return
  if (parsedParams.value.some((p) => p.key === key)) return
  parsedParams.value.push({ key, label: key.toUpperCase(), type: 'text' as const })
  newParamInput.value = ''
}

const form = reactive<{
  title: string
  vizType: DataDashboardVizType
  vizConfig: { xAxisKey: string; yAxisKeys: string[]; labelKey: string; valueKey: string }
  colSpan: 1 | 2
}>({
  title: '',
  vizType: 'bar',
  vizConfig: { xAxisKey: '', yAxisKeys: [], labelKey: '', valueKey: '' },
  colSpan: 1,
})

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

  if (form.vizType === 'pie') {
    form.vizConfig.labelKey = x[0] ?? ''
    form.vizConfig.valueKey = y[0] ?? ''
  } else {
    form.vizConfig.xAxisKey = x[0] ?? ''
    yAxisKeysInput.value = y.join(', ')
  }

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

const onSelectSql = (sql: DataDashboardSqlItem) => {
  selectedLogId.value = sql.logId
  selectedSql.value = sql
  form.title = sql.sqlTitle
  form.vizType = 'bar'
  // 객체 참조 유지하여 reactivity 보장
  Object.assign(form.vizConfig, { xAxisKey: '', yAxisKeys: [], labelKey: '', valueKey: '' })
  yAxisKeysInput.value = ''

  // LLM 추천 chartOption 자동 세팅
  applyChartOption(parseChartOption(sql.chartOption))

  // LLM이 추출한 SQL 파라미터 자동 세팅
  parsedParams.value = parseTtsqParam(sql.ttsqParam)
}

const onSave = () => {
  if (!selectedSql.value) return

  const yAxisKeys = yAxisKeysInput.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  emit('save', {
    logId: selectedSql.value.logId,
    sqlTitle: selectedSql.value.sqlTitle,
    title: form.title || selectedSql.value.sqlTitle,
    vizType: form.vizType,
    vizConfig: {
      xAxisKey: form.vizConfig.xAxisKey || undefined,
      yAxisKeys: yAxisKeys.length ? yAxisKeys : undefined,
      labelKey: form.vizConfig.labelKey || undefined,
      valueKey: form.vizConfig.valueKey || undefined,
    },
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
    newParamInput.value = ''
    form.title = ''
    form.vizType = 'bar'
    form.colSpan = 1
    Object.assign(form.vizConfig, { xAxisKey: '', yAxisKeys: [], labelKey: '', valueKey: '' })
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

.sql-row-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--color-bg-subtle, #eef0f5);
  color: var(--color-text-secondary, #666);
  font-size: 11px;
  white-space: nowrap;
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
}

// ===== SQL 파라미터 =====
.param-tag-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.param-tags {
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

.param-tag-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-primary, #3c69db);
  opacity: 0.55;
  transition:
    opacity 0.15s,
    background 0.15s;

  &:hover {
    opacity: 1;
    background: rgba(60, 105, 219, 0.12);
  }
}

.param-empty {
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  align-self: center;
}

.param-add-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.param-add-input {
  flex: 1;
}
</style>

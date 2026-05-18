<template>
  <UiModal
    :is-open="isOpen"
    title="위젯 추가"
    max-width="760px"
    @close="$emit('close')"
  >
    <div class="widget-add-body">
      <!-- 좌측: SQL 목록 -->
      <div class="widget-add-sql-panel">
        <div class="sql-panel-search">
          <UiInput
            v-model="searchKeyword"
            type="search"
            placeholder="SQL 검색"
            size="sm"
          />
        </div>
        <div class="sql-panel-list">
          <UiLoading
            v-if="sqlListLoading"
            text="불러오는 중..."
          />
          <template v-else-if="filteredSqlList.length">
            <button
              v-for="sql in filteredSqlList"
              :key="sql.sqlId"
              class="sql-list-item"
              :class="{ 'is-selected': selectedLogId === sql.logId }"
              type="button"
              @click="onSelectSql(sql)"
            >
              <span class="sql-item-title">{{ sql.sqlTitle }}</span>
              <div class="sql-item-meta">
                <span
                  v-if="sql.agentNm"
                  class="sql-item-badge"
                  >{{ sql.agentNm }}</span
                >
                <span
                  v-if="sql.datamartNm"
                  class="sql-item-badge type-secondary"
                  >{{ sql.datamartNm }}</span
                >
              </div>
            </button>
          </template>
          <UiEmpty
            v-else
            title="저장된 SQL이 없습니다."
          />
        </div>
      </div>

      <!-- 우측: 위젯 설정 -->
      <div class="widget-add-config-panel">
        <template v-if="selectedSql">
          <!-- SQL 미리보기 -->
          <div class="config-sql-preview">
            <span class="config-sql-preview-label">SQL</span>
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
            <label class="config-label">시각화 유형</label>
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

        <UiEmpty
          v-else
          icon="icon-arrow-left-sm"
          title="좌측에서 SQL을 선택하세요."
        />
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
import type { DataDashboardSqlItem, DataDashboardVizType, DataDashboardVizConfig } from '~/types/data-dashboard'
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
  form.vizConfig = { xAxisKey: '', yAxisKeys: [], labelKey: '', valueKey: '' }
  yAxisKeysInput.value = ''
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
    variables: selectedSql.value.variables,
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
    Object.assign(form, {
      title: '',
      vizType: 'bar',
      vizConfig: { xAxisKey: '', yAxisKeys: [], labelKey: '', valueKey: '' },
      colSpan: 1,
    })
  },
)
</script>

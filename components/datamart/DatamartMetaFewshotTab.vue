<template>
  <div class="datamart-meta-fewshot com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-fewshot-error">
        <p class="datamart-meta-fewshot-error-msg">{{ props.errorMessage }}</p>
      </div>
    </template>

    <template v-else>
      <div class="datamart-meta-fewshot-header">
        <p class="datamart-meta-fewshot-desc">
          AI가 사용자 질문을 이해하도록 예시를 등록 관리합니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-fewshot-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <div class="datamart-meta-fewshot-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="질문 검색"
          class="datamart-meta-fewshot-search"
        />
        <UiButton
          variant="primary"
          size="sm"
          class="datamart-meta-fewshot-add shrink-0"
          @click="onAdd"
        >
          <template #icon-left>
            <i class="icon icon-plus size-16" />
          </template>
          새 질문 예시 등록
        </UiButton>
      </div>

      <div class="datamart-meta-fewshot-body">
        <div class="datamart-meta-fewshot-split">
          <!-- 좌측: 목록 -->
          <div class="com-setting-section datamart-meta-fewshot-list-section">
            <div class="com-setting-section-header datamart-meta-section-header-static">
              <span class="com-setting-section-title">
                등록된 질문 목록
                <span class="datamart-meta-fewshot-count">({{ fewshotList.length }})</span>
              </span>
            </div>
            <div class="com-setting-section-body datamart-meta-fewshot-list-body">
              <UiEmpty
                v-if="listEmptyState !== 'none'"
                :description="listEmptyDescription"
                class="fewshot-list-empty"
              />

              <div
                v-else
                class="fewshot-list-body"
              >
                <ul
                  class="fewshot-card-list"
                  :style="{ '--fewshot-card-slot-count': PAGE_SIZE }"
                >
                  <li
                    v-for="row in paginatedList"
                    :key="getFewshotUiKey(row)"
                  >
                    <div
                      class="fewshot-card"
                      :class="{ 'is-selected': selectedFewshotKey === getFewshotUiKey(row) }"
                    >
                      <button
                        type="button"
                        class="fewshot-card-select"
                        @click="selectFewshot(getFewshotUiKey(row))"
                      >
                        <div class="fewshot-card-main">
                          <p
                            class="fewshot-card-question"
                            :class="{ 'is-placeholder': isDraftFewshotId(row.fewshotId ?? '') }"
                          >
                            {{ getFewshotCardLabel(row) }}
                          </p>
                        </div>
                      </button>
                    </div>
                  </li>
                </ul>

                <div class="fewshot-list-pagination-wrap">
                  <div
                    v-if="totalPages > 1"
                    class="fewshot-list-pagination flex items-center justify-center gap-4"
                  >
                    <button
                      type="button"
                      class="fewshot-page-btn"
                      :disabled="currentPage <= 1"
                      aria-label="이전 페이지"
                      @click="onPageChange(currentPage - 1)"
                    >
                      <i class="icon icon-arrow-right size-16 is-flip-x" />
                    </button>
                    <button
                      v-for="page in totalPages"
                      :key="page"
                      type="button"
                      class="fewshot-page-num"
                      :class="{ 'is-active': page === currentPage }"
                      @click="onPageChange(page)"
                    >
                      {{ page }}
                    </button>
                    <button
                      type="button"
                      class="fewshot-page-btn"
                      :disabled="currentPage >= totalPages"
                      aria-label="다음 페이지"
                      @click="onPageChange(currentPage + 1)"
                    >
                      <i class="icon icon-arrow-right size-16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 우측: 상세 -->
          <div class="com-setting-section datamart-meta-fewshot-detail-section">
            <div class="com-setting-section-header datamart-meta-section-header-static">
              <span class="com-setting-section-title">{{ detailTitle }}</span>
            </div>
            <div class="com-setting-section-body datamart-meta-fewshot-detail-body">
              <UiEmpty
                v-if="!selectedFewshot"
                description="질문 예시를 선택하거나 새로 등록해 주세요."
                class="fewshot-detail-empty"
              />

              <template v-else>
                <div class="fewshot-detail-scroll">
                  <div class="fewshot-detail-pane">
                    <form
                      id="fewshot-edit-form"
                      class="fewshot-form"
                      @submit.prevent
                    >
                      <div class="fewshot-form-field">
                        <label
                          class="fewshot-form-label"
                          for="fewshot-question"
                        >
                          사용자 질문
                        </label>
                        <div class="fewshot-form-control">
                          <UiInput
                            id="fewshot-question"
                            :model-value="selectedFewshot?.userQuestion ?? ''"
                            size="md"
                            :max-length="FEWSHOT_TEXT_MAX"
                            placeholder="사용자 질문을 입력하세요"
                            @update:model-value="onUpdateFewshotField('userQuestion', $event)"
                          />
                        </div>
                      </div>

                      <div class="fewshot-form-field">
                        <label
                          class="fewshot-form-label"
                          for="fewshot-meaning"
                        >
                          AI가 이해해야 할 의미
                        </label>
                        <div class="fewshot-form-control">
                          <UiInput
                            id="fewshot-meaning"
                            :model-value="selectedFewshot?.aiUnderstand ?? ''"
                            size="md"
                            :max-length="FEWSHOT_TEXT_MAX"
                            placeholder="AI가 이해해야 할 의미를 입력하세요"
                            @update:model-value="onUpdateFewshotField('aiUnderstand', $event)"
                          />
                          <p class="fewshot-form-hint">AI가 이 질문을 받았을 때, 위 의미로 이해하도록 합니다.</p>
                        </div>
                      </div>

                      <div class="fewshot-form-field">
                        <label
                          class="fewshot-form-label"
                          for="fewshot-lookup"
                        >
                          참조 조회 방법
                        </label>
                        <div class="fewshot-form-control">
                          <UiTextarea
                            id="fewshot-lookup"
                            :model-value="selectedFewshot?.aiRefExam ?? ''"
                            size="md"
                            :rows="3"
                            :max-length="FEWSHOT_TEXT_MAX"
                            :auto-resize="true"
                            :max-rows="6"
                            border
                            placeholder="참조 조회 방법을 입력하세요"
                            @update:model-value="onUpdateFewshotField('aiRefExam', $event)"
                          />
                        </div>
                      </div>

                      <div class="fewshot-form-field">
                        <div class="fewshot-sql-label-row">
                          <span class="fewshot-form-label">
                            예시 SQL <span class="fewshot-form-optional">(선택)</span>
                          </span>
                          <UiButton
                            type="button"
                            variant="line-secondary"
                            size="xxs"
                            class="fewshot-sql-toggle-btn shrink-0"
                            @click="onToggleSqlManualInput"
                          >
                            {{ isSqlManualInput ? '간편 입력' : '직접 입력' }}
                          </UiButton>
                        </div>
                        <div class="fewshot-form-control">
                          <UiTextarea
                            v-if="isSqlManualInput"
                            id="fewshot-sql"
                            :model-value="selectedFewshot?.sqlExam ?? ''"
                            class="fewshot-sql-textarea"
                            size="md"
                            :rows="6"
                            :auto-resize="false"
                            border
                            :spellcheck="false"
                            placeholder="예시 SQL을 입력하세요"
                            @update:model-value="onUpdateFewshotField('sqlExam', $event)"
                          />
                          <template v-else>
                            <p
                              v-if="activeMetaTables.length === 0"
                              class="fewshot-form-hint"
                            >
                              테이블 선택 탭에서 사용할 테이블을 켜면 드롭다운에서 선택할 수 있습니다.
                            </p>
                            <div class="fewshot-sql-builder">
                              <div class="fewshot-sql-builder-row">
                                <span class="fewshot-sql-builder-keyword">SELECT</span>
                                <UiMultiSelect
                                  v-model="sqlBuilder.selectColumns"
                                  :options="selectColumnOptions"
                                  size="sm"
                                  class="fewshot-sql-builder-control"
                                  placeholder="컬럼 선택"
                                  show-select-all
                                  :disabled="!sqlBuilder.fromTable"
                                />
                              </div>
                              <div class="fewshot-sql-builder-row">
                                <span class="fewshot-sql-builder-keyword">FROM</span>
                                <UiSelect
                                  v-model="sqlBuilder.fromTable"
                                  :options="fromTableOptions"
                                  size="sm"
                                  class="fewshot-sql-builder-control"
                                  :disabled="fromTableOptions.length <= 1"
                                  @update:model-value="onSqlFromTableChange"
                                />
                              </div>
                              <div class="fewshot-sql-builder-row">
                                <span class="fewshot-sql-builder-keyword">WHERE</span>
                                <UiInput
                                  v-model="sqlBuilder.whereClause"
                                  size="sm"
                                  class="fewshot-sql-builder-control fewshot-sql-builder-where-input"
                                  placeholder="조건 입력 (없으면 비워두세요)"
                                  :disabled="!sqlBuilder.fromTable"
                                  :spellcheck="false"
                                />
                              </div>
                            </div>
                            <p
                              v-if="activeMetaTables.length > 0"
                              class="fewshot-form-hint fewshot-sql-builder-hint"
                            >
                              간단한 단일 테이블 조회는 간편 입력 방식으로 작성할 수 있습니다.<br />
                              JOIN, GROUP BY, 서브쿼리 등 복잡한 SQL은 직접 입력을 사용해주세요.
                            </p>
                          </template>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                <div class="fewshot-form-footer flex items-center gap-8">
                  <UiButton
                    type="button"
                    variant="line-secondary"
                    size="md"
                    class="btn-fewshot-delete"
                    @click="onDelete"
                  >
                    <template #icon-left>
                      <i class="icon icon-trashcan size-16" />
                    </template>
                    삭제
                  </UiButton>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '~/components/ui/UiSelect.vue'
import type { Datamart } from '~/types/datamart'
import type { DatamartMetaFewshot, DatamartMetaTableItem } from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
  errorMessage?: string | null
}>()

const fewshotList = defineModel<DatamartMetaFewshot[]>('fewshotList', { default: () => [] })

type FewshotEditableField = 'userQuestion' | 'aiUnderstand' | 'aiRefExam' | 'sqlExam'

type FewshotRequiredField = Exclude<FewshotEditableField, 'sqlExam'>

type SqlBuilderState = {
  fromTable: string
  selectColumns: string[]
  whereClause: string
}

const FEWSHOT_TEXT_MAX = 100
const PAGE_SIZE = 6
const DRAFT_FEWSHOT_ID_PREFIX = '__draft_'
const FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE = ''

const searchKeyword = ref('')
const currentPage = ref(1)
const selectedFewshotKey = ref<string | null>(null)
const sqlBuilder = ref<SqlBuilderState>(createEmptySqlBuilder())
const isSqlManualInput = ref(false)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

const createDraftFewshotId = () => `${DRAFT_FEWSHOT_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const isDraftFewshotId = (fewshotId: string) => {
  const id = fewshotId?.trim() ?? ''
  return !id || id.startsWith(DRAFT_FEWSHOT_ID_PREFIX)
}

const getFewshotUiKey = (row: DatamartMetaFewshot) => row.fewshotId?.trim() ?? ''

const getFewshotCardLabel = (row: DatamartMetaFewshot) => {
  if (isDraftFewshotId(row.fewshotId ?? '')) return '새 퓨샷'
  return row.userQuestion?.trim() ?? ''
}

const findFewshotRowByUiKey = (uiKey: string) => fewshotList.value.find((row) => getFewshotUiKey(row) === uiKey)

const patchFewshot = (uiKey: string, patch: Partial<Pick<DatamartMetaFewshot, FewshotEditableField>>) => {
  fewshotList.value = fewshotList.value.map((row) => {
    if (getFewshotUiKey(row) !== uiKey) return row
    return { ...row, ...patch, datamartId: datamartId.value || row.datamartId, useYn: 'Y' as const }
  })
}

const normalizeFewshotForSave = (row: DatamartMetaFewshot): DatamartMetaFewshot => {
  const fewshotId = row.fewshotId?.trim() ?? ''
  return {
    ...row,
    fewshotId: isDraftFewshotId(fewshotId) ? '' : fewshotId,
    userQuestion: row.userQuestion?.trim() ?? '',
    aiUnderstand: row.aiUnderstand?.trim() ?? '',
    aiRefExam: row.aiRefExam?.trim() ?? '',
    sqlExam: row.sqlExam?.trim() ?? '',
  }
}

function createEmptySqlBuilder(): SqlBuilderState {
  return { fromTable: '', selectColumns: [], whereClause: '' }
}

function getMetaTableColumnNames(table: DatamartMetaTableItem): string[] {
  return table.columns.map((column) => column.colPhyNm || column.colId)
}

function findMetaTableByPhysicalName(physicalName: string, metaTables: DatamartMetaTableItem[]) {
  return metaTables.find((table) => table.physicalNm === physicalName)
}

function buildExampleSqlFromBuilder(state: SqlBuilderState): string {
  const { fromTable, selectColumns, whereClause } = state
  if (!fromTable) return ''

  const selectPart = selectColumns.length > 0 ? selectColumns.join(', ') : '*'
  const lines = [`SELECT ${selectPart}`, `FROM ${fromTable}`]
  if (whereClause.trim()) lines.push(`WHERE ${whereClause.trim()}`)
  return lines.join('\n')
}

function parseExampleSqlToBuilder(sql: string): SqlBuilderState {
  const empty = createEmptySqlBuilder()
  const trimmed = sql.trim()
  if (!trimmed) return empty

  const fromMatch = trimmed.match(/\bFROM\s+([A-Za-z0-9_.]+)/i)
  const fromTable = fromMatch?.[1] ?? ''
  if (!fromTable) return empty

  const selectMatch = trimmed.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+/i)
  let selectColumns: string[] = []
  if (selectMatch?.[1]) {
    const selectPart = selectMatch[1].trim()
    if (selectPart !== '*') {
      selectColumns = selectPart
        .split(',')
        .map((part) =>
          part
            .trim()
            .replace(/\s+AS\s+.+$/i, '')
            .trim(),
        )
        .filter(Boolean)
    }
  }

  const whereMatch = trimmed.match(/\bWHERE\s+([\s\S]+?)(?:;)?\s*$/i)
  const whereClause = whereMatch?.[1]?.trim().replace(/;+\s*$/, '') ?? ''
  return { fromTable, selectColumns, whereClause }
}

const filteredFewshotList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const list = fewshotList.value
  if (!keyword) return list

  return list.filter((row) => {
    const cardLabel = getFewshotCardLabel(row).toLowerCase()
    return (
      cardLabel.includes(keyword) ||
      (row.userQuestion ?? '').toLowerCase().includes(keyword) ||
      (row.aiUnderstand ?? '').toLowerCase().includes(keyword) ||
      (row.aiRefExam ?? '').toLowerCase().includes(keyword) ||
      (row.sqlExam ?? '').toLowerCase().includes(keyword)
    )
  })
})

const listEmptyState = computed<'none' | 'no-data' | 'no-search'>(() => {
  if (fewshotList.value.length === 0) return 'no-data'
  if (filteredFewshotList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 질문 예시가 없습니다.',
)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredFewshotList.value.length / PAGE_SIZE)))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredFewshotList.value.slice(start, start + PAGE_SIZE)
})

const selectedFewshot = computed(() => findFewshotRowByUiKey(selectedFewshotKey.value ?? '') ?? null)

const detailTitle = computed(() => (selectedFewshot.value ? '질문 예시 수정' : '상세보기'))

const activeMetaTables = computed(() => props.tables.filter((table) => table.useYn === 'Y'))

const fromTableOptions = computed<SelectOption[]>(() => [
  { label: '테이블 선택', value: FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE },
  ...activeMetaTables.value.map((table) => ({
    label: `${table.physicalNm}${table.logicalNm ? ` · ${table.logicalNm}` : ''}`,
    value: table.physicalNm,
  })),
])

const selectColumnOptions = computed<SelectOption[]>(() => {
  const table = findMetaTableByPhysicalName(sqlBuilder.value.fromTable, activeMetaTables.value)
  if (!table) return []
  return getMetaTableColumnNames(table).map((col) => ({ label: col, value: col }))
})

watch(
  sqlBuilder,
  () => {
    if (isSqlManualInput.value) return
    const uiKey = selectedFewshotKey.value
    if (!uiKey) return
    patchFewshot(uiKey, { sqlExam: buildExampleSqlFromBuilder(sqlBuilder.value) })
  },
  { deep: true },
)

const selectFewshot = (uiKey: string | null) => {
  if (selectedFewshotKey.value === uiKey) return
  selectedFewshotKey.value = uiKey
  isSqlManualInput.value = false
  const row = findFewshotRowByUiKey(uiKey ?? '')
  sqlBuilder.value = parseExampleSqlToBuilder(row?.sqlExam ?? '')
}

const ensureSelection = () => {
  if (filteredFewshotList.value.length === 0) {
    selectFewshot(null)
    return
  }

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }

  if (filteredFewshotList.value.some((row) => getFewshotUiKey(row) === selectedFewshotKey.value)) return

  const nextRow = paginatedList.value[0] ?? filteredFewshotList.value[0] ?? null
  if (nextRow) selectFewshot(getFewshotUiKey(nextRow))
}

watch([filteredFewshotList, currentPage], () => ensureSelection(), { immediate: true })

watch(searchKeyword, () => {
  currentPage.value = 1
})

const onUpdateFewshotField = (field: FewshotEditableField, value: string) => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return
  patchFewshot(uiKey, { [field]: value })
}

const onToggleSqlManualInput = () => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return

  if (!isSqlManualInput.value) {
    patchFewshot(uiKey, { sqlExam: buildExampleSqlFromBuilder(sqlBuilder.value) })
    isSqlManualInput.value = true
    return
  }

  isSqlManualInput.value = false
  sqlBuilder.value = parseExampleSqlToBuilder(selectedFewshot.value?.sqlExam ?? '')
}

const onPageChange = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const onAdd = () => {
  const newRow: DatamartMetaFewshot = {
    datamartId: datamartId.value,
    fewshotId: createDraftFewshotId(),
    userQuestion: '',
    aiUnderstand: '',
    aiRefExam: '',
    sqlExam: '',
    useYn: 'Y',
    createDt: '',
    modifyDt: '',
  }

  fewshotList.value = [newRow, ...fewshotList.value]
  searchKeyword.value = ''
  currentPage.value = 1
  selectFewshot(getFewshotUiKey(newRow))
}

const onDelete = () => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return
  fewshotList.value = fewshotList.value.filter((row) => getFewshotUiKey(row) !== uiKey)
  ensureSelection()
}

const onSqlFromTableChange = (table: string | number) => {
  sqlBuilder.value = {
    fromTable: String(table).trim() || FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE,
    selectColumns: [],
    whereClause: '',
  }
}

const FEWSHOT_REQUIRED_VALIDATIONS: {
  field: FewshotRequiredField
  message: string
  focusId: string
}[] = [
  { field: 'userQuestion', message: '사용자 질문을 입력해주세요.', focusId: 'fewshot-question' },
  { field: 'aiUnderstand', message: 'AI가 이해해야 할 의미를 입력해주세요.', focusId: 'fewshot-meaning' },
  { field: 'aiRefExam', message: '참조 조회 방법을 입력해주세요.', focusId: 'fewshot-lookup' },
]

const focusFewshotValidationField = (uiKey: string, focusId: string) => {
  const index = filteredFewshotList.value.findIndex((row) => getFewshotUiKey(row) === uiKey)
  if (index >= 0) {
    currentPage.value = Math.floor(index / PAGE_SIZE) + 1
  }

  selectedFewshotKey.value = uiKey
  isSqlManualInput.value = false
  const row = findFewshotRowByUiKey(uiKey)
  sqlBuilder.value = parseExampleSqlToBuilder(row?.sqlExam ?? '')

  nextTick(() => {
    const el = document.getElementById(focusId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

const buildSavePayload = (): DatamartMetaFewshot[] | null => {
  if (!datamartId.value) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return null
  }

  for (const row of fewshotList.value) {
    const normalized = normalizeFewshotForSave(row)
    const failed = FEWSHOT_REQUIRED_VALIDATIONS.find((validation) => !normalized[validation.field])
    if (failed) {
      openToast({ message: failed.message, type: 'warning' })
      focusFewshotValidationField(getFewshotUiKey(row), failed.focusId)
      return null
    }
  }

  return fewshotList.value.map(normalizeFewshotForSave)
}

defineExpose({ buildSavePayload })
</script>

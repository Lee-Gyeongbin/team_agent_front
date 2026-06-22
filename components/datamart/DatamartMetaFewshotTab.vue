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
          AI가 사용자 질문의 의도와 SQL 생성 방식을 학습할 수 있도록 질문 예시를 등록·관리합니다.
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
                <ul class="fewshot-card-list">
                  <li
                    v-for="row in filteredFewshotList"
                    :id="`fewshot-card-${getFewshotUiKey(row)}`"
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

/** datamart: 현재 데이터마트, tables: 간편 SQL용 메타 테이블, errorMessage: 조회 실패 시 에러 */
const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
  errorMessage?: string | null
}>()

/** 부모 모달과 양방향 바인딩되는 퓨샷 목록 */
const fewshotList = defineModel<DatamartMetaFewshot[]>('fewshotList', { default: () => [] })

/** 상세 폼에서 편집 가능한 필드 */
type FewshotEditableField = 'userQuestion' | 'aiUnderstand' | 'aiRefExam' | 'sqlExam'

/** 저장 시 필수 검증 대상 필드 (sqlExam 제외) */
type FewshotRequiredField = Exclude<FewshotEditableField, 'sqlExam'>

/** 간편 SQL 입력 UI 상태 */
type SqlBuilderState = {
  fromTable: string
  selectColumns: string[]
  whereClause: string
}

const FEWSHOT_TEXT_MAX = 100 // 텍스트 필드 최대 글자 수
const DRAFT_FEWSHOT_ID_PREFIX = '__draft_' // 저장 전 임시 행 ID 접두사
const FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE = '' // FROM 드롭다운 placeholder value

// 검색·선택·SQL 입력 모드 UI 상태
const searchKeyword = ref('')
const selectedFewshotKey = ref<string | null>(null)
const sqlBuilder = ref<SqlBuilderState>(createEmptySqlBuilder())
const isSqlManualInput = ref(false)

/** 저장 API에 사용할 datamartId */
const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

/** 신규 행용 임시 fewshotId 생성 — 저장 전까지 서버 ID 없음 */
const createDraftFewshotId = () => `${DRAFT_FEWSHOT_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

/** 임시 ID 여부 — 빈 문자열 또는 __draft_ 접두사 */
const isDraftFewshotId = (fewshotId: string) => {
  const id = fewshotId?.trim() ?? ''
  return !id || id.startsWith(DRAFT_FEWSHOT_ID_PREFIX)
}

/** v-for key·선택 상태 식별자 */
const getFewshotUiKey = (row: DatamartMetaFewshot) => row.fewshotId?.trim() ?? ''

/** 좌측 카드에 표시할 라벨 — 임시 행은 '새 퓨샷' */
const getFewshotCardLabel = (row: DatamartMetaFewshot) => {
  if (isDraftFewshotId(row.fewshotId ?? '')) return '새 퓨샷'
  return row.userQuestion?.trim() ?? ''
}

/** UI key로 목록에서 행 조회 */
const findFewshotRowByUiKey = (uiKey: string) => fewshotList.value.find((row) => getFewshotUiKey(row) === uiKey)

/** 특정 행의 편집 필드만 불변 갱신 */
const patchFewshot = (uiKey: string, patch: Partial<Pick<DatamartMetaFewshot, FewshotEditableField>>) => {
  fewshotList.value = fewshotList.value.map((row) => {
    if (getFewshotUiKey(row) !== uiKey) return row
    return { ...row, ...patch, datamartId: datamartId.value || row.datamartId, useYn: 'Y' as const }
  })
}

/** API 저장 전송용 필드 정규화 — 임시 ID는 빈 문자열로 변환 */
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

/** 간편 SQL 빌더 초기 상태 */
function createEmptySqlBuilder(): SqlBuilderState {
  return { fromTable: '', selectColumns: [], whereClause: '' }
}

/** 메타 테이블 컬럼 드롭다운용 물리명 목록 */
function getMetaTableColumnNames(table: DatamartMetaTableItem): string[] {
  return table.columns.map((column) => column.colPhyNm || column.colId)
}

/** 물리 테이블명으로 메타 테이블 조회 */
function findMetaTableByPhysicalName(physicalName: string, metaTables: DatamartMetaTableItem[]) {
  return metaTables.find((table) => table.physicalNm === physicalName)
}

/** 간편 입력 상태 → 예시 SQL 문자열 생성 */
function buildExampleSqlFromBuilder(state: SqlBuilderState): string {
  const { fromTable, selectColumns, whereClause } = state
  if (!fromTable) return ''

  const selectPart = selectColumns.length > 0 ? selectColumns.join(', ') : '*'
  const lines = [`SELECT ${selectPart}`, `FROM ${fromTable}`]
  if (whereClause.trim()) lines.push(`WHERE ${whereClause.trim()}`)
  return lines.join('\n')
}

/**
 * 예시 SQL → 간편 입력 상태 파싱
 * - 단일 테이블 SELECT/FROM/WHERE 패턴만 지원
 * - JOIN·GROUP BY 등 복잡한 SQL은 파싱 실패 시 빈 빌더 반환
 */
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

/** 검색어로 질문·의미·참조·SQL 필드를 필터링한 목록 */
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

/** 빈 목록 UI 구분 — 데이터 없음 / 검색 결과 없음 */
const listEmptyState = computed<'none' | 'no-data' | 'no-search'>(() => {
  if (fewshotList.value.length === 0) return 'no-data'
  if (filteredFewshotList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 질문 예시가 없습니다.',
)

/** 우측 상세 폼에 바인딩할 선택된 행 */
const selectedFewshot = computed(() => findFewshotRowByUiKey(selectedFewshotKey.value ?? '') ?? null)

/** 우측 상세 섹션 제목 */
const detailTitle = computed(() => (selectedFewshot.value ? '질문 예시 수정' : '상세보기'))

/** 테이블 선택 탭에서 useYn=Y인 활성 메타 테이블 */
const activeMetaTables = computed(() => props.tables.filter((table) => table.useYn === 'Y'))

/** 간편 SQL FROM 드롭다운 옵션 */
const fromTableOptions = computed<SelectOption[]>(() => [
  { label: '테이블 선택', value: FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE },
  ...activeMetaTables.value.map((table) => ({
    label: `${table.physicalNm}${table.logicalNm ? ` · ${table.logicalNm}` : ''}`,
    value: table.physicalNm,
  })),
])

/** 선택된 FROM 테이블의 SELECT 컬럼 드롭다운 옵션 */
const selectColumnOptions = computed<SelectOption[]>(() => {
  const table = findMetaTableByPhysicalName(sqlBuilder.value.fromTable, activeMetaTables.value)
  if (!table) return []
  return getMetaTableColumnNames(table).map((col) => ({ label: col, value: col }))
})

/** 간편 입력 모드에서 빌더 변경 시 sqlExam 필드 자동 동기화 */
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

/** 퓨샷 선택 — SQL 입력 모드 초기화 및 기존 SQL 파싱 */
const selectFewshot = (uiKey: string | null) => {
  if (selectedFewshotKey.value === uiKey) return
  selectedFewshotKey.value = uiKey
  isSqlManualInput.value = false
  const row = findFewshotRowByUiKey(uiKey ?? '')
  sqlBuilder.value = parseExampleSqlToBuilder(row?.sqlExam ?? '')
}

/**
 * 목록 필터 변경 후 선택 상태 보정
 * - 필터 결과 없으면 선택 해제
 * - 현재 선택이 필터 밖이면 첫 행 자동 선택
 */
const ensureSelection = () => {
  if (filteredFewshotList.value.length === 0) {
    selectFewshot(null)
    return
  }

  if (filteredFewshotList.value.some((row) => getFewshotUiKey(row) === selectedFewshotKey.value)) return

  const nextRow = filteredFewshotList.value[0] ?? null
  if (nextRow) selectFewshot(getFewshotUiKey(nextRow))
}

watch(filteredFewshotList, () => ensureSelection(), { immediate: true })

/** 상세 폼 필드 입력 핸들러 */
const onUpdateFewshotField = (field: FewshotEditableField, value: string) => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return
  patchFewshot(uiKey, { [field]: value })
}

/** 간편 입력 ↔ 직접 입력 모드 전환 */
const onToggleSqlManualInput = () => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return

  if (!isSqlManualInput.value) {
    // 간편 → 직접: 빌더 상태를 SQL 문자열로 반영
    patchFewshot(uiKey, { sqlExam: buildExampleSqlFromBuilder(sqlBuilder.value) })
    isSqlManualInput.value = true
    return
  }

  // 직접 → 간편: 기존 SQL을 빌더 상태로 파싱
  isSqlManualInput.value = false
  sqlBuilder.value = parseExampleSqlToBuilder(selectedFewshot.value?.sqlExam ?? '')
}

/** 임시 행을 목록 맨 앞에 추가하고 상세 폼으로 포커스 */
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
  selectFewshot(getFewshotUiKey(newRow))
}

/** 선택된 행 삭제 후 다음 행 자동 선택 */
const onDelete = () => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return
  fewshotList.value = fewshotList.value.filter((row) => getFewshotUiKey(row) !== uiKey)
  ensureSelection()
}

/** FROM 테이블 변경 시 SELECT·WHERE 초기화 */
const onSqlFromTableChange = (table: string | number) => {
  sqlBuilder.value = {
    fromTable: String(table).trim() || FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE,
    selectColumns: [],
    whereClause: '',
  }
}

/** 저장 시 필수 필드 검증 규칙 */
const FEWSHOT_REQUIRED_VALIDATIONS: {
  field: FewshotRequiredField
  message: string
  focusId: string
}[] = [
  { field: 'userQuestion', message: '사용자 질문을 입력해주세요.', focusId: 'fewshot-question' },
  { field: 'aiUnderstand', message: 'AI가 이해해야 할 의미를 입력해주세요.', focusId: 'fewshot-meaning' },
  { field: 'aiRefExam', message: '참조 조회 방법을 입력해주세요.', focusId: 'fewshot-lookup' },
]

/** 유효성 검사 실패 시 해당 행·필드로 스크롤·포커스 */
const focusFewshotValidationField = (uiKey: string, focusId: string) => {
  selectedFewshotKey.value = uiKey
  isSqlManualInput.value = false
  const row = findFewshotRowByUiKey(uiKey)
  sqlBuilder.value = parseExampleSqlToBuilder(row?.sqlExam ?? '')

  nextTick(() => {
    document.getElementById(`fewshot-card-${uiKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const el = document.getElementById(focusId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  })
}

/** 부모 모달 저장 시 호출 — 전체 행 필수 검증 후 정규화된 목록 반환 */
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

<template>
  <div class="datamart-meta-fewshot com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-fewshot-error">
        <p class="datamart-meta-fewshot-error-msg">{{ props.errorMessage }}</p>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="onRetry"
        >
          다시 시도
        </UiButton>
      </div>
    </template>

    <template v-else>
      <div class="datamart-meta-fewshot-header">
        <p class="datamart-meta-fewshot-desc">AI가 사용자 질문을 이해하도록 예시를 등록 관리합니다.</p>
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
          :disabled="isAddFewshotDisabled"
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
                <span class="datamart-meta-fewshot-count">({{ filteredList.length }})</span>
              </span>
            </div>
            <div class="com-setting-section-body datamart-meta-fewshot-list-body">
              <UiEmpty
                v-if="filteredList.length === 0"
                :description="emptyDescription"
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
                    v-for="item in paginatedList"
                    :key="item.uiKey"
                  >
                    <div
                      class="fewshot-card"
                      :class="{ 'is-selected': selectedFewshotKey === item.uiKey }"
                    >
                      <button
                        type="button"
                        class="fewshot-card-select"
                        @click="onOpenDetail(item.uiKey)"
                      >
                        <div class="fewshot-card-main">
                          <p
                            class="fewshot-card-question"
                            :class="{
                              'is-placeholder': !item.row.userQuestion?.trim() && isDraft(item.row.fewshotId ?? ''),
                            }"
                          >
                            {{ getFewshotCardQuestionLabel(item.row) }}
                          </p>
                          <span
                            v-if="getFewshotCardStatusMeta(item.uiKey).status"
                            class="fewshot-card-status"
                            :class="`is-${getFewshotCardStatusMeta(item.uiKey).status}`"
                          >
                            <i aria-hidden="true" />
                            {{ getFewshotCardStatusMeta(item.uiKey).label }}
                          </span>
                        </div>
                      </button>
                      <div class="fewshot-card-menu">
                        <UiDropdownMenu
                          :items="cardMenuItems"
                          align="end"
                          content-class="datamart-meta-fewshot-dropdown"
                          @select="(value) => onCardMenuSelect(value, item)"
                        >
                          <template #trigger>
                            <button
                              type="button"
                              class="fewshot-card-menu-trigger"
                              aria-label="질문 예시 메뉴"
                            >
                              <i class="icon icon-more-vertical size-16" />
                            </button>
                          </template>
                        </UiDropdownMenu>
                      </div>
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
              <div class="datamart-meta-fewshot-detail-header">
                <span class="com-setting-section-title">{{ detailTitle }}</span>
                <div
                  v-if="metaModalFewshotDraft.hasPendingChanges"
                  class="datamart-meta-fewshot-change-actions"
                >
                  <span class="datamart-meta-fewshot-change-badge">
                    <i aria-hidden="true" />
                    변경사항 {{ metaModalFewshotDraft.pendingChangeCount }}건 (저장되지 않음)
                  </span>
                  <UiButton
                    variant="line-secondary"
                    size="sm"
                    @click="onResetChanges"
                  >
                    변경 취소
                  </UiButton>
                </div>
              </div>
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
                    <!-- 조회: 읽기 전용 텍스트 -->
                    <div
                      v-if="!isDetailEditMode"
                      class="fewshot-detail-view"
                    >
                      <div class="fewshot-detail-view-field">
                        <span class="fewshot-form-label">사용자 질문</span>
                        <p class="fewshot-detail-view-text">
                          {{ selectedFewshot.userQuestion || '-' }}
                        </p>
                      </div>
                      <div class="fewshot-detail-view-field">
                        <span class="fewshot-form-label">AI가 이해해야 할 의미</span>
                        <p class="fewshot-detail-view-text">
                          {{ selectedFewshot.aiUnderstand || '-' }}
                        </p>
                      </div>
                      <div class="fewshot-detail-view-field">
                        <span class="fewshot-form-label">참조 조회 방법</span>
                        <p class="fewshot-detail-view-text">
                          {{ selectedFewshot.aiRefExam || '-' }}
                        </p>
                      </div>
                      <div class="fewshot-detail-view-field fewshot-detail-view-field--sql">
                        <div class="fewshot-sql-label-row">
                          <span class="fewshot-form-label">
                            예시 SQL <span class="fewshot-form-optional">(선택)</span>
                          </span>
                        </div>
                        <div
                          v-if="isViewSqlManualDisplay"
                          class="fewshot-detail-view-sql"
                        >
                          {{ selectedFewshot.sqlExam?.trim() || '-' }}
                        </div>
                        <template v-else>
                          <div class="fewshot-sql-builder fewshot-sql-builder--readonly">
                            <div class="fewshot-sql-builder-row">
                              <span class="fewshot-sql-builder-keyword">SELECT</span>
                              <p class="fewshot-detail-view-sql-text">{{ viewSqlLabels.select }}</p>
                            </div>
                            <div class="fewshot-sql-builder-row">
                              <span class="fewshot-sql-builder-keyword">FROM</span>
                              <p class="fewshot-detail-view-sql-text">{{ viewSqlLabels.from }}</p>
                            </div>
                            <div class="fewshot-sql-builder-row">
                              <span class="fewshot-sql-builder-keyword">WHERE</span>
                              <p class="fewshot-detail-view-sql-text">{{ viewSqlLabels.where }}</p>
                            </div>
                          </div>
                          <p class="fewshot-form-hint fewshot-sql-builder-hint">
                            간단한 단일 테이블 조회는 간편 입력 방식으로 작성할 수 있습니다.<br />
                            JOIN, GROUP BY, 서브쿼리 등 복잡한 SQL은 직접 입력을 사용해주세요.
                          </p>
                        </template>
                      </div>
                    </div>

                    <!-- 수정: 입력 폼 -->
                    <form
                      v-else
                      id="fewshot-edit-form"
                      class="fewshot-form"
                      @submit.prevent="onApply"
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
                            v-model="editForm.userQuestion"
                            size="md"
                            :max-length="FEWSHOT_TEXT_MAX"
                            placeholder="사용자 질문을 입력하세요"
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
                            v-model="editForm.aiUnderstand"
                            size="md"
                            :max-length="FEWSHOT_TEXT_MAX"
                            placeholder="AI가 이해해야 할 의미를 입력하세요"
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
                            v-model="editForm.aiRefExam"
                            size="md"
                            :rows="3"
                            :max-length="FEWSHOT_TEXT_MAX"
                            :auto-resize="true"
                            :max-rows="6"
                            border
                            placeholder="참조 조회 방법을 입력하세요"
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
                            v-model="editForm.sqlExam"
                            class="fewshot-sql-textarea"
                            size="md"
                            :rows="6"
                            :auto-resize="false"
                            border
                            :spellcheck="false"
                            placeholder="예시 SQL을 입력하세요"
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

                <div class="fewshot-form-footer flex items-center justify-end gap-8">
                  <div class="fewshot-form-footer-actions flex items-center gap-8">
                    <template v-if="isDetailEditMode">
                      <UiButton
                        type="button"
                        variant="outline"
                        size="md"
                        @click="onCancel"
                      >
                        취소
                      </UiButton>
                      <UiButton
                        variant="primary"
                        size="md"
                        @click="onApply"
                      >
                        적용
                      </UiButton>
                    </template>
                    <UiButton
                      v-else
                      variant="primary"
                      size="md"
                      @click="onEnterEdit"
                    >
                      수정
                    </UiButton>
                  </div>
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
import { useDatamartStore } from '~/composables/datamart/useDatamartStore'
import type { Datamart } from '~/types/datamart'
import type { DatamartMetaFewshot, DatamartMetaTableItem } from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

const fewshotListModel = defineModel<DatamartMetaFewshot[]>('fewshotList', { default: () => [] })

const { metaModalFewshotDraft } = useDatamartStore()

type FewshotListEntry = { uiKey: string; row: DatamartMetaFewshot }

type FewshotEditForm = Pick<DatamartMetaFewshot, 'userQuestion' | 'aiUnderstand' | 'aiRefExam' | 'sqlExam'>

/** 사용자 질문·의미·참조 조회 방법 공통 글자 수 상한 */
const FEWSHOT_TEXT_MAX = 100
const PAGE_SIZE = 6

type SqlBuilderState = {
  fromTable: string
  selectColumns: string[]
  whereClause: string
}

const isVisibleFewshotRow = (row: DatamartMetaFewshot) => row.useYn !== 'N'

/** 미저장 draft는 동시에 1개만 허용 — 고정 UI 키 사용 */
const DRAFT_FEWSHOT_UI_KEY = '__draft__'

const getFewshotUiKey = (row: DatamartMetaFewshot) => row.fewshotId?.trim() || DRAFT_FEWSHOT_UI_KEY

const isDraft = (idOrKey: string) => !idOrKey.trim() || idOrKey === DRAFT_FEWSHOT_UI_KEY

/** 폼 적용 전 빈 draft — 변경 건수·신규 뱃지에 포함하지 않음 */
const isEmptyDraftRow = (row: DatamartMetaFewshot) =>
  isDraft(row.fewshotId ?? '') &&
  !row.userQuestion?.trim() &&
  !row.aiUnderstand?.trim() &&
  !row.aiRefExam?.trim() &&
  !row.sqlExam?.trim()

const toFewshotSignature = (row: DatamartMetaFewshot) => {
  const id = row.fewshotId?.trim() ?? ''
  return [
    id,
    row.userQuestion?.trim() ?? '',
    row.aiUnderstand?.trim() ?? '',
    row.aiRefExam?.trim() ?? '',
    row.sqlExam?.trim() ?? '',
    row.useYn ?? 'Y',
  ].join('|')
}

const findFewshotRowByUiKey = (uiKey: string) => fewshotListModel.value.find((row) => getFewshotUiKey(row) === uiKey)

const FEWSHOT_NEW_CARD_LABEL = '새로운 퓨샷'

/** FROM 드롭다운 안내 항목 — 실제 테이블로 적용되지 않음 */
const FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE = ''

const getFewshotCardQuestionLabel = (row: DatamartMetaFewshot) => {
  const question = row.userQuestion?.trim() ?? ''
  if (question) return question
  return isDraft(row.fewshotId ?? '') ? FEWSHOT_NEW_CARD_LABEL : ''
}

const visibleFewshotList = computed((): FewshotListEntry[] =>
  fewshotListModel.value.flatMap((row) => (isVisibleFewshotRow(row) ? [{ uiKey: getFewshotUiKey(row), row }] : [])),
)

const updateFewshotRowByUiKey = (uiKey: string, updater: (row: DatamartMetaFewshot) => DatamartMetaFewshot) => {
  fewshotListModel.value = fewshotListModel.value.map((row) => {
    if (getFewshotUiKey(row) !== uiKey) return row
    return updater(row)
  })
}

const initialSignatureByFewshotId = computed(() => {
  const map = new Map<string, string>()
  metaModalFewshotDraft.initial.value.forEach((row) => {
    const id = row.fewshotId?.trim() ?? ''
    if (id) map.set(id, toFewshotSignature(row))
  })
  return map
})

type FewshotCardStatus = 'new' | 'modified'

const getFewshotCardStatusMeta = (uiKey: string): { status: FewshotCardStatus | null; label: string } => {
  const row = findFewshotRowByUiKey(uiKey)
  if (!row || !isVisibleFewshotRow(row)) return { status: null, label: '' }

  if (isDraft(row.fewshotId ?? '')) {
    return isEmptyDraftRow(row) ? { status: null, label: '' } : { status: 'new', label: '신규' }
  }

  const serverId = row.fewshotId?.trim() ?? ''
  if (!serverId) return { status: null, label: '' }

  const initialSig = initialSignatureByFewshotId.value.get(serverId)
  if (!initialSig) return { status: null, label: '' }

  return toFewshotSignature(row) !== initialSig ? { status: 'modified', label: '수정됨' } : { status: null, label: '' }
}

const onResetChanges = () => {
  metaModalFewshotDraft.revert()
  detailMode.value = 'view'
  editForm.value = createEmptyForm()
  isSqlManualInput.value = false
  sqlBuilder.value = createEmptySqlBuilder()
  ensureSelection()
}

const searchKeyword = ref('')
const currentPage = ref(1)
const selectedFewshotKey = ref<string | null>(null)

const editForm = ref<FewshotEditForm>(createEmptyForm())
const sqlBuilder = ref<SqlBuilderState>(createEmptySqlBuilder())
const isSqlManualInput = ref(false)

const cardMenuItems = [
  { label: '수정', value: 'edit', icon: 'icon-edit' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

const detailMode = ref<'view' | 'edit'>('view')
const isDetailEditMode = computed(() => detailMode.value === 'edit')
/** 신규 퓨샷·기존 항목 수정 중에는 추가 등록 불가 */
const isAddFewshotDisabled = computed(() => isDetailEditMode.value)

const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

const createDraftFewshotRow = (): DatamartMetaFewshot => ({
  datamartId: datamartId.value,
  fewshotId: '',
  userQuestion: '',
  aiUnderstand: '',
  aiRefExam: '',
  sqlExam: '',
  useYn: 'Y',
  createDt: '',
  modifyDt: '',
})

function createEmptyForm(): FewshotEditForm {
  return {
    userQuestion: '',
    aiUnderstand: '',
    aiRefExam: '',
    sqlExam: '',
  }
}

function getMetaTableColumnNames(table: DatamartMetaTableItem): string[] {
  return table.columns.map((column) => column.colPhyNm || column.colId)
}

function findMetaTableByPhysicalName(
  physicalName: string,
  metaTables: DatamartMetaTableItem[],
): DatamartMetaTableItem | undefined {
  return metaTables.find((table) => table.physicalNm === physicalName)
}
function createEmptySqlBuilder(): SqlBuilderState {
  return {
    fromTable: '',
    selectColumns: [],
    whereClause: '',
  }
}

function buildExampleSqlFromBuilder(state: SqlBuilderState): string {
  const { fromTable, selectColumns, whereClause } = state
  if (!fromTable) return ''

  const selectPart = selectColumns.length > 0 ? selectColumns.join(', ') : '*'
  const lines = [`SELECT ${selectPart}`, `FROM ${fromTable}`]

  if (whereClause.trim()) {
    lines.push(`WHERE ${whereClause.trim()}`)
  }

  return lines.join('\n')
}

function parseExampleSqlToBuilder(sql: string, _metaTables: DatamartMetaTableItem[]): SqlBuilderState {
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

  return {
    fromTable,
    selectColumns,
    whereClause,
  }
}

function applySqlBuilderFromExampleSql(sql: string) {
  sqlBuilder.value = parseExampleSqlToBuilder(sql, activeMetaTables.value)
}

function syncExampleSqlFromBuilder() {
  if (isSqlManualInput.value) return
  editForm.value.sqlExam = buildExampleSqlFromBuilder(sqlBuilder.value)
}

function cloneFormFromRow(row: DatamartMetaFewshot): FewshotEditForm {
  return {
    userQuestion: row.userQuestion ?? '',
    aiUnderstand: row.aiUnderstand ?? '',
    aiRefExam: row.aiRefExam ?? '',
    sqlExam: row.sqlExam ?? '',
  }
}

const filteredList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return visibleFewshotList.value

  return visibleFewshotList.value.filter((item) => {
    const row = item.row
    return (
      (row.userQuestion ?? '').toLowerCase().includes(keyword) ||
      (row.aiUnderstand ?? '').toLowerCase().includes(keyword) ||
      (row.aiRefExam ?? '').toLowerCase().includes(keyword) ||
      (row.sqlExam ?? '').toLowerCase().includes(keyword)
    )
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / PAGE_SIZE)))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredList.value.slice(start, start + PAGE_SIZE)
})

const selectedFewshot = computed(() => {
  const row = findFewshotRowByUiKey(selectedFewshotKey.value ?? '')
  if (!row || !isVisibleFewshotRow(row)) return null
  return row
})

const detailTitle = computed(() => {
  if (!selectedFewshot.value) return '상세보기'
  return isDetailEditMode.value ? '질문 예시 수정' : '상세보기'
})

const emptyDescription = computed(() =>
  searchKeyword.value.trim() ? '검색 결과가 없습니다.' : '등록된 질문 예시가 없습니다.',
)

const activeMetaTables = computed(() => props.tables.filter((table) => table.useYn === 'Y'))

const normalizeFewshotSql = (sql: string) => sql.trim().replace(/\s+/g, ' ').toUpperCase()

const viewSqlBuilderState = computed(() =>
  parseExampleSqlToBuilder(selectedFewshot.value?.sqlExam ?? '', activeMetaTables.value),
)

const isViewSqlManualDisplay = computed(() => {
  const sql = selectedFewshot.value?.sqlExam?.trim() ?? ''
  if (!sql) return false
  const builder = viewSqlBuilderState.value
  if (!builder.fromTable) return true
  return normalizeFewshotSql(sql) !== normalizeFewshotSql(buildExampleSqlFromBuilder(builder))
})

const viewSqlLabels = computed(() => {
  const { fromTable, selectColumns, whereClause } = viewSqlBuilderState.value
  return {
    select: !fromTable ? '-' : selectColumns.length ? selectColumns.join(', ') : '*',
    from: fromTable || '-',
    where: whereClause.trim() || '-',
  }
})

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
    syncExampleSqlFromBuilder()
  },
  { deep: true },
)

const syncEditForm = (row: DatamartMetaFewshot | null) => {
  editForm.value = row ? cloneFormFromRow(row) : createEmptyForm()
  isSqlManualInput.value = false
  applySqlBuilderFromExampleSql(editForm.value.sqlExam)
}

const onToggleSqlManualInput = () => {
  if (!isSqlManualInput.value) {
    editForm.value.sqlExam = buildExampleSqlFromBuilder(sqlBuilder.value)
    isSqlManualInput.value = true
    return
  }

  isSqlManualInput.value = false
  applySqlBuilderFromExampleSql(editForm.value.sqlExam)
}

type FewshotDetailMode = 'view' | 'edit' | 'auto'

const selectFewshot = (uiKey: string | null, mode: FewshotDetailMode = 'auto') => {
  selectedFewshotKey.value = uiKey
  if (!uiKey) {
    detailMode.value = 'view'
    return
  }
  detailMode.value = mode === 'auto' ? (isDraft(uiKey) ? 'edit' : 'view') : mode
}

/** 목록·페이지 변경 시 선택 유지 */
const ensureSelection = () => {
  if (filteredList.value.length === 0) {
    selectFewshot(null)
    return
  }

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }

  if (filteredList.value.some((item) => item.uiKey === selectedFewshotKey.value)) return

  const nextKey = paginatedList.value[0]?.uiKey ?? filteredList.value[0]?.uiKey ?? null
  if (nextKey) selectFewshot(nextKey)
}

watch([filteredList, currentPage], () => ensureSelection(), { immediate: true })

watch([selectedFewshotKey, detailMode], () => {
  if (detailMode.value === 'edit') syncEditForm(selectedFewshot.value)
})

watch(searchKeyword, () => {
  currentPage.value = 1
})

const onPageChange = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const onOpenDetail = (uiKey: string) => {
  selectFewshot(uiKey)
}

const onEnterEdit = () => {
  if (!selectedFewshot.value) return
  detailMode.value = 'edit'
}

const onCardMenuSelect = (value: string, item: FewshotListEntry) => {
  if (value === 'edit') {
    selectFewshot(item.uiKey, 'edit')
    return
  }
  if (value === 'delete') {
    selectFewshot(item.uiKey, 'view')
    openDeleteConfirm()
  }
}

const onAdd = () => {
  if (isAddFewshotDisabled.value) return

  const draftRow = createDraftFewshotRow()
  fewshotListModel.value = [draftRow, ...fewshotListModel.value]

  searchKeyword.value = ''
  currentPage.value = 1
  selectFewshot(getFewshotUiKey(draftRow), 'edit')
}

const onCancel = () => {
  const row = selectedFewshot.value
  if (row && isDraft(row.fewshotId ?? '')) {
    const draftKey = selectedFewshotKey.value
    if (draftKey) {
      fewshotListModel.value = fewshotListModel.value.filter((r) => getFewshotUiKey(r) !== draftKey)
    }
    ensureSelection()
    return
  }

  detailMode.value = 'view'
}

const onApply = () => {
  if (!isDetailEditMode.value) return

  const uiKey = selectedFewshotKey.value
  if (!uiKey) return

  const userQuestion = editForm.value.userQuestion.trim()
  const aiUnderstand = editForm.value.aiUnderstand.trim()
  const aiRefExam = editForm.value.aiRefExam.trim()

  const validations = [
    { invalid: !userQuestion, message: '사용자 질문을 입력해주세요.' },
    { invalid: !aiUnderstand, message: 'AI가 이해해야 할 의미를 입력해주세요.' },
    { invalid: !aiRefExam, message: '참조 조회 방법을 입력해주세요.' },
  ]
  const failed = validations.find((v) => v.invalid)
  if (failed) {
    openToast({ message: failed.message, type: 'warning' })
    return
  }

  updateFewshotRowByUiKey(uiKey, (row) => ({
    ...row,
    datamartId: datamartId.value || row.datamartId,
    userQuestion,
    aiUnderstand,
    aiRefExam,
    sqlExam: editForm.value.sqlExam.trim(),
    useYn: 'Y',
  }))
  detailMode.value = 'view'
}

const openDeleteConfirm = async () => {
  const uiKey = selectedFewshotKey.value
  if (!uiKey) return

  const confirmed = await openConfirm({
    message: '선택한 질문 예시를 삭제하시겠습니까?',
  })
  if (!confirmed) return

  doDelete(uiKey)
}

const doDelete = (uiKey: string) => {
  if (isDraft(uiKey)) {
    fewshotListModel.value = fewshotListModel.value.filter((row) => getFewshotUiKey(row) !== uiKey)
  } else {
    updateFewshotRowByUiKey(uiKey, (row) => ({ ...row, useYn: 'N' }))
  }
  ensureSelection()
  openToast({ message: '삭제되었습니다.', type: 'success' })
}

const onSqlFromTableChange = (table: string | number) => {
  sqlBuilder.value = {
    fromTable: String(table).trim() || FEWSHOT_FROM_TABLE_PLACEHOLDER_VALUE,
    selectColumns: [],
    whereClause: '',
  }
  syncExampleSqlFromBuilder()
}

const onRetry = () => {
  emit('retry')
}

onBeforeUnmount(() => {
  if (!metaModalFewshotDraft.hasPendingChanges.value) return
  onResetChanges()
})
</script>

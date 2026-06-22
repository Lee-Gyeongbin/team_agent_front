<template>
  <div class="datamart-meta-abbrev com-setting-form">
    <template v-if="props.errorMessage">
      <div class="datamart-meta-abbrev-error">
        <p class="datamart-meta-abbrev-error-msg">{{ props.errorMessage }}</p>
      </div>
    </template>

    <template v-else>
      <div class="datamart-meta-abbrev-header">
        <p class="datamart-meta-abbrev-desc">
          DB에서 사용하는 약어와 정식 표현을 등록하여 AI가 사용자 질문을 더 정확하게 이해하도록 합니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-abbrev-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <div class="datamart-meta-abbrev-toolbar">
        <UiInput
          v-model="searchKeyword"
          type="search"
          size="sm"
          placeholder="약어·영문·한글 전체명을 입력하세요"
          class="datamart-meta-abbrev-search"
        />
        <UiButton
          variant="primary"
          size="sm"
          class="datamart-meta-abbrev-add shrink-0"
          @click="onAddRow"
        >
          <template #icon-left>
            <i class="icon icon-plus size-16" />
          </template>
          약어 추가
        </UiButton>
      </div>

      <div class="com-setting-section datamart-meta-abbrev-list-section">
        <div class="com-setting-section-header datamart-meta-section-header-static">
          <span class="com-setting-section-title">
            약어 목록
            <span class="datamart-meta-abbrev-count">({{ abbrevList.length }})</span>
          </span>
        </div>
        <div class="com-setting-section-body datamart-meta-abbrev-list-body">
          <UiEmpty
            v-if="listEmptyState !== 'none'"
            :description="listEmptyDescription"
            class="abbrev-empty"
          />

          <div
            v-else
            class="datamart-meta-abbrev-table-wrap"
          >
            <UiTable
              :columns="datamartMetaAbbrevTableColumns"
              :data="filteredAbbrevList"
              size="sm"
              sticky-header
              empty-text="등록된 약어가 없습니다."
            >
              <template #cell-abbrNm="{ row }">
                <UiInput
                  :id="`abbrev-abbr-${getRowUiId(row as DatamartMetaAbbrevItem)}`"
                  :model-value="(row as DatamartMetaAbbrevItem).abbrNm"
                  size="xs"
                  placeholder="약어 입력"
                  @update:model-value="onUpdateAbbrNm(row as DatamartMetaAbbrevItem, $event)"
                  @blur="onBlurAbbrevField(row as DatamartMetaAbbrevItem, 'abbrNm', $event)"
                />
              </template>
              <template #cell-fullNmEng="{ row }">
                <UiInput
                  :id="`abbrev-eng-${getRowUiId(row as DatamartMetaAbbrevItem)}`"
                  :model-value="(row as DatamartMetaAbbrevItem).fullNmEng"
                  size="xs"
                  placeholder="영문 전체명 입력"
                  @update:model-value="onUpdateFullNmEng(row as DatamartMetaAbbrevItem, $event)"
                  @blur="onBlurAbbrevField(row as DatamartMetaAbbrevItem, 'fullNmEng', $event)"
                />
              </template>
              <template #cell-fullNmKor="{ row }">
                <UiInput
                  :id="`abbrev-kor-${getRowUiId(row as DatamartMetaAbbrevItem)}`"
                  :model-value="(row as DatamartMetaAbbrevItem).fullNmKor"
                  size="xs"
                  placeholder="한글 전체명 입력"
                  @update:model-value="onUpdateFullNmKor(row as DatamartMetaAbbrevItem, $event)"
                  @blur="onBlurAbbrevField(row as DatamartMetaAbbrevItem, 'fullNmKor', $event)"
                />
              </template>
              <template #cell-_actions="{ row }">
                <div class="datamart-meta-abbrev-actions-cell">
                  <UiButton
                    variant="line-secondary"
                    size="sm"
                    icon-only
                    type="button"
                    title="약어 삭제"
                    aria-label="약어 삭제"
                    @click="onDeleteRow(row as DatamartMetaAbbrevItem)"
                  >
                    <template #icon-left>
                      <i class="icon-trashcan size-16" />
                    </template>
                  </UiButton>
                </div>
              </template>
            </UiTable>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Datamart } from '~/types/datamart'
import type { DatamartMetaAbbrevItem, DatamartMetaAbbrevPayload } from '~/types/datamartMeta'
import { datamartMetaAbbrevTableColumns } from '~/types/datamartMeta'
import { isEnglishOnly, isKoreanOnly } from '~/utils/global/validationUtil'

/** 행의 약어·영문·한글 전체명 값 목록 (빈 값 제외) */
const getRowFieldValues = (row: DatamartMetaAbbrevItem) =>
  [row.abbrNm, row.fullNmEng, row.fullNmKor].map((value) => value.trim()).filter(Boolean)

const normalizeAbbrevValueKey = (value: string) => value.trim().toLowerCase()

/** 약어·영문·한글 전체명 필드 전체에서 동일 값 중복 검사 */
const findDuplicateAbbrevValue = (rows: DatamartMetaAbbrevItem[]): string | null => {
  const seen = new Set<string>()
  for (const row of rows) {
    for (const value of getRowFieldValues(row)) {
      const key = normalizeAbbrevValueKey(value)
      if (seen.has(key)) return value
      seen.add(key)
    }
  }
  return null
}

const props = defineProps<{
  datamart: Datamart | null
  errorMessage?: string | null
  abbrevApiRes?: DatamartMetaAbbrevPayload | null
}>()

/** 부모와 양방향 바인딩 — 약어사전 편집 상태 */
const abbrevList = defineModel<DatamartMetaAbbrevItem[]>('abbrevList', { default: () => [] })

/** 신규 행(abbrId 없음) v-for key — WeakMap으로 관리 */
const draftRowUiKeyMap = new WeakMap<DatamartMetaAbbrevItem, string>()
const createDraftRowUiKey = () => `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

/** UiTable row key — 서버 abbrId 우선, 없으면 draft WeakMap key */
const getRowUiId = (row: DatamartMetaAbbrevItem) => {
  const abbrId = row.abbrId?.trim()
  if (abbrId) return abbrId
  let draftKey = draftRowUiKeyMap.get(row)
  if (!draftKey) {
    draftKey = createDraftRowUiKey()
    draftRowUiKeyMap.set(row, draftKey)
  }
  return draftKey
}

/**
 * API 조회 응답 → 탭 UI 목록
 */
const parseAbbrevListFromApi = (
  res: DatamartMetaAbbrevPayload | DatamartMetaAbbrevItem[] | null | undefined,
  sourceDatamartId: string,
): DatamartMetaAbbrevItem[] | null => {
  if (!res) return null

  if (Array.isArray(res)) {
    return res.map((item) => normalizeAbbrevRow(item, sourceDatamartId))
  }

  const datamartIdFromRes = res.datamartId?.trim() || sourceDatamartId
  const list = res.abbrDictList
  if (!Array.isArray(list)) return null
  return list.map((item) => normalizeAbbrevRow({ ...item, datamartId: datamartIdFromRes }, datamartIdFromRes))
}

const searchKeyword = ref('')
const datamartId = computed(() => props.datamart?.datamartId?.trim() ?? '')

/** 행 상태 정규화 — trim·datamartId·useYn·abbrId */
const normalizeAbbrevRow = (item: DatamartMetaAbbrevItem, sourceDatamartId?: string): DatamartMetaAbbrevItem => {
  const abbrId = item.abbrId?.trim() ?? ''
  return {
    ...item,
    datamartId: item.datamartId?.trim() || sourceDatamartId || datamartId.value,
    abbrNm: item.abbrNm?.trim() ?? '',
    fullNmEng: item.fullNmEng?.trim() ?? '',
    fullNmKor: item.fullNmKor?.trim() ?? '',
    useYn: item.useYn === 'N' ? 'N' : 'Y',
    ...(abbrId ? { abbrId } : {}),
  }
}

/** 검색어로 약어·영문·한글 전체명 필터링 */
const filteredAbbrevList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const rows = abbrevList.value
  if (!keyword) return rows
  return rows.filter((row) => {
    const abbr = row.abbrNm.trim().toLowerCase()
    const eng = row.fullNmEng.trim().toLowerCase()
    const kor = row.fullNmKor.trim()
    return abbr.includes(keyword) || eng.includes(keyword) || kor.includes(keyword)
  })
})

/** 빈 목록 UI 구분 — 데이터 없음 / 검색 결과 없음 */
const listEmptyState = computed<'none' | 'no-data' | 'no-search'>(() => {
  if (abbrevList.value.length === 0) return 'no-data'
  if (filteredAbbrevList.value.length === 0) return 'no-search'
  return 'none'
})

const listEmptyDescription = computed(() =>
  listEmptyState.value === 'no-search' ? '검색 결과가 없습니다.' : '등록된 약어가 없습니다.',
)

const updateRowByUiId = (rowId: string, updater: (row: DatamartMetaAbbrevItem) => DatamartMetaAbbrevItem) => {
  abbrevList.value = abbrevList.value.map((row) => {
    if (getRowUiId(row) !== rowId) return row
    const next = updater(row)
    preserveDraftRowUiKey(row, next)
    return next
  })
}

/** normalize 시 신규 행 draft key 유지 (blur·입력 업데이트 시) */
const preserveDraftRowUiKey = (prevRow: DatamartMetaAbbrevItem, nextRow: DatamartMetaAbbrevItem) => {
  const draftKey = draftRowUiKeyMap.get(prevRow)
  if (draftKey && !nextRow.abbrId?.trim()) {
    draftRowUiKeyMap.set(nextRow, draftKey)
  }
}

/** 약어 목록 검증 — 저장 시 1회만 실행 */
type AbbrevFieldKey = 'abbr' | 'eng' | 'kor'

type AbbrevListValidationError = {
  message: string
  rowId?: string
  field?: AbbrevFieldKey
  duplicateValue?: string
}

const validateAbbrevList = (
  rows: DatamartMetaAbbrevItem[],
  sourceRows: DatamartMetaAbbrevItem[],
): AbbrevListValidationError | null => {
  const findSourceRowId = (predicate: (row: DatamartMetaAbbrevItem) => boolean) => {
    const index = rows.findIndex(predicate)
    return index >= 0 ? getRowUiId(sourceRows[index]) : null
  }

  const emptyAbbrRowId = findSourceRowId((row) => !row.abbrNm.trim())
  if (emptyAbbrRowId) {
    return { message: '약어를 입력해주세요.', rowId: emptyAbbrRowId, field: 'abbr' }
  }

  const emptyEngRowId = findSourceRowId((row) => !row.fullNmEng.trim())
  if (emptyEngRowId) {
    return { message: '영문 전체명을 입력해주세요.', rowId: emptyEngRowId, field: 'eng' }
  }

  const emptyKorRowId = findSourceRowId((row) => !row.fullNmKor.trim())
  if (emptyKorRowId) {
    return { message: '한글 전체명을 입력해주세요.', rowId: emptyKorRowId, field: 'kor' }
  }

  const invalidEngRowId = findSourceRowId((row) => !isEnglishOnly(row.fullNmEng))
  if (invalidEngRowId) {
    return { message: '영문 전체명은 영문만 입력할 수 있습니다.', rowId: invalidEngRowId, field: 'eng' }
  }

  const invalidKorRowId = findSourceRowId((row) => !isKoreanOnly(row.fullNmKor))
  if (invalidKorRowId) {
    return { message: '한글 전체명은 한글만 입력할 수 있습니다.', rowId: invalidKorRowId, field: 'kor' }
  }

  const duplicateValue = findDuplicateAbbrevValue(rows)
  if (duplicateValue) {
    return { message: '사전 항목에 동일한 값이 있습니다.', duplicateValue }
  }

  return null
}

const onUpdateAbbrNm = (row: DatamartMetaAbbrevItem, value: string) => {
  updateRowByUiId(getRowUiId(row), (item) => ({ ...item, abbrNm: value }))
}

const onUpdateFullNmEng = (row: DatamartMetaAbbrevItem, value: string) => {
  updateRowByUiId(getRowUiId(row), (item) => ({ ...item, fullNmEng: value }))
}

const onUpdateFullNmKor = (row: DatamartMetaAbbrevItem, value: string) => {
  updateRowByUiId(getRowUiId(row), (item) => ({ ...item, fullNmKor: value }))
}

/** blur — trim·행 정규화만 (검증은 저장 시 1회) */
const onBlurAbbrevField = (row: DatamartMetaAbbrevItem, field: 'abbrNm' | 'fullNmEng' | 'fullNmKor', value: string) => {
  const rowId = getRowUiId(row)
  const currentRow = abbrevList.value.find((item) => getRowUiId(item) === rowId) ?? row
  updateRowByUiId(rowId, () => normalizeAbbrevRow({ ...currentRow, [field]: value.trim() }))
}

/** 빈 행으로 신규 약어 추가 후 약어 입력 포커스 */
const onAddRow = () => {
  const newRow = normalizeAbbrevRow({
    abbrNm: '',
    fullNmEng: '',
    fullNmKor: '',
    useYn: 'Y',
  })
  abbrevList.value = [newRow, ...abbrevList.value]
  focusAbbrevField(getRowUiId(newRow), 'abbr')
}

const onDeleteRow = (row: DatamartMetaAbbrevItem) => {
  const rowId = getRowUiId(row)
  abbrevList.value = abbrevList.value.filter((item) => getRowUiId(item) !== rowId)
}

/**
 * API 조회 결과 → abbrevList 동기화
 * - 탭 재마운트(immediate, prev 없음) + 편집 데이터 있음 → 유지
 * - API 응답 변경(저장 후 재조회 등) → 서버 데이터로 갱신
 */
watch(
  () => [props.abbrevApiRes, props.errorMessage] as const,
  ([res, errorMessage], prev) => {
    if (errorMessage) {
      abbrevList.value = []
      return
    }
    if (res === null || res === undefined) return

    const prevRes = prev?.[0]
    if (abbrevList.value.length > 0 && prevRes === undefined) return

    abbrevList.value = parseAbbrevListFromApi(res, datamartId.value) ?? []
  },
  { immediate: true },
)

/** 검색 필터로 숨겨진 행이면 검색어 초기화 */
const ensureAbbrevRowVisible = (rowId: string) => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return false

  const targetRow = abbrevList.value.find((row) => getRowUiId(row) === rowId)
  if (!targetRow) return false

  const kw = keyword.toLowerCase()
  const abbr = targetRow.abbrNm.trim().toLowerCase()
  const eng = targetRow.fullNmEng.trim().toLowerCase()
  const kor = targetRow.fullNmKor.trim()
  if (abbr.includes(kw) || eng.includes(kw) || kor.includes(kw)) return false

  searchKeyword.value = ''
  return true
}

const focusAbbrevField = (rowId: string, field: AbbrevFieldKey) => {
  const searchCleared = ensureAbbrevRowVisible(rowId)
  const focus = () => {
    const el = document.getElementById(`abbrev-${field}-${rowId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el?.focus()
  }
  nextTick(() => {
    focus()
    if (searchCleared) nextTick(focus)
  })
}

/** 중복 값이 포함된 첫 행·필드로 포커스 */
const focusDuplicateAbbrevValue = (sourceRows: DatamartMetaAbbrevItem[], duplicateValue: string) => {
  const duplicateKey = normalizeAbbrevValueKey(duplicateValue)
  for (const row of sourceRows) {
    const rowId = getRowUiId(row)
    if (row.abbrNm.trim() && normalizeAbbrevValueKey(row.abbrNm) === duplicateKey) {
      focusAbbrevField(rowId, 'abbr')
      return
    }
    if (row.fullNmEng.trim() && normalizeAbbrevValueKey(row.fullNmEng) === duplicateKey) {
      focusAbbrevField(rowId, 'eng')
      return
    }
    if (row.fullNmKor.trim() && normalizeAbbrevValueKey(row.fullNmKor) === duplicateKey) {
      focusAbbrevField(rowId, 'kor')
      return
    }
  }
}

const handleAbbrevListValidationError = (sourceRows: DatamartMetaAbbrevItem[], error: AbbrevListValidationError) => {
  if (error.duplicateValue) {
    focusDuplicateAbbrevValue(sourceRows, error.duplicateValue)
  } else if (error.rowId && error.field) {
    focusAbbrevField(error.rowId, error.field)
  }
  openToast({ message: error.message, type: 'warning' })
}

/** 부모 모달 저장 시 호출 — blur 정규화 후 검증 1회, 통과 시 abbrevList 반환 */
const buildSavePayload = (): DatamartMetaAbbrevItem[] | null => {
  if (!datamartId.value) {
    openToast({ message: '데이터마트 정보가 없습니다.', type: 'warning' })
    return null
  }

  const sourceRows = abbrevList.value
  const rows = sourceRows.map((row) => normalizeAbbrevRow(row))

  const validationError = validateAbbrevList(rows, sourceRows)
  if (validationError) {
    handleAbbrevListValidationError(sourceRows, validationError)
    return null
  }

  abbrevList.value = rows
  return [...rows]
}

defineExpose({ buildSavePayload })
</script>

<style lang="scss" scoped>
.datamart-meta-abbrev-search {
  :deep(.ui-input-outer) {
    width: 100%;
  }
}

.datamart-meta-abbrev-list-section {
  :deep(.com-setting-section-body) {
    gap: 0;
  }
}

.datamart-meta-abbrev-table-wrap {
  width: 100%;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-sizing: border-box;

  :deep(.ui-table-wrap) {
    overflow: visible;
    max-height: none !important;
  }

  :deep(.ui-table td) {
    vertical-align: middle;
  }

  :deep(.ui-table-wrap.is-sm .ui-table tbody td) {
    height: 48px;
    min-height: 48px;
    max-height: 48px;
    padding: 6px 12px;
    box-sizing: border-box;
    line-height: 1.35;
    vertical-align: middle;
    overflow: hidden;
  }

  :deep(.ui-input-wrap) {
    width: 100%;
    min-width: 0;
  }

  :deep(.ui-input-outer) {
    width: 100%;
    min-width: 0;
  }

  :deep(.datamart-meta-abbrev-actions-cell) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

<template>
  <div class="datamart-meta-code-mapping com-setting-form">
    <template v-if="tables.length === 0">
      <UiEmpty
        icon="icon-database"
        title="테이블이 없습니다."
        description="스키마에서 테이블 목록을 불러오면 여기에 표시됩니다."
      />
    </template>

    <template v-else-if="activeTables.length === 0">
      <UiEmpty
        icon="icon-database"
        title="활성화된 테이블이 없습니다."
        description="테이블 선택 탭에서 사용할 테이블을 켜면 코드 매핑을 추가할 수 있습니다."
      />
    </template>

    <template v-else>
      <div class="datamart-meta-code-mapping-header">
        <h3 class="datamart-meta-code-mapping-title">코드성 컬럼 선택</h3>
        <p class="datamart-meta-code-mapping-desc">
          자연어(예: 세부항목)를 DB 코드값(예: 03)으로 바꿀 때 참고할 메타입니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-code-mapping-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <!-- 매핑 대상 컬럼 + 매핑 목록 + 코드값 (한 영역) -->
      <div
        class="com-setting-section datamart-meta-code-section"
        :class="{ 'is-collapsed': sectionCollapsed.listAndEditor }"
        style="--label-width: 140px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed.listAndEditor = !sectionCollapsed.listAndEditor"
        >
          <span class="com-setting-section-title">
            매핑 목록 · 코드값
            <template v-if="activeMappingChipLabel">
              <span class="datamart-meta-column-metadata-table-chip">{{ activeMappingChipLabel }}</span>
            </template>
          </span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <div class="datamart-meta-code-combined">
            <div class="datamart-meta-code-add-block">
              <p class="datamart-meta-code-section-hint">
                테이블·컬럼 선택 후 「컬럼 추가」로 목록에 행을 넣고, 행을 클릭한 뒤 아래에서 코드값·설명을 편집합니다.
              </p>
              <div class="datamart-meta-code-add-toolbar">
                <div class="datamart-meta-code-add-selects">
                  <div class="com-setting-field-row datamart-meta-code-add-field">
                    <label class="com-setting-label">테이블</label>
                    <UiSelect
                      v-model="pickTableId"
                      :options="tableOptions"
                      size="sm"
                      placeholder="테이블 선택"
                      @update:model-value="pickColId = ''"
                    />
                  </div>
                  <div class="com-setting-field-row datamart-meta-code-add-field">
                    <label class="com-setting-label">컬럼명</label>
                    <UiSelect
                      v-model="pickColId"
                      :options="pickColumnOptions"
                      size="sm"
                      placeholder="컬럼 선택"
                      :disabled="!pickTableId || pickColumnOptions.length === 0"
                    />
                  </div>
                </div>
                <UiButton
                  variant="primary"
                  size="sm"
                  type="button"
                  title="컬럼 추가"
                  aria-label="컬럼 추가"
                  :disabled="!pickTableId || !pickColId"
                  @click="onAddCodeColumn"
                >
                  <template #icon-left>
                    <i class="icon-plus size-16" />
                  </template>
                  컬럼 추가
                </UiButton>
              </div>
            </div>
            <div class="datamart-meta-code-panel-wrap is-table">
              <UiTable
                :columns="datamartMetaCodeMappingMasterColumns"
                :data="mappingMasterRows"
                size="sm"
                sticky-header
                clickable
                selected-row-key="mappingId"
                :selected-row-value="selectedMappingId"
                empty-text="등록된 코드 매핑이 없습니다. 위에서 테이블·컬럼을 선택 후 컬럼 추가를 누르세요."
                @row-click="onMappingMasterRowClick"
              >
                <template #cell-_actions="{ row }">
                  <div class="datamart-meta-code-master-actions">
                    <UiButton
                      variant="line-secondary"
                      size="xxs"
                      icon-only
                      type="button"
                      title="이 매핑 삭제"
                      aria-label="이 매핑 삭제"
                      class="datamart-meta-code-master-trash-btn"
                      @click.stop="onRemoveMapping((row as MappingMasterRow).mappingId)"
                    >
                      <template #icon-left>
                        <i class="icon-trashcan size-12" />
                      </template>
                    </UiButton>
                  </div>
                </template>
              </UiTable>
            </div>
            <div class="datamart-meta-code-panel-wrap is-editor">
              <template v-if="!activeMapping">
                <UiEmpty
                  icon="icon-database"
                  title="선택된 매핑이 없습니다."
                  description="위 목록에서 행을 클릭해 편집할 코드성 컬럼을 선택하세요."
                  class="datamart-meta-code-editor-empty"
                />
              </template>
              <template v-else>
                <div class="datamart-meta-code-editor-body">
                  <div class="datamart-meta-code-entry-topbar">
                    <UiButton
                      variant="primary"
                      size="sm"
                      type="button"
                      title="코드값 추가"
                      aria-label="코드값 추가"
                      @click="onAddEntry"
                    >
                      <template #icon-left>
                        <i class="icon-plus size-16" />
                      </template>
                      코드값 추가
                    </UiButton>
                  </div>
                  <div class="datamart-meta-code-entry-list">
                    <div
                      v-for="entry in activeMapping.entries"
                      :key="entry.id"
                      class="datamart-meta-code-entry-row"
                    >
                      <UiInput
                        v-model="entry.codeValue"
                        size="sm"
                        class="datamart-meta-code-entry-code"
                        placeholder="코드값"
                      />
                      <span
                        class="datamart-meta-code-entry-eq"
                        aria-hidden="true"
                      >
                        =
                      </span>
                      <UiInput
                        v-model="entry.labelKo"
                        size="sm"
                        class="datamart-meta-code-entry-label"
                        placeholder="설명(한국어)"
                      />
                      <UiButton
                        variant="line-secondary"
                        size="sm"
                        icon-only
                        type="button"
                        title="이 코드 행 삭제"
                        aria-label="이 코드 행 삭제"
                        @click="onRemoveEntry(activeMapping.id, entry.id)"
                      >
                        <template #icon-left>
                          <i class="icon-trashcan size-16" />
                        </template>
                      </UiButton>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- SQL 미리보기 -->
      <div
        class="com-setting-section datamart-meta-code-section"
        :class="{ 'is-collapsed': sectionCollapsed.aiContextPreview }"
        style="--label-width: 140px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed.aiContextPreview = !sectionCollapsed.aiContextPreview"
        >
          <span class="com-setting-section-title">AI 컨텍스트 미리보기</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <p class="datamart-meta-code-ai-context-hint">
            선택한 코드 매핑·관계 정의를 바탕으로 AI에 넘길 문맥 예시입니다. 저장 시 API 스펙에 맞게 전송됩니다.
          </p>
          <div class="datamart-meta-code-ai-context-block-wrap">
            <UiCodeBlock :code="previewAiContext" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Datamart } from '~/types/datamart'
import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaCodeValueRow,
  DatamartMetaJoinTy,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'
import { datamartMetaCodeMappingMasterColumns } from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
  relationships: DatamartMetaRelationship[]
}>()

const codeMappings = defineModel<DatamartMetaCodeColumnMapping[]>('codeMappings', { default: () => [] })

/** 마스터 테이블 행 타입 (템플릿 캐스트용) */
interface MappingMasterRow {
  mappingId: string
  tableNm: string
  colName: string
  descKo: string
  entryCnt: string
}

const selectedMappingId = ref('')
const pickTableId = ref('')
const pickColId = ref('')

const sectionCollapsed = reactive({
  listAndEditor: false,
  aiContextPreview: false,
})

const activeTables = computed(() => props.tables.filter((t) => t.useYn === 'Y'))

const tableOptions = computed(() =>
  activeTables.value.map((t) => ({
    label: `${t.physicalNm} · ${t.logicalNm}`,
    value: t.id,
  })),
)

const pickColumnOptions = computed(() => {
  const t = activeTables.value.find((row) => row.id === pickTableId.value)
  if (!t) return []
  return t.columns.map((c) => ({ label: c.colName, value: c.id }))
})

const activeMapping = computed(() => {
  const id = selectedMappingId.value
  if (!id) return null
  return codeMappings.value.find((m) => m.id === id) ?? null
})

/** 컬럼 메타 탭 「테이블 정보 · physicalNm」과 동일 톤 — 앞에 중점 */
const activeMappingChipLabel = computed(() => {
  const m = activeMapping.value
  if (!m) return ''
  const { table, col } = resolveTableCol(m.tableId, m.columnId)
  if (!table || !col) return ''
  return ` · ${table.physicalNm}.${col.colName}`
})

const resolveTableCol = (tableId: string, columnId: string) => {
  const t = props.tables.find((row) => row.id === tableId)
  const c = t?.columns.find((col) => col.id === columnId)
  return { table: t, col: c }
}

const mappingMasterRows = computed((): MappingMasterRow[] =>
  codeMappings.value.map((m) => {
    const { table, col } = resolveTableCol(m.tableId, m.columnId)
    return {
      mappingId: m.id,
      tableNm: table?.physicalNm ?? m.tableId,
      colName: col?.colName ?? m.columnId,
      descKo: col?.descKo?.trim() ? col.descKo : '—',
      entryCnt: String(m.entries.length),
    }
  }),
)

const onMappingMasterRowClick = (row: Record<string, unknown>) => {
  const id = row.mappingId as string
  if (id) selectedMappingId.value = id
}

const joinTyLabel = (ty: DatamartMetaJoinTy) => {
  const m: Record<DatamartMetaJoinTy, string> = {
    INNER: 'INNER JOIN',
    LEFT: 'LEFT JOIN',
    RIGHT: 'RIGHT JOIN',
    FULL: 'FULL JOIN',
  }
  return m[ty] ?? ty
}

const formatTableCol = (tableId: string, colName: string) => {
  const phys = props.tables.find((t) => t.id === tableId)?.physicalNm ?? tableId
  return `${phys}.${colName}`
}

const formatMappingValues = (m: DatamartMetaCodeColumnMapping) => {
  if (m.entries.length === 0) return '(없음)'
  return m.entries
    .map((e) => {
      const q = e.codeValue.includes("'") ? e.codeValue.replace(/'/g, "''") : e.codeValue
      return `'${q}'=${e.labelKo || '(미입력)'}`
    })
    .join(', ')
}

/** AI에 전달할 컨텍스트 문자열 예시 (선택 매핑 + JOIN 목록) */
const previewAiContext = computed(() => {
  const lines: string[] = []
  const dmNm = props.datamart?.dmNm?.trim()
  if (dmNm) {
    lines.push(`데이터마트: ${dmNm}`)
  }

  const cur = activeMapping.value
  if (cur) {
    const { table, col } = resolveTableCol(cur.tableId, cur.columnId)
    if (table && col) {
      const tableKo = table.logicalNm?.trim() || table.tableDescKo?.trim() || '—'
      lines.push(`테이블: ${table.physicalNm} (${tableKo})`)
      lines.push(`컬럼: ${col.colName} ${col.dataType} — ${col.descKo?.trim() || '—'}`)
      lines.push(`  값: ${formatMappingValues(cur)}`)
    } else {
      lines.push('테이블: —')
      lines.push('컬럼: —')
      lines.push(`  값: ${formatMappingValues(cur)}`)
    }
  } else {
    lines.push('(목록에서 코드 매핑 행을 선택하면 테이블·컬럼·코드값이 표시됩니다.)')
  }

  if (props.relationships.length === 0) {
    lines.push('JOIN: (관계 정의 탭에 정의된 JOIN 없음)')
  } else {
    for (const r of props.relationships) {
      const src = formatTableCol(r.srcTableId, r.srcColName)
      const tgt = formatTableCol(r.tgtTableId, r.tgtColName)
      lines.push(`JOIN: ${src} → ${tgt} (${r.cardinality}, ${joinTyLabel(r.joinTy)})`)
    }
  }

  return lines.join('\n')
})

const onAddCodeColumn = () => {
  if (!pickTableId.value || !pickColId.value) return
  const table = activeTables.value.find((t) => t.id === pickTableId.value)
  const col = table?.columns.find((c) => c.id === pickColId.value)
  if (!table || !col) return

  const dup = codeMappings.value.some((m) => m.tableId === table.id && m.columnId === col.id)
  if (dup) {
    openToast({ message: '이미 추가된 컬럼입니다.', type: 'warning' })
    return
  }

  const newId = `code_map_${Date.now()}`
  const entryId = `code_entry_${Date.now()}`
  codeMappings.value = [
    ...codeMappings.value,
    {
      id: newId,
      tableId: table.id,
      columnId: col.id,
      entries: [{ id: entryId, codeValue: '', labelKo: '' }],
    },
  ]
  selectedMappingId.value = newId
  pickColId.value = ''
}

const onRemoveMapping = (id: string) => {
  codeMappings.value = codeMappings.value.filter((m) => m.id !== id)
  if (selectedMappingId.value === id) selectedMappingId.value = ''
}

const onAddEntry = () => {
  const m = activeMapping.value
  if (!m) return
  const row: DatamartMetaCodeValueRow = {
    id: `code_entry_${Date.now()}`,
    codeValue: '',
    labelKo: '',
  }
  m.entries = [...m.entries, row]
}

const onRemoveEntry = (mappingId: string, entryId: string) => {
  const m = codeMappings.value.find((x) => x.id === mappingId)
  if (!m) return
  m.entries = m.entries.filter((e) => e.id !== entryId)
}
</script>

<style lang="scss" scoped>
.datamart-meta-code-mapping {
  /* 목록·코드값 패널 — 모달 안 세로 여유 확보 */
  --datamart-meta-code-panel-h: min(120px, 16vh);
  --datamart-meta-ai-context-h: min(120px, 16.5vh);

  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.com-setting-section) {
    padding: 6px 8px;
    gap: 6px;
  }

  :deep(.com-setting-section-header) {
    padding: 2px 0 4px;
  }

  :deep(.com-setting-section-body) {
    gap: 6px;
  }
}

.datamart-meta-code-mapping-header {
  margin-bottom: $spacing-xs;
}

.datamart-meta-code-mapping-title {
  margin: 0 0 2px;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.datamart-meta-code-mapping-desc {
  margin: 0;
  font-size: $font-size-sm;
  line-height: 1.4;
  color: $color-text-secondary;
}

.datamart-meta-code-mapping-desc-dm {
  font-weight: $font-weight-medium;
  color: $color-text-muted;
}

/* DatamartMetaColumnMetadataTab.vue `.datamart-meta-column-metadata-table-chip` 와 동일 */
.datamart-meta-column-metadata-table-chip {
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
}

.datamart-meta-code-section-hint {
  margin: 0 0 2px;
  font-size: 11px;
  line-height: 1.35;
  color: #6f7a93;
}

.datamart-meta-code-combined {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.datamart-meta-code-add-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-sizing: border-box;

  .datamart-meta-code-section-hint {
    margin: 0;
  }

  /* 관계 정의 탭 datamart-meta-rel-form-panel 과 동일 — placeholder↔선택값 바뀔 때 행·트리거 높이 고정 */
  :deep(.datamart-meta-code-add-field) {
    align-items: center;
    box-sizing: border-box;
    height: 36px;
    min-height: 36px;
    max-height: 36px;
    flex-shrink: 0;
  }

  :deep(.datamart-meta-code-add-field .ui-select-wrap) {
    display: flex;
    align-items: center;
    align-self: center;
    flex: 1;
    min-width: 0;
    height: $height-sm;
    min-height: $height-sm;
    max-height: $height-sm;
  }

  :deep(.datamart-meta-code-add-field .ui-select-trigger.size-sm) {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    height: $height-sm;
    min-height: $height-sm;
    max-height: $height-sm;
    line-height: 1.2;
  }

  :deep(.datamart-meta-code-add-field .ui-select-value) {
    line-height: 1.2;
  }
}

.datamart-meta-code-panel-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;

  &.is-table {
    display: flex;
    flex-direction: column;
    height: var(--datamart-meta-code-panel-h);
    min-height: var(--datamart-meta-code-panel-h);
    max-height: var(--datamart-meta-code-panel-h);
  }

  &.is-editor {
    display: flex;
    flex-direction: column;
    height: var(--datamart-meta-code-panel-h);
    min-height: var(--datamart-meta-code-panel-h);
    max-height: var(--datamart-meta-code-panel-h);
  }

  :deep(.ui-table-wrap) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none !important;
    overflow: auto;
  }

  :deep(.ui-table td) {
    vertical-align: middle;
  }

  /* sm 테이블 바디: 텍스트가 비었다가 채워져도 행 높이 고정 (말줄임) */
  :deep(.ui-table-wrap.is-sm .ui-table tbody td) {
    height: 28px;
    min-height: 28px;
    max-height: 28px;
    box-sizing: border-box;
    line-height: 1.15;
    overflow: hidden;
    vertical-align: middle;
  }

  :deep(.ui-table-wrap.is-sm .ui-table tbody td:not(:last-child)) {
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  :deep(.ui-table-wrap.is-sm .ui-table tbody td:last-child) {
    white-space: nowrap;
  }
}

.datamart-meta-code-master-actions {
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.datamart-meta-code-master-trash-btn.ui-button.is-icon-only.size-btn-xxs) {
    width: 22px;
    height: 22px;
    min-width: 22px;
    border-radius: $border-radius-sm;
  }
}

.datamart-meta-code-add-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding-top: 0;
}

.datamart-meta-code-add-selects {
  display: flex;
  flex-wrap: wrap;
  flex: 1 1 240px;
  gap: 8px 6px;
  min-width: 0;
}

.datamart-meta-code-add-field {
  flex: 1 1 160px;
  min-width: 0;
  margin: 0;
}

:deep(.datamart-meta-code-editor-empty) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: $spacing-sm;
}

.datamart-meta-code-editor-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.datamart-meta-code-entry-topbar {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 4px 8px 2px;
  box-sizing: border-box;
}

.datamart-meta-code-entry-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 6px 8px;
  box-sizing: border-box;
  overflow-y: auto;
  @include custom-scrollbar;
}

.datamart-meta-code-entry-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.datamart-meta-code-entry-code {
  flex: 0 1 120px;
  min-width: 72px;
}

.datamart-meta-code-entry-eq {
  flex-shrink: 0;
  font-weight: $font-weight-bold;
  color: $color-text-disabled;
}

.datamart-meta-code-entry-label {
  flex: 1 1 160px;
  min-width: 100px;
}

.datamart-meta-code-ai-context-hint {
  margin: 0 0 4px;
  font-size: 11px;
  line-height: 1.35;
  color: #6f7a93;
}

.datamart-meta-code-ai-context-block-wrap {
  display: flex;
  flex-direction: column;
  height: var(--datamart-meta-ai-context-h);
  min-height: var(--datamart-meta-ai-context-h);
  max-height: var(--datamart-meta-ai-context-h);
  overflow: hidden;
  border-radius: $border-radius-lg;

  :deep(.ui-code-block) {
    flex: 1 1 auto;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 12px 9px;
    gap: 8px;
  }

  :deep(.ui-code-block-pre) {
    max-height: 100%;
  }
}
</style>

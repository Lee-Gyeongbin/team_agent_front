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
        style="--label-width: 140px"
      >
        <div class="com-setting-section-header datamart-meta-code-section-header-static">
          <span class="com-setting-section-title">
            매핑 목록 · 코드값
            <template v-if="activeMappingChipLabel">
              <span class="datamart-meta-column-metadata-table-chip">{{ activeMappingChipLabel }}</span>
            </template>
          </span>
        </div>
        <div class="com-setting-section-body">
          <div class="datamart-meta-code-combined">
            <div class="datamart-meta-code-add-block">
              <p class="datamart-meta-code-section-hint">
                테이블·컬럼·코드그룹 선택 후 「컬럼 추가」로 목록에 행을 넣고, 행을 클릭해 코드값·매핑 AI 힌트를
                편집합니다.<br />
                코드그룹 생성·그룹 정보 수정은 '공통코드' 메뉴에서 진행할 수 있습니다.
              </p>
              <div class="datamart-meta-code-add-toolbar">
                <div class="datamart-meta-code-add-selects">
                  <div class="com-setting-field-row datamart-meta-code-add-field">
                    <label class="com-setting-label">테이블</label>
                    <UiSelect
                      v-model="pickTblId"
                      :options="tableOptions"
                      size="sm"
                      placeholder="테이블 선택"
                      @update:model-value="onPickTableChange"
                    />
                  </div>
                  <div class="com-setting-field-row datamart-meta-code-add-field">
                    <label class="com-setting-label">컬럼명</label>
                    <UiSelect
                      v-model="pickColId"
                      :options="pickColumnOptions"
                      size="sm"
                      placeholder="컬럼 선택"
                      :disabled="!pickTblId"
                      @update:model-value="onPickColumnChange"
                    />
                  </div>
                  <div class="com-setting-field-row datamart-meta-code-add-field">
                    <label class="com-setting-label">코드그룹</label>
                    <UiSelect
                      v-model="pickCodeGrpId"
                      :options="pickCodeGroupOptions"
                      size="sm"
                      placeholder="코드그룹 선택"
                      :disabled="!pickColId"
                      @update:model-value="onPickCodeGroupChange"
                    />
                  </div>
                </div>
                <UiButton
                  variant="primary"
                  size="sm"
                  type="button"
                  title="컬럼 추가"
                  aria-label="컬럼 추가"
                  :disabled="!pickTblId || !pickColId || !pickCodeGrpId"
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
                empty-text="등록된 코드 매핑이 없습니다."
                @row-click="onMappingMasterRowClick"
              >
                <template #cell-aiHint="{ row }">
                  <div class="picker-wrap datamart-meta-code-aihint-picker">
                    <button
                      type="button"
                      class="picker-btn"
                      :class="{
                        'is-placeholder': !aiHintHasValue(resolveMappingFromMasterRow(row as MappingMasterRow)),
                        'is-filled': aiHintHasValue(resolveMappingFromMasterRow(row as MappingMasterRow)),
                      }"
                      title="AI 힌트 편집"
                      aria-label="AI 힌트 편집"
                      @click.stop="onOpenAiHintFromMasterRow(row as MappingMasterRow)"
                    >
                      <i class="icon-edit-version size-16" />
                    </button>
                  </div>
                </template>
                <template #cell-_actions="{ row }">
                  <div class="datamart-meta-code-master-actions-cell">
                    <UiButton
                      variant="line-secondary"
                      size="sm"
                      icon-only
                      type="button"
                      title="이 매핑 삭제"
                      aria-label="이 매핑 삭제"
                      @click.stop="onRemoveMapping((row as MappingMasterRow).mappingId)"
                    >
                      <template #icon-left>
                        <i class="icon-trashcan size-16" />
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
                    <span class="datamart-meta-code-grp-label">
                      {{ activeCodeGrpLabel }}
                    </span>
                    <div class="datamart-meta-code-entry-topbar-actions">
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
                  </div>
                  <draggable
                    v-if="activeEntries.length > 0"
                    v-model="activeEntries"
                    item-key="sortOrd"
                    handle=".datamart-meta-code-entry-drag-handle"
                    animation="200"
                    class="datamart-meta-code-entry-list"
                  >
                    <template #item="{ element: entry }">
                      <div class="datamart-meta-code-entry-row">
                        <span
                          class="datamart-meta-code-entry-drag-handle"
                          aria-label="순서 변경"
                          title="드래그하여 순서 변경"
                        >
                          <i class="icon-move-handle size-16" />
                        </span>
                        <span class="datamart-meta-code-entry-mapping">
                          <span class="datamart-meta-code-entry-side is-code">
                            <span class="datamart-meta-code-entry-text-label">코드</span>
                            <UiInput
                              v-model="entry.codeId"
                              size="sm"
                              class="datamart-meta-code-entry-code"
                              placeholder="코드값"
                            />
                          </span>
                          <span
                            class="datamart-meta-code-entry-arrow"
                            aria-hidden="true"
                            >→</span
                          >
                          <span class="datamart-meta-code-entry-side is-label">
                            <span class="datamart-meta-code-entry-text-label">코드값(설명)</span>
                            <UiInput
                              v-model="entry.codeNm"
                              size="sm"
                              class="datamart-meta-code-entry-label"
                              placeholder="설명"
                            />
                          </span>
                        </span>
                        <div class="datamart-meta-code-entry-actions">
                          <UiButton
                            variant="line-secondary"
                            size="sm"
                            icon-only
                            type="button"
                            class="datamart-meta-code-entry-remove"
                            title="이 코드 행 삭제"
                            aria-label="이 코드 행 삭제"
                            @click="onRemoveEntry(entry.sortOrd)"
                          >
                            <template #icon-left>
                              <i class="icon-trashcan size-16" />
                            </template>
                          </UiButton>
                        </div>
                      </div>
                    </template>
                  </draggable>
                  <UiEmpty
                    v-else
                    icon="icon-database"
                    title="코드값이 없습니다."
                    description="「코드값 추가」로 등록하거나 연동된 코드그룹에 코드를 추가하세요."
                    class="datamart-meta-code-entry-empty"
                  />
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

    <UiDialogModal
      :is-open="aiHintModalOpen"
      title="코드값 매핑 AI 힌트"
      max-width="min(480px, 92vw)"
      custom-class="datamart-meta-aihint-dialog"
      confirm-text="적용"
      cancel-text="취소"
      @close="onAiHintModalClose"
      @confirm="onAiHintModalConfirm"
    >
      <div class="datamart-meta-aihint-modal">
        <div
          v-if="aiHintModalContext"
          class="datamart-meta-aihint-modal-context"
        >
          <div class="datamart-meta-aihint-modal-context-row">
            <span class="datamart-meta-aihint-modal-context-key">매핑 대상</span>
            <span class="datamart-meta-aihint-modal-context-val">
              {{ aiHintModalContext.tableCol }}
              <span
                v-if="aiHintModalContext.tableColSub"
                class="datamart-meta-aihint-modal-context-sub"
              >
                ({{ aiHintModalContext.tableColSub }})
              </span>
            </span>
          </div>
          <div class="datamart-meta-aihint-modal-context-row">
            <span class="datamart-meta-aihint-modal-context-key">연결 코드그룹</span>
            <span class="datamart-meta-aihint-modal-context-val">{{ aiHintModalContext.codeGrp }}</span>
          </div>
        </div>
        <UiTextarea
          v-model="aiHintDraft"
          class="datamart-meta-aihint-modal-textarea"
          placeholder="이 테이블·컬럼이 해당 코드를 참조할 때 AI가 참고할 설명을 입력하세요."
          :rows="8"
          :auto-resize="false"
          border
          size="md"
        />
      </div>
    </UiDialogModal>
  </div>
</template>

<script setup lang="ts">
import type { Datamart } from '~/types/datamart'
import type {
  DatamartMetaCodeValueRow,
  DatamartMetaCodeWithEntries,
  DatamartMetaJoinTy,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'
import type { CodeGroupItem } from '~/types/codes'
import { buildCodeMappingEntriesFromGroup } from '~/composables/datamart/useDatamartStore'
import { datamartMetaCodeMappingMasterColumns } from '~/types/datamartMeta'
import draggable from 'vuedraggable'

const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
  relationships: DatamartMetaRelationship[]
  codeGroupList: CodeGroupItem[]
}>()

const codeMappings = defineModel<DatamartMetaCodeWithEntries[]>('codeMappings', { default: () => [] })

/** 마스터 테이블 행 타입 (템플릿 캐스트용) */
interface MappingMasterRow {
  mappingId: string
  tableNm: string
  colPhyNm: string
  colDesc: string
  entryCnt: string
}

const selectedMappingId = ref('')
/** 추가 툴바 — DatamartMetaCode.tblId / colId / codeGrpId 와 동일 키 */
const pickTblId = ref('')
const pickColId = ref('')
const pickCodeGrpId = ref('')

const buildMappingId = (tblId: string, colId: string) => `${tblId}::${colId}`

const findMappingById = (id: string) => codeMappings.value.find((m) => buildMappingId(m.tblId, m.colId) === id)

const sectionCollapsed = reactive({
  aiContextPreview: false,
})

const activeTables = computed(() => props.tables.filter((t) => t.useYn === 'Y'))

const tableOptions = computed(() => [
  { label: '선택', value: '' },
  ...activeTables.value.map((t) => ({
    label: `${t.physicalNm} · ${t.logicalNm}`,
    value: t.id,
  })),
])

const pickColumnOptions = computed(() => {
  const table = activeTables.value.find((row) => row.id === pickTblId.value)
  if (!table) return [{ label: '선택', value: '' }]
  return [
    { label: '선택', value: '' },
    ...table.columns.map((c) => ({
      label: c.colPhyNm || c.colKorNm || c.colId,
      value: c.colId,
    })),
  ]
})

const pickCodeGroupOptions = computed(() => [
  { label: '선택', value: '' },
  ...props.codeGroupList.map((g) => ({
    label: g.codeGrpNm || g.codeGrpId,
    value: g.codeGrpId,
  })),
])

const onPickTableChange = () => {
  pickColId.value = ''
  pickCodeGrpId.value = ''
}

const onPickColumnChange = () => {
  pickCodeGrpId.value = ''
}

/** 추가 툴바 선택이 현재 편집 중인 매핑과 동일할 때만 코드그룹 변경 반영 */
const isPickTargetingSelectedMapping = () => {
  const mapping = activeMapping.value
  if (!mapping || !pickTblId.value || !pickColId.value) return false
  return mapping.tblId === pickTblId.value && mapping.colId === pickColId.value
}

const isVisibleCodeEntry = (entry: DatamartMetaCodeValueRow) => entry.useYn !== 'N'
const isVisibleCodeMapping = (mapping: DatamartMetaCodeWithEntries) => mapping.useYn !== 'N'

/** 신규 매핑을 목록 맨 아래에 붙이기 위한 sortOrd */
const getNextBottomSortOrd = () => {
  const orders = codeMappings.value.filter(isVisibleCodeMapping).map((item) => Number(item.sortOrd) || 0)
  return orders.length === 0 ? 1 : Math.max(...orders) + 1
}

const createEmptyCodeEntry = (codeGrpId = '', sortOrd = 0): DatamartMetaCodeValueRow => ({
  codeGrpId,
  codeId: '',
  codeNm: '',
  description: '',
  sortOrd,
  useYn: 'Y',
})

const resolveCodeGrpNm = (codeGrpId: string) =>
  props.codeGroupList.find((group) => group.codeGrpId === codeGrpId)?.codeGrpNm?.trim() ?? ''

const formatCodeGrpLabel = (codeGrpId: string, codeGrpNm?: string) => {
  const grpNm = codeGrpNm?.trim() || resolveCodeGrpNm(codeGrpId)
  const grpId = codeGrpId?.trim()
  if (grpNm && grpId) return `${grpNm} (${grpId})`
  return grpId || grpNm || '—'
}

const syncEntriesAcrossSameCodeGroup = (codeGrpId: string, entries: DatamartMetaCodeValueRow[]) => {
  const grpId = codeGrpId?.trim()
  if (!grpId) return
  const snapshot = entries.map((entry) => ({ ...entry }))
  for (const mapping of codeMappings.value) {
    if (mapping.useYn !== 'N' && mapping.codeGrpId?.trim() === grpId) {
      mapping.entries = snapshot.map((entry) => ({ ...entry }))
    }
  }
}

const applyLinkedCodeGroupEntries = async (mapping: DatamartMetaCodeWithEntries) => {
  const codeGrpId = mapping.codeGrpId?.trim()
  if (!codeGrpId) {
    mapping.entries = []
    return
  }

  mapping.codeGrpNm = mapping.codeGrpNm?.trim() || resolveCodeGrpNm(codeGrpId)

  try {
    const entries = await buildCodeMappingEntriesFromGroup(codeGrpId)
    syncEntriesAcrossSameCodeGroup(codeGrpId, entries)
  } catch {
    syncEntriesAcrossSameCodeGroup(codeGrpId, [])
    openToast({ message: '코드그룹 코드를 불러오지 못했습니다.', type: 'error' })
  }
}

const activeMapping = computed(() => {
  const id = selectedMappingId.value
  if (!id) return null
  const mapping = findMappingById(id) ?? null
  if (!mapping || !isVisibleCodeMapping(mapping)) return null
  return mapping
})

const activeEntries = computed<DatamartMetaCodeValueRow[]>({
  get: () => {
    const mapping = activeMapping.value
    if (!mapping) return []
    return mapping.entries.filter(isVisibleCodeEntry).sort((a, b) => a.sortOrd - b.sortOrd)
  },
  set: (visibleEntries) => {
    const mapping = activeMapping.value
    if (!mapping) return
    const inactiveEntries = mapping.entries.filter((entry) => entry.useYn === 'N')
    mapping.entries = [
      ...visibleEntries.map((entry, index) => ({
        ...entry,
        codeGrpId: entry.codeGrpId?.trim() || mapping.codeGrpId,
        sortOrd: index + 1,
        useYn: 'Y' as const,
      })),
      ...inactiveEntries,
    ]
    syncEntriesAcrossSameCodeGroup(mapping.codeGrpId, mapping.entries)
  },
})

const activeCodeGrpLabel = computed(() => {
  const mapping = activeMapping.value
  if (!mapping) return ''
  return formatCodeGrpLabel(mapping.codeGrpId, mapping.codeGrpNm)
})

/** 컬럼 메타 탭 「테이블 정보 · physicalNm」과 동일 톤 — 앞에 중점 */
const activeMappingChipLabel = computed(() => {
  const m = activeMapping.value
  if (!m) return ''
  const { table, col } = resolveTableCol(m.tblId, m.colId)
  if (!table || !col) return ''
  return ` · ${table.physicalNm}.${col.colPhyNm}`
})

const resolveTableCol = (tableId: string, columnId: string) => {
  const t = props.tables.find((row) => row.id === tableId)
  const c = t?.columns.find((col) => col.colId === columnId)
  return { table: t, col: c }
}

const mappingMasterRows = computed((): MappingMasterRow[] =>
  codeMappings.value.filter(isVisibleCodeMapping).map((m) => {
    const { table, col } = resolveTableCol(m.tblId, m.colId)
    return {
      mappingId: buildMappingId(m.tblId, m.colId),
      tableNm: table?.physicalNm ?? m.tblId,
      colPhyNm: col?.colPhyNm ?? m.colId,
      colDesc: col?.colDesc?.trim() ? col.colDesc : '—',
      entryCnt: String(m.entries.filter(isVisibleCodeEntry).length),
    }
  }),
)

const onMappingMasterRowClick = async (row: Record<string, unknown>) => {
  const id = row.mappingId as string
  if (!id) return
  selectedMappingId.value = id
  const current = findMappingById(id)
  if (!current) return

  // 추가 툴바와 선택 행 동기화 — 동일 행일 때만 코드그룹 변경이 편집에 반영됨
  pickTblId.value = current.tblId
  pickColId.value = current.colId
  pickCodeGrpId.value = current.codeGrpId ?? ''

  if (!current.codeGrpId?.trim() || current.entries.some(isVisibleCodeEntry)) return
  await applyLinkedCodeGroupEntries(current)
}

const joinTypeLabel = (ty: DatamartMetaJoinTy) => {
  const m: Record<DatamartMetaJoinTy, string> = {
    INNER: 'INNER JOIN',
    LEFT: 'LEFT JOIN',
    RIGHT: 'RIGHT JOIN',
    FULL: 'FULL JOIN',
  }
  return m[ty] ?? ty
}

const formatTableCol = (tableId: string, colId: string) => {
  const t = props.tables.find((row) => row.id === tableId)
  const phys = t?.physicalNm ?? tableId
  const col = t?.columns.find((c) => c.colId === colId)
  const colNm = col?.colPhyNm || colId
  return `${phys}.${colNm}`
}

const formatMappingValues = (m: DatamartMetaCodeWithEntries) => {
  const visibleEntries = m.entries.filter(isVisibleCodeEntry)
  if (visibleEntries.length === 0) return '(없음)'
  return visibleEntries
    .map((e) => {
      const q = e.codeId.includes("'") ? e.codeId.replace(/'/g, "''") : e.codeId
      return `'${q}'=${e.codeNm || '(미입력)'}`
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
    const { table, col } = resolveTableCol(cur.tblId, cur.colId)
    if (table && col) {
      const tableKo = table.logicalNm?.trim() || table.tableDescKo?.trim() || '—'
      lines.push(`테이블: ${table.physicalNm} (${tableKo})`)
      lines.push(`컬럼: ${col.colPhyNm} ${col.colDesc?.trim() ? `— ${col.colDesc}` : ''}`)
      lines.push(`타입: ${col.dataType} `)
      if (cur.aiHint?.trim()) {
        lines.push(`매핑 AI 힌트: ${cur.aiHint.trim()}`)
      }
      const grpNm = cur.codeGrpNm?.trim() || resolveCodeGrpNm(cur.codeGrpId)
      if (cur.codeGrpId?.trim()) {
        lines.push(`코드그룹: ${grpNm || '—'} (${cur.codeGrpId})`)
      }
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
      const src = formatTableCol(r.fromTblId, r.fromColId)
      const tgt = formatTableCol(r.toTblId, r.toColId)
      lines.push(`JOIN: ${src} → ${tgt} (${r.cardinality}, ${joinTypeLabel(r.joinType)})`)
    }
  }

  return lines.join('\n')
})

const onAddCodeColumn = async () => {
  if (!pickTblId.value || !pickColId.value || !pickCodeGrpId.value) return
  const table = activeTables.value.find((t) => t.id === pickTblId.value)
  const col = table?.columns.find((c) => c.colId === pickColId.value)
  if (!table || !col) return

  const tblId = table.id
  const colId = col.colId
  const codeGrpId = pickCodeGrpId.value
  const existing = codeMappings.value.find((m) => m.tblId === tblId && m.colId === colId)

  const codeGrpNm = resolveCodeGrpNm(codeGrpId)
  let target: DatamartMetaCodeWithEntries
  if (existing) {
    existing.useYn = 'Y'
    existing.codeGrpId = codeGrpId
    existing.codeGrpNm = codeGrpNm
    target = existing
  } else {
    target = {
      tblId,
      colId,
      codeGrpId,
      codeGrpNm,
      aiHint: '',
      sortOrd: getNextBottomSortOrd(),
      entries: [],
      useYn: 'Y',
    }
    codeMappings.value = [...codeMappings.value, target]
  }

  await applyLinkedCodeGroupEntries(target)
  selectedMappingId.value = buildMappingId(tblId, colId)
  pickTblId.value = ''
  pickColId.value = ''
  pickCodeGrpId.value = ''
}

const onPickCodeGroupChange = async () => {
  if (!isPickTargetingSelectedMapping() || !pickCodeGrpId.value) return

  const current = activeMapping.value
  if (!current) return

  current.codeGrpId = pickCodeGrpId.value
  current.codeGrpNm = resolveCodeGrpNm(pickCodeGrpId.value)
  await applyLinkedCodeGroupEntries(current)
}

const onRemoveMapping = (mappingId: string) => {
  const mapping = findMappingById(mappingId)
  if (!mapping) return
  mapping.useYn = 'N'
  if (selectedMappingId.value === mappingId) selectedMappingId.value = ''
}

const resolveMappingFromMasterRow = (row: MappingMasterRow) => findMappingById(row.mappingId) ?? null

const aiHintHasValue = (mapping: DatamartMetaCodeWithEntries | null | undefined) =>
  Boolean(String(mapping?.aiHint ?? '').trim())

const aiHintModalOpen = ref(false)
const aiHintDraft = ref('')
const aiHintEditingMapping = ref<DatamartMetaCodeWithEntries | null>(null)

/** 모달 상단 — 테이블·컬럼 / 코드그룹 매핑 맥락 */
const aiHintModalContext = computed(() => {
  const mapping = aiHintEditingMapping.value
  if (!mapping) return null

  const { table, col } = resolveTableCol(mapping.tblId, mapping.colId)
  const tableNm = table?.physicalNm ?? mapping.tblId
  const colNm = col?.colPhyNm ?? mapping.colId
  const tableColSub = [table?.logicalNm?.trim(), col?.colKorNm?.trim() || col?.colDesc?.trim()]
    .filter(Boolean)
    .join(' · ')

  return {
    tableCol: `${tableNm} · ${colNm}`,
    tableColSub: tableColSub || '',
    codeGrp: formatCodeGrpLabel(mapping.codeGrpId, mapping.codeGrpNm),
  }
})

const openAiHintModal = (mapping: DatamartMetaCodeWithEntries) => {
  aiHintEditingMapping.value = mapping
  aiHintDraft.value = mapping.aiHint ?? ''
  aiHintModalOpen.value = true
}

const onOpenAiHintFromMasterRow = (row: MappingMasterRow) => {
  const mapping = resolveMappingFromMasterRow(row)
  if (!mapping) return
  openAiHintModal(mapping)
}

const onAiHintModalConfirm = () => {
  const mapping = aiHintEditingMapping.value
  if (mapping) mapping.aiHint = aiHintDraft.value.trim()
}

const onAiHintModalClose = () => {
  aiHintModalOpen.value = false
  aiHintEditingMapping.value = null
  aiHintDraft.value = ''
}

const onAddEntry = () => {
  const mapping = activeMapping.value
  if (!mapping) return
  const visibleCnt = mapping.entries.filter(isVisibleCodeEntry).length
  const row = createEmptyCodeEntry(mapping.codeGrpId, visibleCnt + 1)
  mapping.entries = [...mapping.entries, row]
  syncEntriesAcrossSameCodeGroup(mapping.codeGrpId, mapping.entries)
}

const onRemoveEntry = (sortOrd: number) => {
  const mapping = activeMapping.value
  if (!mapping) return
  const entry = mapping.entries.find((item) => item.sortOrd === sortOrd && isVisibleCodeEntry(item))
  if (!entry) return
  entry.useYn = 'N'
  syncEntriesAcrossSameCodeGroup(mapping.codeGrpId, mapping.entries)
}
</script>

<style lang="scss" scoped>
.datamart-meta-code-mapping {
  /* 목록·코드값 패널 — 모달 안 세로 여유 확보 */
  --datamart-meta-code-panel-h: min(120px, 16vh);
  --datamart-meta-code-editor-h: min(180px, 26vh);
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

.datamart-meta-code-mapping-desc {
  margin: $spacing-xs 0 0;
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

/* 매핑 목록·코드값 — 접기 없음: 클릭/포인터 커서 제거 */
.datamart-meta-code-section-header-static {
  cursor: default;
  user-select: text;
  justify-content: flex-start;
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
  --label-width: 56px;

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
    height: var(--datamart-meta-code-editor-h);
    min-height: var(--datamart-meta-code-editor-h);
    max-height: var(--datamart-meta-code-editor-h);
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

  :deep(.datamart-meta-code-master-actions-cell) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* DatamartMetaColumnMetadataTab.vue `.datamart-meta-col-aihint-picker` 와 동일 */
  :deep(.datamart-meta-code-aihint-picker) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 0 2px;
  }

  :deep(.datamart-meta-code-aihint-picker .picker-btn) {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid #dce4e9;
    border-radius: $border-radius-base;
    background: #fff;
    cursor: pointer;
    font: inherit;
    color: inherit;
    appearance: none;
    transition:
      border-color 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease;

    i {
      display: block;
      line-height: 1;
      transition: color 0.2s ease;
    }

    &:hover {
      border-color: #c3ced6;
    }

    &.is-placeholder {
      border-style: dashed;
      border-color: #cbd5e1;
      background: #f8fafc;

      i {
        color: #94a3b8;
      }

      &:hover {
        border-color: #94a3b8;
        background: #f1f5f9;

        i {
          color: #64748b;
        }
      }
    }

    &.is-filled {
      border-style: solid;
      border-color: rgba(var(--color-primary-rgb, 99, 102, 241), 0.55);
      background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.07);
      box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb, 99, 102, 241), 0.12);

      i {
        color: var(--color-primary, #6366f1);
      }

      &:hover {
        border-color: var(--color-primary, #6366f1);
        background: rgba(var(--color-primary-rgb, 99, 102, 241), 0.1);
      }
    }
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px 4px;
  box-sizing: border-box;
}

.datamart-meta-code-grp-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  word-break: break-all;
}

.datamart-meta-code-entry-topbar-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.datamart-meta-code-entry-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 10px;
  box-sizing: border-box;
  overflow-y: auto;
  @include custom-scrollbar;
}

.datamart-meta-code-entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 8px;
  border: 1px solid #e9edf5;
  border-radius: $border-radius-base;
  background: #fff;
}

.datamart-meta-code-entry-drag-handle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  color: #9aa5bc;
  cursor: grab;
  line-height: 0;

  &:active {
    cursor: grabbing;
  }
}

.datamart-meta-code-entry-mapping {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}

.datamart-meta-code-entry-side {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.datamart-meta-code-entry-text-label {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  font-size: 12px;
  font-weight: $font-weight-medium;
  color: #5d6983;
  line-height: 1;
}

.datamart-meta-code-entry-side.is-code {
  flex: 1 1 0;
}

.datamart-meta-code-entry-side.is-label {
  flex: 1 1 auto;
}

.datamart-meta-code-entry-code {
  flex: 1 1 auto;
  min-width: 0;
}

.datamart-meta-code-entry-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
  font-size: 12px;
  color: #8f99ad;
  line-height: 1;
}

.datamart-meta-code-entry-label {
  flex: 1 1 auto;
  min-width: 0;
  max-width: none;
}

:deep(.datamart-meta-code-entry-code .ui-input-wrap),
:deep(.datamart-meta-code-entry-label .ui-input-wrap) {
  border-radius: $border-radius-sm;
}

.datamart-meta-code-entry-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

:deep(.datamart-meta-code-entry-remove.ui-button.is-icon-only.size-sm) {
  width: 24px;
  min-width: 24px;
  height: 24px;
  border-radius: $border-radius-sm;
}

.datamart-meta-code-entry-list :deep(.sortable-ghost) {
  opacity: 0.45;
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

.datamart-meta-aihint-modal {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.datamart-meta-aihint-modal-context {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #f8fafc;
}

.datamart-meta-aihint-modal-context-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.datamart-meta-aihint-modal-context-key {
  flex-shrink: 0;
  width: 76px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-muted;
  line-height: 1.4;
}

.datamart-meta-aihint-modal-context-val {
  flex: 1 1 auto;
  min-width: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
  word-break: break-all;
  line-height: 1.4;
}

.datamart-meta-aihint-modal-context-sub {
  font-size: 11px;
  font-weight: $font-weight-normal;
  color: $color-text-secondary;
}

.datamart-meta-aihint-modal-textarea {
  display: block;
  width: 100%;
  max-width: 100%;
  min-height: 160px;
  resize: vertical;
  box-sizing: border-box;
}
</style>
<!-- Teleport 로 body 아래 렌더 — scoped 조상이 없어 동일 선택자는 비-scoped 로만 적용됨 -->
<style lang="scss">
.modal-dialog.datamart-meta-aihint-dialog {
  .modal-dialog-content {
    width: 100%;
  }

  .modal-dialog-body {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    min-width: 0;
  }
}
</style>

<template>
  <div class="datamart-meta-column-metadata com-setting-form">
    <template v-if="tables.length === 0">
      <UiEmpty
        icon="icon-database"
        title="테이블이 없습니다."
        description="스키마에서 테이블 목록을 불러오면 여기에 표시됩니다."
      />
    </template>

    <template v-else>
      <div class="datamart-meta-column-metadata-header">
        <p class="datamart-meta-column-metadata-desc">
          테이블별 컬럼 설명과 용도 분류를 정리하면 AI가 스키마를 더 정확히 이해합니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-column-metadata-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <div
        class="com-setting-section"
        style="--label-width: 140px"
      >
        <div class="com-setting-section-header">
          <span class="com-setting-section-title">편집할 테이블</span>
        </div>
        <div class="com-setting-section-body">
          <p class="datamart-meta-column-metadata-section-hint">활성화된 테이블만 표시됩니다.</p>
          <UiEmpty
            v-if="activeTables.length === 0"
            icon="icon-database"
            title="활성화된 테이블이 없습니다."
            description="테이블 선택 탭에서 사용할 테이블을 켜면 이 목록에 나타납니다."
          />
          <div
            v-else
            class="datamart-meta-column-metadata-table-list-scroll"
            role="listbox"
            aria-label="활성 테이블 목록"
          >
            <div class="datamart-meta-column-metadata-table-list-inner">
              <button
                v-for="row in activeTables"
                :key="row.id"
                type="button"
                class="datamart-meta-col-table-pick-row"
                :class="{ 'is-selected': row.id === resolvedSelectedId }"
                :aria-selected="row.id === resolvedSelectedId"
                @click="onSelectTable(row.id)"
              >
                <span class="datamart-meta-col-table-pick-name">{{ row.physicalNm }}</span>
                <span
                  v-if="row.logicalNm"
                  class="datamart-meta-col-table-pick-sep"
                  aria-hidden="true"
                  >·</span
                >
                <span class="datamart-meta-col-table-pick-logical">{{ row.logicalNm }}</span>
                <span class="datamart-meta-col-table-pick-meta">
                  <i class="icon-database size-12" />
                  컬럼
                  <strong>{{ row.colCnt }}</strong>
                  개
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <template v-if="selectedTable">
        <div
          class="com-setting-section"
          style="--label-width: 140px"
        >
          <div class="com-setting-section-header">
            <span class="com-setting-section-title">컬럼 목록</span>
          </div>
          <div class="com-setting-section-body">
            <div class="datamart-meta-col-editor-toolbar">
              <p class="datamart-meta-col-footer-hint">
                저장정보가 없는 컬럼 정보는 DB 스키마 원본 정보를 기준으로 조회됩니다.
              </p>
              <UiButton
                class="datamart-meta-col-add-btn"
                variant="primary"
                size="sm"
                type="button"
                title="컬럼 추가"
                aria-label="컬럼 추가"
                @click="onAddColumn"
              >
                <template #icon-left>
                  <i class="icon-plus size-16" />
                </template>
                컬럼 추가
              </UiButton>
            </div>
            <div class="datamart-meta-col-table-wrap">
              <UiTable
                :columns="datamartMetaColumnTableColumns"
                :data="selectedTable.columns"
                size="sm"
                sticky-header
                empty-text="컬럼이 없습니다. 위의 컬럼 추가 버튼으로 추가하거나 DB에서 스키마를 불러오세요."
              >
                <template #cell-colPhyNm="{ row }">
                  <UiInput
                    v-model="(row as DatamartMetaColumnRow).colPhyNm"
                    size="xs"
                    placeholder="물리 컬럼명"
                  />
                </template>
                <template #cell-colKorNm="{ row }">
                  <UiInput
                    v-model="(row as DatamartMetaColumnRow).colKorNm"
                    size="xs"
                    placeholder="한글명"
                  />
                </template>
                <template #cell-dataType="{ row }">
                  <UiSelect
                    v-model="(row as DatamartMetaColumnRow).dataType"
                    :options="dataTypeOptions"
                    size="sm"
                    class="datamart-meta-col-type-select"
                  />
                </template>
                <template #cell-dataLen="{ row }">
                  <UiInput
                    v-model="(row as DatamartMetaColumnRow).dataLen"
                    size="xs"
                    placeholder="길이"
                  />
                </template>
                <template #cell-pkYn="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="ynOn(row as DatamartMetaColumnRow, 'pkYn')"
                      @update:model-value="(v: boolean) => setYn(row as DatamartMetaColumnRow, 'pkYn', v)"
                    />
                  </div>
                </template>
                <template #cell-fkYn="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="ynOn(row as DatamartMetaColumnRow, 'fkYn')"
                      @update:model-value="(v: boolean) => setYn(row as DatamartMetaColumnRow, 'fkYn', v)"
                    />
                  </div>
                </template>
                <template #cell-nullableYn="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="ynOn(row as DatamartMetaColumnRow, 'nullableYn')"
                      @update:model-value="(v: boolean) => setYn(row as DatamartMetaColumnRow, 'nullableYn', v)"
                    />
                  </div>
                </template>
                <template #cell-hasCodeYn="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="ynOn(row as DatamartMetaColumnRow, 'hasCodeYn')"
                      @update:model-value="(v: boolean) => setYn(row as DatamartMetaColumnRow, 'hasCodeYn', v)"
                    />
                  </div>
                </template>
                <template #cell-aiHint="{ row }">
                  <div class="picker-wrap datamart-meta-col-aihint-picker">
                    <button
                      type="button"
                      class="picker-btn"
                      :class="{
                        'is-placeholder': !aiHintHasValue(row as DatamartMetaColumnRow),
                        'is-filled': aiHintHasValue(row as DatamartMetaColumnRow),
                      }"
                      title="AI 힌트 편집"
                      aria-label="AI 힌트 편집"
                      @click="openAiHintModal(row as DatamartMetaColumnRow)"
                    >
                      <i class="icon-edit-version size-16" />
                    </button>
                  </div>
                </template>
                <template #cell-_actions="{ row }">
                  <div class="datamart-meta-col-actions-cell">
                    <UiButton
                      variant="line-secondary"
                      size="sm"
                      icon-only
                      type="button"
                      title="컬럼 삭제"
                      aria-label="컬럼 삭제"
                      @click="onRemoveColumn(row as DatamartMetaColumnRow)"
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
    </template>

    <UiDialogModal
      :is-open="aiHintModalOpen"
      title="AI 힌트 편집"
      max-width="min(480px, 92vw)"
      custom-class="datamart-meta-aihint-dialog"
      confirm-text="적용"
      cancel-text="취소"
      @close="onAiHintModalClose"
      @confirm="onAiHintModalConfirm"
    >
      <div class="datamart-meta-aihint-modal">
        <p
          v-if="aiHintModalContextLabel"
          class="datamart-meta-aihint-modal-context"
        >
          {{ aiHintModalContextLabel }}
        </p>
        <UiTextarea
          v-model="aiHintDraft"
          class="datamart-meta-aihint-modal-textarea"
          placeholder="이 컬럼을 AI가 해석할 때 참고할 설명·예시·주의사항을 입력하세요."
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
import {
  datamartMetaColumnTableColumns,
  type DatamartMetaColumnRow,
  type DatamartMetaTableItem,
} from '~/types/datamartMeta'

const props = withDefaults(
  defineProps<{
    datamart: Datamart | null
    tables: DatamartMetaTableItem[]
  }>(),
  {},
)

const selectedTableId = defineModel<string>('selectedTableId', { default: '' })

const activeTables = computed(() => props.tables.filter((t) => t.useYn === 'Y'))

/** 모델이 비었거나 비활성 테이블을 가리키면 첫 활성 테이블로 표시 */
const resolvedSelectedId = computed(() => {
  const id = selectedTableId.value
  if (id && activeTables.value.some((t) => t.id === id)) return id
  return activeTables.value[0]?.id ?? ''
})

const selectedTable = computed(
  () => props.tables.find((t) => t.id === resolvedSelectedId.value && t.useYn === 'Y') ?? null,
)

const dataTypeOptions = [
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'BIGINT UNSIGNED', value: 'BIGINT UNSIGNED' },
  { label: 'BIT', value: 'BIT' },
  { label: 'CHAR', value: 'CHAR' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'INT', value: 'INT' },
  { label: 'INT UNSIGNED', value: 'INT UNSIGNED' },
  { label: 'JSON', value: 'JSON' },
  { label: 'LONGTEXT', value: 'LONGTEXT' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'VARCHAR', value: 'VARCHAR' },
]

type ColumnYnKey = 'pkYn' | 'fkYn' | 'nullableYn' | 'hasCodeYn'

const ynOn = (col: DatamartMetaColumnRow, key: ColumnYnKey) => col[key] === 'Y'

const setYn = (col: DatamartMetaColumnRow, key: ColumnYnKey, v: boolean) => {
  col[key] = v ? 'Y' : 'N'
}

const aiHintHasValue = (col: DatamartMetaColumnRow) => Boolean(String(col.aiHint ?? '').trim())

const onSelectTable = (id: string) => {
  selectedTableId.value = id
}

const onAddColumn = () => {
  const t = selectedTable.value
  if (!t) return
  t.columns.push({
    colId: `col_${Date.now()}`,
    colPhyNm: '',
    colKorNm: '',
    colDesc: '',
    dataType: 'VARCHAR',
    dataLen: '',
    pkYn: 'N',
    fkYn: 'N',
    nullableYn: 'Y',
    hasCodeYn: 'N',
    aiHint: '',
    sortOrd: t.columns.length + 1,
    useYn: 'Y',
    createDt: '',
    modifyDt: '',
  })
}

const onRemoveColumn = (col: DatamartMetaColumnRow) => {
  const t = selectedTable.value
  if (!t) return
  const idx = t.columns.findIndex((c) => c.colId === col.colId)
  if (idx !== -1) t.columns.splice(idx, 1)
}

const aiHintModalOpen = ref(false)
const aiHintDraft = ref('')
const aiHintEditingCol = ref<DatamartMetaColumnRow | null>(null)

const aiHintModalContextLabel = computed(() => {
  const c = aiHintEditingCol.value
  if (!c) return ''
  const phy = c.colPhyNm?.trim()
  const kor = c.colKorNm?.trim()
  if (phy && kor) return `${phy} · ${kor}`
  if (phy) return phy
  if (kor) return kor
  return '이름 미입력 컬럼'
})

const openAiHintModal = (col: DatamartMetaColumnRow) => {
  aiHintEditingCol.value = col
  aiHintDraft.value = col.aiHint ?? ''
  aiHintModalOpen.value = true
}

const onAiHintModalConfirm = () => {
  const col = aiHintEditingCol.value
  if (col) col.aiHint = aiHintDraft.value
}

const onAiHintModalClose = () => {
  aiHintModalOpen.value = false
  aiHintEditingCol.value = null
  aiHintDraft.value = ''
}
</script>

<style lang="scss" scoped>
.datamart-meta-column-metadata {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.com-setting-section) {
    padding: 8px 10px;
    gap: 8px;
  }

  :deep(.com-setting-section-header) {
    padding: 2px 0 6px;
    cursor: default;
    user-select: text;
  }

  :deep(.com-setting-section-body) {
    gap: 8px;
  }
}

.datamart-meta-column-metadata-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xl 0;
}

.datamart-meta-column-metadata-error-msg {
  margin: 0;
  @include typo($body-large);
  color: $color-text-secondary;
  text-align: center;
}

.datamart-meta-column-metadata-title {
  margin: 0 0 4px;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.datamart-meta-column-metadata-desc {
  margin: $spacing-xs 0 0;
  font-size: $font-size-sm;
  line-height: 1.5;
  color: $color-text-secondary;
}

.datamart-meta-column-metadata-desc-dm {
  font-weight: $font-weight-medium;
  color: $color-text-muted;
}

.datamart-meta-column-metadata-section-hint {
  margin: 0 0 2px;
  font-size: 11px;
  line-height: 1.35;
  color: #6f7a93;
}

/* 편집할 테이블 (스크롤) — 한두 줄 더 보이도록 소폭 확대 */
.datamart-meta-column-metadata-table-list-scroll {
  max-height: min(76px, 12vh);
  overflow-y: auto;
  @include custom-scrollbar;
}

.datamart-meta-column-metadata-table-list-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.datamart-meta-col-table-pick-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 2px 8px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  appearance: none;
  transition: border-color $transition-base;

  &:hover {
    border-color: #aebccb;
  }

  &.is-selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px rgba(var(--color-primary-rgb, 59, 130, 246), 0.12);
  }
}

.datamart-meta-col-table-pick-name {
  flex-shrink: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-dark;
}

.datamart-meta-col-table-pick-sep {
  flex-shrink: 0;
  color: $color-text-disabled;
  font-weight: $font-weight-bold;
}

.datamart-meta-col-table-pick-logical {
  flex: 1;
  min-width: 0;
  @include ellipsis(1);
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.datamart-meta-col-table-pick-meta {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $color-text-disabled;
  white-space: nowrap;

  strong {
    font-weight: $font-weight-semibold;
    color: $color-text-dark;
  }
}

.datamart-meta-col-editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  margin: 0 0 4px;

  .datamart-meta-col-add-btn {
    flex-shrink: 0;
  }
}

/* pages/user-manage 톤 + 행 유무와 관계없이 목록 영역 높이 고정 */
.datamart-meta-col-table-wrap {
  --datamart-meta-col-table-height: min(220px, 32vh);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--datamart-meta-col-table-height);
  min-height: var(--datamart-meta-col-table-height);
  max-height: var(--datamart-meta-col-table-height);
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
  box-sizing: border-box;

  :deep(.ui-table-wrap) {
    flex: 1 1 auto;
    min-height: 0;
    max-height: none !important;
    overflow: auto;
  }

  /* 텍스트 편집 열 좌측 정렬 — 헤더는 컬럼 headerAlign 유지 */
  :deep(.ui-table td:nth-child(1)),
  :deep(.ui-table td:nth-child(2)),
  :deep(.ui-table td:nth-child(3)),
  :deep(.ui-table td:nth-child(10)) {
    text-align: left;
  }

  :deep(.ui-table td) {
    vertical-align: middle;
  }

  :deep(.ui-table tbody td:nth-child(6)),
  :deep(.ui-table tbody td:nth-child(7)),
  :deep(.ui-table tbody td:nth-child(8)),
  :deep(.ui-table tbody td:nth-child(9)),
  :deep(.ui-table tbody td:nth-child(12)) {
    vertical-align: middle;
  }

  :deep(.datamart-meta-col-dt) {
    display: block;
    padding: 0 4px;
    font-size: 11px;
    line-height: 1.35;
    color: $color-text-muted;
    text-align: center;
    word-break: break-all;
  }

  :deep(.datamart-meta-col-actions-cell) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :deep(.datamart-meta-col-toggle-wrap) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 40px;
    height: 100%;
    box-sizing: border-box;
    padding: 0;
  }

  :deep(.ui-input-wrap) {
    width: 100%;
  }

  /* AgentSettingBasic.vue picker-btn / is-placeholder 패턴 */
  :deep(.datamart-meta-col-aihint-picker) {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 0 2px;
  }

  :deep(.datamart-meta-col-aihint-picker .picker-btn) {
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

  :deep(.datamart-meta-col-type-select) {
    width: 100%;
    min-width: 0;
  }

  :deep(.datamart-meta-col-type-select .ui-select-trigger.size-sm) {
    min-height: 30px;
    padding: 0 8px;
    font-size: 12px;
  }
}

.datamart-meta-col-footer-hint {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: #6f7a93;
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
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-secondary;
  word-break: break-all;
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
    justify-content: flex-start;
    width: 100%;
    box-sizing: border-box;
  }
}
</style>

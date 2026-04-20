<template>
  <div class="datamart-meta-relationship com-setting-form">
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
        description="테이블 선택 탭에서 사용할 테이블을 켜면 관계를 정의할 수 있습니다."
      />
    </template>

    <template v-else>
      <div class="datamart-meta-relationship-header">
        <p class="datamart-meta-relationship-desc">
          정의된 관계는 AI가 다중 테이블 쿼리 작성 시 JOIN 조건으로 직접 활용합니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-relationship-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <!-- JOIN 목록: 접기 없음, 높이 고정 -->
      <div
        class="datamart-meta-rel-join-panel"
        style="--label-width: 140px"
      >
        <div class="datamart-meta-rel-join-list-wrap">
          <UiEmpty
            v-if="relationships.length === 0"
            icon="icon-database"
            title="정의된 JOIN 관계가 없습니다."
            description="아래에서 관계를 추가하거나 스키마를 불러오면 표시됩니다."
            class="datamart-meta-rel-join-empty"
          />
          <div
            v-else
            class="datamart-meta-rel-join-list-inner"
            role="list"
            aria-label="JOIN 관계 목록"
          >
            <div
              v-for="(rel, idx) in relationships"
              :key="idx"
              class="datamart-meta-rel-join-row"
              role="listitem"
            >
              <span class="datamart-meta-rel-join-desc-tip">
                <UiTooltip
                  side="top"
                  align="center"
                  :show-arrow="false"
                  content-class="datamart-meta-rel-desc-tooltip"
                >
                  <button
                    type="button"
                    class="datamart-meta-rel-join-info-trigger"
                    :aria-label="rel.relDesc?.trim() ? '관계 설명' : '관계 설명 없음'"
                  >
                    <i class="icon icon-info size-16" />
                  </button>
                  <template #content>
                    <span>{{ rel.relDesc?.trim() || '등록된 관계 설명이 없습니다.' }}</span>
                  </template>
                </UiTooltip>
              </span>
              <span class="datamart-meta-rel-join-mapping">
                <span class="datamart-meta-rel-join-src">
                  <span class="datamart-meta-rel-join-ident">{{ formatTableCol(rel.fromTblId, rel.fromColId) }}</span>
                </span>
                <span
                  class="datamart-meta-rel-join-arrow"
                  aria-hidden="true"
                  >→</span
                >
                <span class="datamart-meta-rel-join-tgt">
                  <span class="datamart-meta-rel-join-ident">{{ formatTableCol(rel.toTblId, rel.toColId) }}</span>
                </span>
              </span>
              <UiBadge
                variant="category"
                size="xs"
                class="datamart-meta-rel-join-badge"
              >
                {{ rel.cardinality }}
              </UiBadge>
              <span class="datamart-meta-rel-join-jointy">{{ joinTypeLabel(rel.joinType) }}</span>
              <div class="datamart-meta-rel-join-actions">
                <UiButton
                  variant="line-secondary"
                  size="sm"
                  icon-only
                  type="button"
                  title="관계 삭제"
                  aria-label="관계 삭제"
                  @click="onRemoveRelationship(idx)"
                >
                  <template #icon-left>
                    <i class="icon-trashcan size-16" />
                  </template>
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 새 관계: 접기 가능 -->
      <div
        class="com-setting-section"
        :class="{ 'is-collapsed': sectionCollapsed.addForm }"
        style="--label-width: 172px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed.addForm = !sectionCollapsed.addForm"
        >
          <span class="com-setting-section-title">새 관계 추가</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
        </div>
        <div class="com-setting-section-body">
          <div class="datamart-meta-rel-editor-toolbar">
            <UiButton
              variant="primary"
              size="sm"
              type="button"
              title="관계 추가"
              aria-label="관계 추가"
              @click="onAddRelationship"
            >
              <template #icon-left>
                <i class="icon-plus size-16" />
              </template>
              관계 추가
            </UiButton>
          </div>

          <div class="datamart-meta-rel-form-panel">
            <div class="com-setting-row datamart-meta-rel-form-row">
              <div class="datamart-meta-rel-form-pair">
                <div class="datamart-meta-rel-form-side">
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">기준 테이블</label>
                    <UiSelect
                      v-model="draft.fromTblId"
                      :options="tableOptions"
                      size="sm"
                      placeholder="테이블 선택"
                      @update:model-value="draft.fromColId = ''"
                    />
                  </div>
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">대상 테이블</label>
                    <UiSelect
                      v-model="draft.toTblId"
                      :options="tableOptions"
                      size="sm"
                      placeholder="테이블 선택"
                      @update:model-value="draft.toColId = ''"
                    />
                  </div>
                </div>
                <div class="datamart-meta-rel-form-side">
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">기준 컬럼</label>
                    <UiSelect
                      v-model="draft.fromColId"
                      :options="srcColumnOptions"
                      size="sm"
                      placeholder="컬럼 선택"
                      :disabled="!draft.fromTblId"
                    />
                  </div>
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">대상 컬럼</label>
                    <UiSelect
                      v-model="draft.toColId"
                      :options="tgtColumnOptions"
                      size="sm"
                      placeholder="컬럼 선택"
                      :disabled="!draft.toTblId"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="com-setting-row datamart-meta-rel-form-row">
              <div class="datamart-meta-rel-form-pair">
                <div class="datamart-meta-rel-form-side">
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">관계 유형</label>
                    <UiSelect
                      v-model="draft.cardinality"
                      :options="cardinalityOptions"
                      size="sm"
                    />
                  </div>
                </div>
                <div class="datamart-meta-rel-form-side">
                  <div class="com-setting-field-row">
                    <label class="com-setting-label">JOIN 유형</label>
                    <UiSelect
                      v-model="draft.joinType"
                      :options="joinTypeOptions"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="com-setting-row datamart-meta-rel-form-row datamart-meta-rel-form-row-desc">
              <div class="com-setting-field-row is-top">
                <label class="com-setting-label">관계 설명 (선택)</label>
                <UiTextarea
                  v-model="draft.relDesc"
                  size="sm"
                  :rows="2"
                  :auto-resize="true"
                  :max-rows="5"
                  border
                  placeholder="예: 합산방법 코드와 연결된 공통코드"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Datamart } from '~/types/datamart'
import type {
  DatamartMetaCardinality,
  DatamartMetaJoinTy,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'

const props = defineProps<{
  datamart: Datamart | null
  tables: DatamartMetaTableItem[]
}>()

const relationships = defineModel<DatamartMetaRelationship[]>('relationships', { default: () => [] })

/** 컬럼 탭과 동일 — false면 펼침 */
const sectionCollapsed = reactive({
  addForm: false,
})

const activeTables = computed(() => props.tables.filter((t) => t.useYn === 'Y'))

const tableOptions = computed(() => [
  { label: '선택', value: '' },
  ...activeTables.value.map((t) => ({
    label: `${t.physicalNm} · ${t.logicalNm}`,
    value: t.id,
  })),
])

const columnOptionsForTableId = (tableId: string) => {
  const t = activeTables.value.find((row) => row.id === tableId)
  if (!t) return []
  return [
    { label: '선택', value: '' },
    ...t.columns.map((c) => ({ label: c.colPhyNm || c.colKorNm || c.colId, value: c.colId })),
  ]
}

const srcColumnOptions = computed(() => columnOptionsForTableId(draft.fromTblId))

const tgtColumnOptions = computed(() => columnOptionsForTableId(draft.toTblId))

const cardinalityOptions: { label: string; value: DatamartMetaCardinality }[] = [
  { label: '1 : 1', value: '1:1' },
  { label: '1 : N', value: '1:N' },
  { label: 'N : 1', value: 'N:1' },
]

const joinTypeOptions: { label: string; value: DatamartMetaJoinTy }[] = [
  { label: 'INNER JOIN', value: 'INNER' },
  { label: 'LEFT JOIN', value: 'LEFT' },
  { label: 'RIGHT JOIN', value: 'RIGHT' },
  { label: 'FULL JOIN', value: 'FULL' },
]

const draft = reactive({
  fromTblId: '',
  fromColId: '',
  toTblId: '',
  toColId: '',
  cardinality: 'N:1' as DatamartMetaCardinality,
  joinType: 'INNER' as DatamartMetaJoinTy,
  relDesc: '',
})

const joinTypeLabel = (ty: DatamartMetaJoinTy) => {
  const m: Record<DatamartMetaJoinTy, string> = {
    INNER: 'INNER JOIN',
    LEFT: 'LEFT JOIN',
    RIGHT: 'RIGHT JOIN',
    FULL: 'FULL JOIN',
  }
  return m[ty] ?? ty
}

/** 테이블 ID + 컬럼 ID → physicalNm.colPhyNm (컬럼 미매칭 시 colId 그대로) */
const formatTableCol = (tableId: string, colId: string) => {
  const t = props.tables.find((row) => row.id === tableId)
  const phys = t?.physicalNm ?? tableId
  const col = t?.columns.find((c) => c.colId === colId)
  const colNm = col?.colPhyNm || colId
  return `${phys}.${colNm}`
}

const onAddRelationship = () => {
  if (!draft.fromTblId || !draft.fromColId || !draft.toTblId || !draft.toColId) {
    openToast({
      message: '기준 테이블 및 컬럼, 대상 테이블 및 컬럼을 선택해주세요.',
      type: 'warning',
    })
    return
  }

  const fromTable = props.tables.find((t) => t.id === draft.fromTblId && t.useYn === 'Y')
  const toTable = props.tables.find((t) => t.id === draft.toTblId && t.useYn === 'Y')
  const fromCol = fromTable?.columns.find((c) => c.colId === draft.fromColId)
  const toCol = toTable?.columns.find((c) => c.colId === draft.toColId)
  if (!fromTable || !toTable || !fromCol || !toCol) return

  const dmId = props.datamart?.datamartId?.trim() ?? ''
  const now = new Date().toISOString()
  const nextSortOrd = relationships.value.reduce((max, r) => Math.max(max, r.sortOrd), 0) + 1

  relationships.value = [
    ...relationships.value,
    {
      datamartId: dmId,
      relId: '',
      fromTblId: draft.fromTblId,
      fromColId: draft.fromColId,
      toTblId: draft.toTblId,
      toColId: draft.toColId,
      cardinality: draft.cardinality,
      joinType: draft.joinType,
      relDesc: draft.relDesc.trim(),
      sortOrd: nextSortOrd,
      useYn: 'Y',
      createDt: now,
      modifyDt: now,
    },
  ]
}

const onRemoveRelationship = (index: number) => {
  relationships.value = relationships.value.filter((_, i) => i !== index)
}
</script>

<style lang="scss" scoped>
.datamart-meta-relationship {
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
  }

  :deep(.com-setting-section-body) {
    gap: 8px;
  }
}

.datamart-meta-relationship-title {
  margin: 0 0 4px;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.datamart-meta-relationship-desc {
  margin: $spacing-xs 0 0;
  font-size: $font-size-sm;
  line-height: 1.5;
  color: $color-text-secondary;
}

.datamart-meta-relationship-desc-dm {
  font-weight: $font-weight-medium;
  color: $color-text-muted;
}

/* JOIN 목록 패널 — 컬럼 탭 테이블 래퍼와 동일 톤, 접기 없음 */
.datamart-meta-rel-join-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.datamart-meta-rel-join-list-wrap {
  --datamart-meta-rel-join-height: min(168px, 24vh);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--datamart-meta-rel-join-height);
  min-height: var(--datamart-meta-rel-join-height);
  max-height: var(--datamart-meta-rel-join-height);
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
  box-sizing: border-box;
}

.datamart-meta-rel-join-list-inner {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  @include custom-scrollbar;
}

:deep(.datamart-meta-rel-join-empty) {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: $spacing-md;
}

.datamart-meta-rel-join-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px 10px;
  padding: 8px 10px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
  box-sizing: border-box;
  min-width: 0;
  overflow-x: auto;
  @include custom-scrollbar;
}

.datamart-meta-rel-join-mapping {
  display: grid;
  /* 기준/대상 각각 table.col 표시 — 최소 너비 확보, 비율은 1 : 1.2 정도로 완만하게 */
  grid-template-columns: minmax(12rem, 1.15fr) auto minmax(14rem, 1.35fr);
  align-items: center;
  flex: 1 1 420px;
  min-width: min(100%, 360px);
  column-gap: 0;
}

.datamart-meta-rel-join-src {
  min-width: 0;
  text-align: left;
  padding-right: $spacing-xl;
}

.datamart-meta-rel-join-tgt {
  min-width: 0;
  text-align: left;
  padding-left: $spacing-2xl;
}

.datamart-meta-rel-join-ident {
  display: block;
  max-width: 100%;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-dark;
  overflow-wrap: break-word;
  word-break: normal;
  text-align: inherit;
}

.datamart-meta-rel-join-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75em;
  min-width: 1.75em;
  color: $color-text-disabled;
  font-weight: $font-weight-bold;
}

.datamart-meta-rel-join-badge {
  flex-shrink: 0;
}

.datamart-meta-rel-join-jointy {
  flex-shrink: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
}

.datamart-meta-rel-join-desc-tip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  align-self: center;
  line-height: 0;
}

.datamart-meta-rel-join-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.datamart-meta-rel-join-info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: $color-text-secondary;
  cursor: pointer;
  border-radius: $border-radius-sm;
  line-height: 0;

  &:hover,
  &:focus-visible {
    color: $color-text-primary;
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px rgba($color-primary, 0.35);
  }
}

.datamart-meta-rel-editor-toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 4px;
}

/* 폼 영역 — 셀렉트 행 높이 고정(선택값·placeholder 바뀔 때 행 높이 미세 변동 방지) */
.datamart-meta-rel-form-panel {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;

  :deep(.com-setting-field-row:not(.is-top)) {
    align-items: center;
    box-sizing: border-box;
    height: 40px;
    min-height: 40px;
    max-height: 40px;
    flex-shrink: 0;
  }

  :deep(.com-setting-field-row.is-top) {
    align-items: flex-start;
    min-height: 0;
    max-height: none;
    height: auto;
  }

  :deep(.ui-select-wrap) {
    display: flex;
    align-items: center;
    align-self: center;
    flex: 1;
    min-width: 0;
    height: $height-sm;
    min-height: $height-sm;
    max-height: $height-sm;
  }

  :deep(.ui-input-outer) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ui-textarea) {
    flex: 1;
    min-width: 0;
  }

  :deep(.ui-select-trigger.size-sm) {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    height: $height-sm;
    min-height: $height-sm;
    max-height: $height-sm;
    line-height: 1.2;
  }

  :deep(.ui-select-value) {
    line-height: 1.2;
  }

  :deep(.ui-input-wrap.size-inp-sm) {
    min-height: $height-sm;
    height: $height-sm;
    box-sizing: border-box;
  }
}

.datamart-meta-rel-form-row {
  width: 100%;
  align-items: stretch;

  > .com-setting-field-row {
    flex: 1 1 0;
    min-width: 0;
  }

  > .datamart-meta-rel-form-pair {
    display: flex;
    flex: 1 1 100%;
    align-items: stretch;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
}

.datamart-meta-rel-form-pair > .datamart-meta-rel-form-side {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

@media (max-width: 720px) {
  .datamart-meta-rel-form-pair {
    flex-direction: column;
    gap: 8px;
  }
}

.datamart-meta-rel-form-row-desc {
  align-items: flex-start;

  > .com-setting-field-row {
    flex: 1 1 100%;
    width: 100%;
  }
}
</style>

<style lang="scss">
/* Radix 포탈(body) — content-class만 타깃 */
.ui-tooltip-content.datamart-meta-rel-desc-tooltip {
  max-width: 320px;
  text-align: left;
  white-space: pre-wrap;
}
</style>

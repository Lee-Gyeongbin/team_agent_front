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
              v-for="rel in relationships"
              :key="rel.id"
              class="datamart-meta-rel-join-row"
              role="listitem"
            >
              <span class="datamart-meta-rel-join-mapping">
                <span class="datamart-meta-rel-join-src">
                  <span class="datamart-meta-rel-join-ident">{{ formatTableCol(rel.srcTableId, rel.srcColName) }}</span>
                </span>
                <span
                  class="datamart-meta-rel-join-arrow"
                  aria-hidden="true"
                  >→</span
                >
                <span class="datamart-meta-rel-join-tgt">
                  <span class="datamart-meta-rel-join-ident">{{ formatTableCol(rel.tgtTableId, rel.tgtColName) }}</span>
                </span>
              </span>
              <UiBadge
                variant="category"
                size="xs"
                class="datamart-meta-rel-join-badge"
              >
                {{ rel.cardinality }}
              </UiBadge>
              <span class="datamart-meta-rel-join-jointy">{{ joinTyLabel(rel.joinTy) }}</span>
              <div class="datamart-meta-rel-join-actions">
                <UiButton
                  variant="line-secondary"
                  size="sm"
                  icon-only
                  type="button"
                  title="관계 삭제"
                  aria-label="관계 삭제"
                  @click="onRemoveRelationship(rel.id)"
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
              <div class="datamart-meta-rel-form-side">
                <div class="com-setting-field-row">
                  <label class="com-setting-label">기준 테이블</label>
                  <UiSelect
                    v-model="draft.srcTableId"
                    :options="tableOptions"
                    size="sm"
                    placeholder="테이블 선택"
                    @update:model-value="draft.srcColId = ''"
                  />
                </div>
                <div class="com-setting-field-row">
                  <label class="com-setting-label">기준 컬럼</label>
                  <UiSelect
                    v-model="draft.srcColId"
                    :options="srcColumnOptions"
                    size="sm"
                    placeholder="컬럼 선택"
                    :disabled="!draft.srcTableId || srcColumnOptions.length === 0"
                  />
                </div>
              </div>
              <div class="datamart-meta-rel-form-side">
                <div class="com-setting-field-row">
                  <label class="com-setting-label">대상 테이블</label>
                  <UiSelect
                    v-model="draft.tgtTableId"
                    :options="tableOptions"
                    size="sm"
                    placeholder="테이블 선택"
                    @update:model-value="draft.tgtColId = ''"
                  />
                </div>
                <div class="com-setting-field-row">
                  <label class="com-setting-label">대상 컬럼</label>
                  <UiSelect
                    v-model="draft.tgtColId"
                    :options="tgtColumnOptions"
                    size="sm"
                    placeholder="컬럼 선택"
                    :disabled="!draft.tgtTableId || tgtColumnOptions.length === 0"
                  />
                </div>
              </div>
            </div>
            <div class="com-setting-row datamart-meta-rel-form-row">
              <div class="com-setting-field-row">
                <label class="com-setting-label">관계 유형</label>
                <UiSelect
                  v-model="draft.cardinality"
                  :options="cardinalityOptions"
                  size="sm"
                />
              </div>
              <div class="com-setting-field-row">
                <label class="com-setting-label">JOIN 유형</label>
                <UiSelect
                  v-model="draft.joinTy"
                  :options="joinTyOptions"
                  size="sm"
                />
              </div>
            </div>
            <div class="com-setting-row datamart-meta-rel-form-row datamart-meta-rel-form-row-desc">
              <div class="com-setting-field-row is-top">
                <label class="com-setting-label">관계 설명 (선택)</label>
                <UiTextarea
                  v-model="draft.descKo"
                  size="sm"
                  :rows="2"
                  :auto-resize="true"
                  :max-rows="5"
                  border
                  placeholder="예: 주문에 연결된 결제 내역"
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

const tableOptions = computed(() =>
  activeTables.value.map((t) => ({
    label: `${t.physicalNm} · ${t.logicalNm}`,
    value: t.id,
  })),
)

const columnOptionsForTableId = (tableId: string) => {
  const t = activeTables.value.find((row) => row.id === tableId)
  if (!t) return []
  return t.columns.map((c) => ({ label: c.colName, value: c.id }))
}

const srcColumnOptions = computed(() => columnOptionsForTableId(draft.srcTableId))

const tgtColumnOptions = computed(() => columnOptionsForTableId(draft.tgtTableId))

const cardinalityOptions: { label: string; value: DatamartMetaCardinality }[] = [
  { label: '1 : 1', value: '1:1' },
  { label: '1 : N', value: '1:N' },
  { label: 'N : 1', value: 'N:1' },
]

const joinTyOptions: { label: string; value: DatamartMetaJoinTy }[] = [
  { label: 'INNER JOIN', value: 'INNER' },
  { label: 'LEFT JOIN', value: 'LEFT' },
  { label: 'RIGHT JOIN', value: 'RIGHT' },
  { label: 'FULL JOIN', value: 'FULL' },
]

const draft = reactive({
  srcTableId: '',
  srcColId: '',
  tgtTableId: '',
  tgtColId: '',
  cardinality: 'N:1' as DatamartMetaCardinality,
  joinTy: 'INNER' as DatamartMetaJoinTy,
  descKo: '',
})

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

const onAddRelationship = () => {
  if (!draft.srcTableId || !draft.srcColId || !draft.tgtTableId || !draft.tgtColId) return

  const srcTable = props.tables.find((t) => t.id === draft.srcTableId && t.useYn === 'Y')
  const tgtTable = props.tables.find((t) => t.id === draft.tgtTableId && t.useYn === 'Y')
  const srcCol = srcTable?.columns.find((c) => c.id === draft.srcColId)
  const tgtCol = tgtTable?.columns.find((c) => c.id === draft.tgtColId)
  if (!srcTable || !tgtTable || !srcCol || !tgtCol) return

  relationships.value = [
    ...relationships.value,
    {
      id: `rel_${Date.now()}`,
      srcTableId: draft.srcTableId,
      srcColName: srcCol.colName,
      tgtTableId: draft.tgtTableId,
      tgtColName: tgtCol.colName,
      cardinality: draft.cardinality,
      joinTy: draft.joinTy,
      descKo: draft.descKo.trim(),
    },
  ]
}

const onRemoveRelationship = (id: string) => {
  relationships.value = relationships.value.filter((r) => r.id !== id)
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
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 8px 10px;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  background: #fff;
  box-sizing: border-box;
}

.datamart-meta-rel-join-mapping {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 3fr);
  align-items: center;
  flex: 1 1 200px;
  min-width: 0;
  column-gap: 0;
}

.datamart-meta-rel-join-src {
  min-width: 0;
  text-align: left;
  padding-right: $spacing-2xl;
}

.datamart-meta-rel-join-tgt {
  min-width: 0;
  text-align: left;
  padding-left: $spacing-2xl * 2;
}

.datamart-meta-rel-join-ident {
  display: inline-block;
  max-width: 100%;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-dark;
  word-break: break-all;
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

.datamart-meta-rel-join-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: auto;
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

  > .datamart-meta-rel-form-side {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  @media (max-width: 720px) {
    flex-direction: column;
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

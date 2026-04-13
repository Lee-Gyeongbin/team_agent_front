<template>
  <div class="datamart-meta-column-metadata com-setting-form">
    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      overlay
      text="메타데이터를 불러오는 중..."
    />

    <template v-else-if="errorMessage">
      <div class="datamart-meta-column-metadata-error">
        <p class="datamart-meta-column-metadata-error-msg">
          {{ errorMessage }}
        </p>
        <UiButton
          variant="line-secondary"
          size="sm"
          @click="emit('retry')"
        >
          다시 시도
        </UiButton>
      </div>
    </template>

    <template v-else-if="tables.length === 0">
      <UiEmpty
        icon="icon-database"
        title="테이블이 없습니다."
        description="스키마에서 테이블 목록을 불러오면 여기에 표시됩니다."
      />
    </template>

    <template v-else>
      <div class="datamart-meta-column-metadata-header">
        <h3 class="datamart-meta-column-metadata-title">컬럼 메타데이터</h3>
        <p class="datamart-meta-column-metadata-desc">
          테이블별 컬럼 설명과 용도 분류를 정리하면 AI가 스키마를 더 정확히 이해합니다.
          <template v-if="datamart?.dmNm">
            <span class="datamart-meta-column-metadata-desc-dm"> ({{ datamart.dmNm }})</span>
          </template>
        </p>
      </div>

      <!-- 편집할 테이블 / 테이블 정보 / 컬럼 목록 — LlmSettingBasic 등과 동일 com-setting-section 아코디언 -->
      <div
        class="com-setting-section"
        :class="{ 'is-collapsed': sectionCollapsed.tablePick }"
        style="--label-width: 140px"
      >
        <div
          class="com-setting-section-header"
          @click="sectionCollapsed.tablePick = !sectionCollapsed.tablePick"
        >
          <span class="com-setting-section-title">편집할 테이블</span>
          <i class="icon-chevron-down size-16 com-setting-section-arrow" />
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
          :class="{ 'is-collapsed': sectionCollapsed.tableInfo }"
          style="--label-width: 140px"
        >
          <div
            class="com-setting-section-header"
            @click="sectionCollapsed.tableInfo = !sectionCollapsed.tableInfo"
          >
            <span class="com-setting-section-title">
              테이블 정보
              <span class="datamart-meta-column-metadata-table-chip">· {{ selectedTable.physicalNm }}</span>
            </span>
            <i class="icon-chevron-down size-16 com-setting-section-arrow" />
          </div>
          <div class="com-setting-section-body">
            <div class="com-setting-row datamart-meta-column-metadata-table-info-row">
              <div class="com-setting-field-row">
                <label class="com-setting-label">테이블 설명 (한국어)</label>
                <UiInput
                  v-model="selectedTable.tableDescKo"
                  size="sm"
                  placeholder="테이블 설명을 입력하세요"
                />
              </div>
              <div class="com-setting-field-row">
                <label class="com-setting-label">용도 분류</label>
                <UiSelect
                  v-model="selectedTable.usageTy"
                  :options="usageOptions"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          class="com-setting-section"
          :class="{ 'is-collapsed': sectionCollapsed.columns }"
          style="--label-width: 140px"
        >
          <div
            class="com-setting-section-header"
            @click="sectionCollapsed.columns = !sectionCollapsed.columns"
          >
            <span class="com-setting-section-title">컬럼 목록</span>
            <i class="icon-chevron-down size-16 com-setting-section-arrow" />
          </div>
          <div class="com-setting-section-body">
            <div class="datamart-meta-col-editor-toolbar">
              <UiButton
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
                <template #cell-colName="{ row }">
                  <UiInput
                    v-model="(row as DatamartMetaColumnRow).colName"
                    size="xs"
                    placeholder="컬럼명"
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
                <template #cell-isPk="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="(row as DatamartMetaColumnRow).isPk"
                      @update:model-value="(v: boolean) => ((row as DatamartMetaColumnRow).isPk = v)"
                    />
                  </div>
                </template>
                <template #cell-isFk="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="(row as DatamartMetaColumnRow).isFk"
                      @update:model-value="(v: boolean) => ((row as DatamartMetaColumnRow).isFk = v)"
                    />
                  </div>
                </template>
                <template #cell-descKo="{ row }">
                  <UiInput
                    v-model="(row as DatamartMetaColumnRow).descKo"
                    size="xs"
                    placeholder="컬럼 설명"
                  />
                </template>
                <template #cell-nullable="{ row }">
                  <div class="datamart-meta-col-toggle-wrap">
                    <UiToggle
                      :model-value="(row as DatamartMetaColumnRow).nullable === 'Y'"
                      @update:model-value="(v: boolean) => onNullableToggle(row as DatamartMetaColumnRow, v)"
                    />
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

            <p class="datamart-meta-col-footer-hint">DB에서 스키마 자동 불러오기도 지원됩니다</p>
          </div>
        </div>
      </template>
    </template>
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
    /** 테이블 선택 탭과 동일 목록 — useYn === 'Y' 인 행만 목록에 표시 */
    tables: DatamartMetaTableItem[]
    isLoading?: boolean
    errorMessage?: string | null
  }>(),
  {
    isLoading: false,
    errorMessage: null,
  },
)

const emit = defineEmits<{
  retry: []
}>()

const selectedTableId = defineModel<string>('selectedTableId', { default: '' })

/** LLM 설정 모달 섹션과 동일 — false면 펼침 */
const sectionCollapsed = reactive({
  tablePick: false,
  tableInfo: false,
  columns: false,
})

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

const usageOptions = [
  { label: '트랜잭션', value: 'TX' },
  { label: '마스터', value: 'MST' },
  { label: '차원', value: 'DIM' },
  { label: '스테이징', value: 'STG' },
  { label: '기타', value: 'ETC' },
]

const dataTypeOptions = [
  { label: 'VARCHAR', value: 'VARCHAR' },
  { label: 'CHAR', value: 'CHAR' },
  { label: 'TEXT', value: 'TEXT' },
  { label: 'INT', value: 'INT' },
  { label: 'BIGINT', value: 'BIGINT' },
  { label: 'DECIMAL', value: 'DECIMAL' },
  { label: 'FLOAT', value: 'FLOAT' },
  { label: 'DOUBLE', value: 'DOUBLE' },
  { label: 'DATE', value: 'DATE' },
  { label: 'DATETIME', value: 'DATETIME' },
  { label: 'TIMESTAMP', value: 'TIMESTAMP' },
  { label: 'BOOLEAN', value: 'BOOLEAN' },
  { label: 'BLOB', value: 'BLOB' },
]

const onNullableToggle = (col: DatamartMetaColumnRow, v: boolean) => {
  col.nullable = v ? 'Y' : 'N'
}

const onSelectTable = (id: string) => {
  selectedTableId.value = id
}

const onAddColumn = () => {
  const t = selectedTable.value
  if (!t) return
  t.columns.push({
    id: `col_${Date.now()}`,
    colName: '',
    dataType: 'VARCHAR',
    isPk: false,
    isFk: false,
    descKo: '',
    nullable: 'Y',
  })
}

const onRemoveColumn = (col: DatamartMetaColumnRow) => {
  const t = selectedTable.value
  if (!t) return
  const idx = t.columns.findIndex((c) => c.id === col.id)
  if (idx !== -1) t.columns.splice(idx, 1)
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

.datamart-meta-column-metadata-header {
  margin-bottom: $spacing-sm;
}

.datamart-meta-column-metadata-title {
  margin: 0 0 4px;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.datamart-meta-column-metadata-desc {
  margin: 0;
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
  justify-content: flex-end;
  margin: 0 0 4px;
}

.datamart-meta-column-metadata-table-chip {
  font-weight: $font-weight-medium;
  color: $color-text-secondary;
}

.datamart-meta-column-metadata-table-info-row {
  width: 100%;
  align-items: flex-start;

  .com-setting-field-row {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

/* pages/user-manage 톤 + 행 유무와 관계없이 목록 영역 높이 고정 */
.datamart-meta-col-table-wrap {
  --datamart-meta-col-table-height: min(168px, 24vh);
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

  /* 본문 1·5열(컬럼명·설명)만 좌측 — 헤더는 컬럼 headerAlign(가운데) 유지 */
  :deep(.ui-table td:nth-child(1)),
  :deep(.ui-table td:nth-child(5)) {
    text-align: left;
  }

  :deep(.ui-table td) {
    vertical-align: middle;
  }

  /* PK / FK / NULL: 행 높이가 커져도 토글 수직 가운데 */
  :deep(.ui-table tbody td:nth-child(3)),
  :deep(.ui-table tbody td:nth-child(4)),
  :deep(.ui-table tbody td:nth-child(6)) {
    vertical-align: middle;
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
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.4;
  color: #6f7a93;
}
</style>

<template>
  <div class="datamart-meta-table-select com-setting-form">
    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      overlay
      text="테이블 목록을 불러오는 중..."
    />

    <template v-else-if="errorMessage">
      <div class="datamart-meta-table-select-error">
        <p class="datamart-meta-table-select-error-msg">
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
      <div class="datamart-meta-table-select-header">
        <p class="datamart-meta-table-select-desc">
          AI에게 노출할 테이블만 선택하세요. 전체 {{ totalTableCount }}개 중 필요한 테이블만 포함하면 쿼리 정확도가
          높아집니다.
        </p>
      </div>

      <div class="datamart-meta-table-select-toolbar">
        <UiInput
          v-model="searchInput"
          type="search"
          placeholder="테이블명을 입력하세요"
          size="sm"
          class="datamart-meta-table-select-search"
        />
        <UiButton
          variant="line-secondary"
          size="sm"
          icon-only
          class="datamart-meta-table-select-select-all"
          type="button"
          :disabled="filteredTables.length === 0"
          :title="isFilteredAllActive ? '필터 결과 전체 비활성' : '필터 결과 전체 활성'"
          :aria-label="isFilteredAllActive ? '필터 결과 전체 비활성' : '필터 결과 전체 활성'"
          @click="onToggleActivateAllFiltered"
        >
          <template #icon-left>
            <span
              class="datamart-meta-table-select-link-icon"
              :class="{ 'is-all-selected': isFilteredAllActive }"
            >
              <i class="icon-link-agent size-16" />
              <span
                v-if="isFilteredAllActive"
                class="datamart-meta-table-select-link-slash"
                aria-hidden="true"
              />
            </span>
          </template>
        </UiButton>
      </div>

      <div class="datamart-meta-table-select-list-wrap">
        <div class="datamart-meta-table-select-summary-bar">
          <label class="datamart-meta-table-select-active-only">
            <UiToggle v-model="showActiveOnly" />
            <span class="datamart-meta-table-select-active-only-label">활성 목록만 보기</span>
          </label>
          <span class="datamart-meta-table-select-summary">
            <span class="datamart-meta-table-select-summary-active">{{ activeCount }}개 활성</span>
            / {{ totalTableCount }}개 전체
          </span>
        </div>

        <!-- 검색 결과 없음 -->
        <UiEmpty
          v-if="visibleTables.length === 0"
          icon="icon-search"
          :title="emptyStateTitle"
          :description="emptyStateDescription"
        />

        <!-- 테이블 목록 (Agent 설정 > 데이터 연결 카드와 동일 패턴: agent-data-card + UiToggle) -->
        <div
          v-else
          class="datamart-meta-table-select-scroll"
          role="list"
          aria-label="테이블 목록"
        >
          <div class="agent-setting-data-list">
            <div
              v-for="row in visibleTables"
              :key="row.id"
              class="agent-data-card"
              :class="{ 'is-connected': isUseY(row) }"
            >
              <div class="agent-data-card-info">
                <div class="agent-data-card-title">{{ row.physicalNm }}</div>
                <p class="agent-data-card-desc">{{ row.logicalNm }}</p>
                <div class="agent-data-card-meta">
                  <span class="agent-data-card-meta-item">
                    <i class="icon-database size-12" />
                    컬럼 <strong>{{ row.colCnt }}개</strong>
                  </span>
                </div>
              </div>
              <div class="agent-data-card-actions">
                <UiToggle
                  :model-value="isUseY(row)"
                  @update:model-value="(v: boolean) => onToggleUseYn(row.id, v)"
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
import type { DatamartMetaTableItem } from '~/types/datamartMeta'

const props = withDefaults(
  defineProps<{
    datamart: Datamart | null
    /** 테이블 선택·컬럼 메타 탭 공유 목록 (useYn 토글 시 emit) */
    tables: DatamartMetaTableItem[]
    isOpen?: boolean
    isLoading?: boolean
    errorMessage?: string | null
  }>(),
  {
    isOpen: false,
    isLoading: false,
    errorMessage: null,
  },
)

const emit = defineEmits<{
  retry: []
  /** 테이블 활성(useYn) 변경 */
  'set-table-use-yn': [payload: { id: string; useYn: 'Y' | 'N' }]
}>()

/** 전체 테이블 수(스키마 기준). 연동 시 API/메타 기준으로 교체 */
const totalTableCount = computed(() => {
  const cnt = props.datamart?.tblCnt
  if (cnt != null && cnt > 0) return cnt
  return props.tables.length > 0 ? props.tables.length : 409
})

const searchInput = ref('')
const showActiveOnly = ref(false)

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    searchInput.value = ''
    showActiveOnly.value = false
  },
)

const filteredTables = computed(() => {
  const q = searchInput.value.trim().toLowerCase()
  if (!q) return props.tables
  return props.tables.filter((t) => t.physicalNm.toLowerCase().includes(q) || t.logicalNm.toLowerCase().includes(q))
})

const visibleTables = computed(() => {
  if (!showActiveOnly.value) return filteredTables.value
  return filteredTables.value.filter((row) => row.useYn === 'Y')
})

const isUseY = (row: DatamartMetaTableItem) => row.useYn === 'Y'

/** 필터된 목록이 1건 이상이고, 모두 useYn Y 인 경우 */
const isFilteredAllActive = computed(() => {
  const rows = filteredTables.value
  if (rows.length === 0) return false
  return rows.every((row) => row.useYn === 'Y')
})

const activeCount = computed(() => props.tables.filter((t) => t.useYn === 'Y').length)

const emptyStateTitle = computed(() => {
  if (showActiveOnly.value) return '활성화된 테이블이 없습니다.'
  return '검색 결과가 없습니다.'
})

const emptyStateDescription = computed(() => {
  if (showActiveOnly.value) return '활성 목록만 보기 해제 후 전체 목록을 확인해 보세요.'
  return '다른 검색어로 시도해 보세요.'
})

const onToggleUseYn = (id: string, value: boolean) => {
  emit('set-table-use-yn', { id, useYn: value ? 'Y' : 'N' })
}

/** 필터된 테이블만 대상으로 전체 활성 ↔ 전체 비활성 */
const onToggleActivateAllFiltered = () => {
  const rows = filteredTables.value
  if (rows.length === 0) return

  const nextUseYn: 'Y' | 'N' = isFilteredAllActive.value ? 'N' : 'Y'
  for (const row of rows) {
    if (row.useYn !== nextUseYn) {
      emit('set-table-use-yn', { id: row.id, useYn: nextUseYn })
    }
  }
}
</script>

<style lang="scss" scoped>
.datamart-meta-table-select {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.datamart-meta-table-select-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xl 0;
}

.datamart-meta-table-select-error-msg {
  margin: 0;
  @include typo($body-large);
  color: $color-text-secondary;
  text-align: center;
}

.datamart-meta-table-select-title {
  margin: 0 0 6px;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-heading;
}

.datamart-meta-table-select-desc {
  margin: $spacing-xs 0 0;
  font-size: $font-size-sm;
  line-height: 1.5;
  color: $color-text-secondary;
}

.datamart-meta-table-select-toolbar {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
}

.datamart-meta-table-select-search {
  flex: 1;
  min-width: 0;
}

.datamart-meta-table-select-select-all {
  flex-shrink: 0;
}

/* PromptSystemCard 삭제 불가 휴지통과 동일: 연결 아이콘 + 빨간 대각선(비활성/해제 의미) */
.datamart-meta-table-select-link-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.datamart-meta-table-select-link-icon.is-all-selected .icon-link-agent {
  opacity: 0.5;
}

.datamart-meta-table-select-link-slash {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 20px;
  height: 2px;
  background: $color-error;
  border-radius: 1px;
  transform: translate(-50%, -50%) rotate(-45deg);
  pointer-events: none;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.95);
}

/* 스크롤만 담당 — 카드 스타일은 assets/styles/page/_agent.scss 의 .agent-data-card */
.datamart-meta-table-select-scroll {
  max-height: min(420px, 50vh);
  overflow-y: auto;
  @include custom-scrollbar;
}

.datamart-meta-table-select-list-wrap {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: 10px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
}

.datamart-meta-table-select-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.datamart-meta-table-select-active-only {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.datamart-meta-table-select-active-only-label {
  @include typo($body-small);
  color: $color-text-secondary;
}

.datamart-meta-table-select-summary {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.datamart-meta-table-select-summary-active {
  font-weight: $font-weight-semibold;
  color: $color-primary;
}
</style>

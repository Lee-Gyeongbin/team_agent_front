<template>
  <div class="codes-index wide-center">
    <!-- 헤더 -->
    <div class="codes-header">
      <p class="codes-description">시스템에서 사용하는 공통코드를 그룹별로 조회하고 관리할 수 있습니다.</p>
    </div>

    <!-- 로딩 -->
    <div
      v-if="isLoading"
      class="codes-loading"
    >
      <div class="codes-loading__spinner" />
      <p class="codes-loading__text">공통코드를 불러오는 중...</p>
    </div>

    <!-- 에러 -->
    <div
      v-else-if="errorMessage"
      class="codes-error"
    >
      <p class="codes-error__message">{{ errorMessage }}</p>
      <UiButton
        variant="outline"
        size="md"
        @click="handleFetchCodeGroupList"
      >
        다시 시도
      </UiButton>
    </div>

    <!-- 좌우 분할 영역 -->
    <div
      v-else
      class="codes-split"
    >
      <!-- 왼쪽: 공통코드 그룹 목록 -->
      <div class="codes-left">
        <div class="codes-left-header flex justify-between items-center">
          <p class="total">
            총 <strong>{{ filteredGroupList.length }}건</strong>
          </p>
          <div class="codes-left-grp flex items-center">
            <div class="codes-group-input-grp shrink-0 grow-1 max-w-200">
              <UiInput
                v-model="searchKeywordGroup"
                type="search"
                placeholder="그룹코드 또는 그룹명 검색"
                @search="handleFetchCodeGroupList"
                @enter="handleFetchCodeGroupList"
              />
            </div>
            <UiButton
              variant="ghost"
              size="sm"
              @click="handleFetchCodeGroupList"
            >
              <template #icon-left>
                <i class="icon icon-refresh size-14" />
              </template>
              새로고침
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              @click="openAddGroupModal"
            >
              <template #icon-left>
                <i class="icon icon-plus size-14" />
              </template>
              추가
            </UiButton>
          </div>
        </div>
        <div class="codes-left-table-wrap">
          <UiTable
            :columns="codeGroupColumns"
            :data="codeGroupTableDataWithActions"
            :clickable="true"
            sticky-header
            max-height="calc(100vh - 220px)"
            empty-text="등록된 그룹이 없습니다."
            selected-row-key="codeGrpId"
            :selected-row-value="selectedGroupCode"
            @row-click="(row) => handleSelectGroup(row as CodeGroupItem)"
          >
            <template #cell-useYn="{ value }">
              <span
                class="codes-status"
                :class="value === 'Y' ? 'is-use' : 'is-unuse'"
              >
                {{ value === 'Y' ? '사용' : '미사용' }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <div
                class="cell-actions-wrap"
                @click.stop
              >
                <UiDropdownMenu
                  :items="getCodeGroupRowMenuItems(row as CodeGroupItem)"
                  align="end"
                  @select="(value) => handleGroupRowMenuSelect(row as CodeGroupItem, value)"
                >
                  <template #trigger>
                    <UiButton
                      icon-only
                      variant="ghost"
                      size="xs"
                    >
                      <template #icon-left>
                        <i class="icon icon-add-dot size-16" />
                      </template>
                    </UiButton>
                  </template>
                </UiDropdownMenu>
              </div>
            </template>
          </UiTable>
        </div>
      </div>

      <!-- 오른쪽: 선택 그룹의 상세코드 목록 -->
      <div class="codes-right">
        <div class="codes-right-header flex justify-between items-center">
          <p class="total">
            총 <strong>{{ filteredList.length }}건</strong>
          </p>
          <div class="codes-right-grp flex items-center">
            <div class="codes-input-grp shrink-0 grow-1 max-w-200">
              <UiInput
                v-model="searchKeyword"
                type="search"
                placeholder="코드 또는 코드명 검색"
                @search="handleFetchCodeList"
                @enter="handleFetchCodeList"
              />
            </div>
            <UiButton
              variant="ghost"
              size="sm"
              @click="handleFetchCodeList"
            >
              <template #icon-left>
                <i class="icon icon-refresh size-14" />
              </template>
              새로고침
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              :disabled="!selectedGroupCode"
              @click="openAddModal"
            >
              <template #icon-left>
                <i class="icon icon-plus size-14" />
              </template>
              추가
            </UiButton>
          </div>
        </div>
        <div class="codes-right-table-wrap">
          <!-- 드래그 정렬 가능 시 -->
          <UiDragTable
            v-if="canDrag"
            v-model="codeList"
            :columns="codesColumnsWithDrag"
            item-key="codeId"
            handle=".codes-drag-handle"
            sticky-header
            max-height="calc(100vh - 280px)"
            empty-text="조회된 공통코드가 없습니다."
            @drag-end="handleUpdateSortOrder"
          >
            <template #cell-_drag>
              <span class="codes-drag-handle">
                <i class="icon icon-move-handle size-16" />
              </span>
            </template>
            <template #cell-useYn="{ value }">
              <span
                class="codes-status"
                :class="value === 'Y' ? 'is-use' : 'is-unuse'"
              >
                {{ value === 'Y' ? '사용' : '미사용' }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <div
                class="cell-actions-wrap"
                @click.stop
              >
                <UiDropdownMenu
                  :items="getCodesRowMenuItems(row as CodeItem)"
                  align="end"
                  @select="(v) => handleRowMenuSelect(row as CodeItem, v)"
                >
                  <template #trigger>
                    <UiButton
                      icon-only
                      variant="ghost"
                      size="xs"
                    >
                      <template #icon-left>
                        <i class="icon icon-add-dot size-16" />
                      </template>
                    </UiButton>
                  </template>
                </UiDropdownMenu>
              </div>
            </template>
          </UiDragTable>

          <!-- 드래그 비활성 시 (검색 중) -->
          <UiTable
            v-else
            :columns="codesColumns"
            :data="tableData"
            sticky-header
            max-height="calc(100vh - 280px)"
            empty-text="조회된 공통코드가 없습니다."
          >
            <template #cell-useYn="{ value }">
              <span
                class="codes-status"
                :class="value === 'Y' ? 'is-use' : 'is-unuse'"
              >
                {{ value === 'Y' ? '사용' : '미사용' }}
              </span>
            </template>
            <template #cell-actions="{ row }">
              <div
                class="cell-actions-wrap"
                @click.stop
              >
                <UiDropdownMenu
                  :items="getCodesRowMenuItems(row as CodeItem)"
                  align="end"
                  @select="(v) => handleRowMenuSelect(row as CodeItem, v)"
                >
                  <template #trigger>
                    <UiButton
                      icon-only
                      variant="ghost"
                      size="xs"
                    >
                      <template #icon-left>
                        <i class="icon icon-add-dot size-16" />
                      </template>
                    </UiButton>
                  </template>
                </UiDropdownMenu>
              </div>
            </template>
          </UiTable>
        </div>
      </div>
    </div>

    <!-- 추가/수정 모달 -->
    <UiModal
      :is-open="isModalOpen"
      :title="isEditMode ? '코드 수정' : '코드 추가'"
      position="center"
      max-width="480px"
      @close="handleModalClose"
    >
      <CodesFormModal
        :editing-code="editingCode"
        :is-edit-mode="isEditMode"
        @save="handleSaveCode"
        @close="handleModalClose"
      />
    </UiModal>

    <!-- 그룹 추가/수정 모달 -->
    <UiModal
      :is-open="isGroupModalOpen"
      :title="isGroupEditMode ? '그룹 수정' : '그룹 추가'"
      position="center"
      max-width="420px"
      @close="handleGroupModalClose"
    >
      <CodeGroupFormModal
        :editing-group="editingGroup"
        :is-edit-mode="isGroupEditMode"
        @save="handleSaveGroup"
        @close="handleGroupModalClose"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { CodeGroupItem, CodeItem } from '~/types/codes'
import { codeGroupColumns, codesColumns, codesColumnsWithDrag } from '~/types/codes'
import { getCodeGroupRowMenuItems, getCodesRowMenuItems, useCodesStore } from '~/composables/codes/useCodesStore'

const {
  selectedGroupCode,
  searchKeyword,
  searchKeywordGroup,
  isLoading,
  errorMessage,
  filteredList,
  filteredGroupList,
  codeList,
  canDrag,
  codeGroupTableDataWithActions,
  tableData,
  isModalOpen,
  isEditMode,
  editingCode,
  isGroupModalOpen,
  isGroupEditMode,
  editingGroup,
  handleGroupRowMenuSelect,
  handleFetchCodeGroupList,
  handleFetchCodeList,
  handleSelectGroup,
  openAddModal,
  openAddGroupModal,
  handleModalClose,
  handleGroupModalClose,
  handleSaveCode,
  handleSaveGroup,
  handleRowMenuSelect,
  handleUpdateSortOrder,
} = useCodesStore()

onMounted(() => {
  handleFetchCodeGroupList()
})
</script>

<style lang="scss" scoped>
.codes-index {
  padding: $spacing-md;
  min-height: calc(100vh - #{$header-height});
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.codes-description {
  color: $color-text-secondary;
  font-size: $font-size-base;
}

.codes-header {
  padding: 12px 0;
  margin-bottom: $spacing-md;
}

.codes-loading {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;
  min-height: 240px;

  &__spinner {
    width: 36px;
    height: 36px;
    border: 3px solid $color-border;
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: codes-spin 0.8s linear infinite;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

@keyframes codes-spin {
  to {
    transform: rotate(360deg);
  }
}

.codes-error {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;
  gap: $spacing-md;
  min-height: 240px;

  &__message {
    font-size: $font-size-sm;
    color: $color-error;
  }
}

// 좌우 분할
.codes-split {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  min-height: 0;
}

.codes-left {
  flex: 0 0 40%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.codes-left-header {
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $color-border;
  background: $color-background;
  gap: $spacing-sm;
  flex-wrap: wrap;

  .total {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    white-space: nowrap;

    strong {
      color: $color-text-primary;
    }
  }
}

.codes-left-grp {
  gap: $spacing-sm;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.codes-group-input-grp {
  min-width: 0;
}

.codes-left-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.codes-right {
  flex: 1 1 60%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  overflow: hidden;
}

.codes-right-header {
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid $color-border;
  background: $color-background;
  gap: $spacing-sm;
  flex-wrap: wrap;

  .total {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    white-space: nowrap;

    strong {
      color: $color-text-primary;
    }
  }
}

.codes-right-grp {
  gap: $spacing-sm;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.codes-input-grp {
  min-width: 0;
}

.codes-right-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.codes-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $border-radius-full;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;

  &.is-use {
    background: rgba($color-success, 0.12);
    color: $color-success;
  }

  &.is-unuse {
    background: rgba($color-text-disabled, 0.2);
    color: $color-text-disabled;
  }
}

// 드래그 핸들
.codes-drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: $color-text-muted;

  &:active {
    cursor: grabbing;
  }
}

// 드래그 중 고스트
:deep(.sortable-ghost) {
  opacity: 0.4;
}
</style>

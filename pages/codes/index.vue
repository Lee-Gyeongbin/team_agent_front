<template>
  <div class="codes-index wide-center">
    <!-- 헤더 -->
    <div class="codes-header">
      <p class="codes-description">시스템에서 사용하는 공통코드를 그룹별로 조회하고 관리할 수 있습니다.</p>
    </div>

    <!-- 로딩 -->
    <UiLoading
      v-if="isLoading"
      overlay
      text="공통코드를 불러오는 중..."
    />

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
                        <i class="icon icon-add-dot size-20" />
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
          <div class="codes-right-title">
            <p
              v-if="selectedGroupName"
              class="codes-right-group-name"
            >
              {{ selectedGroupName }}
            </p>
            <p class="total">
              총 <strong>{{ filteredList.length }}건</strong>
            </p>
          </div>
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
          <!-- 그룹 미선택 상태 -->
          <div
            v-if="!selectedGroupCode"
            class="codes-empty-state"
          >
            <i class="icon icon-arrow-right size-24" />
            <p>좌측에서 그룹을 선택하세요</p>
          </div>

          <!-- 드래그 정렬 가능 시 -->
          <UiDragTable
            v-else-if="canDrag"
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
                        <i class="icon icon-add-dot size-20" />
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
                        <i class="icon icon-add-dot size-20" />
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
  selectedGroupName,
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

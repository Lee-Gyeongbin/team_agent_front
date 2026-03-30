<template>
  <div class="repository-document-tab">
    <!-- 검색·필터·문서 등록 (문서 관리 탭용) -->
    <div class="document-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="docSearchKeyword"
        type="search"
        placeholder="문서명, 내용으로 검색..."
        class="document-search-input"
        @search="onSearch"
        @enter="onSearch"
      />
      <UiSelect
        v-model="docStatusFilter"
        :options="statusFilterOptions"
        placeholder="전체 상태"
        size="md"
        class="document-filter-select"
        @update:model-value="onSearch"
      />
      <UiButton
        variant="primary"
        size="md"
        class="btn-register-document"
        @click="onRegisterDocument"
      >
        <template #icon-left>
          <i class="icon icon-plus size-16" />
        </template>
        문서 등록
      </UiButton>
    </div>

    <div class="repository-content-wrapper flex">
      <!-- 좌측 카테고리 패널 -->
      <aside class="category-panel">
        <div class="category-panel-header flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="category-panel-title">카테고리</span>
            <!--  전체 카테고리 버튼 -->
            <UiButton
              icon-only
              variant="ghost"
              size="xxs"
              class="btn-add-category"
              @click="openCategorySelectModal"
            >
              <template #icon-left>
                <i class="icon icon-sliders size-16" />
              </template>
            </UiButton>
          </div>
          <UiButton
            icon-only
            variant="ghost"
            size="xxs"
            class="btn-add-category"
            @click="toggleCategoryInput"
          >
            <template #icon-left>
              <i class="icon icon-plus-medium size-16" />
            </template>
          </UiButton>
        </div>
        <div
          v-if="isCategoryInputVisible"
          class="category-input-wrap"
        >
          <UiInput
            ref="categoryInputRef"
            v-model="categoryInputValue"
            :placeholder="categoryInputPlaceholder"
            size="sm"
            @enter="onCategoryInputEnter"
          />
        </div>
        <div class="category-tree-wrap">
          <ul class="category-tree">
            <CategoryTreeNode
              v-for="cat in filteredCategoryList"
              :key="cat.categoryId"
              :item="cat"
              :depth="1"
              selectable
              :max-category-depth="5"
              :selected-ids="selectedCategoryIds"
              :show-check-icon="false"
              :editing-category-id="editingCategoryId"
              :editing-name="editingName"
              :menu-items="categoryMenuItems"
              @toggle="toggleExpand"
              @select="onCategorySelect"
              @menu-select="onCategoryMenuSelect"
              @update:editing-name="editingName = $event"
              @save-rename="saveCategoryRename"
            />
          </ul>
        </div>
      </aside>

      <!-- 우측 문서 관리 패널 -->
      <section class="document-panel">
        <div class="document-batch-bar flex items-center">
          <p class="batch-count">
            <span class="point-color">{{ selectedIds.length }}개</span> 선택됨
          </p>
          <UiButton
            variant="line-secondary"
            size="xxs"
            class="batch-bar-btn"
            @click="onBatchDownload"
          >
            <template #icon-left>
              <i class="icon icon-download size-12" />
            </template>
            일괄 다운로드
          </UiButton>
          <UiButton
            variant="line-secondary"
            size="xxs"
            class="batch-bar-btn type-danger"
            @click="onBatchDelete"
          >
            <template #icon-left>
              <i class="icon icon-trashcan size-12" />
            </template>
            일괄 삭제
          </UiButton>
        </div>

        <div class="document-table-wrap">
          <UiTable
            :columns="tableColumns"
            :data="sortedDocumentList"
            sticky-header
            clickable
            selected-row-key="docId"
            :selected-row-value="docTableHighlightedDocId ?? undefined"
            empty-text="등록된 문서가 없습니다."
            @row-click="onDocumentTableRowClick"
          >
            <template #header-select>
              <UiCheckbox
                :model-value="isAllSelected"
                @update:model-value="toggleSelectAll"
              />
            </template>
            <template #header-docTitle>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('docTitle')"
              >
                문서명
                <i class="icon icon-sync size-16" />
              </button>
            </template>
            <template #header-categoryName>
              <button
                type="button"
                class="table-header-sort-btn"
              >
                카테고리
                <i class="icon icon-sync size-16" />
              </button>
            </template>
            <template #header-fileSize>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('fileSize')"
              >
                파일 총 크기
                <i class="icon icon-sync size-16" />
              </button>
            </template>
            <template #cell-fileCnt="{ value }"> {{ value }}개 </template>
            <template #header-createDt>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('createDt')"
              >
                등록일
                <i class="icon icon-sync size-16" />
              </button>
            </template>
            <template #header-actions>
              <i class="icon icon-add-dot size-20" />
            </template>
            <template #cell-select="{ row }">
              <div
                class="cell-select-stop"
                @click.stop
              >
                <UiCheckbox
                  :model-value="selectedIds.includes(row.docId)"
                  @update:model-value="(v) => toggleSelectRow(row.docId, v)"
                />
              </div>
            </template>
            <template #cell-docTitle="{ row }">
              <div class="cell-document flex items-center">
                <span
                  class="doc-icon"
                  :class="getDocIconClass(row.fileType)"
                >
                  <i :class="['icon', getDocIconName(row.fileType), 'size-20']" />
                </span>
                <span class="doc-name">{{ row.docTitle }}</span>
              </div>
            </template>
            <template #cell-useYn="{ value }">
              <UiBadge
                variant="default"
                size="sm"
                :class="[
                  'badge-status',
                  {
                    'is-active': value === 'Y' || value === '활성',
                    'is-inactive': value === 'N' || value === '비활성',
                  },
                ]"
              >
                {{ formatUseYnLabel(value) }}
              </UiBadge>
            </template>
            <template #cell-dsDocCnt="{ value }"> {{ value }}개 RAG </template>
            <template #cell-actions="{ row }">
              <div
                class="cell-actions"
                @click.stop
              >
                <UiDropdownMenu
                  :items="rowActionItems"
                  align="end"
                  @select="(value) => onRowActionSelect(value, row as Document)"
                >
                  <template #trigger>
                    <UiButton
                      icon-only
                      variant="ghost"
                      size="xs"
                      class="btn-row-more"
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

        <UiPagination
          v-if="docTotalCount > 0"
          v-model="currentPage"
          :total-count="docTotalCount"
          :page-size="docPageSize"
          total-label="개 문서"
          class="document-pagination"
        />
      </section>
    </div>

    <CategorySelectModal
      :is-open="isCategorySelectModalOpen"
      @close="isCategorySelectModalOpen = false"
      @confirm="onCategorySelectConfirm"
    />

    <DocRegisterPanel
      :is-open="isDocRegisterOpen"
      :initial-data="docRegisterInitialData"
      @close="onCloseDocRegister"
    />

    <FilePreviewModal
      v-model:is-open="isFilePreviewOpen"
      v-model:doc-file-id="filePreviewDocFileId"
      :doc-id="filePreviewDocId"
      :title="filePreviewTitle"
      :doc-file-options="filePreviewDocFileOptions"
      @close="onCloseFilePreview"
    />
  </div>
</template>

<script setup lang="ts">
import type { Document } from '~/types/repository'
import FilePreviewModal from '~/components/file/FilePreviewModal.vue'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import DocRegisterPanel from '~/components/repository/DocRegisterPanel.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'

const {
  selectedIds,
  isAllSelected,
  toggleSelectAll,
  onSort,
  toggleSelectRow,
  getDocIconClass,
  getDocIconName,
  docTotalCount,
  docSearchKeyword,
  docStatusFilter,
  docCurrentPage,
  docPageSize,
  handleSelectDocumentList,
  onSearch,
  onRegisterDocument,
  onBatchDownload,
  onBatchDelete,
  tableColumns,
  sortedDocumentList,
  formatUseYnLabel,
  rowActionItems,
  isDocRegisterOpen,
  docRegisterInitialData,
  docTableHighlightedDocId,
  onDocumentTableRowClick,
  onCloseDocRegister,
  onRowActionSelect,
  statusFilterOptions,
  isFilePreviewOpen,
  filePreviewDocId,
  filePreviewDocFileId,
  filePreviewTitle,
  filePreviewDocFileOptions,
  onCloseFilePreview,
} = useRepositoryStore()
const {
  filteredCategoryList,
  isCategoryInputVisible,
  categoryInputValue,
  editingCategoryId,
  editingName,
  categoryInputPlaceholder,
  categoryMenuItems,
  selectedCategoryIds,
  isCategorySelectModalOpen,
  handleSelectCategoryList,
  onCategorySelectConfirm,
  toggleExpand,
  onCategorySelect,
  onCategoryMenuSelect,
  saveCategoryRename,
  openCategorySelectModal,
  toggleCategoryInput,
  onCategoryInputEnter,
} = useCategoryStore()

// 페이지 변경 → store의 핸들러 호출 (변경이력 모달 패턴과 동일)
const currentPage = computed({
  get: () => docCurrentPage.value,
  set: (page: number) => {
    docCurrentPage.value = page
    handleSelectDocumentList()
  },
})

// 초기 로딩
onMounted(async () => {
  await handleSelectCategoryList()
  await handleSelectDocumentList()
})
</script>

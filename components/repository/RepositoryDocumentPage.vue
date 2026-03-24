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
            empty-text="등록된 문서가 없습니다."
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
            <template #header-fileSize>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('fileSize')"
              >
                파일크기
                <i class="icon icon-sync size-16" />
              </button>
            </template>
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
              <UiCheckbox
                :model-value="selectedIds.includes(row.docId)"
                @update:model-value="(v) => toggleSelectRow(row.docId, v)"
              />
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
          v-model="docCurrentPage"
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
      @close="isDocRegisterOpen = false"
      @save="onSaveDocument"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'
import type { Document } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import DocRegisterPanel from '~/components/repository/DocRegisterPanel.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'

const {
  documentList,
  docTotalCount,
  docSearchKeyword,
  docStatusFilter,
  docCurrentPage,
  docPageSize,
  handleSelectDocumentList,
  handleSaveDocument,
  handleDeleteDocument,
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
// 초기 로딩
onMounted(async () => {
  await handleSelectCategoryList()
  await handleSelectDocumentList()
})

// 페이지 변경 시 재조회
watch(docCurrentPage, () => handleSelectDocumentList())

// 검색·필터
const statusFilterOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

const onSearch = () => {
  // docCurrentPage watch가 handleSelectDocumentList를 호출하므로, 페이지가 1이 아닐 때만 변경
  if (docCurrentPage.value !== 1) {
    docCurrentPage.value = 1 // watch에서 재조회
  } else {
    handleSelectDocumentList()
  }
}

// ===== 테이블 =====
const tableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'docTitle', label: '문서명', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'fileSize', label: '파일크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'useYn', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'dsDocCnt', label: 'RAG 사용', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 정렬 (프론트 정렬)
type SortKey = keyof Pick<Document, 'docTitle' | 'fileSize' | 'createDt'>
const sortKey = ref<SortKey | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')
const onSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedDocumentList = computed(() => {
  const list = [...documentList.value]
  const key = sortKey.value
  if (!key) return list
  const dir = sortOrder.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    return dir * (va === vb ? 0 : va < vb ? -1 : 1)
  })
})

/** useYn 표시 (Y/N 또는 레거시 한글) */
const formatUseYnLabel = (value: string) => {
  if (value === 'Y') return '활성'
  if (value === 'N') return '비활성'
  return value
}

const rowActionItems = [
  { label: '미리보기', value: 'preview', icon: 'icon-view' },
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// ===== 선택 =====
const selectedIds = ref<string[]>([])
const isAllSelected = computed(
  () => documentList.value.length > 0 && selectedIds.value.length === documentList.value.length,
)
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = documentList.value.map((r) => r.docId)
  }
}
const toggleSelectRow = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

// ===== 문서 등록 패널 =====
const isDocRegisterOpen = ref(false)
const onRegisterDocument = () => {
  isDocRegisterOpen.value = true
}
const onSaveDocument = async (data: Record<string, unknown>) => {
  const title = String(data.title ?? '')
  await handleSaveDocument({
    docTitle: title,
    categoryId: String(data.categoryId ?? ''),
  })
  openToast({ message: `'${title}' 문서가 등록되었습니다.` })
}

const onBatchDownload = () => {
  if (selectedIds.value.length === 0) {
    openAlert({ title: '알림', message: '다운로드할 문서를 선택해주세요.' })
    return
  }
  openAlert({
    title: '일괄 다운로드',
    message: `${selectedIds.value.length}개 문서 다운로드 기능은 추후 구현 예정입니다.`,
  })
}

const onBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    openAlert({ title: '알림', message: '삭제할 문서를 선택해주세요.' })
    return
  }
  const confirmed = await openConfirm({
    title: '일괄 삭제',
    message: `선택한 ${selectedIds.value.length}개 문서를 삭제하시겠습니까?`,
  })
  if (confirmed) {
    await handleDeleteDocument(selectedIds.value)
    selectedIds.value = []
  }
}

const onRowActionSelect = async (value: string, row: Document) => {
  if (value === 'delete') {
    const confirmed = await openConfirm({
      title: '문서 삭제',
      message: `'${row.docTitle}'을(를) 삭제하시겠습니까?`,
    })
    if (confirmed) {
      await handleDeleteDocument([row.docId])
      selectedIds.value = selectedIds.value.filter((id) => id !== row.docId)
    }
  } else if (value === 'preview') {
    openAlert({ title: '미리보기', message: '미리보기 기능은 추후 구현 예정입니다.' })
  } else if (value === 'download') {
    openAlert({ title: '다운로드', message: '다운로드 기능은 추후 구현 예정입니다.' })
  }
}

// 문서 아이콘
const getDocIconClass = (fileType: string) => {
  if (fileType === 'pdf') return 'doc-icon-pdf'
  if (fileType === 'txt') return 'doc-icon-txt'
  if (fileType === 'doc') return 'doc-icon-doc'
  return 'doc-icon-default'
}
const getDocIconName = (fileType: string) => {
  if (fileType === 'pdf') return 'icon-file-pdf'
  if (fileType === 'txt') return 'icon-file-txt'
  if (fileType === 'doc') return 'icon-file-doc'
  return 'icon-document'
}
</script>

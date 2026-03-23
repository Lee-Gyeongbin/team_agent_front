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
              :key="cat.id"
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
            <template #header-documentName>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('documentName')"
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
            <template #header-registerDate>
              <button
                type="button"
                class="table-header-sort-btn"
                @click="onSort('registerDate')"
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
                :model-value="selectedIds.includes(row.id)"
                @update:model-value="(v) => toggleSelectRow(row.id, v)"
              />
            </template>
            <template #cell-documentName="{ row }">
              <div class="cell-document flex items-center">
                <span
                  class="doc-icon"
                  :class="getDocIconClass(row.fileType)"
                >
                  <i :class="['icon', getDocIconName(row.fileType), 'size-20']" />
                </span>
                <span class="doc-name">{{ row.documentName }}</span>
              </div>
            </template>
            <template #cell-status="{ value }">
              <UiBadge
                variant="default"
                size="sm"
                :class="[
                  'badge-status',
                  {
                    'is-active': value === '활성',
                    'is-inactive': value === '비활성',
                  },
                ]"
              >
                {{ value }}
              </UiBadge>
            </template>
            <template #cell-ragCount="{ value }"> {{ value }}개 RAG </template>
            <template #cell-actions="{ row }">
              <div
                class="cell-actions"
                @click.stop
              >
                <UiDropdownMenu
                  :items="rowActionItems"
                  align="end"
                  @select="(value) => onRowActionSelect(value, row)"
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
import type { CategoryItem } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'
import DocRegisterPanel from '~/components/repository/DocRegisterPanel.vue'
import { useRepositoryStore } from '~/composables/repository/useRepositoryStore'
import { openAlert, openConfirm } from '~/composables/useDialog'
import { openToast } from '~/composables/useToast'

const {
  categoryList,
  filteredCategoryList,
  visibleCategoryIds,
  handleSelectCategoryList,
  handleSaveCategory,
  handleRenameCategory,
  handleDeleteCategory,
  documentList,
  docTotalCount,
  docSearchKeyword,
  docStatusFilter,
  docSelectedCategoryId,
  docCurrentPage,
  docPageSize,
  handleSelectDocumentList,
  handleSaveDocument,
  handleDeleteDocument,
} = useRepositoryStore()

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

// ===== 카테고리 =====
const isCategoryInputVisible = ref(false)
const isCategorySelectModalOpen = ref(false)
const categoryInputValue = ref('')
const categoryInputRef = ref<{ focus: () => void } | null>(null)
/** 상단 입력으로 추가할 때 부모 카테고리 ID (null이면 최상위) */
const categoryInputParentId = ref<string | null>(null)
const editingCategoryId = ref<string | null>(null)
const editingName = ref('')

const categoryInputPlaceholder = computed(() =>
  categoryInputParentId.value ? '하위 카테고리명 입력(엔터)' : '카테고리명 입력(엔터)',
)

const categoryMenuItems = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '하위 카테고리 추가', value: 'addSubcategory', icon: 'icon-folder-close' },
  { label: '카테고리 삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 카테고리 선택 → 문서 필터링
const selectedCategoryIds = computed(() => (docSelectedCategoryId.value ? [docSelectedCategoryId.value] : []))

/** id로 categoryList 원본 노드 찾기 — 필터 트리와 참조가 달라도 펼침 상태가 스토어에만 반영되도록 */
const findCategoryNodeById = (items: CategoryItem[], id: string): CategoryItem | null => {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children?.length) {
      const found = findCategoryNodeById(item.children, id)
      if (found) return found
    }
  }
  return null
}

const onCategorySelect = (item: CategoryItem) => {
  // 자식 있는 카테고리 → 펼치기/접기만
  if (item.children?.length) {
    const node = findCategoryNodeById(categoryList.value, item.id)
    if (node?.children?.length) node.expanded = !node.expanded
    return
  }
  // 리프 카테고리 → 선택 토글 (같은 거 다시 클릭하면 해제)
  if (docSelectedCategoryId.value === item.id) {
    docSelectedCategoryId.value = ''
  } else {
    docSelectedCategoryId.value = item.id
  }
  docCurrentPage.value = 1
  handleSelectDocumentList()
}

const toggleExpand = (item: CategoryItem) => {
  if (!item?.children?.length) return
  const node = findCategoryNodeById(categoryList.value, item.id)
  if (node?.children?.length) node.expanded = !node.expanded
}

/** 카테고리 입력란에 포커스 (드롭다운 닫힌 뒤 DOM 갱신 이후 실행 권장) */
const focusCategoryInputField = () => {
  nextTick(() => {
    nextTick(() => categoryInputRef.value?.focus())
  })
}

const toggleCategoryInput = () => {
  isCategoryInputVisible.value = !isCategoryInputVisible.value
  if (!isCategoryInputVisible.value) {
    categoryInputValue.value = ''
    categoryInputParentId.value = null
  } else {
    categoryInputParentId.value = null
    focusCategoryInputField()
  }
}

const onCategoryInputEnter = async () => {
  if (!categoryInputValue.value.trim()) return
  const name = categoryInputValue.value.trim()
  const parentId = categoryInputParentId.value
  const wasSubcategory = parentId != null
  await handleSaveCategory({
    name,
    parentId: parentId ?? null,
  })
  categoryInputValue.value = ''
  categoryInputParentId.value = null
  // 하위 추가 플로우만 입력란 닫기 (+ 버튼으로 연 최상위 추가는 연속 입력 가능)
  if (wasSubcategory) isCategoryInputVisible.value = false
}

const startCategoryRename = (item: CategoryItem) => {
  editingCategoryId.value = item.id
  editingName.value = item.name
}

const saveCategoryRename = async () => {
  if (editingCategoryId.value && editingName.value.trim()) {
    await handleRenameCategory(editingCategoryId.value, editingName.value.trim())
  }
  editingCategoryId.value = null
}

const onCategoryMenuSelect = async (value: string, cat: CategoryItem) => {
  if (value === 'rename') {
    startCategoryRename(cat)
  } else if (value === 'addSubcategory') {
    categoryInputParentId.value = cat.id
    isCategoryInputVisible.value = true
    categoryInputValue.value = ''
    focusCategoryInputField()
  } else if (value === 'delete') {
    const confirmed = await openConfirm({
      title: '카테고리 삭제',
      message: `'${cat.name}' 카테고리를 삭제하시겠습니까?\n하위 카테고리도 함께 삭제됩니다.`,
    })
    if (confirmed) await handleDeleteCategory(cat.id)
  }
}

const openCategorySelectModal = () => {
  isCategorySelectModalOpen.value = true
}
const onCategorySelectConfirm = (selectedIds: string[]) => {
  visibleCategoryIds.value = selectedIds
  // 선택 중이던 카테고리가 필터에서 빠졌으면 해제
  if (docSelectedCategoryId.value && !selectedIds.includes(docSelectedCategoryId.value) && selectedIds.length > 0) {
    docSelectedCategoryId.value = ''
    docCurrentPage.value = 1
    handleSelectDocumentList()
  }
}

// ===== 테이블 =====
const tableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'documentName', label: '문서명', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'fileSize', label: '파일크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'registerDate', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'status', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'ragCount', label: 'RAG 사용', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 정렬 (프론트 정렬)
type SortKey = 'documentName' | 'fileSize' | 'registerDate'
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
    const va = (a as any)[key] as string
    const vb = (b as any)[key] as string
    return dir * (va === vb ? 0 : va < vb ? -1 : 1)
  })
})

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
    selectedIds.value = documentList.value.map((r) => r.id)
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
const onSaveDocument = async (data: Record<string, any>) => {
  await handleSaveDocument({
    documentName: data.title,
    categoryId: data.categoryId,
  })
  openToast({ message: `'${data.title}' 문서가 등록되었습니다.` })
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

const onRowActionSelect = async (value: string, row: Record<string, any>) => {
  if (value === 'delete') {
    const confirmed = await openConfirm({
      title: '문서 삭제',
      message: `'${row.documentName}'을(를) 삭제하시겠습니까?`,
    })
    if (confirmed) {
      await handleDeleteDocument([row.id])
      selectedIds.value = selectedIds.value.filter((id) => id !== row.id)
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

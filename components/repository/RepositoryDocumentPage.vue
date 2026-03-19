<template>
  <div class="repository-document-tab">
    <!-- 검색·필터·문서 등록 (문서 관리 탭용) -->
    <div class="document-toolbar flex flex-wrap items-center">
      <UiInput
        v-model="searchKeyword"
        type="search"
        placeholder="문서명, 내용으로 검색..."
        class="document-search-input"
        @search="onSearch"
        @enter="onSearch"
      />
      <UiButton
        variant="line-secondary"
        size="md"
        class="ui-button-outline-muted document-filter-select"
        @click="openCategorySelectModal"
      >
        전체 카테고리
      </UiButton>
      <UiSelect
        v-model="selectedStatusFilter"
        :options="statusFilterOptions"
        placeholder="전체 상태"
        size="md"
        class="document-filter-select"
      />
      <UiButton
        variant="primary"
        size="md"
        @click="onSearch"
      >
        검색
      </UiButton>
      <UiButton
        variant="outline"
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
          <span class="category-panel-title">카테고리</span>
          <UiButton
            icon-only
            variant="ghost"
            size="sm"
            class="btn-add-category"
          >
            <template #icon-left>
              <i class="icon icon-plus-medium size-16" />
            </template>
          </UiButton>
        </div>
        <div class="category-tree-wrap">
          <ul class="category-tree">
            <CategoryTreeNode
              v-for="cat in categoryList"
              :key="cat.id"
              :item="cat"
              :depth="1"
              :editing-category-id="editingCategoryId"
              :editing-name="editingName"
              :menu-items="categoryMenuItems"
              @toggle="toggleExpand"
              @menu-select="onCategoryMenuSelect"
              @update:editing-name="editingName = $event"
              @save-rename="saveCategoryRename"
            />
          </ul>
        </div>
        <div
          v-if="isCategoryInputVisible"
          class="category-input-wrap"
        >
          <UiInput
            v-model="categoryInputValue"
            placeholder="카테고리명 입력(엔터)"
            size="sm"
            @keydown.enter="onCategoryInputEnter"
          />
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
            max-height="calc(100vh - 303px)"
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
          v-model="currentPage"
          :total-count="totalCount"
          :page-size="pageSize"
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
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'
import type { CategoryItem } from '~/types/repository'
import CategorySelectModal from '~/components/repository/CategorySelectModal.vue'

// 문서 검색·필터 (SelectItem value는 빈 문자열 불가 — 'all' 사용)
const searchKeyword = ref('')
const selectedStatusFilter = ref('all')
const statusFilterOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

// 카테고리 (퍼블/토글용)
const isCategoryInputVisible = ref(false)
const isCategorySelectModalOpen = ref(false)
const categoryInputValue = ref('')
// 카테고리 이름 인라인 수정
const editingCategoryId = ref<string | null>(null)
const editingName = ref('')

function getCategoryById(id: string, items?: CategoryItem[]): CategoryItem | undefined {
  const list = items ?? categoryList.value
  for (const item of list) {
    if (item.id === id) return item
    const found = getCategoryById(id, item.children)
    if (found) return found
  }
  return undefined
}

function saveCategoryRename() {
  if (editingCategoryId.value) {
    const target = getCategoryById(editingCategoryId.value)
    if (target && editingName.value.trim()) target.name = editingName.value.trim()
    editingCategoryId.value = null
  }
}

// 🔽 퍼블용 더미 — 4depth 시안 구조. 백엔드 연결 시 API로 교체
const categoryList = ref<CategoryItem[]>([
  {
    id: 'cat-doc-1',
    name: '1depth 카테고리명 길이 테스트 테스트 테스트',
    expanded: false,
    children: [
      {
        id: 'cat-doc-1-1',
        name: '2depth 카테고리명 길이 테스트 테스트 테스트',
        expanded: false,
        children: [
          {
            id: 'cat-doc-1-1-1',
            name: '3depth 카테고리명 길이 테스트 테스트 테스트',
            expanded: false,
            children: [{ id: 'cat-doc-1-1-1-1', name: '4depth 카테고리명 길이 테스트 테스트 테스트' }],
          },
        ],
      },
    ],
  },
])
const categoryMenuItems = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '카테고리 삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 테이블 컬럼
const tableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'documentName', label: '문서명', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'fileSize', label: '파일크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'registerDate', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'status', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'ragCount', label: 'RAG 사용', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 정렬
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

// 🔽 퍼블용 더미 데이터 — 백엔드 연결 시 API로 교체
const documentList = ref([
  {
    id: '1',
    documentName: 'ERP시스템_사용자매뉴얼.pdf',
    fileType: 'pdf',
    fileSize: '2.4MB',
    registerDate: '2025.01.02',
    status: '활성',
    ragCount: 5,
  },
  {
    id: '2',
    documentName: '개인정보처리방침.txt',
    fileType: 'txt',
    fileSize: '128KB',
    registerDate: '2025.01.01',
    status: '활성',
    ragCount: 2,
  },
  {
    id: '3',
    documentName: '제안서_초안.doc',
    fileType: 'doc',
    fileSize: '1.1MB',
    registerDate: '2024.12.28',
    status: '활성',
    ragCount: 1,
  },
])

// 퍼블용 문자열 정렬입니다. 실제 연동 시 fileSize/registerDate는 원시값(숫자·Date) 기준 정렬 필요
const sortedDocumentList = computed(() => {
  const list = [...documentList.value]
  const key = sortKey.value
  if (!key) return list
  const dir = sortOrder.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = a[key] as string
    const vb = b[key] as string
    return dir * (va === vb ? 0 : va < vb ? -1 : 1)
  })
})

const rowActionItems = [
  { label: '미리보기', value: 'preview', icon: 'icon-view' },
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 선택 — 퍼블용: 현재 보이는 목록(전체 documentList) 기준 전체 선택/해제. 실제 연동 시 페이지네이션 적용 시 '현재 페이지' vs '전체' 정책 결정 필요
const selectedIds = ref<string[]>([])
const isAllSelected = computed(
  () => documentList.value.length > 0 && selectedIds.value.length === documentList.value.length,
)
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = documentList.value.map((r: { id: string }) => r.id)
  }
}
const toggleSelectRow = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((x: string) => x !== id)
  }
}

// 페이지네이션 (🔽 퍼블용 — API 연동 시 totalCount/currentPage는 서버 기준으로 교체)
const totalCount = ref(166)
const currentPage = ref(1)
const pageSize = 10

const toggleExpand = (item: CategoryItem) => {
  if (item?.children?.length) item.expanded = !item.expanded
}

const startCategoryRename = (item: CategoryItem) => {
  editingCategoryId.value = item.id
  editingName.value = item.name
}

const openCategorySelectModal = () => {
  isCategorySelectModalOpen.value = true
}
// 추후 API 연동: 모달에서 선택한 카테고리 반영
const onCategorySelectConfirm = () => {}
const onCategoryInputEnter = () => {
  if (categoryInputValue.value.trim()) {
    categoryList.value.push({
      id: `cat-doc-new-${Date.now()}`,
      name: categoryInputValue.value.trim(),
      children: [],
    })
    categoryInputValue.value = ''
  }
}

// 문서 아이콘 (퍼블용)
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

// 액션 핸들러 — 퍼블용 placeholder. 추후 API/라우팅 연결
const onCategoryMenuSelect = (value: string, cat: CategoryItem) => {
  if (value === 'rename') startCategoryRename(cat)
}
const onSearch = () => {}
const onRegisterDocument = () => {}
const onBatchDownload = () => {}
const onBatchDelete = () => {}
const onRowActionSelect = (_value: string, _row: Record<string, unknown>) => {}
</script>

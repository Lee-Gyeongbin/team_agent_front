<template>
  <div class="repository-index">
    <!-- 탭 -->
    <UiTab
      v-model="activeTab"
      :tabs="tabItems"
    />

    <!-- 메인: 카테고리 + 문서 영역 -->
    <div class="repository-main l-center">
      <!-- 검색·필터·문서 등록 -->
      <div class="document-toolbar flex flex-wrap items-center">
        <UiInput
          v-model="searchKeyword"
          type="search"
          placeholder="문서명, 내용으로 검색..."
          class="document-search-input"
          @search="onSearch"
          @enter="onSearch"
        />
        <UiSelect
          v-model="selectedCategoryFilter"
          :options="categoryFilterOptions"
          placeholder="전체 카테고리"
          size="md"
          class="document-filter-select"
        />
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
              @click="openCategorySelectModal"
            >
              <template #icon-left>
                <i class="icon icon-plus-medium size-16" />
              </template>
            </UiButton>
          </div>
          <div class="category-tree-wrap">
            <ul class="category-tree">
              <li
                v-for="(cat, idx) in categoryList"
                :key="idx"
                class="category-item"
                :class="{ 'has-children': cat.children?.length }"
              >
                <div class="category-row flex items-center">
                  <button
                    v-if="cat.children?.length"
                    type="button"
                    class="category-toggle"
                    :aria-expanded="cat.expanded"
                    @click="toggleCategoryExpand(idx)"
                  >
                    <i
                      class="icon icon-chevron-down size-16"
                      :class="{ 'is-expanded': cat.expanded }"
                    />
                  </button>
                  <span
                    v-else
                    class="category-toggle-placeholder"
                  />
                  <UiCheckbox
                    v-model="cat.checked"
                    class="category-checkbox"
                  />
                  <span class="category-name">{{ cat.name }}</span>
                  <UiDropdownMenu
                    :items="categoryMenuItems"
                    align="end"
                    @select="(value) => onCategoryMenuSelect(value, cat)"
                  >
                    <template #trigger>
                      <UiButton
                        icon-only
                        variant="ghost"
                        size="xs"
                        class="btn-category-more"
                        @click.stop
                      >
                        <template #icon-left>
                          <i class="icon icon-add-dot size-16" />
                        </template>
                      </UiButton>
                    </template>
                  </UiDropdownMenu>
                </div>
                <ul
                  v-if="cat.children?.length && cat.expanded"
                  class="category-children"
                >
                  <li
                    v-for="(child, cIdx) in cat.children"
                    :key="cIdx"
                    class="category-item"
                  >
                    <div class="category-row flex items-center">
                      <span class="category-toggle-placeholder" />
                      <UiCheckbox
                        v-model="child.checked"
                        class="category-checkbox"
                      />
                      <span class="category-name">{{ child.name }}</span>
                      <UiDropdownMenu
                        :items="categoryMenuItems"
                        align="end"
                        @select="(value) => onCategoryMenuSelect(value, child)"
                      >
                        <template #trigger>
                          <UiButton
                            icon-only
                            variant="ghost"
                            size="xs"
                            class="btn-category-more"
                            @click.stop
                          >
                            <template #icon-left>
                              <i class="icon icon-add-dot size-16" />
                            </template>
                          </UiButton>
                        </template>
                      </UiDropdownMenu>
                    </div>
                  </li>
                </ul>
              </li>
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
          <!-- 일괄 처리 바 -->
          <div class="document-batch-bar flex items-center">
            <span class="batch-count">{{ selectedIds.length }}개 선택됨</span>
            <UiButton
              variant="outline"
              size="xxs"
              class="batch-bar-btn"
              @click="onBatchDownload"
            >
              일괄 다운로드
            </UiButton>
            <UiButton
              variant="outline"
              size="xxs"
              class="batch-bar-btn type-danger"
              @click="onBatchDelete"
            >
              일괄 삭제
            </UiButton>
          </div>

          <!-- 문서 테이블 -->
          <div class="document-table-wrap">
            <UiTable
              :columns="tableColumns"
              :data="sortedDocumentList"
              sticky-header
              max-height="calc(100vh - 380px)"
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
                  class="badge-status is-active"
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
                          <i class="icon icon-add-dot size-16" />
                        </template>
                      </UiButton>
                    </template>
                  </UiDropdownMenu>
                </div>
              </template>
            </UiTable>
          </div>

          <!-- 페이지네이션 -->
          <div class="document-pagination flex items-center justify-between">
            <span class="pagination-total">총 {{ totalCount }}개 문서</span>
            <div class="pagination-controls flex items-center">
              <button
                type="button"
                class="pagination-btn"
                :disabled="currentPage <= 1"
                @click="currentPage = Math.max(1, currentPage - 1)"
              >
                이전
              </button>
              <div class="pagination-pages flex items-center">
                <button
                  v-for="p in visiblePages"
                  :key="p"
                  type="button"
                  class="pagination-page"
                  :class="{ 'is-active': p === currentPage }"
                  @click="currentPage = p"
                >
                  {{ p }}
                </button>
              </div>
              <button
                type="button"
                class="pagination-btn"
                :disabled="currentPage >= totalPages"
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
              >
                다음
              </button>
            </div>
            <span class="pagination-range">{{ pageStart }}-{{ pageEnd }}/{{ totalCount }}</span>
          </div>
        </section>
      </div>
    </div>

    <!-- 카테고리 선택 모달 (components/repository/CategorySelectModal.vue, pathPrefix: false → CategorySelectModal) -->
    <CategorySelectModal
      :is-open="isCategorySelectModalOpen"
      @close="isCategorySelectModalOpen = false"
      @confirm="onCategorySelectConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types/table'

definePageMeta({ layout: 'default' })

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
const activeTab = ref('document')
const tabItems = [
  { label: '문서 관리', value: 'document' },
  { label: 'URL 관리', value: 'url' },
]

// 카테고리 (퍼블/토글용)
const isCategoryInputVisible = ref(false)
const isCategorySelectModalOpen = ref(false)
const categoryInputValue = ref('')
const categoryList = ref([
  {
    name: '1depth 카테고리명임',
    checked: false,
    expanded: true,
    children: [
      { name: '2depth 카테고리명임', checked: false },
      { name: '3depth 카테고...', checked: false },
      { name: '4depth 카테고...', checked: false },
    ],
  },
])
const categoryMenuItems = [
  { label: '이름 수정', value: 'rename', icon: 'icon-edit' },
  { label: '카테고리 삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 문서 검색·필터 (SelectItem value는 빈 문자열 불가 — 'all' 사용)
const searchKeyword = ref('')
const selectedCategoryFilter = ref('all')
const selectedStatusFilter = ref('all')
const categoryFilterOptions = [
  { label: '전체 카테고리', value: 'all' },
  { label: '1depth 카테고리명임', value: 'cat1' },
]
const statusFilterOptions = [
  { label: '전체 상태', value: 'all' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

// 테이블 컬럼 (헤더는 상단 슬롯에서 버튼으로 렌더)
const tableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  { key: 'documentName', label: '문서명', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'fileSize', label: '파일크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'registerDate', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'status', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'ragCount', label: 'RAG 사용', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 정렬 (문서명, 파일크기, 등록일 버튼 클릭 시 오름차순/내림차순 전환)
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
    const va = a[key] as string
    const vb = b[key] as string
    return dir * (va === vb ? 0 : va < vb ? -1 : 1)
  })
})

// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
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

const rowActionItems = [
  { label: '미리보기', value: 'preview', icon: 'icon-view' },
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

// 선택 (토글용)
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

// 페이지네이션 (퍼블용)
const totalCount = ref(166)
const currentPage = ref(1)
const pageSize = 10
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))
const pageStart = computed(() => (currentPage.value - 1) * pageSize + 1)
const pageEnd = computed(() => Math.min(currentPage.value * pageSize, totalCount.value))
const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  const pages: number[] = []
  let start = Math.max(1, cur - 2)
  let end = Math.min(total, cur + 2)
  if (end - start < 4) {
    if (start === 1) end = Math.min(total, 5)
    else end = Math.min(total, start + 4)
    start = Math.max(1, end - 4)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// 카테고리 토글
const toggleCategoryExpand = (idx: number) => {
  const cat = categoryList.value[idx]
  if (cat?.children?.length) cat.expanded = !cat.expanded
}
const openCategorySelectModal = () => {
  isCategorySelectModalOpen.value = true
}
const onCategorySelectConfirm = () => {
  // 모달에서 선택한 카테고리 반영 — 추후 API 연동 시 구현
}
const onCategoryInputEnter = () => {
  if (categoryInputValue.value.trim()) {
    categoryList.value.push({
      name: categoryInputValue.value.trim(),
      checked: false,
      expanded: false,
      children: [],
    })
    categoryInputValue.value = ''
  }
}

// 문서 아이콘 (퍼블용 — 파일 타입별 클래스/아이콘)
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

// 액션 핸들러 (퍼블 — 추후 개발자 연결)
const onCategoryMenuSelect = (_value: string, _cat: { name: string }) => {}
const onSearch = () => {}
const onRegisterDocument = () => {}
const onBatchDownload = () => {}
const onBatchDelete = () => {}
const onRowActionSelect = (_value: string, _row: Record<string, unknown>) => {}
</script>

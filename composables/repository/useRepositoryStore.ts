import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { CategoryItem, Document, UrlItem } from '~/types/repository'

const {
  fetchCategoryList,
  fetchSaveCategory,
  fetchRenameCategory,
  fetchDeleteCategory,
  fetchDocumentList,
  fetchSaveDocument,
  fetchDeleteDocument,
  fetchUrlList,
  fetchSaveUrl,
  fetchDeleteUrl,
  fetchToggleUrlStatus,
} = useRepositoryApi()

// ===== 카테고리 상태 =====
const categoryList = ref<CategoryItem[]>([])
// 모달에서 선택한 카테고리 ID 목록 (빈 배열 = 전체 표시)
const visibleCategoryIds = ref<string[]>([])

// 좌측 패널에 표시할 카테고리 (ref로 유지 — 객체 참조 보존하여 expanded 토글 가능)
const filteredCategoryList = ref<CategoryItem[]>([])

function buildFilteredTree(items: CategoryItem[], ids: string[]): CategoryItem[] {
  return items.reduce<CategoryItem[]>((acc, item) => {
    const filteredChildren = item.children ? buildFilteredTree(item.children, ids) : []
    if (ids.includes(item.id) || filteredChildren.length > 0) {
      acc.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children })
    }
    return acc
  }, [])
}

function updateFilteredCategoryList() {
  if (visibleCategoryIds.value.length === 0) {
    filteredCategoryList.value = categoryList.value
  } else {
    filteredCategoryList.value = buildFilteredTree(categoryList.value, visibleCategoryIds.value)
  }
}

// categoryList 또는 visibleCategoryIds 변경 시 갱신
watch([categoryList, visibleCategoryIds], () => updateFilteredCategoryList(), { immediate: true })

// ===== 문서 상태 =====
const documentList = ref<Document[]>([])
const docTotalCount = ref(0)
const docSearchKeyword = ref('')
const docStatusFilter = ref('all')
const docSelectedCategoryId = ref('')
const docCurrentPage = ref(1)
const docPageSize = 10

// ===== URL 상태 =====
const urlList = ref<UrlItem[]>([])
const urlTotalCount = ref(0)
const urlSearchKeyword = ref('')
const urlStatusFilter = ref('all')
const urlCategoryFilter = ref('all')
const urlCurrentPage = ref(1)
const urlPageSize = 10

// ===== 카테고리 액션 =====
const handleSelectCategoryList = async () => {
  const res = await fetchCategoryList()
  categoryList.value = res.list
}

const handleSaveCategory = async (data: { id?: string; name: string; parentId?: string | null }) => {
  await fetchSaveCategory(data)
  await handleSelectCategoryList()
}

const handleRenameCategory = async (id: string, name: string) => {
  await fetchRenameCategory(id, name)
  await handleSelectCategoryList()
}

const handleDeleteCategory = async (id: string) => {
  await fetchDeleteCategory(id)
  await handleSelectCategoryList()
}

// 선택한 카테고리 + 모든 자손 ID 수집
function collectDescendantIds(items: CategoryItem[], targetId: string): string[] {
  const ids: string[] = []
  const collect = (list: CategoryItem[]) => {
    for (const item of list) {
      ids.push(item.id)
      if (item.children?.length) collect(item.children)
    }
  }
  // targetId에 해당하는 노드 찾기
  const findAndCollect = (list: CategoryItem[]): boolean => {
    for (const item of list) {
      if (item.id === targetId) {
        ids.push(item.id)
        if (item.children?.length) collect(item.children)
        return true
      }
      if (item.children?.length && findAndCollect(item.children)) return true
    }
    return false
  }
  findAndCollect(items)
  return ids
}

// ===== 문서 액션 =====
const handleSelectDocumentList = async () => {
  // 선택한 카테고리의 하위 카테고리까지 포함
  let categoryIds: string[] | undefined
  if (docSelectedCategoryId.value) {
    categoryIds = collectDescendantIds(categoryList.value, docSelectedCategoryId.value)
  }
  const res = await fetchDocumentList({
    keyword: docSearchKeyword.value || undefined,
    status: docStatusFilter.value,
    categoryIds,
    page: docCurrentPage.value,
    pageSize: docPageSize,
  })
  documentList.value = res.list
  docTotalCount.value = res.total
}

const handleSaveDocument = async (data: Partial<Document>) => {
  await fetchSaveDocument(data)
  await handleSelectDocumentList()
}

const handleDeleteDocument = async (ids: string[]) => {
  await fetchDeleteDocument(ids)
  await handleSelectDocumentList()
}

// ===== URL 액션 =====
const handleSelectUrlList = async () => {
  const res = await fetchUrlList({
    keyword: urlSearchKeyword.value || undefined,
    status: urlStatusFilter.value,
    category: urlCategoryFilter.value,
    page: urlCurrentPage.value,
    pageSize: urlPageSize,
  })
  urlList.value = res.list
  urlTotalCount.value = res.total
}

const handleSaveUrl = async (data: Partial<UrlItem>) => {
  await fetchSaveUrl(data)
  await handleSelectUrlList()
}

const handleDeleteUrl = async (ids: string[]) => {
  await fetchDeleteUrl(ids)
  await handleSelectUrlList()
}

const handleToggleUrlStatus = async (id: string, active: boolean) => {
  await fetchToggleUrlStatus(id, active)
  await handleSelectUrlList()
}

export const useRepositoryStore = () => {
  return {
    // 카테고리
    categoryList,
    filteredCategoryList,
    visibleCategoryIds,
    handleSelectCategoryList,
    handleSaveCategory,
    handleRenameCategory,
    handleDeleteCategory,
    // 문서
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
    // URL
    urlList,
    urlTotalCount,
    urlSearchKeyword,
    urlStatusFilter,
    urlCategoryFilter,
    urlCurrentPage,
    urlPageSize,
    handleSelectUrlList,
    handleSaveUrl,
    handleDeleteUrl,
    handleToggleUrlStatus,
  }
}

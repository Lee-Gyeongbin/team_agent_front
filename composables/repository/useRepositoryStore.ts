import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { Document, UrlItem } from '~/types/repository'

const {
  fetchDocumentList,
  fetchSaveDocument,
  fetchDeleteDocument,
  fetchUrlList,
  fetchSaveUrl,
  fetchDeleteUrl,
  fetchToggleUrlStatus,
} = useRepositoryApi()

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

// ===== 문서 액션 =====
const handleSelectDocumentList = async () => {
  const findContent = docSearchKeyword.value || undefined
  const categoryId = docSelectedCategoryId.value || undefined
  const res = await fetchDocumentList(findContent, categoryId)
  documentList.value = res.dataList
  docTotalCount.value = res.totalCount
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

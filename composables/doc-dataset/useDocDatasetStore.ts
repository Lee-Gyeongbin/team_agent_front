import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type {
  DocDataset,
  DocDatasetDetail,
  DocDatasetSelectResponse,
  DocDatasetSavePayload,
  DocDatasetSummary,
  DocDatasetHistory,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
} from '~/types/doc-dataset'

const {
  fetchDocDatasetList,
  fetchDocDatasetSummary,
  fetchDocDataset,
  fetchSaveDocDataset,
  fetchDeleteDocDataset,
  fetchToggleActiveDocDataset,
  fetchDocDatasetHistoryList,
  fetchSaveDocDatasetHistory,
  fetchDeleteDocDatasetHistory,
  fetchSearchDocDataset,
} = useDocDatasetApi()

// ===== 상태 변수 =====
const datasetList = ref<DocDataset[]>([])
const summary = ref<DocDatasetSummary>({
  totalDatasetCount: 0,
  activeDatasetCount: 0,
  inactiveDatasetCount: 0,
  totalVectorCount: 0,
  avgSearchQuality: 0,
  totalSourceCount: 0,
  totalDocCount: 0,
  totalUrlCount: 0,
})
const selectedDatasetDetail = ref<DocDatasetDetail | null>(null)
const selectedDatasetCategoryList = ref<DocDatasetSelectResponse['categoryList']>([])
const selectedDatasetDocList = ref<DocDatasetSelectResponse['docList']>([])
const selectedDatasetUrlList = ref<DocDatasetSelectResponse['urlList']>([])

/** 목록 조회 */
const handleSelectDocDatasetList = async () => {
  const res = await fetchDocDatasetList()
  datasetList.value = res.dataList
}

/** 요약 조회 */
const handleSelectDocDatasetSummary = async () => {
  const res = await fetchDocDatasetSummary()
  summary.value = res.data
}

/** 목록 + 요약 동시 조회 */
const handleSelectAll = async () => {
  await Promise.all([handleSelectDocDatasetList(), handleSelectDocDatasetSummary()])
}

// ===== 추가/수정/삭제 =====
const handleSelectDocDataset = async (datasetId: string) => {
  const res = await fetchDocDataset(datasetId)
  selectedDatasetDetail.value = res.data
  selectedDatasetCategoryList.value = res.categoryList ?? []
  selectedDatasetDocList.value = res.docList ?? []
  selectedDatasetUrlList.value = res.urlList ?? []
  return res
}

const handleSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
  await fetchSaveDocDataset(dataset)
  await handleSelectAll()
}

const handleDeleteDocDataset = async (id: string) => {
  await fetchDeleteDocDataset(id)
  await handleSelectAll()
}

const handleToggleActiveDocDataset = async (id: string) => {
  await fetchToggleActiveDocDataset(id)
  await handleSelectAll()
}

// ===== 변경이력 =====
const historyList = ref<DocDatasetHistory[]>([])
const historyTotalCount = ref(0)
const historyPage = ref(1)
const historyPageSize = 5

const handleSelectDocDatasetHistoryList = async (datasetId: string, page: number = 1) => {
  historyPage.value = page
  const res = await fetchDocDatasetHistoryList(datasetId, page, historyPageSize)
  historyList.value = res.list
  historyTotalCount.value = res.totalCount
}

const handleSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
  await fetchSaveDocDatasetHistory(history)
  // 저장 후 첫 페이지로 이동하여 새 이력 표시
  await handleSelectDocDatasetHistoryList(history.datasetId, 1)
}

const handleDeleteDocDatasetHistory = async (id: string, datasetId: string) => {
  await fetchDeleteDocDatasetHistory(id)
  await handleSelectDocDatasetHistoryList(datasetId, historyPage.value)
}

// ===== 검색 테스트 =====
const searchResults = ref<DocDatasetSearchResult[]>([])
const searchSummary = ref<DocDatasetSearchSummary>({ totalChunks: 0, avgSimilarity: 0 })
const isSearching = ref(false)

const handleSearchDocDataset = async (params: {
  datasetId: string
  query: string
  topK?: number
  threshold?: number
  rerank?: string
}) => {
  isSearching.value = true
  searchResults.value = []
  searchSummary.value = { totalChunks: 0, avgSimilarity: 0 }
  try {
    const res = await fetchSearchDocDataset(params)
    searchResults.value = res.data.results
    searchSummary.value = res.data.summary
  } finally {
    isSearching.value = false
  }
}

const resetSearchResults = () => {
  searchResults.value = []
  searchSummary.value = { totalChunks: 0, avgSimilarity: 0 }
}

export const useDocDatasetStore = () => {
  return {
    datasetList,
    summary,
    selectedDatasetDetail,
    selectedDatasetCategoryList,
    handleSelectAll,
    handleSelectDocDataset,
    handleSaveDocDataset,
    handleDeleteDocDataset,
    handleToggleActiveDocDataset,
    // 변경이력
    historyList,
    historyTotalCount,
    historyPage,
    historyPageSize,
    handleSelectDocDatasetHistoryList,
    handleSaveDocDatasetHistory,
    handleDeleteDocDatasetHistory,
    // 검색 테스트
    searchResults,
    searchSummary,
    isSearching,
    handleSearchDocDataset,
    resetSearchResults,
    selectedDatasetDocList,
    selectedDatasetUrlList,
  }
}

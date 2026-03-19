import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type {
  DocDataset,
  DocDatasetSummary,
  DocDatasetHistory,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
} from '~/types/doc-dataset'

const {
  fetchDocDatasetList,
  fetchDocDatasetSummary,
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
  totalCount: 0,
  activeCount: 0,
  inactiveCount: 0,
  totalVectors: '0',
  avgSearchQuality: 0,
  totalDocuments: 0,
  totalUrls: 0,
})

// ===== 조회 =====
const handleSelectDocDatasetList = async () => {
  const res = await fetchDocDatasetList()
  datasetList.value = res.list
}

const handleSelectDocDatasetSummary = async () => {
  const res = await fetchDocDatasetSummary()
  summary.value = res.data
}

/** 목록 + 요약 동시 조회 */
const handleSelectAll = async () => {
  await Promise.all([handleSelectDocDatasetList(), handleSelectDocDatasetSummary()])
}

// ===== 추가/수정/삭제 =====
const handleSaveDocDataset = async (dataset: Partial<DocDataset>) => {
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
    handleSelectAll,
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
  }
}

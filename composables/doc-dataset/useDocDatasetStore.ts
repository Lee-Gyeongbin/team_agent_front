import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type { DocDataset, DocDatasetSummary, DocDatasetHistory } from '~/types/doc-dataset'

const {
  fetchDocDatasetList,
  fetchDocDatasetSummary,
  fetchSaveDocDataset,
  fetchDeleteDocDataset,
  fetchToggleActiveDocDataset,
  fetchDocDatasetHistoryList,
  fetchSaveDocDatasetHistory,
  fetchDeleteDocDatasetHistory,
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
  }
}

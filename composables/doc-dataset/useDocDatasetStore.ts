import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type { DocDataset, DocDatasetSummary } from '~/types/doc-dataset'

const {
  fetchDocDatasetList,
  fetchDocDatasetSummary,
  fetchSaveDocDataset,
  fetchDeleteDocDataset,
  fetchToggleActiveDocDataset,
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

export const useDocDatasetStore = () => {
  return {
    datasetList,
    summary,
    handleSelectAll,
    handleSaveDocDataset,
    handleDeleteDocDataset,
    handleToggleActiveDocDataset,
  }
}

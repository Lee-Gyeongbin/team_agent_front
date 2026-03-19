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
import { useApi } from '~/composables/com/useApi'

// 🔽 Mock — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/doc-dataset'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useDocDatasetApi = () => {
  const { post } = useApi()

  // ===== 문서 데이터셋 =====
  const fetchDocDatasetList = async () => {
    return post<{ dataList: DocDataset[] }>('/dataset/selectDatasetList.do', {})
  }

  const fetchDocDatasetSummary = async () => {
    return post<{ data: DocDatasetSummary }>('/dataset/selectDatasetSummary.do', {})
  }

  const fetchDocDataset = async (datasetId: string) => {
    return post<DocDatasetSelectResponse>('/dataset/selectDataset.do', { datasetId })
  }

  const fetchSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
    return post<{ data: DocDatasetDetail }>('/dataset/save.do', dataset)
  }

  const fetchDeleteDocDataset = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  const fetchToggleActiveDocDataset = async (id: string) => {
    return mockPost<{ data: DocDataset }>(`${MOCK_BASE}/toggle-active`, { id })
  }

  // ===== 변경이력 =====
  const fetchDocDatasetHistoryList = async (datasetId: string, page: number = 1, pageSize: number = 5) => {
    return mockPost<{ list: DocDatasetHistory[]; totalCount: number }>(`${MOCK_BASE}/history/list`, {
      datasetId,
      page,
      pageSize,
    })
  }

  const fetchSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
    return mockPost<{ data: DocDatasetHistory }>(`${MOCK_BASE}/history/save`, history)
  }

  const fetchDeleteDocDatasetHistory = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/history/delete`, { id })
  }

  // ===== 검색 테스트 =====
  const fetchSearchDocDataset = async (params: {
    datasetId: string
    query: string
    topK?: number
    threshold?: number
    rerank?: string
  }) => {
    return mockPost<{
      data: { results: DocDatasetSearchResult[]; summary: DocDatasetSearchSummary }
    }>(`${MOCK_BASE}/search`, params)
  }

  return {
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
  }
}

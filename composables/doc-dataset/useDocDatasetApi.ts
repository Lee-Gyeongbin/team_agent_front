import type {
  DocDataset,
  DocDatasetSummary,
  DocDatasetHistory,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
  DocFile,
  DocUrl,
} from '~/types/doc-dataset'

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
  // ===== 문서 데이터셋 =====
  const fetchDocDatasetList = async () => {
    return mockPost<{ list: DocDataset[] }>(`${MOCK_BASE}/list`, {})
  }

  const fetchDocDatasetSummary = async () => {
    return mockPost<{ data: DocDatasetSummary }>(`${MOCK_BASE}/summary`, {})
  }

  const fetchSaveDocDataset = async (dataset: Partial<DocDataset>) => {
    return mockPost<{ data: DocDataset }>(`${MOCK_BASE}/save`, dataset)
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

  // ===== 데이터 소스 =====
  const fetchDocFileList = async () => {
    return mockPost<{ list: DocFile[]; totalCount: number }>(`${MOCK_BASE}/source/doc-list`, {})
  }

  const fetchUrlList = async () => {
    return mockPost<{ list: DocUrl[]; totalCount: number }>(`${MOCK_BASE}/source/url-list`, {})
  }

  return {
    fetchDocDatasetList,
    fetchDocDatasetSummary,
    fetchSaveDocDataset,
    fetchDeleteDocDataset,
    fetchToggleActiveDocDataset,
    fetchDocDatasetHistoryList,
    fetchSaveDocDatasetHistory,
    fetchDeleteDocDatasetHistory,
    fetchSearchDocDataset,
    fetchDocFileList,
    fetchUrlList,
  }
}

import type { DocDataset, DocDatasetSummary } from '~/types/doc-dataset'

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

  return {
    fetchDocDatasetList,
    fetchDocDatasetSummary,
    fetchSaveDocDataset,
    fetchDeleteDocDataset,
    fetchToggleActiveDocDataset,
  }
}

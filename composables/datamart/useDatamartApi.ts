import type { Datamart, DatamartSummary } from '~/types/datamart'

// 🔽 Mock — 백엔드 API 완성 시 useApi 패턴으로 교체
const MOCK_BASE = '/mock/datamart'

const mockPost = async <T>(url: string, body: unknown = {}): Promise<T> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const useDatamartApi = () => {
  // ===== 데이터마트 =====
  const fetchDatamartList = async () => {
    return mockPost<{ list: Datamart[] }>(`${MOCK_BASE}/list`, {})
  }

  const fetchDatamartSummary = async () => {
    return mockPost<{ data: DatamartSummary }>(`${MOCK_BASE}/summary`, {})
  }

  const fetchSaveDatamart = async (datamart: Partial<Datamart>) => {
    return mockPost<{ data: Datamart }>(`${MOCK_BASE}/save`, datamart)
  }

  const fetchDeleteDatamart = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  const fetchToggleActiveDatamart = async (id: string) => {
    return mockPost<{ data: Datamart }>(`${MOCK_BASE}/toggle-active`, { id })
  }

  const fetchTestConnection = async (id: string) => {
    return mockPost<{ data: { id: string; success: boolean; message: string } }>(`${MOCK_BASE}/test-connection`, { id })
  }

  return {
    fetchDatamartList,
    fetchDatamartSummary,
    fetchSaveDatamart,
    fetchDeleteDatamart,
    fetchToggleActiveDatamart,
    fetchTestConnection,
  }
}

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

  // ===== 데이터셋 목록 조회 =====
  const fetchDocDatasetList = async () => {
    return post<{ dataList: DocDataset[] }>('/dataset/selectDatasetList.do', {})
  }

  // ===== 데이터셋 요약 정보 조회 =====
  const fetchDocDatasetSummary = async () => {
    return post<{ data: DocDatasetSummary }>('/dataset/selectDatasetSummary.do', {})
  }

  // ===== 데이터셋 상세 조회 =====
  const fetchDocDataset = async (datasetId: string) => {
    return post<DocDatasetSelectResponse>('/dataset/selectDataset.do', { datasetId })
  }

  // ===== 데이터소스 목록 조회 =====
  const fetchDatasetSrcList = async (datasetId: string) => {
    return post<DocDatasetSelectResponse>('/dataset/selectDatasetSrcList.do', { datasetId })
  }

  // ===== 데이터셋 저장 =====
  const fetchSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
    return post<{ data: DocDatasetDetail }>('/dataset/save.do', dataset)
  }

  // ===== 데이터셋 삭제 =====
  const fetchDeleteDocDataset = async (id: string) => {
    return mockPost<{ data: { id: string } }>(`${MOCK_BASE}/delete`, { id })
  }

  // ===== 데이터셋 사용 여부(updateUseYn) — 응답 data는 DAO 영향 행 수(int) =====
  const fetchToggleActiveDocDataset = async (datasetId: string, useYn: string) => {
    return post<{ data: number }>('/dataset/updateUseYn.do', { datasetId, useYn })
  }

  // ===== 데이터셋 변경이력 목록 조회 =====
  const fetchDocDatasetHistoryList = async (datasetId: string, page: number = 1, pageSize: number = 5) => {
    return mockPost<{ list: DocDatasetHistory[]; totalCount: number }>(`${MOCK_BASE}/history/list`, {
      datasetId,
      page,
      pageSize,
    })
  }

  // ===== 데이터셋 변경이력 저장 =====
  const fetchSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
    return mockPost<{ data: DocDatasetHistory }>(`${MOCK_BASE}/history/save`, history)
  }

  // ===== 데이터셋 변경이력 삭제 =====
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
    fetchDatasetSrcList,
    fetchSaveDocDataset,
    fetchDeleteDocDataset,
    fetchToggleActiveDocDataset,
    fetchDocDatasetHistoryList,
    fetchSaveDocDatasetHistory,
    fetchDeleteDocDatasetHistory,
    fetchSearchDocDataset,
  }
}

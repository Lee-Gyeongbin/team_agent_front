import type {
  DocDataset,
  DocDatasetSelectResponse,
  DocDatasetSavePayload,
  DocDatasetSummary,
  DocDatasetHistory,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
  Prompt,
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
  const fetchDatasetSrcList = async () => {
    return post<DocDatasetSelectResponse>('/dataset/selectDatasetSrcList.do', {})
  }

  // ===== 데이터셋 저장 =====
  const fetchSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
    return post<{ data: number }>('/dataset/save.do', dataset)
  }

  // ===== 데이터셋 삭제 =====
  const fetchDeleteDocDataset = async (datasetId: string) => {
    return post<{ data: number }>('/dataset/deleteDataset.do', { datasetId })
  }

  // ===== 데이터셋 사용 여부(updateUseYn) =====
  const fetchToggleActiveDocDataset = async (datasetId: string, useYn: string, datasetBuildStatusCd: string) => {
    return post<{ data: number }>('/dataset/updateDataSetStatus.do', { datasetId, useYn, datasetBuildStatusCd })
  }

  // ===== 데이터셋 변경이력 목록 조회 =====
  const fetchDocDatasetHistoryList = async (datasetId: string, page: number = 1, pageSize: number = 5) => {
    return await post<{
      dataList?: DocDatasetHistory[]
      totalCnt?: number
    }>('/dataset/selectDsHistList.do', {
      datasetId,
      page,
      pageSize,
    })
  }

  // ===== 데이터셋 변경이력 저장 =====
  const fetchSaveDocDatasetHistory = async (history: { datasetId: string; verNo: string; chgContent: string }) => {
    return post<{ data: number }>('/dataset/saveDocDatasetHistory.do', history)
  }

  // ===== 데이터셋 변경이력 삭제 =====
  const fetchDeleteDocDatasetHistory = async (histId: string) => {
    return post<{ data: number }>('/dataset/deleteDocDatasetHistory.do', { histId })
  }

  const fetchSelectPromptList = async () => {
    return post<{ dataList: Prompt[] }>('/dataset/selectPromptList.do', {})
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
    fetchSelectPromptList,
  }
}

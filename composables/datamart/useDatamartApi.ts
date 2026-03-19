import type { Datamart, DatamartSummary } from '~/types/datamart'
import { useApi } from '~/composables/com/useApi'
const { get, post } = useApi()

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
  /** 데이터마트 목록 조회 API */
  const fetchDatamartList = async (): Promise<{ dataList: Datamart[] }> => {
    return get<{ dataList: Datamart[] }>('/datamart/list.do')
  }

  /** 데이터마트 요약 정보 조회 API */
  const fetchDatamartSummary = async (): Promise<{ data: DatamartSummary }> => {
    return get<{ data: DatamartSummary }>('/datamart/summary.do')
  }

  /** 데이터마트 저장 API */
  const fetchSaveDatamart = async (datamart: Partial<Datamart>): Promise<{ data: Datamart }> => {
    return post<{ data: Datamart }>('/datamart/save.do', datamart)
  }

  const fetchDeleteDatamart = async (datamartId: string) => {
    return mockPost<{ data: { datamartId: string } }>(`${MOCK_BASE}/delete`, { datamartId })
  }

  const fetchToggleActiveDatamart = async (datamartId: string) => {
    return mockPost<{ data: Datamart }>(`${MOCK_BASE}/toggle-active`, { datamartId })
  }

  /** 데이터마트 연결 테스트 API */
  const fetchTestConnection = async (datamart: Datamart): Promise<{ result: string; msg: string }> => {
    return post<{ result: string; msg: string }>('/datamart/connTest.do', datamart)
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

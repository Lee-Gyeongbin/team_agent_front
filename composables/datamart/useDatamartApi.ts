import type { Datamart, DatamartSummary } from '~/types/datamart'
import { useApi } from '~/composables/com/useApi'
const { get, post } = useApi()

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

  /** 데이터마트 삭제 API */
  const fetchDeleteDatamart = async (datamartId: string): Promise<void> => {
    return post('/datamart/delete.do', { datamartId })
  }

  /** 데이터마트 연결 테스트 API */
  const fetchTestConnection = async (datamart: Datamart): Promise<{ result: string; msg: string; tblCnt: number }> => {
    return post<{ result: string; msg: string; tblCnt: number }>('/datamart/connTest.do', datamart)
  }

  return {
    fetchDatamartList,
    fetchDatamartSummary,
    fetchSaveDatamart,
    fetchDeleteDatamart,
    fetchTestConnection,
  }
}

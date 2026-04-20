import type { Datamart, DatamartSummary } from '~/types/datamart'
import { useApi } from '~/composables/com/useApi'
import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'
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

  /** 메타 테이블 목록 조회 API */
  const fetchMetaTableList = async (datamartId: string): Promise<{ dataList: DatamartMetaTableItem[] }> => {
    return post<{ dataList: DatamartMetaTableItem[] }>('/datamart/metaTableList.do', { datamartId })
  }

  /** 메타 관리 > 테이블 저장 API */
  const fetchSaveMetaTable = async (payload: {
    datamartId: string
    tableList: DatamartMetaTableItem[]
  }): Promise<void> => {
    return post('/datamart/metaTableSave.do', payload)
  }

  /** 메타 관리 > 컬럼 메타데이터 저장 API */
  const fetchSaveMetaColumn = async (payload: {
    datamartId: string
    tableList: DatamartMetaTableItem[]
  }): Promise<void> => {
    return post('/datamart/metaColumnSave.do', payload)
  }

  /** 메타 관리 > 관계 메타데이터 저장 API */
  const fetchSaveMetaRelationship = async (payload: {
    datamartId: string
    relationshipList: DatamartMetaRelationship[]
  }): Promise<void> => {
    return post('/datamart/metaRelationshipSave.do', payload)
  }

  /** 메타 관리 > 관계 메타데이터 목록 조회 API */
  const fetchMetaRelationshipList = async (datamartId: string): Promise<{ dataList: DatamartMetaRelationship[] }> => {
    return post<{ dataList: DatamartMetaRelationship[] }>('/datamart/metaRelationshipList.do', { datamartId })
  }

  /** 메타 관리 > 코드 매핑 메타데이터 저장 API */
  const fetchSaveMetaCodeMapping = async (payload: {
    datamartId: string
    codeColumnMappingList: DatamartMetaCodeColumnMapping[]
  }): Promise<void> => {
    return post('/datamart/metaCodeMappingSave.do', payload)
  }

  /** 메타 관리 > 코드 매핑 메타데이터 목록 조회 API */
  const fetchMetaCodeMappingList = async (
    datamartId: string,
  ): Promise<{ dataList: DatamartMetaCodeColumnMapping[] }> => {
    return post<{ dataList: DatamartMetaCodeColumnMapping[] }>('/datamart/metaCodeMappingList.do', { datamartId })
  }

  return {
    fetchDatamartList,
    fetchDatamartSummary,
    fetchSaveDatamart,
    fetchDeleteDatamart,
    fetchTestConnection,
    fetchMetaTableList,
    fetchSaveMetaTable,
    fetchSaveMetaColumn,
    fetchSaveMetaRelationship,
    fetchMetaRelationshipList,
    fetchSaveMetaCodeMapping,
    fetchMetaCodeMappingList,
  }
}

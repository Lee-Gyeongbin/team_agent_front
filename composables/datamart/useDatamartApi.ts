import type { Datamart, DatamartSummary } from '~/types/datamart'
import { useApi } from '~/composables/com/useApi'
import type {
  DatamartMetaCode,
  DatamartMetaColumnExcelUploadResponse,
  DatamartMetaRelationship,
  DatamartMetaSynonymPayload,
  DatamartMetaTableItem,
  DatamartMetaFewshotPayload,
} from '~/types/datamartMeta'
import { useApi_multipart } from '~/composables/com/useApi_multipart'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import { formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'
const { get, post, getBlob } = useApi()

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
    codeColumnMappingList: DatamartMetaCode[]
  }): Promise<{ dataList: DatamartMetaCode[] }> => {
    return post<{ dataList: DatamartMetaCode[] }>('/datamart/metaCodeMappingSave.do', payload)
  }

  /** 메타 관리 > 코드 매핑 메타데이터 목록 조회 API */
  const fetchMetaCodeMappingList = async (datamartId: string): Promise<{ dataList: DatamartMetaCode[] }> => {
    return post<{ dataList: DatamartMetaCode[] }>('/datamart/metaCodeMappingList.do', { datamartId })
  }

  /** 메타 관리 > 동의어 목록 조회 API */
  const fetchMetaSynonymList = async (datamartId: string): Promise<DatamartMetaSynonymPayload> => {
    return post<DatamartMetaSynonymPayload>('/datamart/metaSynonymList.do', { datamartId })
  }

  /** 메타 관리 > 동의어 저장/수정 API */
  const fetchSaveMetaSynonym = async (payload: DatamartMetaSynonymPayload): Promise<void> => {
    return post('/datamart/metaSynonymSave.do', payload)
  }

  /** 메타관리 > 퓨샷 목록 조회 API — 응답: { datamartId, fewshotList } */
  const fetchMetaFewshotList = async (datamartId: string): Promise<DatamartMetaFewshotPayload> => {
    return post<DatamartMetaFewshotPayload>('/datamart/metaFewshotList.do', { datamartId })
  }

  /** 메타 관리 > 퓨샷 저장 API */
  const fetchSaveMetaFewshot = async (payload: DatamartMetaFewshotPayload): Promise<void> => {
    return post('/datamart/metaFewshotSave.do', payload)
  }

  /** 메타 관리 > 컬럼 메타 엑셀 다운로드 — GET metaColumnDownloadExcel.do?datamartId= */
  const fetchDownloadMetaColumnExcel = async (datamartId: string, dmNm?: string): Promise<void> => {
    const query = new URLSearchParams({ datamartId })
    const blob = await getBlob(`/datamart/metaColumnDownloadExcel.do?${query.toString()}`)
    const label = dmNm?.trim() || '데이터마트'
    const fileName = `${formatYyyyMmDdFromDate(new Date())}_${label}_컬럼메타.xlsx`
    downloadBlobAsFile(blob, fileName)
  }

  /** 메타 관리 > 컬럼 메타 엑셀 업로드 — POST multipart (datamartId, uploadFile), 검증·미리보기만(DB 저장 없음) */
  const fetchUploadMetaColumnExcel = async (
    datamartId: string,
    uploadFile: File,
  ): Promise<DatamartMetaColumnExcelUploadResponse> => {
    const formData = new FormData()
    formData.append('datamartId', datamartId)
    formData.append('uploadFile', uploadFile)
    return useApi_multipart<DatamartMetaColumnExcelUploadResponse>('/datamart/metaColumnUploadExcel.do', {
      method: 'POST',
      body: formData,
    })
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
    fetchMetaSynonymList,
    fetchSaveMetaSynonym,
    fetchMetaFewshotList,
    fetchSaveMetaFewshot,
    fetchDownloadMetaColumnExcel,
    fetchUploadMetaColumnExcel,
  }
}

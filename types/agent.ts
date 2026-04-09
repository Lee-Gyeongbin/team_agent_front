export interface Agent extends AgtRagCfg, AgtDs, AgtSqlCfg, AgtDm {
  agentId: string // AGENT_ID
  agentNm: string // AGENT_NM
  agentTypeCd: string // AGENT_TYPE_CD
  agentTypeCdNm: string // AGENT_TYPE_CD_NM
  temperature: number // TEMPERATURE
  tempDefaultYn: 'Y' | 'N' // TEMP_DEFAULT_YN
  topP: number // TOP_P
  topPDefaultYn: 'Y' | 'N' // TOP_P_DEFAULT_YN
  portNo: string // PORT_NO
  endpointUrl: string // ENDPOINT_URL
  description: string // DESCRIPTION
  sortOrd: number // SORT_ORD
  useYn: 'Y' | 'N' // USE_YN
  lastMdfDt: string // LAST_MDF_DT
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
  connCount: number // CONN_COUNT
  datasetList: AgtDs[] // DATASET_LIST (RAG)
  datamartList: AgtDm[] // DATAMART_LIST
}

/** RAG 설정 */
export interface AgtRagCfg {
  agentId: string // AGENT_ID
  simThresh: number // SIM_THRESH
  maxSrchRslt: number // MAX_SRCH_RSLT
}

/** 데이터셋  */
export interface AgtDs {
  agentId: string // AGENT_ID
  datasetId: string // DATASET_ID
  dsNm: string // DS_NM
  description: string // DESCRIPTION
  connYn: 'Y' | 'N' // CONN_YN
  docCount: number // DOC_COUNT
  chunkSize: number // CHUNK_SIZE
  modifyDt: string // MODIFY_DT
}

/** SQL 설정 */
export interface AgtSqlCfg {
  agentId: string // AGENT_ID
  modelId: string // MODEL_ID
  maxQrySec: number // MAX_QRY_SEC
  sqlValidYn: 'Y' | 'N' // SQL_VALID_YN
  readonlyYn: 'Y' | 'N' // READONLY_YN
  userCfrmYn: 'Y' | 'N' // USER_CFRM_YN
}

/** 데이터마트 */
export interface AgtDm {
  agentId: string // AGENT_ID
  datamartId: string // DATAMART_ID
  dmNm: string // DM_NM
  description: string // DESCRIPTION
  connYn: 'Y' | 'N' // CONN_YN
  dbType: string // DB_TYPE
  tblCnt: number // TBL_CNT
  lastVerifyDt: string // LAST_VERIFY_DT
}

export interface Agent extends AgtRagCfg, AgtDs, AgtSqlCfg, AgtDm {
  agentId: string // AGENT_ID
  agentNm: string // AGENT_NM
  agentTypeCd: string // AGENT_TYPE_CD
  agentTypeCdNm: string // AGENT_TYPE_CD_NM
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
  connYn: 'Y' | 'N' // CONN_YN
  sortOrd: number // SORT_ORD
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
  connYn: 'Y' | 'N' // CONN_YN
}

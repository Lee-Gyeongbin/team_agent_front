export interface Agent {
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
}

// 데이터셋
export interface AgentDataset {
  id: string
  name: string
  description: string
  documentCount: number // 문서 수
  chunkCount: number // 청크 수
  isConnected: boolean // 연결 여부
  updatedAt: string
}

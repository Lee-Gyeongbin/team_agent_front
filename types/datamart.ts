/** 데이터마트 */
export interface Datamart {
  id: string
  name: string
  dbType: string
  dbVersion: string
  isActive: boolean
  host: string
  analysisUrl: string
  dbName: string
  tableCount: number
  updatedAt: string
}

/** 데이터마트 요약 통계 */
export interface DatamartSummary {
  totalCount: number
  activeCount: number
  inactiveCount: number
  dataSourceCount: number
  lastScanDate: string
  connectedSystems: string
}

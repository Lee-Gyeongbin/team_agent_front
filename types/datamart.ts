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

/** 데이터마트 생성/수정 폼 */
export interface DatamartForm {
  // 기본 정보
  name: string
  description: string
  status: 'active' | 'inactive'
  sortOrder: number
  // DB 연결 정보
  dbType: string
  dbVersion: string
  host: string
  port: number | ''
  dbName: string
  username: string
  password: string
  schema: string
  connectionOptions: string
  // 액세스 제어
  readOnly: boolean
  ipWhitelist: boolean
  useSsl: boolean
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

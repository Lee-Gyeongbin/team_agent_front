/** 데이터마트 */
export interface Datamart {
  datamartId: string
  dmNm: string
  description: string
  dbType: string
  dbVersion: string
  host: string
  port: number
  dbNm: string
  username: string
  pwdEnc: string
  schNm: string
  connOpt: string
  readonlyYn: 'Y' | 'N'
  ipWlistYn: 'Y' | 'N'
  sslYn: 'Y' | 'N'
  tblCnt: number
  lastVerifyDt: string
  sortOrd: number
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
  testType: string
}

/** 데이터마트 생성/수정 폼 */
export interface DatamartForm {
  // 기본 정보
  dmNm: string
  description: string
  useYn: 'Y' | 'N'
  sortOrd: number
  // DB 연결 정보
  dbType: string
  dbVersion: string
  host: string
  port: number
  dbNm: string
  username: string
  pwdEnc: string
  schNm: string
  connOpt: string
  // 액세스 제어
  readonlyYn: 'Y' | 'N'
  ipWlistYn: 'Y' | 'N'
  sslYn: 'Y' | 'N'
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

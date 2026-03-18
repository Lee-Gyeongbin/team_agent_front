import type { Datamart } from '~/types/datamart'

const today = () => new Date().toISOString().slice(0, 10)

const datamartList: Datamart[] = [
  {
    datamartId: 'dm-1',
    dmNm: '경영 통계 데이터마트',
    description: '',
    useYn: true,
    dbType: 'MySQL',
    dbVersion: '8.0',
    host: 'db-analytics-01.internal',
    port: 3306,
    dbNm: 'analytics_db',
    username: '',
    pwdEnc: '',
    schNm: 'analytics_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 24,
    lastVerifyDt: '2025-02-10',
    sortOrd: 1,
    createDt: '2025-02-10',
    modifyDt: '2025-02-10',
  },
  {
    datamartId: 'dm-2',
    dmNm: '재무회계 데이터마트',
    description: '',
    useYn: true,
    dbType: 'PostgreSQL',
    dbVersion: '14',
    host: 'db-finance-01.internal',
    port: 5432,
    dbNm: 'finance_db',
    username: '',
    pwdEnc: '',
    schNm: 'finance_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 18,
    lastVerifyDt: '2025-02-09',
    sortOrd: 2,
    createDt: '2025-02-09',
    modifyDt: '2025-02-09',
  },
  {
    datamartId: 'dm-3',
    dmNm: '인사급여 데이터마트',
    description: '',
    useYn: false,
    dbType: 'MySQL',
    dbVersion: '8.0',
    host: 'db-hr-01.internal',
    port: 3306,
    dbNm: 'hr_db',
    username: '',
    pwdEnc: '',
    schNm: 'hr_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 15,
    lastVerifyDt: '2025-02-08',
    sortOrd: 3,
    createDt: '2025-02-08',
    modifyDt: '2025-02-08',
  },
  {
    datamartId: 'dm-4',
    dmNm: '영업실적 데이터마트',
    description: '',
    useYn: true,
    dbType: 'Oracle',
    dbVersion: '19c',
    host: 'db-sales-01.internal',
    port: 1521,
    dbNm: 'sales_db',
    username: '',
    pwdEnc: '',
    schNm: 'sales_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 32,
    lastVerifyDt: '2025-02-07',
    sortOrd: 4,
    createDt: '2025-02-07',
    modifyDt: '2025-02-07',
  },
  {
    datamartId: 'dm-5',
    dmNm: '경영 통계 데이터마트',
    description: '',
    useYn: true,
    dbType: 'MySQL',
    dbVersion: '8.0',
    host: 'db-analytics-01.internal',
    port: 3306,
    dbNm: 'analytics_db',
    username: '',
    pwdEnc: '',
    schNm: 'analytics_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 24,
    lastVerifyDt: '2025-02-06',
    sortOrd: 5,
    createDt: '2025-02-06',
    modifyDt: '2025-02-06',
  },
  {
    datamartId: 'dm-6',
    dmNm: '재무회계 데이터마트',
    description: '',
    useYn: true,
    dbType: 'PostgreSQL',
    dbVersion: '14',
    host: 'db-finance-01.internal',
    port: 5432,
    dbNm: 'finance_db',
    username: '',
    pwdEnc: '',
    schNm: 'finance_db',
    connOpt: '',
    readonlyYn: false,
    ipWlistYn: false,
    sslYn: false,
    tblCnt: 18,
    lastVerifyDt: '2025-02-05',
    sortOrd: 6,
    createDt: '2025-02-05',
    modifyDt: '2025-02-05',
  },
]

export const mockDatamartDb = {
  getList: () => [...datamartList],

  getSummary: () => {
    const active = datamartList.filter((d) => d.useYn)
    const inactive = datamartList.filter((d) => !d.useYn)
    const totalTables = datamartList.reduce((sum, d) => sum + d.tblCnt, 0)

    // DB 타입별 카운트
    const dbTypeCounts: Record<string, number> = {}
    datamartList.forEach((d) => {
      dbTypeCounts[d.dbType] = (dbTypeCounts[d.dbType] || 0) + 1
    })
    const connectedSystems = Object.entries(dbTypeCounts)
      .map(([type, count]) => `${type} ${count}`)
      .join(', ')

    return {
      totalCount: datamartList.length,
      activeCount: active.length,
      inactiveCount: inactive.length,
      dataSourceCount: totalTables,
      lastScanDate: '2025-02-11 09:00',
      connectedSystems,
    }
  },

  save: (item: Partial<Datamart>) => {
    const index = datamartList.findIndex((d) => d.datamartId === item.datamartId)
    if (index > -1) {
      datamartList[index] = { ...datamartList[index], ...item, modifyDt: today() }
      return datamartList[index]
    } else {
      const newItem: Datamart = {
        datamartId: `dm-${Date.now()}`,
        dmNm: '',
        description: '',
        useYn: true,
        dbType: 'MySQL',
        dbVersion: '8.0',
        host: '',
        port: 3306,
        dbNm: '',
        username: '',
        pwdEnc: '',
        schNm: '',
        connOpt: '',
        readonlyYn: false,
        ipWlistYn: false,
        sslYn: false,
        tblCnt: 0,
        lastVerifyDt: '',
        sortOrd: 0,
        createDt: today(),
        modifyDt: today(),
        ...item,
      }
      datamartList.push(newItem)
      return newItem
    }
  },

  delete: (datamartId: string) => {
    const index = datamartList.findIndex((d) => d.datamartId === datamartId)
    if (index > -1) datamartList.splice(index, 1)
    return { datamartId }
  },

  toggleActive: (datamartId: string) => {
    const item = datamartList.find((d) => d.datamartId === datamartId)
    if (!item) return null
    item.useYn = !item.useYn
    return item
  },

  testConnection: (datamartId: string) => {
    const item = datamartList.find((d) => d.datamartId === datamartId)
    return { datamartId, success: !!item, message: item ? '연결 성공' : '데이터마트를 찾을 수 없습니다.' }
  },
}

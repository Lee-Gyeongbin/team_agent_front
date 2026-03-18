interface MockDatamart {
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

const today = () => new Date().toISOString().slice(0, 10)

const datamartList: MockDatamart[] = [
  {
    id: 'dm-1',
    name: '경영 통계 데이터마트',
    dbType: 'MySQL',
    dbVersion: '8.0',
    isActive: true,
    host: 'db-analytics-01.internal',
    analysisUrl: 'analytics_db',
    dbName: 'analytics_db',
    tableCount: 24,
    updatedAt: '2025-02-10',
  },
  {
    id: 'dm-2',
    name: '재무회계 데이터마트',
    dbType: 'PostgreSQL',
    dbVersion: '14',
    isActive: true,
    host: 'db-finance-01.internal',
    analysisUrl: 'finance_db',
    dbName: 'finance_db',
    tableCount: 18,
    updatedAt: '2025-02-09',
  },
  {
    id: 'dm-3',
    name: '인사급여 데이터마트',
    dbType: 'MySQL',
    dbVersion: '8.0',
    isActive: false,
    host: 'db-hr-01.internal',
    analysisUrl: 'hr_db',
    dbName: 'hr_db',
    tableCount: 15,
    updatedAt: '2025-02-08',
  },
  {
    id: 'dm-4',
    name: '영업실적 데이터마트',
    dbType: 'Oracle',
    dbVersion: '19c',
    isActive: true,
    host: 'db-sales-01.internal',
    analysisUrl: 'sales_db',
    dbName: 'sales_db',
    tableCount: 32,
    updatedAt: '2025-02-07',
  },
  {
    id: 'dm-5',
    name: '경영 통계 데이터마트',
    dbType: 'MySQL',
    dbVersion: '8.0',
    isActive: true,
    host: 'db-analytics-01.internal',
    analysisUrl: 'analytics_db',
    dbName: 'analytics_db',
    tableCount: 24,
    updatedAt: '2025-02-06',
  },
  {
    id: 'dm-6',
    name: '재무회계 데이터마트',
    dbType: 'PostgreSQL',
    dbVersion: '14',
    isActive: true,
    host: 'db-finance-01.internal',
    analysisUrl: 'finance_db',
    dbName: 'finance_db',
    tableCount: 18,
    updatedAt: '2025-02-05',
  },
]

export const mockDatamartDb = {
  getList: () => [...datamartList],

  getSummary: () => {
    const active = datamartList.filter((d) => d.isActive)
    const inactive = datamartList.filter((d) => !d.isActive)
    const totalTables = datamartList.reduce((sum, d) => sum + d.tableCount, 0)

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

  save: (item: Partial<MockDatamart>) => {
    const index = datamartList.findIndex((d) => d.id === item.id)
    if (index > -1) {
      datamartList[index] = { ...datamartList[index], ...item, updatedAt: today() }
      return datamartList[index]
    } else {
      const newItem: MockDatamart = {
        id: `dm-${Date.now()}`,
        name: '',
        dbType: 'MySQL',
        dbVersion: '8.0',
        isActive: true,
        host: '',
        analysisUrl: '',
        dbName: '',
        tableCount: 0,
        updatedAt: today(),
        ...item,
      }
      datamartList.push(newItem)
      return newItem
    }
  },

  delete: (id: string) => {
    const index = datamartList.findIndex((d) => d.id === id)
    if (index > -1) datamartList.splice(index, 1)
    return { id }
  },

  toggleActive: (id: string) => {
    const item = datamartList.find((d) => d.id === id)
    if (!item) return null
    item.isActive = !item.isActive
    return item
  },

  testConnection: (id: string) => {
    const item = datamartList.find((d) => d.id === id)
    return { id, success: !!item, message: item ? '연결 성공' : '데이터마트를 찾을 수 없습니다.' }
  },
}

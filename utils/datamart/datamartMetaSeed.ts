import type { DatamartMetaCodeColumnMapping } from '~/types/datamartMeta'

/** 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 */
export const createDatamartMetaCodeMappingsSeed = (): DatamartMetaCodeColumnMapping[] => [
  {
    id: 'code-map-1',
    tableId: '5',
    columnId: '5-c1',
    entries: [
      { id: 'code-map-1-e1', codeValue: '20241', labelKo: '2024년 1분기' },
      { id: 'code-map-1-e2', codeValue: '20242', labelKo: '2024년 2분기' },
      { id: 'code-map-1-e3', codeValue: '20243', labelKo: '2024년 3분기' },
    ],
  },
]

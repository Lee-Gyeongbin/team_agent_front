import type {
  DatamartMetaCodeColumnMapping,
  DatamartMetaRelationship,
  DatamartMetaTableItem,
} from '~/types/datamartMeta'

/** 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 */
export const createDatamartMetaTablesSeed = (): DatamartMetaTableItem[] => [
  {
    id: '1',
    physicalNm: 'stat_attr',
    logicalNm: '통계 마스터',
    colCnt: 18,
    useYn: 'Y',
    tableDescKo: '통계 속성 마스터',
    usageTy: 'MST',
    columns: [
      {
        id: '1-c1',
        colName: 'attr_id',
        dataType: 'VARCHAR',
        isPk: true,
        isFk: false,
        descKo: '속성 ID',
        nullable: 'N',
      },
      {
        id: '1-c2',
        colName: 'attr_nm',
        dataType: 'VARCHAR',
        isPk: false,
        isFk: false,
        descKo: '속성명',
        nullable: 'Y',
      },
    ],
  },
  {
    id: '2',
    physicalNm: 'stat_data',
    logicalNm: '통계 데이터',
    colCnt: 9,
    useYn: 'Y',
    tableDescKo: '통계 수치 데이터',
    usageTy: 'TX',
    columns: [
      {
        id: '2-c1',
        colName: 'data_id',
        dataType: 'BIGINT',
        isPk: true,
        isFk: false,
        descKo: '데이터 키',
        nullable: 'N',
      },
      {
        id: '2-c2',
        colName: 'val',
        dataType: 'DECIMAL',
        isPk: false,
        isFk: false,
        descKo: '측정값',
        nullable: 'Y',
      },
    ],
  },
  {
    id: '3',
    physicalNm: 'stat_detail_item',
    logicalNm: '통계 세부항목 상세',
    colCnt: 9,
    useYn: 'N',
    tableDescKo: '',
    usageTy: 'TX',
    columns: [],
  },
  {
    id: '4',
    physicalNm: 'stat_detail_item_grp',
    logicalNm: '통계 세부항목 그룹',
    colCnt: 10,
    useYn: 'N',
    tableDescKo: '',
    usageTy: 'MST',
    columns: [],
  },
  {
    id: '5',
    physicalNm: 'stat_yq_data',
    logicalNm: '통계 연분기 데이터',
    colCnt: 9,
    useYn: 'Y',
    tableDescKo: '연·분기 단위 집계 데이터',
    usageTy: 'TX',
    columns: [
      {
        id: '5-c1',
        colName: 'yq_cd',
        dataType: 'CHAR',
        isPk: true,
        isFk: false,
        descKo: '연분기 코드',
        nullable: 'N',
      },
      {
        id: '5-c2',
        colName: 'amt',
        dataType: 'DECIMAL',
        isPk: false,
        isFk: false,
        descKo: '집계 금액',
        nullable: 'Y',
      },
    ],
  },
]

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

/** 🔽 더미 데이터 — 백엔드 연결 시 API로 교체 */
export const createDatamartMetaRelationshipsSeed = (): DatamartMetaRelationship[] => [
  {
    id: 'rel-1',
    srcTableId: '2',
    srcColName: 'data_id',
    tgtTableId: '1',
    tgtColName: 'attr_id',
    cardinality: 'N:1',
    joinTy: 'INNER',
    descKo: '',
  },
]

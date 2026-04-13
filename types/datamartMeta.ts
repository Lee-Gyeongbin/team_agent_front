import type { TableColumn } from '~/types/table'

/** 메타 관리 > 컬럼 메타 행 */
export interface DatamartMetaColumnRow {
  id: string
  colName: string
  dataType: string
  isPk: boolean
  isFk: boolean
  descKo: string
  nullable: 'Y' | 'N'
}

/** 메타 관리 > 컬럼 메타데이터 탭 — UiTable 컬럼 정의 (pages/user-manage 의 userColumns 패턴) */
export const datamartMetaColumnTableColumns: TableColumn[] = [
  { key: 'colName', label: '컬럼명', width: '15%', align: 'left', headerAlign: 'center' },
  { key: 'dataType', label: '타입', width: '15%', align: 'center', headerAlign: 'center' },
  { key: 'isPk', label: 'PK', width: '8%', align: 'center', headerAlign: 'center' },
  { key: 'isFk', label: 'FK', width: '8%', align: 'center', headerAlign: 'center' },
  { key: 'descKo', label: '설명 (한국어)', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'nullable', label: 'NULL 허용', width: '12%', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '', width: '8%', align: 'center', headerAlign: 'center' },
]

/**
 * 메타 관리에서 테이블 선택·컬럼 메타 탭이 공유하는 테이블 행
 * useYn: 테이블 선택 탭 토글과 동기
 */
export interface DatamartMetaTableItem {
  id: string
  physicalNm: string
  logicalNm: string
  colCnt: number
  useYn: 'Y' | 'N'
  tableDescKo: string
  usageTy: string
  columns: DatamartMetaColumnRow[]
}

/** 메타 관리 > 관계 정의 탭 — 카디널리티 */
export type DatamartMetaCardinality = '1:1' | '1:N' | 'N:1'

/** 메타 관리 > 관계 정의 탭 — JOIN 유형 (표시는 SQL 키워드) */
export type DatamartMetaJoinTy = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

/** 메타 관리 > 관계 정의 탭 — JOIN 한 줄 */
export interface DatamartMetaRelationship {
  id: string
  srcTableId: string
  srcColName: string
  tgtTableId: string
  tgtColName: string
  cardinality: DatamartMetaCardinality
  joinTy: DatamartMetaJoinTy
  /** 관계 설명 (선택) */
  descKo: string
}

/** 메타 관리 > 코드값 매핑 탭 — 코드 한 줄 */
export interface DatamartMetaCodeValueRow {
  id: string
  codeValue: string
  labelKo: string
}

/** 메타 관리 > 코드값 매핑 탭 — 코드성 컬럼별 매핑 묶음 */
export interface DatamartMetaCodeColumnMapping {
  id: string
  tableId: string
  columnId: string
  entries: DatamartMetaCodeValueRow[]
}

/** 메타 관리 > 코드값 매핑 탭 — 코드성 컬럼별 마스터 행 UiTable 컬럼 */
export const datamartMetaCodeMappingMasterColumns: TableColumn[] = [
  { key: 'tableNm', label: '테이블', width: '20%', align: 'left', headerAlign: 'center' },
  { key: 'colName', label: '컬럼', width: '18%', align: 'left', headerAlign: 'center' },
  { key: 'descKo', label: '설명', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'entryCnt', label: '코드값 수', width: '12%', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '', width: '40px', align: 'center', headerAlign: 'center' },
]

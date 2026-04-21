import type { TableColumn } from '~/types/table'

/** 메타 관리 > 컬럼 메타 행 (COL_* 스키마 — 카멜케이스) */
export interface DatamartMetaColumnRow {
  colId: string
  colPhyNm: string
  colKorNm: string
  colDesc: string
  dataType: string
  dataLen: string
  pkYn: 'Y' | 'N'
  fkYn: 'Y' | 'N'
  nullableYn: 'Y' | 'N'
  hasCodeYn: 'Y' | 'N'
  aiHint: string
  sortOrd: number
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 메타 관리 > 컬럼 메타데이터 탭 — UiTable 컬럼 정의 */
export const datamartMetaColumnTableColumns: TableColumn[] = [
  { key: 'colPhyNm', label: '컬럼ID', width: '8%', align: 'left', headerAlign: 'center' },
  { key: 'colKorNm', label: '컬럼명', width: '8%', align: 'left', headerAlign: 'center' },
  { key: 'dataType', label: '타입', width: '8%', align: 'center', headerAlign: 'center' },
  { key: 'pkYn', label: 'PK', width: '4%', align: 'center', headerAlign: 'center' },
  { key: 'fkYn', label: 'FK', width: '4%', align: 'center', headerAlign: 'center' },
  { key: 'nullableYn', label: 'NULL허용', width: '5%', align: 'center', headerAlign: 'center' },
  { key: 'hasCodeYn', label: '코드여부', width: '5%', align: 'center', headerAlign: 'center' },
  { key: 'aiHint', label: 'AI 힌트', width: '4%', align: 'left', headerAlign: 'center' },
  { key: '_actions', label: '삭제', width: '4%', align: 'center', headerAlign: 'center' },
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
  columns: DatamartMetaColumnRow[]
}

/** 메타 관리 > 관계 정의 탭 — 카디널리티 */
export type DatamartMetaCardinality = '1:1' | '1:N' | 'N:1'

/** 메타 관리 > 관계 정의 탭 — JOIN 유형 (표시는 SQL 키워드) */
export type DatamartMetaJoinTy = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

/** 메타 관리 > 관계 정의 탭 — JOIN 한 줄 (REL_* 스키마 — 카멜케이스) */
export interface DatamartMetaRelationship {
  datamartId: string
  relId: string
  fromTblId: string
  fromColId: string
  toTblId: string
  toColId: string
  cardinality: DatamartMetaCardinality
  joinType: DatamartMetaJoinTy
  relDesc: string
  sortOrd: number
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 메타 관리 > 코드값 매핑 탭 — 코드 한 줄 */
export interface DatamartMetaCodeValueRow {
  datamartId: string
  tblId: string
  colId: string
  codeVal: string
  codeKorNm: string
  codeDesc: string
  sortOrd: number
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 메타 관리 > 코드값 매핑 탭 — 코드성 컬럼별 매핑 묶음 */
export interface DatamartMetaCodeColumnMapping {
  tblId: string
  colId: string
  entries: DatamartMetaCodeValueRow[]
}

/** 메타 관리 > 코드값 매핑 탭 — 코드성 컬럼별 마스터 행 UiTable 컬럼 */
export const datamartMetaCodeMappingMasterColumns: TableColumn[] = [
  { key: 'tableNm', label: '테이블', width: '20%', align: 'left', headerAlign: 'center' },
  { key: 'colPhyNm', label: '컬럼', width: '18%', align: 'left', headerAlign: 'center' },
  { key: 'colDesc', label: '설명', width: 'auto', align: 'left', headerAlign: 'center' },
  { key: 'entryCnt', label: '코드값 수', width: '12%', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '', width: '40px', align: 'center', headerAlign: 'center' },
]

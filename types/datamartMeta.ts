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

/** 메타 관리 > 컬럼 메타 엑셀 업로드 API 응답 data (uploadResult) */
export interface DatamartMetaColumnExcelUploadData {
  datamartId: string
  failDetails: unknown[]
  returnMsg?: string
  tableList: {
    id: string
    columns?: DatamartMetaColumnRow[]
  }[]
}

/** 메타 관리 > 컬럼 메타 엑셀 업로드 API 응답 (jsonView) */
export interface DatamartMetaColumnExcelUploadResponse {
  successYn?: boolean
  returnMsg?: string
  data?: DatamartMetaColumnExcelUploadData
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

/** 메타 관리 > 코드값 매핑 탭 — codes API hydrate 표시용 (저장 payload 미포함) */
export interface DatamartMetaCodeValueRow {
  codeGrpId: string
  codeId: string
  codeNm: string
  description: string
  sortOrd: number
  useYn: 'Y' | 'N'
}

/** 메타 관리 > 코드값 매핑 — metaCodeMappingList/save 공통 */
export interface DatamartMetaCode {
  tblId: string
  colId: string
  codeGrpId: string
  /** 조회 API JOIN 표시용 — 저장 시 미전송 */
  codeGrpNm?: string
  /** AI 참고용 코드값 매핑 힌트 (AI_HINT) — DB NULL 허용, 조회·저장 시 미입력은 '' */
  aiHint: string
  sortOrd: number
  useYn: 'Y' | 'N'
}

/** 메타 관리 > 코드값 매핑 탭 — UI (entries는 codes API로 hydrate) */
export interface DatamartMetaCodeWithEntries extends DatamartMetaCode {
  entries: DatamartMetaCodeValueRow[]
}

/** 메타 관리 > 코드값 매핑 탭 — 코드성 컬럼별 마스터 행 UiTable 컬럼 */
export const datamartMetaCodeMappingMasterColumns: TableColumn[] = [
  { key: 'tableNm', label: '테이블', width: '20%', align: 'left', headerAlign: 'center' },
  { key: 'colPhyNm', label: '컬럼', width: '18%', align: 'left', headerAlign: 'center' },
  { key: 'colDesc', label: '설명', align: 'left', headerAlign: 'center' },
  { key: 'entryCnt', label: '코드값 수', width: '12%', align: 'center', headerAlign: 'center' },
  { key: 'aiHint', label: 'AI 힌트', width: '7%', align: 'center', headerAlign: 'center' },
  { key: '_actions', label: '삭제', width: '7%', align: 'center', headerAlign: 'center' },
]

/** 메타 관리 > 동의어 그룹 내 항목 */
export interface DatamartMetaSynonymItem {
  datamartId?: string
  synonymId?: string
  synonymWord: string
  representYn?: 'Y' | 'N'
  sortOrd?: number | string
  useYn?: 'Y' | 'N'
  createDt?: string
  modifyDt?: string
}

/** 메타 관리 > 동의어 그룹 (조회/저장) */
export interface DatamartMetaSynonymGroup {
  datamartId: string
  synonymId?: string
  /** UI 전용 — 저장 API payload에는 포함하지 않음 */
  clientKey?: string
  synonymList: DatamartMetaSynonymItem[]
}

/** 메타 관리 > 동의어 조회/저장 API DTO */
export interface DatamartMetaSynonymPayload {
  datamartId: string
  synonymList: DatamartMetaSynonymItem[]
  /** 조회 API — 그룹 단위 목록(있으면 flat synonymList 대신 우선) */
  synonymGroupList?: DatamartMetaSynonymGroup[]
}

/** 메타 관리 > 퓨샷 목록 조회 API */
export interface DatamartMetaFewshot {
  datamartId: string
  fewshotId: string
  userQuestion: string
  aiUnderstand: string
  aiRefExam: string
  sqlExam: string
  sortOrd?: number | string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 메타 관리 > 퓨샷 저장 API DTO */
export interface DatamartMetaFewshotPayload {
  datamartId: string
  fewshotList: DatamartMetaFewshot[]
}

/** 메타 관리 > 약어사전 항목 */
export interface DatamartMetaAbbrevItem {
  datamartId?: string
  abbrId?: string
  abbrNm: string
  fullNmEng: string
  fullNmKor: string
  useYn?: 'Y' | 'N'
  sortOrd?: number | string
  createDt?: string
  modifyDt?: string
}

/** 메타 관리 > 약어사전 조회/저장 API DTO */
export interface DatamartMetaAbbrevPayload {
  datamartId: string
  abbrDictList: DatamartMetaAbbrevItem[]
}

/** 메타 관리 > 용어사전 유형 — METRIC(지표) | DIMENSION(구분) */
export type DatamartMetaTermType = 'METRIC' | 'DIMENSION'

/** 메타 관리 > 용어사전 항목 */
export interface DatamartMetaTermItem {
  datamartId?: string
  termId?: string
  termType: DatamartMetaTermType
  /** 대표 용어 (예: 매출액, 지역) */
  termNm: string
  /** 정의/설명 */
  termDesc?: string
  /** 구분의 예시 값 (콤마구분, 예: 대전,서울,부산) */
  sampleValues?: string
  /** 사용자표현·유사어 (콤마구분) — 매칭·유도용 */
  synonyms?: string
  sortOrd?: number | string
  useYn?: 'Y' | 'N'
  createDt?: string
  modifyDt?: string
}

/** 메타 관리 > 용어사전 조회/저장 API DTO */
export interface DatamartMetaTermPayload {
  datamartId: string
  termList: DatamartMetaTermItem[]
}

/** 메타 관리 > 약어사전 탭 — UiTable 컬럼 정의 */
export const datamartMetaAbbrevTableColumns: TableColumn[] = [
  { key: 'abbrNm', label: '약어', width: '14%', align: 'left', headerAlign: 'center' },
  { key: 'fullNmEng', label: '영문 전체명', width: '32%', align: 'left', headerAlign: 'center' },
  { key: 'fullNmKor', label: '한글 전체명', align: 'left', headerAlign: 'center' },
  { key: '_actions', label: '삭제', width: '7%', align: 'center', headerAlign: 'center' },
]

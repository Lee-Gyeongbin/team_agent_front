import type { TableColumn } from '~/types/table'

/** 그룹코드 항목 */
export interface CodeGroupItem {
  codeGrpId: string
  codeGrpNm: string
  description: string
  useYn: string
  createDt: string
}

/** 상세코드 항목 */
export interface CodeItem {
  codeGrpId: string
  codeId: string
  codeNm: string
  sortOrd: number
  useYn: string
  description: string
}

/** 그룹코드 선택 옵션 */
export interface CodeGroupOption {
  codeGrpId: string
  codeGrpNm: string
}

/** 그룹코드 폼 데이터 */
export interface CodeGroupFormData {
  codeGrpId: string
  codeGrpNm: string
  description: string
  useYn: string
}

export const saveCodeGrpForm = (): CodeGroupFormData => ({
  codeGrpId: '',
  codeGrpNm: '',
  description: '',
  useYn: 'Y',
})

/** 상세코드 폼 데이터 */
export interface CodeFormData {
  codeGrpId: string
  code: string
  codeName: string
  sortOrdStr: string
  useYn: string
  description: string
}

export const saveCodeForm = (): CodeFormData => ({
  codeGrpId: '',
  code: '',
  codeName: '',
  sortOrdStr: '0',
  useYn: 'Y',
  description: '',
})

/** 공통코드 그룹 테이블 컬럼 정의 */
export const codeGroupColumns: TableColumn[] = [
  { key: 'codeGrpId', label: '그룹코드', width: '35%', align: 'center', headerAlign: 'center' },
  { key: 'codeGrpNm', label: '그룹명', width: '40%', align: 'center', headerAlign: 'center' },
  { key: 'useYn', label: '사용', width: '15%', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '10%', align: 'center', headerAlign: 'center' },
]

/** 공통코드 테이블 컬럼 정의 */
export const codesColumns: TableColumn[] = [
  { key: 'codeId', label: '코드', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'codeNm', label: '코드명', width: '200px', align: 'left', headerAlign: 'center' },
  { key: 'sortOrd', label: '정렬순서', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'useYn', label: '사용여부', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'description', label: '설명', width: '200px', align: 'left', headerAlign: 'center' },
  { key: 'actions', label: '관리', width: '48px', align: 'center', headerAlign: 'center' },
]

/** 드래그 핸들 포함 컬럼 (정렬순서 변경 시 사용) */
export const codesColumnsWithDrag: TableColumn[] = [
  { key: '_drag', label: '', width: '40px', align: 'center', headerAlign: 'center' },
  ...codesColumns,
]

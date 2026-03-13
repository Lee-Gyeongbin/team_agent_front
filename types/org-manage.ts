/** 조직 행 데이터 */
export interface OrgItem {
  orgId: string
  orgNm: string
  parentOrgId: string
  orgLevel: number
  sortOrder: number
  useYn: string
  createdDt: string
  updatedDt: string
}

/** 조직 옵션 */
export interface OrgOption {
  label: string
  value: string
}

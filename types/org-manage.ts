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

/** 조직도 트리 노드 (화면용) */
export interface OrgTreeItem extends OrgItem {
  children?: OrgTreeItem[]
  expanded?: boolean
}

/** 조직 옵션 */
export interface OrgOption {
  label: string
  value: string
}

/** 조직관리 — 선택 조직 소속 팀원 테이블 */
export interface OrgUserItem {
  userId: string
  userNm: string
  email: string
  phone: string
  acctStatusDesc: string
  profileImgUrl: string | null
}

export interface OrgUserListResponse {
  list: OrgUserItem[]
}

/** 조직 추가 요청 */
export interface InsertOrgPayload {
  orgNm: string
  parentOrgId: string
  useYn: 'Y' | 'N'
}

/** 조직 수정 요청 */
export interface UpdateOrgPayload extends InsertOrgPayload {
  orgId: string
}

/** 조직 순서 변경 요청 */
export interface UpdateOrgSortOrderPayload {
  orgId: string
  sortOrder: number
  parentOrgId: string
}

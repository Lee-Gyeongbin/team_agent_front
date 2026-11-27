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

/**
 * 공통 사용자 조회(OrgUserPicker) 선택 사용자 — userId·userNm 만 필수.
 * 사용처가 저장된 값(예: 회의 참석자 JSON)으로 초기 선택을 넘길 때 나머지 필드는 없을 수 있다.
 */
export type OrgUserPickerUser = Pick<OrgUserItem, 'userId' | 'userNm'> & Partial<Omit<OrgUserItem, 'userId' | 'userNm'>>

/** OrgUserPicker 검색 범위 — org: 선택 조직 안에서 / all: 전체 직원 대상 */
export type OrgUserPickerSearchScope = 'org' | 'all'

export interface OrgUserListResponse {
  list: OrgUserItem[]
}

/** 조직도 엑셀 업로드 응답 */
export interface OrgExcelUploadResponse {
  successYn?: boolean
  returnMsg?: string
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

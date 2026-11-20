import type { TableColumn } from '~/types/table'

/** 권한 그룹 [TB_ROLE_GRP] */
export interface RoleItem {
  roleId: string
  roleName: string
  description: string
  useYn: string
  defaultYn: string
  createDt?: string
  modifyDt?: string
}

/** 권한 그룹 메뉴 행 [TB_MENU + TB_ROLE_MENU] — readYn/funcYn은 행 없음이면 N */
export interface RoleMenuItem {
  menuId: string
  menuName: string
  parnMenuId: string | null
  menuLevel: number
  sortOrd: number
  isLeaf: string
  readYn: string
  funcYn: string
}

/** 메뉴 권한 항목 키 — 조회(readYn) / 기능(funcYn: 등록·수정·삭제·엑셀 업로드) */
export type RolePermKey = 'readYn' | 'funcYn'

/** 메뉴 권한 항목 정의 */
export const rolePermItems: { key: RolePermKey; label: string; tip: string }[] = [
  { key: 'readYn', label: '조회', tip: '메뉴 접근, 목록·상세 화면 조회, 엑셀 다운로드를 사용할 수 있습니다.' },
  {
    key: 'funcYn',
    label: '등록·수정·삭제·업로드',
    tip: '조회 외 모든 기능(데이터 등록·수정·삭제, 엑셀 업로드)을 사용할 수 있습니다.',
  },
]

/** 권한 설정 메뉴 트리 노드 (화면용) */
export interface RoleMenuTreeNode extends RoleMenuItem {
  children: RoleMenuTreeNode[]
}

/** 권한 설정 표 행 (트리를 펼친 한 줄) */
export interface RoleMenuRow extends Record<string, unknown> {
  menuId: string
  menuName: string
  depth: number
  hasChildren: boolean
  expanded: boolean
}

/** 권한 그룹 입력 폼 */
export interface RoleFormData {
  roleId: string
  roleName: string
  description: string
  useYn: string
  defaultYn: string
}

export const createDefaultRoleForm = (): RoleFormData => ({
  roleId: '',
  roleName: '',
  description: '',
  useYn: 'Y',
  defaultYn: 'N',
})

/** 메뉴별 권한 저장 항목 */
export interface RoleMenuPayload {
  menuId: string
  readYn: string
  funcYn: string
}

/** 권한 그룹 저장 요청 */
export interface SaveRolePayload extends RoleFormData {
  menuList: RoleMenuPayload[]
}

/** 권한 그룹에 지정된 사용자 */
export interface RoleUserItem {
  userId: string
  userNm: string
  email: string
  orgId?: string
  orgNm?: string
}

/** 엑셀 업로드 응답 */
export interface RoleExcelUploadResponse {
  successYn?: boolean
  returnMsg?: string
}

/** 엑셀 업로드·다운로드 대상 */
export type RoleExcelKind = 'role' | 'user'

/** 권한 그룹 목록 컬럼 */
export const roleColumns: TableColumn[] = [
  { key: 'no', label: 'No.', width: '60px', align: 'center', headerAlign: 'center' },
  { key: 'roleName', label: '권한명', width: '160px', align: 'left', headerAlign: 'center' },
  { key: 'description', label: '설명', align: 'left', headerAlign: 'center' },
  { key: 'useYn', label: '사용 여부', width: '84px', align: 'center', headerAlign: 'center' },
  { key: 'defaultYn', label: '기본 적용', width: '84px', align: 'center', headerAlign: 'center' },
]

/** 메뉴 권한 표 컬럼 */
export const roleMenuColumns: TableColumn[] = [
  { key: 'menuName', label: '메뉴명', align: 'left', headerAlign: 'left' },
  { key: 'readYn', label: '조회', width: '190px', align: 'center', headerAlign: 'center' },
  { key: 'funcYn', label: '등록·수정·삭제·업로드', width: '190px', align: 'center', headerAlign: 'center' },
]

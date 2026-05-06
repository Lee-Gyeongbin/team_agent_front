/** 메뉴 아이템 (API 응답 컬럼 기준) */
export interface MenuItem {
  menuId: string
  menuName: string
  parnMenuId: string | null
  menuLevel: number
  menuPath: string
  isLeaf: 'Y' | 'N'
  srcPath: string
  icon: string
  sortOrd: number
  useYn: string
  description: string
  children?: MenuItem[]
}

/** 트리 렌더링용 메뉴 아이템 (펼침 상태 포함) */
export interface MenuTreeItem extends MenuItem {
  expanded?: boolean
  children?: MenuTreeItem[]
}

/** /menuList.do API 응답 */
export interface MenuListResponse {
  list?: MenuItem[]
  menuList?: MenuItem[]
}

/** 메뉴 트리 정렬 순서 일괄 업데이트 요청 항목 */
export interface MenuOrderSortItem {
  menuId: string
  sortOrd: number
}

/** 트리 D&D 순서 변경 — 노드에서 스토어로 전달 */
export interface MenuTreeReorderPayload {
  draggedId: string
  targetId: string
  position: 'before' | 'after'
}

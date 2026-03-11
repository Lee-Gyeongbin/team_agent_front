/** 메뉴 아이템 (API 응답 컬럼 기준) */
export interface MenuItem {
  menuId: string
  menuName: string
  parnMenuId: string | null
  menuLevel: number
  menuPath: string
  srcPath: string
  icon: string
  sortOrd: number
  useYn: string
  description: string
  children?: MenuItem[]
}

/** /menuList.do API 응답 */
export interface MenuListResponse {
  list?: MenuItem[]
  menuList?: MenuItem[]
}

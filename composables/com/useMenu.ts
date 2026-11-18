import { useApi } from '~/composables/com/useApi'
import type { MenuItem, MenuListResponse } from '~/types/menu'

const MENU_STATE_KEY = 'ta_menuList'

/**
 * AI 운영 하위 메뉴명 → 라우트 경로 매핑
 * API 응답의 srcPath와 무관하게 프론트에서 해당 페이지로 연결
 */
const MENU_NAME_TO_PATH: Record<string, string> = {
  컨텐츠저장소: '/repository',
  '문서데이터셋(RAG)': '/doc-dataset',
}

/** 메뉴 트리에서 매핑된 메뉴명 항목의 srcPath를 위 경로로 보정 */
export function patchMenuPaths(items: MenuItem[]): void {
  for (const item of items) {
    const path = MENU_NAME_TO_PATH[item.menuName]
    if (path) {
      item.srcPath = path
    }
    if (item.children?.length) {
      patchMenuPaths(item.children)
    }
  }
}

/**
 * 화면에서 숨길 메뉴명 (DB 메뉴는 유지하고 프론트 노출만 제외)
 * 🔽 메뉴 사용 여부를 DB(메뉴관리)에서 정리하면 이 목록은 삭제
 */
const HIDDEN_MENU_NAMES = ['문의하기', '문의하기 관리', '문의사항', '문의사항 관리']

/** 메뉴 트리에서 숨김 대상 메뉴를 하위 메뉴까지 재귀적으로 제외 */
export function excludeHiddenMenus(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => !HIDDEN_MENU_NAMES.includes(item.menuName.trim()))
    .map((item) => (item.children?.length ? { ...item, children: excludeHiddenMenus(item.children) } : item))
}

/**
 * 전역 메뉴 상태 composable
 * - useState로 앱 전체 공유 (로그인 시 useAuth에서 fetchMenuList 호출)
 * - 다른 화면에서 사용: const { menuList } = useMenu()
 */
export const useMenu = () => {
  const { get } = useApi()
  const menuList = useState<MenuItem[]>(MENU_STATE_KEY, () => [])

  const fetchMenuList = async (): Promise<MenuItem[]> => {
    const res = await get<MenuListResponse>('/menuList.do')
    const list = excludeHiddenMenus(res.list ?? res.menuList ?? [])
    patchMenuPaths(list)
    menuList.value = list
    return list
  }

  const clearMenuList = () => {
    menuList.value = []
  }

  return { menuList, fetchMenuList, clearMenuList }
}

import { useApi } from '~/composables/com/useApi'
import type { MenuItem, MenuListResponse } from '~/types/menu'

const MENU_STATE_KEY = 'ta_menuList'

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
    const list = res.list ?? res.menuList ?? []
    menuList.value = list
    return list
  }

  const clearMenuList = () => {
    menuList.value = []
  }

  return { menuList, fetchMenuList, clearMenuList }
}

import { useMenu } from '~/composables/com/useMenu'
import type { MenuItem } from '~/types/menu'

/** 메뉴 트리에서 화면 경로(srcPath)가 같은 메뉴를 찾는다 */
const findMenuByPath = (items: MenuItem[], path: string): MenuItem | null => {
  for (const item of items) {
    if (item.srcPath === path) return item
    const found = item.children?.length ? findMenuByPath(item.children, path) : null
    if (found) return found
  }
  return null
}

/**
 * 메뉴별 조회·기능 권한 — /userMenuList.do 응답의 readYn / funcYn을 그대로 쓴다.
 * 서버가 같은 값으로 API를 막으므로, 여기서는 화면(메뉴·버튼) 제어에만 쓴다.
 */
export const usePermission = () => {
  const { menuList } = useMenu()
  const route = useRoute()

  const canRead = (path: string = route.path): boolean => findMenuByPath(menuList.value, path)?.readYn === 'Y'
  const canFunc = (path: string = route.path): boolean => findMenuByPath(menuList.value, path)?.funcYn === 'Y'

  return { canRead, canFunc }
}

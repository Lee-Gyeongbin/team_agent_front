import { useApi } from '~/composables/com/useApi'
import { patchMenuPaths } from '~/composables/com/useMenu'
import type { MenuItem, MenuListResponse, MenuOrderSortItem, MenuTreeItem } from '~/types/menu'

export const useMenuManageApi = () => {
  const { get, post } = useApi()

  /**
   * 메뉴 관리 화면 트리용 목록 조회
   */
  const fetchMenuManageList = async (): Promise<MenuItem[]> => {
    const res = await get<MenuListResponse>('/menuList.do')
    const list = res.list ?? res.menuList ?? []
    patchMenuPaths(list)
    return list
  }

  /**
   * 같은 상위 메뉴 하위 형제 간 정렬 순서 저장
   */
  const fetchUpdateMenuOrder = async (parnMenuId: string | null, items: MenuOrderSortItem[]): Promise<void> => {
    await post('/menumanage/updateMenuOrder.do', {
      parnMenuId: parnMenuId ?? '',
      items,
    })
  }

  /** 현재 메뉴 상세 수정 저장 */
  const fetchSaveMenu = async (item: MenuTreeItem): Promise<void> => {
    const res = await post<{ result: string; msg?: string }>('/menumanage/save.do', item)
    if (res.result !== 'SUCCESS') throw new Error(res.msg || '메뉴 저장에 실패했습니다.')
  }

  return { fetchMenuManageList, fetchUpdateMenuOrder, fetchSaveMenu }
}

import { ref } from 'vue'
import type { MenuItem, MenuTreeItem, MenuTreeReorderPayload } from '~/types/menu'
import { useMenuManageApi } from '~/composables/menu-manage/useMenuManageApi'

const { fetchMenuManageList, fetchUpdateMenuOrder } = useMenuManageApi()

/** API 계층형 목록 → 트리 UI용(펼침 상태·children 정규화) */
function mapMenuItemsToTreeItems(items: MenuItem[]): MenuTreeItem[] {
  return items.map((item) => ({
    ...item,
    expanded: true,
    children: item.children?.length ? mapMenuItemsToTreeItems(item.children) : [],
  }))
}

/** 트리에서 해당 menuId가 속한 형제 배열·인덱스·직계 상위 menuId 탐색 */
function findSiblingContext(
  nodes: MenuTreeItem[],
  menuId: string,
  parentMenuId: string | null,
): { siblings: MenuTreeItem[]; index: number; parentMenuId: string | null } | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    if (node.menuId === menuId) {
      return { siblings: nodes, index: i, parentMenuId }
    }
    const children = node.children ?? []
    if (children.length > 0) {
      const found = findSiblingContext(children, menuId, node.menuId)
      if (found) return found
    }
  }
  return null
}

const menuManageTreeList = ref<MenuTreeItem[]>([])
const menuManageTreeLoading = ref(false)
const menuManageTreeError = ref('')

/** 메뉴 목록 조회 */
const handleFetchMenuManageTree = async (): Promise<void> => {
  menuManageTreeError.value = ''
  menuManageTreeLoading.value = true
  menuManageTreeList.value = []
  try {
    const list = await fetchMenuManageList()
    menuManageTreeList.value = mapMenuItemsToTreeItems(list)
  } catch (e) {
    menuManageTreeError.value = e instanceof Error ? e.message : '메뉴 목록을 불러오지 못했습니다.'
  } finally {
    menuManageTreeLoading.value = false
  }
}

/**
 * 트리 D&D 정렬: 형제 노드끼리만 허용. 로컬 트리 반영 후 fetchUpdateMenuOrder 호출.
 */
const handleUpdateMenuOrder = async ({ draggedId, targetId, position }: MenuTreeReorderPayload): Promise<boolean> => {
  if (draggedId === targetId) return false

  const tree = menuManageTreeList.value
  const ctxDrag = findSiblingContext(tree, draggedId, null)
  const ctxTarget = findSiblingContext(tree, targetId, null)

  if (!ctxDrag || !ctxTarget || ctxDrag.siblings !== ctxTarget.siblings) return false

  const siblings = ctxDrag.siblings
  const dragIdx = ctxDrag.index
  let tgtIdx = ctxTarget.index

  const moved = siblings.splice(dragIdx, 1)[0]
  if (!moved) return false

  if (dragIdx < tgtIdx) tgtIdx -= 1

  const insertIdx = position === 'before' ? tgtIdx : tgtIdx + 1
  siblings.splice(insertIdx, 0, moved)

  siblings.forEach((node, i) => {
    node.sortOrd = i + 1
  })

  const items = siblings.map((node, i) => ({
    menuId: node.menuId,
    menuName: node.menuName,
    sortOrd: i + 1,
  }))

  try {
    await fetchUpdateMenuOrder(ctxDrag.parentMenuId, items)
    return true
  } catch (e) {
    console.error(e)
    return false
  }
}

export const useMenuManageStore = () => {
  return {
    menuManageTreeList,
    menuManageTreeLoading,
    menuManageTreeError,
    handleFetchMenuManageTree,
    handleUpdateMenuOrder,
  }
}

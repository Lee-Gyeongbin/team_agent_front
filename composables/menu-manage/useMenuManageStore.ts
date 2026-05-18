import { ref } from 'vue'
import type { MenuItem, MenuTreeItem, MenuTreeReorderPayload } from '~/types/menu'
import { useMenuManageApi } from '~/composables/menu-manage/useMenuManageApi'

const { fetchMenuManageList, fetchUpdateMenuOrder, fetchSaveMenu } = useMenuManageApi()

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

/** 트리에서 menuId로 노드 탐색 */
function findNodeById(nodes: MenuTreeItem[], menuId: string): MenuTreeItem | null {
  for (const node of nodes) {
    if (node.menuId === menuId) return node
    const found = findNodeById(node.children ?? [], menuId)
    if (found) return found
  }
  return null
}

const menuManageTreeList = ref<MenuTreeItem[]>([])
const menuManageTreeLoading = ref(false)
const menuManageTreeError = ref('')

/** 현재 수정 중인 메뉴 — 트리 노드의 얕은 복사본으로 관리 (저장 전 원본 트리 미변경) */
const selectedMenu = ref<MenuTreeItem | null>(null)

/** 신규 메뉴 추가 모드 여부 (true: 신규 생성, false: 기존 수정) */
const isNewMenu = ref(false)

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

/** 트리 노드 선택 — 트리 원본을 보호하기 위해 얕은 복사본으로 저장 */
const handleSelectMenu = (item: MenuTreeItem) => {
  isNewMenu.value = false
  selectedMenu.value = { ...item }
}

/**
 * 새 메뉴 추가 모드 진입 — 선택한 부모 노드 기준으로 빈 폼 초기화
 * @param parent 부모 메뉴 노드 (null이면 최상위 메뉴로 추가)
 */
const handleAddMenu = (parent: MenuTreeItem | null = null) => {
  isNewMenu.value = true
  selectedMenu.value = {
    menuId: '',
    menuName: '',
    parnMenuId: parent?.menuId ?? null,
    menuLevel: (parent?.menuLevel ?? 0) + 1,
    menuPath: '',
    isLeaf: 'Y',
    srcPath: '',
    icon: '',
    sortOrd: 0,
    useYn: 'Y',
    description: '',
    expanded: true,
    children: [],
  }
}

/**
 * 메뉴 저장 — 신규(isNewMenu=true)·수정(isNewMenu=false) 모두 fetchSaveMenu 단일 API 사용
 * 신규: 저장 후 selectedMenu 초기화 / 수정: 트리 갱신 후 해당 노드 재선택
 */
const handleSaveMenu = async (): Promise<void> => {
  if (!selectedMenu.value) return
  if (!selectedMenu.value.menuName.trim()) {
    openToast({ message: '메뉴명을 입력해 주세요.', type: 'warning' })
    return
  }
  if (!selectedMenu.value.srcPath.trim()) {
    openToast({ message: '메뉴 URL을 입력해 주세요.', type: 'warning' })
    return
  }

  const savingNew = isNewMenu.value
  const menuId = selectedMenu.value.menuId

  try {
    await fetchSaveMenu(selectedMenu.value)
    await handleFetchMenuManageTree()

    if (savingNew) {
      // 신규 저장 완료: 폼 초기화
      isNewMenu.value = false
      selectedMenu.value = null
    } else {
      // 기존 수정: 트리에서 갱신된 노드 재선택
      const refreshed = findNodeById(menuManageTreeList.value, menuId)
      if (refreshed) selectedMenu.value = { ...refreshed }
    }

    openToast({ message: '저장되었습니다.', type: 'success' })
  } catch {
    openToast({ message: '메뉴 저장에 실패했습니다.', type: 'error' })
  }
}

export const useMenuManageStore = () => {
  return {
    menuManageTreeList,
    menuManageTreeLoading,
    menuManageTreeError,
    selectedMenu,
    isNewMenu,
    handleFetchMenuManageTree,
    handleSelectMenu,
    handleAddMenu,
    handleUpdateMenuOrder,
    handleSaveMenu,
  }
}

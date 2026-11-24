import { computed, ref } from 'vue'
import type {
  RoleExcelKind,
  RoleFormData,
  RoleItem,
  RoleMenuItem,
  RoleMenuPayload,
  RoleMenuRow,
  RoleMenuTreeNode,
  RolePermKey,
  RoleUserItem,
} from '~/types/role-manage'
import { createDefaultRoleForm } from '~/types/role-manage'
import { useRoleManageApi } from '~/composables/role-manage/useRoleManageApi'
import { openToast } from '~/composables/useToast'

const {
  fetchRoleList,
  fetchRole,
  fetchSaveRole,
  fetchDeleteRole,
  fetchRoleUserList,
  fetchOrgUserList,
  fetchSaveRoleUser,
  fetchDownloadExcel,
  fetchUploadExcel,
} = useRoleManageApi()

type RolePermState = Record<string, Record<RolePermKey, boolean>>

/** 메뉴 플랫 목록 → 트리 */
const buildMenuTree = (items: RoleMenuItem[]): RoleMenuTreeNode[] => {
  const nodeMap = new Map<string, RoleMenuTreeNode>()
  items.forEach((item) => nodeMap.set(item.menuId, { ...item, children: [] }))

  const roots: RoleMenuTreeNode[] = []
  items.forEach((item) => {
    const node = nodeMap.get(item.menuId)
    if (!node) return
    const parent = item.parnMenuId ? nodeMap.get(item.parnMenuId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  })
  return roots
}

/** 노드 아래의 권한 부여 대상(최하위 메뉴) 목록 */
const getLeaves = (node: RoleMenuTreeNode): RoleMenuTreeNode[] => {
  if (node.children.length === 0) return node.isLeaf === 'Y' ? [node] : []
  return node.children.flatMap(getLeaves)
}

/** 메뉴명 검색 — 일치하는 노드 또는 일치하는 하위가 있는 노드만 남긴다 */
const filterMenuTree = (nodes: RoleMenuTreeNode[], keyword: string): RoleMenuTreeNode[] =>
  nodes
    .map((node) => {
      if (!keyword || node.menuName.toLowerCase().includes(keyword)) return node
      const children = filterMenuTree(node.children, keyword)
      return children.length ? { ...node, children } : null
    })
    .filter((node): node is RoleMenuTreeNode => node !== null)

const errorMessageOf = (error: unknown, fallback: string): string => (error instanceof Error ? error.message : fallback)

// ── 공통 ──
const roleList = ref<RoleItem[]>([])
const isRoleListLoading = ref(false)
const roleErrorMessage = ref('')
const activeTab = ref('group')

// ── 권한 그룹 탭 ──
const selectedRoleId = ref<string | null>(null)
const isNewRole = ref(false)
const roleForm = ref<RoleFormData>(createDefaultRoleForm())
const menuTree = ref<RoleMenuTreeNode[]>([])
const rolePerm = ref<RolePermState>({})
const menuExpanded = ref<Record<string, boolean>>({})
const menuSearchKeyword = ref('')
const isRoleDetailLoading = ref(false)
const isLegendOpen = ref(true)

// ── 사용자 지정 탭 ──
const userRoleId = ref('')
const selectedOrgId = ref<string | null>(null)
const orgUserList = ref<RoleUserItem[]>([])
let employeeRequestId = 0
const nameKeyword = ref('')
const selectedUserList = ref<RoleUserItem[]>([])
const baseUserIdList = ref<string[]>([])
const highlightLeftIds = ref<string[]>([])
const highlightRightIds = ref<string[]>([])
const isUserLoading = ref(false)

export const useRoleManageStore = () => {
  const { canFunc } = usePermission()
  /** 권한관리 메뉴의 기능 권한(등록·수정·삭제·엑셀 업로드) */
  const hasFunc = computed(() => canFunc('/role-manage'))

  // ==============================
  // 계산값
  // ==============================
  const selectedRole = computed(() => roleList.value.find((role) => role.roleId === selectedRoleId.value) ?? null)

  /** 사용자 지정에서 고를 수 있는 권한 그룹 (사용 중인 그룹만) */
  const activeRoleOptions = computed(() =>
    roleList.value.filter((role) => role.useYn === 'Y').map((role) => ({ label: role.roleName, value: role.roleId })),
  )

  /** 권한 설정 표에 보일 행 — 검색 중에는 모두 펼친다 */
  const menuRows = computed<RoleMenuRow[]>(() => {
    const keyword = menuSearchKeyword.value.trim().toLowerCase()
    const rows: RoleMenuRow[] = []
    const walk = (nodes: RoleMenuTreeNode[], depth: number) => {
      nodes.forEach((node) => {
        const expanded = !!keyword || menuExpanded.value[node.menuId] !== false
        rows.push({
          menuId: node.menuId,
          menuName: node.menuName,
          depth,
          hasChildren: node.children.length > 0,
          expanded,
        })
        if (node.children.length > 0 && expanded) walk(node.children, depth + 1)
      })
    }
    walk(filterMenuTree(menuTree.value, keyword), 0)
    return rows
  })

  const visibleOrgUserList = computed(() => orgUserList.value)

  const isUserDirty = computed(
    () =>
      selectedUserList.value.length !== baseUserIdList.value.length ||
      selectedUserList.value.some((user) => !baseUserIdList.value.includes(user.userId)),
  )

  // ==============================
  // 권한 그룹 탭 — 메뉴 권한 체크
  // ==============================
  const findMenuNode = (menuId: string, nodes: RoleMenuTreeNode[] = menuTree.value): RoleMenuTreeNode | null => {
    for (const node of nodes) {
      if (node.menuId === menuId) return node
      const found = findMenuNode(menuId, node.children)
      if (found) return found
    }
    return null
  }

  const isMenuChecked = (menuId: string, key: RolePermKey): boolean => {
    const node = findMenuNode(menuId)
    if (!node) return false
    const leaves = getLeaves(node)
    return leaves.length > 0 && leaves.every((leaf) => rolePerm.value[leaf.menuId]?.[key])
  }

  const isMenuIndeterminate = (menuId: string, key: RolePermKey): boolean => {
    const node = findMenuNode(menuId)
    if (!node) return false
    const leaves = getLeaves(node)
    const checkedCount = leaves.filter((leaf) => rolePerm.value[leaf.menuId]?.[key]).length
    return checkedCount > 0 && checkedCount < leaves.length
  }

  /** 기능 권한은 조회 권한이 있어야 하므로 기능을 켜면 조회도 켜고, 조회를 끄면 기능도 끈다 */
  const applyPerm = (menuId: string, key: RolePermKey, checked: boolean) => {
    const next = { ...rolePerm.value[menuId]!, [key]: checked }
    if (key === 'funcYn' && checked) next.readYn = true
    if (key === 'readYn' && !checked) next.funcYn = false
    rolePerm.value[menuId] = next
  }

  const toggleMenuPerm = (menuId: string, key: RolePermKey, checked: boolean) => {
    if (!hasFunc.value) return
    const node = findMenuNode(menuId)
    if (!node) return
    getLeaves(node).forEach((leaf) => applyPerm(leaf.menuId, key, checked))
  }

  const allLeaves = computed(() => menuTree.value.flatMap(getLeaves))
  const isAllChecked = (key: RolePermKey): boolean =>
    allLeaves.value.length > 0 && allLeaves.value.every((leaf) => rolePerm.value[leaf.menuId]?.[key])
  const isAllIndeterminate = (key: RolePermKey): boolean => {
    const checkedCount = allLeaves.value.filter((leaf) => rolePerm.value[leaf.menuId]?.[key]).length
    return checkedCount > 0 && checkedCount < allLeaves.value.length
  }
  const toggleAllPerm = (key: RolePermKey, checked: boolean) => {
    if (!hasFunc.value) return
    allLeaves.value.forEach((leaf) => applyPerm(leaf.menuId, key, checked))
  }

  const toggleMenuExpanded = (menuId: string) => {
    menuExpanded.value = { ...menuExpanded.value, [menuId]: menuExpanded.value[menuId] === false }
  }

  // ==============================
  // 권한 그룹 탭 — 조회/저장/삭제
  // ==============================
  const applyMenuList = (menuList: RoleMenuItem[]) => {
    menuTree.value = buildMenuTree(menuList)
    menuExpanded.value = {}
    rolePerm.value = Object.fromEntries(
      menuList.map((menu) => [menu.menuId, { readYn: menu.readYn === 'Y', funcYn: menu.funcYn === 'Y' }]),
    )
  }

  const handleFetchRoleList = async () => {
    roleErrorMessage.value = ''
    isRoleListLoading.value = true
    try {
      roleList.value = await fetchRoleList()
    } catch (error) {
      roleErrorMessage.value = errorMessageOf(error, '권한 그룹 목록 조회에 실패했습니다.')
    } finally {
      isRoleListLoading.value = false
    }
  }

  const handleSelectRole = async (roleId: string) => {
    isRoleDetailLoading.value = true
    try {
      const { data, menuList } = await fetchRole(roleId)
      selectedRoleId.value = roleId
      isNewRole.value = false
      menuSearchKeyword.value = ''
      roleForm.value = {
        roleId,
        roleName: data?.roleName ?? '',
        description: data?.description ?? '',
        useYn: data?.useYn ?? 'Y',
        defaultYn: data?.defaultYn ?? 'N',
      }
      applyMenuList(menuList)
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 그룹 조회에 실패했습니다.'), type: 'error' })
    } finally {
      isRoleDetailLoading.value = false
    }
  }

  const handleAddRole = async () => {
    isRoleDetailLoading.value = true
    try {
      const { menuList } = await fetchRole('')
      selectedRoleId.value = null
      isNewRole.value = true
      menuSearchKeyword.value = ''
      roleForm.value = createDefaultRoleForm()
      applyMenuList(menuList)
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 그룹 조회에 실패했습니다.'), type: 'error' })
    } finally {
      isRoleDetailLoading.value = false
    }
  }

  /** 사용 여부를 미사용으로 바꾸면 기본 적용도 해제한다 */
  const handleChangeRoleUseYn = (useYn: string) => {
    roleForm.value = { ...roleForm.value, useYn, defaultYn: useYn === 'N' ? 'N' : roleForm.value.defaultYn }
  }

  const buildMenuPayload = (): RoleMenuPayload[] =>
    allLeaves.value.map((leaf) => ({
      menuId: leaf.menuId,
      readYn: rolePerm.value[leaf.menuId]?.readYn ? 'Y' : 'N',
      funcYn: rolePerm.value[leaf.menuId]?.funcYn ? 'Y' : 'N',
    }))

  const handleSaveRole = async () => {
    const roleName = roleForm.value.roleName.trim()
    if (!roleName) {
      openToast({ message: '권한그룹을 입력해주세요.', type: 'warning' })
      return
    }
    try {
      const roleId = await fetchSaveRole({ ...roleForm.value, roleName, menuList: buildMenuPayload() })
      await handleFetchRoleList()
      await handleSelectRole(roleId)
      openToast({ message: '권한 그룹이 저장되었습니다.' })
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 그룹 저장에 실패했습니다.'), type: 'error' })
    }
  }

  const handleDeleteRole = async () => {
    const role = selectedRole.value
    if (!role) return
    const ok = await openConfirm({
      title: '권한 그룹 삭제',
      message: `'${role.roleName}' 권한 그룹을 삭제하시겠습니까?\n다른 권한 그룹이 없는 사용자는 기본 권한 그룹으로 이동합니다.`,
      confirmText: '삭제',
    })
    if (!ok) return
    try {
      await fetchDeleteRole(role.roleId)
      selectedRoleId.value = null
      roleForm.value = createDefaultRoleForm()
      menuTree.value = []
      await handleFetchRoleList()
      openToast({ message: '권한 그룹이 삭제되었습니다.' })
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 그룹 삭제에 실패했습니다.'), type: 'error' })
    }
  }

  // ==============================
  // 사용자 지정 탭
  // ==============================
  const handleLoadRoleUsers = async (roleId: string) => {
    userRoleId.value = roleId
    highlightLeftIds.value = []
    highlightRightIds.value = []
    if (!roleId) {
      selectedUserList.value = []
      baseUserIdList.value = []
      return
    }
    try {
      selectedUserList.value = await fetchRoleUserList(roleId)
      baseUserIdList.value = selectedUserList.value.map((user) => user.userId)
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 그룹 사용자 조회에 실패했습니다.'), type: 'error' })
    }
  }

  const loadEmployees = async (orgId: string, keyword = '') => {
    const requestId = ++employeeRequestId
    highlightLeftIds.value = []
    orgUserList.value = []
    isUserLoading.value = Boolean(orgId || keyword)
    if (!isUserLoading.value) return
    try {
      const users = await fetchOrgUserList(orgId, keyword)
      if (requestId === employeeRequestId) orgUserList.value = users
    } catch (error) {
      if (requestId !== employeeRequestId) return
      openToast({ message: errorMessageOf(error, '직원 목록 조회에 실패했습니다.'), type: 'error' })
    } finally {
      if (requestId === employeeRequestId) isUserLoading.value = false
    }
  }

  const handleSelectOrg = async (orgId: string) => {
    selectedOrgId.value = orgId
    nameKeyword.value = ''
    await loadEmployees(orgId)
  }

  /** 사용자 지정 탭 진입 — 권한 그룹을 불러오고 첫 그룹의 사용자를 보여준다 (조직도는 OrgTreePanel 이 불러온다) */
  const handleInitUserTab = async () => {
    if (roleList.value.length === 0) await handleFetchRoleList()
    const roleId = activeRoleOptions.value.some((option) => option.value === userRoleId.value)
      ? userRoleId.value
      : (activeRoleOptions.value[0]?.value ?? '')
    await handleLoadRoleUsers(roleId)
  }

  const handleChangeUserRole = async (roleId: string) => {
    if (roleId === userRoleId.value) return
    if (isUserDirty.value) {
      const ok = await openConfirm({
        title: '권한 그룹 변경',
        message: '저장하지 않은 변경 내용이 있습니다.\n권한 그룹을 바꾸면 변경 내용이 사라집니다.',
        confirmText: '변경',
      })
      if (!ok) return
    }
    await handleLoadRoleUsers(roleId)
  }

  const handleSearchUser = async () => {
    const keyword = nameKeyword.value.trim()
    await loadEmployees(keyword ? '' : selectedOrgId.value ?? '', keyword)
  }

  const isUserSelected = (userId: string) => selectedUserList.value.some((user) => user.userId === userId)

  const toggleHighlight = (side: 'left' | 'right', userId: string) => {
    const target = side === 'left' ? highlightLeftIds : highlightRightIds
    target.value = target.value.includes(userId)
      ? target.value.filter((id) => id !== userId)
      : [...target.value, userId]
  }

  /** 선택한(또는 지정한) 직원을 선택직원 목록에 추가 */
  const addSelectedUsers = (userIds: string[] = highlightLeftIds.value) => {
    if (!hasFunc.value) return
    const addList = orgUserList.value.filter((user) => userIds.includes(user.userId) && !isUserSelected(user.userId))
    selectedUserList.value = [...selectedUserList.value, ...addList]
    highlightLeftIds.value = []
  }

  const removeSelectedUsers = (userIds: string[] = highlightRightIds.value) => {
    if (!hasFunc.value) return
    selectedUserList.value = selectedUserList.value.filter((user) => !userIds.includes(user.userId))
    highlightRightIds.value = []
  }

  const highlightAllVisibleUsers = () => {
    highlightLeftIds.value = visibleOrgUserList.value
      .filter((user) => !isUserSelected(user.userId))
      .map((user) => user.userId)
  }

  const clearSelectedUsers = () => removeSelectedUsers(selectedUserList.value.map((user) => user.userId))

  const handleSaveRoleUser = async () => {
    if (!userRoleId.value) {
      openToast({ message: '권한 그룹을 선택해주세요.', type: 'warning' })
      return
    }
    try {
      await fetchSaveRoleUser(
        userRoleId.value,
        selectedUserList.value.map((user) => user.userId),
      )
      await handleLoadRoleUsers(userRoleId.value)
      openToast({ message: '권한 사용자가 저장되었습니다.' })
    } catch (error) {
      openToast({ message: errorMessageOf(error, '권한 사용자 저장에 실패했습니다.'), type: 'error' })
    }
  }

  // ==============================
  // 엑셀
  // ==============================
  const handleDownloadExcel = async (kind: RoleExcelKind) => {
    try {
      await fetchDownloadExcel(kind)
    } catch (error) {
      openToast({ message: errorMessageOf(error, '엑셀 다운로드 중 오류가 발생했습니다.'), type: 'error' })
    }
  }

  const isExcelFile = (file: File): boolean => /\.(xlsx|xls)$/i.test(String(file.name ?? ''))

  /** 엑셀 업로드 — 성공하면 현재 탭 데이터를 다시 불러온다 */
  const handleUploadExcel = async (kind: RoleExcelKind, file: File): Promise<boolean> => {
    if (!isExcelFile(file)) {
      openToast({ message: 'xlsx, xls 형식의 엑셀 파일만 업로드할 수 있습니다.', type: 'warning' })
      return false
    }
    try {
      const res = await fetchUploadExcel(kind, file)
      if (res?.successYn === false) {
        openToast({ message: String(res.returnMsg ?? '엑셀 업로드에 실패했습니다.'), type: 'error' })
        return false
      }
      openToast({ message: '엑셀이 업로드되었습니다.' })
      await handleFetchRoleList()
      if (kind === 'user') await handleLoadRoleUsers(userRoleId.value)
      else if (selectedRoleId.value) await handleSelectRole(selectedRoleId.value)
      return true
    } catch (error) {
      openToast({ message: errorMessageOf(error, '엑셀 업로드 중 오류가 발생했습니다.'), type: 'error' })
      return false
    }
  }

  return {
    hasFunc,
    roleList,
    isRoleListLoading,
    roleErrorMessage,
    activeTab,
    selectedRoleId,
    selectedRole,
    isNewRole,
    roleForm,
    menuTree,
    menuRows,
    menuSearchKeyword,
    isRoleDetailLoading,
    isLegendOpen,
    isMenuChecked,
    isMenuIndeterminate,
    toggleMenuPerm,
    isAllChecked,
    isAllIndeterminate,
    toggleAllPerm,
    toggleMenuExpanded,
    handleFetchRoleList,
    handleSelectRole,
    handleAddRole,
    handleChangeRoleUseYn,
    handleSaveRole,
    handleDeleteRole,
    userRoleId,
    activeRoleOptions,
    selectedOrgId,
    nameKeyword,
    visibleOrgUserList,
    selectedUserList,
    highlightLeftIds,
    highlightRightIds,
    isUserLoading,
    isUserDirty,
    handleInitUserTab,
    handleChangeUserRole,
    handleSelectOrg,
    handleSearchUser,
    isUserSelected,
    toggleHighlight,
    addSelectedUsers,
    removeSelectedUsers,
    highlightAllVisibleUsers,
    clearSelectedUsers,
    handleSaveRoleUser,
    handleDownloadExcel,
    handleUploadExcel,
  }
}

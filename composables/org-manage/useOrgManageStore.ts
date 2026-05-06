import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type {
  InsertOrgPayload,
  OrgItem,
  OrgTreeItem,
  OrgUserItem,
  UpdateOrgPayload,
  UpdateOrgSortOrderPayload,
} from '~/types/org-manage'
import { useOrgManageApi } from '~/composables/org-manage/useOrgManageApi'

function buildOrgTreeFromFlat(items: OrgItem[]): OrgTreeItem[] {
  if (!items.length) return []

  const idSet = new Set(items.map((x) => x.orgId))
  const map = new Map<string, OrgTreeItem>()

  for (const item of items) {
    map.set(item.orgId, { ...item, children: [], expanded: true })
  }

  const roots: OrgTreeItem[] = []

  for (const item of items) {
    const node = map.get(item.orgId)
    if (!node) continue

    const parentId = String(item.parentOrgId ?? '').trim()
    const isRoot = !parentId || parentId === '0' || parentId === '-1' || !idSet.has(parentId)

    if (isRoot) {
      roots.push(node)
    } else {
      const parent = map.get(parentId)
      if (parent) {
        ;(parent.children ??= []).push(node)
      } else {
        roots.push(node)
      }
    }
  }

  return roots
}

/** 트리 순서를 유지한 전위 순회 기준 첫 조직 ID */
function getFirstOrgIdInTree(nodes: OrgTreeItem[]): string | null {
  for (const node of nodes) {
    if (node.orgId) return node.orgId
    if (node.children?.length) {
      const childId = getFirstOrgIdInTree(node.children)
      if (childId) return childId
    }
  }
  return null
}

const orgList = ref<OrgItem[]>([])
const orgTree = ref<OrgTreeItem[]>([])
const selectedOrgId = ref<string | null>(null)
const orgListLoading = ref(false)
const orgErrorMessage = ref('')
const orgUserList = ref<OrgUserItem[]>([])
const orgUserListLoading = ref(false)
const orgUserErrorMessage = ref('')
const isOrgAddModalOpen = ref(false)
const orgEditMode = ref<'add' | 'edit'>('add')
const orgAddForm = ref<InsertOrgPayload>({
  orgNm: '',
  parentOrgId: '',
  useYn: 'Y',
})
const orgAddErrorMessage = ref('')

const createDefaultOrgAddForm = (parentOrgId = ''): InsertOrgPayload => ({
  orgNm: '',
  parentOrgId,
  useYn: 'Y',
})

function toggleOrgNodeExpanded(nodes: OrgTreeItem[], orgId: string): boolean {
  for (const n of nodes) {
    if (n.orgId === orgId) {
      n.expanded = !(n.expanded ?? true)
      return true
    }
    if (n.children?.length && toggleOrgNodeExpanded(n.children, orgId)) return true
  }
  return false
}

export interface OrgManageStore {
  orgList: Ref<OrgItem[]>
  orgTree: Ref<OrgTreeItem[]>
  selectedOrgId: Ref<string | null>
  orgListLoading: Ref<boolean>
  orgErrorMessage: Ref<string>
  orgUserList: Ref<OrgUserItem[]>
  orgUserListLoading: Ref<boolean>
  orgUserErrorMessage: Ref<string>
  isOrgAddModalOpen: Ref<boolean>
  orgEditMode: Ref<'add' | 'edit'>
  orgAddForm: Ref<InsertOrgPayload>
  orgAddErrorMessage: Ref<string>
  handleFetchOrgList: () => Promise<void>
  handleFetchOrgUserList: (orgId: string) => Promise<void>
  handleSelectOrg: (orgId: string) => Promise<void>
  openAddOrgModal: () => void
  openEditOrgModal: () => void
  closeAddOrgModal: () => void
  handleCreateOrg: () => Promise<void>
  handleUpdateOrg: () => Promise<void>
  handleUpdateOrgOrder: (payload: UpdateOrgSortOrderPayload) => Promise<void>
  handleDeleteOrg: () => Promise<void>
  handleToggleOrgExpand: (orgId: string) => void
  orgOptions: ComputedRef<{ label: string; value: string }[]>
}

export const useOrgManageStore = (): OrgManageStore => {
  const { fetchOrgList, fetchSelectOrgUserList, fetchInsertOrg, fetchUpdateOrg, fetchUpdateOrgOrder, fetchDeleteOrg } =
    useOrgManageApi()

  const normalizeParentOrgId = (parentOrgId: string | null | undefined): string => String(parentOrgId ?? '').trim()
  const normalizeOrgNm = (orgNm: string | null | undefined): string => String(orgNm ?? '').trim()

  const getSelectedOrg = (): OrgItem | null => {
    const selectedId = selectedOrgId.value
    const selected = orgList.value.find((item) => item.orgId === selectedId)
    if (!selectedId || !selected) {
      return null
    }
    return selected
  }

  const getSelectedOrgOrWarn = (warnMessage: string): OrgItem | null => {
    const selected = getSelectedOrg()
    if (!selected) {
      openToast({ message: warnMessage, type: 'warning' })
      return null
    }
    return selected
  }

  const createUpdatePayload = (payload: {
    orgId: string
    orgNm: string
    parentOrgId: string | null | undefined
    useYn: 'Y' | 'N'
  }): UpdateOrgPayload => ({
    orgId: payload.orgId,
    orgNm: payload.orgNm,
    parentOrgId: normalizeParentOrgId(payload.parentOrgId),
    useYn: payload.useYn,
  })

  const handleFetchOrgUserList = async (orgId: string): Promise<void> => {
    orgUserErrorMessage.value = ''
    orgUserListLoading.value = true
    try {
      const res = await fetchSelectOrgUserList(orgId)
      orgUserList.value = res.list ?? []
    } catch (error) {
      orgUserList.value = []
      const message = error instanceof Error ? error.message : '팀원 목록 조회 중 오류가 발생했습니다.'
      orgUserErrorMessage.value = message
    } finally {
      orgUserListLoading.value = false
    }
  }

  const handleFetchOrgList = async (): Promise<void> => {
    orgErrorMessage.value = ''
    orgListLoading.value = true
    try {
      const list = await fetchOrgList()
      orgList.value = list
      orgTree.value = buildOrgTreeFromFlat(list)
      if (list.length === 0) {
        selectedOrgId.value = null
        orgUserList.value = []
      } else if (selectedOrgId.value == null || !list.some((o) => o.orgId === selectedOrgId.value)) {
        selectedOrgId.value = getFirstOrgIdInTree(orgTree.value) ?? list[0]?.orgId ?? null
      }
      if (selectedOrgId.value) {
        await handleFetchOrgUserList(selectedOrgId.value)
      }
    } catch (error) {
      orgList.value = []
      orgTree.value = []
      selectedOrgId.value = null
      orgUserList.value = []
      const message = error instanceof Error ? error.message : '조직 목록 조회 중 오류가 발생했습니다.'
      orgErrorMessage.value = message
    } finally {
      orgListLoading.value = false
    }
  }

  const handleSelectOrg = async (orgId: string): Promise<void> => {
    selectedOrgId.value = orgId
    await handleFetchOrgUserList(orgId)
  }

  const openAddOrgModal = (): void => {
    orgEditMode.value = 'add'
    orgAddErrorMessage.value = ''
    orgAddForm.value = createDefaultOrgAddForm(selectedOrgId.value ?? '')
    isOrgAddModalOpen.value = true
  }

  const openEditOrgModal = (): void => {
    const selected = getSelectedOrg()
    if (!selected) return
    orgEditMode.value = 'edit'
    orgAddErrorMessage.value = ''
    orgAddForm.value = {
      orgNm: normalizeOrgNm(selected.orgNm),
      parentOrgId: normalizeParentOrgId(selected.parentOrgId),
      useYn: selected.useYn === 'N' ? 'N' : 'Y',
    }
    isOrgAddModalOpen.value = true
  }

  const closeAddOrgModal = (): void => {
    isOrgAddModalOpen.value = false
    orgAddErrorMessage.value = ''
    orgEditMode.value = 'add'
  }

  const handleCreateOrg = async (): Promise<void> => {
    const parentOrgId = normalizeParentOrgId(orgAddForm.value.parentOrgId)
    const payload: InsertOrgPayload = {
      orgNm: normalizeOrgNm(orgAddForm.value.orgNm),
      parentOrgId,
      useYn: orgAddForm.value.useYn,
    }

    try {
      const res = await fetchInsertOrg(payload)
      if (res?.successYn === false) {
        orgAddErrorMessage.value = String(res.returnMsg ?? '조직 추가에 실패했습니다.')
        return
      }
      closeAddOrgModal()
      await handleFetchOrgList()
      openToast({ message: '조직이 추가되었습니다.' })
    } catch (error) {
      orgAddErrorMessage.value = error instanceof Error ? error.message : '조직 추가 중 오류가 발생했습니다.'
    }
  }

  const handleUpdateOrg = async (): Promise<void> => {
    const selected = getSelectedOrgOrWarn('수정할 조직을 먼저 선택해 주세요.')
    if (!selected) return

    const parentOrgId = normalizeParentOrgId(orgAddForm.value.parentOrgId)
    if (parentOrgId === selected.orgId) {
      orgAddErrorMessage.value = '상위 조직으로 자기 자신을 선택할 수 없습니다.'
      return
    }

    const payload = createUpdatePayload({
      orgId: selected.orgId,
      orgNm: normalizeOrgNm(orgAddForm.value.orgNm),
      parentOrgId,
      useYn: orgAddForm.value.useYn,
    })

    try {
      const res = await fetchUpdateOrg(payload)
      if (res?.successYn === false) {
        orgAddErrorMessage.value = String(res.returnMsg ?? '조직 수정에 실패했습니다.')
        return
      }
      closeAddOrgModal()
      await handleFetchOrgList()
      openToast({ message: '조직이 수정되었습니다.' })
    } catch (error) {
      orgAddErrorMessage.value = error instanceof Error ? error.message : '조직 수정 중 오류가 발생했습니다.'
    }
  }

  const handleDeleteOrg = async (): Promise<void> => {
    const selected = getSelectedOrgOrWarn('삭제할 조직을 먼저 선택해 주세요.')
    if (!selected) return

    const ok = await openConfirm({
      title: '삭제 확인',
      message: `"${selected.orgNm}" 조직을 삭제하시겠습니까?`,
      confirmText: '삭제',
    })
    if (!ok) return

    try {
      const res = await fetchDeleteOrg(selected.orgId)
      if (res?.successYn === false) {
        orgAddErrorMessage.value = String(res.returnMsg ?? '조직 삭제에 실패했습니다.')
        return
      }
      closeAddOrgModal()
      await handleFetchOrgList()
      openToast({ message: '조직이 삭제되었습니다.' })
    } catch (error) {
      orgAddErrorMessage.value = error instanceof Error ? error.message : '조직 삭제 중 오류가 발생했습니다.'
    }
  }

  const handleUpdateOrgOrder = async (payload: UpdateOrgSortOrderPayload): Promise<void> => {
    const body: UpdateOrgSortOrderPayload = {
      orgId: payload.orgId,
      sortOrder: Math.max(1, Number(payload.sortOrder) || 1),
      parentOrgId: normalizeParentOrgId(payload.parentOrgId),
    }

    try {
      const res = await fetchUpdateOrgOrder(body)
      if (res?.successYn === false) {
        openToast({ message: String(res.returnMsg ?? '조직 순서 저장에 실패했습니다.'), type: 'error' })
        await handleFetchOrgList()
        return
      }
      openToast({ message: '조직 순서가 저장되었습니다.' })
      await handleFetchOrgList()
    } catch (error) {
      openToast({
        message: error instanceof Error ? error.message : '조직 순서 저장 중 오류가 발생했습니다.',
        type: 'error',
      })
      await handleFetchOrgList()
    }
  }

  const handleToggleOrgExpand = (orgId: string): void => {
    toggleOrgNodeExpanded(orgTree.value, orgId)
  }

  const orgOptions = computed(() => orgList.value.map((item) => ({ label: item.orgNm, value: item.orgId })))

  return {
    orgList,
    orgTree,
    selectedOrgId,
    orgListLoading,
    orgErrorMessage,
    orgUserList,
    orgUserListLoading,
    orgUserErrorMessage,
    isOrgAddModalOpen,
    orgEditMode,
    orgAddForm,
    orgAddErrorMessage,
    handleFetchOrgList,
    handleFetchOrgUserList,
    handleSelectOrg,
    openAddOrgModal,
    openEditOrgModal,
    closeAddOrgModal,
    handleCreateOrg,
    handleUpdateOrg,
    handleUpdateOrgOrder,
    handleDeleteOrg,
    handleToggleOrgExpand,
    orgOptions,
  }
}

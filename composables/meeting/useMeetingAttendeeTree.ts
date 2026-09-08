import { computed, ref } from 'vue'
import { useUserSelectApi } from '~/composables/com/useUserSelectApi'
import type { OrgItem, OrgTreeItem, OrgUserItem } from '~/types/org-manage'
import type { MeetingAttendeeOrgNode, MeetingAttendeeUserItem } from '~/types/meeting'

/** 플랫 조직 목록 → 트리 */
const buildOrgTree = (items: OrgItem[]): OrgTreeItem[] => {
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

const toAttendeeUser = (user: OrgUserItem): MeetingAttendeeUserItem => ({
  userId: String(user.userId ?? '').trim(),
  userNm: String(user.userNm ?? '').trim(),
})

const attachUsersToOrgTree = (
  nodes: OrgTreeItem[],
  usersByOrg: Map<string, MeetingAttendeeUserItem[]>,
): MeetingAttendeeOrgNode[] => {
  return nodes.map((node) => ({
    orgId: node.orgId,
    orgNm: node.orgNm,
    expanded: true,
    children: attachUsersToOrgTree(node.children ?? [], usersByOrg),
    users: usersByOrg.get(node.orgId) ?? [],
  }))
}

/** 하위 부서 포함 사용자 (userId 기준 중복 제거) */
export const collectAttendeeUsers = (node: MeetingAttendeeOrgNode): MeetingAttendeeUserItem[] => {
  const seen = new Set<string>()
  const result: MeetingAttendeeUserItem[] = []

  const walk = (current: MeetingAttendeeOrgNode): void => {
    for (const user of current.users) {
      if (!user.userId || seen.has(user.userId)) continue
      seen.add(user.userId)
      result.push(user)
    }
    current.children.forEach(walk)
  }

  walk(node)
  return result
}

const toggleOrgExpanded = (nodes: MeetingAttendeeOrgNode[], orgId: string): boolean => {
  for (const node of nodes) {
    if (node.orgId === orgId) {
      node.expanded = !node.expanded
      return true
    }
    if (node.children.length && toggleOrgExpanded(node.children, orgId)) return true
  }
  return false
}

const filterAttendeeTree = (nodes: MeetingAttendeeOrgNode[], keyword: string): MeetingAttendeeOrgNode[] => {
  return nodes.reduce<MeetingAttendeeOrgNode[]>((acc, node) => {
    const children = filterAttendeeTree(node.children, keyword)
    const isOrgMatched = String(node.orgNm ?? '')
      .toLowerCase()
      .includes(keyword)
    const users = isOrgMatched
      ? node.users
      : node.users.filter((user) => user.userNm.toLowerCase().includes(keyword))

    if (!isOrgMatched && !children.length && !users.length) return acc

    acc.push({
      ...node,
      children,
      users,
      expanded: true,
    })
    return acc
  }, [])
}

export const useMeetingAttendeeTree = () => {
  const { fetchOrgList, fetchOrgUserList } = useUserSelectApi()

  const attendeeTree = ref<MeetingAttendeeOrgNode[]>([])
  const isAttendeeTreeLoading = ref(false)
  const attendeeTreeErrorMessage = ref('')
  const searchKeyword = ref('')

  const filteredAttendeeTree = computed<MeetingAttendeeOrgNode[]>(() => {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return attendeeTree.value
    return filterAttendeeTree(attendeeTree.value, keyword)
  })

  const handleLoadAttendeeTree = async (): Promise<void> => {
    attendeeTreeErrorMessage.value = ''
    isAttendeeTreeLoading.value = true
    try {
      const orgList = await fetchOrgList()
      const orgTree = buildOrgTree(orgList)
      const orgIds = orgList.map((org) => org.orgId).filter(Boolean)
      const results = await Promise.allSettled(orgIds.map((orgId) => fetchOrgUserList(orgId)))

      const usersByOrg = new Map<string, MeetingAttendeeUserItem[]>()
      orgIds.forEach((orgId, index) => {
        const result = results[index]
        const list = result?.status === 'fulfilled' ? result.value : []
        const users = list
          .map(toAttendeeUser)
          .filter((user) => user.userId)
          .sort((a, b) => a.userNm.localeCompare(b.userNm, 'ko'))
        usersByOrg.set(orgId, users)
      })

      attendeeTree.value = attachUsersToOrgTree(orgTree, usersByOrg)
    } catch (error) {
      attendeeTree.value = []
      attendeeTreeErrorMessage.value =
        error instanceof Error ? error.message : '참석자 조직도를 불러오지 못했습니다.'
    } finally {
      isAttendeeTreeLoading.value = false
    }
  }

  const handleToggleAttendeeOrgExpand = (orgId: string): void => {
    toggleOrgExpanded(attendeeTree.value, orgId)
  }

  return {
    attendeeTree,
    filteredAttendeeTree,
    isAttendeeTreeLoading,
    attendeeTreeErrorMessage,
    searchKeyword,
    handleLoadAttendeeTree,
    handleToggleAttendeeOrgExpand,
  }
}

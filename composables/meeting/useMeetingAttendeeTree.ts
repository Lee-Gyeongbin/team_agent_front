import { computed, ref } from 'vue'
import { useUserSelectApi } from '~/composables/com/useUserSelectApi'
import type { OrgTreeItem, OrgUserItem } from '~/types/org-manage'
import type { MeetingAttendeeOrgNode, MeetingAttendeeUserItem } from '~/types/meeting'
import { buildOrgTree } from '~/utils/global/orgTreeUtil'

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

/** 하위 부서 펼침 상태 일괄 변경 — 접을 때도 최상위(depth 0)는 펼친 채로 둔다 */
const setOrgExpanded = (nodes: MeetingAttendeeOrgNode[], expanded: boolean, depth: number): void => {
  for (const node of nodes) {
    node.expanded = expanded || depth === 0
    setOrgExpanded(node.children, expanded, depth + 1)
  }
}

/** orgId 로 트리 노드 찾기 */
export const findAttendeeOrgNode = (nodes: MeetingAttendeeOrgNode[], orgId: string): MeetingAttendeeOrgNode | null => {
  for (const node of nodes) {
    if (node.orgId === orgId) return node
    const found = findAttendeeOrgNode(node.children, orgId)
    if (found) return found
  }
  return null
}

export const useMeetingAttendeeTree = () => {
  const { fetchOrgList, fetchOrgUserList } = useUserSelectApi()

  const attendeeTree = ref<MeetingAttendeeOrgNode[]>([])
  const isAttendeeTreeLoading = ref(false)
  const attendeeTreeErrorMessage = ref('')

  /** 트리 전체 사용자 (userId 기준 중복 제거) — 이름 검색 대상 */
  const allAttendeeUsers = computed<MeetingAttendeeUserItem[]>(() => {
    const seen = new Set<string>()
    const result: MeetingAttendeeUserItem[] = []
    for (const root of attendeeTree.value) {
      for (const user of collectAttendeeUsers(root)) {
        if (seen.has(user.userId)) continue
        seen.add(user.userId)
        result.push(user)
      }
    }
    return result
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

  const handleSetAllAttendeeOrgExpanded = (expanded: boolean): void => {
    setOrgExpanded(attendeeTree.value, expanded, 0)
  }

  return {
    attendeeTree,
    allAttendeeUsers,
    isAttendeeTreeLoading,
    attendeeTreeErrorMessage,
    handleLoadAttendeeTree,
    handleToggleAttendeeOrgExpand,
    handleSetAllAttendeeOrgExpanded,
  }
}

import type { OrgItem, OrgTreeItem } from '~/types/org-manage'

/** 조직 플랫 목록 → 트리 (부모가 없거나 목록에 없으면 최상위) */
export const buildOrgTree = (items: OrgItem[]): OrgTreeItem[] => {
  if (!items.length) return []

  const idSet = new Set(items.map((item) => item.orgId))
  const nodeMap = new Map<string, OrgTreeItem>()
  items.forEach((item) => nodeMap.set(item.orgId, { ...item, children: [], expanded: true }))

  const roots: OrgTreeItem[] = []
  items.forEach((item) => {
    const node = nodeMap.get(item.orgId)
    if (!node) return
    const parentId = String(item.parentOrgId ?? '').trim()
    const isRoot = !parentId || parentId === '0' || parentId === '-1' || !idSet.has(parentId)
    const parent = isRoot ? undefined : nodeMap.get(parentId)
    if (parent) (parent.children ??= []).push(node)
    else roots.push(node)
  })
  return roots
}

/** orgId 로 트리 노드 찾기 */
export const findOrgNode = (nodes: OrgTreeItem[], orgId: string): OrgTreeItem | null => {
  for (const node of nodes) {
    if (node.orgId === orgId) return node
    const found = findOrgNode(node.children ?? [], orgId)
    if (found) return found
  }
  return null
}

/** 노드 펼침/접힘 토글 — 토글했으면 true */
export const toggleOrgNode = (nodes: OrgTreeItem[], orgId: string): boolean => {
  const node = findOrgNode(nodes, orgId)
  if (!node) return false
  node.expanded = !(node.expanded ?? true)
  return true
}

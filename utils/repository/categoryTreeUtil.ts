import type { CategoryTreeItem } from '~/types/repository'

/** 선택한 카테고리 + 모든 자손 categoryId (문서 목록 필터 등) */
export function collectDescendantIds(items: CategoryTreeItem[], targetId: string): string[] {
  const ids: string[] = []
  const collect = (list: CategoryTreeItem[]) => {
    for (const item of list) {
      ids.push(item.categoryId)
      if (item.children?.length) collect(item.children)
    }
  }
  const findAndCollect = (list: CategoryTreeItem[]): boolean => {
    for (const item of list) {
      if (item.categoryId === targetId) {
        ids.push(item.categoryId)
        if (item.children?.length) collect(item.children)
        return true
      }
      if (item.children?.length && findAndCollect(item.children)) return true
    }
    return false
  }
  findAndCollect(items)
  return ids
}

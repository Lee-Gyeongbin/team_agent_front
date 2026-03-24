/** 카테고리 한 행 (selectCategoryList WITH RECURSIVE 결과 — 평면 리스트, SORT_PATH 순) */
export interface CategoryItem {
  categoryId: string
  categoryName: string
  /** 루트는 null 또는 빈 문자열 */
  parnCatId: string | null
  catLvl: string
  sortOrd: string
  sortPath: string
  depth: string
}

/** 화면용 트리 노드 (API 행 + 자식·펼침 상태) */
export interface CategoryTreeItem extends CategoryItem {
  children?: CategoryTreeItem[]
  expanded?: boolean
}

/** 문서 항목 */
export interface Document {
  docId: string
  docTitle: string
  categoryId: string
  categoryName: string
  author: string
  secLvl: string
  content: string
  fileName: string
  filePath: string
  fileSize: string
  fileType: string
  keywords: string
  refUrl: string
  useYn: string
  dsDocCnt: string
  createDt: string
}

/** URL 항목 */
export interface UrlItem {
  id: string
  category: string
  urlAddress: string
  urlName: string
  collectionCycle: string
  lastCollectedAt: string
  active: boolean
  categoryId?: string
}

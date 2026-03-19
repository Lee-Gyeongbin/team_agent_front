/** 카테고리 트리 항목 (재귀 구조 — 문서 탭 좌측 패널, 카테고리 선택 모달 공용) */
export interface CategoryItem {
  id: string
  name: string
  expanded?: boolean
  children?: CategoryItem[]
}

/** 문서 항목 */
export interface Document {
  id: string
  documentName: string
  fileType: string
  fileSize: string
  registerDate: string
  status: string
  ragCount: number
  categoryId?: string
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

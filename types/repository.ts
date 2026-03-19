/** 카테고리 트리 항목 (재귀 구조 — 문서 탭 좌측 패널, 카테고리 선택 모달 공용) */
export interface CategoryItem {
  id: string
  name: string
  expanded?: boolean
  children?: CategoryItem[]
}

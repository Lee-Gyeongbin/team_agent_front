/** 라이브러리 카테고리 */
export interface LibraryCategory {
  categoryId: number
  userId: string
  categoryNm: string
  color: string
  sortOrd: number
  createDt: string
}

/** 라이브러리 카드 */
export interface LibraryCard {
  cardId: string
  userId: string
  categoryId: number
  logId: string
  svcTy: string
  title: string
  tags: string
  pinYn: 'Y' | 'N'
  archiveYn: 'Y' | 'N'
  sortOrd: number
  srcDocs: string
  sqlCode: string
  chartCfg: string
  qryRslt: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 카테고리별 카드 맵 (categoryId → cards) */
export type CategoryCardsMap = Record<number, LibraryCard[]>

/** 정렬 옵션 */
export interface LibrarySearchOption {
  label: string
  value: string
}

/** 카테고리 순서 변경 요청 항목 */
export interface LibraryCategoryOrderItem {
  categoryId: number
  order: number
}

/** 카드 순서 변경 요청 항목 */
export interface LibraryCardOrderItem {
  cardId: string
  order: number
}

/** 카드 순서 변경 요청 (카테고리별) */
export interface LibraryCardOrderPayload {
  categoryId: number
  cards: LibraryCardOrderItem[]
}

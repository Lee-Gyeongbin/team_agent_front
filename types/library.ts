/** 라이브러리 카테고리 */
export interface LibraryCategory {
  categoryId: string
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
  archiveDt: string
  sortOrd: number
  srcDocs: string
  sqlCode: string
  chartCfg: string
  qryRslt: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 카드 상세 */
export interface LibraryCardDetail {
  cardId: string
  userId: string
  categoryId: number
  logId: string
  svcTy: string
  title: string
  tags: string
  pinYn: 'Y' | 'N'
  archiveYn: 'Y' | 'N'
  archiveDt: string
  sortOrd: number
  srcDocs: string
  sqlCode: string
  chartCfg: string
  qryRslt: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
  qcontent: string
  rcontent: string
  ttsq: string
}

/** 카테고리별 카드 맵 (categoryId → cards) */
export type CategoryCardsMap = Record<string, LibraryCard[]>

/** 정렬 옵션 */
export interface LibrarySearchOption {
  label: string
  value: string
}

/** 카테고리 순서 변경 요청 항목 */
export interface LibraryCategoryOrderItem {
  categoryId: string
  sortOrd: number
}

/** 카드 순서 변경 요청 항목 */
export interface LibraryCardOrderItem {
  cardId: string
  sortOrd: number
}

/** 카드 순서 변경 요청 (카테고리별) */
export interface LibraryCardOrderPayload {
  categoryId: string
  cards: LibraryCardOrderItem[]
}

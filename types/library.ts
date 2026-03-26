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
  sqlCode: string
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
  sqlCode: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
  qcontent: string
  rcontent: string
  ttsq: string
}

/** 문서 항목 */
export interface DocItem {
  docId: string
  docTitle: string
  categoryId: string
  author: string
  secLvl: string
  content: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  keywords: string
  refUrl: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
  relatedPages: string
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

/** 테이블 데이터 */
export interface TableDataItem {
  logId: string
  tableData: string
}

/** 차트 라벨 항목 TODO : 프로토타입 시연용*/

export interface ChartStatItem {
  statId: string
  statNm: string
}

export interface ChartDetailCdItem {
  detailItemCd: string
  detailItemNm: string
}

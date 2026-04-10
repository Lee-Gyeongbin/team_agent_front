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
  newYn: 'Y' | 'N'
  thumbImg: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
}

/** 카드 상세 */
export interface LibraryCardDetail {
  cardId: string
  userId: string
  categoryId: number
  categoryNm: string
  logId: string
  svcTy: string
  title: string
  tags: string
  pinYn: 'Y' | 'N'
  archiveYn: 'Y' | 'N'
  archiveDt: string
  sortOrd: number
  sqlCode: string
  newYn: 'Y' | 'N'
  thumbImg: string
  useYn: 'Y' | 'N'
  createDt: string
  modifyDt: string
  qcontent: string
  rcontent: string
  ttsq: string
  agentId: string
  agentNm: string
  iconClassNm: string
  colorHex: string
}

/** 문서 항목 */
export interface DocItem {
  docId: string
  docFileId: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  relatedPages: string
}

/** 카테고리별 카드 맵 (categoryId → cards) */
export type CategoryCardsMap = Record<string, LibraryCard[]>

/** 정렬 옵션 */
export interface LibrarySearchOption {
  label: string
  value: string
}

/**
 * AI 생성 보고서 값 — 백엔드/DB 템플릿의 jsonKey와 1:1 매핑 (필드 정의는 가변)
 * 응답 JSON을 그대로 파싱해 키 기준으로 채움
 */
export type LibraryGeneratedReportValues = Record<string, string>

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

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
  reportHtml: string
  agentId: string
  agentNm: string
  iconClassNm: string
  colorHex: string
}

/** 문서 항목 */
export interface DocItem {
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
  chartOption?: string
  sql?: string
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

/** 카드 공유 요청 payload */
export interface ShareCardPayload {
  cardId: string
  userIds: string[]
  shareMsg?: string
}

/** 보고서 인사이트 분석 — 반영 위치 */
export type LibraryInsightPlacement = 'NEW_SECTION' | 'REPLACE'

/** 보고서 인사이트 분석 API 요청 */
export interface LibraryInsightReportRequest {
  roomId: string
  insightPlacement: LibraryInsightPlacement
  /** REPLACE일 때만 */
  targetValueKey?: string
  rContent: string
  currentHtml: string
}

/** 보고서 인사이트 분석 API 응답 */
export interface LibraryInsightReportResponse {
  successYn: boolean
  returnMsg: string
  data: string
}

/** 지식카드 차트 설정 (TB_KNOW_CARD_CHART) */
export interface KnowChartItem {
  chartId: string
  cardId: string
  chartType: string
  chartTargetKey: string
  yAxisKeys: string[]
  seriesKey: string
  statIdFilter: string
  stackYn: 'Y' | 'N'
  dualAxisYn: 'Y' | 'N'
  ylChartType?: string | null
  yrChartType?: string | null
  sortOrd: number
  createDt: string
}

/** 지식카드 차트 저장 요청 payload */
export interface KnowChartSavePayload {
  cardId: string
  chartType: string
  chartTargetKey: string
  yAxisKeys: string[]
  seriesKey: string
  statIdFilter: string
  stackYn: 'Y' | 'N'
  dualAxisYn: 'Y' | 'N'
  ylChartType?: string | null
  yrChartType?: string | null
  sortOrd: number
}

/** 지식카드 차트 수정 요청 payload */
export interface KnowChartUpdatePayload {
  chartId: string
  chartType: string
  chartTargetKey: string
  yAxisKeys: string[]
  seriesKey: string
  statIdFilter: string
  stackYn: 'Y' | 'N'
  dualAxisYn: 'Y' | 'N'
  ylChartType?: string | null
  yrChartType?: string | null
  sortOrd: number
}

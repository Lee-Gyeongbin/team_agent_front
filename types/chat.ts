// 메세지
export interface ChatMessage {
  id?: string
  logId: string
  type: 'question' | 'answer'
  qContent?: string
  rContent?: string
  createdAt: string
  isStreaming?: boolean
  isLiked?: boolean
  isDisliked?: boolean
  hasSource?: boolean
  hasVisualization?: boolean
  sourceUrl?: string
  visualizationData?: {
    sql?: string
    chartTitle?: string
  }
  /** 서비스 타입: C=일반(디폴트), M=지식검색, S=데이터분석 */
  svcTy?: string
  /** 참조 ID (지식베이스/데이터마트 등) */
  refId?: string
  /** 출처 문서 ID */
  docId?: string
  /** 문서 존재 여부 (Y/N) */
  docExist?: 'Y' | 'N'
  [key: string]: unknown
}

// 메세지 기본값
export const EMPTY_CHAT_MESSAGE: ChatMessage = {
  id: '',
  logId: '',
  type: 'question',
  qContent: '',
  rContent: '',
  createdAt: '',
  isStreaming: false,
  isLiked: false,
  isDisliked: false,
  hasSource: false,
  hasVisualization: false,
  sourceUrl: '',
  visualizationData: {
    sql: '',
    chartTitle: '',
  },
  svcTy: '',
  refId: '',
  docId: '',
  docExist: 'N',
}

export type PanelType = 'none' | 'pdf' | 'visualization'

export interface ModelOption {
  label: string
  value: string
}
export const EMPTY_MODEL_OPTION: ModelOption = {
  label: '',
  value: '',
}

export type SearchModeValue = 'M' | 'S'

export interface SearchModeOption {
  label: string
  value: SearchModeValue
  icon: string
}

export interface SubOption {
  label: string
  value: string
}

export interface ChatRoom {
  roomId: string
  title: string
  svcTy: string
  qContent: string
  createdAt: string
}

/** 빈 대화방 기본값 — 리셋, 초기화 시 재사용 */
export const EMPTY_CHAT_ROOM: ChatRoom = {
  roomId: '',
  title: '',
  svcTy: '',
  qContent: '',
  createdAt: '',
}

/** 채팅 로그 목록 API 응답 한 건 (백엔드 VO — qcontent, rcontent, createDt, svcTy 등) */
export interface ChatLogListRow {
  logId?: number
  qcontent?: string
  rcontent?: string
  createDt?: string
  /** 서비스 타입: C=일반(디폴트), M=지식검색, S=데이터분석 */
  svcTy?: string
  /** 참조 ID (지식베이스/데이터마트 등) */
  refId?: string
  /** 출처 문서 ID */
  docId?: string
  /** 문서 존재 여부 (Y/N) */
  docExist?: 'Y' | 'N'
  /** 시각화 데이터 존재 여부 (Y/N) */
  tableExist?: 'Y' | 'N'
  /** 시각화 SQL */
  ttsq?: string
  /** 시각화 테이블 원본(JSON 문자열) */
  tableData?: string
  [key: string]: unknown
}

/** TB_CHAT_REF JOIN TB_DOC API 응답 한 건 */
export interface ChatRefRow {
  logId: string
  docId: string
  mainPageNo: number
  relatedPages: string // JSON 배열 "[63,75,88]" 또는 쉼표 구분 "1,3,5"
  createDt: string
  docTitle: string
  fileName: string
  filePath: string
}

/** 시각화 데이터 목록 API 응답 한 건 */
export interface VisualizationDataRow {
  logId: string
  ttsq?: string
  tableData?: string
}
export const EMPTY_VISUALIZATION_DATA_ROW: VisualizationDataRow = {
  logId: '',
  ttsq: '',
  tableData: '',
}

export type VisualizationStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'
export type VisualizationChartType = 'bar' | 'line' | 'pie'

export interface VisualizationSelectOption {
  label: string
  value: string
}

export interface VisualizationSchema {
  columns: string[]
  dimensionKeys: string[]
  metricKeys: string[]
  xAxisKey: string
  defaultLegendKey: string
  defaultMetricKey: string
  isTimeAxis: boolean
  hasYearMonth: boolean
  hasYearQuarter: boolean
}

export interface VisualizationViewModel {
  messageId: string
  status: VisualizationStatus
  sql: string
  rawTableData: string
  rows: Array<Record<string, unknown>>
  schema: VisualizationSchema | null
  errorMessage?: string
}

// PDF 뷰어 (ChatPdfPanel) 관련 타입
export interface ChatPdfPanelProps {
  open: boolean
  messageId?: string | null
  refList?: ChatRefRow[]
}

export interface PdfViewport {
  width: number
  height: number
}

export interface PdfPageProxy {
  getViewport: (params: { scale: number }) => PdfViewport
  render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => {
    promise: Promise<void>
  }
}

export interface PdfDocumentProxy {
  numPages: number
  getPage: (pageNum: number) => Promise<PdfPageProxy>
}

export interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (params: { url: string }) => { promise: Promise<PdfDocumentProxy> }
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib
  }
}

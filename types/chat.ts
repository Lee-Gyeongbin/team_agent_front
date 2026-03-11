export interface ChatMessage {
  logId: string
  role: 'user' | 'assistant' | 'system'
  qContent: string
  rContent: string
  docId?: string
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

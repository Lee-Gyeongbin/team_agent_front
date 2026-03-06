export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
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

export type SearchModeValue = 'knowledge' | 'sql'

export interface SearchModeOption {
  label: string
  value: SearchModeValue
  icon: string
}

export interface ChatRoom {
  id: string
  title: string
  model: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// PDF 뷰어 (ChatPdfPanel) 관련 타입
export interface ChatPdfPanelProps {
  open: boolean
  messageId?: string | null
  filePath?: string
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

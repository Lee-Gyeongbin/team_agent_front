// ============================================
// 타입 정의
// ============================================
export interface ChatSocketPayload {
  type: string
  query: string
  threadId: string
  svcTy: string
  modelId: string
  refId: string
  agentId?: string
  attachments?: ChatAttachmentMeta[]
}

/** 질문 전송 시 AI API에 전달할 첨부 메타 */
export interface ChatAttachmentMeta {
  chatFileId: string
  fileName: string
  filePath: string
  mimeType: string
}

/** 질문 말풍선·미리보기에 쓰는 첨부 (업로드 메타 + 선택적 로컬 썸네일 URL) */
export interface ChatMessageAttachment extends ChatAttachmentMeta {
  /** 전송 직후 로컬 미리보기(blob) — 새로고침 후에는 비어 있음 */
  localPreviewUrl?: string
}

/** /ai/chatbot/viewChatFile.do — FileService 뷰 응답과 동일 키 */
export interface ChatFileViewResponse {
  viewType?: string
  url?: string
  content?: string
  encoding?: string
  fileName?: string
  reason?: string
  downloadUrl?: string
}

/** 채팅 첨부파일 메타 저장 요청 */
export interface ChatFileSavePayload {
  roomId: string
  fileName: string
  storeFileName: string
  filePath: string
  fileSize: number
  fileType: string
  mimeType: string
}

/** 채팅 첨부파일 메타 저장 응답 */
export interface ChatFileSaveResponse {
  /** 백엔드에 따라 숫자로 내려올 수 있음 */
  chatFileId?: string | number
  fileName?: string
  filePath?: string
  mimeType?: string
}

/** Vertex/Google 검색 그라운딩 등 Web 출처 스트리밍 청크 */
export interface ChatGroundingSourceItem {
  url: string
  title?: string
}

export interface ChatSocketMessage {
  type: string
  content?: string
  /** 스트리밍 청크 종류 — answer_source 등 (없으면 답변 텍스트 델타) */
  chunkEvent?: string
  /** chunkEvent별 누적 페이로드 (예: answer_source → {"items":[...]} JSON 문자열) */
  accumulated?: string
  docFileId?: string
  /** 완료 시 서버에서 내려주는 로그 ID (있으면 스트리밍 메시지에 반영) */
  logId?: string
  tableData?: string
}
// 메세지
export interface ChatMessage {
  id?: string
  logId: string
  type: 'question' | 'answer' | 'survey'
  qContent?: string
  rContent?: string
  createdAt: string
  isStreaming?: boolean
  chatLogReaction?: ChatLogReaction
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
  /** 질문에 매핑된 에이전트 ID */
  agentId?: string
  /** 출처 파일 ID (TB_DOC_FILE.DOC_FILE_ID) */
  docFileId?: string
  /** 문서 존재 여부 (Y/N) */
  docExist?: 'Y' | 'N'
  /** 시각화 테이블 원본 JSON (로그 목록 조회·스트리밍 완료 시) */
  tableData?: string
  /** 질문에 첨부된 파일 (전송 직후 UI; 로그 API에 첨부 필드가 없으면 재조회 시 비어 있을 수 있음) */
  attachments?: ChatMessageAttachment[]
  /** Web 검색/그라운딩 출처 (answer_source 스트리밍 청크로 수신) */
  groundingSources?: ChatGroundingSourceItem[]
  /** 클라이언트 전용: 설문 진단 프롬프트 등 화면에 노출하지 않을 메시지 */
  hiddenFromDisplay?: boolean
  /** 산업심리 설문 메시지(type=survey) 전용: 사용자 응답 */
  surveyAnswers?: Record<number, number>
  /** 산업심리 설문 메시지(type=survey) 전용: 제출 완료 여부 */
  surveySubmitted?: boolean
  /** 점심 추천 카드(uiType=lunch-card) 전용: 사용자 응답 */
  lunchFormPayload?: LunchAgentFormPayload
  /** 점심 추천 카드(uiType=lunch-card) 전용: 제출 완료 여부 */
  lunchSubmitted?: boolean
  /** 답변 말풍선 내 특수 UI 렌더 타입 */
  uiType?: 'lunch-card'
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
  chatLogReaction: undefined,
  hasSource: false,
  hasVisualization: false,
  sourceUrl: '',
  visualizationData: {
    sql: '',
    chartTitle: '',
  },
  svcTy: '',
  refId: '',
  agentId: '',
  docFileId: '',
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

export interface LunchCardMeta {
  lunchSelectCardDisplayYn?: string
  rcontent?: string
  logId?: string | number
  refId?: string
  svcTy?: string
  createDt?: string
  agentId?: string
  roomId?: string | number
  roomTitle?: string
  [key: string]: unknown
}

export interface DmListResponse {
  subOptionList?: SubOption[]
  data?: LunchCardMeta
  [key: string]: unknown
}

export interface LunchAgentFormPayload {
  sido: string
  sigungu: string
  dong: string
  mood: string
  budget: string
  peopleCount: string
  cuisineType: string
}

export interface LunchRecommendationItem {
  restaurant: string
  location: string
  menu: string
  price: string
}

export interface ChatRoom {
  roomId: string
  title: string
  svcTy: string
  qContent: string
  createdAt: string
  roomTitle: string
  fixYn: 'Y' | 'N'
}

/** 빈 대화방 기본값 — 리셋, 초기화 시 재사용 */
export const EMPTY_CHAT_ROOM: ChatRoom = {
  roomId: '',
  title: '',
  svcTy: '',
  qContent: '',
  createdAt: '',
  roomTitle: '',
  fixYn: 'N',
}

/** 채팅 로그 목록 API 응답 한 건 (백엔드 VO — qcontent, rcontent, createDt, svcTy 등) */
export interface ChatLogListRow {
  logId?: number
  qcontent?: string
  rcontent?: string
  createDt?: string
  /** 질문에 매핑된 에이전트 ID (백엔드 환경별 키 차이 허용) */
  agentId?: string
  AGENT_ID?: string
  agtId?: string
  /** 서비스 타입: C=일반(디폴트), M=지식검색, S=데이터분석 */
  svcTy?: string
  /** 참조 ID (지식베이스/데이터마트 등) */
  refId?: string
  /** 출처 파일 ID (TB_DOC_FILE.DOC_FILE_ID) */
  docFileId?: string
  /** 문서 존재 여부 (Y/N) */
  docExist?: 'Y' | 'N'
  /** 시각화 데이터 존재 여부 (Y/N) */
  tableExist?: 'Y' | 'N'
  /** 시각화 SQL */
  ttsq?: string
  /** 시각화 테이블 원본(JSON 문자열) */
  tableData?: string
  /** Web 그라운딩 출처 JSON 문자열 — {"items":[{"url","title"},...]} */
  webGroundingJson?: string
  /** 만족도 Y/N (목록 조회 시) */
  satisYn?: string
  satisContent?: string
  satisCd?: string
  /**
   * 질문(LOG)에 연결된 채팅 첨부 JSON 배열 문자열 (selectChatLogList)
   * 또는 일부 환경에서 파싱된 배열
   */
  chatAttachmentList?: string | unknown
  [key: string]: unknown
}

/** TB_CHAT_REF JOIN TB_DOC_FILE API 응답 한 건 */
export interface ChatRefRow {
  logId: string
  docFileId: string
  mainPageNo: number
  relatedPages: string // JSON 배열 "[63,75,88]" 또는 쉼표 구분 "1,3,5"
  createDt: string
  docTitle: string
  fileName: string
  filePath: string
  showDocFileId: string
  showPageNo: string
}

/** 좋아요/싫어요 등록 API 응답 한 건 */
export interface ChatLogReaction {
  logId?: string
  satisYn: string
  satisContent?: string
  /** 싫어요 사유 공통코드 */
  satisCd?: string
}

/** saveSatisYn.do 응답 (공통 successYn + data) */
export interface SaveChatLogReactionResponse {
  successYn?: boolean
  data?: ChatLogReaction
}

/** 시각화 데이터 목록 API 응답 한 건 */
export interface VisualizationStatItem {
  /** 통계 ID */
  statId?: string
  /** 통계명 */
  statNm?: string
}

export interface VisualizationStatDetailItem {
  /** 상세항목 코드 */
  detailItemCd?: string
  /** 상세항목명 */
  detailItemNm?: string
}

/** 시각화 데이터 목록 API 응답 한 건 */
export interface VisualizationDataRow {
  logId: string
  ttsq?: string
  tableData?: string
  /** 통계 ID - 명칭 매핑 정보 */
  statList?: VisualizationStatItem[]
  /** 상세항목 코드 - 명칭 매핑 정보 */
  statDetailList?: VisualizationStatDetailItem[]
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

export interface VisualizationColumnProfile {
  key: string
  uniqueCount: number
  nonEmptyCount: number
  uniqueRatio: number
  isNumeric: boolean
  isTimeLike: boolean
  isCodeLike: boolean
  isLikelyMetric: boolean
}

export interface VisualizationSelectableOptions {
  chartTargetKeys: string[]
  yAxisKeys: string[]
  /** 시리즈 분리에 사용할 수 있는 dimension 키 목록 (유니크값 2~20개) */
  seriesKeys: string[]
  chartTypes: VisualizationChartType[]
  canStack: boolean
  canDualAxis: boolean
}

export interface VisualizationChartSelection {
  chartType: VisualizationChartType
  chartTargetKey: string
  yAxisKeys: string[]
  /** 행 기반 시리즈 분리 키 (빈 문자열 = 미사용) */
  seriesKey: string
  stack: boolean
  dualAxis: boolean
  /** STAT_ID 컬럼이 있을 때 필터할 통계 ID (없으면 미사용) */
  statIdFilter?: string
}

export interface VisualizationSchema {
  columns: string[] // 전체 컬럼
  dimensionKeys: string[] // X축 컬럼
  metricKeys: string[] // 통계값(Y축) 컬럼
  profiles: VisualizationColumnProfile[] // 컬럼 프로파일
  selectableOptions: VisualizationSelectableOptions // 선택 가능한 옵션
  defaultSelection: VisualizationChartSelection // 초기 추천 선택값
  /** 행 데이터에 통계ID 컬럼이 있으면 실제 키명 (축 선택·시리즈에서 제외하고 통계 지정 UI에 사용) */
  statIdColumnKey?: string
}

// 시각화 뷰 모델
export interface VisualizationViewModel {
  messageId: string
  status: VisualizationStatus
  sql: string
  rawTableData: string
  rows: Array<Record<string, unknown>>
  schema: VisualizationSchema | null
  errorMessage?: string
  /** 통계 ID → 명칭 매핑 (API 응답 원본) */
  statList?: VisualizationStatItem[]
  /** 상세항목 코드 → 명칭 매핑 (API 응답 원본) */
  statDetailList?: VisualizationStatDetailItem[]
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

export interface KnowledgeItem {
  categoryId: string
  userId: string
  categoryNm: string
  color: string
  sortOrd: number
  createDt: string
}

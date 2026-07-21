// PT 제안 에이전트 타입 정의

/** TB_CODE CODE_GRP_ID = 'PT000002' 하위 CODE_ID */
export type PtProjectStatusCd = '001' | '002' | '003' | '004'
// 001=작성중, 002=검수중, 003=완료, 004=보류

/** 제안 구분 (TARGET_TYPE_CD: G=공공, P=민간) */
export type PtTargetTypeCd = 'G' | 'P'

// ── TB_PT_FILE ─────────────────────────────────────────────────────────────────

/** TB_PT_FILE.FILE_PURPOSE_CD (PT000011) */
export type PtFilePurposeCd = '001' | '002' | '003' | '004' | '005' | '006'
// 001=RFP원문, 002=평가표, 003=템플릿, 004=기타참고자료, 005=자사정보, 006=경쟁사정보

/** TB_PT_FILE - PT 첨부파일 */
export interface PtFile {
  ptFileId: string
  ptProjectId: string
  filePurposeCd: PtFilePurposeCd
  filePath: string
  fileNm: string
  fileSize: number
  fileType: string
  createDt: string
}

/** PT 파일 업로드 presigned URL 발급 요청 */
export interface PtFileUploadUrlRequest {
  fileName: string
  fileType: string
  fileSize: string
  filePath: string
  filePurposeCd: PtFilePurposeCd
  ptProjectId?: string
}

/** PT 파일 메타 저장 요청 (NCP 업로드 완료 후) */
export interface PtFileSavePayload {
  ptProjectId?: string
  filePurposeCd: PtFilePurposeCd
  fileName: string
  storeFileName: string
  filePath: string
  fileSize: number
  fileType: string
  mimeType: string
}

/** PT 파일 메타 저장 응답 */
export interface PtFileSaveResponse {
  result: string
  ptFileId: string
  filePath: string
  fileName: string
}

// ── TB_PT_REQUIREMENT ──────────────────────────────────────────────────────────

/** TB_PT_REQUIREMENT - PT 요구사항 */
export interface PtRequirement {
  requirementId: string
  ptProjectId: string
  reqNo: string | null
  /** 요구사항 분류 코드 (PT000003: 001~015, null 허용) */
  reqCategoryCd: string | null
  reqContent: string
  mandatoryYn: 'Y' | 'N'
  /** 출처 유형 코드 (PT000004: 001=사실, 002=전략적해석, 003=확인필요) */
  sourceTypeCd: '001' | '002' | '003'
  rfpPageRef: string | null
  evalImpact: string | null
  responseDirection: string | null
  requiredEvidence: string | null
  confirmNeededYn: 'Y' | 'N'
  confirmNeededNote: string | null
  sortOrd: number
  createDt: string
}

// ── TB_PT_EVAL_CRITERIA ────────────────────────────────────────────────────────

/** TB_PT_EVAL_CRITERIA - PT 평가기준 */
export interface PtEvalCriteria {
  evalCriteriaId: string
  ptProjectId: string
  evalItemNm: string
  score: number
  evalIntent: string | null
  highScoreCondition: string | null
  requiredEvidence: string | null
  differentiationDirection: string | null
  slideReflectPosition: string | null
  sortOrd: number
  createDt: string
}

// ── Stage1 ─────────────────────────────────────────────────────────────────────

/** Stage1 작성지침 JSON 구조 */
export interface WritingGuideline {
  tocMandatoryYn: 'Y' | 'N'
  mandatedToc: { level: 'main' | 'sub'; no: string; title: string; parentNo: string | null }[]
  pageLimit: string | null
  formatRules: string | null
}

/** Stage1 SSE 이벤트 데이터 */
export interface Stage1SseEvent {
  event: 'connected' | 'progress' | 'warn' | 'done' | 'error'
  data: Stage1ProgressData | Stage1DoneData | Stage1ErrorData | { ptProjectId: string } | { message: string }
}

export interface Stage1ProgressData {
  step: 'extract' | 'prompt' | 'llm' | 'parse' | 'save'
  message: string
}

export interface Stage1DoneData {
  ptProjectId: string
  requirementCount: number
  evalCriteriaCount: number
  evalCriteriaEmpty: boolean
}

export interface Stage1ErrorData {
  message: string
}

/** Stage1 조회 결과 (selectStage1Result.do) */
export interface Stage1Result {
  ptProjectId: string
  writingGuidelineJson: string | null
  requirements: PtRequirement[]
  evalCriteria: PtEvalCriteria[]
}

export type PtStepKey = 'template' | 'toc' | 'settings' | 'generate' | 'review' | 'export'
export type PtStepStatus = 'wait' | 'current' | 'done'

export interface PtStep {
  key: PtStepKey
  label: string
  sub: string
  status: PtStepStatus
}

/** PT 프로젝트 목록 조회 파라미터 (PtAgentVO.ProjectVO) */
export interface PtProjectListFilter {
  statusCd?: string
  keyword?: string
  limit?: number
  offset?: number
}

/** selectPtProjectList 응답 행 / savePtProject.do 요청·응답 — 백단 ProjectVO 정합 */
export interface PtProject {
  ptProjectId: string
  projectNm: string // 사업명
  orgNm: string // 발주기관
  projectOverview?: string // 사업개요
  targetTypeCd: PtTargetTypeCd // 제안 구분 G/P
  dueDt: string // 제출 마감일 YYYY-MM-DD (없으면 '')
  statusCd: PtProjectStatusCd // STATUS_CD
  statusNm: string // 작성중 | 검수중 | 완료 | 보류
  writingGuidelineJson?: string // 작성지침 JSON (raw)
  projectConfigJson?: string // PROJECT_CONFIG_JSON (template/settings raw)
  stage1DoneYn?: 'Y' | 'N' // Stage1(RFP 분석) 완료 여부 — 목록 조회에서만 반환
  createDt: string
  modifyDt: string
  createUserId?: string
}

export interface PtTocItem {
  tocId: string
  ptProjectId: string
  parentId: string | null // null = 대목차, 값 있으면 소목차
  title: string
  order: number
  source: 'rfp' | 'user' // 'rfp' = RFP 추출, 'user' = 사용자 입력
}

export interface PtSection {
  sectionId: string
  ptProjectId: string
  tocId: string
  title: string
  order: number
  status: 'todo' | 'active' | 'done'
  previewContent: string | null
  plannedSlideCnt?: number
}

export interface PtSectionChatMessage {
  role: 'user' | 'ai'
  text: string
  createdAt: string
}

// ── Step D: 슬라이드 ───────────────────────────────────────────────────────────

/** TB_PT_SLIDE - 생성된 슬라이드 */
export interface PtSlide {
  slideId: string
  ptProjectId: string
  tocId: string
  slideNo: number
  colorIndex: number
  layoutType: string | null
  /** 슬라이드 JSON 골격 (raw JSON string) */
  slideJson: string | null
  imageGenHint: string | null
  renderedImagePath: string | null
  /** 001=대기, 002=생성중, 003=완료, 004=실패 */
  renderStatusCd: '001' | '002' | '003' | '004'
  createDt: string
  modifyDt: string | null
}

/** 파싱된 슬라이드 JSON 구조 */
export interface PtSlideContent {
  layoutType: string
  eyebrow: string | null
  title: string
  subtitle: string | null
  highlightBanner: string | null
  components: unknown[]
  stepFlowBar: unknown | null
  conclusionRibbon: string | null
}

/** Stage2 SSE 이벤트 */
export interface Stage2ProgressData {
  step: 'analyze'
  message: string
}

export interface Stage2DoneData {
  ptProjectId: string
  skipped: boolean
  tocCount?: number
  winThemeCount?: number
  problemDefCount?: number
}

/** D-1 슬라이드 생성 SSE 이벤트 */
export interface SectionGenProgressData {
  step: 'load' | 'llm' | 'parse' | 'save' | 'render'
  message: string
}

export interface SectionGenDoneData {
  tocId: string
  slideCount: number
  successCount: number
  failCount: number
}

/** D-4 소목차 확인 결과 */
export interface SectionConfirmResult {
  ptProjectId: string
  tocId: string
  done: boolean
  nextTocId: string | null
  rejectReason: string | null
  pendingSlides: PtSlide[]
}

/** D-3 채팅 결과 */
export interface SectionChatResult {
  updatedSlides: PtSlide[]
  aiMessage: string
}

/** PROJECT_CONFIG_JSON.settings.writingStyle */
export type PtWritingStyle = 'formal' | 'plain' | 'persuasive'
// formal=공식·격식체, plain=간결·실무체, persuasive=설득·강조체

/** Step C 설정 조회 응답 (selectProjectSettings.do) */
export interface ProjectSettingsData {
  ptProjectId: string
  /** TB_PT_PROJECT.TARGET_TYPE_CD */
  targetTypeCd: PtTargetTypeCd
  /** PROJECT_CONFIG_JSON.settings.writingStyle */
  writingStyle: PtWritingStyle
  /** FILE_PURPOSE_CD='005' 자사 정보 파일 목록 */
  companyFiles: { ptFileId: string; fileName: string }[]
  /** FILE_PURPOSE_CD='006' 경쟁사 정보 파일 목록 */
  competitorFiles: { ptFileId: string; fileName: string }[]
  /** FILE_PURPOSE_CD='004' 기타 참고자료 파일 목록 */
  etcRefFiles: { ptFileId: string; fileName: string }[]
  /** 기본색조 hex 3개 */
  baseColors: [string, string, string]
  /** 강조색조 hex 2개 */
  accentColors: [string, string]
}

/** Step C 설정 저장 요청 (updateProjectSettings.do) */
export interface ProjectSettingsSaveRequest {
  ptProjectId: string
  companyFileIds: string[]
  competitorFileIds: string[]
  etcRefFileIds: string[]
  writingStyle: PtWritingStyle
  baseColors: [string, string, string]
  accentColors: [string, string]
}

/** @deprecated types/proposal.ts 내부 정렬용 — 실제 Step C 에는 ProjectSettingsData 사용 */
export interface PtSettings {
  ptProjectId: string
  templateMode: 'fix' | 'new'
  templateFileName: string
  documentSize: 'a4' | '169' | '43'
  companyFileName: string
  competitorFileName: string
  writingStyle: PtWritingStyle
  proposalTarget: PtTargetTypeCd
  baseColors: [string, string, string]
  accentColors: [string, string]
}

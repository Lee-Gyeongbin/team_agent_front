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
  /** 출처 유형 코드 (PT000004: 001=사실, 002=전략적해석, 003=확인필요, 999=직접입력) */
  sourceTypeCd: '001' | '002' | '003' | '999'
  confirmNeededYn?: 'Y' | 'N'
  sortOrd: number
  createDt: string
}

/** TB_PT_RFP_ISSUE - RFP 현황/이슈 */
export interface PtRfpIssue {
  issueId: string
  ptProjectId: string
  /** 001=문제점, 002=개선방향, 003=추진배경/필요성 */
  issueTypeCd: '001' | '002' | '003'
  issueContent: string
  issueLabel: string | null
  sourceSection: string | null
  sourcePage: number | null
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
  rfpIssues: PtRfpIssue[]
}

export type PtStepKey = 'template' | 'toc' | 'settings' | 'template-gen' | 'strategy' | 'generate' | 'export'

// ── Stage2 전략검토 ─────────────────────────────────────────────────────────

export interface Stage2Summary {
  stage2StatusCd: '001' | '002' | '003' | '004' | string
  problemDefinitionCount: number
  winThemeCount: number
  winThemeStaleCount: number
  uncoveredRequirementCount: number
  problemDefinitionsGeneratedDt: string | null
  winThemesGeneratedDt: string | null
}

export interface ProblemDefinition {
  problemId: string
  ptProjectId?: string
  problemTypeCd: string
  currentProblem: string
  rootCause: string
  riskIfIgnored: string
  goal: string
  requiredCapability: string
  strategySummary: string
  kpi: string
  sourceTypeCd: string
  sourceIssueIds: string[]
  sourceRequirementIds: string[]
  generatedDt: string | null
  modifyDt: string | null
  manualYn: 'Y' | 'N'
}

export interface WinThemeStaleDetail {
  problemId?: string
  reason: 'MODIFIED' | 'DELETED'
  problemModifyDt?: string
}

export interface WinTheme {
  winThemeId: string
  ptProjectId?: string
  coreMessage: string
  customerProblem: string
  proposalStrategy: string
  evidence: string
  expectedEffect: string
  differentiation: string
  sourceProblemDefinitionIds: string[]
  generatedDt: string | null
  modifyDt: string | null
  stale: boolean
  staleDetails: WinThemeStaleDetail[]
}

export interface TocMappingNode {
  tocId: string
  title: string
  parentTocId: string | null
  coveredReqIds: string[]
  linkedEvalCriteriaId: string | null
  sortOrd: number
}

export interface EvalCriteriaOption {
  evalCriteriaId: string
  evalItemNm: string
  score: number
}

export interface TocMappingResult {
  tocNodes: TocMappingNode[]
  unassignedRequirementIds: string[]
  evalCriteriaOptions: EvalCriteriaOption[]
}
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
  maxStepNo?: number // 사용자가 도달한 최대 단계 번호 (0=A~5=F) — 상세 조회에서 반환
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

// ── Step E: 슬라이드 ───────────────────────────────────────────────────────────

/** TB_PT_SLIDE - 생성된 슬라이드 */
export interface PtSlide {
  slideId: string
  ptProjectId: string
  tocId: string
  slideNo: number
  colorIndex: number
  layoutType: 'cover' | 'section_divider' | 'infographic' | null
  reqIdsJson: string | null
  eyebrowTxt: string | null
  titleTxt: string
  subtitleTxt: string | null
  highlightBannerTxt: string | null
  componentsJson: string | null
  stepFlowBarJson: string | null
  conclusionRibbonTxt: string | null
  imageGenHint: string | null
  renderedImagePath: string | null
  /** 템플릿 프레임 + 인포그래픽 합성 이미지 (Step E 미리보기용) */
  compositeImagePath: string | null
  /** 001=대기, 002=생성중, 003=완료, 004=실패 */
  renderStatusCd: '001' | '002' | '003' | '004'
  sortOrd: number
  createDt: string
  modifyDt: string | null
}

// ── 슬라이드 본문 컴포넌트 콘텐츠 스키마 ─────────────────────────────────────

export interface CardGridContent {
  cards: { title: string; desc: string }[]
}

export interface ProcessFlowContent {
  steps: { title: string; desc: string }[]
}

export interface RequirementTableContent {
  rows: { reqNo: string; reqContent: string; response: string }[]
}

export interface CredentialGridContent {
  items: { title: string; desc: string }[]
}

export interface IconChipGroupContent {
  chips: string[]
}

export interface StepFlowBarContent {
  steps: { label: string; active?: boolean }[]
}

export interface CalloutBoxContent {
  text: string
  tone?: 'info' | 'warning'
}

export type SlideComponentContent =
  | CardGridContent
  | ProcessFlowContent
  | RequirementTableContent
  | CredentialGridContent
  | IconChipGroupContent
  | StepFlowBarContent
  | CalloutBoxContent

export interface SlideComponent {
  type:
    | 'card_grid'
    | 'process_flow'
    | 'requirement_table'
    | 'credential_grid'
    | 'icon_chip_group'
    | 'step_flow_bar'
    | 'callout_box'
  content: SlideComponentContent
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

/** D-5 이미지 렌더링 SSE — 진행 이벤트 (step 이벤트 또는 슬라이드별 진행 이벤트) */
export interface SlideRenderProgressData {
  /** step 이벤트: 'load' | 'render' */
  step?: string
  /** 슬라이드별 이벤트: slideId 있음 */
  slideId?: string
  /** 003=완료, 004=실패 */
  renderStatusCd?: '003' | '004'
  /** 완료 시 NCP 이미지 URL */
  renderedImagePath?: string
  /** 현재 처리된 슬라이드 순번 */
  current?: number
  /** 전체 슬라이드 수 */
  total?: number
}

/** D-5 이미지 렌더링 SSE — 완료 이벤트 */
export interface SlideRenderDoneData {
  total: number
  success: number
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
  /** 제안사명 (출력물 푸터 우측) */
  submitterNm?: string
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
  /** 제안사명 (출력물 푸터 우측) */
  submitterNm?: string
}

/** /ai/proposal/viewSlideImage.do 응답 (FileService 뷰 응답과 동일 구조) */
export interface SlideImageViewResponse {
  viewType?: string
  url?: string
  fileName?: string
  reason?: string
  downloadUrl?: string
}

// ── Step F: 출력 ───────────────────────────────────────────────────────────────

/**
 * TB_PT_EXPORT - BUILD_STATUS_CD (코드 PT000010)
 * 001=대기, 002=이미지생성중, 003=PPT조립중, 004=완료, 005=실패
 */
export type PtExportBuildStatusCd = '001' | '002' | '003' | '004' | '005'

/** TB_PT_EXPORT - EXPORT_TYPE_CD (PT_EXPORT_TYPE): 001=PPTX, 002=PDF */
export type PtExportTypeCd = '001' | '002'

/** /ai/proposal/startExport.do · selectExportStatus.do 응답 데이터 */
export interface PtExportVO {
  exportId: string
  ptProjectId: string
  exportTypeCd: PtExportTypeCd
  buildStatusCd: PtExportBuildStatusCd
  totalSlideCnt?: number
  renderedSlideCnt?: number
  fileNm?: string
  filePath?: string
  fileSize?: number
  errorMsg?: string
  completeDt?: string
  /** presigned 다운로드 URL — DB 미저장, 완료 시 동적 발급 */
  downloadUrl?: string
}

/** /ai/proposal/startExport.do 요청 */
export interface PtExportRequest {
  ptProjectId: string
  agentId: string
}

// ── Step D: 템플릿 생성 ───────────────────────────────────────────────────────

/** TB_PT_TEMPLATE.GEN_STATUS_CD */
export type PtTemplateGenStatusCd = '001' | '002' | '003' | '004'
// 001=대기, 002=생성중, 003=완료, 004=실패

/** TB_PT_TEMPLATE - PT 헤더/푸터 템플릿 */
export interface PtTemplate {
  templateId: string
  ptProjectId: string
  headerComponentsJson: string | null
  footerComponentsJson: string | null
  colorJson: string | null
  /** 001=대기, 002=생성중, 003=완료, 004=실패 */
  genStatusCd: PtTemplateGenStatusCd
  errorMsg: string | null
  /** 템플릿 프레임 이미지 NCP 경로 (Step D 확정 후 비동기 생성) */
  frameImagePath: string | null
  createDt: string
  modifyDt: string | null
}

/** 템플릿 재생성 요청 */
export interface PtTemplateRegenerateRequest {
  ptProjectId: string
  refineInstruction?: string
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

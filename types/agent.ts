export interface Agent extends AgtRagCfg, AgtDs, AgtSqlCfg, AgtDm {
  agentId: string // AGENT_ID
  agentNm: string // AGENT_NM
  cncptTy: string // CNCPT_TY
  svcTy: string // SVC_TY
  svcTyNm: string // SVC_TY_NM
  temperature: number // TEMPERATURE
  tempDefaultYn: 'Y' | 'N' // TEMP_DEFAULT_YN
  topP: number // TOP_P
  topPDefaultYn: 'Y' | 'N' // TOP_P_DEFAULT_YN
  apiUrlCd: string // API_URL_CD
  iconId: string // ICON_ID
  colorId: string // COLOR_ID
  iconClassNm: string // ICON_CLASS_NM
  colorHex: string // COLOR_HEX
  description: string // DESCRIPTION
  sortOrd: number // SORT_ORD
  useYn: 'Y' | 'N' // USE_YN
  lastMdfDt: string // LAST_MDF_DT
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
  connCount: number // CONN_COUNT
  datasetList: AgtDs[] // DATASET_LIST (RAG)
  datamartList: AgtDm[] // DATAMART_LIST
  subCfg?: AgtSubCfg | null
}

/** Agent 서브 설정 (tb_agt_sub_cfg) */
export interface AgtSubCfg {
  subCfgId: string // SUB_CFG_ID
  agentId: string // AGENT_ID
  subTy: string // SUB_TY / SUB_TY_CD (normalizeAgentSubCfg에서 통합)
  additionalConfig: AgtSubAdditionalConfig | null
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
}

/** SUB_TY_CD별 ADDITIONAL_CONFIG — 백엔드 스키마 확정 시 유형별 인터페이스로 분리 */
export type AgtSubAdditionalConfig = Record<string, unknown>

/** RAG 설정 */
export interface AgtRagCfg {
  agentId: string // AGENT_ID
  simThresh: number // SIM_THRESH
  maxSrchRslt: number // MAX_SRCH_RSLT
}

/** 데이터셋  */
export interface AgtDs {
  agentId: string // AGENT_ID
  datasetId: string // DATASET_ID
  dsNm: string // DS_NM
  description: string // DESCRIPTION
  connYn: 'Y' | 'N' // CONN_YN
  docCount: number // DOC_COUNT
  chunkSize: number // CHUNK_SIZE
  modifyDt: string // MODIFY_DT
}

/** SQL 설정 */
export interface AgtSqlCfg {
  agentId: string // AGENT_ID
  modelId: string // MODEL_ID
  maxQrySec: number // MAX_QRY_SEC
  sqlValidYn: 'Y' | 'N' // SQL_VALID_YN
  readonlyYn: 'Y' | 'N' // READONLY_YN
  userCfrmYn: 'Y' | 'N' // USER_CFRM_YN
}

/** 데이터마트 */
export interface AgtDm {
  agentId: string // AGENT_ID
  datamartId: string // DATAMART_ID
  dmNm: string // DM_NM
  description: string // DESCRIPTION
  connYn: 'Y' | 'N' // CONN_YN
  dbType: string // DB_TYPE
  tblCnt: number // TBL_CNT
  lastVerifyDt: string // LAST_VERIFY_DT
}

// ===== RECOMMEND 에이전트 타입 (SUB_TY = 'RECOMMEND') =====

export interface RecommendUiConfig {
  introTitle: string
  introSubtitle: string
  cardTitle: string
  cardTitleResult: string
  cardSubtitle: string
  cardSubtitleReadonly: string
  cardSubtitleResult: string
  imageNotice?: string
  pendingStatusTexts: string[]
}

export interface RecommendFormField {
  key: string
  label: string
  type: 'chip_select'
  required: boolean
  options: string[]
}

export interface RecommendFormConfig {
  useRegionSelect: boolean
  regionSelectLabel?: string
  fields: RecommendFormField[]
}

export interface RecommendResultFieldDef {
  key: string
  label: string
  type?: 'link' | 'text'
}

export interface RecommendResultConfig {
  topN: number
  rankLabel: string
  nameField: string
  imageField?: string
  fields: RecommendResultFieldDef[]
}

export interface RecommendFeatures {
  useGeolocation: boolean
  showThumbnailImages: boolean
  showImageNotice: boolean
  addressEnrichment?: 'kakao'
  imageEnrichment?: 'aiGenerate' | 'kakaoImage'
}

export interface RecommendAgentConfig {
  agentType: 'recommend'
  version: string
  language: string
  ui: RecommendUiConfig
  form: RecommendFormConfig
  result: RecommendResultConfig
  features: RecommendFeatures
  agent: {
    id: string
    name: string
    persona: string
    mission: string
  }
  constraints: string[]
  engine?: {
    outputSchema?: {
      type: 'json_array'
      itemFields: string[]
    }
  }
}

// ===== CURATION 에이전트 타입 (SUB_TY = 'CURATION') =====

export interface CurationUiConfig {
  introTitle: string
  introSubtitle: string
  cardTitle: string
  cardSubtitleResult: string
  cardSubtitleReadonly: string
  selectionHint: string
  footerTip: string
  emptyMessage: string
  categoryEmptyMessage: string
  summaryNotice: string
  pendingStatusTexts: string[]
}

export interface CurationFormConfig {
  categorySource: {
    type: 'code_group'
    codeGrpId: string
  }
  maxCategoryCount: number
}

export interface CurationCandidateSource {
  codeId: string
  rssCategory: string
  feedUrl: string
}

export interface CurationResultFieldDef {
  key: string
  label: string
  type?: 'link' | 'text'
}

export interface CurationResultConfig {
  topN: number
  nameField: string
  imageField?: string
  fields: CurationResultFieldDef[]
}

export interface CurationAgentConfig {
  agentType: 'curation'
  version: string
  language: string
  agent: {
    id: string
    name: string
    persona: string
    mission: string
  }
  ui: CurationUiConfig
  form: CurationFormConfig
  candidateSources: CurationCandidateSource[]
  engine: {
    candidateFetch: {
      type: 'rss'
      pressLabel: string
      snippetMaxLength: number
    }
    outputSchema: {
      type: 'json_array'
      itemFields: string[]
    }
  }
  result: CurationResultConfig
  constraints: string[]
}

// ===== TRANSLATE 에이전트 타입 (SUB_TY = 'TRANSLATE') =====

export interface TranslateUiConfig {
  introTitle: string
  introSubtitle: string
  textPlaceholder: string
  submitLabel: string
}

export interface TranslateLanguageOption {
  value: string
  label: string
}

export interface TranslateToneOption {
  value: string
  label: string
}

export interface TranslateFileConfig {
  enabled: boolean
  acceptExt: string[]
}

export interface TranslateAgentConfig {
  agentType: 'translate'
  ui: TranslateUiConfig
  languages: TranslateLanguageOption[]
  tones: TranslateToneOption[]
  file: TranslateFileConfig
}

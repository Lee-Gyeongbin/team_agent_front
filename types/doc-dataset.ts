// 문서 데이터셋
export interface DocDataset {
  datasetId: string
  dsNm: string
  description: string
  version: string
  datasetBuildStatusCd: string
  useYn: string
  modifyDt: string
  // 통계
  chunkCnt: number
  docCnt: number
  urlCnt: number
  srchQual: number
  // 메타
  embedModelNm: string
  vectorDbNm: string
  chunkSize: number
  chunkOverlap: number
  minChunkSz: number
  chunkAlgoNm: string
  hdrInclNm: string
}

// 데이터셋 단건 상세
export interface DocDatasetDetail {
  datasetId: string
  dsNm: string
  description: string
  version: string
  chunkAlgoCd: string
  chunkSize: number
  chunkOverlap: number
  minChunkSz: number
  hdrInclCd: string
  datasetBuildStatusCd: string
  embedModelCd: string
  vectorDbCd: string
  embedNormCd: string
  poolStratCd: string
  dimReducCd: string
  chunkCnt: number
  srchQual: number
  useYn: string
  modifyDt: string
  lowercaseYn: string
  wspNormYn: string
  specChrRmYn: string
  singleCellText: string
  sentSplitAlgoCd: string
  langDetectCd: string
  llmCd?: string
  chunkOptJson?: string | Record<string, unknown> | null
}

export interface CategoryItem {
  categoryId: string
  categoryName: string
  parnCatId?: string
  catLvl?: number
  sortOrd?: number
  createDt?: string
}

export interface DocDatasetSelectedDoc {
  docId: string
  docTitle: string
  categoryId?: string
  author?: string
  secLvl?: string
  content?: string
  keywords?: string
  refUrl?: string
  fileCount?: number
  useYn?: string
  createDt?: string
  modifyDt?: string
}

export interface DocDatasetSelectedUrl {
  categoryId?: string
  urlId: string
  urlName: string
  urlAddr: string
}

// 데이터셋-문서 매핑 목록 아이템
export interface DocIdItem {
  datasetId: string
  docId: string
}

// 데이터셋-URL 매핑 목록 아이템
export interface UrlIdItem {
  datasetId: string
  urlId: string
}

export interface DocDatasetSelectResponse {
  data?: DocDatasetDetail
  // 데이터셋 매핑 문서/URL (edit 시 selectedDocIds/selectedUrlIds 세팅용)
  dsDocList?: DocIdItem[]
  dsUrlList?: UrlIdItem[]
}

export interface DocDatasetSourceListResponse {
  categoryList?: CategoryItem[]
  docList?: DocDatasetSelectedDoc[]
  urlList?: DocDatasetSelectedUrl[]
}

// 데이터셋 저장 요청
export interface DocDatasetSavePayload {
  datasetId?: string
  dsNm: string
  description: string
  version: string
  chunkAlgoCd: string
  chunkSize: number
  chunkOverlap: number
  minChunkSz: number
  hdrInclCd: string
  datasetBuildStatusCd: string
  embedModelCd: string
  vectorDbCd: string
  embedNormCd: string
  poolStratCd: string
  dimReducCd: string
  chunkCnt: number
  srchQual: number
  useYn: string
  lowercaseYn: string
  wspNormYn: string
  specChrRmYn: string
  singleCellText: string
  sentSplitAlgoCd: string
  langDetectCd: string
  promptId: string
  llmCd: string
  /** CHUNK_OPT_JSON — VO·DB는 문자열로 받고 MySQL JSON 컬럼에 저장 */
  chunkOptJson?: string
  docIdList: DocIdItem[]
  urlIdList: UrlIdItem[]
}

// 생성 폼
export interface DocDatasetForm {
  // 기본 정보
  name: string
  description: string
  version: string
  // 데이터 소스
  useDocument: boolean
  selectedDocIds: string[]
  useUrl: boolean
  selectedUrlIds: string[]
  // 청킹 옵션
  chunkAlgorithm: string
  chunkSize: number | null
  chunkOverlap: number | null
  minChunkSize: number | null
  chunkOptSeparatorsText: string | null
  chunkOptSeparator: string | null
  chunkOptParagraphSeparator: string | null
  chunkOptSentenceSep: string | null
  chunkOptBufferSize: number | null
  chunkOptBreakpointPercentileThreshold: number | null
  chunkOptHtmlTagsText: string | null
  chunkOptHeaderPathSeparator: string | null
  chunkOptMinTokens: number | null
  headerInclusion: string
  // 텍스트 전처리 옵션
  useLowercasing: boolean
  useWhitespaceNorm: boolean
  useSpecialCharRemoval: boolean
  useSingleCellText: boolean
  sentenceSplitAlgorithm: string
  languageDetection: string
  // RAG용 시스템 프롬프트
  promptId: string
  // LLM (코드 RG000011)
  llmCd: string
  // 임베딩 및 벡터DB
  embeddingModel: string
  vectorDb: string
  embeddingNormalization: string
  poolingStrategy: string
  dimensionReduction: string
}

// 변경이력
export interface DocDatasetHistory {
  histId: string
  datasetId: string
  verNo: string
  chgContent: string
  delYn: string
  createUserId: string
  createDt: string
  modifyUserId: string
  modifyDt: string
}

// 검색 테스트 결과
export interface DocDatasetSearchResult {
  chunkId: string
  content: string
  source: string
  page: number
  similarity: number
}

export interface DocDatasetSearchSummary {
  totalChunks: number
  avgSimilarity: number
}

// 요약 통계
export interface DocDatasetSummary {
  totalDatasetCount: number // 전체 데이터셋
  activeDatasetCount: number // 활성
  inactiveDatasetCount: number // 비활성
  totalVectorCount: number // 벡터 인덱스 수
  avgSearchQuality: number // 평균 검색 품질 (%)
  totalSourceCount: number // 총 소스 수
  totalDocCount: number // 문서 수
  totalUrlCount: number // URL 수
}

export interface Prompt {
  promptId: string
  promptName: string
}

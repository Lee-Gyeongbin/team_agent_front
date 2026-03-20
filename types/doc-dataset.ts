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
  htmlRmYn: string
  stopwordRmYn: string
  codeKeepYn: string
  sentSplitAlgoCd: string
  langDetectCd: string
}

export interface CategoryItem {
  categoryId: string
  categoryName: string
}

export interface DocDatasetSelectedDoc {
  docId: string
  datasetId: string
  docTitle?: string
  size?: string
  categoryId?: string
  categoryName?: string
}

export interface DocDatasetSelectedUrl {
  urlId: string
  datasetId: string
  urlName?: string
  urlAddr?: string
  categoryId?: string
}

export interface DocDatasetSelectResponse {
  data?: DocDatasetDetail
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
  htmlRmYn: string
  stopwordRmYn: string
  codeKeepYn: string
  sentSplitAlgoCd: string
  langDetectCd: string
  docIdList: DocDatasetSelectedDoc[]
  urlIdList: DocDatasetSelectedUrl[]
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
  chunkSize: number
  chunkOverlap: number
  minChunkSize: number
  headerInclusion: string
  // 텍스트 전처리 옵션
  useLowercasing: boolean
  useWhitespaceNorm: boolean
  useSpecialCharRemoval: boolean
  useHtmlTagRemoval: boolean
  useStopwordRemoval: boolean
  useCodeBlockPreserve: boolean
  sentenceSplitAlgorithm: string
  languageDetection: string
  // 임베딩 및 벡터DB
  embeddingModel: string
  vectorDb: string
  embeddingNormalization: string
  poolingStrategy: string
  dimensionReduction: string
}

// 변경이력
export interface DocDatasetHistory {
  id: string
  datasetId: string
  version: string
  content: string
  updatedAt: string
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

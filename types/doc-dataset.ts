// 문서 데이터셋
export interface DocDataset {
  id: string
  name: string
  version: string
  isActive: boolean // 활성/비활성 토글
  isBuilding: boolean // 구축중 여부
  updatedAt: string
  // 통계
  chunkCount: number
  documentCount: number
  urlCount: number
  searchQuality: number
  // 메타
  embeddingModel: string
  vectorDb: string
  chunkSize: number
  chunkOverlap: number
  chunkStrategy: string
  // 구축중 전용
  buildProgress?: number // 퍼센트 (0~100)
  buildTotal?: number // 전체 청크 수
  buildCompleted?: number // 완료 청크 수
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

// 문서 파일 아이템
export interface DocFile {
  id: string
  name: string
  size: string
  categoryId: string
}

// URL 아이템
export interface DocUrl {
  id: string
  name: string
  url: string
  category: string
}

// 요약 통계
export interface DocDatasetSummary {
  totalCount: number // 전체 데이터셋
  activeCount: number // 활성
  inactiveCount: number // 비활성
  totalVectors: string // 벡터 인덱스 (예: '3.2M')
  avgSearchQuality: number // 평균 검색 품질 (%)
  totalDocuments: number // 문서 수
  totalUrls: number // URL 수
}

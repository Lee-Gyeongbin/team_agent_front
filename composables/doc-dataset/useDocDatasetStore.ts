import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import type {
  DocDataset,
  DocDatasetForm,
  DocDatasetDetail,
  DocDatasetSelectResponse,
  DocDatasetSavePayload,
  DocDatasetSummary,
  DocDatasetHistory,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
  CategoryItem,
  DocDatasetSelectedDoc,
  DocDatasetSelectedUrl,
} from '~/types/doc-dataset'
import type { CodeItem } from '~/types/codes'
import { openToast } from '~/composables/useToast'
const {
  fetchDocDatasetList,
  fetchDocDatasetSummary,
  fetchDocDataset,
  fetchDatasetSrcList,
  fetchSaveDocDataset,
  fetchDeleteDocDataset,
  fetchToggleActiveDocDataset,
  fetchDocDatasetHistoryList,
  fetchSaveDocDatasetHistory,
  fetchDeleteDocDatasetHistory,
  fetchSearchDocDataset,
} = useDocDatasetApi()

// ===== 상태 변수 =====
// 로딩
const isLoading = ref(true)
// 생성 모달
const isCreateModalOpen = ref(false)
// 모달 상태(생성/수정)
const modalMode = ref<'create' | 'edit'>('create')
// 삭제 모달
const isDeleteModalOpen = ref(false)
// 섹션 접기 상태 (기본정보만 열림)
const sectionCollapsed = reactive([false, true, true, true])
// 테스트 모달
const isTestModalOpen = ref(false)
// 변경 이력 모달
const isHistoryModalOpen = ref(false)

// ===== 변수 목록 =====
// 데이터셋 목록
const datasetList = ref<DocDataset[]>([])
// 데이터셋 요약
const summary = ref<DocDatasetSummary>({
  totalDatasetCount: 0,
  activeDatasetCount: 0,
  inactiveDatasetCount: 0,
  totalVectorCount: 0,
  avgSearchQuality: 0,
  totalSourceCount: 0,
  totalDocCount: 0,
  totalUrlCount: 0,
})
// 기본 폼
const getDefaultForm = (): DocDatasetForm => ({
  name: '',
  description: '',
  version: '',
  useDocument: true,
  selectedDocIds: [],
  useUrl: true,
  selectedUrlIds: [],
  chunkAlgorithm: '',
  chunkSize: 128000,
  chunkOverlap: 0,
  minChunkSize: 0,
  headerInclusion: '',
  useLowercasing: true,
  useWhitespaceNorm: false,
  useSpecialCharRemoval: false,
  useHtmlTagRemoval: true,
  useStopwordRemoval: true,
  useCodeBlockPreserve: true,
  sentenceSplitAlgorithm: '',
  languageDetection: '',
  embeddingModel: '',
  vectorDb: '',
  embeddingNormalization: '',
  poolingStrategy: '',
  dimensionReduction: '',
})

// 코드 옵션 목록
// 청킹 알고리즘 옵션
const chunkAlgorithmOptions = ref<{ label: string; value: string }[]>([])
// 헤더 포함 옵션
const headerInclusionOptions = ref<{ label: string; value: string }[]>([])
// 임베딩 모델 옵션
const embeddingModelOptions = ref<{ label: string; value: string }[]>([])
// 벡터 DB 옵션
const vectorDbOptions = ref<{ label: string; value: string }[]>([])
// 정규화 옵션
const normalizationOptions = ref<{ label: string; value: string }[]>([])
// 풀링 전략 옵션
const poolingOptions = ref<{ label: string; value: string }[]>([])
// 차수 축소 옵션
const dimensionOptions = ref<{ label: string; value: string }[]>([])
// 문장 분리 알고리즘 옵션
const sentenceSplitOptions = ref<{ label: string; value: string }[]>([])
// 언어 감지 옵션
const languageDetectionOptions = ref<{ label: string; value: string }[]>([])

// 선택 데이터셋 상세
const selectedDatasetDetail = ref<DocDatasetDetail | null>(null)
// 선택 데이터셋 카테고리 목록
const selectedDatasetCategoryList = ref<DocDatasetSelectResponse['categoryList']>([])
// 선택 데이터셋 문서 목록
const selectedDatasetDocList = ref<DocDatasetSelectResponse['docList']>([])
// 선택 데이터셋 URL 목록
const selectedDatasetUrlList = ref<DocDatasetSelectResponse['urlList']>([])
// 폼 데이터
const formData = reactive<DocDatasetForm>(getDefaultForm())

// 수정 데이터셋 ID
const editingDatasetId = ref('')
// 수정 데이터셋 폼 데이터
const editFormData = ref<Partial<DocDatasetForm> | undefined>(undefined)
// 삭제 데이터셋 ID
const deleteTargetId = ref('')
// 테스트 데이터셋 ID
const testDatasetId = ref('')
// 변경 이력 데이터셋 ID
const historyDatasetId = ref('')

// ===== 상태 변경 METHODS =====
const openCreateModal = () => {
  modalMode.value = 'create'
  editingDatasetId.value = ''
  editFormData.value = undefined
  isCreateModalOpen.value = true
}
// 테스트
const onTest = (id: string) => {
  console.warn('[TODO] 데이터셋 테스트:', id)
  isTestModalOpen.value = true
  testDatasetId.value = id
}

// ===== 기능 METHODS =====
/** 목록 조회 */
const handleSelectDocDatasetList = async () => {
  const res = await fetchDocDatasetList()
  datasetList.value = res.dataList
}

/** 요약 조회 */
const handleSelectDocDatasetSummary = async () => {
  const res = await fetchDocDatasetSummary()
  summary.value = res.data
}

/** 목록 + 요약 동시 조회 */
const handleSelectAll = async () => {
  await Promise.all([handleSelectDocDatasetList(), handleSelectDocDatasetSummary()])
}

/** 데이터셋 상세 조회 */
const handleSelectDocDataset = async (datasetId: string) => {
  const res = await fetchDocDataset(datasetId)
  selectedDatasetDetail.value = res.data ?? null
  return res
}

/** 데이터소스 목록 조회 */
const handleSelectDatasetSrcList = async (datasetId: string) => {
  const res = await fetchDatasetSrcList(datasetId)
  // 카테고리 목록 세팅
  selectedDatasetCategoryList.value = res.categoryList ?? []
  // 문서 목록 세팅
  selectedDatasetDocList.value = res.docList ?? []
  // URL 목록 세팅
  selectedDatasetUrlList.value = res.urlList ?? []
}

/** 코드 옵션 목록 조회 */
const handleSelectCodeOptions = async () => {
  const [
    chunkCodes,
    headerCodes,
    embedModelCodes,
    vectorDbCodes,
    normalizationCodes,
    poolingCodes,
    dimensionCodes,
    sentenceSplitCodes,
    languageCodes,
  ] = await Promise.all([
    getCodes('RG000002'),
    getCodes('RG000003'),
    getCodes('RG000004'),
    getCodes('RG000005'),
    getCodes('RG000006'),
    getCodes('RG000007'),
    getCodes('RG000008'),
    getCodes('RG000009'),
    getCodes('RG000010'),
  ])
  // 코드 옵션 세팅
  chunkAlgorithmOptions.value = mapCodeOptions(chunkCodes)
  headerInclusionOptions.value = mapCodeOptions(headerCodes)
  embeddingModelOptions.value = mapCodeOptions(embedModelCodes)
  vectorDbOptions.value = mapCodeOptions(vectorDbCodes)
  normalizationOptions.value = mapCodeOptions(normalizationCodes)
  poolingOptions.value = mapCodeOptions(poolingCodes)
  dimensionOptions.value = mapCodeOptions(dimensionCodes)
  sentenceSplitOptions.value = mapCodeOptions(sentenceSplitCodes)
  languageDetectionOptions.value = mapCodeOptions(languageCodes)
}

/** 코드 옵션 매핑 */
const mapCodeOptions = (codes: CodeItem[]) => [
  { label: '선택', value: '' },
  ...codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  })),
]

/** 저장 시 데이터셋 생성 */
const onSaveCreate = async (data: DocDatasetForm, startBuild: boolean) => {
  // 저장 요청 데이터 생성
  const payload: DocDatasetSavePayload = {
    datasetId: editingDatasetId.value || undefined,
    dsNm: data.name,
    description: data.description,
    version: data.version,
    chunkAlgoCd: data.chunkAlgorithm,
    chunkSize: data.chunkSize,
    chunkOverlap: data.chunkOverlap,
    minChunkSz: data.minChunkSize,
    hdrInclCd: data.headerInclusion,
    datasetBuildStatusCd: startBuild ? 'READY' : 'BUILDING',
    embedModelCd: data.embeddingModel,
    vectorDbCd: data.vectorDb,
    embedNormCd: data.embeddingNormalization,
    poolStratCd: data.poolingStrategy,
    dimReducCd: data.dimensionReduction,
    chunkCnt: 0,
    srchQual: 0,
    useYn: 'Y',
    lowercaseYn: data.useLowercasing ? 'Y' : 'N',
    wspNormYn: data.useWhitespaceNorm ? 'Y' : 'N',
    specChrRmYn: data.useSpecialCharRemoval ? 'Y' : 'N',
    htmlRmYn: data.useHtmlTagRemoval ? 'Y' : 'N',
    stopwordRmYn: data.useStopwordRemoval ? 'Y' : 'N',
    codeKeepYn: data.useCodeBlockPreserve ? 'Y' : 'N',
    sentSplitAlgoCd: data.sentenceSplitAlgorithm,
    langDetectCd: data.languageDetection,
    docIdList: data.selectedDocIds.map((id) => ({ docId: id, datasetId: editingDatasetId.value ?? '' })),
    urlIdList: data.selectedUrlIds.map((id) => ({ urlId: id, datasetId: editingDatasetId.value ?? '' })),
  }
  // 데이터셋 저장
  await handleSaveDocDataset(payload)
  // 생성 모달 닫기
  isCreateModalOpen.value = false
}

// 상세 데이터를 폼 데이터로 변환
const mapDetailToForm = (
  detail: DocDatasetDetail,
  _categoryList: CategoryItem[],
  docList: DocDatasetSelectedDoc[],
  urlList: DocDatasetSelectedUrl[],
): DocDatasetForm => ({
  name: detail.dsNm,
  description: detail.description ?? '',
  version: detail.version ?? '',
  useDocument: docList.some((item) => item.datasetId === detail.datasetId),
  selectedDocIds: docList.filter((item) => item.datasetId === detail.datasetId).map((item) => item.docId),
  useUrl: urlList.some((item) => item.datasetId === detail.datasetId),
  selectedUrlIds: urlList.filter((item) => item.datasetId === detail.datasetId).map((item) => item.urlId),
  chunkAlgorithm: detail.chunkAlgoCd ?? '',
  chunkSize: detail.chunkSize ?? 0,
  chunkOverlap: detail.chunkOverlap ?? 0,
  minChunkSize: detail.minChunkSz ?? 0,
  headerInclusion: detail.hdrInclCd ?? '',
  useLowercasing: detail.lowercaseYn === 'Y',
  useWhitespaceNorm: detail.wspNormYn === 'Y',
  useSpecialCharRemoval: detail.specChrRmYn === 'Y',
  useHtmlTagRemoval: detail.htmlRmYn === 'Y',
  useStopwordRemoval: detail.stopwordRmYn === 'Y',
  useCodeBlockPreserve: detail.codeKeepYn === 'Y',
  sentenceSplitAlgorithm: detail.sentSplitAlgoCd ?? '',
  languageDetection: detail.langDetectCd ?? '',
  embeddingModel: detail.embedModelCd ?? '',
  vectorDb: detail.vectorDbCd ?? '',
  embeddingNormalization: detail.embedNormCd ?? '',
  poolingStrategy: detail.poolStratCd ?? '',
  dimensionReduction: detail.dimReducCd ?? '',
})

/** 데이터셋 수정 */
const onEdit = async (dataset: DocDataset) => {
  // 데이터셋 상세 조회
  const res = await handleSelectDocDataset(dataset.datasetId)
  // 데이터소스 목록 조회
  await handleSelectDatasetSrcList(dataset.datasetId)
  const data = res.data
  if (!data) return
  // 모달 모드 세팅
  modalMode.value = 'edit'
  // 수정 데이터셋 ID 세팅
  editingDatasetId.value = dataset.datasetId
  // 상세 데이터를 폼 데이터로 변환
  editFormData.value = mapDetailToForm(
    data,
    selectedDatasetCategoryList.value ?? [],
    selectedDatasetDocList.value ?? [],
    selectedDatasetUrlList.value ?? [],
  )
  isCreateModalOpen.value = true
}

// 삭제 버튼 클릭
const onDelete = (id: string) => {
  deleteTargetId.value = id
  isDeleteModalOpen.value = true
}

// 변경 이력 버튼 클릭
const onHistory = (id: string) => {
  historyDatasetId.value = id
  isHistoryModalOpen.value = true
}

// 삭제 버튼 클릭 시 실행(삭제 모달 확인 후 실행)
const doDelete = async () => {
  await handleDeleteDocDataset(deleteTargetId.value)
  isDeleteModalOpen.value = false
}

// 데이터셋 저장
const handleSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
  await fetchSaveDocDataset(dataset)
  // 목록 + 요약 동시 조회
  await handleSelectAll()
}

// 데이터셋 삭제 실행
const handleDeleteDocDataset = async (id: string) => {
  await fetchDeleteDocDataset(id)
  // 목록 + 요약 동시 조회
  await handleSelectAll()
}

// 데이터셋 활성화 토글
const handleToggleActiveDocDataset = async (id: string, useYn: string) => {
  if (useYn === 'Y') {
    useYn = 'N'
  } else {
    useYn = 'Y'
  }
  const res = await fetchToggleActiveDocDataset(id, useYn)
  const affected = typeof res.data === 'number' ? res.data : 0
  if (affected > 0) {
    openToast({ message: '활성화 상태가 변경되었습니다.', type: 'success' })
  } else {
    openToast({ message: '활성화 상태 변경에 실패했습니다.', type: 'error' })
  }
  // 목록 + 요약 동시 조회
  await handleSelectAll()
}

// ===== 변경이력 =====
const historyList = ref<DocDatasetHistory[]>([])
const historyTotalCount = ref(0)
const historyPage = ref(1)
const historyPageSize = 5

const handleSelectDocDatasetHistoryList = async (datasetId: string, page: number = 1) => {
  historyPage.value = page
  const res = await fetchDocDatasetHistoryList(datasetId, page, historyPageSize)
  historyList.value = res.list
  historyTotalCount.value = res.totalCount
}

const handleSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
  await fetchSaveDocDatasetHistory(history)
  // 저장 후 첫 페이지로 이동하여 새 이력 표시
  await handleSelectDocDatasetHistoryList(history.datasetId, 1)
}

const handleDeleteDocDatasetHistory = async (id: string, datasetId: string) => {
  await fetchDeleteDocDatasetHistory(id)
  await handleSelectDocDatasetHistoryList(datasetId, historyPage.value)
}

// ===== 유효성 검사 =====
const validate = (): boolean => {
  if (!formData.name.trim()) {
    openToast({ message: '데이터셋 이름을 입력해주세요.', type: 'warning' })
    sectionCollapsed[0] = false
    return false
  }
  return true
}

// ===== 검색 테스트 =====
const searchResults = ref<DocDatasetSearchResult[]>([])
const searchSummary = ref<DocDatasetSearchSummary>({ totalChunks: 0, avgSimilarity: 0 })
const isSearching = ref(false)

const handleSearchDocDataset = async (params: {
  datasetId: string
  query: string
  topK?: number
  threshold?: number
  rerank?: string
}) => {
  isSearching.value = true
  searchResults.value = []
  searchSummary.value = { totalChunks: 0, avgSimilarity: 0 }
  try {
    const res = await fetchSearchDocDataset(params)
    searchResults.value = res.data.results
    searchSummary.value = res.data.summary
  } finally {
    isSearching.value = false
  }
}

const resetSearchResults = () => {
  searchResults.value = []
  searchSummary.value = { totalChunks: 0, avgSimilarity: 0 }
}

export const useDocDatasetStore = () => {
  return {
    // 초기 조회
    isLoading,
    isTestModalOpen,
    getDefaultForm,
    isDeleteModalOpen,
    // 생성 모달
    isCreateModalOpen,
    modalMode,
    editFormData,
    formData,
    openCreateModal,
    onEdit,
    onTest,
    onSaveCreate,
    onDelete,
    doDelete,
    onHistory,
    // 데이터셋 목록
    datasetList,
    summary,
    selectedDatasetDetail,
    selectedDatasetCategoryList,
    handleSelectAll,
    handleSelectDocDataset,
    handleSelectDatasetSrcList,
    handleSaveDocDataset,
    handleDeleteDocDataset,
    handleToggleActiveDocDataset,
    // 변경이력
    historyList,
    historyTotalCount,
    historyPage,
    historyPageSize,
    handleSelectDocDatasetHistoryList,
    handleSaveDocDatasetHistory,
    handleDeleteDocDatasetHistory,
    // 코드 조회
    handleSelectCodeOptions,
    chunkAlgorithmOptions,
    headerInclusionOptions,
    embeddingModelOptions,
    vectorDbOptions,
    normalizationOptions,
    poolingOptions,
    dimensionOptions,
    sentenceSplitOptions,
    languageDetectionOptions,
    // 검색 테스트
    searchResults,
    searchSummary,
    isSearching,
    handleSearchDocDataset,
    resetSearchResults,
    selectedDatasetDocList,
    selectedDatasetUrlList,
    sectionCollapsed,
    validate,
    // 변경 이력 모달
    isHistoryModalOpen,
    historyDatasetId,
    testDatasetId,
  }
}

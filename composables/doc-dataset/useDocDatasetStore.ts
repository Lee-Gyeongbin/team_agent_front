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
const isLoading = ref(true)

const datasetList = ref<DocDataset[]>([])
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

// 데이터 소스 목록
const chunkAlgorithmOptions = ref<{ label: string; value: string }[]>([])
const headerInclusionOptions = ref<{ label: string; value: string }[]>([])
const embeddingModelOptions = ref<{ label: string; value: string }[]>([])
const vectorDbOptions = ref<{ label: string; value: string }[]>([])
const normalizationOptions = ref<{ label: string; value: string }[]>([])
const poolingOptions = ref<{ label: string; value: string }[]>([])
const dimensionOptions = ref<{ label: string; value: string }[]>([])
const sentenceSplitOptions = ref<{ label: string; value: string }[]>([])
const languageDetectionOptions = ref<{ label: string; value: string }[]>([])

const selectedDatasetDetail = ref<DocDatasetDetail | null>(null)
const selectedDatasetCategoryList = ref<DocDatasetSelectResponse['categoryList']>([])
const selectedDatasetDocList = ref<DocDatasetSelectResponse['docList']>([])
const selectedDatasetUrlList = ref<DocDatasetSelectResponse['urlList']>([])
const formData = reactive<DocDatasetForm>(getDefaultForm())

// 생성 모달
const isCreateModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingDatasetId = ref('')
const editFormData = ref<Partial<DocDatasetForm> | undefined>(undefined)

// ===== 섹션 접기 상태 (기본정보만 열림) =====
const sectionCollapsed = reactive([false, true, true, true])

// 삭제
const isDeleteModalOpen = ref(false)
const deleteTargetId = ref('')

// ===== 상태 변경 METHODS =====
const openCreateModal = () => {
  modalMode.value = 'create'
  editingDatasetId.value = ''
  editFormData.value = undefined
  isCreateModalOpen.value = true
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

// ===== 추가/수정/삭제 =====
const handleSelectDocDataset = async (datasetId: string) => {
  const res = await fetchDocDataset(datasetId)
  selectedDatasetDetail.value = res.data ?? null
  return res
}

const handleSelectDatasetSrcList = async (datasetId: string) => {
  const res = await fetchDatasetSrcList(datasetId)
  selectedDatasetCategoryList.value = res.categoryList ?? []
  selectedDatasetDocList.value = res.docList ?? []
  selectedDatasetUrlList.value = res.urlList ?? []
}

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
const mapCodeOptions = (codes: CodeItem[]) => [
  { label: '선택', value: '' },
  ...codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  })),
]

const onSaveCreate = async (data: DocDatasetForm, startBuild: boolean) => {
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
    datasetBuildStatusCd: startBuild ? 'BUILDING' : 'READY',
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
  }
  await handleSaveDocDataset(payload)
  isCreateModalOpen.value = false
}

// 수정
const mapDetailToForm = (
  detail: DocDatasetDetail,
  _categoryList: CategoryItem[],
  docList: DocDatasetSelectedDoc[],
  urlList: DocDatasetSelectedUrl[],
): DocDatasetForm => ({
  name: detail.dsNm,
  description: detail.description ?? '',
  version: detail.version ?? '',
  useDocument: docList.some((item) => item.selYn === 'Y'),
  selectedDocIds: docList.filter((item) => item.selYn === 'Y').map((item) => item.docId),
  useUrl: urlList.some((item) => item.selYn === 'Y'),
  selectedUrlIds: urlList.filter((item) => item.selYn === 'Y').map((item) => item.urlId),
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

const onEdit = async (dataset: DocDataset) => {
  const res = await handleSelectDocDataset(dataset.datasetId)
  await handleSelectDatasetSrcList(dataset.datasetId)
  const data = res.data
  if (!data) return
  modalMode.value = 'edit'
  editingDatasetId.value = dataset.datasetId
  editFormData.value = mapDetailToForm(
    data,
    selectedDatasetCategoryList.value ?? [],
    selectedDatasetDocList.value ?? [],
    selectedDatasetUrlList.value ?? [],
  )
  isCreateModalOpen.value = true
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

const onDelete = (id: string) => {
  deleteTargetId.value = id
  isDeleteModalOpen.value = true
}

const doDelete = async () => {
  await handleDeleteDocDataset(deleteTargetId.value)
  isDeleteModalOpen.value = false
}

const handleSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
  await fetchSaveDocDataset(dataset)
  await handleSelectAll()
}

const handleDeleteDocDataset = async (id: string) => {
  await fetchDeleteDocDataset(id)
  await handleSelectAll()
}

const handleToggleActiveDocDataset = async (id: string) => {
  await fetchToggleActiveDocDataset(id)
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
    getDefaultForm,
    isDeleteModalOpen,
    // 생성 모달
    isCreateModalOpen,
    modalMode,
    editFormData,
    formData,
    openCreateModal,
    onEdit,
    onSaveCreate,
    onDelete,
    doDelete,
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
  }
}

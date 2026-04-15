import { useDocDatasetApi } from '~/composables/doc-dataset/useDocDatasetApi'
import { openToast } from '~/composables/useToast'
import type { CodeItem } from '~/types/codes'
import type {
  DocDataset,
  DocDatasetDetail,
  DocDatasetForm,
  DocDatasetHistory,
  DocDatasetSavePayload,
  DocDatasetSearchResult,
  DocDatasetSearchSummary,
  Prompt,
  DocDatasetSourceListResponse,
  DocDatasetSummary,
} from '~/types/doc-dataset'
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
const sectionCollapsed = reactive([false, true, true, true, true, true])
// 테스트 모달
const isTestModalOpen = ref(false)
// 변경 이력 모달
const isHistoryModalOpen = ref(false)
// 프롬프트 목록
const promptList = ref<Prompt[]>([])
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
  selectedDocFileIds: [],
  useUrl: true,
  selectedUrlIds: [],
  chunkAlgorithm: '',
  chunkSize: 0,
  chunkOverlap: 0,
  minChunkSize: 0,
  chunkOptSeparatorsText: '',
  chunkOptSeparator: '',
  chunkOptParagraphSeparator: '',
  chunkOptSentenceSep: '',
  chunkOptBufferSize: 1,
  chunkOptBreakpointPercentileThreshold: 95,
  chunkOptHtmlTagsText: '',
  chunkOptHeaderPathSeparator: '/',
  chunkOptMinTokens: 300,
  useLowercasing: true,
  useWhitespaceNorm: false,
  useSpecialCharRemoval: false,
  useSingleCellText: true,
  promptId: '',
  llmCd: '',
  embeddingModel: '',
  vectorDb: '',
})

// 코드 옵션 목록
// 청킹 알고리즘 옵션
const chunkAlgorithmOptions = ref<{ label: string; value: string }[]>([])
// 임베딩 모델 옵션
const embeddingModelOptions = ref<{ label: string; value: string }[]>([])
// 벡터 DB 옵션
const vectorDbOptions = ref<{ label: string; value: string }[]>([])
// LLM 옵션
const llmOptions = ref<{ label: string; value: string }[]>([])

// 선택 데이터셋 상세
const selectedDatasetDetail = ref<DocDatasetDetail | null>(null)
// 선택 데이터셋 카테고리 목록
const selectedDatasetCategoryList = ref<DocDatasetSourceListResponse['categoryList']>([])
// 선택 데이터셋 문서 목록
const selectedDatasetDocList = ref<DocDatasetSourceListResponse['docList']>([])
// 선택 데이터셋 URL 목록
const selectedDatasetUrlList = ref<DocDatasetSourceListResponse['urlList']>([])
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

// 데이터셋 구축 진행률/메시지
const buildProgressMap = ref<Record<string, number>>({})
const buildMessageMap = ref<Record<string, string>>({})
const buildStreamMap = new Map<string, EventSource>()
const buildProgressTargetMap = ref<Record<string, number>>({})
const buildProgressTimerMap = new Map<string, ReturnType<typeof setInterval>>()
const initialSelectedDocFileIds = ref<string[]>([])
const initialPreprocessSignature = ref('')
const initialEmbeddingModelCd = ref('')
const initialVectorDbCd = ref('')

type BuildUpdateType = 'init' | 'add' | 'replace_all' | 'delete_some'
interface BuildStreamStartParams {
  updateType: BuildUpdateType
  addDocFileIds: string[]
  deleteDocFileIds: string[]
  vectorDiffYn: 'Y' | 'N'
}

interface DatasetBuildEventData {
  status?: string
  progress?: number
  message?: string
  /** 파이프라인 실패 시 상세 메시지 (SSE error 이벤트 등) */
  error?: string
  jobId?: string
  pipeline?: string
}

const clampProgress = (progress: number) => Math.min(100, Math.max(0, progress))
const clampInProgress = (progress: number) => Math.min(99, Math.max(0, progress))
const PROGRESS_ANIMATE_INTERVAL_MS = 120
const PROGRESS_ANIMATE_STEP = 2
const BUILD_COMPLETE_HOLD_MS = 400

// 데이터셋 구축 진행 진행률 애니메이션 중지
const handleStopBuildProgressAnimation = (datasetId: string) => {
  const timer = buildProgressTimerMap.get(datasetId)
  if (!timer) return
  clearInterval(timer)
  buildProgressTimerMap.delete(datasetId)
}

// 데이터셋 구축 진행 진행률 애니메이션 시작
const handleAnimateBuildProgress = (datasetId: string) => {
  if (buildProgressTimerMap.has(datasetId)) return

  const timer = setInterval(() => {
    const current = buildProgressMap.value[datasetId] ?? 0
    const target = buildProgressTargetMap.value[datasetId] ?? current

    if (target <= current) {
      if (target < current) {
        buildProgressMap.value[datasetId] = target
      }
      handleStopBuildProgressAnimation(datasetId)
      return
    }

    // 다음 진행률 계산
    const next = Math.min(current + PROGRESS_ANIMATE_STEP, target)
    buildProgressMap.value[datasetId] = next
    if (next >= target) {
      handleStopBuildProgressAnimation(datasetId)
    }
  }, PROGRESS_ANIMATE_INTERVAL_MS)

  buildProgressTimerMap.set(datasetId, timer)
}

// 데이터셋 구축 진행 이벤트 데이터 파싱
const parseBuildEventData = (rawData: string): DatasetBuildEventData | null => {
  if (!rawData) return null
  try {
    return JSON.parse(rawData) as DatasetBuildEventData
  } catch {
    return null
  }
}

/** SSE 구축 이벤트에서 사용자에게 보여줄 에러 문구 (error 우선, 없으면 message) */
const getBuildStreamErrorMessage = (eventData: DatasetBuildEventData | null): string | undefined => {
  if (!eventData) return undefined
  const fromError = typeof eventData.error === 'string' ? eventData.error.trim() : ''
  const fromMessage = typeof eventData.message === 'string' ? eventData.message.trim() : ''
  return fromError || fromMessage || undefined
}

// 데이터셋 구축 진행 스트림 종료
const handleCloseBuildStream = (datasetId: string) => {
  // 데이터셋 구축 진행 스트림 조회
  const stream = buildStreamMap.get(datasetId)
  // 데이터셋 구축 진행 스트림 조회 실패 시 종료
  if (!stream) return
  // 데이터셋 구축 진행 스트림 종료
  stream.close()
  // 데이터셋 구축 진행 스트림 맵에서 삭제
  buildStreamMap.delete(datasetId)
}

// 모든 데이터셋 구축 진행 스트림 종료
const handleCloseAllBuildStreams = () => {
  buildStreamMap.forEach((stream) => stream.close())
  buildStreamMap.clear()
  // 모든 데이터셋 구축 진행 진행률 타이머 초기화
  buildProgressTimerMap.forEach((timer) => clearInterval(timer))
  // 모든 데이터셋 구축 진행 진행률 타이머 맵 초기화
  buildProgressTimerMap.clear()
}
// 데이터셋 구축 진행 상태 업데이트
const handleUpdateBuildProgress = (datasetId: string, rawData: string) => {
  // 이벤트 데이터 파싱
  const eventData = parseBuildEventData(rawData)
  if (!eventData) return

  // 진행률 업데이트
  if (typeof eventData.progress === 'number') {
    // 진행률 타겟 업데이트
    const current = buildProgressMap.value[datasetId] ?? 0
    const nextTarget = clampInProgress(eventData.progress)
    if (nextTarget <= current) return
    // 진행률 타겟 업데이트
    buildProgressTargetMap.value[datasetId] = nextTarget
    // 진행률 애니메이션 시작
    handleAnimateBuildProgress(datasetId)
  }
}

// 데이터셋 구축 진행 상태 초기화
const handleClearBuildState = (datasetId: string) => {
  // 진행률 애니메이션 중지
  handleStopBuildProgressAnimation(datasetId)
  // 진행률 맵 초기화
  buildProgressMap.value = Object.fromEntries(Object.entries(buildProgressMap.value).filter(([id]) => id !== datasetId))
  // 메시지 맵 초기화
  buildMessageMap.value = Object.fromEntries(Object.entries(buildMessageMap.value).filter(([id]) => id !== datasetId))
  // 진행률 타겟 맵 초기화
  buildProgressTargetMap.value = Object.fromEntries(
    Object.entries(buildProgressTargetMap.value).filter(([id]) => id !== datasetId),
  )
}

// 데이터셋 구축 진행 스트림 시작 쿼리 스트링 생성
const buildStartQueryString = (datasetId: string, params?: BuildStreamStartParams) => {
  const query = new URLSearchParams()
  query.append('datasetId', datasetId)
  if (!params) return query.toString()
  query.append('update_type', params.updateType)
  query.append('vector_diff_yn', params.vectorDiffYn)
  params.addDocFileIds.forEach((docFileId) => {
    query.append('add_doc_file_ids', docFileId)
  })
  params.deleteDocFileIds.forEach((docFileId) => {
    query.append('delete_doc_file_ids', docFileId)
  })
  return query.toString()
}

const buildPreprocessSignature = (form: DocDatasetForm): string => {
  return JSON.stringify({
    chunkAlgorithm: form.chunkAlgorithm ?? '',
    chunkSize: form.chunkSize ?? null,
    chunkOverlap: form.chunkOverlap ?? null,
    minChunkSize: form.minChunkSize ?? null,
    chunkOptSeparatorsText: form.chunkOptSeparatorsText ?? '',
    chunkOptSeparator: form.chunkOptSeparator ?? '',
    chunkOptParagraphSeparator: form.chunkOptParagraphSeparator ?? '',
    chunkOptSentenceSep: form.chunkOptSentenceSep ?? '',
    chunkOptBufferSize: form.chunkOptBufferSize ?? null,
    chunkOptBreakpointPercentileThreshold: form.chunkOptBreakpointPercentileThreshold ?? null,
    chunkOptHtmlTagsText: form.chunkOptHtmlTagsText ?? '',
    chunkOptHeaderPathSeparator: form.chunkOptHeaderPathSeparator ?? '',
    chunkOptMinTokens: form.chunkOptMinTokens ?? null,
    useLowercasing: form.useLowercasing,
    useWhitespaceNorm: form.useWhitespaceNorm,
    useSpecialCharRemoval: form.useSpecialCharRemoval,
    useSingleCellText: form.useSingleCellText,
  })
}

const toSortedDocFileIds = (docFileIds: string[]) => [...new Set((docFileIds ?? []).map(String))].sort()

const hasDocSourceChanged = (currentDocFileIds: string[]): boolean => {
  if (modalMode.value !== 'edit') return true
  const prev = toSortedDocFileIds(initialSelectedDocFileIds.value)
  const current = toSortedDocFileIds(currentDocFileIds)
  if (prev.length !== current.length) return true
  return prev.some((docFileId, idx) => docFileId !== current[idx])
}

const hasPreprocessChanged = (form: DocDatasetForm): boolean => {
  if (modalMode.value !== 'edit') return true
  return initialPreprocessSignature.value !== buildPreprocessSignature(form)
}

const hasEmbeddingChanged = (form: DocDatasetForm): boolean => {
  if (modalMode.value !== 'edit') return true
  return (
    initialEmbeddingModelCd.value !== String(form.embeddingModel ?? '') ||
    initialVectorDbCd.value !== String(form.vectorDb ?? '')
  )
}

const hasBuildConfigChanges = (form: DocDatasetForm): boolean => {
  return hasDocSourceChanged(form.selectedDocFileIds ?? []) || hasPreprocessChanged(form) || hasEmbeddingChanged(form)
}

// 데이터셋 구축 진행 스트림 시작 파라미터 생성
const createBuildStreamStartParams = (form: DocDatasetForm): BuildStreamStartParams => {
  const currentDocFileIds = form.selectedDocFileIds ?? []
  const prevSet = new Set((initialSelectedDocFileIds.value ?? []).map(String))
  const currentSet = new Set((currentDocFileIds ?? []).map(String))
  const addDocFileIds = [...currentSet].filter((docFileId) => !prevSet.has(docFileId))
  const deleteDocFileIds = [...prevSet].filter((docFileId) => !currentSet.has(docFileId))
  const isPreprocessChanged = hasPreprocessChanged(form)
  const vectorDiffYn: 'Y' | 'N' =
    modalMode.value === 'edit' && initialVectorDbCd.value !== String(form.vectorDb ?? '') ? 'Y' : 'N'

  if (isPreprocessChanged || prevSet.size === 0) {
    return {
      updateType: 'init',
      addDocFileIds: [],
      deleteDocFileIds: [],
      vectorDiffYn,
    }
  }
  if (addDocFileIds.length > 0 && deleteDocFileIds.length > 0) {
    return { updateType: 'replace_all', addDocFileIds, deleteDocFileIds, vectorDiffYn }
  }
  if (addDocFileIds.length > 0) {
    return { updateType: 'add', addDocFileIds, deleteDocFileIds: [], vectorDiffYn }
  }
  if (deleteDocFileIds.length > 0) {
    return { updateType: 'delete_some', addDocFileIds: [], deleteDocFileIds, vectorDiffYn }
  }

  return {
    updateType: 'init',
    addDocFileIds: [],
    deleteDocFileIds: [],
    vectorDiffYn,
  }
}

// 데이터셋 구축 진행 스트림 시작
const handleStartBuildStream = (datasetId: string, params?: BuildStreamStartParams) => {
  if (typeof window === 'undefined') return
  if (!datasetId) return

  // 데이터셋 구축 진행 스트림 종료
  handleCloseBuildStream(datasetId)
  // 진행률 맵 초기화
  buildProgressMap.value[datasetId] = 0
  // 진행률 타겟 맵 초기화
  buildProgressTargetMap.value[datasetId] = 0
  // 메시지 맵 초기화
  buildMessageMap.value[datasetId] = '벡터 생성 작업이 진행 중입니다.'
  const dataset = datasetList.value.find((item) => item.datasetId === datasetId)
  // 데이터셋 구축 진행 상태 업데이트
  if (dataset) {
    dataset.datasetBuildStatusCd = 'BUILDING'
  }

  // 데이터셋 구축 진행 스트림 중계
  const queryString = buildStartQueryString(datasetId, params)
  const stream = new EventSource(`/api/dataset/buildStream.do?${queryString}`)
  buildStreamMap.set(datasetId, stream)

  // 이벤트 리스너 등록
  const eventNames = ['start', 'pipe1', 'pipe2', 'pipe3', 'pipe4', 'pipe5', 'pipe6', 'done', 'error']
  eventNames.forEach((eventName) => {
    // 이벤트 발생 시 처리 (emitter.send()에서 받는 이벤트 리스너)
    stream.addEventListener(eventName, (event) => {
      const messageEvent = event as MessageEvent
      // 이벤트 데이터 파싱
      const eventData = parseBuildEventData(messageEvent.data)
      // 진행 상태 업데이트
      handleUpdateBuildProgress(datasetId, messageEvent.data)

      // 에러 이벤트 처리 — data.error 또는 data.message
      const buildErrMsg = getBuildStreamErrorMessage(eventData)
      if ((eventName === 'error' || eventData?.status === 'failed') && buildErrMsg) {
        openToast({ message: buildErrMsg, type: 'error' })
      }

      const isBuildFailed = eventName === 'error' || eventData?.status === 'error' || eventData?.status === 'failed'

      // 완료/실패 터미널 이벤트 (실패 시 status: failed 로 스트림 종료되는 경우 포함)
      if (
        eventName === 'done' ||
        eventName === 'error' ||
        eventData?.status === 'error' ||
        eventData?.status === 'failed'
      ) {
        if (isBuildFailed) {
          // 실패: 진행률 100%로 올리지 않음, 구축 UI·스트림 종료 후 서버 구축 상태 동기화
          handleStopBuildProgressAnimation(datasetId)
          handleClearBuildState(datasetId)
          const ds = datasetList.value.find((item) => item.datasetId === datasetId)
          if (ds) {
            ds.datasetBuildStatusCd = '001'
          }
          handleCloseBuildStream(datasetId)
          void (async () => {
            openLoading({ text: '구축 상태를 동기화하는 중...' })
            try {
              await fetchToggleActiveDocDataset(datasetId, '', '001')
            } finally {
              closeLoading()
            }
            await handleSelectAll()
          })()
        } else {
          // 성공 완료: 100% 표시 후 스트림 종료 및 목록 새로고침
          handleStopBuildProgressAnimation(datasetId)
          buildProgressTargetMap.value[datasetId] = 100
          buildProgressMap.value[datasetId] = clampProgress(100)
          handleCloseBuildStream(datasetId)
          window.setTimeout(() => {
            void handleSelectAll()
          }, BUILD_COMPLETE_HOLD_MS)
        }
      }
    })
  })

  stream.onerror = () => {
    openToast({ message: '데이터셋 구축 진행 정보를 가져오지 못했습니다.', type: 'error' })
    handleCloseBuildStream(datasetId)
  }
}

// ===== 상태 변경 METHODS =====
const openCreateModal = async () => {
  modalMode.value = 'create'
  editingDatasetId.value = ''
  selectedDatasetDetail.value = null
  initialSelectedDocFileIds.value = []
  initialPreprocessSignature.value = ''
  initialEmbeddingModelCd.value = ''
  initialVectorDbCd.value = ''
  editFormData.value = undefined
  // 데이터소스 목록(전체 문서/URL + 카테고리) 조회
  await handleSelectDatasetSrcList()
  isCreateModalOpen.value = true
}
// 테스트
const onTest = async (id: string) => {
  console.warn('[TODO] 데이터셋 테스트:', id)

  // 카드에서는 datasetId만 넘기므로, 클릭 시점에 dsNm을 확정하기 위해 상세 조회 후 메시지 생성
  const res = await handleSelectDocDataset(id)
  const datasetNm = res.data?.dsNm ?? selectedDatasetDetail.value?.dsNm ?? ''

  const message = `'${datasetNm}' 데이터셋의 테스트 모드를 시작하겠습니다`
  openToast({ message, type: 'success' })

  isTestModalOpen.value = true
  testDatasetId.value = id
}

// ===== 기능 METHODS =====
/** 목록 조회 */
const handleSelectDocDatasetList = async () => {
  openLoading({ text: '데이터셋 정보를 불러오는 중...' })
  try {
    const res = await fetchDocDatasetList()
    datasetList.value = res.dataList
  } finally {
    closeLoading()
  }
}

/** 요약 조회 */
const handleSelectDocDatasetSummary = async () => {
  openLoading({ text: '데이터셋 정보를 불러오는 중...' })
  try {
    const res = await fetchDocDatasetSummary()
    summary.value = res.data
  } finally {
    closeLoading()
  }
}

/** 목록 + 요약 동시 조회 */
const handleSelectAll = async () => {
  await Promise.all([handleSelectDocDatasetList(), handleSelectDocDatasetSummary()])
}

/** 데이터셋 상세 조회 */
const handleSelectDocDataset = async (datasetId: string) => {
  openLoading({ text: '데이터셋 상세를 불러오는 중...' })
  try {
    const res = await fetchDocDataset(datasetId)
    selectedDatasetDetail.value = res.data ?? null
    return res
  } finally {
    closeLoading()
  }
}

/** 데이터소스 목록 조회 */
const handleSelectDatasetSrcList = async () => {
  openLoading({ text: '데이터소스를 불러오는 중...' })
  try {
    const res = await fetchDatasetSrcList()
    // 카테고리 목록 세팅
    selectedDatasetCategoryList.value = res.categoryList ?? []
    // 문서 목록 세팅
    selectedDatasetDocList.value = res.docList ?? []
    // URL 목록 세팅
    selectedDatasetUrlList.value = res.urlList ?? []
  } finally {
    closeLoading()
  }
}

/** 코드 옵션 목록 조회 */
const handleSelectCodeOptions = async () => {
  const [chunkCodes, embedModelCodes, vectorDbCodes, llmCodes] = await Promise.all([
    getCodes('RG000002'),
    getCodes('RG000004'),
    getCodes('RG000005'),
    getCodes('RG000011'),
  ])
  // 코드 옵션 세팅
  chunkAlgorithmOptions.value = mapCodeOptions(chunkCodes)
  embeddingModelOptions.value = mapCodeOptions(embedModelCodes)
  vectorDbOptions.value = mapCodeOptions(vectorDbCodes)
  llmOptions.value = mapCodeOptions(llmCodes)
}

/** 코드 옵션 매핑 */
const mapCodeOptions = (codes: CodeItem[]) => [
  { label: '선택', value: '' },
  ...codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  })),
]

const CHUNK_ALGO_CODE = {
  recursive: '001',
  semantic: '002',
  fixed: '003',
  sentence: '004',
  html: '005',
  markdown: '006',
  paging: '007',
} as const

// 청킹 알고리즘별로 비활성/숨김되는 항목 값은 `null`로 정리
// (생성/수정 모드 진입 시에도 이전 값이 남아 혼동되는 것을 방지)
const normalizeChunkAlgorithmForm = (form: DocDatasetForm): DocDatasetForm => {
  const chunkSizeEnabledCodes: string[] = [CHUNK_ALGO_CODE.recursive, CHUNK_ALGO_CODE.fixed, CHUNK_ALGO_CODE.sentence]
  const algo = form.chunkAlgorithm
  const hasChunkSize = chunkSizeEnabledCodes.includes(algo)
  const isPagingAlgo = algo === CHUNK_ALGO_CODE.paging
  const isRecursiveAlgo = algo === CHUNK_ALGO_CODE.recursive
  const isSemanticAlgo = algo === CHUNK_ALGO_CODE.semantic
  const isSentenceAlgo = algo === CHUNK_ALGO_CODE.sentence
  const isHtmlAlgo = algo === CHUNK_ALGO_CODE.html
  const isMarkdownAlgo = algo === CHUNK_ALGO_CODE.markdown

  return {
    ...form,
    chunkSize: hasChunkSize ? form.chunkSize : null,
    chunkOverlap: hasChunkSize ? form.chunkOverlap : null,
    minChunkSize: isPagingAlgo ? form.minChunkSize : null,
    chunkOptSeparatorsText: isRecursiveAlgo ? form.chunkOptSeparatorsText : null,
    chunkOptSentenceSep: isSemanticAlgo ? form.chunkOptSentenceSep : null,
    chunkOptBufferSize: isSemanticAlgo ? form.chunkOptBufferSize : null,
    chunkOptBreakpointPercentileThreshold: isSemanticAlgo ? form.chunkOptBreakpointPercentileThreshold : null,
    chunkOptSeparator: isSentenceAlgo ? form.chunkOptSeparator : null,
    chunkOptParagraphSeparator: isSentenceAlgo ? form.chunkOptParagraphSeparator : null,
    chunkOptHtmlTagsText: isHtmlAlgo ? form.chunkOptHtmlTagsText : null,
    chunkOptHeaderPathSeparator: isMarkdownAlgo ? form.chunkOptHeaderPathSeparator : null,
    chunkOptMinTokens: isPagingAlgo ? form.chunkOptMinTokens : null,
  }
}

const decodeChunkEscapedText = (value: string | null | undefined) => {
  return String(value ?? '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
}
const encodeChunkEscapedText = (value: string) => value.replace(/\n/g, '\\n').replace(/\t/g, '\\t')

const parseCommaSeparatedText = (value: string | null | undefined) =>
  String(value ?? '')
    .split(',')
    .map((item) => decodeChunkEscapedText(item.trim()))
    .filter((item) => item !== '')

const stringifyCommaSeparatedText = (values: unknown) => {
  if (!Array.isArray(values)) return ''
  return values
    .map((value) => encodeChunkEscapedText(String(value ?? '')))
    .filter((value) => value !== '')
    .join(',')
}

const parseChunkOptJson = (value: unknown): Record<string, unknown> => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

const toNumberOr = (value: unknown, fallback: number) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const buildChunkOptJson = (data: DocDatasetForm): Record<string, unknown> | undefined => {
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.recursive) {
    return { separators: parseCommaSeparatedText(data.chunkOptSeparatorsText) }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.semantic) {
    return {
      sentence_sep: (data.chunkOptSentenceSep ?? '').trim() || 'nltk',
      buffer_size: data.chunkOptBufferSize ?? 1,
      breakpoint_percentile_threshold: data.chunkOptBreakpointPercentileThreshold ?? 95,
    }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.sentence) {
    return {
      separator: decodeChunkEscapedText(data.chunkOptSeparator),
      paragraph_separator: decodeChunkEscapedText(data.chunkOptParagraphSeparator),
    }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.html) {
    return { tag: parseCommaSeparatedText(data.chunkOptHtmlTagsText) }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.markdown) {
    return { header_path_separator: data.chunkOptHeaderPathSeparator ?? '/' }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.paging) {
    // MIN_CHUNK_SZ — 컬럼 대신 CHUNK_OPT_JSON에만 담아 전송 (VO String → DB JSON)
    return { min_chunk_sz: data.chunkOptMinTokens ?? data.minChunkSize ?? 0 }
  }
  return undefined
}

/** 저장 시 데이터셋 생성 */
const onSaveCreate = (data: DocDatasetForm, startBuild: boolean) => {
  const datasetName = data.name?.trim()
  const targetName = datasetName ? `'${datasetName}'` : '이 데이터셋'
  const modeText = modalMode.value === 'edit' ? '수정' : '생성'

  openConfirm({
    title: `데이터셋 ${modeText}`,
    message: startBuild
      ? `${targetName}을(를) 저장하고 구축을 시작하시겠습니까?`
      : `${targetName}을(를) 저장하시겠습니까?`,
    onConfirm: async () => {
      const chunkOptObj = buildChunkOptJson(data)
      const chunkOptJson = chunkOptObj !== undefined ? JSON.stringify(chunkOptObj) : undefined
      // 007(PAGING): 최소 청크는 chunkOptJson.min_chunk_sz 만 사용 — 상위 MIN_CHUNK_SZ 컬럼은 0
      const minChunkSz = data.chunkAlgorithm === CHUNK_ALGO_CODE.paging ? 0 : (data.minChunkSize ?? 0)
      // 저장 요청 데이터 생성
      const payload: DocDatasetSavePayload = {
        datasetId: editingDatasetId.value || undefined,
        dsNm: data.name,
        description: data.description,
        version: data.version,
        chunkAlgoCd: data.chunkAlgorithm,
        chunkSize: data.chunkSize ?? 0,
        chunkOverlap: data.chunkOverlap ?? 0,
        minChunkSz,
        ...(chunkOptJson !== undefined ? { chunkOptJson } : {}),
        datasetBuildStatusCd: startBuild ? '002' : '001',
        promptId: data.promptId,
        llmCd: data.llmCd,
        embedModelCd: data.embeddingModel,
        vectorDbCd: data.vectorDb,
        chunkCnt: 0,
        srchQual: 0,
        useYn: 'Y',
        lowercaseYn: data.useLowercasing ? 'Y' : 'N',
        wspNormYn: data.useWhitespaceNorm ? 'Y' : 'N',
        specChrRmYn: data.useSpecialCharRemoval ? 'Y' : 'N',
        singleCellText: data.useSingleCellText ? 'Y' : 'N',
        docFileIdList: data.selectedDocFileIds.map((id) => ({
          docFileId: id,
          datasetId: editingDatasetId.value ?? '',
        })),
        urlIdList: data.selectedUrlIds.map((id) => ({ urlId: id, datasetId: editingDatasetId.value ?? '' })),
      }

      // 데이터셋 저장
      const { affected, datasetId } = await handleSaveDocDataset(payload)
      // 데이터셋 구축 진행 스트림 시작
      if (startBuild && affected > 0 && datasetId) {
        const buildStartParams = createBuildStreamStartParams(data)
        handleStartBuildStream(datasetId, buildStartParams)
      }
      // 생성/수정 모달 닫기
      isCreateModalOpen.value = false
    },
  })
}

// 상세 데이터를 폼 데이터로 변환
const mapDetailToForm = (
  detail: DocDatasetDetail | null,
  selectedDocFileIds: string[],
  selectedUrlIds: string[],
): DocDatasetForm => {
  const chunkOptJson = parseChunkOptJson(detail?.chunkOptJson)
  const semanticSentenceSep = String(chunkOptJson.sentence_sep ?? '')
  const sentenceSeparator = String(chunkOptJson.separator ?? '')
  const paragraphSeparator = String(chunkOptJson.paragraph_separator ?? '')
  const headerPathSeparator = String(chunkOptJson.header_path_separator ?? '')
  const isPagingAlgo = detail?.chunkAlgoCd === CHUNK_ALGO_CODE.paging
  const pagingMinFromJson = toNumberOr(chunkOptJson.min_chunk_sz ?? chunkOptJson.min_tokens, detail?.minChunkSz ?? 300)

  return normalizeChunkAlgorithmForm({
    name: detail?.dsNm ?? '',
    description: detail?.description ?? '',
    version: detail?.version ?? '',
    useDocument: detail ? selectedDocFileIds.length > 0 : true,
    selectedDocFileIds,
    useUrl: detail ? selectedUrlIds.length > 0 : true,
    selectedUrlIds,
    chunkAlgorithm: detail?.chunkAlgoCd ?? '',
    chunkSize: detail?.chunkSize ?? 0,
    chunkOverlap: detail?.chunkOverlap ?? 0,
    minChunkSize: isPagingAlgo ? pagingMinFromJson : (detail?.minChunkSz ?? 0),
    chunkOptSeparatorsText: stringifyCommaSeparatedText(chunkOptJson.separators),
    chunkOptSeparator: sentenceSeparator ? encodeChunkEscapedText(sentenceSeparator) : '',
    chunkOptParagraphSeparator: paragraphSeparator ? encodeChunkEscapedText(paragraphSeparator) : '',
    chunkOptSentenceSep: semanticSentenceSep || 'nltk',
    chunkOptBufferSize: toNumberOr(chunkOptJson.buffer_size, 1),
    chunkOptBreakpointPercentileThreshold: toNumberOr(chunkOptJson.breakpoint_percentile_threshold, 95),
    chunkOptHtmlTagsText: stringifyCommaSeparatedText(chunkOptJson.tag),
    chunkOptHeaderPathSeparator: headerPathSeparator || '/',
    chunkOptMinTokens: isPagingAlgo
      ? pagingMinFromJson
      : toNumberOr(chunkOptJson.min_chunk_sz ?? chunkOptJson.min_tokens, 300),
    useLowercasing: detail?.lowercaseYn === 'Y',
    useWhitespaceNorm: detail?.wspNormYn === 'Y',
    useSpecialCharRemoval: detail?.specChrRmYn === 'Y',
    useSingleCellText: detail?.singleCellText === 'Y',
    promptId: '',
    llmCd: detail?.llmCd ?? '',
    embeddingModel: detail?.embedModelCd ?? '',
    vectorDb: detail?.vectorDbCd ?? '',
  })
}

/** 데이터셋 수정 */
const onEdit = async (dataset: DocDataset) => {
  // 데이터셋 상세 조회 (데이터셋, 문서, URL 목록 조회)
  const res = await handleSelectDocDataset(dataset.datasetId)
  const data = res.data
  if (!data) return

  // 카테고리, 문서, url 전체 목록 조회
  await handleSelectDatasetSrcList()

  // 데이터셋과 매핑된 문서, URL ID 목록 세팅
  const dsDocFileIds = (res.dsDocList ?? []).map((item) => String(item.docFileId ?? ''))
  const dsUrlIds = (res.dsUrlList ?? []).map((item) => String(item.urlId))
  initialSelectedDocFileIds.value = [...dsDocFileIds]
  const mappedForm = mapDetailToForm(data, dsDocFileIds, dsUrlIds)
  initialPreprocessSignature.value = buildPreprocessSignature(mappedForm)
  initialEmbeddingModelCd.value = mappedForm.embeddingModel ?? ''
  initialVectorDbCd.value = mappedForm.vectorDb ?? ''
  // 모달 모드 세팅
  modalMode.value = 'edit'
  // 수정 데이터셋 ID 세팅
  editingDatasetId.value = dataset.datasetId
  // 상세 데이터를 폼 데이터로 변환
  editFormData.value = mappedForm
  isCreateModalOpen.value = true
}

// 삭제 버튼 클릭
const onDelete = (id: string) => {
  deleteTargetId.value = id
  const datasetNm = datasetList.value.find((item) => item.datasetId === id)?.dsNm ?? ''
  const targetName = datasetNm ? `'${datasetNm}'` : '이 데이터셋'

  openConfirm({
    title: '데이터셋 삭제',
    message: `${targetName}을(를) 삭제하시겠습니까?\n벡터 인덱스가 함께 삭제됩니다.`,
    onConfirm: async () => {
      await handleDeleteDocDataset(id)
    },
  })
}

// 변경 이력 버튼 클릭
const onHistory = (id: string) => {
  historyDatasetId.value = id
  isHistoryModalOpen.value = true
}

// 이력 삭제
const onDeleteHistory = async (id: string) => {
  const confirmed = await openConfirm({
    title: '이력 삭제',
    message: '이 변경이력을 삭제하시겠습니까?',
  })
  if (!confirmed) return
  await handleDeleteDocDatasetHistory(id, historyDatasetId.value ?? '')
}

// 구축 중지
const onStopBuild = (id: string) => {
  const datasetNm = datasetList.value.find((item) => item.datasetId === id)?.dsNm ?? ''
  const targetName = datasetNm ? `'${datasetNm}'` : '이 데이터셋'

  openConfirm({
    title: '구축 중지',
    message: `${targetName}의 구축을 중지하시겠습니까?`,
    onConfirm: async () => {
      handleCloseBuildStream(id)
      handleClearBuildState(id)

      openLoading({ text: '구축 중지를 처리하는 중...' })
      try {
        const res = await fetchToggleActiveDocDataset(id, '', '001')
        const affected = typeof res.data === 'number' ? res.data : 0
        if (affected > 0) {
          openToast({ message: '구축 중지되었습니다.', type: 'success' })
        } else {
          openToast({ message: '구축 중지에 실패했습니다.', type: 'error' })
        }
      } finally {
        closeLoading()
      }

      // 목록 + 요약 동시 조회
      await handleSelectAll()
    },
  })
}

// 삭제 버튼 클릭 시 실행(삭제 모달 확인 후 실행)
const doDelete = async () => {
  await handleDeleteDocDataset(deleteTargetId.value)
}

// 데이터셋 저장
const handleSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
  openLoading({ text: '데이터셋을 저장하는 중...' })
  let affected = 0
  let datasetId = ''
  try {
    const res = await fetchSaveDocDataset(dataset)
    affected = typeof res.data === 'number' ? res.data : 0
    datasetId = res.datasetId ?? dataset.datasetId ?? ''
    if (affected > 0) {
      openToast({ message: '데이터셋이 저장되었습니다.', type: 'success' })
    } else {
      openToast({ message: '데이터셋 저장에 실패했습니다.', type: 'error' })
    }
  } finally {
    closeLoading()
  }
  // 목록 + 요약 동시 조회
  await handleSelectAll()
  return { affected, datasetId }
}

// 데이터셋 삭제 실행
const handleDeleteDocDataset = async (id: string) => {
  openLoading({ text: '데이터셋을 삭제하는 중...' })
  try {
    const res = await fetchDeleteDocDataset(id)
    const affected = typeof res.data === 'number' ? res.data : 0
    if (affected > 0) {
      openToast({ message: '데이터셋이 삭제되었습니다.', type: 'success' })
    } else {
      openToast({ message: '데이터셋 삭제에 실패했습니다.', type: 'error' })
    }
  } finally {
    closeLoading()
  }
  isDeleteModalOpen.value = false
  // 목록 + 요약 동시 조회
  await handleSelectAll()
}

// 데이터셋 활성화 토글
const handleToggleActiveDocDataset = (id: string, useYn: string, datasetBuildStatusCd: string) => {
  const nextUseYn = useYn === 'Y' ? 'N' : 'Y'
  if (datasetBuildStatusCd !== '003' && nextUseYn === 'Y') {
    openToast({ message: '구축이 완료된 데이터셋만 활성화할 수 있습니다.', type: 'warning' })
    return false
  } else {
    const nextUseLabel = nextUseYn === 'Y' ? '활성화' : '비활성화'
    const datasetNm = datasetList.value.find((item) => item.datasetId === id)?.dsNm ?? ''
    const targetName = datasetNm ? `'${datasetNm}'` : '이 데이터셋'

    openConfirm({
      title: '활성화 상태 변경',
      message: `${targetName}의 활성화 상태를 ${nextUseLabel}하시겠습니까?`,
      onConfirm: async () => {
        openLoading({ text: '활성화 상태를 변경하는 중...' })
        try {
          const res = await fetchToggleActiveDocDataset(id, nextUseYn, '')
          const affected = typeof res.data === 'number' ? res.data : 0
          if (affected > 0) {
            openToast({ message: '활성화 상태가 변경되었습니다.', type: 'success' })
          } else {
            openToast({ message: '활성화 상태 변경에 실패했습니다.', type: 'error' })
          }
        } finally {
          closeLoading()
        }

        // 목록 + 요약 동시 조회
        await handleSelectAll()
      },
    })
  }
}

// ===== 변경이력 =====
const historyList = ref<DocDatasetHistory[]>([])
const historyTotalCount = ref(0)
const historyPage = ref(1)
const historyPageSize = 5

// 변경이력 목록 조회
const handleSelectDocDatasetHistoryList = async (datasetId: string, page: number = 1) => {
  historyPage.value = page
  openLoading({ text: '이력 목록을 불러오는 중...' })
  try {
    const res = await fetchDocDatasetHistoryList(datasetId, page, historyPageSize)
    historyTotalCount.value = res?.totalCnt ?? 0
    historyList.value = res?.dataList ?? []
  } finally {
    closeLoading()
  }
}

// 변경이력 저장
const handleSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
  openLoading({ text: '이력을 저장하는 중...' })
  try {
    const res = await fetchSaveDocDatasetHistory({
      datasetId: history.datasetId,
      verNo: history.version,
      chgContent: history.content,
    })
    const affected = typeof res.data === 'number' ? res.data : 0
    if (affected > 0) {
      openToast({ message: '이력이 저장되었습니다.', type: 'success' })
    } else {
      openToast({ message: '이력 저장에 실패했습니다.', type: 'error' })
    }
  } finally {
    closeLoading()
  }
  // 저장 후 첫 페이지로 이동하여 새 이력 표시
  await handleSelectDocDatasetHistoryList(history.datasetId, 1)
}

// 변경이력 삭제
const handleDeleteDocDatasetHistory = async (id: string, datasetId: string) => {
  openLoading({ text: '이력을 삭제하는 중...' })
  try {
    const res = await fetchDeleteDocDatasetHistory(id)
    const affected = typeof res.data === 'number' ? res.data : 0
    if (affected > 0) {
      openToast({ message: '이력이 삭제되었습니다.', type: 'success' })
    } else {
      openToast({ message: '이력 삭제에 실패했습니다.', type: 'error' })
    }
  } finally {
    closeLoading()
  }
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

/** RAG 응답 예: { sort, score, text, metadata: { page, file_path, docFileId, chunk_id } } */
const mapDocDatasetTestSearchRow = (row: Record<string, unknown>): DocDatasetSearchResult => {
  const meta =
    typeof row.metadata === 'object' && row.metadata !== null ? (row.metadata as Record<string, unknown>) : {}

  const pickStr = (keys: string[]): string => {
    for (const src of [row, meta]) {
      for (const k of keys) {
        const v = src[k]
        if (v != null && v !== '') return String(v)
      }
    }
    return ''
  }
  const pickNum = (keys: string[]): number => {
    for (const src of [row, meta]) {
      for (const k of keys) {
        const v = src[k]
        if (typeof v === 'number' && !Number.isNaN(v)) return v
        if (typeof v === 'string' && v.trim() !== '') {
          const n = Number(v)
          if (!Number.isNaN(n)) return n
        }
      }
    }
    return 0
  }

  let source = pickStr(['source', 'doc_title', 'filename', 'file_name', 'document', 'doc_nm', 'file_path'])
  if (source) {
    const normalized = source.replace(/\\/g, '/')
    const base = normalized.split('/').pop()
    if (base) source = base
  }

  return {
    chunkId: pickStr(['chunkId', 'chunk_id', 'id']),
    content: pickStr(['content', 'text', 'chunk_text', 'chunk']),
    source,
    page: Math.max(0, Math.floor(pickNum(['page', 'page_no', 'pageNum', 'page_number']))),
    similarity: pickNum(['similarity', 'score', 'sml', 'sml_score', 'cosine_similarity']),
  }
}

const buildDocDatasetSearchSummary = (results: DocDatasetSearchResult[]): DocDatasetSearchSummary => {
  const n = results.length
  if (n === 0) return { totalChunks: 0, avgSimilarity: 0 }
  const sum = results.reduce((s, r) => s + r.similarity, 0)
  return {
    totalChunks: n,
    avgSimilarity: Math.round((sum / n) * 100) / 100,
  }
}

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
  openLoading({ text: '데이터셋을 검색하는 중...' })
  try {
    const res = await fetchSearchDocDataset(params)
    const rawList = Array.isArray(res.data) ? res.data : []
    const mapped = rawList.map((item) =>
      mapDocDatasetTestSearchRow(typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}),
    )
    searchResults.value = mapped
    searchSummary.value = buildDocDatasetSearchSummary(mapped)
  } catch (e) {
    openToast({
      message: e instanceof Error ? e.message : '데이터셋 검색에 실패했습니다.',
      type: 'error',
    })
  } finally {
    isSearching.value = false
    closeLoading()
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
    onDeleteHistory,
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
    buildProgressMap,
    buildMessageMap,
    handleCloseAllBuildStreams,
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
    embeddingModelOptions,
    vectorDbOptions,
    llmOptions,
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
    onStopBuild,
    promptList,
    hasBuildConfigChanges,
  }
}

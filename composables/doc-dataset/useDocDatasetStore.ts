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
  fetchSelectPromptList,
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
  selectedDocIds: [],
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
  headerInclusion: '',
  useLowercasing: true,
  useWhitespaceNorm: false,
  useSpecialCharRemoval: false,
  useSingleCellText: true,
  sentenceSplitAlgorithm: '',
  languageDetection: '',
  promptId: '',
  llmCd: '',
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

// 데이터셋 구축 진행 스트림 시작
const handleStartBuildStream = (datasetId: string) => {
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
  const stream = new EventSource(`/api/dataset/buildStream.do?datasetId=${encodeURIComponent(datasetId)}`)
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
            await fetchToggleActiveDocDataset(datasetId, '', '001')
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
const handleSelectDatasetSrcList = async () => {
  const res = await fetchDatasetSrcList()
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
    llmCodes,
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
    getCodes('RG000011'),
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
  llmOptions.value = mapCodeOptions(llmCodes)
}

/** 프롬프트 목록 조회 */
const handleSelectPromptList = async () => {
  const res = await fetchSelectPromptList()
  promptList.value = res.dataList ?? []
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

const decodeChunkEscapedText = (value: string) => value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
const encodeChunkEscapedText = (value: string) => value.replace(/\n/g, '\\n').replace(/\t/g, '\\t')

const parseCommaSeparatedText = (value: string) =>
  value
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
      sentence_sep: data.chunkOptSentenceSep.trim() || 'nltk',
      buffer_size: data.chunkOptBufferSize,
      breakpoint_percentile_threshold: data.chunkOptBreakpointPercentileThreshold,
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
    return { header_path_separator: data.chunkOptHeaderPathSeparator || '/' }
  }
  if (data.chunkAlgorithm === CHUNK_ALGO_CODE.paging) {
    // MIN_CHUNK_SZ — 컬럼 대신 CHUNK_OPT_JSON에만 담아 전송 (VO String → DB JSON)
    return { min_chunk_sz: data.chunkOptMinTokens || data.minChunkSize }
  }
  return undefined
}

/** 저장 시 데이터셋 생성 */
const onSaveCreate = async (data: DocDatasetForm, startBuild: boolean) => {
  const chunkOptObj = buildChunkOptJson(data)
  const chunkOptJson = chunkOptObj !== undefined ? JSON.stringify(chunkOptObj) : undefined
  // 007(PAGING): 최소 청크는 chunkOptJson.min_chunk_sz 만 사용 — 상위 MIN_CHUNK_SZ 컬럼은 0
  const minChunkSz = data.chunkAlgorithm === CHUNK_ALGO_CODE.paging ? 0 : data.minChunkSize
  // 저장 요청 데이터 생성
  const payload: DocDatasetSavePayload = {
    datasetId: editingDatasetId.value || undefined,
    dsNm: data.name,
    description: data.description,
    version: data.version,
    chunkAlgoCd: data.chunkAlgorithm,
    chunkSize: data.chunkSize,
    chunkOverlap: data.chunkOverlap,
    minChunkSz,
    ...(chunkOptJson !== undefined ? { chunkOptJson } : {}),
    hdrInclCd: data.headerInclusion,
    datasetBuildStatusCd: startBuild ? '002' : '001',
    promptId: data.promptId,
    llmCd: data.llmCd,
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
    singleCellText: data.useSingleCellText ? 'Y' : 'N',
    sentSplitAlgoCd: data.sentenceSplitAlgorithm,
    langDetectCd: data.languageDetection,
    docIdList: data.selectedDocIds.map((id) => ({ docId: id, datasetId: editingDatasetId.value ?? '' })),
    urlIdList: data.selectedUrlIds.map((id) => ({ urlId: id, datasetId: editingDatasetId.value ?? '' })),
  }
  // 데이터셋 저장
  const { affected, datasetId } = await handleSaveDocDataset(payload)
  // 데이터셋 구축 진행 스트림 시작
  if (startBuild && affected > 0 && datasetId) {
    handleStartBuildStream(datasetId)
  }
  // 생성 모달 닫기
  isCreateModalOpen.value = false
}

// 상세 데이터를 폼 데이터로 변환
const mapDetailToForm = (
  detail: DocDatasetDetail | null,
  selectedDocIds: string[],
  selectedUrlIds: string[],
): DocDatasetForm => {
  const chunkOptJson = parseChunkOptJson(detail?.chunkOptJson)
  const semanticSentenceSep = String(chunkOptJson.sentence_sep ?? '')
  const sentenceSeparator = String(chunkOptJson.separator ?? '')
  const paragraphSeparator = String(chunkOptJson.paragraph_separator ?? '')
  const headerPathSeparator = String(chunkOptJson.header_path_separator ?? '')
  const isPagingAlgo = detail?.chunkAlgoCd === CHUNK_ALGO_CODE.paging
  const pagingMinFromJson = toNumberOr(chunkOptJson.min_chunk_sz ?? chunkOptJson.min_tokens, detail?.minChunkSz ?? 300)

  return {
    name: detail?.dsNm ?? '',
    description: detail?.description ?? '',
    version: detail?.version ?? '',
    useDocument: detail ? selectedDocIds.length > 0 : true,
    selectedDocIds,
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
    headerInclusion: detail?.hdrInclCd ?? '',
    useLowercasing: detail?.lowercaseYn === 'Y',
    useWhitespaceNorm: detail?.wspNormYn === 'Y',
    useSpecialCharRemoval: detail?.specChrRmYn === 'Y',
    useSingleCellText: detail?.singleCellText === 'Y',
    sentenceSplitAlgorithm: detail?.sentSplitAlgoCd ?? '',
    languageDetection: detail?.langDetectCd ?? '',
    promptId: '',
    llmCd: detail?.llmCd ?? '',
    embeddingModel: detail?.embedModelCd ?? '',
    vectorDb: detail?.vectorDbCd ?? '',
    embeddingNormalization: detail?.embedNormCd ?? '',
    poolingStrategy: detail?.poolStratCd ?? '',
    dimensionReduction: detail?.dimReducCd ?? '',
  }
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
  const dsDocIds = (res.dsDocList ?? []).map((item) => String(item.docId))
  const dsUrlIds = (res.dsUrlList ?? []).map((item) => String(item.urlId))
  // 모달 모드 세팅
  modalMode.value = 'edit'
  // 수정 데이터셋 ID 세팅
  editingDatasetId.value = dataset.datasetId
  // 상세 데이터를 폼 데이터로 변환
  editFormData.value = mapDetailToForm(data, dsDocIds, dsUrlIds)
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
const onStopBuild = async (id: string) => {
  handleCloseBuildStream(id)
  handleClearBuildState(id)
  const res = await fetchToggleActiveDocDataset(id, '', '001')
  const affected = typeof res.data === 'number' ? res.data : 0
  if (affected > 0) {
    openToast({ message: '구축 중지되었습니다.', type: 'success' })
  } else {
    openToast({ message: '구축 중지에 실패했습니다.', type: 'error' })
  }
  // 목록 + 요약 동시 조회
  await handleSelectAll()
}

// 삭제 버튼 클릭 시 실행(삭제 모달 확인 후 실행)
const doDelete = async () => {
  await handleDeleteDocDataset(deleteTargetId.value)
}

// 데이터셋 저장
const handleSaveDocDataset = async (dataset: DocDatasetSavePayload) => {
  const res = await fetchSaveDocDataset(dataset)
  const affected = typeof res.data === 'number' ? res.data : 0
  const datasetId = res.datasetId ?? dataset.datasetId ?? ''
  if (affected > 0) {
    openToast({ message: '데이터셋이 저장되었습니다.', type: 'success' })
  } else {
    openToast({ message: '데이터셋 저장에 실패했습니다.', type: 'error' })
  }
  // 목록 + 요약 동시 조회
  await handleSelectAll()
  return { affected, datasetId }
}

// 데이터셋 삭제 실행
const handleDeleteDocDataset = async (id: string) => {
  const res = await fetchDeleteDocDataset(id)
  const affected = typeof res.data === 'number' ? res.data : 0
  if (affected > 0) {
    openToast({ message: '데이터셋이 삭제되었습니다.', type: 'success' })
  } else {
    openToast({ message: '데이터셋 삭제에 실패했습니다.', type: 'error' })
  }
  isDeleteModalOpen.value = false
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
  const res = await fetchToggleActiveDocDataset(id, useYn, '')
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

// 변경이력 목록 조회
const handleSelectDocDatasetHistoryList = async (datasetId: string, page: number = 1) => {
  historyPage.value = page
  const res = await fetchDocDatasetHistoryList(datasetId, page, historyPageSize)
  historyTotalCount.value = res?.totalCnt ?? 0

  historyList.value = res?.dataList ?? []
}

// 변경이력 저장
const handleSaveDocDatasetHistory = async (history: { datasetId: string; version: string; content: string }) => {
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
  // 저장 후 첫 페이지로 이동하여 새 이력 표시
  await handleSelectDocDatasetHistoryList(history.datasetId, 1)
}

// 변경이력 삭제
const handleDeleteDocDatasetHistory = async (id: string, datasetId: string) => {
  const res = await fetchDeleteDocDatasetHistory(id)
  const affected = typeof res.data === 'number' ? res.data : 0
  if (affected > 0) {
    openToast({ message: '이력이 삭제되었습니다.', type: 'success' })
  } else {
    openToast({ message: '이력 삭제에 실패했습니다.', type: 'error' })
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
    headerInclusionOptions,
    embeddingModelOptions,
    vectorDbOptions,
    normalizationOptions,
    poolingOptions,
    dimensionOptions,
    sentenceSplitOptions,
    languageDetectionOptions,
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
    handleSelectPromptList,
  }
}

/** 채팅 패널 관리자
 * - 채팅 패널 관리 (pdf, 시각화, 리포트)
 */
import type { ChatRefRow, PanelType, VisualizationViewModel } from '~/types/chat'
import { buildVisualizationViewModel } from '~/utils/chat/visualizationUtil'
import { clearBodyChartFullscreen } from '~/utils/chat/visualizationChartUtil'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatApi } from '~/composables/chat/useChatApi'
import { useFileStore } from '~/composables/com/useFileStore'
import { ref, computed } from 'vue'

const { getMessagesForVisualization } = useChatMessages()
const { fetchSelectChatRef, fetchSelectTableDataList } = useChatApi()
const { handleViewFileUrl } = useFileStore()

// pdf 뷰어 or 시각화
const activePanelType = ref<PanelType>('none')
const isPanelFullscreen = ref(false)
const activePanelMessageId = ref<string | null>(null)
const pdfRefList = ref<ChatRefRow[]>([])
const chatPdfFileUrlMap = ref<Record<string, string>>({})
/** URL 수집 파일(urlId != null)인 docFileId Set — 외부 URL 여부 판별용 */
const chatPdfExternalDocSet = ref(new Set<string>())
const visualizationViewMap = ref<Record<string, VisualizationViewModel>>({})

const getEmptyVisualizationViewModel = (messageId: string): VisualizationViewModel => ({
  messageId,
  status: 'empty',
  sql: '',
  rawTableData: '',
  rows: [],
  schema: null,
})

const activeVisualizationView = computed(() => {
  const messageId = activePanelMessageId.value
  if (!messageId) return null
  return visualizationViewMap.value[messageId] ?? getEmptyVisualizationViewModel(messageId)
})

export const useChatPanelManager = () => {
  const handleSelectChatPdfFileUrl = async (docFileId: string): Promise<string | null> => {
    const normalizedId = String(docFileId ?? '').trim()
    if (!normalizedId) return null
    const cached = chatPdfFileUrlMap.value[normalizedId]
    if (cached) return cached
    const { url, externalUrl } = await handleViewFileUrl(normalizedId)
    const finalUrl = externalUrl || url
    if (!finalUrl) return null
    if (externalUrl) chatPdfExternalDocSet.value = new Set([...chatPdfExternalDocSet.value, normalizedId])
    chatPdfFileUrlMap.value = { ...chatPdfFileUrlMap.value, [normalizedId]: finalUrl }
    return finalUrl
  }

  /** URL 수집 파일(외부 URL)인지 여부 판별 — handleSelectChatPdfFileUrl 호출 후 유효 */
  const isChatPdfExternalDoc = (docFileId: string) => chatPdfExternalDocSet.value.has(String(docFileId ?? '').trim())

  const handleResetChatPdfFileUrlMap = () => {
    chatPdfFileUrlMap.value = {}
    chatPdfExternalDocSet.value = new Set()
  }

  /**
   * 테이블 본문은 메시지의 tableData(selectChatLogList·스트리밍) 사용.
   * ID/코드 → 한글명 매핑(statList, statDetailList)은 selectTableDataList로만 조회해 registerDynamicMappings에 반영.
   */
  const handleSelectVisualizationData = async (logId: string) => {
    if (!logId) return getEmptyVisualizationViewModel('')

    // 시각화를 띄울 때 조회할 메시지 조회
    const source = getMessagesForVisualization()
    const answerMsg = source.find((m) => m.logId === logId && m.type === 'answer')
    // 답변 메시지의 tableData 조회
    const tableData = typeof answerMsg?.tableData === 'string' ? answerMsg.tableData : ''
    const chartOption = answerMsg?.chartOption
    // 답변 메시지의 sql 조회
    const sql = typeof answerMsg?.visualizationData?.sql === 'string' ? answerMsg.visualizationData.sql : ''
    // 테이블 데이터가 없으면 빈 뷰 모델 반환
    if (!tableData.trim()) {
      const empty = getEmptyVisualizationViewModel(logId)
      visualizationViewMap.value[logId] = empty
      return empty
    }
    // 시각화 뷰 모델 생성
    visualizationViewMap.value[logId] = {
      messageId: logId,
      status: 'loading',
      sql: '',
      rawTableData: '',
      rows: [],
      schema: null,
    }

    // 통계 ID → 명칭 매핑 정보 조회
    let statList: VisualizationViewModel['statList']
    // 상세항목 코드 → 명칭 매핑 정보 조회
    let statDetailList: VisualizationViewModel['statDetailList']
    openLoading({ text: '시각화 데이터를 불러오는 중...' })
    try {
      const res = await fetchSelectTableDataList({ logId })
      statList = res.statList
      statDetailList = res.statDetailList
    } catch {
      // 매핑 API 실패 시 표/차트는 컬럼 키 기준 라벨로 표시
    } finally {
      closeLoading()
    }

    const viewModel = buildVisualizationViewModel({
      messageId: logId,
      sql,
      tableData,
      chartOption,
      statList,
      statDetailList,
    })
    visualizationViewMap.value[logId] = viewModel
    return viewModel
  }

  // 원본 보기 버튼 클릭 시(pdf 패널 열기)
  const onViewSource = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'pdf'
    activePanelMessageId.value = id
    pdfRefList.value = []
    handleResetChatPdfFileUrlMap()
    // 참조 문서 목록 조회
    openLoading({ text: '참조 문서를 불러오는 중...' })
    let res: { list: ChatRefRow[] }
    try {
      res = await fetchSelectChatRef(id)
    } finally {
      closeLoading()
    }
    pdfRefList.value = res.list
  }

  // 시각화 보기 버튼 클릭 시(시각화 패널 열기)
  const onViewVisualization = async (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'visualization'
    activePanelMessageId.value = id
    await handleSelectVisualizationData(id)
  }

  // 리서치 리포트 보기 버튼 클릭 시(리포트 패널 열기)
  const onViewReport = (id: string) => {
    isPanelFullscreen.value = false
    activePanelType.value = 'report'
    activePanelMessageId.value = id
  }

  const onPanelClose = (value: boolean) => {
    if (!value) {
      clearBodyChartFullscreen()
      if (activePanelType.value === 'pdf') {
        handleResetChatPdfFileUrlMap()
      }
      if (activePanelType.value === 'visualization' && activePanelMessageId.value) {
        const removeId = activePanelMessageId.value
        visualizationViewMap.value = Object.fromEntries(
          Object.entries(visualizationViewMap.value).filter(([k]) => k !== removeId),
        )
      }
      activePanelType.value = 'none'
      isPanelFullscreen.value = false
      activePanelMessageId.value = null
    }
  }

  return {
    activePanelType,
    isPanelFullscreen,
    activePanelMessageId,
    pdfRefList,
    visualizationViewMap,
    activeVisualizationView,
    handleSelectChatPdfFileUrl,
    isChatPdfExternalDoc,
    handleResetChatPdfFileUrlMap,
    handleSelectVisualizationData,
    onViewSource,
    onViewVisualization,
    onViewReport,
    onPanelClose,
  }
}

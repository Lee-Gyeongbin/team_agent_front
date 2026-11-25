import type { InqAnsr, InqComposer, InqFile, InqItem, InqRow } from '~/types/inq'
import { INQ_MANAGE_MENU_PATH } from '~/types/inq'
import { useInqManageApi } from '~/composables/inq-manage/useInqManageApi'
import { useFileStore } from '~/composables/com/useFileStore'
import {
  countInqDescendants,
  getInqErrorMessage,
  getInqOrderNo,
  INQ_ANSWER_HTML_PREFIX,
  toInqAnswerHtml,
  orderInqAnswers,
  toInqOptions,
} from '~/utils/inq/inqUtil'

const {
  fetchSelectInqManageCodeInfo,
  fetchSelectInqManageList,
  fetchDownloadInqManageExcel,
  fetchSelectInqManageDetail,
  fetchDeleteInqManage,
  fetchSaveInqManageStatus,
  fetchSaveInqManageAnsr,
  fetchDeleteInqManageAnsr,
  fetchInqManageFileDownloadUrl,
  fetchInqManageFilePreview,
} = useInqManageApi()

const excelMenuItems = [{ label: '다운로드', value: 'download', icon: 'icon-download' }]

/** 문의하기 관리(/inq-manage) 스토어 */
export const useInqManageStore = () => {
  const { canFunc } = usePermission()
  const { handleDownloadByUrl } = useFileStore()

  // ==============================
  // 상태
  // ==============================
  const inqList = ref<InqRow[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const searchKeyword = ref('')
  const searchCatCd = ref('')
  const searchStatusCd = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const catOptions = ref<{ label: string; value: string }[]>([])
  const statusOptions = ref<{ label: string; value: string }[]>([])
  /** 처리상태 코드 ID → 배지 구분값 — 배지 색 판단에 쓴다 */
  const statusFlagMap = ref<Record<string, string | null>>({})
  /** 서버가 내려주는 정책값·구분 코드 (화면에 하드코딩하지 않는다) */
  const waitingStatusCd = ref('')
  const pageSize = ref(0)
  const ansrMaxDepth = ref(0)

  const isDetailOpen = ref(false)
  const selectedInq = ref<InqItem | null>(null)
  const inqFiles = ref<InqFile[]>([])
  const inqAnswers = ref<InqAnsr[]>([])
  const composer = ref<InqComposer | null>(null)
  const statusDraft = ref('')

  // ==============================
  // 계산값
  // ==============================
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / (pageSize.value || 1))))
  const listCatOptions = computed(() => [{ label: '전체', value: '' }, ...catOptions.value])
  const listStatusOptions = computed(() => [{ label: '전체', value: '' }, ...statusOptions.value])
  /** 관리자가 선택할 수 있는 처리상태 — 답변전은 제외 */
  const adminStatusOptions = computed(() => statusOptions.value.filter((o) => o.value !== waitingStatusCd.value))
  const orderedAnswers = computed(() => orderInqAnswers(inqAnswers.value))
  const isSearching = computed(() => !!(searchKeyword.value.trim() || searchCatCd.value || searchStatusCd.value))
  const emptyTitle = computed(() => (isSearching.value ? '검색 결과가 없습니다.' : '등록된 문의 내역이 없습니다.'))

  /** 메뉴 기능 권한(답변·상태 변경·삭제) */
  const hasFunc = computed(() => canFunc(INQ_MANAGE_MENU_PATH))
  /** 관리자 답변(1단계)은 한 건만 둘 수 있다 */

  // ==============================
  // 옵션 조회
  // ==============================
  const handleSelectInqManageOptions = async () => {
    try {
      const info = await fetchSelectInqManageCodeInfo()
      catOptions.value = toInqOptions(info.catList)
      statusOptions.value = toInqOptions(info.statusList)
      statusFlagMap.value = Object.fromEntries(info.statusList.map((c) => [c.codeId, c.flag]))
      waitingStatusCd.value = info.waitingStatusCd ?? ''
      pageSize.value = info.pageSize
      ansrMaxDepth.value = info.ansrMaxDepth
    } catch (error) {
      console.error(error)
      openToast({ message: '구분·상태 목록을 불러오지 못했습니다.', type: 'error' })
    }
  }

  // ==============================
  // 목록
  // ==============================
  const handleSelectInqManageList = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const res = await fetchSelectInqManageList({
        pageIndex: currentPage.value,
        searchKeyword: searchKeyword.value.trim() || undefined,
        catCd: searchCatCd.value || undefined,
        statusCd: searchStatusCd.value || undefined,
      })
      inqList.value = res.dataList ?? []
      totalCount.value = Number(res.totalCnt ?? 0)
    } catch (error) {
      inqList.value = []
      errorMessage.value = getInqErrorMessage(error, '문의사항을 불러오지 못했습니다.')
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  /** 엑셀 메뉴 — 다운로드만 제공 (현재 조회 조건의 전체 목록, 문의 내용·답변·처리상태 포함) */
  const onInqManageExcelSelect = async (value: string) => {
    if (value !== 'download') return
    try {
      await fetchDownloadInqManageExcel({
        searchKeyword: searchKeyword.value.trim() || undefined,
        catCd: searchCatCd.value || undefined,
        statusCd: searchStatusCd.value || undefined,
      })
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '엑셀 다운로드 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  /** 처리상태 코드 → 배지 구분값 */
  const getStatusFlag = (statusCd?: string | null) => statusFlagMap.value[statusCd ?? ''] ?? null

  const getInqManageOrderLabel = (row: InqRow) =>
    getInqOrderNo(inqList.value, row, totalCount.value, currentPage.value, pageSize.value)

  // ==============================
  // 상세
  // ==============================
  /** keepComposer: 처리상태 변경처럼 작성 중인 답변을 유지해야 할 때 true */
  const handleSelectInqManageDetail = async (inqId: string, keepComposer = false) => {
    try {
      const res = await fetchSelectInqManageDetail(inqId)
      selectedInq.value = res.data
      inqFiles.value = res.files ?? []
      inqAnswers.value = res.answers ?? []
      statusDraft.value = ''
      // 관리자 답변이 아직 없으면 새 답변 입력창을 기본으로 연다
      if (!keepComposer) {
        composer.value = hasFunc.value && res.data.answerYn !== 'Y' ? { mode: 'new', targetId: '', text: '' } : null
      }
      isDetailOpen.value = true
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '문의사항 상세 조회 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  const onOpenInqManageDetail = async (row: Pick<InqRow, 'inqId'>) => {
    await handleSelectInqManageDetail(row.inqId)
  }

  const onCloseInqManageDetail = () => {
    isDetailOpen.value = false
    composer.value = null
  }

  const onDeleteInqManage = async () => {
    const item = selectedInq.value
    if (!item || !hasFunc.value) return
    const confirmed = await openConfirm({
      title: '문의사항 삭제',
      message: `'${item.title}'을(를) 삭제하시겠습니까? 삭제한 내용은 복구할 수 없습니다.`,
      confirmText: '삭제',
    })
    if (!confirmed) return
    try {
      await fetchDeleteInqManage(item.inqId)
      isDetailOpen.value = false
      selectedInq.value = null
      openToast({ message: '문의사항을 삭제했습니다.' })
      await handleSelectInqManageList()
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '문의사항 삭제 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // 처리상태
  // ==============================
  const onSaveInqManageStatus = async () => {
    const item = selectedInq.value
    if (!item || !statusDraft.value) return
    try {
      await fetchSaveInqManageStatus(item.inqId, statusDraft.value)
      openToast({ message: '처리상태가 변경되었습니다.' })
      await Promise.all([handleSelectInqManageList(), handleSelectInqManageDetail(item.inqId, true)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '처리상태 변경 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // 답변·댓글
  // ==============================
  const onStartReply = (a: InqAnsr) => {
    composer.value = { mode: 'reply', targetId: a.ansrId, text: '' }
  }

  const onStartEditAnsr = (a: InqAnsr) => {
    composer.value = { mode: 'edit', targetId: a.ansrId, text: toInqAnswerHtml(a.content) }
  }

  const onChangeComposerText = (text: string) => {
    if (composer.value) composer.value = { ...composer.value, text }
  }

  const onCancelComposer = () => {
    composer.value = null
  }

  const onSaveComposer = async () => {
    const item = selectedInq.value
    const c = composer.value
    if (!item || !c) return
    const text = c.text.trim()
    if (!text) {
      openToast({ message: '내용을 입력해주세요.', type: 'warning' })
      return
    }
    try {
      await fetchSaveInqManageAnsr({
        inqId: item.inqId,
        ...(c.mode === 'edit' ? { ansrId: c.targetId } : {}),
        ...(c.mode === 'reply' ? { upAnsrId: c.targetId } : {}),
        content: INQ_ANSWER_HTML_PREFIX + text,
      })
      openToast({ message: '저장되었습니다.' })
      await Promise.all([handleSelectInqManageList(), handleSelectInqManageDetail(item.inqId)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '답변 저장 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  const onDeleteAnsr = async (a: InqAnsr) => {
    const item = selectedInq.value
    if (!item) return
    const kids = countInqDescendants(inqAnswers.value, a.ansrId)
    const confirmed = await openConfirm({
      title: a.depth === 1 ? '관리자 답변 삭제' : '댓글 삭제',
      message: `삭제하시겠습니까?${kids ? ` 하위 답글 ${kids}건도 함께 삭제됩니다.` : ''} 삭제한 내용은 복구할 수 없습니다.`,
      confirmText: '삭제',
    })
    if (!confirmed) return
    try {
      await fetchDeleteInqManageAnsr(item.inqId, a.ansrId)
      openToast({ message: '삭제되었습니다.' })
      await Promise.all([handleSelectInqManageList(), handleSelectInqManageDetail(item.inqId)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '삭제 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // 첨부파일 다운로드
  // ==============================
  const onDownloadInqManageFile = async (file: InqFile) => {
    try {
      const res = await fetchInqManageFileDownloadUrl(file.inqFileId)
      if (!handleDownloadByUrl(String(res.url ?? ''))) {
        openToast({ message: '파일을 찾을 수 없습니다.', type: 'error' })
      }
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '파일 다운로드 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  return {
    // 목록
    inqList,
    totalCount,
    totalPages,
    currentPage,
    searchKeyword,
    searchCatCd,
    searchStatusCd,
    isLoading,
    errorMessage,
    emptyTitle,
    listCatOptions,
    listStatusOptions,
    excelMenuItems,
    handleSelectInqManageOptions,
    handleSelectInqManageList,
    getInqManageOrderLabel,
    getStatusFlag,
    pageSize,
    ansrMaxDepth,
    onInqManageExcelSelect,
    // 상세
    isDetailOpen,
    selectedInq,
    inqFiles,
    orderedAnswers,
    composer,
    statusDraft,
    adminStatusOptions,
    hasFunc,
    onOpenInqManageDetail,
    onCloseInqManageDetail,
    onDeleteInqManage,
    onSaveInqManageStatus,
    onStartReply,
    onStartEditAnsr,
    onChangeComposerText,
    onCancelComposer,
    onSaveComposer,
    onDeleteAnsr,
    onDownloadInqManageFile,
    fetchInqManageFilePreview,
  }
}

import type { FileItem } from '~/types/repository'
import type { InqAnsr, InqComposer, InqFile, InqFormData, InqItem, InqRow } from '~/types/inq'
import { INQ_MENU_PATH, INQ_UPLOAD_ROOT } from '~/types/inq'
import { useInqApi } from '~/composables/inq/useInqApi'
import { useAgentApi } from '~/composables/agent/useAgentApi'
import { useFileStore } from '~/composables/com/useFileStore'
import { formatChatStoreFileNameBase } from '~/utils/global/dateUtil'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'
import {
  countInqDescendants,
  getInqErrorMessage,
  getInqOrderNo,
  orderInqAnswers,
  toInqOptions,
} from '~/utils/inq/inqUtil'

const {
  fetchSelectInqCodeInfo,
  fetchSelectInqList,
  fetchSelectInqDetail,
  fetchSaveInq,
  fetchDeleteInq,
  fetchSaveInqAnsr,
  fetchDeleteInqAnsr,
  fetchCreateInqFileUploadUrl,
  fetchInqFileDownloadUrl,
} = useInqApi()

/** 문의하기(/inq) 스토어 */
export const useInqStore = () => {
  const { canFunc } = usePermission()
  const { fetchAgentList } = useAgentApi()
  const { handleUploadByPresignedUrl, handleDownloadByUrl } = useFileStore()
  const { user } = useAuth()

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
  const agentCatCd = ref('')
  const pageSize = ref(0)
  const ansrMaxDepth = ref(0)
  const agentOptions = ref<{ label: string; value: string }[]>([])

  const isDetailOpen = ref(false)
  const selectedInq = ref<InqItem | null>(null)
  const inqFiles = ref<InqFile[]>([])
  const inqAnswers = ref<InqAnsr[]>([])
  const composer = ref<InqComposer | null>(null)

  const createDefaultForm = (): InqFormData => ({
    inqId: '',
    catCd: '',
    agentId: '',
    title: '',
    content: '',
    secretYn: 'N',
  })
  const isFormOpen = ref(false)
  const inqForm = ref<InqFormData>(createDefaultForm())
  /** 새로 첨부할 파일 */
  const formFiles = ref<File[]>([])
  /** 수정 중인 기존 첨부 */
  const attachedFiles = ref<InqFile[]>([])
  const removeFileIds = ref<string[]>([])

  // ==============================
  // 계산값
  // ==============================
  const userId = computed(() => String(user.value?.userId ?? '').trim())
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / (pageSize.value || 1))))
  const listCatOptions = computed(() => [{ label: '전체', value: '' }, ...catOptions.value])
  const listStatusOptions = computed(() => [{ label: '전체', value: '' }, ...statusOptions.value])
  const orderedAnswers = computed(() => orderInqAnswers(inqAnswers.value))
  const isAgentCat = computed(() => !!agentCatCd.value && inqForm.value.catCd === agentCatCd.value)
  const panelActionLabel = computed<'등록' | '수정'>(() => (inqForm.value.inqId ? '수정' : '등록'))
  const isSearching = computed(() => !!(searchKeyword.value.trim() || searchCatCd.value || searchStatusCd.value))
  const emptyTitle = computed(() => (isSearching.value ? '검색 결과가 없습니다.' : '등록된 문의 내역이 없습니다.'))
  const attachedFileItems = computed<FileItem[]>(() =>
    attachedFiles.value.map((f) => ({
      docFileId: f.inqFileId,
      fileName: f.fileNm,
      filePath: f.filePath,
      fileSize: String(f.fileSize ?? 0),
      fileType: String(f.fileType ?? ''),
    })),
  )

  /** 메뉴 기능 권한(등록·수정·삭제) */
  const hasFunc = computed(() => canFunc(INQ_MENU_PATH))
  const isOwner = computed(() => !!selectedInq.value && selectedInq.value.crtrId === userId.value)
  /** 비밀글이라 본문을 볼 수 없는 상태 */
  const isMasked = computed(() => selectedInq.value?.maskedYn === 'Y')
  /** 본인 글 + 관리자 답변 전에만 수정·삭제 */
  const canEditInq = computed(() => hasFunc.value && isOwner.value && selectedInq.value?.answerYn !== 'Y')
  const canReply = computed(() => hasFunc.value && !isMasked.value && isOwner.value)
  /** 본인이 쓴 답글만 수정·삭제 (관리자 답변은 제외) */
  const canEditAnsr = (a: InqAnsr) => hasFunc.value && !isMasked.value && a.depth > 1 && a.ansrUserId === userId.value

  // ==============================
  // 옵션 조회
  // ==============================
  const handleSelectInqOptions = async () => {
    try {
      const [info, agents] = await Promise.all([fetchSelectInqCodeInfo(), fetchAgentList()])
      catOptions.value = toInqOptions(info.catList)
      statusOptions.value = toInqOptions(info.statusList)
      statusFlagMap.value = Object.fromEntries(info.statusList.map((c) => [c.codeId, c.flag]))
      agentCatCd.value = info.agentCatCd ?? ''
      pageSize.value = info.pageSize
      ansrMaxDepth.value = info.ansrMaxDepth
      agentOptions.value = (agents.dataList ?? [])
        .filter((a) => a.useYn === 'Y')
        .map((a) => ({ label: a.agentNm, value: a.agentId }))
    } catch (error) {
      console.error(error)
      openToast({ message: '구분·상태 목록을 불러오지 못했습니다.', type: 'error' })
    }
  }

  // ==============================
  // 목록
  // ==============================
  const handleSelectInqList = async () => {
    errorMessage.value = ''
    isLoading.value = true
    try {
      const res = await fetchSelectInqList({
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

  /** 처리상태 코드 → 배지 구분값 */
  const getStatusFlag = (statusCd?: string | null) => statusFlagMap.value[statusCd ?? ''] ?? null

  const getInqOrderLabel = (row: InqRow) =>
    getInqOrderNo(inqList.value, row, totalCount.value, currentPage.value, pageSize.value)

  // ==============================
  // 상세
  // ==============================
  const handleSelectInqDetail = async (inqId: string) => {
    try {
      const res = await fetchSelectInqDetail(inqId)
      selectedInq.value = res.data
      inqFiles.value = res.files ?? []
      inqAnswers.value = res.answers ?? []
      composer.value = null
      isDetailOpen.value = true
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '문의사항 상세 조회 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  const onOpenInqDetail = async (row: Pick<InqRow, 'inqId'>) => {
    await handleSelectInqDetail(row.inqId)
  }

  const onCloseInqDetail = () => {
    isDetailOpen.value = false
    composer.value = null
  }

  // ==============================
  // 등록 / 수정 / 삭제
  // ==============================
  const resetFormState = () => {
    inqForm.value = createDefaultForm()
    formFiles.value = []
    attachedFiles.value = []
    removeFileIds.value = []
  }

  const onRegisterInq = () => {
    resetFormState()
    isFormOpen.value = true
  }

  const onEditInq = () => {
    const item = selectedInq.value
    if (!item || !canEditInq.value) return
    inqForm.value = {
      inqId: item.inqId,
      catCd: item.catCd,
      agentId: item.agentId ?? '',
      title: item.title,
      content: item.content ?? '',
      secretYn: item.secretYn,
    }
    formFiles.value = []
    attachedFiles.value = [...inqFiles.value]
    removeFileIds.value = []
    isDetailOpen.value = false
    isFormOpen.value = true
  }

  const onCloseInqForm = () => {
    const editingId = inqForm.value.inqId
    isFormOpen.value = false
    resetFormState()
    if (editingId) isDetailOpen.value = true
  }

  const onRemoveAttachedFile = (file: FileItem) => {
    removeFileIds.value.push(file.docFileId)
    attachedFiles.value = attachedFiles.value.filter((f) => f.inqFileId !== file.docFileId)
  }

  /** 새 첨부파일을 presign → PUT 으로 올리고 저장 요청용 메타를 만든다. 실패하면 null */
  const uploadInqFiles = async (files: File[]) => {
    const at = new Date()
    const metas = []
    for (const [idx, file] of files.entries()) {
      const ext = getChatAttachmentExtension(file.name)
      const storeName = `${formatChatStoreFileNameBase(at)}_${idx}${ext ? `.${ext}` : ''}`
      const presign = await fetchCreateInqFileUploadUrl({
        fileNm: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        filePath: `${INQ_UPLOAD_ROOT}/${userId.value}/${storeName}`,
      })
      if (!(await handleUploadByPresignedUrl(presign.uploadUrl, file))) return null
      metas.push({
        filePath: presign.filePath,
        fileNm: file.name,
        fileSize: file.size,
        fileType: ext || file.type || 'application/octet-stream',
      })
    }
    return metas
  }

  const onSaveInqForm = async (payload: InqFormData) => {
    const isEdit = Boolean(payload.inqId)
    try {
      const files = await uploadInqFiles(formFiles.value)
      if (!files) return
      const res = await fetchSaveInq({
        ...payload,
        agentId: isAgentCat.value ? payload.agentId : '',
        files,
        removeFileIds: removeFileIds.value,
      })
      isFormOpen.value = false
      resetFormState()
      openToast({ message: isEdit ? '문의사항을 수정했습니다.' : '문의사항을 등록했습니다.' })
      currentPage.value = isEdit ? currentPage.value : 1
      await Promise.all([handleSelectInqList(), handleSelectInqDetail(res.inqId)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '문의사항 저장 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  const onDeleteInq = async () => {
    const item = selectedInq.value
    if (!item || !canEditInq.value) return
    const confirmed = await openConfirm({
      title: '문의사항 삭제',
      message: `'${item.title}'을(를) 삭제하시겠습니까? 삭제한 내용은 복구할 수 없습니다.`,
      confirmText: '삭제',
    })
    if (!confirmed) return
    try {
      await fetchDeleteInq(item.inqId)
      isDetailOpen.value = false
      selectedInq.value = null
      openToast({ message: '문의사항을 삭제했습니다.' })
      await handleSelectInqList()
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '문의사항 삭제 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // 답글
  // ==============================
  const onStartReply = (a: InqAnsr) => {
    composer.value = { mode: 'reply', targetId: a.ansrId, text: '' }
  }

  const onStartEditAnsr = (a: InqAnsr) => {
    composer.value = { mode: 'edit', targetId: a.ansrId, text: a.content }
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
      await fetchSaveInqAnsr({
        inqId: item.inqId,
        ...(c.mode === 'edit' ? { ansrId: c.targetId } : { upAnsrId: c.targetId }),
        content: text,
      })
      openToast({ message: '저장되었습니다.' })
      await Promise.all([handleSelectInqList(), handleSelectInqDetail(item.inqId)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '답글 저장 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  const onDeleteAnsr = async (a: InqAnsr) => {
    const item = selectedInq.value
    if (!item) return
    const kids = countInqDescendants(inqAnswers.value, a.ansrId)
    const confirmed = await openConfirm({
      title: '답글 삭제',
      message: `삭제하시겠습니까?${kids ? ` 하위 답글 ${kids}건도 함께 삭제됩니다.` : ''} 삭제한 내용은 복구할 수 없습니다.`,
      confirmText: '삭제',
    })
    if (!confirmed) return
    try {
      await fetchDeleteInqAnsr(item.inqId, a.ansrId)
      openToast({ message: '삭제되었습니다.' })
      await Promise.all([handleSelectInqList(), handleSelectInqDetail(item.inqId)])
    } catch (error) {
      openToast({ message: getInqErrorMessage(error, '삭제 중 오류가 발생했습니다.'), type: 'error' })
      console.error(error)
    }
  }

  // ==============================
  // 첨부파일 다운로드
  // ==============================
  const onDownloadInqFile = async (file: InqFile) => {
    try {
      const res = await fetchInqFileDownloadUrl(file.inqFileId)
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
    catOptions,
    listCatOptions,
    listStatusOptions,
    agentOptions,
    hasFunc,
    handleSelectInqOptions,
    handleSelectInqList,
    getInqOrderLabel,
    getStatusFlag,
    pageSize,
    ansrMaxDepth,
    // 상세
    isDetailOpen,
    selectedInq,
    inqFiles,
    orderedAnswers,
    composer,
    isMasked,
    canEditInq,
    canReply,
    canEditAnsr,
    onOpenInqDetail,
    onCloseInqDetail,
    onDeleteInq,
    onStartReply,
    onStartEditAnsr,
    onChangeComposerText,
    onCancelComposer,
    onSaveComposer,
    onDeleteAnsr,
    onDownloadInqFile,
    // 등록·수정
    isFormOpen,
    inqForm,
    formFiles,
    attachedFileItems,
    isAgentCat,
    panelActionLabel,
    onRegisterInq,
    onEditInq,
    onCloseInqForm,
    onSaveInqForm,
    onRemoveAttachedFile,
  }
}

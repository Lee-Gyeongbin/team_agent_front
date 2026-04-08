import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { CodeItem } from '~/types/codes'
import type {
  DocRepositoryDetailResponse,
  Document,
  DocumentDeleteItem,
  DocumentSaveFileItem,
  DocumentSavePayload,
  DocExistCheckItem,
  FileItem,
  UrlItem,
} from '~/types/repository'
import type { TableColumn } from '~/types/table'
const { handleUploadFile, onDownloadFile, handleDeleteNcpFile, fileError } = useFileStore()
const {
  fetchSelectDocExistCnt,
  fetchSelectDocumentExistCnt,
  fetchDocumentList,
  fetchSelectDocRepositoryDetail,
  fetchSaveDocument,
  fetchDeleteDocument,
  fetchUrlList,
  fetchSaveUrl,
  fetchDeleteUrl,
  fetchToggleUrlStatus,
} = useRepositoryApi()
const isLoading = ref(false)

const secLvlOptions = ref<{ label: string; value: string }[]>([])
// ===== 문서 상태 =====
const documentList = ref<Document[]>([])
const docTotalCount = ref(0)
const docSearchKeyword = ref('')
const docStatusFilter = ref('')
const docSelectedCategoryId = ref('')
const docCurrentPage = ref(1)
const docPageSize = 10

// 검색·필터
const statusFilterOptions = [
  { label: '전체 상태', value: '' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
]

// ===== 테이블 =====
const tableColumns: TableColumn[] = [
  { key: 'select', label: '', width: '48px', align: 'center', headerAlign: 'center' },
  {
    key: 'docTitle',
    label: '문서명',
    width: 'auto',
    align: 'left',
    headerAlign: 'left',
    sortable: true,
    sortType: 'string',
  },
  { key: 'categoryName', label: '카테고리', width: '130px', align: 'left', headerAlign: 'left' },
  {
    key: 'fileSize',
    label: '파일 총 크기',
    width: '110px',
    align: 'center',
    headerAlign: 'center',
    sortable: true,
    sortType: 'number',
  },
  { key: 'fileCnt', label: '파일 개수', width: '80px', align: 'center', headerAlign: 'center' },
  {
    key: 'createDt',
    label: '등록일',
    width: '105px',
    align: 'center',
    headerAlign: 'center',
    sortable: true,
    sortType: 'date',
  },
  { key: 'useYn', label: '상태', width: '70px', align: 'center', headerAlign: 'center' },
  { key: 'dsDocCnt', label: 'RAG 사용', width: '85px', align: 'center', headerAlign: 'center' },
]

/** useYn 표시 (Y/N 또는 레거시 한글) */
const formatUseYnLabel = (value: string) => {
  if (value === 'Y') return '활성'
  if (value === 'N') return '비활성'
  return value
}

/** 목록/상세 응답에서 DOC_FILE_ID_LIST(문자열·배열) → docFileId[] */
const parseDocFileIdListFromRow = (row: Record<string, unknown>): string[] => {
  const raw = row.docFileIdList ?? row.DOC_FILE_ID_LIST ?? row.doc_file_id_list
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

/** 첨부 파일별 viewFile API 호출용 — docFileIdList 우선, 없으면 docFileId·attachedFileList (중복 제거) */
const resolveAllDocFileIds = (row: Document): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (id: unknown) => {
    const s = String(id ?? '').trim()
    if (!s || seen.has(s)) return
    seen.add(s)
    out.push(s)
  }
  if (Array.isArray(row.docFileIdList) && row.docFileIdList.length > 0) {
    for (const id of row.docFileIdList) add(id)
    return out
  }
  add(row.docFileId)
  if (Array.isArray(row.attachedFileList)) {
    for (const f of row.attachedFileList) add(f?.docFileId)
  }
  return out
}

const normalizeDocumentListRow = (doc: Document): Document => {
  const extra = doc as Document & Record<string, unknown>
  const ids = parseDocFileIdListFromRow(extra)
  const mergedDocFileId = String(doc.docFileId ?? '').trim() || (ids[0] ?? '')
  return {
    ...doc,
    docFileIdList: ids.length > 0 ? ids : doc.docFileIdList,
    docFileId: mergedDocFileId || doc.docFileId,
  }
}

/** 상세 API 평면 응답 → 패널용 Document 일부 */
const mapDocDetailResponseToInitial = (
  res: DocRepositoryDetailResponse,
  fileList: FileItem[] = [],
): Partial<Document> => {
  const firstFile = fileList[0]
  return {
    docId: String(res.docId ?? ''),
    docTitle: String(res.docTitle ?? ''),
    categoryId: String(res.categoryId ?? ''),
    categoryName: String(res.categoryName ?? ''),
    author: String(res.author ?? ''),
    secLvl: String(res.secLvl ?? ''),
    content: String(res.content ?? ''),
    docFileId: String(firstFile?.docFileId ?? ''),
    fileName: String(firstFile?.fileName ?? ''),
    filePath: String(firstFile?.filePath ?? ''),
    fileSize: String(firstFile?.fileSize ?? ''),
    fileType: String(firstFile?.fileType ?? ''),
    keywords: String(res.keywords ?? ''),
    refUrl: String(res.refUrl ?? ''),
    useYn: String(res.useYn ?? ''),
    dsDocCnt: String(res.dsDocCnt ?? ''),
    createDt: String(res.createDt ?? ''),
    files: [],
    attachedFileList: fileList,
  }
}

// ===== 선택 =====
const selectedIds = ref<string[]>([])
const isAllSelected = computed(
  () => documentList.value.length > 0 && selectedIds.value.length === documentList.value.length,
)
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = documentList.value.map((r) => r.docId)
  }
}
const toggleSelectRow = (id: string, checked: boolean) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((x) => x !== id)
  }
}

// ===== URL 상태 =====
const urlList = ref<UrlItem[]>([])
const urlTotalCount = ref(0)
const urlSearchKeyword = ref('')
const urlStatusFilter = ref('all')
const urlCategoryFilter = ref('all')
const urlCurrentPage = ref(1)
const urlPageSize = 10

// ===== 문서 액션 =====
const handleSelectDocumentList = async () => {
  isLoading.value = true
  try {
    const findContent = docSearchKeyword.value || undefined
    const categoryId = docSelectedCategoryId.value || undefined
    const useYn = docStatusFilter.value
    openLoading({ text: '문서 목록을 불러오는 중...' })
    const res = await fetchDocumentList(findContent, categoryId, useYn, docCurrentPage.value, docPageSize)
    documentList.value = res.dataList.map((doc) => {
      const normalized = normalizeDocumentListRow(doc)
      // 파일 사이즈 포맷팅 (목록에 콤마 포함 숫자 문자열 대비)
      const sizeRaw = String(normalized.fileSize ?? '').replace(/,/g, '')
      normalized.fileSize = formatFileSize(Number(sizeRaw) || 0)
      return normalized
    })
    docTotalCount.value = res.totalCnt
  } finally {
    isLoading.value = false
    closeLoading()
  }
}

/** 업로드된 파일마다 NCP 업로드 후 DB 저장용 file 배열 생성 */
const buildUploadedFileMetaList = async (data: Partial<Document>): Promise<DocumentSaveFileItem[] | null> => {
  const files = Array.isArray(data.files) ? data.files.filter((f): f is File => f instanceof File) : []
  const fileMeta: DocumentSaveFileItem[] = []
  for (const file of files) {
    const uploadedFilePath = await handleUploadFile({
      file,
      docTitle: String(data.docTitle ?? ''),
      categoryId: String(data.categoryId ?? ''),
      secLvl: String(data.secLvl ?? ''),
      keywords: String(data.keywords ?? ''),
    })
    if (!uploadedFilePath) {
      return null
    }
    fileMeta.push({
      fileName: file.name,
      filePath: uploadedFilePath,
      fileSize: String(file.size),
      fileType: file.type,
    })
  }
  return fileMeta
}

/** 문서 저장 (DB) — file 은 업로드 완료 메타 배열 */
const performDocumentSave = async (data: Partial<Document> & { deleteFileIds?: string[] }): Promise<boolean> => {
  const fileMeta = await buildUploadedFileMetaList(data)
  if (fileMeta === null) {
    openToast({ message: '파일 업로드에 실패했습니다.', type: 'error' })
    return false
  }
  const payload: DocumentSavePayload = {
    docTitle: String(data.docTitle ?? ''),
    categoryId: String(data.categoryId ?? ''),
    author: String(data.author ?? ''),
    secLvl: String(data.secLvl ?? ''),
    content: String(data.content ?? ''),
    keywords: String(data.keywords ?? ''),
    refUrl: String(data.refUrl ?? ''),
    file: fileMeta,
  }
  const deleteFileIds = Array.isArray(data.deleteFileIds)
    ? data.deleteFileIds.map((id) => String(id ?? '').trim()).filter(Boolean)
    : []
  if (deleteFileIds.length > 0) payload.deleteFileIds = deleteFileIds
  const id = String(data.docId ?? '').trim()
  if (id) payload.docId = id
  openLoading({ text: '문서를 저장하는 중...' })
  let res: { successYn: boolean }
  try {
    res = await fetchSaveDocument(payload)
  } finally {
    closeLoading()
  }
  if (res.successYn) {
    openToast({ message: `'${data.docTitle}' 문서가 등록되었습니다.` })
    await handleSelectDocumentList()
    return true
  } else {
    openToast({ message: '문서 등록에 실패했습니다.', type: 'error' })
    return false
  }
}

// 문서 저장
const handleSaveDocument = async (data: Partial<Document> & { deleteFileIds?: string[] }): Promise<boolean> => {
  const files = Array.isArray(data.files) ? data.files.filter((f): f is File => f instanceof File) : []
  const categoryId = String(data.categoryId ?? '')
  const docIdList: DocExistCheckItem[] = files.map((file) => {
    return {
      categoryId,
      fileName: file.name,
      fileType: file.type,
    }
  })

  let existCnt = 0
  if (docIdList.length > 0) {
    openLoading({ text: '문서 중복 여부를 확인하는 중...' })
    try {
      const exists = await fetchSelectDocExistCnt(docIdList)
      existCnt = exists.data
    } finally {
      closeLoading()
    }
  }

  const docTitle = String(data.docTitle ?? '').trim()
  const targetName = docTitle ? `'${docTitle}'` : '이 문서'
  const isEditMode = Boolean(String(data.docId ?? '').trim())
  const title = isEditMode ? '문서 수정' : '문서 등록'
  const message =
    existCnt > 0
      ? `${targetName} 문서가 이미 존재합니다. 덮어씌우시겠습니까?`
      : `${targetName} 문서를 ${isEditMode ? '수정' : '등록'}하시겠습니까?`

  const confirmed = await openConfirm({
    title,
    message,
  })
  if (!confirmed) return false

  try {
    return await performDocumentSave(data)
  } catch {
    openToast({
      message: '문서 저장 실패',
      type: 'error',
    })
    return false
  }
}

// 문서 삭제 (NCP 객체 삭제 후 DB 행 삭제)
const handleDeleteDocument = async (docIdList: DocumentDeleteItem[]) => {
  const valid = docIdList.filter((item) => String(item.docId ?? '').trim() !== '')
  if (valid.length === 0) return
  const ids = valid.map((item) => item.docId)
  const ncpOk = await handleDeleteNcpFile(ids)
  if (!ncpOk) {
    openToast({ message: fileError.value || '저장소에서 파일 삭제에 실패했습니다.', type: 'error' })
    return
  }
  openLoading({ text: '문서를 삭제하는 중...' })
  try {
    await fetchDeleteDocument(valid)
  } finally {
    closeLoading()
  }
  await handleSelectDocumentList()
}

// ===== URL 액션 =====
const handleSelectUrlList = async () => {
  openLoading({ text: 'URL 목록을 불러오는 중...' })
  let res: { list: UrlItem[]; total: number }
  try {
    res = await fetchUrlList({
      keyword: urlSearchKeyword.value || undefined,
      status: urlStatusFilter.value,
      category: urlCategoryFilter.value,
      page: urlCurrentPage.value,
      pageSize: urlPageSize,
    })
    urlList.value = res.list
    urlTotalCount.value = res.total
  } finally {
    closeLoading()
  }
}

const handleSaveUrl = async (data: Partial<UrlItem>) => {
  const urlName = String(data.urlName ?? '').trim()
  const targetName = urlName ? `'${urlName}'` : '이 URL'
  const confirmed = await openConfirm({
    title: 'URL 저장',
    message: `${targetName}을(를) 저장하시겠습니까?`,
  })
  if (!confirmed) return false

  openLoading({ text: 'URL을 저장하는 중...' })
  try {
    await fetchSaveUrl(data)
  } finally {
    closeLoading()
  }
  await handleSelectUrlList()
  return true
}

const handleDeleteUrl = async (ids: string[]) => {
  const validIds = (Array.isArray(ids) ? ids : []).map((id) => String(id ?? '').trim()).filter(Boolean)
  if (validIds.length === 0) return false

  const confirmed = await openConfirm({
    title: 'URL 삭제',
    message: `선택한 ${validIds.length}개 URL을 삭제하시겠습니까?`,
  })
  if (!confirmed) return false

  openLoading({ text: 'URL을 삭제하는 중...' })
  try {
    const res = await fetchDeleteUrl(validIds)
    const affected = typeof res.data === 'number' ? res.data : 0
    if (affected > 0) {
      openToast({ message: '문서가 삭제되었습니다.', type: 'success' })
    } else {
      openToast({ message: '문서 삭제에 실패했습니다.', type: 'error' })
    }
  } finally {
    closeLoading()
  }
  await handleSelectUrlList()
  return true
}

const handleToggleUrlStatus = async (id: string, active: boolean) => {
  const nextLabel = active ? '활성화' : '비활성화'
  const confirmed = await openConfirm({
    title: 'URL 상태 변경',
    message: `URL의 상태를 ${nextLabel}로 변경하시겠습니까?`,
  })
  if (!confirmed) return false

  openLoading({ text: 'URL 상태를 변경하는 중...' })
  try {
    await fetchToggleUrlStatus(id, active)
  } finally {
    closeLoading()
  }
  await handleSelectUrlList()
  return true
}

/** 문서 미리보기 모달 (FilePreviewModal) — PDF.js 뷰어 */
const isFilePreviewOpen = ref(false)
const filePreviewDocId = ref('')
const filePreviewDocFileId = ref('')
const filePreviewTitle = ref('')
const filePreviewDocFileOptions = ref<{ label: string; value: string }[]>([])

/** 미리보기 셀렉트 라벨 — 상세 fileList 우선, 없으면 목록 행 fileName(단일)·attachedFileList */
const buildFilePreviewOptions = (fileIds: string[], row: Document, fileList: FileItem[]) => {
  const nameById = new Map<string, string>()
  for (const f of fileList) {
    const id = String(f.docFileId ?? '').trim()
    if (id) nameById.set(id, String(f.fileName ?? '').trim())
  }
  return fileIds.map((id, idx) => {
    const fromDetail = nameById.get(id)
    const fromAttached = row.attachedFileList?.find((f) => f.docFileId === id)?.fileName?.trim()
    const fromListRow = fileIds.length === 1 && idx === 0 ? String(row.fileName ?? '').trim() : ''
    const label = fromDetail || fromAttached || fromListRow || `파일 ${idx + 1}`
    return { label, value: id }
  })
}

const handleFileView = async (row: Document) => {
  const docId = row.docId
  const fileIds = resolveAllDocFileIds(row)
  if (fileIds.length === 0) {
    openToast({ message: '미리보기할 파일이 없습니다.', type: 'warning' })
    return
  }

  let fileList: FileItem[] = []
  try {
    openLoading({ text: '문서 상세 정보를 불러오는 중...' })
    const res = await fetchSelectDocRepositoryDetail(docId)
    fileList = res.fileList ?? []
  } catch {
    // 상세 조회 실패 시 목록 행 메타만으로 라벨 구성
  } finally {
    closeLoading()
  }

  filePreviewDocId.value = docId
  filePreviewDocFileId.value = fileIds[0]
  filePreviewTitle.value = row.docTitle?.trim() || '파일 미리보기'
  filePreviewDocFileOptions.value = buildFilePreviewOptions(fileIds, row, fileList)
  isFilePreviewOpen.value = true
}

/** 모달 @close 시 상태 정리 (닫힘은 v-model:is-open으로 반영됨) */
const onCloseFilePreview = () => {
  filePreviewDocFileOptions.value = []
  filePreviewDocId.value = ''
  filePreviewDocFileId.value = ''
  filePreviewTitle.value = ''
}

const onSearch = () => {
  // 검색 시 1페이지로 이동 후 재조회
  if (docCurrentPage.value !== 1) docCurrentPage.value = 1
  handleSelectDocumentList()
}

// ===== 문서 등록 패널 =====
const isDocRegisterOpen = ref(false)
/** 행 클릭·상세 조회 후 패널에 넘길 초기값 (신규 등록은 null) */
const docRegisterInitialData = ref<Partial<Document> | null>(null)
/** 테이블에서 선택된 행 강조용 docId */
const docTableHighlightedDocId = ref<string | null>(null)

const onRegisterDocument = async () => {
  docRegisterInitialData.value = null
  docTableHighlightedDocId.value = null
  await handleSelectCodeOptions()
  isDocRegisterOpen.value = true
}

const handleSelectCodeOptions = async () => {
  const secLvlCodes = await getCodes('DC000001')
  // 코드 옵션 세팅
  secLvlOptions.value = mapCodeOptions(secLvlCodes)
}

/** 코드 옵션 매핑 */
const mapCodeOptions = (codes: CodeItem[]) => [
  { label: '선택', value: '' },
  ...codes.map((item: CodeItem) => ({
    label: item.codeNm,
    value: item.codeId,
  })),
]

/** 테이블 행 클릭 — 상세 조회 후 등록 패널 오픈 */
const onDocumentTableRowClick = async (row: Record<string, unknown>) => {
  const docId = String(row.docId ?? '').trim()
  if (!docId) return
  isLoading.value = true
  try {
    await handleSelectCodeOptions()
    openLoading({ text: '문서 상세 정보를 불러오는 중...' })
    const res = await fetchSelectDocRepositoryDetail(docId)
    docRegisterInitialData.value = mapDocDetailResponseToInitial(res.data, res.fileList ?? [])
  } catch {
    const fromList = documentList.value.find((d) => d.docId === docId)
    docRegisterInitialData.value = fromList ? { ...fromList } : { ...(row as unknown as Document) }
  } finally {
    isLoading.value = false
    closeLoading()
    docTableHighlightedDocId.value = docId
    isDocRegisterOpen.value = true
  }
}

const onCloseDocRegister = () => {
  isDocRegisterOpen.value = false
  docRegisterInitialData.value = null
  docTableHighlightedDocId.value = null
}

// 문서 저장 버튼 클릭 시
const onSaveDocument = async (data: Record<string, unknown>): Promise<boolean> => {
  const title = String(data.docTitle ?? '')
  const docId = String(data.docId ?? '').trim()
  /** 좌측 트리에서 선택한 카테고리 우선 — useCategoryStore.onCategorySelect와 동일 ref */
  const categoryId = docSelectedCategoryId.value.trim() || String(data.categoryId ?? '')
  try {
    // 수정 모드(docId 존재)에서는 중복 체크를 스킵
    if (!docId) {
      const res = await fetchSelectDocumentExistCnt(categoryId, title)
      const existCnt = res.data
      if (existCnt > 0) {
        openAlert({ title: '알림', message: '같은 카테고리에 같은 제목의 문서가 존재합니다.' })
        return false
      }
    }

    return await handleSaveDocument({
      docId: docId ? docId : undefined,
      docTitle: title,
      categoryId,
      author: String(data.author ?? ''),
      secLvl: String(data.secLvl ?? ''),
      content: String(data.content ?? ''),
      files: data.files as File[],
      keywords: String(data.keywords ?? ''),
      refUrl: String(data.refUrl ?? ''),
      deleteFileIds: Array.isArray(data.deleteFileIds)
        ? (data.deleteFileIds as unknown[])
            .map(String)
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined,
    })
  } catch (error) {
    openToast({
      message: error instanceof Error ? error.message : '문서 저장 처리 중 오류가 발생했습니다.',
      type: 'error',
    })
    return false
  }
}

const onBatchDownload = async () => {
  if (selectedIds.value.length === 0) {
    openAlert({ title: '알림', message: '다운로드할 문서를 선택해주세요.' })
    return
  }
  // window.open 연속 호출은 브라우저 팝업 차단으로 대부분 첫 번째만 열림 → <a download> 트리거(onDownloadFile) 사용
  const ids = [...selectedIds.value]
  for (let i = 0; i < ids.length; i++) {
    const docId = ids[i]
    await onDownloadFile(docId)
    if (i < ids.length - 1) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }
}

const onBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    openAlert({ title: '알림', message: '삭제할 문서를 선택해주세요.' })
    return
  }
  const hasRagUsingDoc = selectedIds.value.some((docId) => {
    const row = documentList.value.find((d) => d.docId === docId)
    return !!row && Number(row.dsDocCnt) > 0
  })

  if (hasRagUsingDoc) {
    openAlert({ title: '알림', message: '선택한 문서 중 RAG 사용 중인 문서가 포함되어 삭제할 수 없습니다.' })
    return
  }

  const confirmed = await openConfirm({
    title: '삭제',
    message: `선택한 ${selectedIds.value.length}개 문서를 삭제하시겠습니까?`,
  })

  if (confirmed) {
    await handleDeleteDocument(selectedIds.value.map((docId) => ({ docId })))
    selectedIds.value = []
  }
}

/** 문서 행: 미리보기·다운로드만 (삭제는 체크 선택 후 `onBatchDelete`) */
const onRowActionSelect = async (value: string, row: Document) => {
  if (value === 'preview') {
    await handleFileView(row)
  } else if (value === 'download') {
    const docId = row.docId ?? ''
    await onDownloadFile(docId)
  }
}

// 문서 아이콘
const getDocIconClass = (fileType: string) => {
  if (fileType === 'pdf') return 'doc-icon-pdf'
  if (fileType === 'txt') return 'doc-icon-txt'
  if (fileType === 'doc') return 'doc-icon-doc'
  return 'doc-icon-default'
}
const getDocIconName = (fileType: string) => {
  if (fileType === 'pdf') return 'icon-file-pdf'
  if (fileType === 'txt') return 'icon-file-txt'
  if (fileType === 'doc') return 'icon-file-doc'
  return 'icon-document'
}
export const useRepositoryStore = () => {
  return {
    isLoading,
    // 문서
    documentList,
    docTotalCount,
    docSearchKeyword,
    docStatusFilter,
    docSelectedCategoryId,
    docCurrentPage,
    docPageSize,
    tableColumns,
    formatUseYnLabel,
    selectedIds,
    isAllSelected,
    toggleSelectAll,
    toggleSelectRow,
    handleSelectDocumentList,
    onSaveDocument,
    onBatchDownload,
    onBatchDelete,
    onRowActionSelect,
    // URL
    urlList,
    urlTotalCount,
    urlSearchKeyword,
    urlStatusFilter,
    urlCategoryFilter,
    urlCurrentPage,
    urlPageSize,
    handleSelectUrlList,
    handleSaveUrl,
    handleDeleteUrl,
    handleToggleUrlStatus,
    handleFileView,
    isFilePreviewOpen,
    filePreviewDocId,
    filePreviewDocFileId,
    filePreviewTitle,
    filePreviewDocFileOptions,
    onCloseFilePreview,
    onSearch,
    onRegisterDocument,
    onDocumentTableRowClick,
    onCloseDocRegister,
    docRegisterInitialData,
    docTableHighlightedDocId,
    getDocIconClass,
    getDocIconName,
    isDocRegisterOpen,
    statusFilterOptions,
    secLvlOptions,
  }
}

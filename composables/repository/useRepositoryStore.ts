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
const { handleViewFileUrl, handleUploadFile, onDownloadFile, handleDeleteNcpFile, fileError } = useFileStore()
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
  { key: 'docTitle', label: '문서제목', width: 'auto', align: 'left', headerAlign: 'left' },
  { key: 'categoryName', label: '카테고리', width: '200px', align: 'left', headerAlign: 'left' },
  { key: 'fileSize', label: '파일크기', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'createDt', label: '등록일', width: '120px', align: 'center', headerAlign: 'center' },
  { key: 'useYn', label: '상태', width: '80px', align: 'center', headerAlign: 'center' },
  { key: 'dsDocCnt', label: 'RAG 사용', width: '100px', align: 'center', headerAlign: 'center' },
  { key: 'actions', label: '', width: '56px', align: 'center', headerAlign: 'center' },
]

// 정렬 (프론트 정렬)
type SortKey = keyof Pick<Document, 'docTitle' | 'fileSize' | 'createDt'>
const sortKey = ref<SortKey | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')
const onSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedDocumentList = computed(() => {
  const list = [...documentList.value]
  const key = sortKey.value
  if (!key) return list
  const dir = sortOrder.value === 'asc' ? 1 : -1
  return list.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    return dir * (va === vb ? 0 : va < vb ? -1 : 1)
  })
})

/** useYn 표시 (Y/N 또는 레거시 한글) */
const formatUseYnLabel = (value: string) => {
  if (value === 'Y') return '활성'
  if (value === 'N') return '비활성'
  return value
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

const rowActionItems = [
  { label: '미리보기', value: 'preview', icon: 'icon-view' },
  { label: '다운로드', value: 'download', icon: 'icon-download' },
  { label: '삭제', value: 'delete', icon: 'icon-trashcan', color: 'danger' as const },
]

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
    const res = await fetchDocumentList(findContent, categoryId, useYn, docCurrentPage.value, docPageSize)
    documentList.value = res.dataList
    documentList.value.forEach((doc) => {
      // 파일 사이즈 포맷팅
      doc.fileSize = formatFileSize(Number(doc.fileSize))
    })
    docTotalCount.value = res.totalCnt
  } finally {
    isLoading.value = false
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
const performDocumentSave = async (data: Partial<Document>): Promise<boolean> => {
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
  const id = String(data.docId ?? '').trim()
  if (id) payload.docId = id
  const res = await fetchSaveDocument(payload)
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
const handleSaveDocument = async (data: Partial<Document>): Promise<boolean> => {
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
    const exists = await fetchSelectDocExistCnt(docIdList)
    existCnt = exists.data
  }

  if (existCnt > 0) {
    const ok = await openConfirm({
      message: '이미 존재하는 문서입니다. 덮어씌우시겠습니까?',
    })
    if (!ok) return false
  }

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
  await fetchDeleteDocument(valid)
  await handleSelectDocumentList()
}

// ===== URL 액션 =====
const handleSelectUrlList = async () => {
  const res = await fetchUrlList({
    keyword: urlSearchKeyword.value || undefined,
    status: urlStatusFilter.value,
    category: urlCategoryFilter.value,
    page: urlCurrentPage.value,
    pageSize: urlPageSize,
  })
  urlList.value = res.list
  urlTotalCount.value = res.total
}

const handleSaveUrl = async (data: Partial<UrlItem>) => {
  await fetchSaveUrl(data)
  await handleSelectUrlList()
}

const handleDeleteUrl = async (ids: string[]) => {
  const res = await fetchDeleteUrl(ids)
  const affected = typeof res.data === 'number' ? res.data : 0
  if (affected > 0) {
    openToast({ message: '문서가 삭제되었습니다.', type: 'success' })
  } else {
    openToast({ message: '문서 삭제에 실패했습니다.', type: 'error' })
  }
  await handleSelectUrlList()
}

const handleToggleUrlStatus = async (id: string, active: boolean) => {
  await fetchToggleUrlStatus(id, active)
  await handleSelectUrlList()
}

const handleFileView = async (row: Document) => {
  const docId = row.docId
  const docFileId = String(row.docFileId ?? row.attachedFileList?.[0]?.docFileId ?? '').trim()
  if (!docFileId) {
    openToast({ message: '미리보기할 파일이 없습니다.', type: 'warning' })
    return
  }
  const url = await handleViewFileUrl(docId, docFileId)
  if (!url) return
  window.open(url, '_blank')
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
    const res = await fetchSelectDocRepositoryDetail(docId)
    docRegisterInitialData.value = mapDocDetailResponseToInitial(res.data, res.fileList ?? [])
  } catch {
    const fromList = documentList.value.find((d) => d.docId === docId)
    docRegisterInitialData.value = fromList ? { ...fromList } : { ...(row as unknown as Document) }
  } finally {
    isLoading.value = false
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
  isLoading.value = true
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
    })
  } catch (error) {
    openToast({
      message: error instanceof Error ? error.message : '문서 저장 처리 중 오류가 발생했습니다.',
      type: 'error',
    })
    return false
  } finally {
    isLoading.value = false
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
    const row = documentList.value.find((d) => d.docId === docId)
    const docFileId = String(row?.docFileId ?? '').trim()
    await onDownloadFile(docId, docFileId)
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
  const confirmed = await openConfirm({
    title: '일괄 삭제',
    message: `선택한 ${selectedIds.value.length}개 문서를 삭제하시겠습니까?`,
  })
  if (confirmed) {
    await handleDeleteDocument(selectedIds.value.map((docId) => ({ docId })))
    selectedIds.value = []
  }
}

const onRowActionSelect = async (value: string, row: Document) => {
  if (value === 'delete') {
    if (Number(row.dsDocCnt) > 0) {
      openAlert({ title: '알림', message: 'RAG 사용 중인 문서는 삭제할 수 없습니다.' })
      return
    }
    const confirmed = await openConfirm({
      title: '문서 삭제',
      message: `'${row.docTitle}'을(를) 삭제하시겠습니까?`,
    })
    if (confirmed) {
      await handleDeleteDocument([{ docId: row.docId }])
      selectedIds.value = selectedIds.value.filter((id) => id !== row.docId)
    }
  } else if (value === 'preview') {
    await handleFileView(row)
  } else if (value === 'download') {
    const docId = row.docId ?? ''
    const docFileId = String(row.docFileId ?? row.attachedFileList?.[0]?.docFileId ?? '').trim()
    await onDownloadFile(docId, docFileId)
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
    onSort,
    sortedDocumentList,
    formatUseYnLabel,
    rowActionItems,
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

import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { Document, UrlItem } from '~/types/repository'
import type { TableColumn } from '~/types/table'
const { handleViewFileUrl, handleUploadFile } = useFileStore()
const {
  fetchDocumentList,
  fetchSaveDocument,
  fetchDeleteDocument,
  fetchUrlList,
  fetchSaveUrl,
  fetchDeleteUrl,
  fetchToggleUrlStatus,
} = useRepositoryApi()

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
  { key: 'docTitle', label: '문서명', width: 'auto', align: 'left', headerAlign: 'left' },
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
  const findContent = docSearchKeyword.value || undefined
  const categoryId = docSelectedCategoryId.value || undefined
  const useYn = docStatusFilter.value
  const res = await fetchDocumentList(findContent, categoryId, useYn)
  documentList.value = res.dataList
  docTotalCount.value = res.totalCount
}

// 문서 저장
const handleSaveDocument = async (data: Partial<Document>) => {
  const files = Array.isArray(data.files) ? data.files.filter((file): file is File => file instanceof File) : []
  let fileMeta: Partial<Document> = {}

  if (files.length > 0) {
    const file = files[0]
    // NCP에 파일 업로드
    const uploadedFilePath = await handleUploadFile({
      file,
      docTitle: String(data.docTitle ?? ''),
      categoryId: String(data.categoryId ?? ''),
      secLvl: String(data.secLvl ?? ''),
      keywords: String(data.keywords ?? ''),
    })

    if (!uploadedFilePath) {
      openToast({ message: '파일 업로드에 실패했습니다.', type: 'error' })
      return
    }

    fileMeta = {
      fileName: file.name,
      filePath: uploadedFilePath,
      fileSize: String(file.size),
      fileType: file.type || 'application/octet-stream',
    }
  }

  // DB에 저장
  const res = await fetchSaveDocument({
    ...data,
    ...fileMeta,
  })
  if (res.successYn) {
    openToast({ message: `'${data.docTitle}' 문서가 등록되었습니다.` })
  } else {
    openToast({ message: '문서 등록에 실패했습니다.', type: 'error' })
  }
  await handleSelectDocumentList()
}

// 문서 삭제
const handleDeleteDocument = async (id: string) => {
  await fetchDeleteDocument(id)
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
  const url = await handleViewFileUrl(docId)
  if (!url) return
  window.open(url, '_blank')
}

const onSearch = () => {
  // docCurrentPage watch가 handleSelectDocumentList를 호출하므로, 페이지가 1이 아닐 때만 변경
  if (docCurrentPage.value !== 1) {
    docCurrentPage.value = 1 // watch에서 재조회
  } else {
    handleSelectDocumentList()
  }
}

// ===== 문서 등록 패널 =====
const isDocRegisterOpen = ref(false)
const onRegisterDocument = () => {
  isDocRegisterOpen.value = true
}
const onSaveDocument = async (data: Record<string, unknown>) => {
  const title = String(data.docTitle ?? '')
  await handleSaveDocument({
    docTitle: title,
    categoryId: String(data.categoryId ?? ''),
    author: String(data.author ?? ''),
    secLvl: String(data.secLvl ?? ''),
    content: String(data.content ?? ''),
    files: data.files as File[],
    keywords: String(data.keywords ?? ''),
    refUrl: String(data.refUrl ?? ''),
  })
  openToast({ message: `'${title}' 문서가 등록되었습니다.` })
}

const onBatchDownload = () => {
  if (selectedIds.value.length === 0) {
    openAlert({ title: '알림', message: '다운로드할 문서를 선택해주세요.' })
    return
  }
  openAlert({
    title: '일괄 다운로드',
    message: `${selectedIds.value.length}개 문서 다운로드 기능은 추후 구현 예정입니다.`,
  })
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
    await Promise.all(selectedIds.value.map((id) => handleDeleteDocument(id)))
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
      await handleDeleteDocument(row.docId)
      selectedIds.value = selectedIds.value.filter((id) => id !== row.docId)
    }
  } else if (value === 'preview') {
    await handleFileView(row)
  } else if (value === 'download') {
    openAlert({ title: '다운로드', message: '다운로드 기능은 추후 구현 예정입니다.' })
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
// 페이지 변경 시 재조회
watch(docCurrentPage, () => handleSelectDocumentList())

export const useRepositoryStore = () => {
  return {
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
    getDocIconClass,
    getDocIconName,
    isDocRegisterOpen,
    statusFilterOptions,
  }
}

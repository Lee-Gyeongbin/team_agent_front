import { useRepositoryApi } from '~/composables/repository/useRepositoryApi'
import type { CodeItem } from '~/types/codes'
import type { FileLibraryItem, FileLibrarySavePayload, UrlItem } from '~/types/repository'
const { handleUploadByPresignedUrl, onDownloadFile } = useFileStore()
const {
  fetchUrlList,
  fetchSaveUrl,
  fetchDeleteUrl,
  fetchToggleUrlStatus,
  fetchSaveDocumentFile,
  fetchSelectDocFileLibraryList,
  fetchSaveFileLibraryBatch,
  fetchUpdateFileLibrary,
  fetchDeleteFileLibrary,
} = useRepositoryApi()
const isLoading = ref(false)

const secLvlOptions = ref<{ label: string; value: string }[]>([])

// ===== 파일 라이브러리 (파일 관리 탭) =====
const fileSearchKeyword = ref('')
const fileSelectedCategoryId = ref('')
const fileLibraryList = ref<FileLibraryItem[]>([])
const fileTotalCount = ref(0)
const fileCurrentPage = ref(1)
const filePageSize = ref(10)
const fileLibraryLoading = ref(false)
const fileLibraryError = ref('')

// ===== URL 상태 =====
const urlList = ref<UrlItem[]>([])
const urlTotalCount = ref(0)
const urlSearchKeyword = ref('')
const urlStatusFilter = ref('all')
const urlCategoryFilter = ref('all')
const urlCurrentPage = ref(1)
const urlPageSize = 10

// ===== 파일 라이브러리 액션 =====
const handleSelectFileLibraryList = async () => {
  fileLibraryLoading.value = true
  fileLibraryError.value = ''
  try {
    const res = await fetchSelectDocFileLibraryList({
      categoryId: fileSelectedCategoryId.value || undefined,
      findContent: fileSearchKeyword.value || undefined,
      page: fileCurrentPage.value,
      pageSize: filePageSize.value,
    })
    fileLibraryList.value = res.dataList ?? []
    fileTotalCount.value = res.totalCnt ?? 0
  } catch (e) {
    fileLibraryError.value = e instanceof Error ? e.message : '파일 목록을 불러오지 못했습니다.'
    fileLibraryList.value = []
    fileTotalCount.value = 0
  } finally {
    fileLibraryLoading.value = false
  }
}

const onFileSearch = () => {
  if (fileCurrentPage.value !== 1) fileCurrentPage.value = 1
  void handleSelectFileLibraryList()
}

/** NCP 저장 경로: repository/카테고리ID/실제파일명 */
const buildRepositoryStoreFilePath = (originalName: string, categoryId: string): string => {
  const safeCategoryId = String(categoryId ?? '').trim()
  const safeOriginalName = String(originalName ?? '')
    .trim()
    .replace(/[\\/]/g, '_')

  return `repository/${safeCategoryId}/${safeOriginalName}`
}

/** presign → 스토리지 PUT → 저장소 메타 준비 (로딩·토스트 없음) */
const performFileLibraryUpload = async (
  file: File,
  metadata?: {
    categoryId: string
    secLvl?: string
    docDesc?: string
    keywords?: string
    docSrc?: string
  },
): Promise<{ ok: true; payload: FileLibrarySavePayload } | { ok: false; message: string }> => {
  const categoryId = String(metadata?.categoryId ?? '').trim()
  if (!categoryId) {
    return { ok: false, message: '카테고리를 선택해 주세요.' }
  }
  const storeFilePath = buildRepositoryStoreFilePath(file.name, categoryId)
  const presign = await fetchSaveDocumentFile({
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: String(file.size),
    storeFilePath,
  })
  const uploadUrl = String(presign.uploadUrl ?? '').trim()
  const filePath = String(presign.filePath ?? '').trim()
  if (!uploadUrl || !filePath) {
    return { ok: false, message: '업로드 URL 발급에 실패했습니다.' }
  }
  const uploaded = await handleUploadByPresignedUrl(uploadUrl, file)
  if (!uploaded) {
    return { ok: false, message: '파일 업로드에 실패했습니다.' }
  }
  const payload: FileLibrarySavePayload = {
    fileName: file.name,
    filePath,
    fileSize: String(file.size),
    fileType: file.type || 'application/octet-stream',
    categoryId,
    secLvl: String(metadata?.secLvl ?? ''),
    docDesc: String(metadata?.docDesc ?? ''),
    keywords: String(metadata?.keywords ?? ''),
    docSrc: String(metadata?.docSrc ?? ''),
  }
  return { ok: true, payload }
}

/** 모달 등에서 선택한 여러 파일을 순차 업로드 (로딩·목록 갱신·요약 토스트 1회) */
const handleSaveFileLibraryBatch = async (
  files: File[],
  metadata?: { categoryId: string; secLvl?: string; docDesc?: string; keywords?: string; docSrc?: string },
) => {
  if (files.length === 0) {
    openToast({ message: '업로드할 파일을 선택해 주세요.', type: 'warning' })
    return
  }
  openLoading({ text: '파일을 업로드하는 중...' })
  let success = 0
  let firstFailMessage: string | null = null
  const uploadedPayloadList: FileLibrarySavePayload[] = []
  try {
    for (const file of files) {
      const result = await performFileLibraryUpload(file, metadata)
      if (result.ok) {
        uploadedPayloadList.push(result.payload)
      } else if (!firstFailMessage) {
        firstFailMessage = result.message
      }
    }
    if (uploadedPayloadList.length > 0) {
      const saveRes = await fetchSaveFileLibraryBatch(uploadedPayloadList)
      if (saveRes.successYn) {
        const successCnt = Number(saveRes.successCnt ?? uploadedPayloadList.length)
        success = Number.isFinite(successCnt)
          ? Math.max(0, Math.min(uploadedPayloadList.length, Math.trunc(successCnt)))
          : uploadedPayloadList.length
        if (success < uploadedPayloadList.length && !firstFailMessage) {
          firstFailMessage = saveRes.returnMsg ?? '일부 파일 정보 저장에 실패했습니다.'
        }
      } else if (!firstFailMessage) {
        firstFailMessage = saveRes.returnMsg ?? '파일 정보 저장에 실패했습니다.'
      }
    }
    if (success === files.length) {
      openToast({ message: `${success}개 파일이 등록되었습니다.`, type: 'success' })
    } else if (success > 0) {
      openToast({
        message: `${success}개 등록됨 · ${files.length - success}개 실패${firstFailMessage ? ` (${firstFailMessage})` : ''}`,
        type: 'warning',
      })
    } else {
      openToast({ message: firstFailMessage ?? '파일 등록에 실패했습니다.', type: 'error' })
    }
    await handleSelectFileLibraryList()
  } catch {
    openToast({ message: '파일 등록에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 파일 관리 탭: 선택한 여러 파일 삭제 (확인 1회) */
const handleDeleteFileLibraryBatch = async (docFileIds: string[]) => {
  const ids = docFileIds.map((id) => id.trim()).filter(Boolean)
  if (ids.length === 0) {
    openToast({ message: '삭제할 파일을 선택해 주세요.', type: 'warning' })
    return
  }
  const ok = await openConfirm({
    title: '파일 삭제',
    message: `선택한 ${ids.length}개 파일을 삭제하시겠습니까? 저장소에서도 함께 삭제됩니다.`,
  })
  if (!ok) return
  openLoading({ text: '삭제하는 중...' })
  let success = 0
  let lastErr: string | null = null
  try {
    const res = await fetchDeleteFileLibrary(ids[0], ids)
    if (res.successYn) {
      success = ids.length
      openToast({ message: `${success}개 파일이 삭제되었습니다.`, type: 'success' })
    } else {
      lastErr = res.returnMsg ?? '삭제에 실패했습니다.'
      openToast({ message: lastErr, type: 'error' })
    }
    await handleSelectFileLibraryList()
  } catch {
    openToast({ message: '삭제에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

const handleUpdateFileLibrary = async (data: {
  docFileId: string
  categoryId: string
  secLvl?: string
  docDesc?: string
  keywords?: string
  docSrc?: string
}) => {
  openLoading({ text: '파일 정보를 수정하는 중...' })
  try {
    const res = await fetchUpdateFileLibrary(data)
    if (res.successYn) {
      openToast({ message: '파일 메타데이터가 수정되었습니다.', type: 'success' })
      await handleSelectFileLibraryList()
      return true
    }
    openToast({ message: res.returnMsg ?? '파일 메타데이터 수정에 실패했습니다.', type: 'error' })
    return false
  } finally {
    closeLoading()
  }
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
      openToast({ message: 'URL이 삭제되었습니다.', type: 'success' })
    } else {
      openToast({ message: 'URL 삭제에 실패했습니다.', type: 'error' })
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

/** 파일 미리보기 모달 (FilePreviewModal) — PDF.js 뷰어 */
const isFilePreviewOpen = ref(false)
const filePreviewDocFileId = ref('')
const filePreviewTitle = ref('')
const filePreviewDocFileOptions = ref<{ label: string; value: string }[]>([])

/** 파일 저장소 목록 행 — 단일 파일 미리보기 */
const handleOpenFileLibraryPreview = (row: FileLibraryItem) => {
  const docFileId = String(row.docFileId ?? '').trim()
  if (!docFileId) {
    openToast({ message: '미리보기할 파일 정보가 없습니다.', type: 'warning' })
    return
  }
  const label = String(row.fileName ?? '').trim() || '파일'
  filePreviewDocFileId.value = docFileId
  filePreviewTitle.value = label
  filePreviewDocFileOptions.value = [{ label, value: docFileId }]
  isFilePreviewOpen.value = true
}

/** 파일 저장소 목록 행 — 단일 파일 다운로드 */
const handleDownloadFileLibraryRow = async (row: FileLibraryItem) => {
  const docFileId = String(row.docFileId ?? '').trim()
  if (!docFileId) {
    openToast({ message: '다운로드할 파일 정보가 없습니다.', type: 'warning' })
    return
  }
  await onDownloadFile(docFileId)
}

/** 모달 @close 시 상태 정리 */
const onCloseFilePreview = () => {
  filePreviewDocFileOptions.value = []
  filePreviewDocFileId.value = ''
  filePreviewTitle.value = ''
}

const handleSelectCodeOptions = async () => {
  const secLvlCodes = await getCodes('DC000001')
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
    handleOpenFileLibraryPreview,
    handleDownloadFileLibraryRow,
    isFilePreviewOpen,
    filePreviewDocFileId,
    filePreviewTitle,
    filePreviewDocFileOptions,
    onCloseFilePreview,
    secLvlOptions,
    handleSelectCodeOptions,
    getDocIconClass,
    getDocIconName,
    // 파일 라이브러리
    fileSearchKeyword,
    fileSelectedCategoryId,
    fileLibraryList,
    fileTotalCount,
    fileCurrentPage,
    filePageSize,
    fileLibraryLoading,
    fileLibraryError,
    handleSelectFileLibraryList,
    onFileSearch,
    handleSaveFileLibraryBatch,
    handleDeleteFileLibraryBatch,
    handleUpdateFileLibrary,
  }
}

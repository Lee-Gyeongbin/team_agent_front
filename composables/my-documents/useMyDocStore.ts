import { useMyDocApi } from '~/composables/my-documents/useMyDocApi'
import type { MyDoc, MyDocListRequest, MyDocSaveReportPayload, MyDocStatus } from '~/types/mydoc'

const { fetchList, fetchDetail, fetchSaveReport, fetchUpdateNewYn } = useMyDocApi()

const docList = ref<MyDoc[]>([])
const archivedDocList = ref<MyDoc[]>([])
const selectedDocDetail = ref<MyDoc | null>(null)
const isDetailModalOpen = ref(false)
const lastListRequestParams = ref<MyDocListRequest | null>(null)

/** 목록 응답을 docStatus에 맞는 store에 반영 */
const applyMyDocListResponse = (params: MyDocListRequest, list: MyDoc[]) => {
  const docStatus: MyDocStatus = params.docStatus === 'ARCHIVED' ? 'ARCHIVED' : 'SAVED'
  if (docStatus === 'ARCHIVED') {
    archivedDocList.value = list
  } else {
    docList.value = list
  }
}

/** 내 문서 목록 조회 — docStatus에 따라 docList / archivedDocList 분기 저장 (미지정 시 SAVED) */
const handleSelectMyDocList = async (params: MyDocListRequest) => {
  const docStatus: MyDocStatus = params.docStatus === 'ARCHIVED' ? 'ARCHIVED' : 'SAVED'
  const requestParams = { ...params, docStatus }
  lastListRequestParams.value = requestParams

  try {
    openLoading({ text: '문서를 불러오는 중...' })
    const response = await fetchList(requestParams)
    applyMyDocListResponse(requestParams, response?.dataList ?? [])
  } catch {
    openToast({ message: '문서 목록을 불러오는데 실패했습니다.', type: 'error' })
    applyMyDocListResponse(requestParams, [])
  } finally {
    closeLoading()
  }
}

/** 로딩 없이 목록만 재조회 (newYn 갱신 후 배지 동기화) */
const handleRefreshMyDocListQuiet = async (params: MyDocListRequest) => {
  const docStatus: MyDocStatus = params.docStatus === 'ARCHIVED' ? 'ARCHIVED' : 'SAVED'
  const requestParams = { ...params, docStatus }

  try {
    const response = await fetchList(requestParams)
    applyMyDocListResponse(requestParams, response?.dataList ?? [])
  } catch {
    // 상세 모달은 유지 — 목록 갱신 실패는 조용히 무시
  }
}

/** 목록·상세의 newYn 동기화 */
const applyMyDocNewYnUpdate = (docId: string, newYn: 'Y' | 'N') => {
  if (selectedDocDetail.value?.docId === docId) {
    selectedDocDetail.value = { ...selectedDocDetail.value, newYn }
  }

  const patchList = (list: MyDoc[]) => {
    const index = list.findIndex((item) => item.docId === docId)
    if (index < 0) return
    list[index] = { ...list[index], newYn }
  }

  patchList(docList.value)
  patchList(archivedDocList.value)
}

/** 신규 문서 열람 처리 — newYn N 갱신 후 목록 재조회 */
const handleUpdateMyDocNewYn = async (docId: string) => {
  try {
    const res = await fetchUpdateNewYn({ docId, newYn: 'N' })
    if (res.successYn === false) return

    applyMyDocNewYnUpdate(docId, 'N')

    if (lastListRequestParams.value) {
      await handleRefreshMyDocListQuiet(lastListRequestParams.value)
    }
  } catch {
    // 상세 보기는 유지
  }
}

/** 내 문서 상세 모달 닫기 */
const handleCloseMyDocDetailModal = () => {
  isDetailModalOpen.value = false
  selectedDocDetail.value = null
}

/** 내 문서 상세 조회 */
const handleSelectMyDocDetail = async (docId: string) => {
  try {
    openLoading({ text: '문서 상세를 불러오는 중...' })
    const res = await fetchDetail({ docId })
    selectedDocDetail.value = res
    isDetailModalOpen.value = true

    if (res.newYn === 'Y') {
      await handleUpdateMyDocNewYn(docId)
    }
  } catch {
    selectedDocDetail.value = null
    isDetailModalOpen.value = false
    openToast({ message: '문서 상세를 불러오는데 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 내 문서보관함 — AI 보고서 저장 */
const handleSaveReport = async (payload: MyDocSaveReportPayload) => {
  if (!payload.docHtml?.trim()) {
    openToast({ message: '저장할 문서 내용이 없습니다.', type: 'warning' })
    return
  }
  if (!payload.originHtml?.trim()) {
    openToast({ message: '원본 문서 정보가 없습니다.', type: 'warning' })
    return
  }

  try {
    openLoading({
      text: '내 문서보관함에 저장 중입니다...',
      isDy: true,
      intervalMs: 3000,
      dyTexts: [
        '내 문서보관함에 저장 중입니다...',
        'AI가 문서명을 자동 생성 중입니다...',
        '문서 템플릿도 같이 저장 중입니다...',
        '내 문서함을 깔끔하게 정돈하는 중입니다...',
      ],
    })
    const res = await fetchSaveReport({
      ...payload,
      docStatus: payload.docStatus ?? 'SAVED',
      sortOrd: payload.sortOrd ?? 0,
    })
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || '내 문서보관함 저장에 실패했습니다.', type: 'error' })
      return
    }
    openToast({ message: res.returnMsg || '내 문서보관함에 저장했습니다.', type: 'success' })
  } catch {
    openToast({ message: '내 문서보관함 저장에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
  }
}

/** 상세 문서 → saveReport.do 페이로드 */
const buildMyDocSaveReportPayload = (doc: MyDoc, docHtml: string): MyDocSaveReportPayload | null => {
  const originHtml = doc.originHtml?.trim()
  if (!docHtml.trim() || !originHtml) return null

  return {
    docId: doc.docId,
    tmplId: doc.tmplId ?? undefined,
    docNm: doc.docNm,
    docHtml,
    originHtml,
    svcTy: doc.svcTy ?? undefined,
    rContent: doc.rContent ?? undefined,
    agentId: doc.agentId ?? null,
    docStatus: doc.docStatus,
    sortOrd: doc.sortOrd,
  }
}

/** saveReport.do 공통 호출 */
const submitMyDocSaveReport = async (
  docId: string,
  docHtml: string,
  messages: { loading: string; success: string; error: string; invalid?: string },
): Promise<boolean> => {
  const doc = selectedDocDetail.value
  if (!doc || doc.docId !== docId) return false

  const payload = buildMyDocSaveReportPayload(doc, docHtml)
  if (!payload) {
    openToast({ message: messages.invalid ?? '저장할 문서 정보가 없습니다.', type: 'warning' })
    return false
  }

  try {
    openLoading({ text: messages.loading })
    const res = await fetchSaveReport(payload)
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || messages.error, type: 'error' })
      return false
    }

    applyMyDocHtmlUpdate(docId, docHtml)
    openToast({ message: res.returnMsg || messages.success, type: 'success' })
    return true
  } catch {
    openToast({ message: messages.error, type: 'error' })
    return false
  } finally {
    closeLoading()
  }
}

/** 상세 모달·목록에 반영할 문서 HTML 갱신 */
const applyMyDocHtmlUpdate = (docId: string, docHtml: string, modifyDt?: string | null) => {
  const patch = { docHtml, ...(modifyDt ? { modifyDt } : {}) }

  if (selectedDocDetail.value?.docId === docId) {
    selectedDocDetail.value = { ...selectedDocDetail.value, ...patch }
  }

  const updateListItem = (list: MyDoc[]) => {
    const index = list.findIndex((item) => item.docId === docId)
    if (index < 0) return
    list[index] = { ...list[index], ...patch }
  }

  updateListItem(docList.value)
  updateListItem(archivedDocList.value)
}

/** 내 문서 — 편집 내용 저장 */
const handleSaveMyDoc = async (docId: string, docHtml: string): Promise<boolean> => {
  if (!docHtml.trim()) {
    openToast({ message: '저장할 문서 내용이 없습니다.', type: 'warning' })
    return false
  }

  return submitMyDocSaveReport(docId, docHtml, {
    loading: '문서를 저장하는 중...',
    success: '문서를 저장했습니다.',
    error: '문서 저장에 실패했습니다.',
    invalid: '원본 문서 정보가 없습니다.',
  })
}

/** 내 문서 — docHtml을 originHtml로 복원 */
const handleRestoreMyDocOrigin = async (docId: string): Promise<boolean> => {
  const originHtml = selectedDocDetail.value?.originHtml?.trim()
  if (!originHtml) {
    openToast({ message: 'AI 최초 생성본이 없습니다.', type: 'warning' })
    return false
  }

  return submitMyDocSaveReport(docId, originHtml, {
    loading: 'AI 최초 생성본으로 복원하는 중...',
    success: 'AI 최초 생성본으로 되돌렸습니다.',
    error: 'AI 생성본 복원에 실패했습니다.',
  })
}

export const useMyDocStore = () => {
  return {
    docList,
    archivedDocList,
    selectedDocDetail,
    isDetailModalOpen,
    handleSelectMyDocList,
    handleSelectMyDocDetail,
    handleCloseMyDocDetailModal,
    handleSaveReport,
    handleSaveMyDoc,
    handleRestoreMyDocOrigin,
  }
}

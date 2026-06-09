import { useMyDocApi } from '~/composables/my-documents/useMyDocApi'
import { useUserSelectStore } from '~/composables/com/useUserSelectStore'
import type { OrgUserItem } from '~/types/org-manage'
import type { MyDoc, MyDocListRequest, MyDocSaveReportPayload } from '~/types/mydoc'

const {
  fetchList,
  fetchDetail,
  fetchSaveReport,
  fetchUpdateNewYn,
  fetchUpdateDocNm,
  fetchUpdateSortOrd,
  fetchDeleteDoc,
  fetchShareDoc,
} = useMyDocApi()
const { openUserSelectModal, closeUserSelectModal } = useUserSelectStore()

const docList = ref<MyDoc[]>([])
const selectedDocDetail = ref<MyDoc | null>(null)
/** 카드 드롭다운 등 상세 모달 없이 공유할 때 사용 */
const sharingDocId = ref<string | null>(null)
const isDetailModalOpen = ref(false)
const lastListRequestParams = ref<MyDocListRequest | null>(null)
/** 드래그 정렬 취소 시 복원용 */
const docListBeforeDrag = ref<MyDoc[]>([])

/** 내 문서 목록 조회 */
const handleSelectMyDocList = async (params: MyDocListRequest) => {
  lastListRequestParams.value = { ...params }

  try {
    openLoading({ text: '문서를 불러오는 중...' })
    const response = await fetchList(lastListRequestParams.value)
    docList.value = response?.dataList ?? []
  } catch {
    openToast({ message: '문서 목록을 불러오는데 실패했습니다.', type: 'error' })
    docList.value = []
  } finally {
    closeLoading()
  }
}

/** 로딩 없이 목록만 재조회 (newYn 갱신 후 배지 동기화) */
const handleRefreshMyDocListQuiet = async (params: MyDocListRequest) => {
  const requestParams = { ...params }

  try {
    const response = await fetchList(requestParams)
    docList.value = response?.dataList ?? []
  } catch {
    // 상세 모달은 유지 — 목록 갱신 실패는 조용히 무시
  }
}

/** 목록·상세의 newYn 동기화 */
const applyMyDocNewYnUpdate = (docId: string, newYn: 'Y' | 'N') => {
  if (selectedDocDetail.value?.docId === docId) {
    selectedDocDetail.value = { ...selectedDocDetail.value, newYn }
  }

  const index = docList.value.findIndex((item) => item.docId === docId)
  if (index < 0) return
  docList.value[index] = { ...docList.value[index], newYn }
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
    sortOrd: doc.sortOrd,
  }
}

/** 목록에서 docId로 문서 찾기 */
const findMyDocInLists = (docId: string): MyDoc | undefined => docList.value.find((item) => item.docId === docId)

/** 마지막 목록 조회 조건으로 목록만 재조회 */
const refreshMyDocListAfterMutation = async () => {
  if (!lastListRequestParams.value) return
  await handleRefreshMyDocListQuiet(lastListRequestParams.value)
}

/** 상세 모달 — 목록 재조회 후 메타 필드만 목록 기준 동기화 (docHtml 등은 유지) */
const syncSelectedDocDetailFromList = (docId: string) => {
  if (selectedDocDetail.value?.docId !== docId) return

  const fromList = findMyDocInLists(docId)
  if (!fromList) return

  selectedDocDetail.value = {
    ...selectedDocDetail.value,
    docNm: fromList.docNm,
    modifyDt: fromList.modifyDt,
    newYn: fromList.newYn,
  }
}

/** 상세 모달 — 저장된 HTML만 반영 (목록 API에 HTML 없음) */
const applySelectedDocHtml = (docId: string, docHtml: string) => {
  if (selectedDocDetail.value?.docId !== docId) return
  selectedDocDetail.value = { ...selectedDocDetail.value, docHtml }
}

/** saveReport.do 공통 호출 (상세 모달 열림 상태 전제) */
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

    applySelectedDocHtml(docId, docHtml)
    await refreshMyDocListAfterMutation()
    syncSelectedDocDetailFromList(docId)
    openToast({ message: res.returnMsg || messages.success, type: 'success' })
    return true
  } catch {
    openToast({ message: messages.error, type: 'error' })
    return false
  } finally {
    closeLoading()
  }
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

/** 공유 대상 사용자 선택 모달 열기 */
const handleOpenMyDocShareModal = async (docId: string) => {
  if (!docId) return
  sharingDocId.value = docId
  await openUserSelectModal()
}

/** 공유 모달 닫기 — 선택 취소 시 sharingDocId 초기화 */
const handleCloseMyDocShareModal = () => {
  closeUserSelectModal()
  sharingDocId.value = null
}

/**
 * 내 문서 공유 확인 핸들러 (UserSelectModal @confirm 이벤트 직접 연결)
 * - 선택된 사용자 목록으로 문서 공유 API 호출
 */
const handleShareMyDoc = async (users: OrgUserItem[]) => {
  const docId = sharingDocId.value ?? selectedDocDetail.value?.docId
  if (!docId || !users.length) {
    openToast({ message: '문서 또는 사용자 정보가 없습니다.', type: 'warning' })
    return
  }

  const userIds = users.map((u) => u.userId)
  try {
    openLoading({ text: '문서를 공유하는 중...' })
    const res = await fetchShareDoc({ docId, userIds, shareMsg: '' })
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || '문서 공유에 실패했습니다.', type: 'error' })
      return
    }
    openToast({ message: res.returnMsg || '문서를 공유했습니다.', type: 'success' })
  } catch {
    openToast({ message: '문서 공유에 실패했습니다.', type: 'error' })
  } finally {
    closeLoading()
    closeUserSelectModal()
    sharingDocId.value = null
  }
}

/** 내 문서 삭제 (deleteDoc.do) */
const handleDeleteMyDoc = async (docId: string): Promise<boolean> => {
  const doc = findMyDocInLists(docId)
  const docNm = doc?.docNm ?? '문서'

  const confirmed = await openConfirm({
    title: '문서 삭제',
    message: `${docNm} 문서를 삭제하시겠습니까?`,
    confirmText: '삭제',
  })
  if (!confirmed) return false

  try {
    openLoading({ text: '문서를 삭제하는 중...' })
    const res = await fetchDeleteDoc({ docId })
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || '문서 삭제에 실패했습니다.', type: 'error' })
      return false
    }

    docList.value = docList.value.filter((item) => item.docId !== docId)

    if (selectedDocDetail.value?.docId === docId) {
      handleCloseMyDocDetailModal()
    }

    openToast({ message: res.returnMsg || '문서를 삭제했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '문서 삭제에 실패했습니다.', type: 'error' })
    return false
  } finally {
    closeLoading()
  }
}

/** 문서 드래그 시작 — 순서 저장 (취소 시 복원용) */
const onMyDocDragStart = () => {
  docListBeforeDrag.value = [...docList.value]
}

/** 문서 드래그 종료 — sortOrd 일괄 변경 (updateSortOrd.do) */
const handleUpdateMyDocSortOrd = async () => {
  openConfirm({
    message: '문서 순서를 변경하시겠습니까?',
    onConfirm: async () => {
      const items = docList.value.map((doc, index) => ({
        docId: doc.docId,
        sortOrd: index + 1,
      }))

      try {
        openLoading({ text: '문서 순서를 변경하는 중...' })
        const res = await fetchUpdateSortOrd({ items })
        if (res.successYn === false) {
          docList.value = [...docListBeforeDrag.value]
          openToast({ message: '문서 순서 변경에 실패했습니다.', type: 'error' })
          return
        }

        docList.value = docList.value.map((doc, index) => ({
          ...doc,
          sortOrd: index + 1,
        }))
        openToast({ message: '문서 순서가 변경되었습니다.', type: 'success' })
      } catch {
        docList.value = [...docListBeforeDrag.value]
        openToast({ message: '문서 순서 변경에 실패했습니다.', type: 'error' })
      } finally {
        closeLoading()
      }
    },
    onCancel: () => {
      docList.value = [...docListBeforeDrag.value]
    },
  })
}

/** 내 문서 — 문서명만 변경 (updateDocNm.do) */
const handleRenameMyDoc = async (docId: string, docNm: string): Promise<boolean> => {
  const trimmed = docNm.trim()
  if (!trimmed) {
    openToast({ message: '문서명을 입력해주세요.', type: 'warning' })
    return false
  }

  const currentDocNm =
    (selectedDocDetail.value?.docId === docId ? selectedDocDetail.value.docNm : findMyDocInLists(docId)?.docNm) ?? ''

  if (currentDocNm.trim() === trimmed) return true

  try {
    openLoading({ text: '문서명을 변경하는 중...' })
    const res = await fetchUpdateDocNm({ docId, docNm: trimmed })
    if (res.successYn === false) {
      openToast({ message: res.returnMsg || '문서명 변경에 실패했습니다.', type: 'error' })
      return false
    }

    await refreshMyDocListAfterMutation()
    syncSelectedDocDetailFromList(docId)
    openToast({ message: res.returnMsg || '문서명을 변경했습니다.', type: 'success' })
    return true
  } catch {
    openToast({ message: '문서명 변경에 실패했습니다.', type: 'error' })
    return false
  } finally {
    closeLoading()
  }
}

export const useMyDocStore = () => {
  return {
    docList,
    selectedDocDetail,
    isDetailModalOpen,
    handleSelectMyDocList,
    handleSelectMyDocDetail,
    handleCloseMyDocDetailModal,
    handleSaveReport,
    handleSaveMyDoc,
    handleRestoreMyDocOrigin,
    handleRenameMyDoc,
    handleDeleteMyDoc,
    handleOpenMyDocShareModal,
    handleCloseMyDocShareModal,
    handleShareMyDoc,
    refreshMyDocListAfterMutation,
    onMyDocDragStart,
    handleUpdateMyDocSortOrd,
  }
}

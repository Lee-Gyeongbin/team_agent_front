import { useMyDocApi } from '~/composables/my-documents/useMyDocApi'
import type { MyDoc, MyDocListRequest, MyDocSaveReportPayload, MyDocStatus } from '~/types/mydoc'

const { fetchList, fetchSaveReport } = useMyDocApi()

const docList = ref<MyDoc[]>([])
const archivedDocList = ref<MyDoc[]>([])

/** 내 문서 목록 조회 — docStatus에 따라 docList / archivedDocList 분기 저장 (미지정 시 SAVED) */
const handleSelectMyDocList = async (params: MyDocListRequest) => {
  const docStatus: MyDocStatus = params.docStatus === 'ARCHIVED' ? 'ARCHIVED' : 'SAVED'
  const isArchived = docStatus === 'ARCHIVED'
  const requestParams = { ...params, docStatus }

  try {
    openLoading({ text: '문서를 불러오는 중...' })
    const response = await fetchList(requestParams)
    const list = response?.dataList ?? []
    if (isArchived) {
      archivedDocList.value = list
    } else {
      docList.value = list
    }
  } catch {
    openToast({ message: '문서 목록을 불러오는데 실패했습니다.', type: 'error' })
    if (isArchived) {
      archivedDocList.value = []
    } else {
      docList.value = []
    }
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

export const useMyDocStore = () => {
  return {
    docList,
    archivedDocList,
    handleSelectMyDocList,
    handleSaveReport,
  }
}

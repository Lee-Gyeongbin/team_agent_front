import { useMyDocApi } from '~/composables/my-documents/useMyDocApi'
import type { MyDocSaveReportPayload } from '~/types/mydoc'

const { fetchSaveReport } = useMyDocApi()

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
  return { handleSaveReport }
}

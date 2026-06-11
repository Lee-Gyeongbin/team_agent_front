import { useMtlcareApi } from '~/composables/mtlcare/useMtlcareApi'
import type { MtlcareReport } from '~/types/mtlcare'
import type { RadarChartData } from '~/utils/chat/surveyUtil'

const { fetchSaveResult, fetchRequestReport, fetchReport, fetchConfirmReport } = useMtlcareApi()

const report = ref<MtlcareReport | null>(null)
const reportLoading = ref(false)
const reportError = ref('')

/** 진단 결과 저장 → resultId 반환 (실패 시 null) */
const handleSaveResult = async (data: RadarChartData): Promise<string | null> => {
  const res = await fetchSaveResult(data)
  return res.successYn && res.resultId ? res.resultId : null
}

/** 면담 요청 (resultId, mgrUserId, comment) */
const handleRequestReport = async (resultId: string, mgrUserId: string, reqComment?: string) => {
  try {
    openLoading({
      text: '면담 요청 중입니다...',
      isDy: true,
      intervalMs: 3000,
      dyTexts: [
        '면담 요청을 준비하고 있습니다...',
        '진단 결과를 AI가 정리하고 있습니다...',
        '면담 요청을 전송하고 있습니다...',
      ],
    })
    const res = await fetchRequestReport(resultId, mgrUserId, reqComment)
    closeLoading()
    return res.successYn ? res : { successYn: false, returnMsg: res.returnMsg || '면담 요청에 실패했습니다.' }
  } catch {
    closeLoading()
    return { successYn: false, returnMsg: '면담 요청에 실패했습니다.' }
  }
}

/** 면담 리포트 상세 조회 */
const handleSelectReport = async (reportId: string) => {
  report.value = null
  reportLoading.value = true
  reportError.value = ''
  try {
    const res = await fetchReport(reportId)
    if (!res.data) {
      reportError.value = '리포트를 찾을 수 없습니다.'
      return
    }
    report.value = res.data
  } catch {
    reportError.value = '리포트를 불러오지 못했습니다.'
  } finally {
    reportLoading.value = false
  }
}

/** 면담 리포트 확인 처리 */
const handleConfirmReport = async (reportId: string) => {
  const res = await fetchConfirmReport(reportId)
  if (res.successYn && report.value) {
    report.value = { ...report.value, status: 'CONFIRMED' }
  }
  return res
}

export const useMtlcareStore = () => {
  return {
    report,
    reportLoading,
    reportError,
    handleSaveResult,
    handleRequestReport,
    handleSelectReport,
    handleConfirmReport,
  }
}

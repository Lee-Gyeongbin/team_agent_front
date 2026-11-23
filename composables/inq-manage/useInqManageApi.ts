import { useApi } from '~/composables/com/useApi'
import type {
  InqAnsrSavePayload,
  InqCodeInfoResponse,
  InqDetailResponse,
  InqFileDownloadResponse,
  InqFilePreviewResponse,
  InqListResponse,
  InqResponse,
  InqSearchParams,
} from '~/types/inq'
import { formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'
import { downloadBlobAsFile } from '~/utils/global/fileDownloadUtil'
import { assertInqOk as assertOk } from '~/utils/inq/inqUtil'

/** 문의하기 관리 API (/inq/manage/*.do) */
export const useInqManageApi = () => {
  const { post, postBlob } = useApi()

  /** 화면 공통 정보 조회 (구분·처리상태 코드와 정책값) */
  const fetchSelectInqManageCodeInfo = async (): Promise<InqCodeInfoResponse> =>
    assertOk(await post<InqCodeInfoResponse>('/inq/manage/codeInfo.do', {}))

  /** 문의사항 목록 조회 (전체) */
  const fetchSelectInqManageList = async (params: InqSearchParams & { pageIndex: number }): Promise<InqListResponse> =>
    assertOk(await post<InqListResponse>('/inq/manage/list.do', params))

  /** 문의 목록 엑셀 다운로드 (현재 조회 조건, 페이징 없음, 답변·댓글 포함) */
  const fetchDownloadInqManageExcel = async (params: InqSearchParams): Promise<void> => {
    const blob = await postBlob('/inq/manage/downloadExcel.do', params)
    downloadBlobAsFile(blob, `${formatYyyyMmDdFromDate(new Date())}_문의하기목록.xlsx`)
  }

  /** 문의사항 상세 조회 (첨부·답변 포함) */
  const fetchSelectInqManageDetail = async (inqId: string): Promise<InqDetailResponse> =>
    assertOk(await post<InqDetailResponse>('/inq/manage/detail.do', { inqId }))

  /** 문의사항 삭제 */
  const fetchDeleteInqManage = async (inqId: string) =>
    assertOk(await post<InqResponse>('/inq/manage/delete.do', { inqId }))

  /** 처리상태 변경 */
  const fetchSaveInqManageStatus = async (inqId: string, statusCd: string) =>
    assertOk(await post<InqResponse>('/inq/manage/saveStatus.do', { inqId, statusCd }))

  /** 답변·댓글 등록/수정 (ansrId 가 있으면 수정, upAnsrId 가 없으면 관리자 답변) */
  const fetchSaveInqManageAnsr = async (payload: InqAnsrSavePayload) =>
    assertOk(await post<InqResponse>('/inq/manage/saveAnsr.do', payload))

  /** 답변·댓글 삭제 (하위 답글 포함) */
  const fetchDeleteInqManageAnsr = async (inqId: string, ansrId: string) =>
    assertOk(await post<InqResponse>('/inq/manage/deleteAnsr.do', { inqId, ansrId }))

  /** 첨부파일 다운로드 URL 발급 */
  const fetchInqManageFileDownloadUrl = async (inqFileId: string) =>
    assertOk(await post<InqFileDownloadResponse>('/inq/manage/downloadFile.do', { inqFileId }))

  /** 첨부파일 미리보기 URL 발급 */
  const fetchInqManageFilePreview = async (inqFileId: string) =>
    assertOk(await post<InqFilePreviewResponse>('/inq/manage/filePreview.do', { inqFileId }))

  return {
    fetchSelectInqManageCodeInfo,
    fetchSelectInqManageList,
    fetchDownloadInqManageExcel,
    fetchSelectInqManageDetail,
    fetchDeleteInqManage,
    fetchSaveInqManageStatus,
    fetchSaveInqManageAnsr,
    fetchDeleteInqManageAnsr,
    fetchInqManageFileDownloadUrl,
    fetchInqManageFilePreview,
  }
}

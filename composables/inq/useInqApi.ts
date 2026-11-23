import { useApi } from '~/composables/com/useApi'
import type {
  InqAnsrSavePayload,
  InqCodeInfoResponse,
  InqDetailResponse,
  InqFileDownloadResponse,
  InqFilePreviewResponse,
  InqFileUploadUrlResponse,
  InqListResponse,
  InqResponse,
  InqSavePayload,
  InqSearchParams,
} from '~/types/inq'
import { assertInqOk as assertOk } from '~/utils/inq/inqUtil'

/** 문의하기 API (/inq/*.do) */
export const useInqApi = () => {
  const { post } = useApi()

  /** 화면 공통 정보 조회 (구분·처리상태 코드와 정책값) */
  const fetchSelectInqCodeInfo = async (): Promise<InqCodeInfoResponse> =>
    assertOk(await post<InqCodeInfoResponse>('/inq/codeInfo.do', {}))

  /** 문의사항 목록 조회 */
  const fetchSelectInqList = async (params: InqSearchParams & { pageIndex: number }): Promise<InqListResponse> =>
    assertOk(await post<InqListResponse>('/inq/list.do', params))

  /** 문의사항 상세 조회 (첨부·답변 포함) */
  const fetchSelectInqDetail = async (inqId: string): Promise<InqDetailResponse> =>
    assertOk(await post<InqDetailResponse>('/inq/detail.do', { inqId }))

  /** 문의사항 등록/수정 */
  const fetchSaveInq = async (payload: InqSavePayload) =>
    assertOk(await post<InqResponse & { inqId: string }>('/inq/save.do', payload))

  /** 문의사항 삭제 */
  const fetchDeleteInq = async (inqId: string) => assertOk(await post<InqResponse>('/inq/delete.do', { inqId }))

  /** 답글 등록/수정 (ansrId 가 있으면 수정, 없으면 upAnsrId 에 대한 답글 등록) */
  const fetchSaveInqAnsr = async (payload: InqAnsrSavePayload) =>
    assertOk(await post<InqResponse>('/inq/saveAnsr.do', payload))

  /** 답글 삭제 (하위 답글 포함) */
  const fetchDeleteInqAnsr = async (inqId: string, ansrId: string) =>
    assertOk(await post<InqResponse>('/inq/deleteAnsr.do', { inqId, ansrId }))

  /** 첨부파일 업로드 presigned URL 발급 */
  const fetchCreateInqFileUploadUrl = async (meta: {
    fileNm: string
    fileType: string
    fileSize: number
    filePath: string
  }) => assertOk(await post<InqFileUploadUrlResponse>('/inq/createFileUploadUrl.do', meta))

  /** 첨부파일 다운로드 URL 발급 */
  const fetchInqFileDownloadUrl = async (inqFileId: string) =>
    assertOk(await post<InqFileDownloadResponse>('/inq/downloadFile.do', { inqFileId }))

  /** 첨부파일 미리보기 URL 발급 */
  const fetchInqFilePreview = async (inqFileId: string) =>
    assertOk(await post<InqFilePreviewResponse>('/inq/filePreview.do', { inqFileId }))

  return {
    fetchSelectInqCodeInfo,
    fetchSelectInqList,
    fetchSelectInqDetail,
    fetchSaveInq,
    fetchDeleteInq,
    fetchSaveInqAnsr,
    fetchDeleteInqAnsr,
    fetchCreateInqFileUploadUrl,
    fetchInqFileDownloadUrl,
    fetchInqFilePreview,
  }
}

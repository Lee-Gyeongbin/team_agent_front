import { useApi } from '~/composables/com/useApi'
import type { FileMeta, FileUploadResponse, FileUrlResponse } from '~/types/file'

export const useFileApi = () => {
  const { get, post } = useApi()

  /**
   * 업로드용 S3 Presigned URL 발급
   * - 백엔드 FileController.uploadFile(FileVO req)에 매핑
   * - req: fileName, fileType, fileSize 및 기타 메타데이터
   */
  const fetchUploadFileUrl = async (meta: Pick<FileMeta, 'fileName' | 'fileType' | 'fileSize'> & Partial<FileMeta>) => {
    return post<FileUploadResponse>('/com/file/uploadFile.do', meta)
  }

  /**
   * 보기용 Presigned URL 발급
   * - FileController.viewFile(FileVO dataVO)에 매핑
   * - 보통 docId 기준으로 호출
   */
  const fetchViewFileUrl = async (docId: string) => {
    return post<FileUrlResponse>('/com/file/viewFile.do', { docId })
  }

  /**
   * 다운로드용 Presigned URL 발급
   * - FileController.downloadFile(FileVO dataVO)에 매핑
   * - @RequestParam 기반이지만, 프론트에서는 쿼리스트링 GET 형태로 호출
   */
  const fetchDownloadFileUrl = async (docId: string) => {
    const encoded = encodeURIComponent(docId)
    return get<FileUrlResponse>(`/com/file/downloadFile.do?docId=${encoded}`)
  }
  return {
    fetchUploadFileUrl,
    fetchViewFileUrl,
    fetchDownloadFileUrl,
  }
}

import { useApi } from '~/composables/com/useApi'
import type { FileDownloadResponse, FileUrlResponse } from '~/types/file'

export const useFileApi = () => {
  const { post } = useApi()

  /**
   * 보기용 Presigned URL 발급
   * - RepositoryController.viewDocumentFile(FileVO req)에 매핑
   */
  const fetchViewFileUrl = async (docFileId: string) => {
    return post<FileUrlResponse>('/repository/viewDocumentFile.do', { docFileId })
  }

  /**
   * 다운로드용 Presigned URL 발급
   * - RepositoryController.downloadDocumentFile(FileVO req)에 매핑
   */
  const fetchDownloadFileUrl = async (docFileId: string) => {
    return post<FileDownloadResponse>('/repository/downloadDocumentFile.do', {
      docFileId,
    })
  }

  return {
    fetchViewFileUrl,
    fetchDownloadFileUrl,
  }
}

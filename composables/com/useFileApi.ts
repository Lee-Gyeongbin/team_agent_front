import { useApi } from '~/composables/com/useApi'
import type { FileDownloadResponse, FileMeta, FileUploadResponse, FileUrlResponse } from '~/types/file'

export const useFileApi = () => {
  const { post } = useApi()

  /**
   * 업로드용 S3 Presigned URL 발급
   * - 백엔드 RepositoryController.saveDocumentFile(FileVO req)에 매핑
   * - req: fileName, fileType, fileSize 및 기타 메타데이터
   */
  const fetchUploadFileUrl = async (meta: Pick<FileMeta, 'fileName' | 'fileType' | 'fileSize'> & Partial<FileMeta>) => {
    return post<FileUploadResponse>('/repository/saveDocumentFile.do', meta)
  }

  /**
   * 보기용 Presigned URL 발급
   * - RepositoryController.viewDocumentFile(FileVO req)에 매핑
   * - 문서셋 첨부: docId + docFileId / 파일 저장소 단일: docFileId만으로 docId 생략 가능
   */
  const fetchViewFileUrl = async (docId: string, docFileId: string) => {
    return post<FileUrlResponse>('/repository/viewDocumentFile.do', { docId: docId ?? '', docFileId })
  }

  /**
   * 다운로드용 Presigned URL 발급
   * - RepositoryController.downloadDocumentFile(FileVO req)에 매핑
   */
  const fetchDownloadFileUrl = async (docId: string, docFileId?: string) => {
    return post<FileDownloadResponse>('/repository/downloadDocumentFile.do', {
      docId,
      docFileId: docFileId ?? '',
    })
  }

  return {
    fetchUploadFileUrl,
    fetchViewFileUrl,
    fetchDownloadFileUrl,
  }
}

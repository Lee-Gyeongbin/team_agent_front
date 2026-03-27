import { useApi } from '~/composables/com/useApi'
import type {
  FileDeleteResponse,
  FileDownloadResponse,
  FileMeta,
  FileUploadResponse,
  FileUrlResponse,
} from '~/types/file'

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
  const fetchViewFileUrl = async (docId: string, docFileId: string) => {
    return post<FileUrlResponse>('/com/file/viewFile.do', { docId, docFileId })
  }

  /**
   * 다운로드용 Presigned URL 발급
   * - FileController.downloadFile(FileVO dataVO)에 매핑
   * - @RequestParam 기반이지만, 프론트에서는 쿼리스트링 GET 형태로 호출
   */
  const fetchDownloadFileUrl = async (docId: string, docFileId?: string) => {
    return post<FileDownloadResponse>('/com/file/downloadFile.do', {
      docId,
      docFileId: docFileId ?? '',
    })
  }

  /**
   * NCP Object Storage 객체 삭제
   * - FileController.deleteFile(FileVO) 등에 매핑
   * - deleteDocument.do(DB) 전에 호출해 저장소와 DB를 맞추는 용도
   */
  const fetchDeleteFile = async (docIdList: string[]) => {
    return post<FileDeleteResponse>('/com/file/deleteFile.do', { docIdList })
  }

  return {
    fetchUploadFileUrl,
    fetchViewFileUrl,
    fetchDownloadFileUrl,
    fetchDeleteFile,
  }
}

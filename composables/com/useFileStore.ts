import type { FileUploadRequest } from '~/types/file'
import { useFileApi } from '~/composables/com/useFileApi'

const { fetchUploadFileUrl, fetchViewFileUrl, fetchDownloadFileUrl, fetchDeleteFile } = useFileApi()

const isUploading = ref(false)
const uploadError = ref('')
const uploadedFilePath = ref<string | null>(null)

const viewUrl = ref<string | null>(null)
const downloadUrl = ref<string | null>(null)
const fileError = ref('')

export const useFileStore = () => {
  /**
   * 파일 업로드 (S3 Presigned URL 사용)
   * 1) /com/file/uploadFile.do 로 메타데이터 보내서 uploadUrl, filePath 수신
   * 2) 반환된 uploadUrl 로 실제 파일 PUT 업로드
   * 3) 성공 시 filePath 반환 (DB 저장 시 사용 가능)
   */
  const handleUploadFile = async (payload: FileUploadRequest): Promise<string | null> => {
    const { file, docTitle, categoryId, secLvl, keywords } = payload
    if (!file) return null

    isUploading.value = true
    uploadError.value = ''
    uploadedFilePath.value = null

    try {
      // 1) Presigned URL 발급
      const meta = {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: String(file.size),
        docTitle,
        categoryId,
        secLvl,
        keywords,
      }

      const { uploadUrl, filePath } = await fetchUploadFileUrl(meta)

      // 2) S3로 실제 파일 업로드
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error('파일 업로드에 실패했습니다.')
      }

      uploadedFilePath.value = filePath
      return filePath
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      openToast({ message: message, type: 'error' })
      uploadError.value = message
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 파일 보기용 URL 조회 (PDF 뷰어 등에서 사용)
   * - ChatPdfPanel.vue에서는 docId 기준으로 호출 후, 반환된 URL을 그대로 사용하면 됨.
   */
  const handleViewFileUrl = async (docId: string): Promise<string | null> => {
    fileError.value = ''
    viewUrl.value = null
    try {
      const { url } = await fetchViewFileUrl(docId)
      viewUrl.value = url
      return url
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 보기 URL을 가져오는데 실패했습니다.'
      fileError.value = message
      return null
    }
  }

  /**
   * 파일 다운로드
   * - 반환된 URL을 a 태그 클릭 등으로 바로 다운로드 트리거.
   */
  const onDownloadFile = async (docId: string) => {
    const url = await handleDownloadFile(docId)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  /**
   * 파일 다운로드용 URL 조회
   * - 반환된 URL을 a 태그 클릭 등으로 바로 다운로드 트리거.
   */
  const handleDownloadFile = async (docId: string): Promise<string | null> => {
    fileError.value = ''
    downloadUrl.value = null
    try {
      const { url } = await fetchDownloadFileUrl(docId)
      downloadUrl.value = url
      return url
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 다운로드 URL을 가져오는데 실패했습니다.'
      fileError.value = message
      return null
    }
  }

  /**
   * NCP(객체 저장소)에 올라간 파일 객체 삭제
   * - docId 목록으로 백엔드가 버킷 객체 삭제 처리
   * - 성공 시 true, 실패 시 false (fileError에 사유)
   */
  const handleDeleteNcpFile = async (docIds: string[]): Promise<boolean> => {
    if (docIds.length === 0) return true
    fileError.value = ''
    try {
      const res = await fetchDeleteFile(docIds)
      if (res.successYn === false) {
        fileError.value = '저장소에서 파일 삭제에 실패했습니다.'
        return false
      }
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장소 파일 삭제 중 오류가 발생했습니다.'
      fileError.value = message
      return false
    }
  }

  return {
    // 상태
    isUploading,
    uploadError,
    uploadedFilePath,
    viewUrl,
    downloadUrl,
    fileError,
    // 액션
    onDownloadFile,
    handleUploadFile,
    handleViewFileUrl,
    handleDownloadFile,
    handleDeleteNcpFile,
  }
}

import type { FileDownloadResponse } from '~/types/file'
import { useFileApi } from '~/composables/com/useFileApi'

const { fetchViewFileUrl, fetchDownloadFileUrl } = useFileApi()

const viewUrl = ref<string | null>(null)
const downloadUrl = ref<string | null>(null)
const fileError = ref('')

export const useFileStore = () => {
  /**
   * NCP Presigned URL로 실제 파일 PUT 업로드 (공통).
   */
  const handleUploadByPresignedUrl = async (uploadUrl: string, file: File): Promise<boolean> => {
    if (!uploadUrl || !file) return false
    try {
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

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      openToast({ message: message, type: 'error' })
      return false
    }
  }

  /**
   * 파일 보기용 URL 조회 (PDF 뷰어 등에서 사용)
   * - ChatPdfPanel.vue에서는 docId 기준으로 호출 후, 반환된 URL을 그대로 사용하면 됨.
   */
  const handleViewFileUrl = async (docId: string, docFileId: string): Promise<string | null> => {
    fileError.value = ''
    viewUrl.value = null
    try {
      const { url, reason } = await fetchViewFileUrl(docId, docFileId)
      if (reason) {
        fileError.value = reason
        return null
      }
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
  const triggerDownloadByUrl = (url: string) => {
    // 연속 다운로드 시 a.click()은 브라우저 정책(자동 다운로드/사용자 제스처 제한)으로 누락될 수 있어
    // iframe src 교체 방식으로 다운로드 트리거를 안정화한다.
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    window.setTimeout(() => {
      iframe.remove()
    }, 3000)
  }

  const onDownloadFile = async (docId: string, docFileId?: string) => {
    const res = await handleDownloadFile(docId, docFileId)
    if (!res) return
    const singleUrl = String(res.url ?? '').trim()
    if (singleUrl) {
      triggerDownloadByUrl(singleUrl)
      return
    }

    const list = Array.isArray(res.downloadList) ? res.downloadList : []
    for (let i = 0; i < list.length; i++) {
      const url = String(list[i]?.url ?? '').trim()
      if (!url) continue
      triggerDownloadByUrl(url)
      if (i < list.length - 1) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }
  }

  /**
   * 파일 다운로드용 URL 조회
   * - 반환된 URL을 a 태그 클릭 등으로 바로 다운로드 트리거.
   */
  const handleDownloadFile = async (docId: string, docFileId?: string): Promise<FileDownloadResponse | null> => {
    fileError.value = ''
    downloadUrl.value = null
    try {
      const res = await fetchDownloadFileUrl(docId, docFileId)
      if (res.url) downloadUrl.value = res.url
      return res
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 다운로드 URL을 가져오는데 실패했습니다.'
      fileError.value = message
      return null
    }
  }

  return {
    // 상태
    viewUrl,
    downloadUrl,
    fileError,
    // 액션
    onDownloadFile,
    handleUploadByPresignedUrl,
    handleViewFileUrl,
    handleDownloadFile,
  }
}

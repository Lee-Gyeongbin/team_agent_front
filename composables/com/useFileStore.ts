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
   */
  const handleViewFileUrl = async (docFileId: string): Promise<string | null> => {
    fileError.value = ''
    viewUrl.value = null
    try {
      const { url, reason } = await fetchViewFileUrl(docFileId)
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
   */
  const triggerDownloadByUrl = (url: string) => {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)
    window.setTimeout(() => {
      iframe.remove()
    }, 3000)
  }

  const onDownloadFile = async (docFileId: string) => {
    const res = await handleDownloadFile(docFileId)
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
   */
  const handleDownloadFile = async (docFileId: string): Promise<FileDownloadResponse | null> => {
    fileError.value = ''
    downloadUrl.value = null
    try {
      const res = await fetchDownloadFileUrl(docFileId)
      if (res.url) downloadUrl.value = res.url
      return res
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 다운로드 URL을 가져오는데 실패했습니다.'
      fileError.value = message
      return null
    }
  }

  return {
    viewUrl,
    downloadUrl,
    fileError,
    onDownloadFile,
    handleUploadByPresignedUrl,
    handleViewFileUrl,
    handleDownloadFile,
  }
}

import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { useMarketingFileStore } from '~/composables/marketing/useMarketingFileStore'
import { useMarketingPageState } from '~/composables/marketing/useMarketingPageState'
import type { MarketingFile } from '~/types/marketing'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'

const { fetchSelectMarketingFileList, fetchDeleteMarketingFile, fetchUpdateMarketingFile } = useMarketingApi()
const { handleUploadMarketingFile } = useMarketingFileStore()

// ===== 상태 (프로젝트 참고 파일 목록) =====
export const projectFiles = ref<MarketingFile[]>([])

/** 업로드 응답 + 원본 File → 목록에 낙관적으로 추가할 MarketingFile 항목 */
export const toUploadedMarketingFile = (
  res: { marketingFileId: string; filePath: string; fileName: string },
  file: File,
  projectId: string,
): MarketingFile => ({
  marketingFileId: res.marketingFileId,
  marketingProjectId: projectId,
  filePath: res.filePath,
  fileName: res.fileName,
  fileSize: file.size,
  fileType: getChatAttachmentExtension(file.name),
  createDt: '',
})

export const useMarketingProjectFilesStore = () => {
  const { marketingProjectId } = useMarketingPageState()

  const handleSelectProjectFiles = async (projectId = marketingProjectId.value) => {
    const id = String(projectId).trim()
    if (!id) {
      projectFiles.value = []
      return
    }
    try {
      const response = await fetchSelectMarketingFileList(id)
      projectFiles.value = response.list ?? []
    } catch {
      projectFiles.value = []
    }
  }

  const handleRemoveProjectFile = async (marketingFileId: string) => {
    const target = projectFiles.value.find((file) => file.marketingFileId === marketingFileId)
    const confirmed = await openConfirm({
      title: '참고 파일 삭제',
      message: `'${target?.fileName ?? '선택한 파일'}'을(를) 삭제할까요?\n삭제 후 복구할 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!confirmed) return

    try {
      const res = await fetchDeleteMarketingFile(marketingFileId)
      if (res.result !== 'OK') throw new Error('마케팅 참고 파일 삭제 실패')
      projectFiles.value = projectFiles.value.filter((file) => file.marketingFileId !== marketingFileId)
      openToast({ message: '참고 파일을 삭제했습니다.' })
    } catch {
      openToast({ message: '참고 파일 삭제에 실패했습니다.', type: 'error' })
    }
  }

  const handleRenameProjectFile = async (marketingFileId: string, fileName: string) => {
    const trimmed = fileName.trim()
    if (!trimmed) {
      openToast({ message: '파일명을 입력해주세요.', type: 'warning' })
      return false
    }

    const target = projectFiles.value.find((file) => file.marketingFileId === marketingFileId)
    if (!target || target.fileName.trim() === trimmed) return true

    try {
      const res = await fetchUpdateMarketingFile({ marketingFileId, fileName: trimmed })
      if (res.result !== 'OK') throw new Error('마케팅 참고 파일명 수정 실패')
      projectFiles.value = projectFiles.value.map((file) =>
        file.marketingFileId === marketingFileId ? { ...file, fileName: trimmed } : file,
      )
      openToast({ message: '파일명을 변경했습니다.' })
      return true
    } catch {
      openToast({ message: '파일명 변경에 실패했습니다.', type: 'error' })
      return false
    }
  }

  const handleUploadProjectFiles = async (files: File[]) => {
    const id = marketingProjectId.value
    if (!id || files.length === 0) return
    for (const file of files) {
      try {
        const res = await handleUploadMarketingFile(file, id)
        if (!res || res.result !== 'OK') {
          openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
          continue
        }
        projectFiles.value = [...projectFiles.value, toUploadedMarketingFile(res, file, id)]
      } catch {
        openToast({ message: `${file.name} 업로드에 실패했습니다.`, type: 'error' })
      }
    }
  }

  return {
    projectFiles,
    handleSelectProjectFiles,
    handleRemoveProjectFile,
    handleRenameProjectFile,
    handleUploadProjectFiles,
  }
}

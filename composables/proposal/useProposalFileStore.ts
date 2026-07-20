import type { PtFilePurposeCd, PtFileSaveResponse } from '~/types/proposal'
import { useFileStore } from '~/composables/com/useFileStore'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { formatChatStoreFileNameBase } from '~/utils/global/dateUtil'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'

const { fetchCreatePtFileUploadUrl, fetchSavePtFile } = useProposalApi()

/** NCP/DB 저장 파일명: yyyyMMddHHmmssSSS + 확장자 */
const buildStoreFileName = (originalName: string, at: Date): string => {
  const ext = getChatAttachmentExtension(originalName)
  const base = formatChatStoreFileNameBase(at)
  return ext ? `${base}.${ext}` : base
}

const buildPtFileStorePath = (userId: string, ptProjectId: string | undefined, storeFileName: string): string => {
  const safeUser = String(userId ?? '').trim() || 'unknown'
  const safeProject = String(ptProjectId ?? '').trim() || 'draft'
  const safeName = String(storeFileName ?? '').trim()
  return `proposal/${safeUser}/${safeProject}/${safeName}`
}

const toPtFileSaveResult = (
  saved: PtFileSaveResponse,
  fallback: { fileNm: string; filePath: string },
): PtFileSaveResponse => {
  const ptFileId = String(saved.ptFileId ?? '').trim()
  if (!ptFileId) {
    throw new Error('PT 파일 저장 결과에 ptFileId가 없습니다.')
  }
  return {
    result: String(saved.result ?? 'OK'),
    ptFileId,
    filePath: String(saved.filePath ?? fallback.filePath),
    fileNm: String(saved.fileNm ?? fallback.fileNm),
  }
}

export const useProposalFileStore = () => {
  const { user } = useAuth()
  const { handleUploadByPresignedUrl } = useFileStore()

  /**
   * PT 파일 업로드: presign → NCP PUT → TB_PT_FILE 저장
   * @param file          업로드 파일
   * @param filePurposeCd PT000011 코드값
   * @param ptProjectId   프로젝트 ID (생성 전이면 생략)
   */
  const handleUploadPtFile = async (
    file: File,
    filePurposeCd: PtFilePurposeCd,
    ptProjectId?: string,
  ): Promise<PtFileSaveResponse | null> => {
    const resolvedUserId = String(user.value?.userId ?? '').trim()
    if (!resolvedUserId) {
      openToast({ message: '파일 업로드를 위한 사용자 정보가 없습니다.', type: 'error' })
      return null
    }

    const at = new Date()
    const storeFileName = buildStoreFileName(file.name, at)
    const storeFilePath = buildPtFileStorePath(resolvedUserId, ptProjectId, storeFileName)

    const presign = await fetchCreatePtFileUploadUrl({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: String(file.size),
      filePath: storeFilePath,
      filePurposeCd,
      ...(ptProjectId ? { ptProjectId } : {}),
    })

    const uploadUrl = String(presign.uploadUrl ?? '').trim()
    const filePath = String(presign.filePath ?? '').trim()
    if (!uploadUrl || !filePath) {
      openToast({ message: `업로드 URL 발급 실패: ${file.name}`, type: 'error' })
      return null
    }

    const uploaded = await handleUploadByPresignedUrl(uploadUrl, file)
    if (!uploaded) {
      openToast({ message: `NCP 업로드 실패: ${file.name}`, type: 'error' })
      return null
    }

    const payload = {
      filePurposeCd,
      fileName: file.name,
      storeFileName,
      filePath,
      fileSize: Number(file.size),
      fileType: getChatAttachmentExtension(file.name),
      mimeType: file.type || 'application/octet-stream',
      ...(ptProjectId ? { ptProjectId } : {}),
    }

    const res = await fetchSavePtFile(payload)
    return toPtFileSaveResult(res, { fileNm: file.name, filePath })
  }

  return { handleUploadPtFile }
}

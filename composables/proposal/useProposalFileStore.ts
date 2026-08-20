import type { PtFilePurposeCd, PtFileSaveResponse } from '~/types/proposal'
import { useAuth } from '~/composables/com/useAuth'
import { useFileStore } from '~/composables/com/useFileStore'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'
import { formatChatStoreFileNameBase } from '~/utils/global/dateUtil'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'

const { fetchCreatePtFileUploadUrl, fetchSavePtFile, fetchDownloadPtFile } = useProposalApi()

/** PtFilePurposeCd → NCP 하위 디렉터리 이름 */
const PURPOSE_CD_DIR: Record<PtFilePurposeCd, string> = {
  '001': 'rfp',
  '002': 'evaluation',
  '003': 'template',
  '004': 'reference',
  '005': 'company',
  '006': 'competitor',
}

/** NCP/DB 저장 파일명: yyyyMMddHHmmssSSS + 확장자 */
const buildStoreFileName = (originalName: string, at: Date): string => {
  const ext = getChatAttachmentExtension(originalName)
  const base = formatChatStoreFileNameBase(at)
  return ext ? `${base}.${ext}` : base
}

/** NCP 저장 경로: proposal/{ptProjectId}/{fileType}/{storeFileName} */
const buildPtFileStorePath = (ptProjectId: string | undefined, filePurposeCd: PtFilePurposeCd, storeFileName: string): string => {
  const safeProject = String(ptProjectId ?? '').trim() || 'draft'
  const safeName = String(storeFileName ?? '').trim()
  const typeDir = PURPOSE_CD_DIR[filePurposeCd] ?? 'files'
  return `proposal/${safeProject}/${typeDir}/${safeName}`
}

const toPtFileSaveResult = (
  saved: PtFileSaveResponse,
  fallback: { fileName: string; filePath: string },
): PtFileSaveResponse => {
  const ptFileId = String(saved.ptFileId ?? '').trim()
  if (!ptFileId) {
    throw new Error('PT 파일 저장 결과에 ptFileId가 없습니다.')
  }
  return {
    result: String(saved.result ?? 'OK'),
    ptFileId,
    filePath: String(saved.filePath ?? fallback.filePath),
    fileName: String(saved.fileName ?? fallback.fileName),
  }
}

export const useProposalFileStore = () => {
  const { user } = useAuth()
  const { handleUploadByPresignedUrl, handleDownloadByUrl } = useFileStore()

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
    const storeFilePath = buildPtFileStorePath(ptProjectId, filePurposeCd, storeFileName)

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
    return toPtFileSaveResult(res, { fileName: file.name, filePath })
  }

  /**
   * PT 파일 다운로드: presigned URL 조회 후 공통 다운로드 트리거
   */
  const handleDownloadPtFile = async (ptFileId: string): Promise<boolean> => {
    const id = String(ptFileId ?? '').trim()
    if (!id) {
      openToast({ message: '다운로드할 파일 정보가 없습니다.', type: 'warning' })
      return false
    }

    try {
      const res = await fetchDownloadPtFile(id)
      const url = String(res.url ?? res.downloadUrl ?? '').trim()
      if (!url) {
        openToast({
          message: res.reason || '파일 다운로드 URL을 가져오는데 실패했습니다.',
          type: 'error',
        })
        return false
      }
      return handleDownloadByUrl(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : '파일 다운로드에 실패했습니다.'
      openToast({ message, type: 'error' })
      return false
    }
  }

  return { handleUploadPtFile, handleDownloadPtFile }
}

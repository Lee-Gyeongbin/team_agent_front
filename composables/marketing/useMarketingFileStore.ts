import type { MarketingFileSaveResponse } from '~/types/marketing'
import { useFileStore } from '~/composables/com/useFileStore'
import { useMarketingApi } from '~/composables/marketing/useMarketingApi'
import { formatChatStoreFileNameBase } from '~/utils/global/dateUtil'
import { getChatAttachmentExtension } from '~/utils/chat/chatAttachmentDisplayUtil'

const { fetchCreateMarketingFileUploadUrl, fetchSaveMarketingFile } = useMarketingApi()

/** NCP/DB 저장 파일명: yyyyMMddHHmmssSSS + 확장자 */
const buildStoreFileName = (originalName: string, at: Date): string => {
  const ext = getChatAttachmentExtension(originalName)
  const base = formatChatStoreFileNameBase(at)
  return ext ? `${base}.${ext}` : base
}

const buildMarketingFileStorePath = (
  userId: string,
  marketingProjectId: string | undefined,
  storeFileName: string,
): string => {
  const safeUser = String(userId ?? '').trim() || 'unknown'
  const safeProject = String(marketingProjectId ?? '').trim() || 'draft'
  const safeName = String(storeFileName ?? '').trim()
  return `marketing/${safeUser}/${safeProject}/${safeName}`
}

const toMarketingFileSaveResult = (
  saved: MarketingFileSaveResponse,
  fallback: { fileName: string; filePath: string },
): MarketingFileSaveResponse => {
  const marketingFileId = String(saved.marketingFileId ?? '').trim()
  if (!marketingFileId) {
    throw new Error('마케팅 파일 저장 결과에 marketingFileId가 없습니다.')
  }
  return {
    successYn: saved.successYn,
    returnMsg: saved.returnMsg,
    marketingFileId,
    filePath: String(saved.filePath ?? fallback.filePath),
    fileName: String(saved.fileName ?? fallback.fileName),
  }
}

export const useMarketingFileStore = () => {
  const { user } = useAuth()
  const { handleUploadByPresignedUrl } = useFileStore()

  /**
   * 마케팅 파일 업로드: presign → NCP PUT → 메타 저장
   * 실패 토스트는 호출부(스토어)에서 파일명·맥락에 맞게 띄운다 — 여기선 null만 반환한다.
   * @param file                업로드 파일
   * @param marketingProjectId  프로젝트 ID (생성 전이면 생략)
   */
  const handleUploadMarketingFile = async (
    file: File,
    marketingProjectId?: string,
  ): Promise<MarketingFileSaveResponse | null> => {
    const resolvedUserId = String(user.value?.userId ?? '').trim()
    if (!resolvedUserId) {
      return null
    }

    const at = new Date()
    const storeFileName = buildStoreFileName(file.name, at)
    const storeFilePath = buildMarketingFileStorePath(resolvedUserId, marketingProjectId, storeFileName)

    const presign = await fetchCreateMarketingFileUploadUrl({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: String(file.size),
      filePath: storeFilePath,
      ...(marketingProjectId ? { marketingProjectId } : {}),
    })

    const uploadUrl = String(presign.uploadUrl ?? '').trim()
    const filePath = String(presign.filePath ?? '').trim()
    if (!uploadUrl || !filePath) {
      return null
    }

    const uploaded = await handleUploadByPresignedUrl(uploadUrl, file)
    if (!uploaded) {
      return null
    }

    const payload = {
      fileName: file.name,
      storeFileName,
      filePath,
      fileSize: Number(file.size),
      fileType: getChatAttachmentExtension(file.name),
      mimeType: file.type || 'application/octet-stream',
      ...(marketingProjectId ? { marketingProjectId } : {}),
    }

    const res = await fetchSaveMarketingFile(payload)
    return toMarketingFileSaveResult(res, { fileName: file.name, filePath })
  }

  return { handleUploadMarketingFile }
}

import type { ChatAttachmentMeta, ChatFileSavePayload, ChatFileSaveResponse } from '~/types/chat'
import { useFileStore } from '~/composables/com/useFileStore'
import { formatChatStoreFileNameBase, formatYyyyMmDdFromDate } from '~/utils/global/dateUtil'

const { fetchCreateChatFile, fetchMarkChatFileOrphan } = useReportsApi()

const getFileExtension = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

/** NCP/DB 저장 파일명: yyyyMMddHHmmssSSS + 확장자 */
const buildStoreFileName = (originalName: string, at: Date): string => {
  const ext = getFileExtension(originalName)
  const base = formatChatStoreFileNameBase(at)
  return ext ? `${base}.${ext}` : base
}

const buildChatAttachmentStorePath = (userId: string, chatDateYmd: string, storeFileName: string): string => {
  const safeUser = String(userId ?? '').trim() || 'unknown'
  const safeDate = String(chatDateYmd ?? '').trim() || formatYyyyMmDdFromDate(new Date())
  const safeName = String(storeFileName ?? '').trim()
  return `temp/chat/${safeUser}/${safeDate}/${safeName}`
}

const toAttachmentMeta = (
  saved: ChatFileSaveResponse,
  fallback: Omit<ChatAttachmentMeta, 'chatFileId'>,
): ChatAttachmentMeta => {
  const chatFileId = String(saved.chatFileId ?? '').trim()
  if (!chatFileId) {
    throw new Error('첨부파일 저장 결과에 chatFileId가 없습니다.')
  }
  return {
    chatFileId,
    fileName: String(saved.fileName ?? fallback.fileName),
    filePath: String(saved.filePath ?? fallback.filePath),
    mimeType: String(saved.mimeType ?? fallback.mimeType),
  }
}

export const useChatAttachmentStore = () => {
  const { user } = useAuth()
  const { handleUploadFile } = useFileStore()

  /** 질문 전송 직전, 첨부 파일을 업로드하고 ws attachments 메타를 생성 */
  const handleUploadChatAttachments = async (files: File[], roomId: string): Promise<ChatAttachmentMeta[] | null> => {
    if (files.length === 0) return []
    const resolvedRoomId = String(roomId ?? '').trim()
    if (!resolvedRoomId) {
      openToast({ message: '첨부파일 업로드를 위한 채팅방 정보가 없습니다.', type: 'error' })
      return null
    }

    const resolvedUserId = String(user.value?.userId ?? '').trim()
    if (!resolvedUserId) {
      openToast({ message: '첨부파일 업로드를 위한 사용자 정보가 없습니다.', type: 'error' })
      return null
    }

    // 파일별 업로드 작업 병렬 실행
    const results = await Promise.allSettled(
      files.map(async (file): Promise<ChatAttachmentMeta> => {
        const at = new Date()
        const chatDateYmd = formatYyyyMmDdFromDate(at)
        const storeFileName = buildStoreFileName(file.name, at)
        const storeFilePath = buildChatAttachmentStorePath(resolvedUserId, chatDateYmd, storeFileName)

        const filePath = await handleUploadFile({ file, storeFileName, storeFilePath })
        if (!filePath) throw new Error(`NCP 업로드 실패: ${file.name}`)

        const payload: ChatFileSavePayload = {
          roomId: resolvedRoomId,
          fileName: file.name,
          storeFileName,
          filePath,
          fileSize: Number(file.size),
          fileType: getFileExtension(file.name),
          mimeType: file.type || 'application/octet-stream',
        }

        const res = await fetchCreateChatFile(payload)
        return toAttachmentMeta(res, {
          fileName: payload.fileName,
          filePath: payload.filePath,
          mimeType: payload.mimeType,
        })
      }),
    )

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<ChatAttachmentMeta> => r.status === 'fulfilled')
      .map((r) => r.value)

    const hasFailed = results.some((r) => r.status === 'rejected')

    if (hasFailed) {
      // 성공한 파일들도 질문 로그와 연결되지 않으므로 orphan 처리
      if (succeeded.length > 0) {
        await fetchMarkChatFileOrphan(succeeded.map((item) => item.chatFileId))
      }
      openToast({ message: '첨부파일 업로드에 실패했습니다.', type: 'error' })
      return null
    }

    return succeeded
  }

  /**
   * ws 전송 실패 등으로 질문 로그와 연결되지 못한 첨부를 orphan 상태로 표시한다.
   *
   * orphan:
   * - NCP 업로드 + tb_chat_file 저장은 성공
   * - 하지만 질문 전송 실패로 LOG_ID가 비어 있는 상태
   * - 배치 정리 대상으로 분류
   */
  const handleMarkChatAttachmentsOrphan = async (attachments: ChatAttachmentMeta[]) => {
    const chatFileIdList = attachments.map((item) => String(item.chatFileId ?? '').trim()).filter(Boolean)
    if (chatFileIdList.length === 0) return
    await fetchMarkChatFileOrphan(chatFileIdList)
  }

  return { handleUploadChatAttachments, handleMarkChatAttachmentsOrphan }
}

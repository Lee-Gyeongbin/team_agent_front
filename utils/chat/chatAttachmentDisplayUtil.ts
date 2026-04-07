import type { ChatAttachmentMeta, ChatLogListRow, ChatMessageAttachment } from '~/types/chat'

/** 채팅 메시지 첨부 표시용 (파일명·확장자·아이콘) */

const IMAGE_EXTENSION_SET = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])

export const getChatAttachmentExtension = (fileName: string): string => {
  const trimmed = fileName.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot < 0 || lastDot === trimmed.length - 1) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

export const isImageAttachmentExtension = (ext: string): boolean => IMAGE_EXTENSION_SET.has(ext)

/** 비이미지 첨부 패널에 쓰는 아이콘 클래스 (mask 아이콘) */
export const getChatFileIconClass = (fileName: string): string => {
  const ext = getChatAttachmentExtension(fileName)
  if (ext === 'pdf') return 'icon-file-pdf'
  if (ext === 'doc' || ext === 'docx') return 'icon-file-doc'
  if (ext === 'txt' || ext === 'csv') return 'icon-file-txt'
  if (ext === 'ppt' || ext === 'pptx') return 'icon-document'
  if (ext === 'xls' || ext === 'xlsx') return 'icon-document'
  return 'icon-document'
}

/** 파일 타입 라벨 (패널 2번째 줄) */
export const getChatFileTypeLabel = (fileName: string): string => {
  const ext = getChatAttachmentExtension(fileName)
  return ext ? ext.toUpperCase() : 'FILE'
}

/**
 * 업로드 직후 질문 메시지에 붙일 첨부 표시용 메타 생성
 * - 이미지는 blob URL로 썸네일·모달에 즉시 사용 (새로고침 시 소멸)
 */
export const buildMessageAttachmentsFromUpload = (
  files: File[],
  uploaded: ChatAttachmentMeta[],
): ChatMessageAttachment[] => {
  return uploaded.map((meta, i) => {
    const file = files[i]
    const ext = getChatAttachmentExtension(meta.fileName)
    const isImage = isImageAttachmentExtension(ext)
    return {
      ...meta,
      localPreviewUrl: isImage && file ? URL.createObjectURL(file) : undefined,
    }
  })
}

const guessMimeFromFileName = (fileName: string): string => {
  const ext = getChatAttachmentExtension(fileName)
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'pdf') return 'application/pdf'
  return ''
}

const normalizeChatAttachmentItems = (items: unknown[]): ChatMessageAttachment[] => {
  const out: ChatMessageAttachment[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const chatFileId = String(o.chatFileId ?? '').trim()
    const fileName = String(o.fileName ?? '').trim()
    if (!chatFileId || !fileName) continue
    let mimeType = String(o.mimeType ?? '').trim()
    if (!mimeType) mimeType = guessMimeFromFileName(fileName)
    out.push({
      chatFileId,
      fileName,
      filePath: String(o.filePath ?? '').trim(),
      mimeType,
    })
  }
  return out
}

/** selectChatLogList 응답 행 → 질문 메시지용 첨부 배열 */
export const parseChatAttachmentsFromLogRow = (row: ChatLogListRow): ChatMessageAttachment[] | undefined => {
  const raw = row.chatAttachmentList
  if (raw == null) return undefined
  if (Array.isArray(raw)) {
    const list = normalizeChatAttachmentItems(raw)
    return list.length > 0 ? list : undefined
  }
  if (typeof raw !== 'string') return undefined
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '[]') return undefined
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!Array.isArray(parsed)) return undefined
    const list = normalizeChatAttachmentItems(parsed)
    return list.length > 0 ? list : undefined
  } catch {
    return undefined
  }
}

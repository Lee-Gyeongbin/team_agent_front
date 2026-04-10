import type { ChatAttachmentMeta, ChatMessageAttachment } from '~/types/chat'
import { useChatMessages } from '~/composables/chat/useChatMessages'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatAttachmentStore } from '~/composables/chat/useChatAttachmentStore'
import { buildQuestionPayload } from '~/utils/chat/chatSocketPayloadUtil'
import { buildMessageAttachmentsFromUpload } from '~/utils/chat/chatAttachmentDisplayUtil'

const { messages, pushQuestionMessage, pushAnswerPlaceholder } = useChatMessages()
const { ensureWebSocketAndSend } = useChatSocket()
const { handleUploadChatAttachments, handleMarkChatAttachmentsOrphan } = useChatAttachmentStore()

/**
 * 메시지 전송 파이프라인 — onSend, createChatRoom, onRegenerate 공통 사용
 *
 * 1. 첨부 업로드 (있을 경우)
 * 2. UI용 첨부 메타 생성
 * 3. question + answer placeholder 메시지 push
 * 4. WebSocket 전송
 * 5. 실패 시 orphan 처리
 */
export interface SendPipelineParams {
  content: string
  roomId: string
  svcTy: string
  modelId: string
  refId: string
  agentId: string
  files?: File[]
  /** 전송 전 기존 메시지를 모두 비울지 (채팅방 신규 생성 시 true) */
  clearMessagesBefore?: boolean
}

const buildAttachmentsForUi = (
  files: File[],
  attachments: ChatAttachmentMeta[],
): ChatMessageAttachment[] | undefined => {
  if (attachments.length === 0) return undefined
  if (files.length === attachments.length) {
    return buildMessageAttachmentsFromUpload(files, attachments)
  }
  return attachments.map((a) => ({ ...a }))
}

/**
 * 메시지 전송 파이프라인 실행
 * @param params - 전송 파이프라인 파라미터
 * @returns 전송 성공 여부
 * @description
 * 1. 첨부 업로드 (있을 경우)
 * 2. UI용 첨부 메타 생성
 * 3. question + answer placeholder 메시지 push
 * 4. WebSocket 전송
 * 5. 실패 시 orphan 처리
 */
const executeSendPipeline = async (params: SendPipelineParams): Promise<boolean> => {
  const { content, roomId, svcTy, modelId, refId, agentId, files = [], clearMessagesBefore = false } = params

  let attachments: ChatAttachmentMeta[] = []
  if (files.length > 0) {
    const uploaded = await handleUploadChatAttachments(files, roomId)
    if (uploaded === null) return false
    attachments = uploaded
  }

  const attachmentsForUi = buildAttachmentsForUi(files, attachments)

  if (clearMessagesBefore) messages.value = []

  pushQuestionMessage(content, svcTy, modelId, refId, agentId, attachmentsForUi)
  pushAnswerPlaceholder(svcTy, modelId, refId, agentId)

  const sent = await ensureWebSocketAndSend(
    buildQuestionPayload({ query: content, threadId: roomId, svcTy, modelId, refId, agentId, attachments }),
  )

  if (!sent && attachments.length > 0) {
    await handleMarkChatAttachmentsOrphan(attachments)
  }

  return sent
}

export const useChatSendPipeline = () => ({ executeSendPipeline })

import type { ChatAttachmentMeta, ChatSocketPayload } from '~/types/chat'

interface BuildQuestionPayloadParams {
  query: string
  threadId: string
  svcTy: string
  modelId: string
  refId: string
  agentId?: string
  attachments?: ChatAttachmentMeta[]
}

/** question 소켓 payload 조립을 한 곳에서 관리 */
export const buildQuestionPayload = (params: BuildQuestionPayloadParams): ChatSocketPayload => {
  const attachments = Array.isArray(params.attachments) ? params.attachments : []
  return {
    type: 'question',
    query: params.query,
    threadId: params.threadId,
    svcTy: params.svcTy,
    modelId: params.modelId,
    refId: params.refId,
    agentId: params.agentId,
    attachments,
  }
}

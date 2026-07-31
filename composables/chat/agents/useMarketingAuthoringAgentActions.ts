import type { MarketingAuthoringSubmitPayload } from '~/types/chat'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { chatIndexAgents, handleSelectChatIndexAgents } from '~/composables/chat/useChatAgentRegistry'
import {
  buildMarketingAuthoringPrompt,
  buildMarketingImagePrompt,
  createMarketingAuthoringCardMessage,
  linkMarketingAuthoringMessagePair,
  parseMarketingAuthoringConfigFromAgent,
  useMarketingAuthoring,
} from '~/utils/chat/marketingAuthoringUtil'

const { messages } = useChatSocket()
const { isMarketingAgentVisible, openMarketingAgent, closeMarketingAgent, registerMarketingAuthoringRoom } =
  useMarketingAuthoring()
const { selectedChatAgentId, selectedModelOption, resolveSvcTy, buildRefIdForPayload } = useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

export const useMarketingAuthoringAgentActions = () => {
  const getSelectedMarketingAgent = () => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    return agent ? { agent, agentId } : null
  }

  const buildMarketingSubmitRequest = (payload: MarketingAuthoringSubmitPayload, agentId: string) => {
    const agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    const config = agent ? parseMarketingAuthoringConfigFromAgent(agent) : null
    if (!config && payload.mode === 'TEXT') {
      openToast({ message: '콘텐츠 작성·편집 설정을 불러올 수 없습니다.', type: 'warning' })
      return null
    }

    const prompt =
      payload.mode === 'IMAGE'
        ? buildMarketingImagePrompt(payload.data)
        : buildMarketingAuthoringPrompt(payload.data, config)
    const files =
      payload.mode === 'IMAGE'
        ? payload.data.referenceFiles
        : payload.data.referenceMode === 'FILE'
          ? payload.data.referenceFiles
          : []

    return { prompt, files, agentId }
  }

  const finalizeMarketingSubmit = () => {
    linkMarketingAuthoringMessagePair(messages.value)
    if (chatRoom.value.roomId) registerMarketingAuthoringRoom(chatRoom.value.roomId)
    selectedChatAgentId.value = null
    closeMarketingAgent()
  }

  /** /chat 인덱스에서 마케팅 폼 제출 — 새 방 생성. 작성 조건은 결과 카드 칩으로만 표시 */
  const handleIndexMarketingAuthoringSubmit = async (payload: MarketingAuthoringSubmitPayload): Promise<boolean> => {
    const selected = getSelectedMarketingAgent()
    if (!selected) return false

    const request = buildMarketingSubmitRequest(payload, selected.agentId)
    if (!request) return false

    const sent = await createChatRoom(request.prompt, request.files, 'C', {
      modelId: selectedModelOption.value,
      agentId: request.agentId,
    })
    if (sent) finalizeMarketingSubmit()
    return sent
  }

  /** 채팅방 인라인 마케팅 카드 제출 — 폼은 제거하고 결과 칩만 남김 */
  const handleRoomMarketingAuthoringSubmit = async (
    logId: string,
    payload: MarketingAuthoringSubmitPayload,
  ): Promise<boolean> => {
    if (!chatRoom.value.roomId) {
      return await handleIndexMarketingAuthoringSubmit(payload)
    }

    const card = messages.value.find((item) => item.type === 'marketingAuthoring' && item.logId === logId)
    const agentId = String(card?.agentId ?? selectedChatAgentId.value ?? '').trim()
    if (!agentId) return false

    const request = buildMarketingSubmitRequest(payload, agentId)
    if (!request) return false

    const sent = await executeSendPipeline({
      content: request.prompt,
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: request.agentId,
      files: request.files,
    })
    if (sent) {
      messages.value = messages.value.filter((item) => !(item.type === 'marketingAuthoring' && item.logId === logId))
      finalizeMarketingSubmit()
    }
    return sent
  }

  /** 채팅방 내 미제출 마케팅 카드가 없으면 추가 */
  const appendMarketingAuthoringCardIfNeeded = (agentId: string) => {
    if (!chatRoom.value.roomId) return
    const alreadyHasCard = messages.value.some((item) => item.type === 'marketingAuthoring')
    if (alreadyHasCard) return
    closeMarketingAgent()
    messages.value = [...messages.value, createMarketingAuthoringCardMessage(agentId)]
  }

  /** 결과 카드 '새로 만들기' — 이전 조건 복원 없이 새 에이전트 카드 시작 */
  const handleMarketingAuthoringReopen = async (logId: string) => {
    if (messages.value.some((item) => item.type === 'marketingAuthoring')) {
      return
    }

    const answer = messages.value.find((item) => item.type === 'answer' && item.logId === logId)
    const agentId = String(answer?.agentId ?? '').trim() || String(selectedChatAgentId.value ?? '').trim()

    if (!agentId) {
      openToast({ message: '에이전트 정보를 찾을 수 없습니다.', type: 'warning' })
      return
    }

    let agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    if (!agent) {
      await handleSelectChatIndexAgents()
      agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    }
    if (!agent) {
      openToast({ message: '에이전트 설정을 불러올 수 없습니다.', type: 'warning' })
      return
    }

    selectedChatAgentId.value = agent.agentId

    if (chatRoom.value.roomId) {
      appendMarketingAuthoringCardIfNeeded(agentId)
      return
    }

    await navigateTo('/chat')
    openMarketingAgent('select')
  }

  const handleCloseMarketingAuthoring = (logId?: string) => {
    selectedChatAgentId.value = null
    closeMarketingAgent()
    if (logId) {
      messages.value = messages.value.filter((item) => !(item.type === 'marketingAuthoring' && item.logId === logId))
    }
  }

  return {
    isMarketingAgentVisible,
    openMarketingAgent,
    handleIndexMarketingAuthoringSubmit,
    handleRoomMarketingAuthoringSubmit,
    appendMarketingAuthoringCardIfNeeded,
    handleMarketingAuthoringReopen,
    handleCloseMarketingAuthoring,
  }
}

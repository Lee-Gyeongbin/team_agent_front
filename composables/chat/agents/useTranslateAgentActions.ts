import type { TranslateFormPayload } from '~/types/chat'
import {
  parseTranslateConfigFromAgent,
  buildTranslatePrompt,
  buildTranslateFileInstruction,
  createTranslateCardMessage,
  createReadonlyTranslateMessage,
  useTranslateAgent,
} from '~/utils/chat/translateAgentUtil'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { chatIndexAgents } from '~/composables/chat/useChatAgentRegistry'

const { messages } = useChatSocket()
const { isTranslateVisible, openTranslateAgent, closeTranslateAgent, registerTranslateRoom } = useTranslateAgent()
const { isSearchModeMissingSubOptions, selectedChatAgentId, buildRefIdForPayload, selectedModelOption } =
  useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

export const useTranslateAgentActions = () => {
  /**
   * TRANSLATE 에이전트 닫기 — 인덱스 오버레이 + 채팅방 카드 모두 처리
   * @param logId - 제거할 translation 메시지 logId (채팅방 카드 닫기 시)
   */
  const handleCloseTranslateAgent = (logId?: string) => {
    selectedChatAgentId.value = null
    closeTranslateAgent()
    if (logId) {
      messages.value = messages.value.filter((m) => m.logId !== logId)
    }
  }

  /**
   * TRANSLATE 에이전트 폼 제출 → 합성 prompt 전송 → 번역 결과는 일반 answer로 표시
   */
  const onSendTranslate = async (
    content: string,
    formMessageLogId?: string,
    payload?: TranslateFormPayload,
    agentId?: string,
  ): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    if (formMessageLogId) {
      const formMsg = messages.value.find((m) => m.logId === formMessageLogId && m.type === 'translation')
      if (formMsg) {
        if (payload) formMsg.translateFormPayload = { ...payload }
        formMsg.translateSubmitted = true
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: 'W',
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: agentId ?? selectedChatAgentId.value ?? '',
      files: payload?.file ? [payload.file] : [],
    })

    if (sent) {
      const newMessages = messages.value.slice(prevLen)
      const newQuestion = newMessages.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true

      selectedChatAgentId.value = null
      if (chatRoom.value.roomId) registerTranslateRoom(chatRoom.value.roomId)
    }
    return sent
  }

  const handleSubmitTranslateAgentForm = async (logId: string, payload: TranslateFormPayload) => {
    if (!chatRoom.value.roomId) {
      return await handleIndexTranslateSubmit(payload)
    }

    const agent =
      chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ??
      chatIndexAgents.value.find((a) => messages.value.some((m) => m.logId === logId && m.agentId === a.agentId))
    if (!agent) return

    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return

    const content = payload.file
      ? buildTranslateFileInstruction(payload, config)
      : buildTranslatePrompt(payload, config)
    await onSendTranslate(content, logId, payload, agent.agentId)
  }

  /** index.vue에서 TRANSLATE 폼 제출 후 새 채팅방 진입 시 카드를 메시지 목록 앞에 주입 */
  const addInlineTranslateMessage = (payload: TranslateFormPayload, agentId: string) => {
    const roMsg = createReadonlyTranslateMessage(payload, {
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: 'C',
    })
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [roMsg, ...msgs]
  }

  /** /chat 인덱스에서 TRANSLATE 폼 제출 — 방 생성·인라인 주입·닫기 */
  const handleIndexTranslateSubmit = async (payload: TranslateFormPayload): Promise<boolean> => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((a) => a.agentId === agentId)
    if (!agent) return false

    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return false

    const content = payload.file
      ? buildTranslateFileInstruction(payload, config)
      : buildTranslatePrompt(payload, config)
    const sent = await createChatRoom(content, payload.file ? [payload.file] : [], 'W')
    if (sent) {
      addInlineTranslateMessage(payload, agentId)
      handleCloseTranslateAgent()
      if (chatRoom.value.roomId) registerTranslateRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 채팅방 내 미제출 TRANSLATE 카드가 없으면 추가 */
  const appendTranslateCardIfNeeded = (agent: Parameters<typeof parseTranslateConfigFromAgent>[0]) => {
    if (!chatRoom.value.roomId) return
    const alreadyHasCard = messages.value.some((m) => m.type === 'translation' && !m.translateSubmitted)
    if (alreadyHasCard) return
    const config = parseTranslateConfigFromAgent(agent)
    if (!config) return
    messages.value = [
      ...messages.value,
      createTranslateCardMessage({
        agentId: agent.agentId,
        createdAt: new Date().toISOString(),
        svcTy: 'C',
        config,
      }),
    ]
  }

  return {
    isTranslateVisible,
    openTranslateAgent,
    onSendTranslate,
    handleSubmitTranslateAgentForm,
    addInlineTranslateMessage,
    handleIndexTranslateSubmit,
    appendTranslateCardIfNeeded,
    handleCloseTranslateAgent,
  }
}

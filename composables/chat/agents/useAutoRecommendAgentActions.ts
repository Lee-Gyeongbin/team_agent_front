import {
  createAutoRecommendCardMessage,
  isAutoRecommendAgent,
  resolveAutoRecommendModelId,
  resolveAutoRecommendPrompt,
  useAutoRecommend,
} from '~/utils/chat/autoRecommendUtil'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { chatIndexAgents } from '~/composables/chat/useChatAgentRegistry'

const { messages } = useChatSocket()
const { isAutoRecommendVisible, registerAutoRecommendRoom } = useAutoRecommend()
const { isSearchModeMissingSubOptions, selectedChatAgentId, resolveSvcTy, buildRefIdForPayload, selectedModelOption } =
  useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

export const useAutoRecommendAgentActions = () => {
  const getSelectedAutoRecommendAgent = () =>
    chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value && isAutoRecommendAgent(a)) ?? null

  /** /chat 인덱스에서 AUTO_RECOMMEND 제출 후 readonly 카드를 메시지 목록 앞에 주입 */
  const addInlineAutoRecommendMessage = (agentId: string) => {
    const cardMsg = createAutoRecommendCardMessage({
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: 'C',
      submitted: true,
    })
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    messages.value = [cardMsg, ...msgs]
  }

  /**
   * AUTO_RECOMMEND 프롬프트 전송 — question 메시지를 화면에 노출하지 않는다.
   */
  const onSendAutoRecommend = async (content: string, cardMessageLogId?: string): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false
    const agent = getSelectedAutoRecommendAgent()
    if (!agent) {
      openToast({ message: '에이전트 설정을 불러오지 못했습니다. 다시 선택해 주세요.', type: 'warning' })
      return false
    }
    const agentId = agent.agentId

    if (cardMessageLogId) {
      const cardMsg = messages.value.find((m) => m.logId === cardMessageLogId && m.type === 'autoRecommend')
      if (cardMsg) cardMsg.autoRecommendSubmitted = true
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: resolveAutoRecommendModelId(agent, selectedModelOption.value),
      refId: buildRefIdForPayload(),
      agentId,
      files: [],
    })
    if (sent) {
      const newQuestion = messages.value.slice(prevLen).find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true
      registerAutoRecommendRoom(chatRoom.value.roomId)
      selectedChatAgentId.value = null
    }
    return sent
  }

  /** 메시지 목록 내 AUTO_RECOMMEND 카드 제출 */
  const onAutoRecommendMessageSubmit = async (logId: string): Promise<boolean> => {
    const agent = getSelectedAutoRecommendAgent()
    const prompt = resolveAutoRecommendPrompt(agent)
    if (!prompt) {
      openToast({ message: '에이전트 프롬프트가 설정되지 않았습니다.', type: 'warning' })
      return false
    }
    return await onSendAutoRecommend(prompt, logId)
  }

  /** /chat 인덱스·라우트 이탈 시 AUTO_RECOMMEND 오버레이·에이전트 선택 초기화 */
  const resetAutoRecommendPanel = () => {
    selectedChatAgentId.value = null
    isAutoRecommendVisible.value = false
  }

  /** /chat 인덱스에서 AUTO_RECOMMEND 제출(에이전트 클릭 즉시) — 방 생성·인라인 주입·등록·패널 초기화 */
  const handleIndexAutoRecommendSubmit = async (): Promise<boolean> => {
    const agent = getSelectedAutoRecommendAgent()
    if (!agent) return false
    const content = resolveAutoRecommendPrompt(agent)
    if (!content) {
      openToast({ message: '에이전트 프롬프트가 설정되지 않았습니다.', type: 'warning' })
      return false
    }
    const sent = await createChatRoom(content, [], undefined, {
      agentId: agent.agentId,
      modelId: resolveAutoRecommendModelId(agent, selectedModelOption.value),
    })
    if (sent) {
      addInlineAutoRecommendMessage(agent.agentId)
      registerAutoRecommendRoom(chatRoom.value.roomId)
      resetAutoRecommendPanel()
    }
    return sent
  }

  /** AUTO_RECOMMEND 인트로 종료 후 하단 에이전트 선택 해제(카드·메시지는 유지) */
  const handleAutoRecommendIntroEnd = () => {
    const selected = chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value)
    if (isAutoRecommendAgent(selected)) {
      selectedChatAgentId.value = null
    }
  }

  return {
    isAutoRecommendVisible,
    getSelectedAutoRecommendAgent,
    addInlineAutoRecommendMessage,
    onSendAutoRecommend,
    onAutoRecommendMessageSubmit,
    resetAutoRecommendPanel,
    handleIndexAutoRecommendSubmit,
    handleAutoRecommendIntroEnd,
  }
}

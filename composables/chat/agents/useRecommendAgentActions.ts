import type { RecommendFormPayload } from '~/types/chat'
import {
  parseRecommendConfigFromAgent,
  buildRecommendPrompt,
  createRecommendCardMessage,
  createRecommendResultCardMessage,
  createReadonlyRecommendMessage,
  useRecommendAgent,
} from '~/utils/chat/recommendAgentUtil'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { chatIndexAgents } from '~/composables/chat/useChatAgentRegistry'

const { messages } = useChatSocket()
const { isRecommendVisible, openRecommendAgent, closeRecommendAgent, registerRecommendRoom } = useRecommendAgent()
const { isSearchModeMissingSubOptions, selectedChatAgentId, resolveSvcTy, buildRefIdForPayload, selectedModelOption } =
  useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()

export const useRecommendAgentActions = () => {
  /**
   * RECOMMEND 에이전트 닫기 — 인덱스 오버레이 + 채팅방 카드 모두 처리
   * @param logId - 제거할 recommend 메시지 logId (채팅방 카드 닫기 시)
   */
  const handleCloseRecommendAgent = (logId?: string) => {
    selectedChatAgentId.value = null
    closeRecommendAgent()
    if (logId) {
      messages.value = messages.value.filter((m) => m.logId !== logId)
    }
  }

  /**
   * RECOMMEND 에이전트 폼 제출 → 프롬프트 전송 → result 카드 생성
   */
  const onSendRecommend = async (
    content: string,
    formMessageLogId?: string,
    payload?: RecommendFormPayload,
    agentId?: string,
  ): Promise<boolean> => {
    if (!content.trim() || isSearchModeMissingSubOptions.value || !chatRoom.value.roomId) return false

    if (formMessageLogId) {
      const formMsg = messages.value.find((m) => m.logId === formMessageLogId && m.type === 'recommend')
      if (formMsg) {
        if (payload) formMsg.recommendFormPayload = { ...payload }
        formMsg.recommendSubmitted = true
        formMsg.recommendCardRole = 'form'
      }
    }

    const prevLen = messages.value.length
    const sent = await executeSendPipeline({
      content: content.trim(),
      roomId: chatRoom.value.roomId,
      svcTy: resolveSvcTy(),
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: agentId ?? selectedChatAgentId.value ?? '',
      files: [],
    })

    if (sent) {
      const newMessages = messages.value.slice(prevLen)
      const newQuestion = newMessages.find((m) => m.type === 'question')
      if (newQuestion) newQuestion.hiddenFromDisplay = true

      const newAnswer = newMessages.find((m) => m.type === 'answer')
      if (newAnswer) {
        newAnswer.hiddenFromDisplay = true
        if (formMessageLogId) {
          const formIndex = messages.value.findIndex((m) => m.logId === formMessageLogId && m.type === 'recommend')
          const resultMsg = createRecommendResultCardMessage({
            answerLogId: newAnswer.logId,
            agentId: newAnswer.agentId ?? agentId ?? selectedChatAgentId.value ?? '',
            createdAt: newAnswer.createdAt,
            svcTy: newAnswer.svcTy,
            refId: newAnswer.refId,
          })
          if (formIndex >= 0) {
            messages.value.splice(formIndex + 1, 0, resultMsg)
          } else {
            messages.value.push(resultMsg)
          }
        }
      }
      selectedChatAgentId.value = null
      if (chatRoom.value.roomId) registerRecommendRoom(chatRoom.value.roomId)
    }
    return sent
  }

  const handleSubmitRecommendAgentForm = async (logId: string, payload: RecommendFormPayload) => {
    if (!chatRoom.value.roomId) {
      return await handleIndexRecommendSubmit(payload)
    }

    const agent =
      chatIndexAgents.value.find((a) => a.agentId === selectedChatAgentId.value) ??
      chatIndexAgents.value.find((a) => messages.value.some((m) => m.logId === logId && m.agentId === a.agentId))
    if (!agent) return

    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return

    const content = buildRecommendPrompt(payload, config)
    await onSendRecommend(content, logId, payload, agent.agentId)
  }

  /** 추천 완료 result 카드 — 새 추천 폼 카드 생성 */
  const handleRecommendAgentRetry = (resultMessageLogId: string): string | null => {
    if (messages.value.some((m) => m.type === 'recommend' && m.recommendSubmitted !== true)) return null

    const resultMsg = messages.value.find(
      (m) => m.logId === resultMessageLogId && m.type === 'recommend' && m.recommendCardRole === 'result',
    )
    if (!resultMsg) return null

    const agentId = String(resultMsg.agentId ?? '').trim()
    if (!agentId) return null

    const newMsg = createRecommendCardMessage({
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: resultMsg.svcTy,
      refId: resultMsg.refId,
    })
    messages.value = [...messages.value, newMsg]
    selectedChatAgentId.value = agentId
    return newMsg.logId
  }

  /** index.vue에서 RECOMMEND 폼 제출 후 새 채팅방 진입 시 카드를 메시지 목록 앞에 주입 */
  const addInlineRecommendMessage = (payload: RecommendFormPayload, agentId: string) => {
    const roMsg = createReadonlyRecommendMessage(payload, {
      agentId,
      createdAt: new Date().toISOString(),
      svcTy: 'C',
    })
    const msgs = [...messages.value]
    const firstQ = msgs.find((m) => m.type === 'question')
    if (firstQ) firstQ.hiddenFromDisplay = true
    const linkedAnswer =
      msgs.find((m) => m.type === 'answer' && m.isStreaming) ?? [...msgs].reverse().find((m) => m.type === 'answer')
    const prefix = [roMsg]
    if (linkedAnswer) {
      prefix.push(
        createRecommendResultCardMessage({
          answerLogId: linkedAnswer.logId,
          agentId: linkedAnswer.agentId ?? agentId,
          createdAt: linkedAnswer.createdAt,
          svcTy: linkedAnswer.svcTy,
          refId: linkedAnswer.refId,
        }),
      )
    }
    messages.value = [...prefix, ...msgs]
  }

  /** /chat 인덱스에서 RECOMMEND 폼 제출 — 방 생성·인라인 주입·닫기 */
  const handleIndexRecommendSubmit = async (payload: RecommendFormPayload): Promise<boolean> => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((a) => a.agentId === agentId)
    if (!agent) return false

    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return false

    const content = buildRecommendPrompt(payload, config)
    const sent = await createChatRoom(content)
    if (sent) {
      addInlineRecommendMessage(payload, agentId)
      handleCloseRecommendAgent()
      if (chatRoom.value.roomId) registerRecommendRoom(chatRoom.value.roomId)
    }
    return sent
  }

  /** 채팅방 내 미제출 RECOMMEND 카드가 없으면 추가 */
  const appendRecommendCardIfNeeded = (agent: Parameters<typeof parseRecommendConfigFromAgent>[0]) => {
    if (!chatRoom.value.roomId) return
    const alreadyHasCard = messages.value.some((m) => m.type === 'recommend' && !m.recommendSubmitted)
    if (alreadyHasCard) return
    const config = parseRecommendConfigFromAgent(agent)
    if (!config) return
    messages.value = [
      ...messages.value,
      createRecommendCardMessage({
        agentId: agent.agentId,
        createdAt: new Date().toISOString(),
        svcTy: 'C',
      }),
    ]
  }

  return {
    isRecommendVisible,
    openRecommendAgent,
    onSendRecommend,
    handleSubmitRecommendAgentForm,
    handleRecommendAgentRetry,
    addInlineRecommendMessage,
    handleIndexRecommendSubmit,
    appendRecommendCardIfNeeded,
    handleCloseRecommendAgent,
  }
}

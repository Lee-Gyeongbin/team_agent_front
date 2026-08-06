import type { MarketingAuthoringSubmitPayload } from '~/types/chat'
import { openToast } from '~/composables/useToast'
import { useChatSocket } from '~/composables/chat/useChatSocket'
import { useChatSearchState } from '~/composables/chat/useChatSearchState'
import { useChatSendPipeline } from '~/composables/chat/useChatSendPipeline'
import { useChatRooms } from '~/composables/chat/useChatRooms'
import { chatIndexAgents } from '~/composables/chat/useChatAgentRegistry'
import {
  registerMarketingRoomMode,
  registerMarketingRoomSummary,
  useMarketingAuthoring,
} from '~/composables/chat/useMarketingAuthoring'
import { MARKETING_AUTHORING_SVC_TY } from '~/utils/agent/marketingAuthoringConfigUtil'
import {
  buildMarketingAuthoringPrompt,
  buildMarketingHistoryMetaBadgesFromPayload,
  buildMarketingImagePrompt,
  buildMarketingRoomTitleFromPayload,
  hasMarketingAuthoringTextVariants,
  hasMarketingOutput,
  linkMarketingAuthoringMessagePair,
  parseMarketingAuthoringConfigFromAgent,
  resolveMarketingSubmitMode,
  resolveMarketingTextVariantsFromContent,
  toMarketingImagePayload,
  toMarketingTextPayload,
  type MarketingPreparingPhase,
} from '~/utils/chat/marketingAuthoringUtil'

const { messages } = useChatSocket()
const { registerMarketingAuthoringRoom } = useMarketingAuthoring()
const { selectedChatAgentId, selectedModelOption, buildRefIdForPayload } = useChatSearchState()
const { executeSendPipeline } = useChatSendPipeline()
const { chatRoom, createChatRoom } = useChatRooms()
const { fetchRenameChatRoom } = useChatApi()

/** BOTH 순차 생성 시 UI 단계 (문구 → 이미지) */
const marketingPreparingPhase = ref<MarketingPreparingPhase>('TEXT')

/** 기존 answer 개수 이후 — 문구 시안이 실제로 파싱될 때까지 대기 (에러/빈 응답은 실패) */
const waitForAnswerAfterCount = (prevAnswerCount: number, timeoutMs = 5 * 60 * 1000) =>
  new Promise<boolean>((resolve) => {
    const startedAt = Date.now()
    const stop = watch(
      () => messages.value.filter((item) => item.type === 'answer'),
      (answers) => {
        if (answers.length <= prevAnswerCount) {
          if (Date.now() - startedAt > timeoutMs) {
            stop()
            resolve(false)
          }
          return
        }
        const latest = answers[answers.length - 1]
        if (latest && latest.isStreaming !== true) {
          stop()
          resolve(hasMarketingAuthoringTextVariants(String(latest.rContent ?? '')))
          return
        }
        if (Date.now() - startedAt > timeoutMs) {
          stop()
          resolve(false)
        }
      },
      { immediate: true, deep: true },
    )
  })

export const useMarketingAuthoringAgentActions = () => {
  const getSelectedMarketingAgent = () => {
    const agentId = selectedChatAgentId.value ?? ''
    const agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    return agent ? { agent, agentId } : null
  }

  const resolveAgentConfig = (agentId: string) => {
    const agent = chatIndexAgents.value.find((item) => item.agentId === agentId)
    return agent ? parseMarketingAuthoringConfigFromAgent(agent) : null
  }

  const buildTextRequest = (payload: MarketingAuthoringSubmitPayload, agentId: string) => {
    const config = resolveAgentConfig(agentId)
    if (!config) {
      openToast({ message: '콘텐츠 작성·편집 설정을 불러올 수 없습니다.', type: 'warning' })
      return null
    }
    const data = toMarketingTextPayload(payload)
    return {
      prompt: buildMarketingAuthoringPrompt(data, config),
      files: data.referenceMode === 'FILE' ? data.referenceFiles : [],
      agentId,
      config,
    }
  }

  const buildImageRequest = (
    payload: MarketingAuthoringSubmitPayload,
    agentId: string,
    textVariants?: ReturnType<typeof resolveMarketingTextVariantsFromContent>,
  ) => {
    const config = resolveAgentConfig(agentId)
    const data = toMarketingImagePayload(payload)
    return {
      prompt: buildMarketingImagePrompt(data, config, textVariants?.length ? { textVariants } : undefined),
      files: data.referenceFiles,
      agentId,
      config,
    }
  }

  /** 직근 문구 answer에서 시안 목록 추출 — BOTH 이미지 연계용 */
  const resolveLatestTextVariants = () => {
    const answers = messages.value.filter((item) => item.type === 'answer')
    const latest = answers[answers.length - 1]
    return resolveMarketingTextVariantsFromContent(String(latest?.rContent ?? ''))
  }

  const registerRoomMeta = (
    roomId: string,
    payload: MarketingAuthoringSubmitPayload,
    config: ReturnType<typeof resolveAgentConfig>,
  ) => {
    if (!roomId) return
    registerMarketingRoomMode(roomId, resolveMarketingSubmitMode(payload.outputs))
    registerMarketingRoomSummary(roomId, buildMarketingHistoryMetaBadgesFromPayload(payload, config))
  }

  const finalizeMarketingSubmit = () => {
    linkMarketingAuthoringMessagePair(messages.value)
    if (chatRoom.value.roomId) registerMarketingAuthoringRoom(chatRoom.value.roomId)
    selectedChatAgentId.value = null
  }

  const applyRoomTitle = async (
    payload: MarketingAuthoringSubmitPayload,
    config: ReturnType<typeof resolveAgentConfig>,
  ) => {
    const roomId = String(chatRoom.value.roomId ?? '').trim()
    const roomTitle = buildMarketingRoomTitleFromPayload(payload, config)
    if (!roomId || !roomTitle) return
    try {
      await fetchRenameChatRoom(roomId, roomTitle)
      chatRoom.value = {
        ...chatRoom.value,
        title: roomTitle,
        roomTitle,
      }
    } catch {
      // 제목 저장 실패해도 생성 자체는 성공으로 유지
    }
  }

  /** /marketing 전용 페이지에서 폼 제출 — 새 방 생성 후 채팅으로 이동하지 않음 */
  const handleMarketingPageSubmit = async (payload: MarketingAuthoringSubmitPayload): Promise<boolean> => {
    const selected = getSelectedMarketingAgent()
    if (!selected) return false

    const mode = resolveMarketingSubmitMode(payload.outputs)
    const hasText = hasMarketingOutput(payload, 'TEXT')
    const hasImage = hasMarketingOutput(payload, 'IMAGE')
    if (!hasText && !hasImage) {
      openToast({ message: '글 또는 그림 중 하나 이상 선택해 주세요.', type: 'warning' })
      return false
    }

    marketingPreparingPhase.value = hasText ? 'TEXT' : 'IMAGE'
    const answerCountBefore = messages.value.filter((item) => item.type === 'answer').length

    if (mode === 'IMAGE') {
      const request = buildImageRequest(payload, selected.agentId)
      const sent = await createChatRoom(request.prompt, request.files, MARKETING_AUTHORING_SVC_TY, {
        modelId: selectedModelOption.value,
        agentId: request.agentId,
        skipNavigate: true,
        skipLoading: true,
      })
      if (!sent) return false
      const roomId = String(chatRoom.value.roomId ?? '').trim()
      registerRoomMeta(roomId, payload, request.config)
      await applyRoomTitle(payload, request.config)
      finalizeMarketingSubmit()
      return true
    }

    const textRequest = buildTextRequest(payload, selected.agentId)
    if (!textRequest) return false

    const sent = await createChatRoom(textRequest.prompt, textRequest.files, MARKETING_AUTHORING_SVC_TY, {
      modelId: selectedModelOption.value,
      agentId: textRequest.agentId,
      skipNavigate: true,
      skipLoading: true,
    })
    if (!sent) return false

    const roomId = String(chatRoom.value.roomId ?? '').trim()
    registerRoomMeta(roomId, payload, textRequest.config)
    await applyRoomTitle(payload, textRequest.config)

    if (mode === 'BOTH' && roomId) {
      const textDone = await waitForAnswerAfterCount(answerCountBefore)
      if (!textDone) {
        openToast({ message: '문구 생성에 실패했거나 시간이 초과되었습니다.', type: 'error' })
        finalizeMarketingSubmit()
        return false
      }
      marketingPreparingPhase.value = 'IMAGE'
      const textVariants = resolveLatestTextVariants()
      const imageRequest = buildImageRequest(payload, selected.agentId, textVariants)
      const imageSent = await executeSendPipeline({
        content: imageRequest.prompt,
        roomId,
        svcTy: MARKETING_AUTHORING_SVC_TY,
        modelId: selectedModelOption.value,
        refId: buildRefIdForPayload(),
        agentId: imageRequest.agentId,
        files: imageRequest.files,
      })
      if (!imageSent) {
        openToast({ message: '이미지 생성 요청에 실패했습니다.', type: 'error' })
      }
    }

    finalizeMarketingSubmit()
    return true
  }

  /** 채팅방 인라인 마케팅 카드 제출 — 폼은 제거하고 결과 칩만 남김 */
  const handleRoomMarketingAuthoringSubmit = async (
    logId: string,
    payload: MarketingAuthoringSubmitPayload,
  ): Promise<boolean> => {
    if (!chatRoom.value.roomId) {
      return await handleMarketingPageSubmit(payload)
    }

    const card = messages.value.find((item) => item.type === 'marketingAuthoring' && item.logId === logId)
    const agentId = String(card?.agentId ?? selectedChatAgentId.value ?? '').trim()
    if (!agentId) return false

    const mode = resolveMarketingSubmitMode(payload.outputs)
    const hasText = hasMarketingOutput(payload, 'TEXT')
    const hasImage = hasMarketingOutput(payload, 'IMAGE')
    if (!hasText && !hasImage) {
      openToast({ message: '글 또는 그림 중 하나 이상 선택해 주세요.', type: 'warning' })
      return false
    }

    messages.value = messages.value.filter((item) => !(item.type === 'marketingAuthoring' && item.logId === logId))
    marketingPreparingPhase.value = hasText ? 'TEXT' : 'IMAGE'
    const answerCountBefore = messages.value.filter((item) => item.type === 'answer').length

    const roomId = String(chatRoom.value.roomId ?? '').trim()
    const config = resolveAgentConfig(agentId)

    if (mode === 'IMAGE') {
      const request = buildImageRequest(payload, agentId)
      const sent = await executeSendPipeline({
        content: request.prompt,
        roomId: chatRoom.value.roomId,
        svcTy: MARKETING_AUTHORING_SVC_TY,
        modelId: selectedModelOption.value,
        refId: buildRefIdForPayload(),
        agentId: request.agentId,
        files: request.files,
      })
      if (sent) {
        registerRoomMeta(roomId, payload, request.config)
        finalizeMarketingSubmit()
      }
      return sent
    }

    const textRequest = buildTextRequest(payload, agentId)
    if (!textRequest) return false

    const sent = await executeSendPipeline({
      content: textRequest.prompt,
      roomId: chatRoom.value.roomId,
      svcTy: MARKETING_AUTHORING_SVC_TY,
      modelId: selectedModelOption.value,
      refId: buildRefIdForPayload(),
      agentId: textRequest.agentId,
      files: textRequest.files,
    })
    if (!sent) return false

    registerRoomMeta(roomId, payload, textRequest.config ?? config)

    if (mode === 'BOTH') {
      const textDone = await waitForAnswerAfterCount(answerCountBefore)
      if (!textDone) {
        openToast({ message: '문구 생성에 실패했거나 시간이 초과되었습니다.', type: 'error' })
        finalizeMarketingSubmit()
        return false
      }
      marketingPreparingPhase.value = 'IMAGE'
      const textVariants = resolveLatestTextVariants()
      const imageRequest = buildImageRequest(payload, agentId, textVariants)
      await executeSendPipeline({
        content: imageRequest.prompt,
        roomId: chatRoom.value.roomId,
        svcTy: MARKETING_AUTHORING_SVC_TY,
        modelId: selectedModelOption.value,
        refId: buildRefIdForPayload(),
        agentId: imageRequest.agentId,
        files: imageRequest.files,
      })
    }

    finalizeMarketingSubmit()
    return true
  }

  const handleCloseMarketingAuthoring = (logId?: string) => {
    selectedChatAgentId.value = null
    if (logId) {
      messages.value = messages.value.filter((item) => !(item.type === 'marketingAuthoring' && item.logId === logId))
    }
  }

  return {
    handleMarketingPageSubmit,
    handleRoomMarketingAuthoringSubmit,
    handleCloseMarketingAuthoring,
    marketingPreparingPhase,
  }
}

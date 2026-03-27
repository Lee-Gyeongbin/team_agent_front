import type { ChatMessage } from '~/types/chat'
import { useChatStore } from '~/composables/chat/useChatStore'
const { messages } = useChatStore()
const { chatRoom } = useChatRooms()
const { fetchCreateChatLogReaction, fetchCreateKnowledge } = useReportsApi()
const { selectedSubOption, resolveSvcTy, pushQuestionMessage, pushAnswerPlaceholder, ensureWebSocketAndSend } =
  useChatStore()
export const useChatItemActions = () => {
  const modalTitle = ref('')
  const modalPlaceholder = ref('')
  const selectedLogId = ref<string | null>(null)
  const satisYn = ref<'Y' | 'N'>('N')
  const modalMessage = ref('')
  const isModalOpen = ref(false)

  /** 모달에 넣을 만족도 코멘트: 이미 같은 유형(Y/N)으로 저장된 내용만 재사용 */
  const getReactionModalPrefill = (answer: ChatMessage | undefined, kind: 'Y' | 'N'): string => {
    const r = answer?.chatLogReaction
    if (!r || r.satisYn !== kind) return ''
    return r.satisContent ?? ''
  }

  // 좋아요 처리
  const onLike = (id: string) => {
    modalTitle.value = '답변이 마음에 들어요'
    modalPlaceholder.value = '답변이 마음에 드는 이유를 입력해주세요.'
    selectedLogId.value = id
    satisYn.value = 'Y'
    const answer = messages.value.find((m) => m.logId === id && m.type === 'answer')
    modalMessage.value = getReactionModalPrefill(answer, 'Y')
    isModalOpen.value = true
  }

  // 싫어요 처리
  const onDislike = (id: string) => {
    modalTitle.value = '답변이 마음에 들지 않아요'
    modalPlaceholder.value = '답변이 마음에 들지 않는 이유를 입력해주세요.'
    selectedLogId.value = id
    satisYn.value = 'N'
    const answer = messages.value.find((m) => m.logId === id && m.type === 'answer')
    modalMessage.value = getReactionModalPrefill(answer, 'N')
    isModalOpen.value = true
  }

  // 만족도 저장
  const handleReactionSubmit = async () => {
    isModalOpen.value = false
    if (!selectedLogId.value) return
    const logId = selectedLogId.value
    const res = await fetchCreateChatLogReaction(logId, satisYn.value, modalMessage.value)
    if (res.successYn === false) {
      openToast({ message: '만족도 저장에 실패했습니다.', type: 'error' })
      return
    }
    const reactionLabel = satisYn.value === 'Y' ? '좋아요' : '싫어요'
    openToast({ message: `${reactionLabel}가 등록되었습니다.`, type: 'success' })
    const answer = messages.value.find((m) => m.logId === logId && m.type === 'answer')
    if (!answer) return
    const next = res.data
    answer.chatLogReaction = {
      logId,
      satisYn: next?.satisYn ?? satisYn.value,
      satisContent: next?.satisContent ?? modalMessage.value,
    }
  }

  /** 동일 질문으로 답변만 다시 받기 — onSend와 동일 파이프라인 (새 logId 쌍 생성) */
  const onRegenerate = async (id: string) => {
    const question = messages.value.find((m) => m.logId === id && m.type === 'question')
    const content = (question?.qContent ?? '').trim()
    if (!content) return
    if (!chatRoom.value.roomId) return
    const svcTy = question?.svcTy ?? resolveSvcTy()
    const refId = question?.refId ?? selectedSubOption.value

    pushQuestionMessage(content, svcTy, refId)
    pushAnswerPlaceholder(svcTy, refId)
    await ensureWebSocketAndSend({
      type: 'question',
      query: content,
      threadId: chatRoom.value.roomId,
      svcTy,
      refId,
    })
  }

  // 답변 복사
  const onCopy = async (id: string) => {
    console.log('onCopy', id)
    // question·answer가 동일 logId로 쌍을 이루므로 반드시 답변만 조회
    const msg = messages.value.find((m) => m.logId === id && m.type === 'answer')
    if (!msg) return
    const text = (msg.rContent ?? '').replace(/<[^>]*>/g, '')
    try {
      await navigator.clipboard.writeText(text)
      openToast({ message: '클립보드에 복사되었습니다.', type: 'success' })
    } catch {
      openToast({ message: '클립보드에 복사하지 못했습니다.', type: 'error' })
    }
  }

  const handleModalClose = () => {
    isModalOpen.value = false
  }

  /** 지식창고 저장 */
  const handleCreateKnowledge = async (logId: string, categoryId: string) => {
    openLoading({ text: '지식창고에 저장 중...' })
    try {
      await fetchCreateKnowledge(logId, categoryId)
      openToast({ message: '지식창고에 저장되었습니다', type: 'success' })
    } catch {
      openToast({ message: '지식창고 저장에 실패했습니다', type: 'error' })
    } finally {
      closeLoading()
    }
  }

  return {
    onLike,
    onDislike,
    onCopy,
    onRegenerate,
    handleReactionSubmit,
    handleModalClose,
    isModalOpen,
    modalTitle,
    modalPlaceholder,
    selectedLogId,
    satisYn,
    modalMessage,
    handleCreateKnowledge,
  }
}

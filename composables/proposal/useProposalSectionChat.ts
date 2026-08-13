import type { PtSectionChatMessage, PtSlide } from '~/types/proposal'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'

export const useProposalSectionChat = (
  ptProjectId: Ref<string>,
  sectionId: Ref<string>,
  modelId: Ref<string>,
  agentId: Ref<string>,
  onSlidesUpdated?: (slides: PtSlide[]) => void,
) => {
  const { fetchChatSection } = useProposalApi()

  // 소목차별 채팅 기록 캐시 (소목차 전환해도 이전 채팅 유지)
  const chatCache = ref<Record<string, PtSectionChatMessage[]>>({})
  const isSending = ref(false)

  const currentMessages = computed<PtSectionChatMessage[]>(() => {
    const key = `${ptProjectId.value}__${sectionId.value}`
    return chatCache.value[key] ?? []
  })

  /**
   * D-3: 보완요청 메시지 전송
   * - 특정 슬라이드 지목 시 해당 슬라이드만 재생성
   * - 지목 없으면 소목차 전체 재생성
   * - 재생성 결과는 기존 슬라이드에 이력 없이 덮어쓰기
   */
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending.value) return

    const key = `${ptProjectId.value}__${sectionId.value}`
    if (!chatCache.value[key]) chatCache.value[key] = []

    // 유저 메시지 즉시 추가 (낙관적 업데이트)
    chatCache.value[key].push({ role: 'user', text, createdAt: new Date().toISOString() })

    isSending.value = true
    try {
      const res = await fetchChatSection(ptProjectId.value, sectionId.value, text, modelId.value, agentId.value)

      if (res.result !== 'OK') {
        openToast({ message: res.msg ?? '보완 요청 처리 중 오류가 발생했습니다.', type: 'error' })
        // 실패한 사용자 메시지 제거
        chatCache.value[key].pop()
        return
      }

      const aiMsg = res.data?.aiMessage ?? '보완 요청이 처리되었습니다.'
      chatCache.value[key].push({ role: 'ai', text: aiMsg, createdAt: new Date().toISOString() })

      // 재생성된 슬라이드 콜백 호출 (상위 컴포넌트에서 슬라이드 캐시 갱신)
      if (res.data?.updatedSlides?.length && onSlidesUpdated) {
        onSlidesUpdated(res.data.updatedSlides)
      }
    } catch (e) {
      console.warn('[useProposalSectionChat] 채팅 전송 실패:', e)
      openToast({ message: '보완 요청 전송 중 오류가 발생했습니다.', type: 'error' })
      // 실패한 사용자 메시지 제거
      chatCache.value[key].pop()
    } finally {
      isSending.value = false
    }
  }

  return {
    currentMessages,
    isSending,
    handleSendMessage,
  }
}

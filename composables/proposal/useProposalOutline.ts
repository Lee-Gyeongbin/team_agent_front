/**
 * Step5 콘텐츠 개요 상태 관리 composable
 * - TOC 트리 로드 + 노드 선택 + 개요 생성/채팅/확정
 */
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'
import type { PtTocItem } from '~/types/proposal'

export interface OutlineChatMessage {
  role: 'user' | 'ai'
  text: string
}

export const useProposalOutline = (ptProjectId: Ref<string>, modelId: Ref<string>, agentId: Ref<string>) => {
  const { fetchSelectTocList, fetchSelectTocOutline, fetchGenerateTocOutline, fetchChatTocOutline, fetchConfirmTocOutline } =
    useProposalApi()

  // ── TOC 트리 ──────────────────────────────────────────────────────────────
  const tocList = ref<PtTocItem[]>([])
  const isLoadingToc = ref(false)

  const handleLoadToc = async () => {
    if (!ptProjectId.value) return
    isLoadingToc.value = true
    try {
      const res = await fetchSelectTocList(ptProjectId.value)
      tocList.value = res.list ?? []
    } catch {
      openToast({ message: '목차 로드에 실패했습니다.', type: 'error' })
    } finally {
      isLoadingToc.value = false
    }
  }

  // 리프 노드만 (다른 노드를 parentId로 참조하지 않는 노드)
  const leafNodes = computed<PtTocItem[]>(() => {
    const parentIdSet = new Set(tocList.value.map((t) => t.parentId).filter(Boolean))
    return tocList.value.filter((t) => !parentIdSet.has(t.tocId))
  })

  const confirmedCount = computed(() => leafNodes.value.filter((t) => t.outlineStatusCd === '003').length)
  const allConfirmed = computed(() => leafNodes.value.length > 0 && confirmedCount.value === leafNodes.value.length)

  // ── 선택 노드 ────────────────────────────────────────────────────────────
  const selectedTocId = ref<string | null>(null)
  const selectedItem = computed(() => tocList.value.find((t) => t.tocId === selectedTocId.value) ?? null)

  const isLoadingOutline = ref(false)
  const isGenerating = ref(false)
  const isChating = ref(false)
  const isConfirming = ref(false)

  // 선택 노드의 편집 상태 (확정 노드 수정 시 편집 모드 진입)
  const isEditing = ref(false)
  const editingText = ref('')

  // 채팅 메시지 (세션 메모리만, 노드 전환 시 초기화)
  const chatMessages = ref<OutlineChatMessage[]>([])

  /** 노드 클릭 시 개요 텍스트 지연 로딩 */
  const handleSelectNode = async (tocId: string) => {
    if (selectedTocId.value === tocId) return
    selectedTocId.value = tocId
    isEditing.value = false
    chatMessages.value = []

    const item = tocList.value.find((t) => t.tocId === tocId)
    if (!item) return

    // contentOutlineTxt가 없고 미생성이 아닐 때만 로딩
    if (item.contentOutlineTxt == null && item.outlineStatusCd !== '001') {
      isLoadingOutline.value = true
      try {
        const res = await fetchSelectTocOutline(tocId)
        if (res.result === 'OK' && res.data) {
          item.contentOutlineTxt = res.data.contentOutlineTxt
          item.outlineStatusCd = res.data.outlineStatusCd
        }
      } catch {
        // silent
      } finally {
        isLoadingOutline.value = false
      }
    }
  }

  /** 개요 생성 (재생성 포함) */
  const handleGenerate = async () => {
    if (!selectedTocId.value) return
    isGenerating.value = true
    try {
      const res = await fetchGenerateTocOutline({
        tocId: selectedTocId.value,
        modelId: modelId.value,
        agentId: agentId.value,
      })
      if (res.result !== 'OK') {
        openToast({ message: res.msg ?? '개요 생성에 실패했습니다.', type: 'error' })
        return
      }
      const item = tocList.value.find((t) => t.tocId === selectedTocId.value)
      if (item) {
        item.contentOutlineTxt = res.contentOutlineTxt
        item.outlineStatusCd = res.outlineStatusCd
      }
      isEditing.value = false
    } catch {
      openToast({ message: '개요 생성 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      isGenerating.value = false
    }
  }

  /** 채팅 보완 */
  const handleChat = async (message: string) => {
    if (!selectedTocId.value || !message.trim()) return
    chatMessages.value.push({ role: 'user', text: message })
    isChating.value = true
    try {
      const res = await fetchChatTocOutline({
        tocId: selectedTocId.value,
        message,
        modelId: modelId.value,
        agentId: agentId.value,
      })
      if (res.result !== 'OK') {
        chatMessages.value.push({ role: 'ai', text: res.msg ?? '요청 처리에 실패했습니다.' })
        return
      }
      const item = tocList.value.find((t) => t.tocId === selectedTocId.value)
      if (item) {
        item.contentOutlineTxt = res.contentOutlineTxt
        item.outlineStatusCd = res.outlineStatusCd
      }
      chatMessages.value.push({ role: 'ai', text: '요청하신 내용을 반영했습니다. 개요를 확인해보세요.' })
      isEditing.value = false
    } catch {
      chatMessages.value.push({ role: 'ai', text: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' })
    } finally {
      isChating.value = false
    }
  }

  /** 확정 */
  const handleConfirm = async (outlineTxt: string) => {
    if (!selectedTocId.value) return
    isConfirming.value = true
    try {
      const res = await fetchConfirmTocOutline({ tocId: selectedTocId.value, outlineTxt })
      if (res.result !== 'OK') {
        openToast({ message: res.msg ?? '확정에 실패했습니다.', type: 'error' })
        return
      }
      const item = tocList.value.find((t) => t.tocId === selectedTocId.value)
      if (item) {
        item.contentOutlineTxt = outlineTxt
        item.outlineStatusCd = '003'
      }
      isEditing.value = false
    } catch {
      openToast({ message: '확정 중 오류가 발생했습니다.', type: 'error' })
    } finally {
      isConfirming.value = false
    }
  }

  /** 수정 모드 진입 */
  const handleStartEdit = () => {
    const item = selectedItem.value
    if (!item) return
    editingText.value = item.contentOutlineTxt ?? ''
    isEditing.value = true
  }

  return {
    tocList,
    leafNodes,
    confirmedCount,
    allConfirmed,
    isLoadingToc,
    selectedTocId,
    selectedItem,
    isLoadingOutline,
    isGenerating,
    isChating,
    isConfirming,
    isEditing,
    editingText,
    chatMessages,
    handleLoadToc,
    handleSelectNode,
    handleGenerate,
    handleChat,
    handleConfirm,
    handleStartEdit,
  }
}

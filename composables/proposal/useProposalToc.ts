import { useProposalApi } from '~/composables/proposal/useProposalApi'
import type { PtTocItem } from '~/types/proposal'

export const useProposalToc = (ptProjectId: Ref<string>) => {
  const {
    fetchSelectTocList,
    fetchAutoExtractToc,
    fetchInsertTocItem,
    fetchUpdateTocItem,
    fetchDeleteTocItem,
    fetchReorderTocItems,
  } = useProposalApi()

  const tocList = ref<PtTocItem[]>([])
  const isLoading = ref(false)
  const isExtracting = ref(false)

  /** TOC 목록 로드 */
  const handleSelectTocList = async () => {
    if (!ptProjectId.value) return
    isLoading.value = true
    try {
      const res = await fetchSelectTocList(ptProjectId.value)
      tocList.value = res.list
    } finally {
      isLoading.value = false
    }
  }

  /**
   * mandatedToc 기반 자동추출 (LLM 없음)
   * @returns msg — RFP에 명시된 목차가 없을 때 안내 메시지, undefined이면 성공
   */
  const handleAutoExtractToc = async (): Promise<string | undefined> => {
    isExtracting.value = true
    try {
      const res = await fetchAutoExtractToc(ptProjectId.value)
      if (res.result !== 'OK') return res.msg ?? '자동 추출에 실패했습니다.'
      tocList.value = res.list
      return res.list.length === 0 ? (res.msg ?? 'RFP에 명시된 목차가 없습니다.') : undefined
    } finally {
      isExtracting.value = false
    }
  }

  /**
   * TOC 항목 단건 추가
   * @param parentId null=대목차 추가, tocId=해당 대목차 아래 소목차 추가
   */
  const handleAddTocItem = async (parentId: string | null) => {
    const res = await fetchInsertTocItem({
      ptProjectId: ptProjectId.value,
      parentTocId: parentId,
      sectionNm: parentId ? '새 소목차' : '새 대목차',
    })
    if (res.result !== 'OK') return
    // 소목차는 부모 바로 뒤에, 대목차는 맨 뒤에 삽입
    if (parentId) {
      const parentIdx = tocList.value.findLastIndex((t) => t.tocId === parentId || t.parentId === parentId)
      tocList.value.splice(parentIdx + 1, 0, res.data)
    } else {
      tocList.value.push(res.data)
    }
  }

  /** TOC 항목 제목 수정 (blur 시 호출) */
  const handleUpdateTocTitle = async (tocId: string, title: string) => {
    const item = tocList.value.find((t) => t.tocId === tocId)
    if (!item || item.title === title) return
    item.title = title // 낙관적 업데이트
    await fetchUpdateTocItem(tocId, title)
  }

  /** TOC 항목 삭제 (소목차 연쇄 삭제) */
  const handleDeleteTocItem = async (tocId: string) => {
    const res = await fetchDeleteTocItem(tocId)
    if (res.result !== 'OK') return
    tocList.value = tocList.value.filter((t) => t.tocId !== tocId && t.parentId !== tocId)
  }

  /**
   * vuedraggable @end 이후 호출 — 새 순서를 백엔드에 반영
   * tocList.value 는 이미 draggable이 재정렬한 상태
   */
  const handleReorderToc = async () => {
    await fetchReorderTocItems(ptProjectId.value, tocList.value)
  }

  return {
    tocList,
    isLoading,
    isExtracting,
    handleSelectTocList,
    handleAutoExtractToc,
    handleAddTocItem,
    handleUpdateTocTitle,
    handleDeleteTocItem,
    handleReorderToc,
  }
}

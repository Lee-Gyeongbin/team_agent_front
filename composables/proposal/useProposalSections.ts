import type { PtSection, PtSlide, SectionGenProgressData, SectionGenDoneData } from '~/types/proposal'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'

export const useProposalSections = (ptProjectId: Ref<string>) => {
  const { fetchSelectTocList, streamGenerateSection, fetchSelectSectionSlides, fetchConfirmSection } = useProposalApi()

  const sectionList = ref<PtSection[]>([])
  const isLoading = ref(false)

  // 소목차별 슬라이드 캐시 (소목차 전환해도 유지)
  const slidesCache = ref<Record<string, PtSlide[]>>({})

  // 생성 진행 상태 (tocId → 진행 메시지)
  const genProgressMsg = ref('')
  const isGenerating = ref(false)

  /**
   * TOC flat list 조회 → 소목차(leaf)만 PtSection으로 변환
   * 소목차 = parentId가 있는 항목
   */
  const handleSelectSectionList = async () => {
    if (!ptProjectId.value) return
    isLoading.value = true
    try {
      const res = await fetchSelectTocList(ptProjectId.value)
      const leafItems = (res.list ?? []).filter((item) => item.parentId !== null)
      sectionList.value = leafItems.map((item, idx) => ({
        sectionId: item.tocId,
        ptProjectId: ptProjectId.value,
        tocId: item.tocId,
        title: item.title,
        order: idx,
        status: idx === 0 ? 'active' : ('todo' as PtSection['status']),
        previewContent: null,
      }))
    } catch (e) {
      console.warn('[useProposalSections] TOC 조회 실패:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 소목차 슬라이드 목록 조회 (캐시 우선)
   */
  const handleSelectSlides = async (tocId: string): Promise<PtSlide[]> => {
    if (slidesCache.value[tocId]) return slidesCache.value[tocId]
    try {
      const res = await fetchSelectSectionSlides(tocId)
      slidesCache.value[tocId] = res.list ?? []
      return slidesCache.value[tocId]
    } catch (e) {
      console.warn('[useProposalSections] 슬라이드 조회 실패:', e)
      return []
    }
  }

  /**
   * D-1: 소목차 슬라이드 생성 (Stage3 + Stage3.5)
   * SSE 스트림으로 진행상황 수신
   *
   * @param tocId   소목차 ID
   * @param modelId LLM 모델 ID
   * @param agentId 에이전트 ID
   * @returns Promise resolving to done event data
   */
  const handleGenerateSection = (tocId: string, modelId: string, agentId: string): Promise<SectionGenDoneData> => {
    return new Promise((resolve, reject) => {
      isGenerating.value = true
      genProgressMsg.value = '슬라이드 생성 시작 중...'

      // 캐시 무효화
      delete slidesCache.value[tocId]

      streamGenerateSection(ptProjectId.value, tocId, modelId, agentId, {
        onProgress: (data: SectionGenProgressData) => {
          genProgressMsg.value = data.message ?? ''
        },
        onDone: (data: SectionGenDoneData) => {
          isGenerating.value = false
          genProgressMsg.value = ''
          // 캐시 재조회 트리거 (비동기, 결과 대기 안 함)
          handleSelectSlides(tocId)
          resolve(data)
        },
        onError: (message: string) => {
          isGenerating.value = false
          genProgressMsg.value = ''
          openToast({ message: message ?? '슬라이드 생성 중 오류가 발생했습니다.', type: 'error' })
          reject(new Error(message))
        },
      })
    })
  }

  /**
   * D-4: 소목차 확인 → 다음 소목차 활성화
   * 미완료 슬라이드 있으면 거부 메시지 표시.
   *
   * @returns true: 모든 소목차 완료(Step E로), false: 다음 소목차로 이동
   */
  const handleConfirmSection = async (tocId: string): Promise<boolean> => {
    const res = await fetchConfirmSection(ptProjectId.value, tocId)

    if (res.result !== 'OK') {
      openToast({ message: res.msg ?? '확인 처리 중 오류가 발생했습니다.', type: 'error' })
      return false
    }

    const data = res.data
    if (data.rejectReason) {
      openToast({ message: data.rejectReason, type: 'warning' })
      return false
    }

    // 현재 소목차 done 처리
    const idx = sectionList.value.findIndex((s) => s.tocId === tocId)
    if (idx > -1) sectionList.value[idx].status = 'done'

    if (data.done) return true

    // 다음 소목차 active 처리
    if (data.nextTocId) {
      const nextIdx = sectionList.value.findIndex((s) => s.tocId === data.nextTocId)
      if (nextIdx > -1) sectionList.value[nextIdx].status = 'active'
    }

    return false
  }

  const goToPrevSection = () => {
    const idx = sectionList.value.findIndex((s) => s.status === 'active')
    if (idx <= 0) return
    sectionList.value[idx].status = 'todo'
    sectionList.value[idx - 1].status = 'active'
  }

  const activeSection = computed(() => sectionList.value.find((s) => s.status === 'active') ?? null)
  const activeSectionIndex = computed(() => sectionList.value.findIndex((s) => s.status === 'active'))

  return {
    sectionList,
    isLoading,
    slidesCache,
    isGenerating,
    genProgressMsg,
    activeSection,
    activeSectionIndex,
    handleSelectSectionList,
    handleSelectSlides,
    handleGenerateSection,
    handleConfirmSection,
    goToPrevSection,
  }
}

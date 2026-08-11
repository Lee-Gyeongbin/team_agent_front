import type {
  PtSection,
  PtSlide,
  PtTocItem,
  SectionGenProgressData,
  SectionGenDoneData,
  SlideRenderProgressData,
} from '~/types/proposal'
import { useProposalApi } from '~/composables/proposal/useProposalApi'
import { openToast } from '~/composables/useToast'
import { openLoading, updateLoadingText, closeLoading } from '~/composables/useLoading'

const SECTION_GEN_STEP_MESSAGES: Record<string, string> = {
  load: '섹션 데이터를 불러오는 중...',
  llm: 'AI가 슬라이드 내용을 생성하는 중...',
  parse: '슬라이드 구조를 분석하는 중...',
  save: '슬라이드를 저장하는 중...',
  render: '슬라이드 스타일을 조립하는 중...',
}

export const useProposalSections = (ptProjectId: Ref<string>) => {
  const {
    fetchSelectTocList,
    streamGenerateSection,
    fetchSelectSectionSlides,
    fetchConfirmSection,
    streamRenderSectionImages,
  } = useProposalApi()

  const sectionList = ref<PtSection[]>([])
  // 트리 사이드바 표시용 — 대목차(root)까지 포함한 전체 flat list
  const rawTocList = ref<PtTocItem[]>([])
  const isLoading = ref(false)

  // 현재 보고 있는 소목차 인덱스 (status와 분리 — done 마크 유지하면서 자유 이동)
  const activeSectionIndexRef = ref(0)

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
      rawTocList.value = res.list ?? []

      // 진짜 리프 판별: 다른 항목이 이 항목을 parentId로 참조하지 않으면 리프
      const parentIdSet = new Set(
        (res.list ?? []).map((item) => item.parentId).filter((id): id is string => id !== null),
      )
      const leafItems = (res.list ?? []).filter((item) => item.parentId !== null && !parentIdSet.has(item.tocId))

      sectionList.value = leafItems.map((item, idx) => ({
        sectionId: item.tocId,
        ptProjectId: ptProjectId.value,
        tocId: item.tocId,
        title: item.title,
        order: idx,
        status: 'todo' as PtSection['status'],
        previewContent: null,
      }))
      activeSectionIndexRef.value = 0
      const firstTocId = sectionList.value[0]?.tocId
      if (firstTocId) {
        fetchSelectSectionSlides(firstTocId)
          .then((res) => {
            slidesCache.value[firstTocId] = res.list ?? []
          })
          .catch(() => {})
      }
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
      openLoading({ text: '슬라이드 생성 시작 중...' })

      // 캐시 무효화
      slidesCache.value = Object.fromEntries(Object.entries(slidesCache.value).filter(([key]) => key !== tocId))

      streamGenerateSection(ptProjectId.value, tocId, modelId, agentId, {
        onProgress: (data: SectionGenProgressData) => {
          const msg = SECTION_GEN_STEP_MESSAGES[data.step] ?? ''
          genProgressMsg.value = msg
          if (msg) updateLoadingText(msg)
        },
        onDone: (data: SectionGenDoneData) => {
          isGenerating.value = false
          genProgressMsg.value = ''
          closeLoading()
          // 슬라이드 캐시 갱신 (이미지 생성은 사용자가 직접 시작)
          handleSelectSlides(tocId)
          resolve(data)
        },
        onError: (message: string) => {
          isGenerating.value = false
          genProgressMsg.value = ''
          closeLoading()
          openToast({ message: '슬라이드 생성 중 오류가 발생했습니다.', type: 'error' })
          reject(new Error(message))
        },
      })
    })
  }

  /**
   * E-4: 소목차 확인 → 다음 소목차 활성화
   * 미완료 슬라이드 있으면 거부 메시지 표시.
   * 확인 성공 시 E-5 이미지 렌더링 SSE를 백그라운드로 구독하여 슬라이드 캐시를 업데이트한다.
   *
   * @returns true: 모든 소목차 완료(출력 단계로), false: 다음 소목차로 이동
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

    // 다음 소목차로 이동
    if (data.nextTocId) {
      const nextIdx = sectionList.value.findIndex((s) => s.tocId === data.nextTocId)
      if (nextIdx > -1) goToSection(nextIdx)
    }

    return false
  }

  /**
   * D-5: 이미지 렌더링 SSE 구독 (백그라운드)
   * 스트림 시작 즉시 캐시 슬라이드를 '002'(생성중)으로 미리 표시하고,
   * progress 이벤트마다 배열 교체로 reactivity를 확실히 트리거.
   */
  const startImageRenderStream = (tocId: string) => {
    // 렌더링 시작 즉시 전체 슬라이드를 '002'로 표시 → UI에 바로 반영
    const initial = slidesCache.value[tocId]
    if (initial?.length) {
      slidesCache.value[tocId] = initial.map((s) => (s.renderedImagePath ? s : { ...s, renderStatusCd: '002' }))
    }

    streamRenderSectionImages(ptProjectId.value, tocId, {
      onProgress: (progressData: SlideRenderProgressData) => {
        // step 전용 이벤트(slideId 없음)는 캐시 갱신 불필요
        if (!progressData.slideId) return
        const cached = slidesCache.value[tocId]
        if (!cached) return
        const idx = cached.findIndex((s) => s.slideId === progressData.slideId)
        if (idx > -1) {
          // 배열 교체 방식으로 Vue reactivity 확실하게 트리거
          const updated: PtSlide = { ...cached[idx] }
          if (progressData.renderStatusCd) updated.renderStatusCd = progressData.renderStatusCd
          if (progressData.renderedImagePath) updated.renderedImagePath = progressData.renderedImagePath
          slidesCache.value[tocId] = [...cached.slice(0, idx), updated, ...cached.slice(idx + 1)]
        }
      },
      onDone: (doneData) => {
        console.warn(`[PT Image] 이미지 렌더링 완료 (tocId=${tocId}, 성공: ${doneData.success}/${doneData.total})`)
      },
      onError: (message) => {
        console.warn(`[PT Image] 이미지 렌더링 SSE 오류 (tocId=${tocId}): ${message}`)
      },
    })
  }

  /**
   * 특정 소목차 인덱스로 직접 이동 (자유 이동 — done 상태 유지)
   * 이동할 때마다 DB에서 최신 슬라이드를 조회하여 캐시 갱신 (LLM 호출 아님)
   */
  const goToSection = (index: number) => {
    if (index < 0 || index >= sectionList.value.length) return
    activeSectionIndexRef.value = index
    const tocId = sectionList.value[index]?.tocId
    if (!tocId) return
    // 항상 DB에서 최신 슬라이드 조회 (캐시 우선 아님)
    fetchSelectSectionSlides(tocId)
      .then((res) => {
        slidesCache.value[tocId] = res.list ?? []
      })
      .catch((e) => console.warn('[useProposalSections] 슬라이드 조회 실패:', e))
  }

  const goToPrevSection = () => {
    goToSection(activeSectionIndexRef.value - 1)
  }

  const activeSection = computed(() => sectionList.value[activeSectionIndexRef.value] ?? null)
  const activeSectionIndex = computed(() => activeSectionIndexRef.value)

  return {
    sectionList,
    rawTocList,
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
    startImageRenderStream,
    goToSection,
    goToPrevSection,
  }
}

/** default 레이아웃 scroll-to-top 버튼 (layouts/default.vue) 과 동기화 */
export const LAYOUT_TOP_BTN_BOTTOM_OFFSET = 32
/** 모달 탑 버튼 (assets/styles/components/_modal.scss .btn-modal-top) 과 동기화 */
export const MODAL_TOP_BTN_BOTTOM_OFFSET = 24
export const TOP_BTN_SIZE = 40
/** 하단 플로팅 UI 간 간격 */
export const FLOATING_UI_GAP = 12

const isLayoutTopBtnVisible = ref(false)
const modalTopBtnVisibleMap = new Map<symbol, boolean>()
const modalTopBtnVisibleCount = ref(0)

const isModalTopBtnVisible = computed(() => modalTopBtnVisibleCount.value > 0)

const floatingBottomAboveTopBtn = computed(() => {
  let max = 0

  if (isLayoutTopBtnVisible.value) {
    max = Math.max(max, LAYOUT_TOP_BTN_BOTTOM_OFFSET + TOP_BTN_SIZE + FLOATING_UI_GAP)
  }

  if (isModalTopBtnVisible.value) {
    max = Math.max(max, MODAL_TOP_BTN_BOTTOM_OFFSET + TOP_BTN_SIZE + FLOATING_UI_GAP)
  }

  return max
})

const isTopBtnVisible = computed(() => isLayoutTopBtnVisible.value || isModalTopBtnVisible.value)

const syncModalTopBtnVisible = (key: symbol, visible: boolean) => {
  const wasVisible = modalTopBtnVisibleMap.has(key)

  if (visible && !wasVisible) {
    modalTopBtnVisibleMap.set(key, true)
    modalTopBtnVisibleCount.value++
    return
  }

  if (!visible && wasVisible) {
    modalTopBtnVisibleMap.delete(key)
    modalTopBtnVisibleCount.value--
  }
}

export function useTopBtnState() {
  const setTopBtnVisible = (visible: boolean) => {
    isLayoutTopBtnVisible.value = visible
  }

  return {
    isTopBtnVisible,
    setTopBtnVisible,
    floatingBottomAboveTopBtn,
  }
}

/** 모달 내 btn-modal-top 표시 상태를 전역 플로팅 UI에 동기화 */
export function useModalTopBtnSync(isShown: Ref<boolean> | ComputedRef<boolean>) {
  const key = Symbol('modal-top-btn')

  watch(
    isShown,
    (visible) => {
      syncModalTopBtnVisible(key, visible)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    syncModalTopBtnVisible(key, false)
  })
}

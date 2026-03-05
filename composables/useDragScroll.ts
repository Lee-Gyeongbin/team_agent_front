// 전역 상태: 현재 드래그 중인 요소 추적
let activeDragElement: HTMLElement | null = null

/**
 * 드래그 스크롤 composable
 * PC에서 마우스로 드래그하여 스크롤할 수 있게 해주는 기능
 */
export const useDragScroll = () => {
  /**
   * 요소에 드래그 스크롤 이벤트 리스너를 직접 등록하는 내부 함수
   */
  const attachDragScroll = (element: HTMLElement) => {
    let isDragging = false
    let startX = 0
    let startY = 0
    let scrollLeft = 0
    let scrollTop = 0

    const handleMouseDown = (e: MouseEvent) => {
      // 다른 요소가 드래그 중이면 새로운 드래그 시작 불가
      if (activeDragElement && activeDragElement !== element) {
        return
      }

      // 버튼이나 클릭 가능한 요소에서는 드래그 시작하지 않음
      const target = e.target as HTMLElement
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.dropdown-menu') ||
        target.closest('input') ||
        target.closest('select')
      ) {
        return
      }

      isDragging = true
      activeDragElement = element
      const rect = element.getBoundingClientRect()
      startX = e.pageX - rect.left
      startY = e.pageY - rect.top
      scrollLeft = element.scrollLeft
      scrollTop = element.scrollTop
      element.style.userSelect = 'none'
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const rect = element.getBoundingClientRect()
      const x = e.pageX - rect.left
      const y = e.pageY - rect.top
      const walkX = x - startX
      const walkY = y - startY
      element.scrollLeft = scrollLeft - walkX
      element.scrollTop = scrollTop - walkY
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      element.style.userSelect = ''
      isDragging = false
      // 드래그 종료 시 전역 상태 초기화
      if (activeDragElement === element) {
        activeDragElement = null
      }
    }

    const handleMouseLeave = () => {
      if (isDragging) {
        element.style.userSelect = ''
        isDragging = false
        // 드래그 종료 시 전역 상태 초기화
        if (activeDragElement === element) {
          activeDragElement = null
        }
      }
    }

    element.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    element.addEventListener('mouseleave', handleMouseLeave)

    // cleanup 함수 반환
    return () => {
      element.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.style.userSelect = ''
    }
  }

  /**
   * 드래그 스크롤을 적용할 요소에 이벤트 리스너를 등록 (ref 사용)
   * @param elementRef - 드래그 스크롤을 적용할 요소의 ref
   */
  const setupDragScroll = (elementRef: Ref<HTMLElement | null>) => {
    onMounted(() => {
      const element = elementRef.value
      if (!element) return

      const cleanup = attachDragScroll(element)

      onUnmounted(() => {
        cleanup()
      })
    })
  }

  /**
   * 드래그 스크롤을 적용할 요소에 이벤트 리스너를 직접 등록 (HTMLElement 직접 사용)
   * @param element - 드래그 스크롤을 적용할 요소
   * @returns cleanup 함수
   */
  const setupDragScrollDirect = (element: HTMLElement) => {
    return attachDragScroll(element)
  }

  return {
    setupDragScroll,
    setupDragScrollDirect,
  }
}

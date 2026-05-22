/** default 레이아웃 main.content — 대시보드 페이지 실제 스크롤 컨테이너 */
const SCROLL_CONTAINER_SELECTOR = '.layout-default .content'

/** 헤더 높이( variables $header-height 와 동기 ) */
const HEADER_OFFSET_PX = 48

const TOP_EDGE_PX = 72
const BOTTOM_EDGE_PX = 120
const MAX_SPEED_UP = 8
const MAX_SPEED_DOWN = 12

const findScrollContainer = (): HTMLElement | null => {
  const el = document.querySelector(SCROLL_CONTAINER_SELECTOR) as HTMLElement | null
  if (!el) return null
  return el.scrollHeight > el.clientHeight + 1 ? el : null
}

const resolveActiveDragEl = (dragEl: HTMLElement | null): HTMLElement | null => {
  if (dragEl?.isConnected) return dragEl
  return document.querySelector(
    '.data-dashboard-grid .sortable-chosen, .data-dashboard-grid .sortable-drag',
  ) as HTMLElement | null
}

const getDragAnchorRect = (dragEl: HTMLElement | null, pointerY: number) => {
  const active = resolveActiveDragEl(dragEl)
  if (active) {
    const { top, bottom } = active.getBoundingClientRect()
    return { top, bottom }
  }
  return { top: pointerY, bottom: pointerY }
}

/**
 * Sortable/vuedraggable 드래그 중 뷰포트 상·하단 근처(또는 드래그 요소 상·하단)에서 .content 자동 스크롤.
 * 커서가 핸들(위젯 상단)에 있어도 위젯 하단이 화면 아래로 닿으면 아래로 스크롤되도록 요소 경계도 함께 본다.
 */
export const useDashboardDragAutoScroll = () => {
  let scrollEl: HTMLElement | null = null
  let dragEl: HTMLElement | null = null
  let rafId = 0
  let pointerY = 0

  const onPointerMove = (e: MouseEvent) => {
    pointerY = e.clientY
  }

  const step = () => {
    if (scrollEl) {
      const { top: anchorTop, bottom: anchorBottom } = getDragAnchorRect(dragEl, pointerY)
      const probeTop = Math.min(pointerY, anchorTop)
      const probeBottom = Math.max(pointerY, anchorBottom)

      const viewportBottom = window.innerHeight
      const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight

      let delta = 0

      const distFromTop = probeTop - HEADER_OFFSET_PX
      if (distFromTop < TOP_EDGE_PX && scrollEl.scrollTop > 0) {
        const ratio = 1 - Math.max(0, distFromTop) / TOP_EDGE_PX
        delta = -MAX_SPEED_UP * ratio
      }

      const distFromBottom = viewportBottom - probeBottom
      if (distFromBottom < BOTTOM_EDGE_PX && scrollEl.scrollTop < maxScroll - 1) {
        const ratio = 1 - Math.max(0, distFromBottom) / BOTTOM_EDGE_PX
        delta = MAX_SPEED_DOWN * ratio
      }

      if (delta !== 0) {
        scrollEl.scrollTop = Math.min(maxScroll, Math.max(0, scrollEl.scrollTop + delta))
      }
    }
    rafId = requestAnimationFrame(step)
  }

  const startDragAutoScroll = (itemEl?: HTMLElement | null) => {
    scrollEl = findScrollContainer()
    dragEl = itemEl ?? null
    pointerY = itemEl?.getBoundingClientRect().top ?? 0
    document.addEventListener('mousemove', onPointerMove, { passive: true })
    rafId = requestAnimationFrame(step)
  }

  const stopDragAutoScroll = () => {
    document.removeEventListener('mousemove', onPointerMove)
    cancelAnimationFrame(rafId)
    scrollEl = null
    dragEl = null
  }

  return { startDragAutoScroll, stopDragAutoScroll }
}

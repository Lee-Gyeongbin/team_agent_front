import { GridStack } from 'gridstack'
import type { GridStackNode } from 'gridstack'

/** GridStack 6열 그리드 기준 셀 높이 (px) */
export const GS_CELL_HEIGHT = 100
/** GridStack 그리드 열 수 */
export const GS_COLUMNS = 6
/**
 * GridStack margin 옵션값 — 내부적으로 2로 나뉘어 각 면에 적용
 * GS_MARGIN = 10 → --gs-item-margin: 5px → 각 면 5px 인셋
 */
export const GS_MARGIN = 10

/**
 * 리사이즈 핸들 위치 = 콘텐츠 경계(GS_MARGIN/2) + 3px 안쪽
 * GS_MARGIN 값만 바꾸면 핸들 위치가 자동으로 따라감
 * CSS variable --gs-resize-handle-offset 으로 SCSS에 주입
 */
export const GS_RESIZE_HANDLE_OFFSET = GS_MARGIN / 2 + 3

/** 새 위젯 추가 시 기본 레이아웃 */
export const GS_DEFAULT_LAYOUT = {
  w: 3,
  h: 4,
  minW: 2,
  maxW: 6,
  minH: 2,
  maxH: 12,
} as const

/**
 * GridStack 인스턴스 래퍼 컴포저블
 * - 위젯 add, 레이아웃 동기화 담당
 */
export const useDataDashboardGridStack = () => {
  const gridEl = ref<HTMLElement | null>(null)
  let grid: GridStack | null = null

  /**
   * GridStack 초기화
   * drag/resize는 항상 활성화 (항상 편집 가능 모드)
   */
  const initGrid = (): GridStack | null => {
    if (!gridEl.value) return null

    grid = GridStack.init(
      {
        column: GS_COLUMNS,
        margin: GS_MARGIN,
        float: false,
        cellHeight: GS_CELL_HEIGHT,
        animate: true,
        // 위젯 드래그 핸들 — widget-header의 drag-handle 아이콘
        handle: '.widget-drag-handle',
        resizable: { handles: 'se' },
      },
      gridEl.value,
    )

    // 리사이즈 핸들 오프셋을 CSS variable로 주입 → SCSS가 GS_MARGIN에 독립적으로 읽음
    gridEl.value.style.setProperty('--gs-resize-handle-offset', `${GS_RESIZE_HANDLE_OFFSET}px`)

    return grid
  }

  /** GridStack 인스턴스 파괴 (페이지 unmount 시) */
  const destroyGrid = () => {
    if (grid) {
      try {
        grid.destroy(false)
      } catch {
        // 이미 파괴된 경우 무시
      }
      grid = null
    }
  }

  /** @internal GridStack 레이아웃 압축 (빈 공간 제거) */
  const compact = () => {
    grid?.compact()
  }

  /**
   * 숨겨진 위젯을 GridStack에 추가
   * Vue v-for로 새로 추가된 DOM 요소를 GridStack 관리로 편입.
   * gs-* 속성을 먼저 갱신한 뒤 makeWidget으로 재등록한다.
   * @param el - .grid-stack-item 엘리먼트
   * @param cfg - 배치할 w, h (x/y 미지정 시 GridStack이 자동 배치)
   */
  const addWidget = (el: HTMLElement, cfg: { x?: number; y?: number; w: number; h: number }) => {
    if (!grid) return
    if (cfg.x !== undefined) el.setAttribute('gs-x', String(cfg.x))
    if (cfg.y !== undefined) el.setAttribute('gs-y', String(cfg.y))
    el.setAttribute('gs-w', String(cfg.w))
    el.setAttribute('gs-h', String(cfg.h))
    grid.makeWidget(el)
    compact()
  }

  /**
   * GridStack 엔진에서 현재 위치·크기를 읽어 반환
   * @returns 현재 그리드 노드 배열
   */
  const getGridNodes = (): GridStackNode[] => {
    return grid?.engine?.nodes ?? []
  }

  /**
   * GridStack change 이벤트 리스너 등록
   * @param cb - (nodes) 콜백
   */
  const onGridChange = (cb: (nodes: GridStackNode[]) => void) => {
    if (!grid) return
    grid.on('change', (_e: Event, nodes: GridStackNode[]) => cb(nodes ?? []))
  }

  /**
   * 드래그 완료 시 콜백 등록 (dragstop)
   */
  const onDragStop = (cb: () => void) => {
    if (!grid) return
    grid.on('dragstop', () => cb())
  }

  /**
   * 리사이즈 완료 시 콜백 등록 (resizestop)
   */
  const onResizeStop = (cb: () => void) => {
    if (!grid) return
    grid.on('resizestop', () => cb())
  }

  return {
    gridEl,
    initGrid,
    destroyGrid,
    addWidget,
    getGridNodes,
    onGridChange,
    onDragStop,
    onResizeStop,
  }
}

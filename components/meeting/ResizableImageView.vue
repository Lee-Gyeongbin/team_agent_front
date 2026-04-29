<template>
  <NodeViewWrapper
    as="figure"
    class="meeting2-image-wrap"
    :class="{ 'is-selected': props.selected, 'is-editable': props.editor.isEditable }"
    :style="wrapperStyle"
    data-drag-handle
  >
    <img
      ref="imgRef"
      :src="props.node.attrs.src"
      :alt="props.node.attrs.alt"
      :title="props.node.attrs.title"
      draggable="false"
      :style="props.node.attrs.width ? { width: '100%' } : { maxWidth: '100%' }"
    />

    <!-- 우하단 리사이즈 핸들 (편집 가능 시에만) -->
    <span
      v-if="props.editor.isEditable"
      class="meeting2-image-handle"
      @mousedown.prevent.stop="onResizeStart"
    ></span>

    <!-- 크기·정렬 단축 툴바 (선택 상태일 때만) -->
    <span
      v-if="props.editor.isEditable && props.selected"
      class="meeting2-image-toolbar"
    >
      <!-- 크기 -->
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        title="작게 (25%)"
        @mousedown.prevent="setWidthPercent(25)"
      >
        S
      </button>
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        title="중간 (50%)"
        @mousedown.prevent="setWidthPercent(50)"
      >
        M
      </button>
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        title="크게 (75%)"
        @mousedown.prevent="setWidthPercent(75)"
      >
        L
      </button>
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        title="원본"
        @mousedown.prevent="resetWidth"
      >
        원본
      </button>

      <span class="meeting2-image-toolbar-sep" />

      <!-- 정렬 -->
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        :class="{ 'is-active': currentAlign === 'left' }"
        title="왼쪽 정렬"
        @mousedown.prevent="setAlign('left')"
      >
        ≡←
      </button>
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        :class="{ 'is-active': currentAlign === 'center' }"
        title="가운데 정렬"
        @mousedown.prevent="setAlign('center')"
      >
        ≡
      </button>
      <button
        type="button"
        class="meeting2-image-toolbar-btn"
        :class="{ 'is-active': currentAlign === 'right' }"
        title="오른쪽 정렬"
        @mousedown.prevent="setAlign('right')"
      >
        ≡→
      </button>
    </span>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const imgRef = ref<HTMLImageElement | null>(null)

let rafId: number | null = null

// ===== 정렬 =====
const currentAlign = computed<string>(() => (props.node.attrs.textAlign as string) || 'left')

const setAlign = (align: 'left' | 'center' | 'right') => {
  props.updateAttributes({ textAlign: align })
}

// wrapper 스타일 — display: block + width: fit-content + margin auto 조합
const wrapperStyle = computed(() => {
  const s: Record<string, string> = {}
  if (props.node.attrs.width) s.width = props.node.attrs.width as string
  const align = currentAlign.value
  if (align === 'center') {
    s.marginLeft = 'auto'
    s.marginRight = 'auto'
  } else if (align === 'right') {
    s.marginLeft = 'auto'
    s.marginRight = '0'
  } else {
    s.marginLeft = '0'
    s.marginRight = 'auto'
  }
  return s
})

/** 우하단 핸들 드래그 → width 실시간 조정 (rAF 쓰로틀) */
const onResizeStart = (e: MouseEvent) => {
  const wrap = (e.currentTarget as HTMLElement).parentElement as HTMLElement | null
  if (!wrap) return

  const startX = e.clientX
  const startWidth = wrap.offsetWidth
  const parentWidth = (wrap.parentElement?.offsetWidth ?? 800) - 32

  document.body.style.cursor = 'nwse-resize'
  document.body.style.userSelect = 'none'

  const onMouseMove = (ev: MouseEvent) => {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      const delta = ev.clientX - startX
      const next = Math.max(80, Math.min(parentWidth, startWidth + delta))
      props.updateAttributes({ width: `${next}px` })
      rafId = null
    })
  }

  const onMouseUp = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

/** 단축 버튼: 부모 폭 기준 % */
const setWidthPercent = (percent: number) => {
  props.updateAttributes({ width: `${percent}%` })
}

/** 원본 크기로 복원 */
const resetWidth = () => {
  props.updateAttributes({ width: null })
}
</script>

<style lang="scss" scoped>
.meeting2-image-wrap {
  position: relative;
  // fit-content: 이미지 자연 크기로 수축 → margin: auto 가 동작해 좌/중/우 정렬 가능
  // 명시적 width(:style) 지정 시 해당 크기로 고정됨
  display: block;
  width: fit-content;
  margin-top: 8px;
  margin-bottom: 8px;
  max-width: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0;
    border-radius: 4px;
  }

  &.is-selected,
  &:hover.is-editable {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

// 우하단 리사이즈 핸들
.meeting2-image-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  background: var(--color-primary);
  border: 2px solid #fff;
  border-radius: 50%;
  cursor: nwse-resize !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 2;

  .meeting2-image-wrap.is-editable:hover &,
  .meeting2-image-wrap.is-selected & {
    opacity: 1;
  }
}

// 선택 시 상단에 노출되는 단축 툴바 (S/M/L/원본)
.meeting2-image-toolbar {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  line-height: 1;
  z-index: 3;
  white-space: nowrap;
}

.meeting2-image-toolbar-sep {
  display: inline-block;
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: #e2e8f0;
  vertical-align: middle;
}

.meeting2-image-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: var(--color-primary);
  }

  &.is-active {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }
}
</style>

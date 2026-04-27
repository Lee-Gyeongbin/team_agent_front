<template>
  <NodeViewWrapper
    as="span"
    class="meeting-image-wrap"
    :class="{ 'is-selected': selected, 'is-editable': editor.isEditable }"
    :style="{ width: node.attrs.width || undefined }"
  >
    <img
      ref="imgRef"
      :src="node.attrs.src"
      :alt="node.attrs.alt"
      :title="node.attrs.title"
      draggable="false"
    />
    <!-- 우하단 리사이즈 핸들 (편집 가능 시에만) -->
    <span
      v-if="editor.isEditable"
      class="meeting-image-handle"
      @mousedown.prevent.stop="onResizeStart"
    ></span>

    <!-- 정렬 / 크기 단축 버튼 (선택 상태일 때만) -->
    <span
      v-if="editor.isEditable && selected"
      class="meeting-image-toolbar"
    >
      <button
        type="button"
        class="meeting-image-toolbar-btn"
        title="작게 (25%)"
        @mousedown.prevent="setWidthPercent(25)"
      >
        S
      </button>
      <button
        type="button"
        class="meeting-image-toolbar-btn"
        title="중간 (50%)"
        @mousedown.prevent="setWidthPercent(50)"
      >
        M
      </button>
      <button
        type="button"
        class="meeting-image-toolbar-btn"
        title="크게 (75%)"
        @mousedown.prevent="setWidthPercent(75)"
      >
        L
      </button>
      <button
        type="button"
        class="meeting-image-toolbar-btn"
        title="원본"
        @mousedown.prevent="resetWidth"
      >
        원본
      </button>
    </span>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)

const imgRef = ref<HTMLImageElement | null>(null)

let rafId: number | null = null

/** 우하단 핸들 드래그 → width 실시간 조정 (rAF 쓰로틀) */
const onResizeStart = (e: MouseEvent) => {
  const wrap = (e.currentTarget as HTMLElement).parentElement as HTMLElement | null
  if (!wrap) return

  const startX = e.clientX
  const startWidth = wrap.offsetWidth
  const parentWidth = (wrap.parentElement?.offsetWidth ?? 800) - 32 // 패딩 여유

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

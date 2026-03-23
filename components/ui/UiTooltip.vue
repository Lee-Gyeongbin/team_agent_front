<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          class="ui-tooltip-content"
          :class="contentClass"
          :side="side"
          :side-offset="sideOffset"
          :align="align"
        >
          <slot name="content">
            {{ content }}
          </slot>
          <TooltipArrow
            v-if="showArrow"
            class="ui-tooltip-arrow"
          />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>

<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'radix-vue'

interface Props {
  content?: string
  /** Radix 포탈용 — 콘텐츠 박스에 추가 클래스 (페이지별 스타일 오버라이드) */
  contentClass?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
  showArrow?: boolean
}

withDefaults(defineProps<Props>(), {
  content: '',
  contentClass: '',
  side: 'top',
  sideOffset: 6,
  align: 'center',
  delayDuration: 200,
  showArrow: true,
})
</script>

<style lang="scss">
// 글로벌: Radix 포탈이 body에 렌더링되므로 scoped 적용 불가
.ui-tooltip-content {
  padding: 6px 10px;
  background: $color-text-dark;
  color: #fff;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  line-height: 1.5;
  max-width: 240px;
  word-break: keep-all;
  z-index: $z-toast;
  box-shadow: $shadow-md;

  // 애니메이션
  animation: ui-tooltip-fade-in 150ms ease-out;
}

.ui-tooltip-arrow {
  fill: $color-text-dark;
}

@keyframes ui-tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

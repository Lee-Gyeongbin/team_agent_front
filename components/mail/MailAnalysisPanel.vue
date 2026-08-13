<template>
  <div
    class="mail-analysis-panel"
    :class="{ 'is-collapsed': collapsed }"
  >
    <div
      class="mail-analysis-head"
      :class="{ 'is-clickable': collapsed }"
      @click="onHeadClick"
    >
      <h3>
        <span class="mail-analysis-dot" />
        AI 메일 요약
      </h3>
      <button
        type="button"
        class="mail-chat-expand-btn"
        :aria-label="collapsed ? 'AI 요약 패널 펼치기' : 'AI 요약 패널 접기'"
        @click.stop="emit('toggle-analysis')"
      >
        <i
          class="icon-arrow-down size-16"
          :class="{ 'is-up': !collapsed }"
        />
      </button>
    </div>

    <div
      v-show="!collapsed"
      class="mail-analysis-body"
    >
      <!-- 로딩 -->
      <template v-if="isLoading">
        <div class="mail-briefing-skeleton">
          <span
            v-for="i in 5"
            :key="i"
            class="mail-skeleton mail-skeleton-line"
            :style="{ width: i % 2 === 0 ? '75%' : '100%' }"
          />
        </div>
      </template>

      <!-- 빈 상태 -->
      <div
        v-else-if="!summary"
        class="mail-analysis-empty"
      >
        현재 조건의 메일을 AI가 요약하면<br />여기에 표시됩니다.
      </div>

      <!-- 요약 내용 -->
      <!-- eslint-disable-next-line vue/no-v-html — toHtmlContent 내 DOMPurify 안전 처리 적용 -->
      <div
        v-else
        class="mail-analysis-summary-md markdown-body"
        v-html="renderedSummary"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toHtmlContent } from '~/utils/chat/htmlUtil'

const props = defineProps<{
  summary: string
  isLoading: boolean
  collapsed?: boolean
}>()

const emit = defineEmits<{
  'toggle-analysis': []
  expand: []
}>()

const renderedSummary = computed(() => {
  // 단일 \n + 불릿(-/*/+) 조합은 marked가 리스트로 인식 못함 (breaks:true 환경)
  // → 불릿 앞에 빈 줄(\n\n) 보장
  const normalized = props.summary.replace(/([^\n])\n([ \t]*[-*+] )/g, '$1\n\n$2')
  return toHtmlContent(normalized)
})

const onHeadClick = () => {
  // collapsed 상태에서 헤더 클릭 시 펼치기
}
</script>

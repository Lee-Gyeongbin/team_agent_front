<template>
  <div
    ref="root"
    class="inq-composer"
    :class="{ 'is-new': isNew }"
  >
    <p class="inq-sub-title">{{ title }}</p>
    <UiMarkdownEditor
      :model-value="text"
      :placeholder="isNew ? '관리자 답변 내용을 입력하세요' : '내용을 입력하세요'"
      @update:model-value="(value) => $emit('update:text', value)"
    />
    <div class="inq-cmt-actions end">
      <UiButton
        variant="outline"
        size="sm"
        @click="$emit('cancel')"
      >
        취소
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        @click="$emit('save')"
      >
        저장
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiMarkdownEditor } from '@leechanyong/ispark-ui'

defineProps<{
  title: string
  text: string
  /** 관리자 답변 신규 등록 입력창 */
  isNew?: boolean
}>()

defineEmits<{
  'update:text': [value: string]
  save: []
  cancel: []
}>()

/** 입력창이 열리면 저장·취소 버튼까지 보이도록 스크롤 영역 안으로 가져온다 */
const root = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null
onMounted(() => {
  const el = root.value
  if (!el) return
  const reveal = () => el.scrollIntoView({ block: 'nearest' })
  nextTick(reveal)
  // 에디터가 늦게 그려져 높이가 늘어나므로, 사용자가 조작하기 전까지(최대 5초) 크기 변화에 맞춰 다시 맞춘다
  resizeObserver = new ResizeObserver(reveal)
  resizeObserver.observe(el)
  const stop = () => resizeObserver?.disconnect()
  el.addEventListener('pointerdown', stop, { once: true })
  el.addEventListener('keydown', stop, { once: true })
  stopTimer = setTimeout(stop, 5000)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (stopTimer) clearTimeout(stopTimer)
})
</script>

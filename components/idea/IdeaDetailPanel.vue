<template>
  <UiDrawer
    :open="isOpen"
    :title="idea?.title || '아이디어'"
    position="right"
    width="65vw"
    show-resize
    show-fullscreen
    persist-key="idea-detail"
    :confirm-before-close="false"
    @update:open="(v) => !v && $emit('close')"
  >
    <div
      v-if="idea"
      class="notice-detail-panel idea-detail-panel"
    >
      <IdeaDetailContent
        :idea="idea"
        @like="$emit('like')"
      />
      <IdeaComments
        v-if="isOpen"
        :key="idea.ideaId"
        :idea-id="idea.ideaId"
        :comment-count="idea.commentCnt"
        :jump-to-comments="jumpToComments"
        @comment-count="(ideaId, count) => $emit('comment-count', ideaId, count)"
      />
    </div>

    <template
      v-if="isMine && idea"
      #footer
    >
      <div class="modal-side-footer">
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('edit')"
        >
          수정
        </UiButton>
        <UiButton
          variant="line-secondary"
          size="md"
          @click="$emit('delete')"
        >
          삭제
        </UiButton>
      </div>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import { UiButton, UiDrawer } from '@leechanyong/ispark-ui'
import IdeaComments from '~/components/idea/IdeaComments.vue'
import type { IdeaDetail } from '~/types/idea'

interface Props {
  isOpen: boolean
  idea: IdeaDetail | null
  jumpToComments: boolean
  isMine: boolean
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  like: []
  'comment-count': [ideaId: string, count: number]
  edit: []
  delete: []
}>()

// 열릴 때마다 1/2 너비를 기본 선택 (헤더의 가운데 버튼이 선택된 상태)
watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    try {
      localStorage.setItem('ui-drawer-preset:idea-detail', 'half')
    } catch {
      // 저장소 차단 시 기본 너비로 열린다
    }
  },
  { flush: 'sync' },
)
</script>

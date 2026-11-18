<template>
  <UiDrawer
    :open="isOpen"
    :title="idea?.title || '아이디어'"
    position="right"
    width="50%"
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
        @download="(file) => $emit('download', file)"
      />

      <div class="idea-comment-section">
        <h4 class="idea-comment-title">관리자 코멘트</h4>
        <div
          v-if="idea.cmtContent"
          class="idea-comment-box"
        >
          <!-- v-html: toIdeaContentHtml에서 DOMPurify로 정제한 값만 사용 -->
          <div
            class="idea-comment-text idea-rich"
            v-html="toIdeaContentHtml(idea.cmtContent)"
          />
          <p class="idea-comment-meta">— {{ idea.cmtUserNm || '관리자' }} · {{ idea.cmtDt }}</p>
        </div>
        <div
          v-else
          class="idea-comment-empty"
        >
          아직 등록된 관리자 코멘트가 없습니다.
        </div>
        <p
          v-if="isMine && idea.cmtContent"
          class="idea-comment-note"
        >
          답변이 등록된 글은 수정·삭제할 수 없습니다.
        </p>
      </div>
    </div>

    <template
      v-if="isMine && idea && !idea.cmtContent"
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
import { toIdeaContentHtml } from '~/utils/idea/ideaRichText'
import type { IdeaDetail, IdeaFile } from '~/types/idea'

interface Props {
  isOpen: boolean
  idea: IdeaDetail | null
  isMine: boolean
}

defineProps<Props>()

defineEmits<{
  close: []
  like: []
  edit: []
  delete: []
  download: [file: IdeaFile]
}>()
</script>

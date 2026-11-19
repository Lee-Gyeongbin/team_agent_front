<template>
  <UiDrawer
    :open="isOpen"
    :title="inq?.title ?? ''"
    position="right"
    width="65vw"
    persist-key="inq-detail"
    :confirm-before-close="false"
    @update:open="(v) => !v && $emit('close')"
  >
    <div
      v-if="inq"
      class="notice-detail-panel inq-detail-panel"
    >
      <InqDetailContent
        :inq="inq"
        :files="files"
        :status-flag="statusFlag"
        :is-masked="isMasked"
        @download-file="(file) => $emit('download-file', file)"
      />

      <!-- 관리자 답변 · 댓글 (구분선 아래) -->
      <div
        v-if="!isMasked && answers.length"
        class="inq-thread-wrap"
      >
        <InqAnswerList
          :answers="answers"
          :composer="composer"
          :max-depth="maxDepth"
          :can-reply="canReply"
          :can-edit-ansr="canEditAnsr"
          @start-reply="(a) => $emit('start-reply', a)"
          @start-edit="(a) => $emit('start-edit', a)"
          @delete-ansr="(a) => $emit('delete-ansr', a)"
          @update:composer-text="(value) => $emit('update:composerText', value)"
          @save-composer="$emit('save-composer')"
          @cancel-composer="$emit('cancel-composer')"
        />
      </div>
    </div>

    <template
      v-if="inq && canEdit"
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
import type { InqAnsr, InqComposer, InqFile, InqItem } from '~/types/inq'
import InqAnswerList from '~/components/inq/InqAnswerList.vue'
import InqDetailContent from '~/components/inq/InqDetailContent.vue'

defineProps<{
  isOpen: boolean
  inq: InqItem | null
  files: InqFile[]
  /** 부모 → 자식 순서로 정렬된 답변·댓글 */
  answers: InqAnsr[]
  composer: InqComposer | null
  /** 현재 문의 처리상태의 배지 구분값 — 배지 색 */
  statusFlag: string | null
  /** 답변·댓글 최대 단계 — 들여쓰기 한도 */
  maxDepth: number
  /** 비밀글이라 본문을 볼 수 없는 상태 */
  isMasked: boolean
  /** 본인 글 수정·삭제 가능 여부 */
  canEdit: boolean
  canReply: boolean
  canEditAnsr: (a: InqAnsr) => boolean
}>()

defineEmits<{
  close: []
  edit: []
  delete: []
  'download-file': [file: InqFile]
  'start-reply': [a: InqAnsr]
  'start-edit': [a: InqAnsr]
  'delete-ansr': [a: InqAnsr]
  'update:composerText': [value: string]
  'save-composer': []
  'cancel-composer': []
}>()
</script>

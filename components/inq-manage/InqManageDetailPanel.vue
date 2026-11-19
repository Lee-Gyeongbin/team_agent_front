<template>
  <UiDrawer
    :open="isOpen"
    :title="inq?.title ?? ''"
    position="right"
    width="65vw"
    persist-key="inq-manage-detail"
    :confirm-before-close="false"
    @update:open="(v) => !v && $emit('close')"
  >
    <div
      v-if="inq"
      class="notice-detail-panel inq-manage-detail-panel"
    >
      <InqDetailContent
        :inq="inq"
        :files="files"
        :status-flag="statusFlag"
        @download-file="(file) => $emit('download-file', file)"
      />

      <!-- 처리상태 · 관리자 답변 · 댓글 (구분선 아래) -->
      <div class="inq-thread-wrap">
        <div
          v-if="hasFunc"
          class="inq-status-row"
        >
          <label class="url-reg-label">처리상태</label>
          <UiSelect
            :model-value="statusDraft"
            :options="statusOptions"
            :placeholder="`${inq.statusNm} (현재)`"
            size="md"
            @update:model-value="(v) => $emit('update:statusDraft', String(v ?? ''))"
          />
          <UiButton
            variant="outline"
            size="md"
            :disabled="!statusDraft"
            @click="$emit('save-status')"
          >
            상태 저장
          </UiButton>
        </div>

        <InqAnswerList
          :answers="answers"
          :composer="composer"
          :max-depth="maxDepth"
          :can-reply="hasFunc"
          :can-edit-ansr="canEditAnsr"
          @start-reply="(a) => $emit('start-reply', a)"
          @start-edit="(a) => $emit('start-edit', a)"
          @delete-ansr="(a) => $emit('delete-ansr', a)"
          @update:composer-text="(value) => $emit('update:composerText', value)"
          @save-composer="$emit('save-composer')"
          @cancel-composer="$emit('cancel-composer')"
        />

        <InqAnsrComposer
          v-if="composer?.mode === 'new'"
          title="관리자 답변 등록"
          :text="composer.text"
          is-new
          @update:text="(value) => $emit('update:composerText', value)"
          @save="$emit('save-composer')"
          @cancel="$emit('cancel-composer')"
        />
        <UiButton
          v-else-if="!composer && canWriteAnswer"
          variant="outline"
          size="sm"
          @click="$emit('start-new-answer')"
        >
          관리자 답변 등록
        </UiButton>
      </div>
    </div>

    <template
      v-if="inq && hasFunc"
      #footer
    >
      <div class="modal-side-footer">
        <UiButton
          variant="danger-line"
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
import { UiButton, UiDrawer, UiSelect } from '@leechanyong/ispark-ui'
import type { InqAnsr, InqComposer, InqFile, InqItem } from '~/types/inq'
import InqAnswerList from '~/components/inq/InqAnswerList.vue'
import InqAnsrComposer from '~/components/inq/InqAnsrComposer.vue'
import InqDetailContent from '~/components/inq/InqDetailContent.vue'

const props = defineProps<{
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
  statusDraft: string
  statusOptions: { label: string; value: string }[]
  /** 메뉴 기능 권한 — 상태 변경·답변·삭제 */
  hasFunc: boolean
  /** 관리자 답변(1단계) 신규 등록 가능 여부 */
  canWriteAnswer: boolean
}>()

defineEmits<{
  close: []
  delete: []
  'download-file': [file: InqFile]
  'update:statusDraft': [value: string]
  'save-status': []
  'start-new-answer': []
  'start-reply': [a: InqAnsr]
  'start-edit': [a: InqAnsr]
  'delete-ansr': [a: InqAnsr]
  'update:composerText': [value: string]
  'save-composer': []
  'cancel-composer': []
}>()

/** 관리자 화면은 기능 권한이 있으면 모든 답변·댓글을 수정·삭제할 수 있다 */
const canEditAnsr = () => props.hasFunc
</script>

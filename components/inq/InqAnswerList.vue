<template>
  <div
    v-if="answers.length"
    class="inq-answer-list"
  >
    <h4 class="inq-sub-title">관리자 답변 · 댓글</h4>
    <template
      v-for="a in answers"
      :key="a.ansrId"
    >
      <div
        v-if="!isEditing(a)"
        :id="`inq-ansr-${a.ansrId}`"
        class="inq-cmt"
        :style="indentStyle(a)"
      >
        <div class="inq-cmt-head">
          <strong>{{ writerOf(a) }}</strong>
          <span class="inq-cmt-date">{{ toInqDateOnly(a.createDt) }}</span>
        </div>
        <button
          v-if="a.upAnsrId"
          type="button"
          class="inq-cmt-to"
          @click="scrollToAnsr(a.upAnsrId)"
        >
          → {{ writerOfId(a.upAnsrId) }}님에게 답변
        </button>
        <!-- eslint-disable vue/no-v-html -- Sanitized by toInqAnswerHtml -->
        <div
          v-if="isInqAnswerHtml(a.content)"
          class="inq-rich inq-comment-content"
          v-html="toInqAnswerHtml(a.content)"
        />
        <!-- eslint-enable vue/no-v-html -->
        <UiMarkdownEditor
          v-else
          :model-value="a.content"
          :editable="false"
        />
        <div
          v-if="canReply || canEditAnsr(a)"
          class="inq-cmt-actions"
        >
          <UiButton
            v-if="canReply"
            variant="outline"
            size="xs"
            @click="$emit('start-reply', a)"
          >
            답글
          </UiButton>
          <template v-if="canEditAnsr(a)">
            <UiButton
              variant="outline"
              size="xs"
              @click="$emit('start-edit', a)"
            >
              수정
            </UiButton>
            <UiButton
              variant="danger-line"
              size="xs"
              @click="$emit('delete-ansr', a)"
            >
              삭제
            </UiButton>
          </template>
        </div>
      </div>
      <InqAnsrComposer
        v-if="isComposerOn(a)"
        :key="composer?.mode"
        :save-disabled="!composer?.text.trim()"
        :title="composerTitle"
        :text="composer?.text ?? ''"
        class="inq-composer-inline"
        :style="indentStyle(a)"
        @update:text="(value) => $emit('update:composerText', value)"
        @save="$emit('save-composer')"
        @cancel="$emit('cancel-composer')"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { UiButton, UiMarkdownEditor } from '@leechanyong/ispark-ui'
import type { InqAnsr, InqComposer } from '~/types/inq'
import { isInqAnswerHtml, toInqAnswerHtml, toInqDateOnly } from '~/utils/inq/inqUtil'
import InqAnsrComposer from '~/components/inq/InqAnsrComposer.vue'

/** 단계당 들여쓰기(px) */
const INQ_ANSR_INDENT = 24

const props = defineProps<{
  /** 부모 → 자식 순서로 정렬된 답변·댓글 */
  answers: InqAnsr[]
  composer: InqComposer | null
  /** 답변·댓글 최대 단계 — 들여쓰기 한도 */
  maxDepth: number
  canReply: boolean
  canEditAnsr: (a: InqAnsr) => boolean
}>()

defineEmits<{
  'start-reply': [a: InqAnsr]
  'start-edit': [a: InqAnsr]
  'delete-ansr': [a: InqAnsr]
  'update:composerText': [value: string]
  'save-composer': []
  'cancel-composer': []
}>()

const writerOf = (a: InqAnsr) => (a.depth === 1 ? '관리자' : a.ansrUserNm || a.ansrUserId)

const writerOfId = (ansrId: string) => {
  const target = props.answers.find((a) => a.ansrId === ansrId)
  return target ? writerOf(target) : ''
}

const indentStyle = (a: InqAnsr) => ({ marginLeft: `${(Math.min(a.depth, props.maxDepth) - 1) * INQ_ANSR_INDENT}px` })

const composerTitle = computed(() =>
  props.composer?.mode === 'reply' ? `${writerOfId(props.composer.targetId)}님에게 답글` : '댓글 수정',
)

/** 수정 중인 댓글은 원본 대신 입력창이 그 자리에 열린다 */
const isEditing = (a: InqAnsr) => props.composer?.mode === 'edit' && props.composer.targetId === a.ansrId

/** 답글 입력창은 대상 댓글 바로 아래, 수정 입력창은 원본 자리에 둔다 (새 관리자 답변 입력창은 목록 밖) */
const isComposerOn = (a: InqAnsr) =>
  !!props.composer && props.composer.mode !== 'new' && props.composer.targetId === a.ansrId

const scrollToAnsr = (ansrId: string) => {
  const el = document.getElementById(`inq-ansr-${ansrId}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('is-flash')
  setTimeout(() => el.classList.remove('is-flash'), 1200)
}
</script>

<template>
  <section class="idea-comment-thread">
    <div class="inq-thread-wrap">
      <h4 v-if="canComment" class="inq-sub-title">댓글 등록</h4>
      <InqAnsrComposer
        v-if="canComment"
        :text="newCommentText"
        :disabled="busy"
        :save-disabled="!newCommentText.trim()"
        placeholder="댓글을 입력하세요"
        save-label="등록"
        hide-cancel
        skip-auto-scroll
        @update:text="newCommentText = $event"
        @save="submitComment(true)"
      />

      <div class="inq-answer-list" :class="{ 'idea-comment-list-separated': canComment }">
        <h4 class="inq-sub-title">댓글</h4>
        <p v-if="loadError" role="status">
          {{ loadError }}
          <UiButton size="xs" variant="outline" @click="loadComments">다시 불러오기</UiButton>
        </p>
        <p v-else-if="loading && !comments.length" role="status">댓글을 불러오는 중입니다.</p>
        <p v-else-if="!comments.length">등록된 댓글이 없습니다.</p>
        <template v-for="{ comment, depth } in orderedComments" :key="comment.commentId">
          <article
            v-if="composer?.mode !== 'edit' || composer.target.commentId !== comment.commentId"
            :id="`idea-comment-${comment.commentId}`"
            class="inq-cmt"
            :style="{ marginInlineStart: `${depth * 24}px` }"
          >
            <div class="inq-cmt-head">
              <strong>{{ writer(comment) }}</strong>
              <span class="inq-cmt-date">{{ comment.createDt }}</span>
            </div>
            <button
              v-if="comment.parentId"
              type="button"
              class="inq-cmt-to"
              @click="scrollToComment(comment.parentId)"
            >
              → {{ writer(commentsById.get(comment.parentId)) }}님에게 답변
            </button>
            <div class="idea-rich" v-html="comment.content" />
            <div v-if="canComment" class="inq-cmt-actions">
              <UiButton size="xs" variant="outline" :disabled="busy" @click="startComposer('reply', comment)">답글</UiButton>
              <template v-if="comment.createId === user?.userId">
                <UiButton size="xs" variant="outline" :disabled="busy" @click="startComposer('edit', comment)">수정</UiButton>
                <UiButton size="xs" variant="danger-line" :disabled="busy" @click="removeComment(comment)">삭제</UiButton>
              </template>
            </div>
          </article>
          <InqAnsrComposer
            v-if="canComment && composer?.target.commentId === comment.commentId"
            :key="composer.mode"
            class="inq-composer-inline"
            :style="{ marginInlineStart: `${depth * 24}px` }"
            :title="composer.mode === 'reply' ? `${writer(comment)}님에게 답글` : '댓글 수정'"
            :text="text"
            :disabled="busy"
            :save-disabled="!text"
            :placeholder="composer.mode === 'reply' ? '답글을 입력하세요' : '댓글을 수정하세요'"
            @update:text="text = $event"
            @save="submitComment(false)"
            @cancel="resetComposer"
          />
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { UiButton } from '@leechanyong/ispark-ui'
import { marked } from 'marked'
import { useIdeaApi } from '~/composables/idea/useIdeaApi'
import { openConfirm } from '~/composables/useDialog'
import InqAnsrComposer from '~/components/inq/InqAnsrComposer.vue'
import type { IdeaComment, IdeaResult } from '~/types/idea'

const props = defineProps<{ ideaId: string }>()
const { user } = useAuth()
const { canFunc } = usePermission()
const { fetchIdeaComments, saveIdeaComment, deleteIdeaComment } = useIdeaApi()
const comments = ref<IdeaComment[]>([])
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const busy = computed(() => loading.value || saving.value)
const canComment = computed(() => !loadError.value && canFunc('/idea') && Boolean(user.value?.userId))
const newCommentText = ref('')
const text = ref('')
const composer = ref<{ mode: 'reply' | 'edit'; target: IdeaComment } | null>(null)

const commentsById = computed(() => new Map(comments.value.map((comment) => [comment.commentId, comment])))
const orderedComments = computed(() => {
  const children = new Map<string | null, IdeaComment[]>()
  for (const comment of comments.value) {
    // The JSON view serializes a null parent ID as an empty string.
    const parentId = comment.parentId || null
    const siblings = children.get(parentId) ?? []
    siblings.push(comment)
    children.set(parentId, siblings)
  }
  const ordered: { comment: IdeaComment; depth: number }[] = []
  const pending = (children.get(null) ?? []).map((comment) => ({ comment, depth: 0 })).reverse()
  while (pending.length) {
    const row = pending.pop()!
    ordered.push(row)
    const replies = children.get(row.comment.commentId) ?? []
    for (let i = replies.length - 1; i >= 0; i--) {
      pending.push({ comment: replies[i]!, depth: Math.min(row.depth + 1, 2) })
    }
  }
  return ordered
})

const writer = (comment?: IdeaComment) => comment?.createNm || '사용자'
const scrollToComment = (id: string) => {
  const target = document.getElementById(`idea-comment-${id}`)
  if (!target) return
  target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  target.classList.add('is-flash')
  setTimeout(() => target.classList.remove('is-flash'), 1200)
}

function checkResult<T>(result: IdeaResult<T>, fallback: string) {
  if (result.result !== 'SUCCESS') throw new Error(result.msg || fallback)
}

async function loadComments() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await fetchIdeaComments(props.ideaId)
    checkResult(result, '댓글을 불러오지 못했습니다.')
    comments.value = result.data ?? []
  } catch {
    loadError.value = '댓글을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function startComposer(mode: 'reply' | 'edit', target: IdeaComment) {
  composer.value = { mode, target }
  text.value = mode === 'edit' ? target.content : ''
}

function resetComposer() {
  composer.value = null
  text.value = ''
}

async function submitComment(isNew: boolean) {
  const content = (isNew ? newCommentText.value : text.value).trim()
  if (busy.value || !canComment.value || !content) return
  saving.value = true
  try {
    const current = isNew ? null : composer.value
    const result = await saveIdeaComment(props.ideaId, {
      content: marked.parse(content, { async: false }),
      commentId: current?.mode === 'edit' ? current.target.commentId : undefined,
      parentId: current?.mode === 'reply' ? current.target.commentId : undefined,
    })
    checkResult(result, '댓글을 저장하지 못했습니다.')
    if (isNew) newCommentText.value = ''
    else resetComposer()
    await loadComments()
  } catch (error) {
    openToast({ message: error instanceof Error ? error.message : '댓글을 저장하지 못했습니다.', type: 'error' })
  } finally {
    saving.value = false
  }
}

async function removeComment(comment: IdeaComment) {
  if (busy.value || !canComment.value || comment.createId !== user.value?.userId) return
  saving.value = true
  try {
    const confirmed = await openConfirm({
      title: '댓글 삭제',
      message: '댓글과 그 아래에 달린 답글을 모두 삭제하시겠습니까?',
      confirmText: '삭제',
    })
    if (!confirmed) return
    const result = await deleteIdeaComment(props.ideaId, comment.commentId)
    checkResult(result, '댓글을 삭제하지 못했습니다.')
    if (composer.value) resetComposer()
    await loadComments()
  } catch (error) {
    openToast({ message: error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.', type: 'error' })
  } finally {
    saving.value = false
  }
}

onMounted(loadComments)
</script>

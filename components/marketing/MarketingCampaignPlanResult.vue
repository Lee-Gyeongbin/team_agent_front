<template>
  <div class="marketing-campaign-plan-result">
    <button
      class="marketing-back-btn"
      type="button"
      @click="emit('close')"
    >
      <UiIcon
        name="arrow-right"
        size="16"
        class="marketing-back-btn__arrow"
      />
      제작 내역
    </button>

    <div class="marketing-list-header">
      <div class="marketing-list-header__copy">
        <h1 class="marketing-list-title">프로젝트 기획서</h1>
        <p class="marketing-list-desc">{{ displayHeaderMeta }}</p>
      </div>
      <div class="marketing-list-header__actions">
        <UiButton
          variant="outline"
          size="md"
          @click="emit('regenerate')"
        >
          동일 조건으로 재생성
        </UiButton>
        <UiButton
          variant="outline"
          size="md"
          @click="emit('backToForm')"
        >
          입력값 다시 선택하기
        </UiButton>
        <UiButton
          variant="primary"
          size="md"
          @click="onStartContent"
        >
          이 기획으로 콘텐츠 제작 시작
          <template #icon-right>
            <UiIcon
              name="arrow-right"
              size="16"
            />
          </template>
        </UiButton>
      </div>
    </div>

    <div class="marketing-campaign-plan-result__body">
      <section class="marketing-campaign-plan-result__doc">
        <div class="marketing-campaign-plan-result__toolbar">
          <span class="marketing-campaign-plan-result__toolbar-label">
            <span class="marketing-campaign-plan-result__toolbar-dot" />
            프로젝트 기획서
          </span>
          <div class="marketing-campaign-plan-result__toolbar-actions">
            <span
              v-if="isDirty"
              class="marketing-campaign-plan-result__dirty"
            >
              저장하지 않은 수정 내용이 있습니다
            </span>
            <!-- 커서가 있는 줄을 본문/소제목으로 바꾼다. 소제목이 기획서 항목 제목이 된다 -->
            <select
              class="marketing-campaign-plan-result__block-select"
              :value="currentBlockType"
              :disabled="isSavingEdit || isApplying"
              aria-label="문단 형식"
              @change="onChangeBlockType"
            >
              <option value="paragraph">본문</option>
              <option value="heading">소제목</option>
            </select>
            <UiButton
              variant="primary"
              size="sm"
              :disabled="!isDirty || isSavingEdit || isApplying"
              @click="onSaveEdit"
            >
              {{ isSavingEdit ? '저장 중...' : '저장' }}
            </UiButton>
          </div>
        </div>

        <div class="marketing-campaign-plan-result__scroll">
          <article class="marketing-campaign-plan-result__article">
            <h2>{{ draft.productNm || projectNm }} 프로젝트 전략</h2>
            <p class="marketing-campaign-plan-result__period">{{ dueDateLabel }} · {{ draft.goal }}</p>

            <!-- 본문·소제목만 쓰는 편집 영역. 소제목(h3)이 항목 제목, 그 아래 문단이 항목 내용이며 저장 버튼으로 반영한다 -->
            <EditorContent :editor="docEditor" />
          </article>
        </div>
      </section>

      <aside class="marketing-campaign-plan-result__aside">
        <UiTab
          v-model="refineTab"
          :tabs="REFINE_TABS"
        />

        <div
          v-if="refineTab === 'chat'"
          class="marketing-campaign-plan-result__chat"
        >
          <div
            ref="chatListRef"
            class="marketing-campaign-plan-result__chat-list"
          >
            <p
              v-for="entry in chatLog"
              :key="entry.id"
              class="marketing-campaign-plan-result__bubble"
              :class="{ 'is-user': entry.role === 'user' }"
            >
              {{ entry.text }}
            </p>
          </div>
          <div class="marketing-campaign-plan-result__chat-bar">
            <UiInput
              v-model="chatDraft"
              placeholder="예) 추천 채널에 LinkedIn도 추가해주세요"
              size="sm"
              :disabled="isApplying"
              @enter="onSendChat"
            />
            <UiButton
              variant="primary"
              size="sm"
              :disabled="isApplying"
              @click="onSendChat"
            >
              전송
            </UiButton>
          </div>
        </div>

        <div
          v-else
          class="marketing-campaign-plan-result__prompt"
        >
          <UiTextarea
            v-model="promptDraft"
            placeholder="수정할 내용을 프롬프트로 입력해 주세요."
            :rows="8"
            border
            size="sm"
            :auto-resize="false"
            :disabled="isApplying"
          />
          <UiButton
            variant="primary"
            size="md"
            :disabled="isApplying"
            @click="onSendPrompt"
          >
            적용하기
          </UiButton>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { UiButton, UiIcon, UiInput, UiTab, UiTextarea } from '@leechanyong/ispark-ui'
import { useMarketingStore } from '~/composables/marketing/useMarketingStore'
import type { MarketingCampaignPlanDraft, MarketingCampaignPlanSection } from '~/types/marketing'

const props = withDefaults(
  defineProps<{
    projectNm?: string
    draft: MarketingCampaignPlanDraft
    dueDateLabel?: string
    visibilityLabel?: string
  }>(),
  {
    projectNm: '',
    dueDateLabel: '',
    visibilityLabel: '',
  },
)

const emit = defineEmits<{
  close: []
  backToForm: []
  regenerate: []
  startContent: [payload: MarketingCampaignPlanDraft]
  refined: [payload: MarketingCampaignPlanDraft]
}>()

const { handleRefineMarketingPlan, handleUpdateMarketingPlan } = useMarketingStore()

const REFINE_TABS = [
  { label: 'AI와 대화하며 수정', value: 'chat' },
  { label: '프롬프트로 수정', value: 'prompt' },
]

const refineTab = ref('chat')
const chatDraft = ref('')
const promptDraft = ref('')
const isApplying = ref(false)
const chatListRef = ref<HTMLElement | null>(null)
let chatSeq = 1
const chatLog = ref<{ id: number; role: 'assistant' | 'user'; text: string }[]>([])

const displayHeaderMeta = computed(() => {
  const projectNm = props.projectNm.trim() || '-'
  return `${projectNm} · 목적 ${props.draft.goal.trim() || '-'} · 대상 ${props.draft.targetNm.trim() || '-'} · 종료일 ${props.dueDateLabel || '-'} · 공개 대상 ${props.visibilityLabel || '-'}`
})

const scrollChatList = () => {
  nextTick(() => {
    const list = chatListRef.value
    if (!list) return
    list.scrollTop = list.scrollHeight
  })
}

const onSendChat = async () => {
  const request = chatDraft.value.trim()
  if (!request) {
    openToast({ message: '수정할 내용을 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  if (!(await confirmDiscardUnsavedEdit())) return
  isApplying.value = true
  chatLog.value.push({ id: chatSeq++, role: 'user', text: request })
  chatDraft.value = ''
  scrollChatList()
  try {
    const plan = await handleRefineMarketingPlan(request)
    if (!plan) return
    emit('refined', plan)
    chatLog.value.push({ id: chatSeq++, role: 'assistant', text: '기획서를 수정했습니다.' })
    scrollChatList()
  } finally {
    isApplying.value = false
  }
}

const onSendPrompt = async () => {
  const request = promptDraft.value.trim()
  if (!request) {
    openToast({ message: '프롬프트를 입력해 주세요.', type: 'warning' })
    return
  }
  if (isApplying.value) return
  if (!(await confirmDiscardUnsavedEdit())) return
  isApplying.value = true
  try {
    const plan = await handleRefineMarketingPlan(request)
    if (!plan) return
    emit('refined', plan)
    promptDraft.value = ''
  } finally {
    isApplying.value = false
  }
}

const onStartContent = () => {
  if (isDirty.value) {
    openToast({ message: '저장하지 않은 기획서 수정 내용이 있습니다. 저장한 뒤 진행해 주세요.', type: 'warning' })
    return
  }
  emit('startContent', { ...props.draft })
}

// ── 직접 수정 (본문·소제목만, 저장 시 반영) ─────────────────────────────
// 기획서는 '항목 제목 + 내용(글자)' 목록으로 저장되므로 본문·소제목 외 서식은 쓰지 않는다.
const isSavingEdit = ref(false)
const isDirty = ref(false)
const currentBlockType = ref<'paragraph' | 'heading'>('paragraph')

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 항목 목록 → 편집 HTML. 내용의 줄바꿈은 문단으로 나눈다 */
const toPlanHtml = (sections: MarketingCampaignPlanSection[]) =>
  sections
    .map(
      (section) =>
        `<h3>${escapeHtml(section.title)}</h3>` +
        section.body
          .split('\n')
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join(''),
    )
    .join('')

const toSectionSnapshot = (sections: MarketingCampaignPlanSection[]) =>
  JSON.stringify(sections.map((section) => ({ title: section.title.trim(), body: section.body.trim() })))

const docEditor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [3] },
      bold: false,
      italic: false,
      strike: false,
      underline: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      horizontalRule: false,
      link: false,
    }),
  ],
  content: toPlanHtml(props.draft.sections),
  editorProps: {
    attributes: { class: 'marketing-campaign-plan-result__doc-editor', spellcheck: 'false' },
  },
  onUpdate: () => {
    isDirty.value = toSectionSnapshot(readDocSections()) !== toSectionSnapshot(props.draft.sections)
  },
  onSelectionUpdate: ({ editor }) => {
    currentBlockType.value = editor.isActive('heading') ? 'heading' : 'paragraph'
  },
})

/** 편집 영역 → 항목 목록. 소제목마다 새 항목을 시작하고, 그 아래 문단을 줄바꿈으로 이어 내용으로 쓴다 */
const readDocSections = (): MarketingCampaignPlanSection[] => {
  const sections: MarketingCampaignPlanSection[] = []
  let current: MarketingCampaignPlanSection | null = null
  docEditor.value?.state.doc.forEach((node) => {
    const text = node.textContent.trim()
    if (node.type.name === 'heading') {
      current = { title: text, body: '' }
      sections.push(current)
      return
    }
    if (!text) return
    if (!current) {
      current = { title: '', body: '' }
      sections.push(current)
    }
    current.body = current.body ? `${current.body}\n${text}` : text
  })
  return sections
}

const onChangeBlockType = (event: Event) => {
  const chain = docEditor.value?.chain().focus()
  if (!chain) return
  if ((event.target as HTMLSelectElement).value === 'heading') chain.setHeading({ level: 3 }).run()
  else chain.setParagraph().run()
}

// 저장·AI 수정으로 기획서가 바뀌면 편집 영역을 새 내용으로 맞춘다
watch(
  () => props.draft.sections,
  (sections) => {
    docEditor.value?.commands.setContent(toPlanHtml(sections), { emitUpdate: false })
    isDirty.value = false
  },
)

watch(
  () => isSavingEdit.value || isApplying.value,
  (locked) => docEditor.value?.setEditable(!locked),
)

/** AI 수정 결과가 저장하지 않은 편집 내용을 덮어쓰므로 진행 여부를 확인한다 */
const confirmDiscardUnsavedEdit = async () => {
  if (!isDirty.value) return true
  return openConfirm({
    title: '저장하지 않은 수정 내용',
    message: 'AI 수정 결과가 저장하지 않은 기획서 수정 내용을 덮어씁니다.\n저장하지 않고 진행할까요?',
    confirmText: '진행',
    cancelText: '취소',
  })
}

const onSaveEdit = async () => {
  if (isSavingEdit.value || !isDirty.value) return
  const sections = readDocSections()
  if (!sections.length || sections.some((section) => !section.title || !section.body)) {
    openToast({
      message: '각 소제목 아래에 내용을 입력해 주세요. 소제목 없이 시작하는 문단은 저장할 수 없습니다.',
      type: 'warning',
    })
    return
  }
  isSavingEdit.value = true
  try {
    const plan = await handleUpdateMarketingPlan(sections)
    if (!plan) return
    emit('refined', plan)
  } finally {
    isSavingEdit.value = false
  }
}
</script>

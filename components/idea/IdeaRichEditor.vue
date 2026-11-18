<template>
  <div class="idea-editor">
    <div class="idea-editor-toolbar">
      <template
        v-for="(tool, idx) in toolList"
        :key="idx"
      >
        <span
          v-if="tool === '|'"
          class="idea-editor-sep"
        />
        <button
          v-else
          type="button"
          class="idea-editor-btn"
          :class="{ 'is-active': tool.isActive?.() }"
          :title="tool.title"
          :aria-label="tool.title"
          @mousedown.prevent
          @click="tool.run()"
        >
          <b v-if="tool.key === 'bold'">B</b>
          <i v-else-if="tool.key === 'italic'">I</i>
          <u v-else-if="tool.key === 'underline'">U</u>
          <s v-else-if="tool.key === 'strike'">S</s>
          <template v-else>{{ tool.label }}</template>
        </button>
      </template>
    </div>
    <EditorContent
      class="idea-editor-body"
      :editor="editor"
    />
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extension-placeholder'
import { toIdeaContentHtml } from '~/utils/idea/ideaRichText'

interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '내용을 입력하세요',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 생성 시점의 값으로 초기화 — 드로어를 열 때마다 새로 만들어지므로(v-if) 값 동기화 watch 불필요
const editor = useEditor({
  content: toIdeaContentHtml(props.modelValue),
  // 상세 화면과 같은 서식 스타일(.idea-rich) 적용
  editorProps: { attributes: { class: 'idea-rich' } },
  extensions: [
    StarterKit.configure({
      heading: { levels: [3] },
      code: false,
      codeBlock: false,
      horizontalRule: false,
      link: { openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
    }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  onUpdate: ({ editor: instance }) => {
    // 글자가 없으면 빈 값으로 전달 (필수값 검사용)
    // Keep typed angle brackets distinct from formatting escaped by the multipart filter.
    const html = instance.getText().trim() ? instance.getHTML().replace(/&lt;/g, '&#60;') : ''
    emit('update:modelValue', html)
  },
})

type ToolItem = { key: string; label: string; title: string; run: () => void; isActive?: () => boolean }

const chain = () => editor.value?.chain().focus()
const isActive = (name: string, attrs?: Record<string, unknown>) => () => !!editor.value?.isActive(name, attrs)

/** 툴바 — 목업과 같은 순서: 굵게·기울임·밑줄·취소선 | 제목·인용 | 글머리·번호 목록 | 서식 지우기 */
const toolList: (ToolItem | '|')[] = [
  { key: 'bold', label: 'B', title: '굵게', run: () => chain()?.toggleBold().run(), isActive: isActive('bold') },
  {
    key: 'italic',
    label: 'I',
    title: '기울임',
    run: () => chain()?.toggleItalic().run(),
    isActive: isActive('italic'),
  },
  {
    key: 'underline',
    label: 'U',
    title: '밑줄',
    run: () => chain()?.toggleUnderline().run(),
    isActive: isActive('underline'),
  },
  {
    key: 'strike',
    label: 'S',
    title: '취소선',
    run: () => chain()?.toggleStrike().run(),
    isActive: isActive('strike'),
  },
  '|',
  {
    key: 'heading',
    label: 'H',
    title: '제목',
    run: () => chain()?.toggleHeading({ level: 3 }).run(),
    isActive: isActive('heading', { level: 3 }),
  },
  {
    key: 'blockquote',
    label: '❝',
    title: '인용',
    run: () => chain()?.toggleBlockquote().run(),
    isActive: isActive('blockquote'),
  },
  '|',
  {
    key: 'bulletList',
    label: '• 목록',
    title: '글머리 기호',
    run: () => chain()?.toggleBulletList().run(),
    isActive: isActive('bulletList'),
  },
  {
    key: 'orderedList',
    label: '1. 목록',
    title: '번호 목록',
    run: () => chain()?.toggleOrderedList().run(),
    isActive: isActive('orderedList'),
  },
  '|',
  { key: 'clear', label: 'Tx', title: '서식 지우기', run: () => chain()?.unsetAllMarks().clearNodes().run() },
]

/** 필수값 검사 시 포커스 이동용 */
const focus = () => editor.value?.commands.focus()

defineExpose({ focus })
</script>

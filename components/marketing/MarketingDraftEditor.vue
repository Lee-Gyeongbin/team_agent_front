<template>
  <div
    ref="rootRef"
    class="marketing-draft-editor meeting2-editor"
    @focusout="onEditorFocusOut"
  >
    <MeetingEditorToolbar />
    <div class="meeting2-editor-relative">
      <MeetingEditorBody />
    </div>
    <Teleport to="body">
      <button
        v-if="showAddToPrompt"
        ref="addToPromptRef"
        type="button"
        class="marketing-prompt-add-trigger"
        :style="addToPromptStyle"
        @mousedown.prevent
        @click="onAddToPrompt"
      >
        프롬프트에 추가
      </button>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useEditor } from '@tiptap/vue-3'
import type { AnyExtension } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { ResizableImage } from '~/composables/meeting/resizableImage'
import { TableShortcuts } from '~/composables/meeting/tableShortcuts'
import { FontSize } from '~/composables/meeting/fontSize'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'

const props = withDefaults(
  defineProps<{
    variantId: number
    text: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  save: [payload: { variantId: number; textContent: string }]
  'update:text': [text: string]
  'add-to-prompt': [text: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const showAddToPrompt = ref(false)
const selectedText = ref('')
const addToPromptPos = ref({ top: 0, left: 0 })
const addToPromptRef = ref<HTMLElement | null>(null)

const addToPromptStyle = computed(() => ({
  top: `${addToPromptPos.value.top}px`,
  left: `${addToPromptPos.value.left}px`,
}))

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const toEditorHtml = (text: string) => {
  const trimmed = text.trim()
  if (!trimmed) return '<p></p>'
  if (trimmed.startsWith('<')) return text
  return text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
    .join('')
}

const readEditorText = () => editor.value?.getText({ blockSeparator: '\n' }) ?? ''
const readEditorHtml = () => editor.value?.getHTML() ?? ''

const hideAddToPrompt = () => {
  showAddToPrompt.value = false
  selectedText.value = ''
}

const updateAddToPrompt = () => {
  const ed = editor.value
  if (!ed || props.disabled) {
    hideAddToPrompt()
    return
  }
  const { empty, from, to } = ed.state.selection
  const text = empty ? '' : ed.state.doc.textBetween(from, to, '\n').trim()
  if (!text) {
    hideAddToPrompt()
    return
  }
  const coords = ed.view.coordsAtPos(to)
  selectedText.value = text
  addToPromptPos.value = {
    top: coords.bottom + 8,
    left: coords.right,
  }
  showAddToPrompt.value = true
}

const insertImageAsBase64 = (file: File) => {
  if (!file.type.startsWith('image/')) return
  if (file.size > 5 * 1024 * 1024) {
    openToast({ message: '이미지는 5MB 이하로 선택해주세요.', type: 'warning' })
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    const dataUrl = ev.target?.result as string
    editor.value?.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
  }
  reader.onerror = () => {
    openToast({ message: '이미지 읽기 실패', type: 'error' })
  }
  reader.readAsDataURL(file)
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ResizableImage.configure({ allowBase64: true }),
    FontSize,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: '문구를 입력하세요...' }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TableShortcuts,
  ] as AnyExtension[],
  content: toEditorHtml(props.text),
  editable: !props.disabled,
  editorProps: {
    attributes: { class: 'meeting2-editor-body', spellcheck: 'false' },
    handleDrop(_view, event, _slice, moved) {
      if (moved) return false
      const dragEvent = event as DragEvent
      const files = dragEvent.dataTransfer?.files
      if (!files || files.length === 0) return false
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (imageFiles.length === 0) return false
      event.preventDefault()
      imageFiles.forEach(insertImageAsBase64)
      return true
    },
    handlePaste(_view, event) {
      const files = event.clipboardData?.files
      if (!files || files.length === 0) return false
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (imageFiles.length === 0) return false
      event.preventDefault()
      imageFiles.forEach(insertImageAsBase64)
      return true
    },
  },
  onCreate: ({ editor: ed }) => {
    emit('update:text', ed.getText({ blockSeparator: '\n' }))
  },
  onUpdate: ({ editor: ed }) => {
    emit('update:text', ed.getText({ blockSeparator: '\n' }))
  },
  onSelectionUpdate: () => {
    updateAddToPrompt()
  },
})

provide(meetingEditorKey, editor)
const sourceView = useEditorSourceView(editor)
provide(meetingSourceViewKey, sourceView)

const onAddToPrompt = () => {
  const text = selectedText.value.trim()
  if (!text) return
  emit('add-to-prompt', text)
  hideAddToPrompt()
}

/** 에디터 영역 밖으로 포커스가 나가면 프롬프트 추가만 닫는다. 저장은 저장 버튼으로만 한다 */
const onEditorFocusOut = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null
  if (next && rootRef.value?.contains(next)) return
  hideAddToPrompt()
}

watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled)
    if (disabled) hideAddToPrompt()
  },
)

watch(
  () => props.text,
  (next) => {
    if (!editor.value) return
    if (readEditorHtml() === next || readEditorText() === next) return
    if (editor.value.isFocused && !props.disabled) return
    editor.value.commands.setContent(toEditorHtml(next), { emitUpdate: false })
  },
)

const doSave = () => {
  if (sourceView.isSourceView.value) {
    sourceView.exitSourceView()
  }
  emit('save', { variantId: props.variantId, textContent: readEditorHtml() })
}

defineExpose({ save: doSave })
</script>

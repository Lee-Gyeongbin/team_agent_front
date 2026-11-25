<template>
  <div class="meeting2-editor inq-rich-editor" :inert="disabled">
    <MeetingEditorToolbar :allow-images="allowImages" />
    <div class="meeting2-editor-relative">
      <MeetingEditorBody />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor } from '@tiptap/vue-3'
import MeetingEditorToolbar from '~/components/meeting/MeetingEditorToolbar.vue'
import { meetingEditorExtensions } from '~/composables/meeting/meetingEditorExtensions'
import MeetingEditorBody from '~/components/meeting/MeetingEditorBody.vue'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; disabled?: boolean; allowImages?: boolean }>(), {
  placeholder: '내용을 입력하세요',
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// ── 내용 에디터(Tiptap) — 회의록 에디터(MeetingEditorPanel)와 같은 확장·툴바, HTML 문자열로 저장 (이미지는 첨부파일로) ──

/** 마지막으로 formData에 반영한 내용 — 부모가 되돌려준 같은 값으로 에디터를 다시 채우지 않기 위함 */
let lastHtml = props.modelValue

const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: meetingEditorExtensions({ placeholder: props.placeholder, allowImages: props.allowImages }),
  onUpdate: ({ editor: instance }) => {
    // 내용이 없으면 빈 값으로 전달 (필수값 검사용, 표만 있어도 내용으로 본다)
    lastHtml = instance.isEmpty ? '' : instance.getHTML()
    emit('update:modelValue', lastHtml)
  },
  editorProps: {
    // 상세 화면과 같은 본문 스타일(.inq-rich) 적용
    attributes: { class: 'inq-rich', spellcheck: 'false' },
  },
})

// 툴바·본문(회의록 컴포넌트)에서 inject 하는 에디터 인스턴스와 HTML 소스 보기 상태
provide(meetingEditorKey, editor)
const sourceView = useEditorSourceView(editor)
provide(meetingSourceViewKey, sourceView)

// 수정할 문의를 바꾸거나 폼이 초기화되면 에디터 내용도 맞춘다
watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || value === lastHtml) return
    lastHtml = value
    sourceView.isSourceView.value = false
    editor.value.commands.setContent(value, { emitUpdate: false })
  },
)

// HTML 소스 보기 중에는 textarea 값을 그대로 formData에 전달 (저장 시 소스 편집 내용이 반영되도록)
watch(sourceView.sourceHtml, (html) => {
  if (!sourceView.isSourceView.value) return
  lastHtml = html.trim()
  emit('update:modelValue', lastHtml)
})

watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled, false),
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ focus: () => editor.value?.commands.focus() })
</script>

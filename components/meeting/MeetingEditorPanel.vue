<template>
  <div
    class="meeting2-panel meeting2-editor"
    @click="onPanelClick"
  >
    <div class="meeting2-panel-header">
      <span class="meeting2-panel-title"> 자동 생성된 회의록 </span>
    </div>

    <!-- ── WYSIWYG 에디터 ────────────────────────────────────────────── -->
    <MeetingEditorToolbar />
    <div class="meeting2-editor-relative">
      <MeetingEditorBody />

      <!-- 표 floating 툴바 — 표 안 커서 있을 때 위에 노출 -->
      <div
        v-if="showTableBubble"
        class="meeting2-table-bubble"
        :style="{ top: `${bubbleTop}px`, left: `${bubbleLeft}px` }"
      >
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="위에 행 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addRowBefore())"
        >
          위행+
        </button>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="아래에 행 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addRowAfter())"
        >
          아래행+
        </button>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="행 삭제"
          @mousedown.prevent="bubbleCmd((c) => c.deleteRow())"
        >
          행−
        </button>
        <span class="meeting2-table-bubble-sep"></span>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="왼쪽에 열 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addColumnBefore())"
        >
          왼열+
        </button>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="오른쪽에 열 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addColumnAfter())"
        >
          오른열+
        </button>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="열 삭제"
          @mousedown.prevent="bubbleCmd((c) => c.deleteColumn())"
        >
          열−
        </button>
        <span class="meeting2-table-bubble-sep"></span>
        <button
          type="button"
          class="meeting2-table-bubble-btn"
          title="셀 병합 / 분리"
          @mousedown.prevent="bubbleCmd((c) => c.mergeOrSplit())"
        >
          병합
        </button>
        <span class="meeting2-table-bubble-sep"></span>
        <button
          type="button"
          class="meeting2-table-bubble-btn is-danger"
          title="표 삭제 (Ctrl+Backspace)"
          @mousedown.prevent="bubbleCmd((c) => c.deleteTable())"
        >
          표 삭제
        </button>
      </div>
    </div>

    <div class="meeting2-editor-footer">
      <span v-if="isAutoSaving">저장 중…</span>
      <span v-else>마지막 저장: {{ lastSavedLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { ResizableImage } from '~/composables/meeting/resizableImage'
import { TableShortcuts } from '~/composables/meeting/tableShortcuts'
import { FontSize } from '~/composables/meeting/fontSize'
import type { ChainedCommands } from '@tiptap/vue-3'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { useMeetingStore } from '~/composables/meeting/useMeetingStore'
import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'
const { currentMeeting, meetingDetail, handleSaveMeeting } = useMeetingStore()

// ── WYSIWYG 에디터 ───────────────────────────────────────────────────

const isAutoSaving = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

const triggerAutoSave = (html: string) => {
  if (!currentMeeting.value) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    if (!currentMeeting.value) return
    isAutoSaving.value = true
    await handleSaveMeeting({ id: currentMeeting.value.id, minutesContent: html }, { silent: true })
    isAutoSaving.value = false
  }, 800)
}

/**
 * 이미지 파일 → base64 인라인 삽입 (드롭 / 붙여넣기 / 툴바 공통)
 * 🔽 백엔드 업로드 API 완성 시 FormData 업로드 → URL 받기로 교체
 */
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
    StarterKit.configure({}),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ResizableImage,
    FontSize,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({ placeholder: '회의록 내용을 입력하세요...' }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TableShortcuts,
  ],
  content: currentMeeting.value?.minutesContent ?? '',
  onUpdate: ({ editor }) => {
    if (!currentMeeting.value) return
    const html = editor.getHTML()
    currentMeeting.value.minutesContent = html
    triggerAutoSave(html)
  },
  editorProps: {
    attributes: { class: 'meeting2-editor-body' },
    handleDrop(_view, event, _slice, moved) {
      if (moved) return false
      const dragEvent = event as DragEvent
      const files = dragEvent.dataTransfer?.files
      if (!files || files.length === 0) return false
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return false
      event.preventDefault()
      imageFiles.forEach(insertImageAsBase64)
      return true
    },
    handlePaste(_view, event) {
      const files = event.clipboardData?.files
      if (!files || files.length === 0) return false
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return false
      event.preventDefault()
      imageFiles.forEach(insertImageAsBase64)
      return true
    },
  },
})

// 회의가 바뀌면 에디터 컨텐츠 동기화
watch(
  () => currentMeeting.value?.id,
  () => {
    if (editor.value && currentMeeting.value) {
      const html = currentMeeting.value.minutesContent ?? ''
      if (editor.value.getHTML() !== html) {
        editor.value.commands.setContent(html, { emitUpdate: false })
      }
    }
  },
)

// meetingDetail에서 minutes가 로드되면 에디터 초기화 (회의 종료 직후)
watch(
  () => meetingDetail.value.minutes,
  (newMinutes) => {
    if (!newMinutes || !editor.value || !currentMeeting.value) return
    // 에디터가 아직 비어있는 경우에만 minutes 내용 반영
    const current = editor.value.getHTML()
    if (!current || current === '<p></p>') {
      const html = currentMeeting.value.minutesContent
      if (html) editor.value.commands.setContent(html, { emitUpdate: false })
    }
  },
)

// 자식 컴포넌트(Toolbar/Body)에서 사용할 에디터 인스턴스 주입
provide(meetingEditorKey, editor)

/** 마지막 저장 시각 라벨 */
const lastSavedLabel = computed(() => {
  const raw = currentMeeting.value?.updatedAt
  if (!raw) return '-'
  const ts = new Date(raw).getTime()
  if (Number.isNaN(ts)) return raw
  const diff = Date.now() - ts
  if (diff < 60_000) return '방금 전'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  const today = new Date()
  const isSameDay =
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  if (isSameDay) return `오늘 ${hhmm}`
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmm}`
})

// ── 표 floating 툴바 ─────────────────────────────────────────────────
const showTableBubble = ref(false)
const bubbleTop = ref(0)
const bubbleLeft = ref(0)

const updateTableBubble = () => {
  if (!editor.value || !editor.value.isActive('table')) {
    showTableBubble.value = false
    return
  }
  const { from } = editor.value.state.selection
  const domAtPos = editor.value.view.domAtPos(from)
  let cur: Node | null = domAtPos.node
  let tableEl: HTMLElement | null = null
  while (cur) {
    if ((cur as HTMLElement).tagName === 'TABLE') {
      tableEl = cur as HTMLElement
      break
    }
    cur = (cur as HTMLElement).parentElement
  }
  if (!tableEl) {
    showTableBubble.value = false
    return
  }
  const editorScrollEl = (editor.value.view.dom as HTMLElement).closest('.meeting2-editor-scroll') as HTMLElement | null
  if (!editorScrollEl) {
    showTableBubble.value = false
    return
  }
  const tableRect = tableEl.getBoundingClientRect()
  const scrollRect = editorScrollEl.getBoundingClientRect()
  bubbleTop.value = tableRect.top - scrollRect.top + editorScrollEl.scrollTop - 40
  bubbleLeft.value = tableRect.left - scrollRect.left
  showTableBubble.value = true
}

const bubbleCmd = (fn: (chain: ChainedCommands) => ChainedCommands) => {
  if (!editor.value) return
  fn(editor.value.chain().focus()).run()
  nextTick(updateTableBubble)
}

watch(editor, (ed) => {
  if (!ed) return
  ed.on('selectionUpdate', updateTableBubble)
  ed.on('transaction', updateTableBubble)
})

const onPanelClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.meeting2-panel-header, .meeting2-editor-toolbar, button, a, input, select')) return
  editor.value?.commands.focus()
}

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
    if (currentMeeting.value && editor.value) {
      handleSaveMeeting({ id: currentMeeting.value.id, minutesContent: editor.value.getHTML() }, { silent: true })
    }
  }
  editor.value?.destroy()
})
</script>

<template>
  <div
    class="library-report-editor"
    @click="onEditorClick"
  >
    <!-- 툴바 -->
    <div class="library-report-editor-toolbar">
      <!-- 제목 스타일 -->
      <select
        class="library-report-editor-toolbar-select"
        :value="currentBlockType"
        @change="onChangeHeading"
      >
        <option value="paragraph">본문</option>
        <option value="heading-1">제목 1</option>
        <option value="heading-2">제목 2</option>
        <option value="heading-3">제목 3</option>
      </select>

      <span class="library-report-editor-toolbar-divider" />

      <!-- 텍스트 서식 -->
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('bold') }"
        title="굵게 (Ctrl+B)"
        @click="run((c) => c.toggleBold())"
      >
        <strong>B</strong>
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('italic') }"
        title="기울임 (Ctrl+I)"
        @click="run((c) => c.toggleItalic())"
      >
        <em>I</em>
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('underline') }"
        title="밑줄 (Ctrl+U)"
        @click="run((c) => c.toggleUnderline())"
      >
        <u>U</u>
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('strike') }"
        title="취소선"
        @click="run((c) => c.toggleStrike())"
      >
        <s>S</s>
      </button>

      <span class="library-report-editor-toolbar-divider" />

      <!-- 글자색 / 형광펜 -->
      <MeetingColorPicker
        label="A"
        title="글자 색"
        :colors="textColors"
        :current-color="currentTextColor"
        @select="onSelectTextColor"
        @clear="onClearTextColor"
      />
      <MeetingColorPicker
        label="형광"
        title="형광펜"
        :colors="highlightColors"
        :current-color="currentHighlightColor"
        @select="onSelectHighlight"
        @clear="onClearHighlight"
      />

      <span class="library-report-editor-toolbar-divider" />

      <!-- 리스트 / 인용 -->
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('bulletList') }"
        title="순서 없는 리스트"
        @click="run((c) => c.toggleBulletList())"
      >
        • 리스트
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('orderedList') }"
        title="순서 있는 리스트"
        @click="run((c) => c.toggleOrderedList())"
      >
        1. 번호
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('blockquote') }"
        title="인용"
        @click="run((c) => c.toggleBlockquote())"
      >
        인용
      </button>

      <span class="library-report-editor-toolbar-divider" />

      <!-- 들여쓰기 -->
      <button
        class="library-report-editor-toolbar-btn"
        title="내어쓰기"
        @click="run((c) => c.liftListItem('listItem'))"
      >
        ←
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        title="들여쓰기"
        @click="run((c) => c.sinkListItem('listItem'))"
      >
        →
      </button>

      <span class="library-report-editor-toolbar-divider" />

      <!-- 링크 -->
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isActive('link') }"
        title="링크 삽입"
        @click="onClickLink"
      >
        링크
      </button>

      <!-- 표 드롭다운 -->
      <div
        ref="tablePickerRef"
        class="library-report-editor-picker"
      >
        <button
          class="library-report-editor-toolbar-btn"
          :class="{ 'is-active': isActive('table') }"
          title="표"
          @click="toggleTablePicker"
        >
          표
        </button>

        <div
          v-if="isTablePickerOpen"
          class="library-report-editor-picker-pop"
        >
          <!-- 표 없을 때: 그리드 선택으로 표 삽입 -->
          <template v-if="!isInTable">
            <div class="library-report-editor-table-grid-wrap">
              <span class="library-report-editor-table-grid-label"> {{ hoveredCol + 1 }} × {{ hoveredRow + 1 }} </span>
              <div
                class="library-report-editor-table-grid"
                @mouseleave="onGridLeave"
              >
                <button
                  v-for="idx in TOTAL_CELLS"
                  :key="idx"
                  type="button"
                  class="library-report-editor-table-grid-cell"
                  :class="{ 'is-hovered': isCellHovered(idx - 1) }"
                  @mouseenter="onCellHover(idx - 1)"
                  @click="onCellSelect(idx - 1)"
                />
              </div>
            </div>
          </template>

          <!-- 표 안에 있을 때: 행/열/셀 조작 -->
          <template v-else>
            <span class="library-report-editor-picker-label">행</span>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.addRowBefore())"
            >
              위에 행 추가
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.addRowAfter())"
            >
              아래에 행 추가
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.deleteRow())"
            >
              행 삭제
            </button>

            <div class="library-report-editor-picker-sep" />

            <span class="library-report-editor-picker-label">열</span>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.addColumnBefore())"
            >
              왼쪽에 열 추가
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.addColumnAfter())"
            >
              오른쪽에 열 추가
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.deleteColumn())"
            >
              열 삭제
            </button>

            <div class="library-report-editor-picker-sep" />

            <span class="library-report-editor-picker-label">셀</span>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.mergeOrSplit())"
            >
              셀 병합 / 분리
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.toggleHeaderRow())"
            >
              헤더 행 토글
            </button>
            <button
              type="button"
              class="library-report-editor-picker-item"
              @click="onTableCmd((c) => c.toggleHeaderColumn())"
            >
              헤더 열 토글
            </button>

            <div class="library-report-editor-picker-sep" />

            <button
              type="button"
              class="library-report-editor-picker-item is-danger"
              @click="onTableCmd((c) => c.deleteTable())"
            >
              표 삭제
            </button>
          </template>
        </div>
      </div>

      <span class="library-report-editor-toolbar-divider" />

      <!-- 실행 취소 / 다시 실행 -->
      <button
        class="library-report-editor-toolbar-btn"
        :disabled="!canUndo"
        title="실행 취소 (Ctrl+Z)"
        @click="run((c) => c.undo())"
      >
        ↶
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :disabled="!canRedo"
        title="다시 실행 (Ctrl+Y)"
        @click="run((c) => c.redo())"
      >
        ↷
      </button>
    </div>

    <!-- 에디터 본문 + 표 floating 툴바 -->
    <div class="library-report-editor-relative">
      <div class="library-report-editor-scroll">
        <EditorContent :editor="editor" />
      </div>

      <!-- 표 floating 툴바 — 표 안 커서 있을 때 노출 -->
      <div
        v-if="showTableBubble"
        class="library-report-editor-table-bubble"
        :style="{ top: `${bubbleTop}px`, left: `${bubbleLeft}px` }"
      >
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="위에 행 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addRowBefore())"
        >
          위행+
        </button>
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="아래에 행 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addRowAfter())"
        >
          아래행+
        </button>
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="행 삭제"
          @mousedown.prevent="bubbleCmd((c) => c.deleteRow())"
        >
          행−
        </button>
        <span class="library-report-editor-table-bubble-sep" />
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="왼쪽에 열 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addColumnBefore())"
        >
          왼열+
        </button>
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="오른쪽에 열 추가"
          @mousedown.prevent="bubbleCmd((c) => c.addColumnAfter())"
        >
          오른열+
        </button>
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="열 삭제"
          @mousedown.prevent="bubbleCmd((c) => c.deleteColumn())"
        >
          열−
        </button>
        <span class="library-report-editor-table-bubble-sep" />
        <button
          type="button"
          class="library-report-editor-table-bubble-btn"
          title="셀 병합 / 분리"
          @mousedown.prevent="bubbleCmd((c) => c.mergeOrSplit())"
        >
          병합
        </button>
        <span class="library-report-editor-table-bubble-sep" />
        <button
          type="button"
          class="library-report-editor-table-bubble-btn is-danger"
          title="표 삭제 (Ctrl+Backspace)"
          @mousedown.prevent="bubbleCmd((c) => c.deleteTable())"
        >
          표 삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
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
import type { ChainedCommands } from '@tiptap/vue-3'

const html = defineModel<string>('html', { default: '' })
const props = withDefaults(
  defineProps<{
    placeholder?: string
    tmplHtml?: string
  }>(),
  {
    placeholder: '보고서 내용을 입력하세요...',
    tmplHtml: '',
  },
)

// ===== data-label-key 속성 보존 확장 =====
const ReportTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-label-key': {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-label-key'),
        renderHTML: (attrs) => (attrs['data-label-key'] ? { 'data-label-key': attrs['data-label-key'] } : {}),
      },
    }
  },
})

// ===== data-value-key 속성 보존 확장 =====
const ReportTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-value-key': {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-value-key'),
        renderHTML: (attrs) => (attrs['data-value-key'] ? { 'data-value-key': attrs['data-value-key'] } : {}),
      },
    }
  },
})

// ===== 에디터 인스턴스 =====
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    ResizableImage,
    Table.configure({ resizable: true }),
    TableRow,
    ReportTableHeader,
    ReportTableCell,
    Placeholder.configure({ placeholder: props.placeholder }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TableShortcuts,
  ],
  content: props.tmplHtml || html.value,
  onUpdate: ({ editor: ed }) => {
    html.value = ed.getHTML()
  },
  editorProps: {
    attributes: {
      class: 'library-report-editor-body',
    },
  },
})

// 외부 html 변경(AI 보완 등) 시 에디터 동기화
watch(
  () => html.value,
  (newHtml) => {
    if (!editor.value) return
    if (editor.value.getHTML() !== newHtml) {
      editor.value.commands.setContent(newHtml, { emitUpdate: false })
    }
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// ===== 툴바 — 색상 팔레트 =====
const textColors = ['#000000', '#5c6677', '#d92d20', '#d97706', '#0d8a5b', '#3b82f6', '#7c3aed', '#ec4899']
const highlightColors = ['#fef9c3', '#fed7aa', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fce7f3', '#d1d5db']

const currentTextColor = computed<string | null>(() => {
  if (!editor.value) return null
  return (editor.value.getAttributes('textStyle').color as string | undefined) ?? null
})

const currentHighlightColor = computed<string | null>(() => {
  if (!editor.value) return null
  return (editor.value.getAttributes('highlight').color as string | undefined) ?? null
})

const onSelectTextColor = (color: string) => editor.value?.chain().focus().setColor(color).run()
const onClearTextColor = () => editor.value?.chain().focus().unsetColor().run()
const onSelectHighlight = (color: string) => editor.value?.chain().focus().toggleHighlight({ color }).run()
const onClearHighlight = () => editor.value?.chain().focus().unsetHighlight().run()

// ===== 툴바 — 공통 helpers =====
const isActive = (name: string, attrs?: Record<string, unknown>) => {
  if (!editor.value) return false
  return attrs ? editor.value.isActive(name, attrs) : editor.value.isActive(name)
}

const run = (fn: (chain: ChainedCommands) => ChainedCommands) => {
  if (!editor.value) return
  fn(editor.value.chain().focus()).run()
}

const currentBlockType = computed(() => {
  if (!editor.value) return 'paragraph'
  if (editor.value.isActive('heading', { level: 1 })) return 'heading-1'
  if (editor.value.isActive('heading', { level: 2 })) return 'heading-2'
  if (editor.value.isActive('heading', { level: 3 })) return 'heading-3'
  return 'paragraph'
})

const canUndo = computed(() => editor.value?.can().undo() ?? false)
const canRedo = computed(() => editor.value?.can().redo() ?? false)

const onChangeHeading = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  if (value === 'paragraph') chain.setParagraph().run()
  else if (value === 'heading-1') chain.toggleHeading({ level: 1 }).run()
  else if (value === 'heading-2') chain.toggleHeading({ level: 2 }).run()
  else if (value === 'heading-3') chain.toggleHeading({ level: 3 }).run()
}

const onClickLink = () => {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('링크 URL을 입력하세요', previousUrl ?? '')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const { from, to } = editor.value.state.selection
  if (from !== to) {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor.value
      .chain()
      .focus()
      .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
      .run()
  }
}

// ===== 표 드롭다운 =====
const tablePickerRef = ref<HTMLDivElement | null>(null)
const isTablePickerOpen = ref(false)
const isInTable = computed(() => editor.value?.isActive('table') ?? false)

const MAX_ROWS = 6
const MAX_COLS = 8
const TOTAL_CELLS = MAX_ROWS * MAX_COLS
const hoveredRow = ref(0)
const hoveredCol = ref(0)

const toggleTablePicker = () => {
  isTablePickerOpen.value = !isTablePickerOpen.value
  if (isTablePickerOpen.value) {
    hoveredRow.value = 0
    hoveredCol.value = 0
  }
}

const onCellHover = (idx: number) => {
  hoveredRow.value = Math.floor(idx / MAX_COLS)
  hoveredCol.value = idx % MAX_COLS
}
const onGridLeave = () => {
  hoveredRow.value = 0
  hoveredCol.value = 0
}
const isCellHovered = (idx: number) => {
  const r = Math.floor(idx / MAX_COLS)
  const c = idx % MAX_COLS
  return r <= hoveredRow.value && c <= hoveredCol.value
}
const onCellSelect = (idx: number) => {
  const rows = Math.floor(idx / MAX_COLS) + 1
  const cols = (idx % MAX_COLS) + 1
  isTablePickerOpen.value = false
  editor.value
    ?.chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow: rows > 1 })
    .run()
}
const onTableCmd = (fn: (chain: ChainedCommands) => ChainedCommands) => {
  if (!editor.value) return
  fn(editor.value.chain().focus()).run()
  isTablePickerOpen.value = false
}

const onTablePickerDocClick = (e: MouseEvent) => {
  if (!isTablePickerOpen.value) return
  if (tablePickerRef.value && !tablePickerRef.value.contains(e.target as Node)) {
    isTablePickerOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onTablePickerDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onTablePickerDocClick))

// ===== 표 floating 툴바 위치 계산 =====
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
  const scrollEl = (editor.value.view.dom as HTMLElement).closest('.library-report-editor-scroll') as HTMLElement | null
  if (!scrollEl) {
    showTableBubble.value = false
    return
  }
  const tableRect = tableEl.getBoundingClientRect()
  const scrollRect = scrollEl.getBoundingClientRect()
  bubbleTop.value = tableRect.top - scrollRect.top + scrollEl.scrollTop - 40
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

/** 에디터 외부 영역 클릭 시 포커스 이동 */
const onEditorClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.library-report-editor-toolbar, button, a, input, select')) return
  editor.value?.commands.focus()
}
</script>

<style lang="scss" scoped>
.library-report-editor {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

// ===== 툴바 =====
.library-report-editor-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  flex-shrink: 0;
  padding: 6px $spacing-sm;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.library-report-editor-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #e2e8f0;
  }

  &.is-active {
    background: rgba(var(--color-primary-rgb), 0.1);
    color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
}

.library-report-editor-toolbar-divider {
  display: inline-block;
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: $color-border;
  flex-shrink: 0;
}

.library-report-editor-toolbar-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid $color-border;
  border-radius: $border-radius-sm;
  background: #fff;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  cursor: pointer;

  &:hover {
    border-color: $color-text-muted;
  }
}

// ===== 표 드롭다운 =====
.library-report-editor-picker {
  position: relative;
  display: inline-flex;
}

.library-report-editor-picker-pop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: $z-dropdown;
  min-width: 160px;
  padding: 4px 0;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-shadow: $shadow-md;
}

.library-report-editor-picker-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 7px 12px;
  border: none;
  background: transparent;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: $color-surface;
  }

  &.is-danger {
    color: $color-error;
  }
}

.library-report-editor-picker-label {
  display: block;
  padding: 6px 12px 2px;
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.library-report-editor-picker-sep {
  height: 1px;
  margin: 4px 0;
  background: $color-border;
}

// ===== 표 삽입 그리드 =====
.library-report-editor-table-grid-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}

.library-report-editor-table-grid-label {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  font-weight: $font-weight-bold;
  text-align: center;
}

.library-report-editor-table-grid {
  display: grid;
  grid-template-columns: repeat(8, 18px);
  grid-template-rows: repeat(6, 18px);
  gap: 2px;
}

.library-report-editor-table-grid-cell {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid $color-border;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;

  &.is-hovered {
    background: rgba(var(--color-primary-rgb), 0.15);
    border-color: var(--color-primary);
  }
}

// ===== 에디터 본문 영역 =====
.library-report-editor-relative {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.library-report-editor-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  @include custom-scrollbar(4px);
}

// ===== ProseMirror 본문 스타일 =====
:deep(.library-report-editor-body) {
  min-height: 100%;
  padding: $spacing-md;
  outline: none;

  // placeholder
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: $color-text-disabled;
    pointer-events: none;
    height: 0;
  }

  // 보고서 2열 표 — 에디터 내용으로 배치
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1px solid #e2e8f0;
    border-radius: $border-radius-base;
    margin: 0 0 $spacing-sm;

    // 라벨 열 (th) — 좌측 고정 폭
    th {
      width: 28%;
      padding: $spacing-xs $spacing-sm;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      text-align: left;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-text-secondary;
      position: relative;
    }

    // 값 열 (td) — 나머지 폭
    td {
      padding: $spacing-sm $spacing-md;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      font-size: $font-size-sm;
      color: $color-text-secondary;
      line-height: 1.55;
      position: relative;
    }

    // 셀 안 단락 마진 리셋
    th p,
    td p {
      margin: 0 0 6px;
      font-size: inherit;
      line-height: inherit;

      &:last-child {
        margin-bottom: 0;
      }
    }

    // Tiptap 셀 선택 시 하이라이트
    th.selectedCell::after,
    td.selectedCell::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(var(--color-primary-rgb), 0.1);
      pointer-events: none;
    }

    // 컬럼 리사이즈 핸들
    .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background: var(--color-primary);
      pointer-events: none;
    }
  }

  // 표 바깥 일반 컨텐츠
  h1,
  h2,
  h3 {
    margin: $spacing-md 0 $spacing-sm;
    font-weight: $font-weight-bold;
    color: $color-text-heading;

    &:first-child {
      margin-top: 0;
    }
  }

  h1 {
    font-size: $font-size-xl;
  }
  h2 {
    font-size: $font-size-lg;
  }
  h3 {
    font-size: $font-size-base;
  }

  p {
    margin: 0 0 8px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  ul {
    list-style: disc outside;
    margin: 0 0 $spacing-sm;
    padding-left: 1.4em;

    li {
      margin-bottom: 2px;
    }
    ul {
      list-style: circle outside;
      margin: 2px 0 0;
    }
  }

  ol {
    list-style: decimal outside;
    margin: 0 0 $spacing-sm;
    padding-left: 1.4em;

    li {
      margin-bottom: 2px;
    }
    ol {
      list-style: lower-alpha outside;
      margin: 2px 0 0;
    }
  }

  li > p {
    margin: 0;
    line-height: 1.55;
  }

  blockquote {
    margin: 0 0 $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    border-left: 3px solid var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.04);
    font-style: italic;
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
  }
}

// ===== 표 floating 툴바 =====
.library-report-editor-table-bubble {
  position: absolute;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: #fff;
  border: 1px solid $color-border;
  border-radius: $border-radius-base;
  box-shadow: $shadow-md;
  white-space: nowrap;
}

.library-report-editor-table-bubble-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 6px;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: $color-surface;
  }

  &.is-danger {
    color: $color-error;
    &:hover {
      background: #fff0f0;
    }
  }
}

.library-report-editor-table-bubble-sep {
  display: inline-block;
  width: 1px;
  height: 14px;
  margin: 0 2px;
  background: $color-border;
}
</style>

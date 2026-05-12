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

      <!-- 폰트 크기 -->
      <select
        class="library-report-editor-toolbar-select library-report-editor-toolbar-select--font-size"
        :value="currentFontSize"
        title="글자 크기"
        @change="onChangeFontSize"
      >
        <option
          v-for="size in FONT_SIZE_OPTIONS"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
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

      <!-- 텍스트 / 이미지 정렬 -->
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isAlignActive('left') }"
        title="왼쪽 정렬"
        @click="onSetAlign('left')"
      >
        ≡←
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isAlignActive('center') }"
        title="가운데 정렬"
        @click="onSetAlign('center')"
      >
        ≡
      </button>
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isAlignActive('right') }"
        title="오른쪽 정렬"
        @click="onSetAlign('right')"
      >
        ≡→
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

      <!-- 이미지 삽입 -->
      <button
        class="library-report-editor-toolbar-btn"
        title="이미지 삽입"
        @click="onClickInsertImage"
      >
        이미지
      </button>
      <input
        ref="imageInputRef"
        type="file"
        accept="image/*"
        class="library-report-editor-image-input"
        @change="onImageFileChange"
      />

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

      <span class="library-report-editor-toolbar-divider" />

      <!-- HTML 소스 보기 토글 -->
      <button
        class="library-report-editor-toolbar-btn"
        :class="{ 'is-active': isSourceView }"
        title="HTML 소스 보기"
        @click="toggleSourceView"
      >
        <i class="icon-code size-16" />
      </button>
    </div>

    <!-- 에디터 본문 + 표 floating 툴바 -->
    <div class="library-report-editor-relative">
      <div class="library-report-editor-scroll">
        <EditorContent
          v-show="!isSourceView"
          :editor="editor"
        />
        <textarea
          v-if="isSourceView"
          v-model="sourceHtml"
          class="library-report-editor-source"
          spellcheck="false"
          placeholder="<p>HTML 소스를 직접 편집하세요</p>"
        />
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
import { OrderedList } from '@tiptap/extension-ordered-list'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { TextAlign } from '@tiptap/extension-text-align'
import { Heading } from '@tiptap/extension-heading'
import { Paragraph } from '@tiptap/extension-paragraph'
import { ResizableImage } from '~/composables/meeting/resizableImage'
import { TableShortcuts } from '~/composables/meeting/tableShortcuts'
import { FontSize } from '~/composables/meeting/fontSize'
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'
import type { ChainedCommands } from '@tiptap/vue-3'
import type { Editor as CoreEditor } from '@tiptap/core'
import { escapeHTML } from '~/utils/global/htmlUtil'

/** 템플릿 폼에서 표 행과 매핑 — TmplFormPanel `TmplField.fieldId` */
const TMPL_FIELD_ROW_ATTR = 'data-tmpl-field-id'
/** 여러 줄(section) 블록 식별용 속성 */
const TMPL_FIELD_MULTILINE_H2 = 'data-tmpl-field-multiline'
const TMPL_FIELD_MULTILINE_P = 'data-tmpl-field-multiline-p'
const TMPL_FIELD_MULTILINE_TABLE = 'data-tmpl-field-multiline-table'
const TMPL_FIELD_MULTILINE_LIST = 'data-tmpl-field-multiline-list'
const TMPL_FIELD_TABLE_ROOT = 'data-tmpl-field-table-root'
type TmplFieldRenderMode = 'none' | 'table-only' | 'multiline-only' | 'table-multiline'

const escapeAttr = (s: string) => String(s).replaceAll('&', '&amp;').replaceAll('"', '&quot;')

const getOrCreateTbody = (table: HTMLTableElement, doc: Document): HTMLTableSectionElement => {
  let tbody = table.querySelector('tbody')
  if (tbody) return tbody
  const directRows = Array.from(table.children).filter((c) => c.tagName === 'TR')
  tbody = doc.createElement('tbody')
  directRows.forEach((tr) => tbody!.appendChild(tr))
  table.appendChild(tbody)
  return tbody
}

const buildTmplFieldTableRowMarkup = (fieldId: string, jsonKey: string, fieldNm: string) => {
  const k = jsonKey.trim()
  const nm = fieldNm.trim()
  const labelKey = `${k}_label`
  const placeholder = `{{${escapeHTML(k)}}}`
  return (
    `<tr ${TMPL_FIELD_ROW_ATTR}="${escapeAttr(fieldId)}">` +
    `<th data-label-key="${escapeAttr(labelKey)}"><p>${escapeHTML(nm)}</p></th>` +
    `<td data-value-key="${escapeAttr(k)}"><p>${placeholder}</p></td>` +
    `</tr>`
  )
}

/** 여러 줄(section) + 표 사용 — h2 + 1x2 표(첫 행: 내용, 둘째 행: {{jsonKey}}) */
const buildTmplMultilineTableSectionMarkup = (fieldId: string, jsonKey: string, fieldNm: string) => {
  const k = jsonKey.trim()
  const nm = fieldNm.trim()
  const placeholder = `{{${escapeHTML(k)}}}`
  return (
    `<h2 ${TMPL_FIELD_MULTILINE_H2}="${escapeAttr(fieldId)}">${escapeHTML(nm)}</h2>` +
    `<table ${TMPL_FIELD_MULTILINE_TABLE}="${escapeAttr(fieldId)}">` +
    `<tbody>` +
    `<tr><th><p>내용</p></th></tr>` +
    `<tr><td data-value-key="${escapeAttr(k)}"><p ${TMPL_FIELD_MULTILINE_P}="${escapeAttr(fieldId)}" data-tmpl-json-key="${escapeAttr(k)}">${placeholder}</p></td></tr>` +
    `</tbody>` +
    `</table>`
  )
}

/** 여러 줄(section)만 — ol > li > p(항목명), p({{jsonKey}}) */
const buildTmplMultilineListItemMarkup = (fieldId: string, jsonKey: string, fieldNm: string) => {
  const k = jsonKey.trim()
  const nm = fieldNm.trim()
  const placeholder = `{{${escapeHTML(k)}}}`
  return (
    `<li>` +
    `<p ${TMPL_FIELD_MULTILINE_P}="${escapeAttr(fieldId)}" data-tmpl-json-key="${escapeAttr(k)}">${escapeHTML(nm)}</p>` +
    `<p ${TMPL_FIELD_MULTILINE_P}="${escapeAttr(fieldId)}" data-tmpl-json-key="${escapeAttr(k)}">${placeholder}</p>` +
    `</li>`
  )
}

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

// ===== 템플릿 관리용 data-* 속성 보존 확장 =====

/** TableRow 확장 — data-tmpl-field-id 보존 */
const ReportTemplateTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [TMPL_FIELD_ROW_ATTR]: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute(TMPL_FIELD_ROW_ATTR),
        renderHTML: (attrs) =>
          attrs[TMPL_FIELD_ROW_ATTR] ? { [TMPL_FIELD_ROW_ATTR]: attrs[TMPL_FIELD_ROW_ATTR] as string } : {},
      },
    }
  },
})

/** Table 확장 — data-tmpl-field-table-root + data-tmpl-field-multiline-table 보존 */
const ReportTemplateTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [TMPL_FIELD_TABLE_ROOT]: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute(TMPL_FIELD_TABLE_ROOT),
        renderHTML: (attrs) =>
          attrs[TMPL_FIELD_TABLE_ROOT] ? { [TMPL_FIELD_TABLE_ROOT]: attrs[TMPL_FIELD_TABLE_ROOT] as string } : {},
      },
      [TMPL_FIELD_MULTILINE_TABLE]: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute(TMPL_FIELD_MULTILINE_TABLE),
        renderHTML: (attrs) =>
          attrs[TMPL_FIELD_MULTILINE_TABLE]
            ? { [TMPL_FIELD_MULTILINE_TABLE]: attrs[TMPL_FIELD_MULTILINE_TABLE] as string }
            : {},
      },
    }
  },
})

/** OrderedList 확장 — data-tmpl-field-multiline-list 보존 */
const ReportTemplateOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [TMPL_FIELD_MULTILINE_LIST]: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute(TMPL_FIELD_MULTILINE_LIST),
        renderHTML: (attrs) =>
          attrs[TMPL_FIELD_MULTILINE_LIST]
            ? { [TMPL_FIELD_MULTILINE_LIST]: attrs[TMPL_FIELD_MULTILINE_LIST] as string }
            : {},
      },
    }
  },
})

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

/** 템플릿 여러 줄 블록 — h2에 fieldId 보존 */
const ReportTemplateHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-tmpl-field-multiline': {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-tmpl-field-multiline'),
        renderHTML: (attrs) =>
          attrs['data-tmpl-field-multiline']
            ? { 'data-tmpl-field-multiline': attrs['data-tmpl-field-multiline'] as string }
            : {},
      },
    }
  },
})

/** 템플릿 여러 줄 블록 — p에 fieldId·jsonKey 보존 */
const ReportTemplateParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-tmpl-field-multiline-p': {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-tmpl-field-multiline-p'),
        renderHTML: (attrs) =>
          attrs['data-tmpl-field-multiline-p']
            ? { 'data-tmpl-field-multiline-p': attrs['data-tmpl-field-multiline-p'] as string }
            : {},
      },
      'data-tmpl-json-key': {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-tmpl-json-key'),
        renderHTML: (attrs) =>
          attrs['data-tmpl-json-key'] ? { 'data-tmpl-json-key': attrs['data-tmpl-json-key'] as string } : {},
      },
    }
  },
})

// ===== 이미지 삽입 (파일 선택) =====
const imageInputRef = ref<HTMLInputElement | null>(null)

const insertImageFromFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const src = e.target?.result as string
    if (!src || !editor.value) return
    editor.value.chain().focus().setImage({ src }).run()
  }
  reader.readAsDataURL(file)
}

const onClickInsertImage = () => {
  imageInputRef.value?.click()
}

const onImageFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  insertImageFromFile(file)
  // 같은 파일 재선택 허용
  ;(e.target as HTMLInputElement).value = ''
}

// ===== 에디터 인스턴스 =====
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      paragraph: false,
      orderedList: false,
    }),
    ReportTemplateHeading,
    ReportTemplateParagraph,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    // allowBase64: data URL 형태의 src 를 schema 에서 허용
    ResizableImage.configure({ allowBase64: true }),
    ReportTemplateTable.configure({ resizable: true }),
    ReportTemplateTableRow,
    ReportTableHeader,
    ReportTableCell,
    Placeholder.configure({ placeholder: props.placeholder }),
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    ReportTemplateOrderedList,
    TableShortcuts,
  ],
  content: props.tmplHtml || html.value,
  onUpdate: ({ editor: ed }) => {
    html.value = ed.getHTML()
  },
  editorProps: {
    attributes: {
      class: 'library-report-editor-body',
      spellcheck: 'false',
    },
    // 클립보드에서 이미지 파일 붙여넣기
    handlePaste(view, event) {
      const items = Array.from(event.clipboardData?.items ?? [])
      const imageItem = items.find((item) => item.type.startsWith('image/'))
      if (!imageItem) return false
      event.preventDefault()
      const file = imageItem.getAsFile()
      if (!file) return false
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        if (!src) return
        const { schema, tr } = view.state
        const node = schema.nodes.image?.create({ src })
        if (!node) return
        view.dispatch(tr.replaceSelectionWith(node))
      }
      reader.readAsDataURL(file)
      return true
    },
    // 드래그&드롭으로 이미지 파일 삽입
    handleDrop(view, event, _slice, moved) {
      if (moved) return false
      const files = Array.from((event as DragEvent).dataTransfer?.files ?? [])
      const imageFile = files.find((f) => f.type.startsWith('image/'))
      if (!imageFile) return false
      event.preventDefault()
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        if (!src) return
        const pos = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY })
        const { schema } = view.state
        const node = schema.nodes.image?.create({ src })
        if (!node) return
        const insertAt = pos?.pos ?? view.state.selection.from
        view.dispatch(view.state.tr.insert(insertAt, node))
      }
      reader.readAsDataURL(imageFile)
      return true
    },
  },
})

// ===== 마지막 커서 위치 저장 =====
const lastSelectionRange = ref<{ from: number; to: number } | null>(null)

const saveCurrentSelectionRange = (ed: CoreEditor) => {
  const { from, to } = ed.state.selection
  lastSelectionRange.value = { from, to }
}

const onSelectionRangeUpdate = (payload: unknown) => {
  const ed = (payload as { editor?: CoreEditor } | null)?.editor
  if (!ed) return
  saveCurrentSelectionRange(ed)
}

watch(editor, (ed, prevEd) => {
  if (prevEd) {
    prevEd.off('selectionUpdate', onSelectionRangeUpdate)
    prevEd.off('blur', onSelectionRangeUpdate)
  }
  if (!ed) return
  saveCurrentSelectionRange(ed)
  ed.on('selectionUpdate', onSelectionRangeUpdate)
  ed.on('blur', onSelectionRangeUpdate)
})

const clampSelectionPosition = (pos: number, maxPos: number) => Math.max(0, Math.min(pos, maxPos))

const insertContentAtLastSelection = (content: string) => {
  if (!editor.value) return
  const maxPos = editor.value.state.doc.content.size
  const from = clampSelectionPosition(lastSelectionRange.value?.from ?? editor.value.state.selection.from, maxPos)
  const to = clampSelectionPosition(lastSelectionRange.value?.to ?? editor.value.state.selection.to, maxPos)

  editor.value.chain().focus().setTextSelection({ from, to }).insertContent(content).focus().run()
  saveCurrentSelectionRange(editor.value)
}

// HTML 소스 보기 토글 — 라이브러리 단일 컴포넌트라 직접 사용
const { isSourceView, sourceHtml, toggleSourceView } = useEditorSourceView(editor)

/** 템플릿 HTML 조각 DOM 변경 후 에디터/소스에 반영 */
const applyTmplRootMutation = (fn: (root: HTMLElement) => void) => {
  if (typeof document === 'undefined') return

  if (isSourceView.value) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<div id="tmpl-mut-root">${sourceHtml.value ?? ''}</div>`, 'text/html')
    const root = doc.getElementById('tmpl-mut-root')
    if (!root) return
    fn(root as HTMLElement)
    const next = root.innerHTML
    sourceHtml.value = next
    html.value = next
    return
  }

  if (!editor.value) return
  const parser = new DOMParser()
  const raw = editor.value.getHTML()
  const doc = parser.parseFromString(`<div id="tmpl-mut-root">${raw}</div>`, 'text/html')
  const root = doc.getElementById('tmpl-mut-root')
  if (!root) return
  fn(root as HTMLElement)
  const next = root.innerHTML
  editor.value.chain().focus().setContent(next, { emitUpdate: true }).run()
  saveCurrentSelectionRange(editor.value)
}

const upsertTmplFieldTableRowAtRoot = (
  root: HTMLElement,
  opts: { fieldId: string; jsonKey: string; fieldNm: string },
) => {
  const { fieldId, jsonKey, fieldNm } = opts
  const k = jsonKey.trim()
  const nm = fieldNm.trim()
  if (!fieldId || !k || !nm) return

  const doc = root.ownerDocument
  const rowMarkup = buildTmplFieldTableRowMarkup(fieldId, k, nm)
  const tpl = doc.createElement('template')
  tpl.innerHTML = rowMarkup.trim()
  const newTr = tpl.content.firstElementChild as HTMLTableRowElement | null
  if (!newTr) return

  const existing = root.querySelector(`tr[${TMPL_FIELD_ROW_ATTR}="${fieldId}"]`)
  if (existing?.parentNode) {
    existing.replaceWith(newTr)
    return
  }

  let table = root.querySelector(`table[${TMPL_FIELD_TABLE_ROOT}]`) as HTMLTableElement | null
  if (!table) {
    table = doc.createElement('table')
    table.setAttribute(TMPL_FIELD_TABLE_ROOT, 'Y')
    const tbody = doc.createElement('tbody')
    tbody.appendChild(newTr)
    table.appendChild(tbody)
    root.appendChild(table)
    root.appendChild(doc.createElement('p'))
    return
  }

  const tbody = getOrCreateTbody(table, doc)
  tbody.appendChild(newTr)
}

const removeTmplFieldTableRowAtRoot = (root: HTMLElement, fieldId: string) => {
  const row = root.querySelector(`tr[${TMPL_FIELD_ROW_ATTR}="${fieldId}"]`) as HTMLTableRowElement | null
  if (!row) return
  const table = row.closest('table') as HTMLTableElement | null
  row.remove()

  if (!table) return

  const hasManagedRows = table.querySelector(`tr[${TMPL_FIELD_ROW_ATTR}]`)
  if (hasManagedRows) return

  // 자동 생성 표에서 관리 행이 모두 사라지면 빈 표/후행 빈 문단까지 정리
  if (table.getAttribute(TMPL_FIELD_TABLE_ROOT) === 'Y') {
    const trailing = table.nextElementSibling
    if (trailing?.tagName === 'P' && !(trailing.textContent ?? '').trim()) trailing.remove()
    table.remove()
  }
}

/** 표 사용 ON — 2열 표 행 삽입·갱신(th=항목명, td={{jsonKey}}, 보고서 유틸과 동일 data-* ) */
const upsertTmplFieldTableRow = (opts: { fieldId: string; jsonKey: string; fieldNm: string }) => {
  applyTmplRootMutation((root) => upsertTmplFieldTableRowAtRoot(root, opts))
}

/** 표 사용 OFF — 해당 필드에 연결된 표 행 제거 */
const removeTmplFieldTableRow = (fieldId: string) => {
  if (!fieldId) return
  applyTmplRootMutation((root) => removeTmplFieldTableRowAtRoot(root, fieldId))
}

const removeTmplMultilineGeneratedNodes = (root: HTMLElement, fieldId: string) => {
  root.querySelector(`h2[${TMPL_FIELD_MULTILINE_H2}="${fieldId}"]`)?.remove()
  root.querySelector(`table[${TMPL_FIELD_MULTILINE_TABLE}="${fieldId}"]`)?.remove()

  const multilinePs = Array.from(root.querySelectorAll(`p[${TMPL_FIELD_MULTILINE_P}="${fieldId}"]`))
  const listItems = new Set<HTMLElement>()
  multilinePs.forEach((p) => {
    const li = p.closest('li')
    if (li) {
      listItems.add(li)
      return
    }
    p.remove()
  })
  listItems.forEach((li) => li.remove())

  const ol = root.querySelector(`ol[${TMPL_FIELD_MULTILINE_LIST}]`) as HTMLOListElement | null
  if (ol && ol.children.length === 0) ol.remove()
}

/** 여러 줄(section) 블록 제거 — h2+표 / ol>li / 레거시 h2+p 모두 제거 */
const removeTmplMultilineSection = (fieldId: string) => {
  if (!fieldId) return
  applyTmplRootMutation((root) => removeTmplMultilineGeneratedNodes(root, fieldId))
}

/**
 * 여러 줄(section) 삽입·갱신
 * - variant='table': h2 + 1x2 표(내용 / {{jsonKey}})
 * - variant='list' : ol > li > p(항목명), p({{jsonKey}})
 */
const upsertTmplMultilineSectionAtRoot = (
  root: HTMLElement,
  opts: {
    fieldId: string
    jsonKey: string
    fieldNm: string
    variant: 'table' | 'list'
  },
) => {
  const { fieldId, jsonKey, fieldNm, variant } = opts
  const k = jsonKey.trim()
  const nm = fieldNm.trim()
  if (!fieldId || !k || !nm) return

  const doc = root.ownerDocument
  removeTmplMultilineGeneratedNodes(root, fieldId)

  if (variant === 'table') {
    const markup = buildTmplMultilineTableSectionMarkup(fieldId, k, nm)
    const tpl = doc.createElement('template')
    tpl.innerHTML = markup.trim()
    const newH2 = tpl.content.querySelector(`h2[${TMPL_FIELD_MULTILINE_H2}]`) as HTMLElement | null
    const newTable = tpl.content.querySelector(`table[${TMPL_FIELD_MULTILINE_TABLE}]`) as HTMLElement | null
    if (!newH2 || !newTable) return
    root.append(newH2, newTable)
    return
  }

  let ol = root.querySelector(`ol[${TMPL_FIELD_MULTILINE_LIST}]`) as HTMLOListElement | null
  if (!ol) {
    ol = doc.createElement('ol')
    ol.setAttribute(TMPL_FIELD_MULTILINE_LIST, 'Y')
    root.appendChild(ol)
  }

  const markup = buildTmplMultilineListItemMarkup(fieldId, k, nm)
  const tpl = doc.createElement('template')
  tpl.innerHTML = markup.trim()
  const newLi = tpl.content.firstElementChild as HTMLLIElement | null
  if (!newLi) return
  ol.appendChild(newLi)
}

const upsertTmplMultilineSection = (opts: {
  fieldId: string
  jsonKey: string
  fieldNm: string
  variant: 'table' | 'list'
}) => {
  applyTmplRootMutation((root) => upsertTmplMultilineSectionAtRoot(root, opts))
}

/** 템플릿 필드 최종 상태 기준 단일 렌더 — 기존 생성 노드 정리 후 필요한 형태만 생성 */
const renderTmplFieldByState = (opts: {
  fieldId: string
  jsonKey: string
  fieldNm: string
  mode: TmplFieldRenderMode
}) => {
  const { fieldId, jsonKey, fieldNm, mode } = opts
  if (!fieldId) return
  const k = jsonKey.trim()
  const nm = fieldNm.trim()

  applyTmplRootMutation((root) => {
    removeTmplFieldTableRowAtRoot(root, fieldId)
    removeTmplMultilineGeneratedNodes(root, fieldId)

    if (!k || !nm || mode === 'none') return
    if (mode === 'table-only') {
      upsertTmplFieldTableRowAtRoot(root, { fieldId, jsonKey: k, fieldNm: nm })
      return
    }
    if (mode === 'table-multiline') {
      upsertTmplMultilineSectionAtRoot(root, {
        fieldId,
        jsonKey: k,
        fieldNm: nm,
        variant: 'table',
      })
      return
    }
    upsertTmplMultilineSectionAtRoot(root, {
      fieldId,
      jsonKey: k,
      fieldNm: nm,
      variant: 'list',
    })
  })
}

/** `{{jsonKey}}` 제거 시, 표 사용으로 넣은 값 셀(`data-tmpl-field-id` 행의 td)은 유지 */
const stripPlaceholderFromHtmlFragment = (fragment: string, jsonKey: string): string => {
  if (typeof document === 'undefined') return fragment
  const key = jsonKey.trim()
  if (!key) return fragment
  const needle = `{{${key}}}`
  if (!fragment.includes(needle)) return fragment

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div id="strip-root">${fragment}</div>`, 'text/html')
  const root = doc.getElementById('strip-root')
  if (!root) return fragment

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const updates: { node: Text; next: string }[] = []
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = n as Text
    const v = t.nodeValue ?? ''
    if (!v.includes(needle)) continue
    const td = t.parentElement?.closest('td')
    const tr = td?.closest('tr')
    if (tr?.hasAttribute(TMPL_FIELD_ROW_ATTR) && td?.getAttribute('data-value-key') === key) continue
    const multilineTable = td?.closest(`table[${TMPL_FIELD_MULTILINE_TABLE}]`)
    if (multilineTable && td?.getAttribute('data-value-key') === key) continue
    const multilineP = t.parentElement?.closest(`p[${TMPL_FIELD_MULTILINE_P}]`)
    if (multilineP?.getAttribute('data-tmpl-json-key') === key) continue
    updates.push({ node: t, next: v.split(needle).join('') })
  }
  updates.forEach(({ node, next }) => {
    node.nodeValue = next
  })
  return root.innerHTML
}

/** 칩 해제 시 — 에디터/HTML에서 `{{jsonKey}}` 제거(표 값 셀은 stripPlaceholderFromHtmlFragment에서 제외) */
const removePlaceholderByJsonKey = (jsonKey: string) => {
  const key = jsonKey.trim()
  if (!key || !editor.value) return
  const needle = `{{${key}}}`

  if (isSourceView.value) {
    const src = sourceHtml.value ?? ''
    if (!src.includes(needle)) return
    const next = stripPlaceholderFromHtmlFragment(src, key)
    sourceHtml.value = next
    html.value = next
    return
  }

  const current = editor.value.getHTML()
  if (!current.includes(needle)) return
  const next = stripPlaceholderFromHtmlFragment(current, key)
  editor.value.chain().focus().setContent(next, { emitUpdate: true }).run()
  saveCurrentSelectionRange(editor.value)
}

defineExpose<{
  editor: typeof editor
  insertContentAtLastSelection: (content: string) => void
  removePlaceholderByJsonKey: (jsonKey: string) => void
  renderTmplFieldByState: (opts: {
    fieldId: string
    jsonKey: string
    fieldNm: string
    mode: TmplFieldRenderMode
  }) => void
  upsertTmplFieldTableRow: (opts: { fieldId: string; jsonKey: string; fieldNm: string }) => void
  removeTmplFieldTableRow: (fieldId: string) => void
  upsertTmplMultilineSection: (opts: {
    fieldId: string
    jsonKey: string
    fieldNm: string
    variant: 'table' | 'list'
  }) => void
  removeTmplMultilineSection: (fieldId: string) => void
}>({
  editor,
  insertContentAtLastSelection,
  removePlaceholderByJsonKey,
  renderTmplFieldByState,
  upsertTmplFieldTableRow,
  removeTmplFieldTableRow,
  upsertTmplMultilineSection,
  removeTmplMultilineSection,
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

// ===== 툴바 — 폰트 크기 =====
const FONT_SIZE_OPTIONS = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48']
const DEFAULT_FONT_SIZE = '14'

const currentFontSize = computed<string>(() => {
  if (!editor.value) return DEFAULT_FONT_SIZE
  const fs = editor.value.getAttributes('textStyle').fontSize as string | undefined
  if (!fs) return DEFAULT_FONT_SIZE
  return fs.replace('px', '')
})

const onChangeFontSize = (e: Event) => {
  const size = (e.target as HTMLSelectElement).value
  if (!size) {
    editor.value?.chain().focus().unsetFontSize().run()
  } else {
    editor.value?.chain().focus().setFontSize(`${size}px`).run()
  }
}

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
const isActive = (nameOrAttrs: string | Record<string, unknown>, attrs?: Record<string, unknown>) => {
  if (!editor.value) return false
  if (typeof nameOrAttrs === 'object') return editor.value.isActive(nameOrAttrs)
  return attrs ? editor.value.isActive(nameOrAttrs, attrs) : editor.value.isActive(nameOrAttrs)
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

/** 이미지 노드 선택 시에는 node attribute, 그 외엔 단락 textAlign 적용 */
const onSetAlign = (align: 'left' | 'center' | 'right') => {
  if (!editor.value) return
  if (editor.value.isActive('image')) {
    editor.value.chain().focus().updateAttributes('image', { textAlign: align }).run()
  } else {
    editor.value.chain().focus().setTextAlign(align).run()
  }
}

/** 정렬 active 상태 — 이미지/단락 모두 반영 */
const isAlignActive = (align: 'left' | 'center' | 'right') => {
  if (!editor.value) return false
  if (editor.value.isActive('image')) {
    return (editor.value.getAttributes('image').textAlign ?? 'left') === align
  }
  return editor.value.isActive({ textAlign: align })
}

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
  if (isSourceView.value) {
    showTableBubble.value = false
    return
  }
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
@use '@/assets/styles/utils/doc-content' as *;

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

// 이미지 파일 선택용 hidden input
.library-report-editor-image-input {
  display: none;
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

.library-report-editor-toolbar-select--font-size {
  width: 58px;
  padding: 0 4px;
  text-align: center;
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

// HTML 소스 보기 textarea — WYSIWYG 영역과 동일한 박스 안에서 swap
.library-report-editor-source {
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: $spacing-md;
  border: none;
  outline: none;
  background: #fff;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: $color-text-secondary;
  resize: none;
  white-space: pre-wrap;
  word-break: break-all;
  @include custom-scrollbar(4px);
}

// ===== ProseMirror 본문 스타일 =====
// 회의록(.meeting2-editor-body) 과 동일한 mixin 으로 통일 — utils/_doc-content.scss
:deep(.library-report-editor-body) {
  @include doc-content-styles;
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

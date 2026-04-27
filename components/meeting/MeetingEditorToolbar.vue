<template>
  <div class="meeting2-editor-toolbar">
    <!-- 제목 스타일 -->
    <select
      class="meeting2-editor-toolbar-select"
      :value="currentBlockType"
      @change="onChangeHeading"
    >
      <option value="paragraph">본문</option>
      <option value="heading-1">제목 1</option>
      <option value="heading-2">제목 2</option>
      <option value="heading-3">제목 3</option>
    </select>

    <span class="meeting2-editor-toolbar-divider"></span>

    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('bold') }"
      title="굵게 (Ctrl+B)"
      @click="run((c) => c.toggleBold())"
    >
      <strong>B</strong>
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('italic') }"
      title="기울임 (Ctrl+I)"
      @click="run((c) => c.toggleItalic())"
    >
      <em>I</em>
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('underline') }"
      title="밑줄 (Ctrl+U)"
      @click="run((c) => c.toggleUnderline())"
    >
      <u>U</u>
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('strike') }"
      title="취소선"
      @click="run((c) => c.toggleStrike())"
    >
      <s>S</s>
    </button>

    <span class="meeting2-editor-toolbar-divider"></span>

    <!-- 글자색 -->
    <MeetingColorPicker
      label="A"
      title="글자 색"
      :colors="textColors"
      :current-color="currentTextColor"
      @select="onSelectTextColor"
      @clear="onClearTextColor"
    />

    <!-- 형광펜 -->
    <MeetingColorPicker
      label="형광"
      title="형광펜"
      :colors="highlightColors"
      :current-color="currentHighlightColor"
      @select="onSelectHighlight"
      @clear="onClearHighlight"
    />

    <span class="meeting2-editor-toolbar-divider"></span>

    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('bulletList') }"
      title="순서 없는 리스트"
      @click="run((c) => c.toggleBulletList())"
    >
      • 리스트
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('orderedList') }"
      title="순서 있는 리스트"
      @click="run((c) => c.toggleOrderedList())"
    >
      1. 번호
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('blockquote') }"
      title="인용"
      @click="run((c) => c.toggleBlockquote())"
    >
      인용
    </button>

    <span class="meeting2-editor-toolbar-divider"></span>

    <button
      class="meeting2-editor-toolbar-btn"
      title="내어쓰기"
      @click="run((c) => c.liftListItem('listItem'))"
    >
      ←
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      title="들여쓰기"
      @click="run((c) => c.sinkListItem('listItem'))"
    >
      →
    </button>

    <span class="meeting2-editor-toolbar-divider"></span>

    <button
      class="meeting2-editor-toolbar-btn"
      :class="{ 'is-active': isActive('link') }"
      title="링크 삽입"
      @click="onClickLink"
    >
      링크
    </button>
    <div
      ref="imagePickerRef"
      class="meeting2-image-picker"
    >
      <button
        class="meeting2-editor-toolbar-btn"
        title="이미지 삽입"
        @click="toggleImagePicker"
      >
        이미지
      </button>

      <div
        v-if="isImagePickerOpen"
        class="meeting2-image-picker-pop"
      >
        <button
          type="button"
          class="meeting2-image-picker-item"
          @click="onClickFileUpload"
        >
          <i class="icon-attach-file size-16" />
          내 컴퓨터에서 업로드
        </button>
        <button
          type="button"
          class="meeting2-image-picker-item"
          @click="onClickImageUrl"
        >
          <i class="icon-link-agent size-16" />
          URL로 추가
        </button>
      </div>
    </div>
    <input
      ref="imageInputRef"
      type="file"
      accept="image/*"
      class="meeting2-editor-toolbar-file"
      @change="onImageFileChange"
    />
    <div
      ref="tablePickerRef"
      class="meeting2-image-picker"
    >
      <button
        class="meeting2-editor-toolbar-btn"
        :class="{ 'is-active': isActive('table') }"
        title="표"
        @click="toggleTablePicker"
      >
        표
      </button>

      <div
        v-if="isTablePickerOpen"
        class="meeting2-image-picker-pop"
      >
        <template v-if="!isInTable">
          <!-- 행/열 그리드 선택 (1x1 ~ 6x8) -->
          <div class="meeting2-table-grid-wrap">
            <span class="meeting2-table-grid-label">
              {{ hoveredCol + 1 }} × {{ hoveredRow + 1 }}
            </span>
            <div
              class="meeting2-table-grid"
              @mouseleave="onGridLeave"
            >
              <button
                v-for="idx in TOTAL_CELLS"
                :key="idx"
                type="button"
                class="meeting2-table-grid-cell"
                :class="{ 'is-hovered': isCellHovered(idx - 1) }"
                @mouseenter="onCellHover(idx - 1)"
                @click="onCellSelect(idx - 1)"
              />
            </div>
          </div>
        </template>

        <template v-else>
          <span class="meeting2-image-picker-label">행</span>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.addRowBefore())"
          >
            위에 행 추가
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.addRowAfter())"
          >
            아래에 행 추가
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.deleteRow())"
          >
            행 삭제
          </button>

          <div class="meeting2-image-picker-sep"></div>

          <span class="meeting2-image-picker-label">열</span>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.addColumnBefore())"
          >
            왼쪽에 열 추가
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.addColumnAfter())"
          >
            오른쪽에 열 추가
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.deleteColumn())"
          >
            열 삭제
          </button>

          <div class="meeting2-image-picker-sep"></div>

          <span class="meeting2-image-picker-label">셀</span>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.mergeOrSplit())"
          >
            셀 병합 / 분리
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.toggleHeaderRow())"
          >
            헤더 행 토글
          </button>
          <button
            type="button"
            class="meeting2-image-picker-item"
            @click="onTableCmd((c) => c.toggleHeaderColumn())"
          >
            헤더 열 토글
          </button>

          <div class="meeting2-image-picker-sep"></div>

          <button
            type="button"
            class="meeting2-image-picker-item is-danger"
            @click="onTableCmd((c) => c.deleteTable())"
          >
            표 삭제
          </button>
        </template>
      </div>
    </div>

    <span class="meeting2-editor-toolbar-divider"></span>

    <button
      class="meeting2-editor-toolbar-btn"
      :disabled="!canUndo"
      title="실행 취소 (Ctrl+Z)"
      @click="run((c) => c.undo())"
    >
      ↶
    </button>
    <button
      class="meeting2-editor-toolbar-btn"
      :disabled="!canRedo"
      title="다시 실행 (Ctrl+Y)"
      @click="run((c) => c.redo())"
    >
      ↷
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ChainedCommands } from '@tiptap/vue-3'
import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)

// ===== 색상 팔레트 =====
const textColors = ['#000000', '#5c6677', '#d92d20', '#d97706', '#0d8a5b', '#3b82f6', '#7c3aed', '#ec4899']
const highlightColors = ['#fef9c3', '#fed7aa', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff', '#fce7f3', '#d1d5db']

const currentTextColor = computed<string | null>(() => {
  if (!editor?.value) return null
  return (editor.value.getAttributes('textStyle').color as string | undefined) ?? null
})

const currentHighlightColor = computed<string | null>(() => {
  if (!editor?.value) return null
  return (editor.value.getAttributes('highlight').color as string | undefined) ?? null
})

const onSelectTextColor = (color: string) => {
  editor?.value?.chain().focus().setColor(color).run()
}
const onClearTextColor = () => {
  editor?.value?.chain().focus().unsetColor().run()
}
const onSelectHighlight = (color: string) => {
  editor?.value?.chain().focus().toggleHighlight({ color }).run()
}
const onClearHighlight = () => {
  editor?.value?.chain().focus().unsetHighlight().run()
}

const isActive = (name: string, attrs?: Record<string, unknown>) => {
  if (!editor?.value) return false
  return attrs ? editor.value.isActive(name, attrs) : editor.value.isActive(name)
}

const run = (fn: (chain: ChainedCommands) => ChainedCommands) => {
  if (!editor?.value) return
  fn(editor.value.chain().focus()).run()
}

const currentBlockType = computed(() => {
  if (!editor?.value) return 'paragraph'
  if (editor.value.isActive('heading', { level: 1 })) return 'heading-1'
  if (editor.value.isActive('heading', { level: 2 })) return 'heading-2'
  if (editor.value.isActive('heading', { level: 3 })) return 'heading-3'
  return 'paragraph'
})

const canUndo = computed(() => editor?.value?.can().undo() ?? false)
const canRedo = computed(() => editor?.value?.can().redo() ?? false)

const onChangeHeading = (e: Event) => {
  const value = (e.target as HTMLSelectElement).value
  if (!editor?.value) return
  const chain = editor.value.chain().focus()
  if (value === 'paragraph') {
    chain.setParagraph().run()
  } else if (value === 'heading-1') {
    chain.toggleHeading({ level: 1 }).run()
  } else if (value === 'heading-2') {
    chain.toggleHeading({ level: 2 }).run()
  } else if (value === 'heading-3') {
    chain.toggleHeading({ level: 3 }).run()
  }
}

const onClickLink = () => {
  if (!editor?.value) return
  const previousUrl = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('링크 URL을 입력하세요', previousUrl ?? '')
  if (url === null) return
  // 빈 값 → 링크 해제
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  // 선택된 텍스트가 없으면 URL을 텍스트로 삽입 + 링크 적용
  // (선택이 있으면 그 텍스트에 링크 mark만 적용)
  const { from, to } = editor.value.state.selection
  const hasSelection = from !== to
  if (hasSelection) {
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor.value
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: url,
        marks: [{ type: 'link', attrs: { href: url } }],
      })
      .run()
  }
}

// ===== 이미지 삽입 (드롭다운: 파일 / URL) =====
const imageInputRef = ref<HTMLInputElement | null>(null)
const imagePickerRef = ref<HTMLDivElement | null>(null)
const isImagePickerOpen = ref(false)

const toggleImagePicker = () => {
  isImagePickerOpen.value = !isImagePickerOpen.value
}

const onClickFileUpload = () => {
  isImagePickerOpen.value = false
  imageInputRef.value?.click()
}

const onClickImageUrl = () => {
  isImagePickerOpen.value = false
  if (!editor?.value) return
  const url = window.prompt('이미지 URL을 입력하세요')
  if (!url) return
  editor.value.chain().focus().setImage({ src: url }).run()
}

// 외부 클릭 시 드롭다운 닫기
const onImagePickerDocClick = (e: MouseEvent) => {
  if (!isImagePickerOpen.value) return
  if (imagePickerRef.value && !imagePickerRef.value.contains(e.target as Node)) {
    isImagePickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onImagePickerDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onImagePickerDocClick)
})

/**
 * 이미지 파일 선택 → base64 인라인 삽입 (MVP)
 * 🔽 백엔드 이미지 업로드 API 완성 시 교체:
 *    const formData = new FormData()
 *    formData.append('file', file)
 *    const { url } = await fetchUploadImage(formData)
 *    editor.value.chain().focus().setImage({ src: url, alt: file.name }).run()
 */
const onImageFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 5MB 제한 (base64 인라인이라 크면 본문 무거워짐)
  if (file.size > 5 * 1024 * 1024) {
    openToast({ message: '이미지는 5MB 이하로 선택해주세요.', type: 'warning' })
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (ev) => {
    const dataUrl = ev.target?.result as string
    editor?.value?.chain().focus().setImage({ src: dataUrl, alt: file.name }).run()
  }
  reader.onerror = () => {
    openToast({ message: '이미지 읽기 실패', type: 'error' })
  }
  reader.readAsDataURL(file)

  // 같은 파일 재선택 가능하도록 초기화
  input.value = ''
}

// ===== 표 드롭다운 =====
const tablePickerRef = ref<HTMLDivElement | null>(null)
const isTablePickerOpen = ref(false)

const isInTable = computed(() => editor?.value?.isActive('table') ?? false)

const toggleTablePicker = () => {
  isTablePickerOpen.value = !isTablePickerOpen.value
  // 열릴 때 그리드 hover 초기화
  if (isTablePickerOpen.value) {
    hoveredRow.value = 0
    hoveredCol.value = 0
  }
}

// 표 삽입용 그리드 (1x1 ~ MAX_ROWS x MAX_COLS)
const MAX_ROWS = 6
const MAX_COLS = 8
const TOTAL_CELLS = MAX_ROWS * MAX_COLS
const hoveredRow = ref(0)
const hoveredCol = ref(0)

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
  // 1행만 선택하면 헤더 행 X (단순 한 줄 표), 2행 이상은 헤더 행 O
  editor?.value
    ?.chain()
    .focus()
    .insertTable({ rows, cols, withHeaderRow: rows > 1 })
    .run()
}

const onTableCmd = (fn: (chain: ChainedCommands) => ChainedCommands) => {
  if (!editor?.value) return
  fn(editor.value.chain().focus()).run()
  isTablePickerOpen.value = false
}

// 외부 클릭 시 표 드롭다운 닫기
const onTablePickerDocClick = (e: MouseEvent) => {
  if (!isTablePickerOpen.value) return
  if (tablePickerRef.value && !tablePickerRef.value.contains(e.target as Node)) {
    isTablePickerOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onTablePickerDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onTablePickerDocClick)
})
</script>

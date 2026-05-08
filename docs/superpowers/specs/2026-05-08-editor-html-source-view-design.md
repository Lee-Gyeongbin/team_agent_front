# 에디터 HTML 소스 보기 토글 설계

**Date**: 2026-05-08
**Status**: Draft
**Scope**: Meeting Editor + Library Report Editor

## 1. 배경 / 목적

회의록 자동 에디터(`MeetingEditorPanel`)와 라이브러리 보고서 에디터(`LibraryReportEditor`)는 동일한 Tiptap WYSIWYG 기반이지만, **HTML 원본을 직접 보거나 편집할 수단이 없다**.

사용자 요구:

- 본문 HTML을 직접 확인/수정해야 하는 케이스 (외부 시스템에서 받은 HTML 붙여넣기, 미세한 마크업 조정 등)
- 회의/라이브러리 양쪽에 동일한 UX 제공

목표: 툴바에 `〈/〉` 아이콘 한 개를 추가하여 **WYSIWYG ↔ HTML 소스 텍스트** 모드를 토글한다.

## 2. 요구사항 (확정)

| # | 요구사항 |
|---|----------|
| R1 | 에디터 툴바에 HTML 소스 보기 토글 아이콘 추가 |
| R2 | 클릭 시 본문 영역(`EditorContent`)이 `<textarea>`로 전환, 다시 클릭 시 WYSIWYG로 복귀 |
| R3 | textarea는 편집 가능 — 사용자가 HTML을 직접 수정 가능 |
| R4 | 회의 에디터(`MeetingEditorPanel`)와 라이브러리 에디터(`LibraryReportEditor`) 모두에 적용 |
| R5 | textarea 편집 중에는 외부(부모/자동 저장)로 sync하지 않고, **WYSIWYG로 복귀하는 시점**에 한 번만 반영 |
| R6 | Meeting의 자동 저장은 모드 복귀 시 발화하는 `onUpdate` 한 번에 묶임 (소스 모드 중에는 자동 저장 정지) |
| R7 | Meeting의 "저장하기" 버튼은 소스 모드에서도 정상 동작 (textarea 내용 기준으로 저장) |
| R8 | 다른 회의로 전환되면 소스 모드 자동 해제 (회의 간 textarea 잔존 방지) |
| R9 | 표 floating bubble은 소스 모드에서 숨김 |

## 3. 아키텍처

### 파일 구조

```
composables/com/
└── useEditorSourceView.ts          ← NEW (공통 토글 로직)

composables/meeting/
└── meetingEditorKey.ts             ← 수정 (provide/inject 키 추가)

components/meeting/
├── MeetingEditorPanel.vue          ← 수정 (composable 호출, provide)
├── MeetingEditorToolbar.vue        ← 수정 (HTML 토글 버튼 추가)
└── MeetingEditorBody.vue           ← 수정 (모드별 분기)

components/library/
└── LibraryReportEditor.vue         ← 수정 (단일 파일에서 모든 변경)

assets/icons/svg/
└── code.svg                        ← NEW (Lucide code 아이콘)

assets/styles/icons/
└── _icons.custom.scss              ← 수정 (.icon-code 등록)
```

### Composable 책임

```ts
// composables/com/useEditorSourceView.ts
import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

export const useEditorSourceView = (editor: Ref<Editor | null>) => {
  const isSourceView = ref(false)
  const sourceHtml = ref('')

  const toggleSourceView = () => {
    if (!editor.value) return
    if (!isSourceView.value) {
      // WYSIWYG → Source
      sourceHtml.value = editor.value.getHTML()
      isSourceView.value = true
    } else {
      // Source → WYSIWYG
      editor.value.commands.setContent(sourceHtml.value, { emitUpdate: true })
      isSourceView.value = false
    }
  }

  /** 소스 모드 강제 해제 (외부에서 호출 — 예: 회의 변경 시) */
  const exitSourceView = () => {
    if (!isSourceView.value) return
    if (editor.value) {
      editor.value.commands.setContent(sourceHtml.value, { emitUpdate: true })
    }
    isSourceView.value = false
  }

  return { isSourceView, sourceHtml, toggleSourceView, exitSourceView }
}
```

- composable은 **상태 + Tiptap ↔ textarea sync**만 담당
- 컴포넌트는 토글 버튼 UI / textarea 마크업만 담당

## 4. 컴포넌트 변경 상세

### 4.1 `MeetingEditorPanel.vue`

**추가**:

```ts
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'

const sourceView = useEditorSourceView(editor)
provide(meetingSourceViewKey, sourceView)
```

**저장 핸들러 수정**:

```ts
const onSaveMeetingClick = async () => {
  if (!currentMeeting.value || !editor.value) return
  // 소스 모드 → 먼저 textarea 내용을 에디터에 반영
  if (sourceView.isSourceView.value) {
    editor.value.commands.setContent(sourceView.sourceHtml.value, { emitUpdate: false })
  }
  await handleSaveMeeting(
    { id: String(minutesId), minutesContent: editor.value.getHTML() },
    { silent: false },
  )
}
```

**회의 변경 watch에 소스 모드 해제 추가**:

```ts
watch(
  () => currentMeeting.value?.id,
  () => {
    if (editor.value && currentMeeting.value) {
      sourceView.exitSourceView()  // ← 추가
      const html = currentMeeting.value.minutesContent ?? ''
      if (editor.value.getHTML() !== html) {
        editor.value.commands.setContent(html, { emitUpdate: false })
      }
    }
  },
)
```

**언마운트 자동 저장 처리**:

```ts
onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (currentMeeting.value && editor.value) {
    if (sourceView.isSourceView.value) {
      editor.value.commands.setContent(sourceView.sourceHtml.value, { emitUpdate: false })
    }
    handleSaveMeeting(
      { id: String(minutesId), minutesContent: editor.value.getHTML() },
      { silent: true },
    )
  }
  editor.value?.destroy()
})
```

**표 bubble 숨김 조건**:

```ts
const showTableBubble = ref(false)  // 기존
// updateTableBubble 진입부에 추가
const updateTableBubble = () => {
  if (sourceView.isSourceView.value) {
    showTableBubble.value = false
    return
  }
  // ... 기존 로직
}
```

### 4.2 `meetingEditorKey.ts`

```ts
import type { InjectionKey, Ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'

export const meetingEditorKey: InjectionKey<Ref<Editor | null>> = Symbol('meetingEditor')

export const meetingSourceViewKey: InjectionKey<{
  isSourceView: Ref<boolean>
  sourceHtml: Ref<string>
  toggleSourceView: () => void
  exitSourceView: () => void
}> = Symbol('meetingSourceView')
```

### 4.3 `MeetingEditorToolbar.vue`

**추가 import**:

```ts
import { meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'
const sourceView = inject(meetingSourceViewKey)
```

**기존 undo/redo 뒤에 divider + 버튼 추가**:

```vue
<span class="meeting2-editor-toolbar-divider"></span>

<button
  class="meeting2-editor-toolbar-btn"
  :class="{ 'is-active': sourceView?.isSourceView.value }"
  title="HTML 소스 보기"
  @click="sourceView?.toggleSourceView()"
>
  <i class="icon-code size-16" />
</button>
```

### 4.4 `MeetingEditorBody.vue`

```vue
<template>
  <template v-if="!sourceView?.isSourceView.value">
    <EditorContent :editor="editor" />
  </template>
  <template v-else>
    <textarea
      v-model="sourceView.sourceHtml.value"
      class="meeting2-editor-source"
      spellcheck="false"
      placeholder="<p>HTML 소스를 직접 편집하세요</p>"
    />
  </template>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
const sourceView = inject(meetingSourceViewKey)
</script>
```

### 4.5 `LibraryReportEditor.vue` (단일 파일에 모두 적용)

`LibraryReportEditor.vue`는 toolbar + body + 로직이 한 파일에 모두 있으므로 동일 composable을 직접 사용:

```ts
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'

const { isSourceView, sourceHtml, toggleSourceView } = useEditorSourceView(editor)
```

- 툴바에 동일한 HTML 토글 버튼 추가
- 본문 `EditorContent` 영역에 `v-if`/`v-else` 분기
- 표 floating bubble의 `showTableBubble`도 `isSourceView`일 때 false 강제
- 라이브러리는 자동 저장 없음 — 토글 복귀 시 `setContent(..., { emitUpdate: true })`로 인해 `onUpdate` → `html.value` 업데이트가 자연스럽게 처리됨

## 5. 데이터 흐름

### Meeting

```
[WYSIWYG] editor.onUpdate → triggerAutoSave (800ms debounce) → handleSaveMeeting
   │
   ▼ HTML 버튼 클릭
[Source] sourceHtml ← editor.getHTML()
   │ textarea 편집 → sourceHtml만 변경 (자동 저장 정지)
   │
   ▼ HTML 버튼 다시 클릭 (또는 회의 변경)
[WYSIWYG] editor.setContent(sourceHtml, emitUpdate: true)
   └ onUpdate 발화 → triggerAutoSave 1회 → 저장 완료
```

### Library

```
[WYSIWYG] editor.onUpdate → html.value 업데이트 (defineModel)
   │
   ▼ HTML 버튼 클릭
[Source] sourceHtml ← editor.getHTML()
   │ textarea 편집 → sourceHtml만 변경 (부모 html 미반영)
   │
   ▼ HTML 버튼 다시 클릭
[WYSIWYG] editor.setContent(sourceHtml, emitUpdate: true)
   └ onUpdate 발화 → html.value 업데이트 → 부모로 emit
```

## 6. UX & 스타일

### 아이콘

- `assets/icons/svg/code.svg` — Lucide `code` (`<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`)
- `_icons.custom.scss`에 `.icon-code` 등록 (mask-image 패턴)

### 버튼

- 위치: undo/redo 우측, divider로 구분
- 활성 상태(`is-active`): 기존 toolbar 버튼의 primary tint 배경 그대로 재사용
- title 툴팁: "HTML 소스 보기"

### Textarea 스타일

```scss
.meeting2-editor-source {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: $spacing-md;
  border: none;
  outline: none;
  background: #fff;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: $color-text-primary;
  resize: none;
  white-space: pre;
  @include custom-scrollbar(4px);
}

.library-report-editor-source {
  // 동일 스펙, 클래스 prefix만 다름
}
```

- `resize: none` — 사용자 임의 리사이즈 방지
- `white-space: pre` — 긴 줄 가로 스크롤
- monospace — 코드 가독성

## 7. 엣지 케이스 / 결정사항

| 케이스 | 처리 |
|--------|------|
| 소스 모드 중 자동 저장 | **정지**. 모드 복귀 시 `setContent(emitUpdate: true)` → `onUpdate` 1회로 묶음 |
| 소스 모드에서 "저장하기" | 핸들러가 `isSourceView` 검사 후 `setContent` 선행 |
| 잘못된/incomplete HTML 입력 | Tiptap이 schema에 맞게 자동 sanitize. 별도 경고 없음 (paste 동작과 동일) |
| 다른 회의로 전환 | `exitSourceView()` 호출 → 강제 WYSIWYG 복귀 |
| 컴포넌트 언마운트 | 소스 모드면 textarea 내용 기준으로 자동 저장 |
| 표 floating bubble | `isSourceView` 상태일 때 `showTableBubble = false` |
| 에디터 외부 영역 클릭 시 포커스 이동 | 소스 모드에서는 textarea가 본문 영역을 차지하므로 기존 로직(`editor.commands.focus()`)이 textarea를 가리지 않음 — 별도 처리 불필요 |

## 8. 가이드 페이지 (선택)

- 신규 아이콘 `icon-code`가 추가되므로 아이콘 가이드 페이지에 노출 (있는 경우)
- 에디터는 기존 컴포넌트 확장이라 별도 가이드 페이지 신규 생성 불필요

## 9. 작업 범위 (요약)

| 분류 | 파일 | 변경 유형 |
|------|------|-----------|
| 신규 | `composables/com/useEditorSourceView.ts` | NEW |
| 신규 | `assets/icons/svg/code.svg` | NEW |
| 수정 | `assets/styles/icons/_icons.custom.scss` | `.icon-code` 등록 |
| 수정 | `composables/meeting/meetingEditorKey.ts` | `meetingSourceViewKey` 추가 |
| 수정 | `components/meeting/MeetingEditorPanel.vue` | composable 사용, provide, 저장/언마운트/회의변경 분기 |
| 수정 | `components/meeting/MeetingEditorToolbar.vue` | HTML 토글 버튼 추가 |
| 수정 | `components/meeting/MeetingEditorBody.vue` | textarea 분기 |
| 수정 | `components/library/LibraryReportEditor.vue` | composable 사용 + 토글 버튼 + textarea 분기 |
| 수정 (선택) | 페이지 전용 SCSS (`_meeting.scss`, `_library.scss` 등) | textarea 스타일 추가 |

## 10. 비고

- composable은 향후 다른 Tiptap 기반 에디터(예: 채팅 에디터, 메모 등)에서도 동일하게 재사용 가능
- HTML syntax highlighting은 MVP 범위에서 제외 (plain textarea)
- 백엔드 API 변경 없음 — 저장되는 콘텐츠는 동일한 HTML 문자열

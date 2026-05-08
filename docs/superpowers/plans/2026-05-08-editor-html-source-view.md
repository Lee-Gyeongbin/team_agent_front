# 에디터 HTML 소스 보기 토글 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Meeting / Library 에디터 툴바에 HTML 소스 보기(`〈/〉`) 토글을 추가하여, 본문 영역을 WYSIWYG ↔ 편집 가능한 textarea 사이에서 전환할 수 있게 한다.

**Architecture:** 토글 상태와 Tiptap ↔ textarea sync를 담당하는 공통 composable `useEditorSourceView`를 도입. Meeting은 Panel/Toolbar/Body 3컴포넌트로 분리되어 있어 provide/inject로 상태를 공유하고, Library는 단일 컴포넌트라 직접 호출한다. textarea 편집 중에는 외부 sync를 정지하고, WYSIWYG 복귀 시 `setContent(emitUpdate: true)` 한 번에 묶어 자동 저장/부모 emit을 트리거한다.

**Tech Stack:** Vue 3.5 + Nuxt 3 (SPA), TypeScript 5, Tiptap 3 (`@tiptap/vue-3`), SCSS.

**Spec:** `docs/superpowers/specs/2026-05-08-editor-html-source-view-design.md`

**검증 방식 (이 프로젝트 특성)**: 테스트 러너가 없음. 각 task 끝에 dev 서버에서 시각 확인. 사용자 메모리: "빌드 확인 금지 — 사용자가 직접 확인함". 따라서 **자동 빌드 실행 X**, **자동 커밋 X** (CLAUDE.md: "NEVER commit unless explicitly asked"). 커밋이 필요한 단계는 "(사용자 승인 후 커밋)"으로 표기.

**구현 노트**:
- `meetingEditorKey.ts`의 기존 타입은 `ShallowRef<Editor | undefined>`이고, `useEditor()`도 동일한 타입을 반환하므로 composable의 파라미터 타입은 `Ref<Editor | undefined>`(상위 호환)로 통일.
- Tiptap의 `setContent(html, { emitUpdate: true })`는 `onUpdate`를 발화시키므로 별도 부모 emit/자동 저장 호출이 필요 없음 — 이게 모드 복귀 시점 sync의 핵심.

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| `assets/icons/svg/code.svg` | **신규** — `</>` 모양 SVG (Lucide code) |
| `assets/styles/icons/_icons.custom.scss` | `.icon-code` 등록 |
| `composables/com/useEditorSourceView.ts` | **신규** — 토글 composable |
| `composables/meeting/meetingEditorKey.ts` | `meetingSourceViewKey` injection key 추가 |
| `components/meeting/MeetingEditorPanel.vue` | composable 사용, provide, 저장/언마운트/회의변경/표 bubble 처리 |
| `components/meeting/MeetingEditorToolbar.vue` | HTML 토글 버튼 추가 |
| `components/meeting/MeetingEditorBody.vue` | textarea 분기 |
| `components/library/LibraryReportEditor.vue` | composable + 토글 버튼 + textarea + 표 bubble 처리 |
| `assets/styles/page/_meeting2.scss` | `.meeting2-editor-source` textarea 스타일 |
| `components/library/LibraryReportEditor.vue` `<style>` 블록 | `.library-report-editor-source` textarea 스타일 |

---

## Task 1: SVG 아이콘 추가 + SCSS 등록

**목표**: `<i class="icon-code size-16" />`로 사용 가능한 코드 아이콘 등록.

**Files:**
- Create: `assets/icons/svg/code.svg`
- Modify: `assets/styles/icons/_icons.custom.scss`

- [ ] **Step 1: SVG 파일 생성**

`assets/icons/svg/code.svg` 신규 작성:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="16 18 22 12 16 6"/>
  <polyline points="8 6 2 12 8 18"/>
</svg>
```

> Lucide의 `code` 아이콘. `currentColor`로 부모 색상 상속, mask-image 패턴과 호환.

- [ ] **Step 2: `_icons.custom.scss`에 등록**

파일 끝(라인 707 근처, 마지막 `.icon-meeting-mail` 다음)에 새 섹션 추가:

```scss
// ===================================
// 에디터 툴바 아이콘
// ===================================

// HTML 소스 보기 토글
.icon-code {
  @include icon-file-bg('code');
}
```

> `@include icon-file-bg(...)`은 mask-image + `background: currentColor` 패턴을 적용 — 부모 `color`로 자유롭게 틴트 가능 (`is-active` 시 primary 색상 자동 반영).

- [ ] **Step 3: 시각 확인**

dev 서버 실행 중이면 그대로 두고, 콘솔에 SCSS 컴파일 에러가 없는지 확인. 이 시점엔 아직 사용처가 없으므로 화면 변화 없음.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add assets/icons/svg/code.svg assets/styles/icons/_icons.custom.scss
git commit -m "$(cat <<'EOF'
feat(ui): HTML 소스 보기 토글용 code 아이콘 추가

1. assets/icons/svg/code.svg 신규 (Lucide 〈/〉)
2. _icons.custom.scss에 .icon-code 등록 (mask + currentColor)
EOF
)"
```

---

## Task 2: 공통 composable `useEditorSourceView` 작성

**목표**: 어떤 Tiptap 에디터 ref든 받아서 `isSourceView` / `sourceHtml` / `toggleSourceView` / `exitSourceView`를 반환하는 composable 생성.

**Files:**
- Create: `composables/com/useEditorSourceView.ts`

- [ ] **Step 1: 파일 생성**

`composables/com/useEditorSourceView.ts`:

```ts
import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

/**
 * Tiptap 에디터 — HTML 소스 보기 토글 composable
 *
 * - WYSIWYG 모드 ↔ HTML textarea 모드 전환
 * - 모드 복귀 시점에만 setContent(emitUpdate: true)로 외부 sync (자동 저장 / 부모 emit)
 * - textarea 편집 중에는 sourceHtml만 변경되고 에디터 본체는 손대지 않음
 */
export const useEditorSourceView = (editor: Ref<Editor | undefined>) => {
  const isSourceView = ref(false)
  const sourceHtml = ref('')

  const toggleSourceView = () => {
    if (!editor.value) return
    if (!isSourceView.value) {
      // WYSIWYG → Source
      sourceHtml.value = editor.value.getHTML()
      isSourceView.value = true
    } else {
      // Source → WYSIWYG (onUpdate 발화 → 자동 저장/부모 emit 자연스럽게 트리거)
      editor.value.commands.setContent(sourceHtml.value, { emitUpdate: true })
      isSourceView.value = false
    }
  }

  /** 외부에서 강제 해제 — 회의 변경/언마운트 등 sync 필요 시점에 사용 */
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

- [ ] **Step 2: 시각 확인**

dev 서버 콘솔에 TypeScript 에러가 없는지 확인. 이 시점엔 아직 사용처가 없음.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add composables/com/useEditorSourceView.ts
git commit -m "$(cat <<'EOF'
feat(composable): Tiptap 에디터 HTML 소스 보기 토글 composable 추가

1. useEditorSourceView — isSourceView/sourceHtml/toggleSourceView/exitSourceView 반환
2. 모드 복귀 시 setContent(emitUpdate: true)로 자동 저장/부모 emit 자연스럽게 트리거
3. Meeting / Library 에디터에서 공통 사용
EOF
)"
```

---

## Task 3: `meetingSourceViewKey` injection key 추가

**목표**: Meeting 3컴포넌트 (Panel/Toolbar/Body)가 토글 상태를 공유하도록 inject key 정의.

**Files:**
- Modify: `composables/meeting/meetingEditorKey.ts`

- [ ] **Step 1: 파일 수정**

기존 파일:

```ts
import type { InjectionKey, ShallowRef } from 'vue'
import type { Editor } from '@tiptap/vue-3'

/** Tiptap Editor 인스턴스 — MeetingEditorPanel에서 provide, Toolbar/Body에서 inject */
export const meetingEditorKey: InjectionKey<ShallowRef<Editor | undefined>> = Symbol('meetingEditor')
```

아래로 교체:

```ts
import type { InjectionKey, Ref, ShallowRef } from 'vue'
import type { Editor } from '@tiptap/vue-3'

/** Tiptap Editor 인스턴스 — MeetingEditorPanel에서 provide, Toolbar/Body에서 inject */
export const meetingEditorKey: InjectionKey<ShallowRef<Editor | undefined>> = Symbol('meetingEditor')

/** HTML 소스 보기 토글 상태 — useEditorSourceView 반환값 */
export interface MeetingSourceViewContext {
  isSourceView: Ref<boolean>
  sourceHtml: Ref<string>
  toggleSourceView: () => void
  exitSourceView: () => void
}

export const meetingSourceViewKey: InjectionKey<MeetingSourceViewContext> = Symbol('meetingSourceView')
```

- [ ] **Step 2: 시각 확인**

dev 서버 콘솔에 TypeScript 에러 없는지 확인.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add composables/meeting/meetingEditorKey.ts
git commit -m "$(cat <<'EOF'
feat(meeting): meetingSourceViewKey injection key 추가

1. MeetingSourceViewContext 인터페이스 정의 (isSourceView/sourceHtml/toggleSourceView/exitSourceView)
2. meetingSourceViewKey — Panel/Toolbar/Body가 소스 모드 상태를 공유
EOF
)"
```

---

## Task 4: `MeetingEditorPanel.vue`에서 composable 사용 + provide

**목표**: Panel이 composable을 호출해 sourceView 컨텍스트 생성 + provide. 저장/회의변경/언마운트/표 bubble 분기 처리.

**Files:**
- Modify: `components/meeting/MeetingEditorPanel.vue`

- [ ] **Step 1: import 및 composable 호출**

`<script setup lang="ts">` 상단의 기존 import 블록에 다음 두 줄 추가 (`useMeetingStore` import 위 또는 아래):

```ts
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'
```

> 기존 `import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'` 라인을 위 두 번째 import로 합쳐 교체.

- [ ] **Step 2: composable 호출 + provide 추가**

기존 `provide(meetingEditorKey, editor)` 라인 바로 아래에 추가:

```ts
const sourceView = useEditorSourceView(editor)
provide(meetingSourceViewKey, sourceView)
```

> editor 변수는 이미 `useEditor({...})` 결과로 위에서 정의되어 있음. provide 위치는 editor가 이미 정의된 후라야 함.

- [ ] **Step 3: `onSaveMeetingClick` 수정**

기존:

```ts
const onSaveMeetingClick = async () => {
  if (!currentMeeting.value || !editor.value) return
  await handleSaveMeeting({ id: String(minutesId), minutesContent: editor.value.getHTML() }, { silent: false })
}
```

아래로 교체:

```ts
const onSaveMeetingClick = async () => {
  if (!currentMeeting.value || !editor.value) return
  // 소스 모드 → textarea 내용을 에디터에 먼저 반영
  if (sourceView.isSourceView.value) {
    editor.value.commands.setContent(sourceView.sourceHtml.value, { emitUpdate: false })
  }
  await handleSaveMeeting({ id: String(minutesId), minutesContent: editor.value.getHTML() }, { silent: false })
}
```

> `emitUpdate: false`인 이유: 어차피 직후 `handleSaveMeeting`이 직접 호출되므로 자동 저장 디바운스를 굳이 발화시킬 필요 없음.

- [ ] **Step 4: 회의 변경 watch에 `exitSourceView` 추가**

기존:

```ts
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
```

아래로 교체:

```ts
watch(
  () => currentMeeting.value?.id,
  () => {
    if (editor.value && currentMeeting.value) {
      // 다른 회의로 전환 시 소스 모드 강제 해제 (textarea 잔존 방지)
      sourceView.exitSourceView()
      const html = currentMeeting.value.minutesContent ?? ''
      if (editor.value.getHTML() !== html) {
        editor.value.commands.setContent(html, { emitUpdate: false })
      }
    }
  },
)
```

- [ ] **Step 5: `onBeforeUnmount` 수정**

기존:

```ts
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
    if (currentMeeting.value && editor.value) {
      handleSaveMeeting({ id: String(minutesId), minutesContent: editor.value.getHTML() }, { silent: true })
    }
  }
  editor.value?.destroy()
})
```

아래로 교체:

```ts
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
    if (currentMeeting.value && editor.value) {
      // 소스 모드면 textarea 내용 기준으로 저장
      if (sourceView.isSourceView.value) {
        editor.value.commands.setContent(sourceView.sourceHtml.value, { emitUpdate: false })
      }
      handleSaveMeeting({ id: String(minutesId), minutesContent: editor.value.getHTML() }, { silent: true })
    }
  }
  editor.value?.destroy()
})
```

- [ ] **Step 6: `updateTableBubble`에 소스 모드 가드 추가**

기존:

```ts
const updateTableBubble = () => {
  if (!editor.value || !editor.value.isActive('table')) {
    showTableBubble.value = false
    return
  }
  // ... 이하 기존 로직
}
```

함수 진입부에 한 줄 추가:

```ts
const updateTableBubble = () => {
  if (sourceView.isSourceView.value) {
    showTableBubble.value = false
    return
  }
  if (!editor.value || !editor.value.isActive('table')) {
    showTableBubble.value = false
    return
  }
  // ... 이하 기존 로직 그대로
}
```

- [ ] **Step 7: 시각 확인**

dev 서버에서 `/meeting/<id>` 페이지 열고:
- 콘솔 에러 없음
- 기존 회의록 화면이 그대로 보임 (이 시점엔 토글 버튼 아직 없음 — Toolbar 변경 전)
- 자동 저장 / 저장하기 / 회의 전환 모두 기존대로 동작

- [ ] **Step 8: 커밋 (사용자 승인 후)**

```bash
git add components/meeting/MeetingEditorPanel.vue
git commit -m "$(cat <<'EOF'
feat(meeting): Panel에 useEditorSourceView 연결 및 분기 처리

1. useEditorSourceView 호출 후 meetingSourceViewKey로 provide
2. onSaveMeetingClick — 소스 모드면 textarea 내용을 setContent 후 저장
3. 회의 변경 watch — exitSourceView로 textarea 잔존 방지
4. onBeforeUnmount — 소스 모드면 textarea 내용 기준 자동 저장
5. updateTableBubble — 소스 모드에선 표 floating bubble 숨김
EOF
)"
```

---

## Task 5: `MeetingEditorBody.vue`에서 textarea 분기

**목표**: 소스 모드에서는 EditorContent 대신 textarea를 노출.

**Files:**
- Modify: `components/meeting/MeetingEditorBody.vue`

- [ ] **Step 1: 템플릿 교체**

기존 `<template>`:

```vue
<template>
  <div class="meeting2-editor-scroll">
    <EditorContent :editor="editor" />
  </div>
</template>
```

아래로 교체:

```vue
<template>
  <div class="meeting2-editor-scroll">
    <EditorContent
      v-show="!sourceView?.isSourceView.value"
      :editor="editor"
    />
    <textarea
      v-if="sourceView?.isSourceView.value"
      v-model="sourceView.sourceHtml.value"
      class="meeting2-editor-source"
      spellcheck="false"
      placeholder="<p>HTML 소스를 직접 편집하세요</p>"
    />
  </div>
</template>
```

> `v-show` (EditorContent) + `v-if` (textarea) 조합 이유: Tiptap 에디터를 매번 destroy/생성하지 않고 살려둔 채 화면에서만 가리기 위함. textarea는 모드 진입 시점에 새로 마운트.

- [ ] **Step 2: `<script setup>` 수정**

기존:

```ts
import { EditorContent } from '@tiptap/vue-3'
import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
```

아래로 교체:

```ts
import { EditorContent } from '@tiptap/vue-3'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
const sourceView = inject(meetingSourceViewKey)
```

- [ ] **Step 3: 시각 확인 (이 시점에 토글 버튼은 아직 없음)**

콘솔 에러 없음 확인. 화면 변화 없음 (`isSourceView`가 항상 false).

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add components/meeting/MeetingEditorBody.vue
git commit -m "$(cat <<'EOF'
feat(meeting): Body에 HTML 소스 textarea 분기 추가

1. meetingSourceViewKey inject — 소스 모드 상태 구독
2. EditorContent는 v-show로 가림 (에디터 인스턴스 유지)
3. v-if="isSourceView"로 .meeting2-editor-source textarea 노출
EOF
)"
```

---

## Task 6: `MeetingEditorToolbar.vue`에 HTML 토글 버튼 추가

**목표**: undo/redo 우측에 divider + HTML 토글 버튼 추가.

**Files:**
- Modify: `components/meeting/MeetingEditorToolbar.vue`

- [ ] **Step 1: `<script setup>`에 inject 추가**

기존:

```ts
import type { ChainedCommands } from '@tiptap/vue-3'
import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
```

아래로 교체:

```ts
import type { ChainedCommands } from '@tiptap/vue-3'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
const sourceView = inject(meetingSourceViewKey)
```

- [ ] **Step 2: 템플릿 — undo/redo 다음에 버튼 추가**

기존 redo 버튼 (`<button ... @click="run((c) => c.redo())">↷</button>`) 직후, `</div>` 닫기 전에 다음을 삽입:

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

> 기존 `is-active` 스타일이 primary 틴트 배경 + primary color로 되어있어, 아이콘이 mask + currentColor 패턴이라 자동으로 primary 색상으로 변함.

- [ ] **Step 3: 시각 확인**

dev 서버에서 `/meeting/<id>` 진입:
- 툴바 우측 끝 `↶ ↷` 다음에 `〈/〉` 아이콘 버튼이 보임
- 클릭하면 본문 영역이 textarea로 바뀌고, 버튼이 active 상태(primary 색상)로 강조됨
- 다시 클릭하면 WYSIWYG로 복귀
- HTML을 textarea에서 수정 후 토글 → 변경된 HTML이 WYSIWYG에 반영됨
- 표 안에 커서 있을 때 소스 모드 진입 → 표 floating bubble 사라짐

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add components/meeting/MeetingEditorToolbar.vue
git commit -m "$(cat <<'EOF'
feat(meeting): Toolbar에 HTML 소스 보기 토글 버튼 추가

1. icon-code 버튼을 undo/redo 우측에 배치 (divider로 분리)
2. is-active 스타일로 소스 모드 시각 피드백
3. meetingSourceViewKey inject로 토글 함수 호출
EOF
)"
```

---

## Task 7: Meeting textarea 스타일 추가

**목표**: 소스 모드 textarea의 monospace + 가로 스크롤 스타일 정의.

**Files:**
- Modify: `assets/styles/page/_meeting2.scss`

- [ ] **Step 1: 스타일 블록 추가**

`.meeting2-editor-scroll { ... }` 닫기(라인 1164 부근) 직후에 다음 블록 추가:

```scss
// HTML 소스 보기 textarea — WYSIWYG 영역과 동일한 박스 안에서 swap
.meeting2-editor-source {
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: $spacing-md $spacing-lg;
  border: none;
  outline: none;
  background: #fff;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: $color-text-dark;
  resize: none;
  white-space: pre;
  @include custom-scrollbar;
}
```

> 기존 `.meeting2-editor-body` (라인 1220)와 `padding`을 `$spacing-md $spacing-lg`로 동일하게 맞춰 모드 전환 시 본문 위치 점프 방지.

- [ ] **Step 2: 시각 확인**

dev 서버에서:
- 소스 모드 진입 → textarea가 monospace 폰트로 보이고, 긴 줄은 가로 스크롤
- 모드 전환 시 본문 위치/패딩 변동 없음

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add assets/styles/page/_meeting2.scss
git commit -m "$(cat <<'EOF'
style(meeting): HTML 소스 textarea 스타일 추가

1. .meeting2-editor-source — monospace, 가로 스크롤, padding을 본문과 동일
2. resize: none + white-space: pre
EOF
)"
```

---

## Task 8: `LibraryReportEditor.vue` — composable 호출 + 토글 버튼 + textarea 분기

**목표**: Library 단일 컴포넌트에서 Meeting과 동일한 토글 동작 구현.

**Files:**
- Modify: `components/library/LibraryReportEditor.vue`

- [ ] **Step 1: composable import + 호출**

`<script setup lang="ts">` 상단 import 블록 끝에 추가:

```ts
import { useEditorSourceView } from '~/composables/com/useEditorSourceView'
```

`editor`(`useEditor({...})` 결과) 정의 직후, 기존 `watch(() => html.value, ...)` 위에 다음 한 줄 추가:

```ts
const { isSourceView, sourceHtml, toggleSourceView } = useEditorSourceView(editor)
```

> Library는 회의 전환 같은 외부 트리거가 없으므로 `exitSourceView`는 사용 안 함 (구조분해에서 생략).

- [ ] **Step 2: 표 floating bubble에 소스 모드 가드 추가**

기존 `updateTableBubble` 함수 진입부:

```ts
const updateTableBubble = () => {
  if (!editor.value || !editor.value.isActive('table')) {
    showTableBubble.value = false
    return
  }
  // ... 이하 기존
}
```

함수 진입부에 한 줄 추가:

```ts
const updateTableBubble = () => {
  if (isSourceView.value) {
    showTableBubble.value = false
    return
  }
  if (!editor.value || !editor.value.isActive('table')) {
    showTableBubble.value = false
    return
  }
  // ... 이하 기존
}
```

- [ ] **Step 3: 툴바에 HTML 토글 버튼 추가**

기존 redo 버튼 (`<button ... @click="run((c) => c.redo())">↷</button>`) 직후, 툴바 닫기 `</div>` 이전에 다음 삽입:

```vue
<span class="library-report-editor-toolbar-divider" />

<button
  class="library-report-editor-toolbar-btn"
  :class="{ 'is-active': isSourceView }"
  title="HTML 소스 보기"
  @click="toggleSourceView"
>
  <i class="icon-code size-16" />
</button>
```

- [ ] **Step 4: 본문 영역에 textarea 분기 추가**

기존:

```vue
<div class="library-report-editor-relative">
  <div class="library-report-editor-scroll">
    <EditorContent :editor="editor" />
  </div>
  <!-- 표 floating 툴바 ... -->
</div>
```

아래로 교체 (scroll 내부만 변경):

```vue
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
  <!-- 표 floating 툴바 ... 그대로 -->
</div>
```

- [ ] **Step 5: textarea 스타일 추가 (`<style lang="scss" scoped>` 내부)**

`.library-report-editor-scroll { ... }` 닫기(라인 1021 부근) 직후에 추가:

```scss
// HTML 소스 보기 textarea
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
  white-space: pre;
  @include custom-scrollbar(4px);
}
```

> Library는 본문 padding이 `$spacing-md` 단일값이라 textarea도 동일하게 맞춤 (`:deep(.library-report-editor-body) { padding: $spacing-md }`와 일치).

- [ ] **Step 6: 시각 확인**

dev 서버에서 Library 보고서 편집 화면 진입 (예: 라이브러리 → 보고서 카드 → 편집):
- 툴바 우측 끝 `↶ ↷` 다음에 `〈/〉` 버튼 보임
- 클릭 → textarea 모드, 다시 클릭 → WYSIWYG 복귀
- textarea 편집 후 복귀 시 부모(html v-model)에 변경 반영됨
- 표 안에서 소스 모드 진입 시 floating bubble 숨김

- [ ] **Step 7: 커밋 (사용자 승인 후)**

```bash
git add components/library/LibraryReportEditor.vue
git commit -m "$(cat <<'EOF'
feat(library): 보고서 에디터에 HTML 소스 보기 토글 추가

1. useEditorSourceView 호출 — Meeting과 동일 모델
2. Toolbar에 icon-code 토글 버튼 (undo/redo 우측)
3. EditorContent v-show + textarea v-if 분기
4. 표 floating bubble 소스 모드 가드
5. .library-report-editor-source 스타일 추가 (monospace + 가로 스크롤)
EOF
)"
```

---

## Task 9: 통합 검증 (수동 QA)

**목표**: 전체 시나리오를 사용자가 한 번 더 검증. 각 항목을 dev 서버에서 직접 테스트.

**Files:** (수정 없음 — 검증만)

- [ ] **Step 1: Meeting 시나리오**

1. `/meeting/<id>` 진입 → 회의록 자동 생성된 본문이 WYSIWYG로 표시
2. `〈/〉` 버튼 클릭 → 본문이 HTML 텍스트(textarea)로 전환, 버튼 active
3. textarea에서 HTML 수정 (예: `<p>테스트</p>` 추가) → 800ms 동안 자동 저장 미발화 확인 (네트워크 탭)
4. `〈/〉` 다시 클릭 → WYSIWYG로 복귀, 추가한 `<p>테스트</p>`가 화면에 반영
5. 800ms 후 자동 저장 1회 발화 (PUT 요청 확인)
6. 소스 모드 상태에서 "저장하기" 버튼 클릭 → textarea 내용 기준으로 즉시 저장 (성공 토스트)
7. 다른 회의 선택 → 소스 모드 자동 해제, 새 회의의 WYSIWYG 표시
8. 표 안에 커서 두고 `〈/〉` 클릭 → 표 floating bubble 사라짐, textarea로 전환

- [ ] **Step 2: Library 시나리오**

1. 라이브러리에서 보고서 편집 화면 진입 → WYSIWYG 표시
2. `〈/〉` 클릭 → textarea, 다시 클릭 → WYSIWYG 복귀
3. textarea에서 수정 후 복귀 시 부모(`html` v-model) 변경 사항 반영 (저장/미리보기에 반영되는지)
4. 표 floating bubble 소스 모드에서 숨김

- [ ] **Step 3: 엣지 케이스**

1. 잘못된 HTML(예: `<p>닫기 누락` `<div>` 미스매치)을 textarea에 넣고 토글 → Tiptap이 schema에 맞게 자동 정리. 데이터 손실은 paste 동작과 동일 수준 (의도된 동작)
2. 빈 textarea로 토글 → WYSIWYG가 빈 단락(placeholder)으로 표시
3. 이미지가 들어간 본문 → 소스 모드에서 `<img src="data:..."` base64 그대로 보임 (수정해도 동작 OK)

- [ ] **Step 4: 검증 완료 후**

문제 없으면 다음 단계 (PR 생성 등). 문제 발견 시 해당 Task로 돌아가 수정 후 재검증.

> 이 task는 별도 커밋 없음. 검증 결과 문제가 있으면 해당 Task의 fix-up 커밋을 추가.

---

## 검증 체크리스트 (최종)

Spec(`docs/superpowers/specs/2026-05-08-editor-html-source-view-design.md`)의 R1~R9 매핑:

| Req | 구현 위치 |
|-----|-----------|
| R1 — 툴바 토글 아이콘 | Task 6 (Meeting), Task 8 (Library) |
| R2 — 본문 ↔ textarea 전환 | Task 5 (Meeting), Task 8 (Library) |
| R3 — textarea 편집 가능 | Task 5/8 (`v-model="sourceHtml"`) |
| R4 — 회의 + 라이브러리 모두 | Task 4~7 (Meeting), Task 8 (Library) |
| R5 — 복귀 시점에 sync | Task 2 (composable의 `setContent(emitUpdate: true)`) |
| R6 — 자동 저장 정지 후 1회 | Task 2 + Task 4 (Panel은 onUpdate 의존) |
| R7 — 저장하기 버튼 동작 | Task 4 Step 3 (`onSaveMeetingClick` 분기) |
| R8 — 회의 변경 시 해제 | Task 4 Step 4 (`exitSourceView`) |
| R9 — 표 bubble 숨김 | Task 4 Step 6 (Meeting), Task 8 Step 2 (Library) |

---

## 비고

- 백엔드 API 변경 없음 — 저장되는 콘텐츠는 동일한 HTML 문자열
- HTML syntax highlighting은 MVP 범위에서 제외 (plain textarea)
- composable은 향후 다른 Tiptap 기반 에디터(채팅/메모 등)에서도 동일하게 재사용 가능

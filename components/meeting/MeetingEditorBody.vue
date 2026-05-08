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

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { meetingEditorKey, meetingSourceViewKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
const sourceView = inject(meetingSourceViewKey)
</script>

<style lang="scss" scoped>
// LibraryReportEditor의 보고서 2열 표 스타일을 회의록 에디터에도 동일 적용
::deep(.meeting2-editor-body) {
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    border: 1px solid #e2e8f0;
    border-radius: $border-radius-base;
    margin: 0 0 $spacing-sm;

    th {
      width: 20%;
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

    th p,
    td p {
      margin: 0 0 6px;
      font-size: inherit;
      line-height: inherit;

      &:last-child {
        margin-bottom: 0;
      }
    }

    th.selectedCell::after,
    td.selectedCell::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(var(--color-primary-rgb), 0.1);
      pointer-events: none;
    }

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

  ul {
    list-style: disc outside;
    margin: 0 0 $spacing-sm;
    padding-left: 1.4em;

    li {
      margin-bottom: 2px;
    }
  }

  ol {
    list-style: decimal outside;
    margin: 0 0 $spacing-sm;
    padding-left: 1.4em;

    li {
      margin-bottom: 2px;
    }
  }

  blockquote {
    margin: 0 0 $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    border-left: 3px solid var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.04);
    font-style: italic;
  }
}
</style>

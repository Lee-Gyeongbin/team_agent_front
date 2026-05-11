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


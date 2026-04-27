<template>
  <div class="meeting-editor-scroll">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { meetingEditorKey } from '~/composables/meeting/meetingEditorKey'

const editor = inject(meetingEditorKey)
</script>

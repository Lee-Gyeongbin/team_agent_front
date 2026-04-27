import type { InjectionKey, ShallowRef } from 'vue'
import type { Editor } from '@tiptap/vue-3'

/** Tiptap Editor 인스턴스 — MeetingEditorPanel에서 provide, Toolbar/Body에서 inject */
export const meetingEditorKey: InjectionKey<ShallowRef<Editor | undefined>> = Symbol('meetingEditor')

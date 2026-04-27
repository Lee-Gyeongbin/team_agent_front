import type { InjectionKey, ShallowRef } from 'vue'
import type { Editor } from '@tiptap/vue-3'

/** Tiptap Editor 인스턴스 — LibraryReportEditor에서 provide, 서브컴포넌트에서 inject */
export const libraryReportEditorKey: InjectionKey<ShallowRef<Editor | undefined>> =
  Symbol('libraryReportEditor')

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

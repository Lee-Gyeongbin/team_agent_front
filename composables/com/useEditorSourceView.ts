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

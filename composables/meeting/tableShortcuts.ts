import { Extension } from '@tiptap/core'

/**
 * 표 관련 키보드 단축키
 * - Mod+Backspace / Mod+Delete: 표 안에서 누르면 표 전체 삭제
 *   (Backspace 단독은 셀 안 텍스트만 지움 — Tiptap 기본)
 */
export const TableShortcuts = Extension.create({
  name: 'tableShortcuts',
  addKeyboardShortcuts() {
    const deleteIfInTable = () => {
      if (!this.editor.isActive('table')) return false
      return this.editor.chain().focus().deleteTable().run()
    }
    return {
      'Mod-Backspace': deleteIfInTable,
      'Mod-Delete': deleteIfInTable,
    }
  },
})

import type { Editor } from '@tiptap/vue-3'
import type { Ref } from 'vue'

/** void(self-closing) 태그 — 종료 태그 없이 depth 증가 안 시킴 */
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'area', 'base', 'embed', 'source', 'track', 'wbr'])

/**
 * HTML 문자열을 사람이 읽기 좋은 형태로 정리
 * - 태그/텍스트 단위로 토큰화
 * - 열림/닫힘 태그에 따라 depth 들여쓰기 (2칸)
 * - 빈 텍스트(공백/개행만)는 제거
 * - base64 등 긴 속성값은 한 줄로 그대로 유지 (속성 내부는 건드리지 않음)
 */
const prettyFormatHtml = (html: string): string => {
  if (!html) return ''

  const tokens: string[] = []
  let i = 0
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i)
      if (end === -1) {
        tokens.push(html.slice(i))
        break
      }
      tokens.push(html.slice(i, end + 1))
      i = end + 1
    } else {
      const next = html.indexOf('<', i)
      if (next === -1) {
        tokens.push(html.slice(i))
        break
      }
      tokens.push(html.slice(i, next))
      i = next
    }
  }

  let depth = 0
  const lines: string[] = []
  const indent = (n: number) => '  '.repeat(Math.max(0, n))

  for (const token of tokens) {
    const isTag = token.startsWith('<')
    if (!isTag) {
      const trimmed = token.replace(/\s+/g, ' ').trim()
      if (trimmed) lines.push(indent(depth) + trimmed)
      continue
    }

    const isClosing = token.startsWith('</')
    const tagNameMatch = token.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/)
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : ''
    const isSelfClosing = token.endsWith('/>') || VOID_TAGS.has(tagName)
    const isComment = token.startsWith('<!--')
    const isDoctype = token.startsWith('<!')

    if (isClosing) {
      depth = Math.max(0, depth - 1)
      lines.push(indent(depth) + token)
    } else {
      lines.push(indent(depth) + token)
      if (!isSelfClosing && !isComment && !isDoctype) depth++
    }
  }

  return lines.join('\n')
}

/**
 * Tiptap 에디터 — HTML 소스 보기 토글 composable
 *
 * - WYSIWYG 모드 ↔ HTML textarea 모드 전환
 * - 모드 진입 시 pretty-print으로 가독성 향상 (base64는 그대로 유지)
 * - 모드 복귀 시점에만 setContent(emitUpdate: true)로 외부 sync (자동 저장 / 부모 emit)
 * - textarea 편집 중에는 sourceHtml만 변경되고 에디터 본체는 손대지 않음
 */
export const useEditorSourceView = (editor: Ref<Editor | undefined>) => {
  const isSourceView = ref(false)
  const sourceHtml = ref('')

  const toggleSourceView = () => {
    if (!editor.value) return
    if (!isSourceView.value) {
      // WYSIWYG → Source (pretty-print)
      sourceHtml.value = prettyFormatHtml(editor.value.getHTML())
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
